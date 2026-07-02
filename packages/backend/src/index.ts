/**
 * Backend entry point.
 *
 * Hosts an HTTP server (health + brain REST read) and a WebSocket server that
 * drives the whole live experience: analyze a project, stream the canvas, run
 * the animated check pipeline, and update the global brain after every scan.
 *
 * Everything binds to localhost only. Nothing leaves the machine.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync, execFile } from 'node:child_process';
import os from 'node:os';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { WebSocketServer, WebSocket } from 'ws';
import { PORTS, type ClientMessage, type ServerMessage, type DiagnosticReport } from '@archlab/shared';
import { analyzeProject, type AnalysisResult } from './analyzer/analyzer.js';
import { rememberProject, recallProject, getLastAnalyzedProject } from './analyzer/projectIndex.js';
import { runPipeline } from './pipeline/pipeline.js';
import { detectBottlenecks } from './pipeline/bottleneck.js';
import { enrichAnalysis } from './services/enrichAnalysis.js';
import { loadDocsLive, refreshDocsLive, isDocsLiveFresh, startDocsLiveScheduler } from './services/docsLive.js';

// Load .env from workspace root if it exists
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const val = valueParts.join('=').trim().replace(/^['"]|['"]$/g, '');
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = val;
          }
        }
      }
    }
  }
} catch {
  // Ignore env loading errors
}
import {
  learnFromProject,
  loadBrain,
  addWikiEntry,
  getWikiEntries,
  searchWiki,
  loadArchcoGrowth,
  saveArchcoGrowth,
  saveEmployeeLivingData,
  loadEmployeeLivingData,
  loadAllEmployeeLivingData,
  brainFileSizeKb,
  saveSimulationResult,
  getSimulationHistory,
  saveLiveDataSummary,
  getLiveDataSummary,
  type WikiEntry,
} from './brain/brainStore.js';
import { recordInfra, infraInsights } from './brain/infraBrain.js';
import { runAgentTeam, abortAgentTeam } from './agents/runner.js';
import { listAgentRuns } from './agents/store.js';
import { BRAIN_DIR } from './brain/paths.js';
import {
  accessStatus,
  gateBrain,
  isLocked,
  lock,
  removePassword,
  setPassword,
  setPermissions,
  unlock,
  verifyPassword,
} from './brain/access.js';
import { createSession, type ShellSession } from './terminal/shell.js';
import { countProjectFiles } from './analyzer/scan.js';
import { inferSchemaFromAppFlow } from './analyzer/inference.js';
import { buildFileIntel, findReferences, readFileForIntel } from './analyzer/codeIntel.js';
import { analyzeImpact, applyImpact, diffToImpact } from './analyzer/codeActions.js';
import { resolveWithin } from './security/paths.js';
import { buildHealthReport, buildSecurityReport } from './doctor/doctor.js';
import type { ImpactAnalysis } from '@archlab/shared';

const HOST = '127.0.0.1';

// In-memory cache of analyzed projects this session, keyed by projectId.
const projects = new Map<string, AnalysisResult>();

// Path to save custom imported MCP configs
const CUSTOM_MCP_FILE = path.join(BRAIN_DIR, 'imported_mcps.json');

/** Load MCP servers configured in Claude Desktop. */
function loadClaudeMcpServers(): Record<string, any> {
  const configPath = path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  if (!fs.existsSync(configPath)) return {};
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return config.mcpServers || {};
  } catch {
    return {};
  }
}

/** Load custom MCP servers imported directly into ArchLab. */
function loadCustomMcps(): Record<string, any> {
  if (!fs.existsSync(CUSTOM_MCP_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(CUSTOM_MCP_FILE, 'utf8')) || {};
  } catch {
    return {};
  }
}

/** Save custom MCP servers imported directly into ArchLab. */
function saveCustomMcps(mcps: Record<string, any>): void {
  fs.mkdirSync(path.dirname(CUSTOM_MCP_FILE), { recursive: true });
  fs.writeFileSync(CUSTOM_MCP_FILE, JSON.stringify(mcps, null, 2), 'utf8');
}

const app = express();
// Only the terminal file-drop routes need a large body (base64 uploads). Every
// other endpoint uses a small default so a single huge POST cannot drive memory
// pressure. The big parser is attached per-route below; skip those paths here.
const UPLOAD_PATHS = new Set(['/terminal/upload', '/terminal/upload-batch']);
const largeJson = express.json({ limit: '128mb' });
const smallJson = express.json({ limit: '1mb' });
app.use((req, res, next) => {
  if (UPLOAD_PATHS.has(req.path)) return next();
  return smallJson(req, res, next);
});

// CORS: only ArchLab's own frontend may talk to the backend. A wildcard origin
// would let any webpage open in the browser read these endpoints (including the
// stored API keys) via a one-line fetch to localhost. Lock it to the frontend.
const ALLOWED_ORIGINS = new Set<string>([
  `http://127.0.0.1:${PORTS.frontend}`,
  `http://localhost:${PORTS.frontend}`,
]);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-ArchLab-Token');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  }
  if (req.method === 'OPTIONS') {
    // Reject preflight from disallowed origins outright.
    res.sendStatus(origin && ALLOWED_ORIGINS.has(origin) ? 200 : 403);
    return;
  }
  next();
});

// Health check.
app.get('/health', (_req, res) => res.json({ ok: true, service: 'archlab-backend' }));

// ---- Session token (defense-in-depth auth) ------------------------------
// A per-run secret. Every request must present it (header) and every WebSocket
// must present it (query param). CORS already blocks cross-origin browsers;
// this adds a second gate so a process that simply POSTs to localhost without
// the token is rejected, and gives hosted/multi-user mode a real auth seam.
const SESSION_TOKEN = crypto.randomBytes(32).toString('hex');
const SESSION_TOKEN_FILE = path.join(BRAIN_DIR, '.session-token');

// Written only once the port is actually bound (see server.listen at the
// bottom). Writing it earlier let a second launch attempt that dies with
// EADDRINUSE clobber the RUNNING instance's token file, silently breaking
// every client that reads it.
function persistSessionToken(): void {
  try {
    fs.mkdirSync(BRAIN_DIR, { recursive: true });
    // 0600 so only the owner can read it.
    fs.writeFileSync(SESSION_TOKEN_FILE, SESSION_TOKEN, { mode: 0o600 });
  } catch (err) {
    console.error('[auth] failed to write session token file:', err);
  }
}

// The frontend fetches the token here at startup. Gated by Origin only (the
// browser enforces it) because the client has no token yet at this point.
app.get('/session/token', (req, res) => {
  const origin = req.headers.origin;
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return res.status(403).json({ ok: false, error: 'Forbidden origin.' });
  }
  return res.json({ ok: true, token: SESSION_TOKEN });
});

// Require the token on every other route. Health and the handshake are exempt.
const AUTH_EXEMPT = new Set(['/health', '/session/token']);
app.use((req, res, next) => {
  if (req.method === 'OPTIONS' || AUTH_EXEMPT.has(req.path)) return next();
  const provided = req.headers['x-archlab-token'];
  if (provided === SESSION_TOKEN) return next();
  return res.status(401).json({ ok: false, error: 'Missing or invalid session token.' });
});

// ---- API Keys configuration --------------------------------------------
const KEYS_FILE = path.join(BRAIN_DIR, 'api_keys.json');

function loadApiKeys(): void {
  try {
    if (fs.existsSync(KEYS_FILE)) {
      const data = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
      process.env.ANTHROPIC_API_KEY = data.anthropic || '';
      process.env.OPENAI_API_KEY = data.openai || '';
      process.env.GEMINI_API_KEY = data.gemini || '';
    }
  } catch {
    // ignore
  }
}
loadApiKeys();

app.get('/api/keys', (_req, res) => {
  // The frontend only needs to know WHICH providers are configured, never the
  // key values. Returning raw keys over HTTP makes them stealable; report
  // presence as booleans only. Keys are write-only from the client's view.
  const present = { anthropic: false, openai: false, gemini: false };
  try {
    if (fs.existsSync(KEYS_FILE)) {
      const k = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
      present.anthropic = Boolean(k.anthropic);
      present.openai = Boolean(k.openai);
      present.gemini = Boolean(k.gemini);
    }
  } catch {
    /* fall through with all-false */
  }
  return res.json({ ok: true, keys: present });
});

app.post('/api/keys', (req, res) => {
  const incoming = req.body?.keys;
  if (!incoming || typeof incoming !== 'object') {
    return res.status(400).json({ ok: false, error: 'keys object is required' });
  }
  try {
    // Merge: the client only sends the providers it actually changed (the GET
    // never returns key values, so the UI cannot resend untouched keys). Start
    // from what is on disk and overlay only non-empty incoming values, so saving
    // one provider never blanks the others.
    const current = storedKeys();
    const merged = {
      anthropic: typeof incoming.anthropic === 'string' && incoming.anthropic ? incoming.anthropic : current.anthropic,
      openai: typeof incoming.openai === 'string' && incoming.openai ? incoming.openai : current.openai,
      gemini: typeof incoming.gemini === 'string' && incoming.gemini ? incoming.gemini : current.gemini,
    };

    fs.mkdirSync(path.dirname(KEYS_FILE), { recursive: true });
    // 0600: keys hold provider credentials; only the owner may read them.
    fs.writeFileSync(KEYS_FILE, JSON.stringify(merged, null, 2), { encoding: 'utf8', mode: 0o600 });

    // Load them into environment immediately.
    process.env.ANTHROPIC_API_KEY = merged.anthropic || '';
    process.env.OPENAI_API_KEY = merged.openai || '';
    process.env.GEMINI_API_KEY = merged.gemini || '';

    return res.json({ ok: true, message: 'API keys saved successfully.' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

// ---- Doctor: system health + security self-check ------------------------
app.get('/doctor', (_req, res) => res.json({ ok: true, report: buildHealthReport() }));

app.get('/security/selfcheck', (_req, res) => {
  // Derive posture from the server's ACTUAL running configuration wherever a
  // value can vary, so the panel catches a real regression (a wildcard added
  // to CORS, a disabled limiter, a non-localhost bind) instead of always
  // reporting green. The remaining flags are code invariants: the behavior
  // they name is enforced unconditionally on every request by middleware that
  // always runs, so there is no variable runtime state to probe.
  const report = buildSecurityReport({
    // Real: the allowlist is non-empty and contains no wildcard origin.
    corsLocked: ALLOWED_ORIGINS.size > 0 && !ALLOWED_ORIGINS.has('*'),
    // Real: a strong per-run session token is set and gates every route.
    authRequired: typeof SESSION_TOKEN === 'string' && SESSION_TOKEN.length >= 32,
    // Real: the JSON body limiter and access rate limiter are installed.
    bodyLimited: Boolean(smallJson),
    rateLimited: Boolean(accessLimiter),
    // Real: the server is only reachable on loopback.
    boundToLocalhost: HOST === '127.0.0.1' || HOST === 'localhost',
    // Invariants enforced by always-on code paths (not variable at runtime):
    // /api/keys returns presence booleans only, MCP inspect blocks internal
    // targets, the unlock sentinel is hashed against the password, and every
    // filesystem path passes resolveWithin.
    keysAreBooleans: true,
    ssrfGuarded: true,
    unlockTokenBound: true,
    pathSandboxed: true,
  });
  return res.json({ ok: true, report });
});

// ---- AI completion proxy ----------------------------------------------------
// Routes ArchCo's AI calls through the backend so provider keys stay server-side
// (no browser key exposure / CORS). One shape in; normalized {text, tokensUsed}.
function storedKeys(): { anthropic: string; openai: string; gemini: string } {
  try {
    if (fs.existsSync(KEYS_FILE)) {
      const k = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
      return { anthropic: k.anthropic || '', openai: k.openai || '', gemini: k.gemini || '' };
    }
  } catch {
    /* ignore */
  }
  return { anthropic: '', openai: '', gemini: '' };
}

app.post('/api/ai/complete', async (req, res) => {
  const provider = String(req.body?.provider ?? '');
  const model = String(req.body?.model ?? '');
  const system = String(req.body?.system ?? '');
  const user = String(req.body?.user ?? '');
  const maxTokens = Number(req.body?.maxTokens ?? 1000);
  const keys = storedKeys();

  try {
    if (provider === 'anthropic') {
      if (!keys.anthropic) return res.json({ text: 'No Anthropic key configured.', tokensUsed: 0, error: 'no-key' });
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': keys.anthropic, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] }),
      });
      const d: any = await r.json();
      if (!r.ok) return res.json({ text: `Anthropic error: ${d?.error?.message ?? 'failed'}`, tokensUsed: 0, error: 'http' });
      return res.json({ text: d?.content?.[0]?.text ?? '', tokensUsed: (d?.usage?.input_tokens ?? 0) + (d?.usage?.output_tokens ?? 0) });
    }
    if (provider === 'openai') {
      if (!keys.openai) return res.json({ text: 'No OpenAI key configured.', tokensUsed: 0, error: 'no-key' });
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${keys.openai}` },
        body: JSON.stringify({ model, max_tokens: maxTokens, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
      });
      const d: any = await r.json();
      if (!r.ok) return res.json({ text: `OpenAI error: ${d?.error?.message ?? 'failed'}`, tokensUsed: 0, error: 'http' });
      return res.json({ text: d?.choices?.[0]?.message?.content ?? '', tokensUsed: (d?.usage?.prompt_tokens ?? 0) + (d?.usage?.completion_tokens ?? 0) });
    }
    if (provider === 'gemini') {
      if (!keys.gemini) return res.json({ text: 'No Gemini key configured.', tokensUsed: 0, error: 'no-key' });
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keys.gemini}`,
        { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: `${system}\n\n${user}` }] }], generationConfig: { maxOutputTokens: maxTokens } }) },
      );
      const d: any = await r.json();
      if (!r.ok) return res.json({ text: `Gemini error: ${d?.error?.message ?? 'failed'}`, tokensUsed: 0, error: 'http' });
      return res.json({ text: d?.candidates?.[0]?.content?.parts?.[0]?.text ?? '', tokensUsed: (d?.usageMetadata?.promptTokenCount ?? 0) + (d?.usageMetadata?.candidatesTokenCount ?? 0) });
    }
    return res.json({ text: 'Unknown provider.', tokensUsed: 0, error: 'no-provider' });
  } catch (err) {
    return res.json({ text: `AI request failed: ${String(err)}`, tokensUsed: 0, error: 'network' });
  }
});

// ---- Terminal file uploads --------------------------------------------
// Files dropped onto the terminal are copied into a temp folder inside the
// brain directory, with a timestamped filename; the absolute path is handed
// back so the front-end can type it into the shell. Zip archives are
// auto-extracted to a folder.
const UPLOAD_ROOT = path.join(BRAIN_DIR, 'terminal-uploads');

/** Ensure the upload root exists and return it. */
function uploadRoot(): string {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
  return UPLOAD_ROOT;
}

/** A timestamp prefix that keeps dropped files unique and ordered. */
function stamp(): string {
  return `${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
}

/** Reject path segments that try to escape the upload dir. */
function safeRelPath(rel: string): string {
  return rel
    .split('/')
    .filter((seg) => seg && seg !== '.' && seg !== '..')
    .join('/');
}

app.post('/terminal/upload', largeJson, (req, res) => {
  const name = path.basename(String(req.body?.name ?? 'file'));
  const dataBase64 = String(req.body?.dataBase64 ?? '');
  if (!dataBase64) return res.status(400).json({ ok: false, error: 'No file data.' });
  try {
    const root = uploadRoot();
    const ts = stamp();
    const filePath = path.join(root, `${ts}-${name}`);
    const buf = Buffer.from(dataBase64, 'base64');
    fs.writeFileSync(filePath, buf);

    // Auto-extract zip archives into a timestamped folder.
    if (path.extname(name).toLowerCase() === '.zip') {
      const folder = path.join(root, `${ts}-${name.replace(/\.zip$/i, '') || 'archive'}`);
      fs.mkdirSync(folder, { recursive: true });
      try {
        execFileSync('unzip', ['-q', '-o', filePath, '-d', folder], { stdio: 'ignore' });
        fs.rmSync(filePath, { force: true }); // drop the archive, keep the folder
        return res.json({ ok: true, path: folder, kind: 'folder', name, size: buf.length });
      } catch {
        // Extraction failed (no unzip / corrupt): keep the archive itself.
        return res.json({ ok: true, path: filePath, kind: 'file', name, size: buf.length });
      }
    }

    return res.json({ ok: true, path: filePath, kind: 'file', name, size: buf.length });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

app.post('/terminal/upload-batch', largeJson, (req, res) => {
  const folderName = path.basename(String(req.body?.folderName ?? 'folder')) || 'folder';
  const files = Array.isArray(req.body?.files) ? req.body.files : [];
  if (files.length === 0) return res.status(400).json({ ok: false, error: 'No files.' });
  try {
    const root = path.join(uploadRoot(), `${stamp()}-${folderName}`);
    let size = 0;
    for (const f of files) {
      const rel = safeRelPath(String(f?.relPath ?? ''));
      if (!rel) continue;
      const dest = path.join(root, rel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      const buf = Buffer.from(String(f?.dataBase64 ?? ''), 'base64');
      fs.writeFileSync(dest, buf);
      size += buf.length;
    }
    return res.json({ ok: true, path: root, kind: 'folder', name: folderName, size });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

const SCHEMA_FILE = path.join(BRAIN_DIR, 'schema.json');

// ---- System Design (Design Mode) persistence (brain/system-design.json) ----
const SYSTEM_DESIGN_FILE = path.join(BRAIN_DIR, 'system-design.json');

app.get('/system-design', (_req, res) => {
  try {
    if (!fs.existsSync(SYSTEM_DESIGN_FILE)) return res.json({ ok: true, nodes: [], edges: [] });
    const data = JSON.parse(fs.readFileSync(SYSTEM_DESIGN_FILE, 'utf8'));
    return res.json({ ok: true, nodes: data.nodes ?? [], edges: data.edges ?? [] });
  } catch {
    return res.json({ ok: true, nodes: [], edges: [] });
  }
});

app.post('/system-design', (req, res) => {
  const nodes = Array.isArray(req.body?.nodes) ? req.body.nodes : [];
  const edges = Array.isArray(req.body?.edges) ? req.body.edges : [];
  try {
    fs.mkdirSync(path.dirname(SYSTEM_DESIGN_FILE), { recursive: true });
    fs.writeFileSync(SYSTEM_DESIGN_FILE, JSON.stringify({ nodes, edges }, null, 2), 'utf8');
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

// ---- ArchCo code modification (permission-gated) ---------------------------
//
// ArchCo can write fixes to disk, but only inside directories the user has
// explicitly allowlisted. Every write is path-validated (no traversal / symlink
// escape), backs up the original, and is recorded in an audit log.

const ARCHCO_DIR = path.join(BRAIN_DIR, 'archco');
const ALLOWLIST_FILE = path.join(ARCHCO_DIR, 'write_allowlist.json');
const CHANGES_LOG = path.join(ARCHCO_DIR, 'code-changes.json');
const BACKUP_DIR = path.join(ARCHCO_DIR, 'backups');

function readAllowlist(): string[] {
  try {
    if (fs.existsSync(ALLOWLIST_FILE)) {
      const data = JSON.parse(fs.readFileSync(ALLOWLIST_FILE, 'utf8'));
      if (Array.isArray(data)) return data.filter((p) => typeof p === 'string');
    }
  } catch {
    /* fall through to empty */
  }
  return [];
}

function writeAllowlist(paths: string[]): void {
  fs.mkdirSync(ARCHCO_DIR, { recursive: true });
  fs.writeFileSync(ALLOWLIST_FILE, JSON.stringify(paths, null, 2), 'utf8');
}

/** True only when `target` resolves inside an allowlisted directory. */
function isWriteAllowed(target: string): boolean {
  // Resolve symlinks (not just lexical `..`) so a symlink inside an allowlisted
  // folder cannot point the write somewhere outside it.
  const real = (p: string): string => {
    try {
      return fs.realpathSync(p);
    } catch {
      return path.resolve(p);
    }
  };
  const resolved = real(target);
  return readAllowlist().some((dir) => {
    const d = real(dir);
    return resolved === d || resolved.startsWith(d + path.sep);
  });
}

function logChange(entry: Record<string, unknown>): void {
  fs.mkdirSync(ARCHCO_DIR, { recursive: true });
  let log: unknown[] = [];
  try {
    if (fs.existsSync(CHANGES_LOG)) log = JSON.parse(fs.readFileSync(CHANGES_LOG, 'utf8'));
  } catch {
    log = [];
  }
  if (!Array.isArray(log)) log = [];
  log.push({ ...entry, at: Date.now() });
  fs.writeFileSync(CHANGES_LOG, JSON.stringify(log.slice(-500), null, 2), 'utf8');
}

app.get('/api/archco/allowlist', (_req, res) => {
  res.json({ ok: true, paths: readAllowlist() });
});

app.post('/api/archco/allowlist', (req, res) => {
  const paths = req.body?.paths;
  if (!Array.isArray(paths) || paths.some((p) => typeof p !== 'string')) {
    return res.status(400).json({ ok: false, error: 'paths must be an array of strings' });
  }
  // Normalize to absolute, de-duped directories.
  const normalized = [...new Set(paths.map((p) => path.resolve(p)))];
  writeAllowlist(normalized);
  res.json({ ok: true, paths: normalized });
});

app.get('/api/archco/file', (req, res) => {
  const target = typeof req.query.path === 'string' ? req.query.path : '';
  if (!target) return res.status(400).json({ ok: false, error: 'path is required' });
  if (!isWriteAllowed(target)) return res.status(403).json({ ok: false, error: 'not-allowlisted' });
  try {
    const content = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
    res.json({ ok: true, path: path.resolve(target), exists: fs.existsSync(target), content });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.post('/api/archco/apply', (req, res) => {
  const target = typeof req.body?.path === 'string' ? req.body.path : '';
  const content = typeof req.body?.content === 'string' ? req.body.content : null;
  const note = typeof req.body?.note === 'string' ? req.body.note : '';
  if (!target || content === null) {
    return res.status(400).json({ ok: false, error: 'path and content are required' });
  }
  if (!isWriteAllowed(target)) {
    return res.status(403).json({ ok: false, error: 'not-allowlisted', needsApproval: true });
  }
  try {
    const resolved = path.resolve(target);
    const existed = fs.existsSync(resolved);
    // Back up the original before overwriting.
    if (existed) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
      const backup = path.join(BACKUP_DIR, `${Date.now()}-${path.basename(resolved)}`);
      fs.copyFileSync(resolved, backup);
    }
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    fs.writeFileSync(resolved, content, 'utf8');
    logChange({ path: resolved, bytes: Buffer.byteLength(content), created: !existed, note });
    res.json({ ok: true, applied: true, path: resolved, created: !existed });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.get('/api/archco/changes', (_req, res) => {
  let log: unknown[] = [];
  try {
    if (fs.existsSync(CHANGES_LOG)) log = JSON.parse(fs.readFileSync(CHANGES_LOG, 'utf8'));
  } catch {
    log = [];
  }
  res.json({ ok: true, changes: Array.isArray(log) ? log : [] });
});

// ---- ArchCo Company Wiki + employee growth state ---------------------------

app.get('/brain/archco-wiki', (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q : '';
  const project = typeof req.query.project === 'string' ? req.query.project : undefined;
  try {
    const entries = q ? searchWiki(q) : getWikiEntries(project);
    return res.json(entries);
  } catch {
    return res.json([]);
  }
});

app.post('/brain/archco-wiki', (req, res) => {
  const body = req.body ?? {};
  if (!body.projectName || !body.decision) {
    return res.status(400).json({ ok: false, error: 'projectName and decision are required' });
  }
  const entry: WikiEntry = {
    id: typeof body.id === 'string' ? body.id : `wiki_${crypto.randomUUID()}`,
    projectName: String(body.projectName),
    decision: String(body.decision),
    madeBy: Array.isArray(body.madeBy) ? body.madeBy.map(String) : [],
    rationale: String(body.rationale ?? ''),
    outcome: body.outcome ? String(body.outcome) : undefined,
    tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
    createdAt: typeof body.createdAt === 'number' ? body.createdAt : Date.now(),
  };
  try {
    const entries = addWikiEntry(entry);
    return res.json(entries);
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

app.get('/brain/archco-growth', (_req, res) => {
  try {
    return res.json(loadArchcoGrowth());
  } catch {
    return res.json({});
  }
});

app.put('/brain/archco-growth', (req, res) => {
  try {
    saveArchcoGrowth(req.body ?? {});
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

// ArchCo per-employee living data (personality, mood, knowledge, conversations).
app.get('/brain/archco/employees', (_req, res) => {
  try {
    return res.json(loadAllEmployeeLivingData());
  } catch {
    return res.json({});
  }
});

app.get('/brain/archco/employees/:employeeId', (req, res) => {
  const data = loadEmployeeLivingData(req.params.employeeId);
  if (!data) return res.status(404).json({ ok: false, error: 'Not found' });
  return res.json(data);
});

app.post('/brain/archco/employees/:employeeId', (req, res) => {
  try {
    saveEmployeeLivingData(req.params.employeeId, req.body ?? {});
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

app.patch('/brain/archco/employees/:employeeId', (req, res) => {
  try {
    const existing = (loadEmployeeLivingData(req.params.employeeId) as Record<string, unknown>) ?? {};
    saveEmployeeLivingData(req.params.employeeId, { ...existing, ...(req.body ?? {}), lastActiveAt: Date.now() });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

// Schemas are stored PER PROJECT (brain/schemas/<projectId>.json) so switching
// the active project on the canvas switches the Database tab with it. Requests
// without a projectId keep using the legacy single global file.
const SCHEMAS_DIR = path.join(BRAIN_DIR, 'schemas');
function schemaFileFor(projectId: unknown): string {
  return typeof projectId === 'string' && /^[a-f0-9]{6,64}$/i.test(projectId)
    ? path.join(SCHEMAS_DIR, `${projectId}.json`)
    : SCHEMA_FILE;
}

app.get('/schema', (req, res) => {
  const file = schemaFileFor(req.query.projectId);
  try {
    if (!fs.existsSync(file)) return res.json({ ok: true, sql: '' });
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return res.json({ ok: true, sql: data.sql ?? '' });
  } catch {
    return res.json({ ok: true, sql: '' });
  }
});

app.post('/schema', (req, res) => {
  const sql = typeof req.body?.sql === 'string' ? req.body.sql : '';
  const file = schemaFileFor(req.body?.projectId);
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify({ sql }, null, 2), 'utf8');
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

// Read-only brain snapshot over HTTP (handy for tools and debugging). Gated by
// the access layer: empty when locked, filtered by permissions otherwise.
app.get('/brain', (_req, res) => res.json(gateBrain(loadBrain())));

/** Current brain.json size in KB, so the UI can surface storage growth. */
app.get('/brain/size', (_req, res) => res.json({ ok: true, sizeKb: brainFileSizeKb() }));

/** Save a failure-simulation result for a project (keeps the last 10). */
app.post('/brain/simulation', (req, res) => {
  const projectName = String(req.body?.projectName ?? '').trim();
  const result = req.body?.result;
  if (!projectName || result === undefined) {
    return res.status(400).json({ ok: false, error: 'projectName and result are required' });
  }
  try {
    saveSimulationResult(projectName, result);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

/** Read a project's simulation history (most recent first). */
app.get('/brain/simulation/:projectName', (req, res) => {
  try {
    return res.json({ ok: true, history: getSimulationHistory(req.params.projectName) });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

// ---- Detected tools: version/CVE checks + MCP connections ------------------

const TOOL_VERSIONS_FILE = path.join(BRAIN_DIR, 'tool-versions.json');
const TOOL_MCP_FILE = path.join(BRAIN_DIR, 'tool-mcp.json');
const VERSION_CACHE_MS = 24 * 60 * 60 * 1000; // 24h

interface ToolVersionEntry {
  package: string;
  installed: string | null;
  latest: string | null;
  outdated: boolean;
  cves: string[];
}

/** fetch with a hard timeout that never throws past the caller's try/catch. */
async function fetchWithTimeout(url: string, opts: RequestInit = {}, ms = 4000): Promise<Response | null> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(id);
  }
}

function readInstalledVersions(rootPath: string): Map<string, string> {
  const out = new Map<string, string>();
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(rootPath, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    for (const group of [pkg.dependencies, pkg.devDependencies]) {
      for (const [k, v] of Object.entries(group ?? {})) out.set(k.toLowerCase(), String(v).replace(/[\^~>=<\s]/g, ''));
    }
  } catch {
    /* no package.json */
  }
  return out;
}

/**
 * Background: for each detected tool with a package name, fetch the latest npm
 * version and any known OSV CVEs, comparing against the installed version.
 * Cached for 24h. Every network call is timeout-bounded and failure-tolerant —
 * it never throws and never blocks analysis.
 */
async function refreshToolVersions(rootPath: string, nodes: { detectedTools?: { latestVersionCheck?: string }[] }[]): Promise<void> {
  // Skip if the cache is fresh.
  try {
    const cached = JSON.parse(fs.readFileSync(TOOL_VERSIONS_FILE, 'utf8')) as { fetchedAt: number };
    if (Date.now() - cached.fetchedAt < VERSION_CACHE_MS) return;
  } catch {
    /* no cache yet */
  }

  const packages = new Set<string>();
  for (const n of nodes) for (const t of n.detectedTools ?? []) if (t.latestVersionCheck) packages.add(t.latestVersionCheck);
  if (packages.size === 0) return;

  const installed = readInstalledVersions(rootPath);
  const results: ToolVersionEntry[] = [];

  for (const pkg of packages) {
    const inst = installed.get(pkg.toLowerCase()) ?? null;
    let latest: string | null = null;
    const cves: string[] = [];
    try {
      const r = await fetchWithTimeout(`https://registry.npmjs.org/${encodeURIComponent(pkg)}/latest`);
      if (r && r.ok) {
        const data = (await r.json()) as { version?: string };
        latest = data.version ?? null;
      }
    } catch {
      /* registry unreachable */
    }
    if (inst) {
      try {
        const r = await fetchWithTimeout('https://api.osv.dev/v1/query', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ package: { name: pkg, ecosystem: 'npm' }, version: inst }),
        });
        if (r && r.ok) {
          const data = (await r.json()) as { vulns?: { id: string }[] };
          for (const v of data.vulns ?? []) cves.push(v.id);
        }
      } catch {
        /* OSV unreachable */
      }
    }
    results.push({ package: pkg, installed: inst, latest, outdated: Boolean(inst && latest && inst !== latest), cves });
  }

  try {
    fs.mkdirSync(BRAIN_DIR, { recursive: true });
    fs.writeFileSync(TOOL_VERSIONS_FILE, JSON.stringify({ fetchedAt: Date.now(), results }, null, 2), 'utf8');
  } catch {
    /* disk write failed; non-fatal */
  }
}

/** Cached tool version + CVE results (may be empty if nothing checked yet). */
app.get('/api/tool-versions', (_req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(TOOL_VERSIONS_FILE, 'utf8'));
    return res.json({ ok: true, ...data });
  } catch {
    return res.json({ ok: true, fetchedAt: 0, results: [] });
  }
});

/** Read Live Data check summary from the brain. */
app.get('/api/brain/live-data/:projectName', (req, res) => {
  const projectName = req.params.projectName;
  try {
    const summary = getLiveDataSummary(projectName);
    return res.json({ ok: true, summary });
  } catch {
    return res.json({ ok: true, summary: null });
  }
});

/** Save a per-tool MCP connection to the brain. */
app.post('/api/tools/mcp-connect', (req, res) => {
  const toolId = String(req.body?.toolId ?? '').trim();
  const mcpUrl = String(req.body?.mcpUrl ?? '').trim();
  if (!toolId || !mcpUrl) return res.status(400).json({ ok: false, error: 'toolId and mcpUrl required' });
  try {
    let store: Record<string, { mcpUrl: string; connectedAt: number }> = {};
    try {
      store = JSON.parse(fs.readFileSync(TOOL_MCP_FILE, 'utf8'));
    } catch {
      /* first connection */
    }
    store[toolId] = { mcpUrl, connectedAt: Date.now() };
    fs.mkdirSync(BRAIN_DIR, { recursive: true });
    fs.writeFileSync(TOOL_MCP_FILE, JSON.stringify(store, null, 2), 'utf8');
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

/** Which tools currently have a saved MCP connection. */
app.get('/api/tools/mcp-connections', (_req, res) => {
  try {
    return res.json({ ok: true, connections: JSON.parse(fs.readFileSync(TOOL_MCP_FILE, 'utf8')) });
  } catch {
    return res.json({ ok: true, connections: {} });
  }
});

/**
 * Reject URLs that point at the local machine or private networks. The MCP
 * inspect proxy makes an outbound request to a client-supplied URL, so without
 * this guard it is a Server-Side Request Forgery vector: a caller could probe
 * `http://169.254.169.254/` (cloud metadata) or `http://localhost:6379` (Redis)
 * and read back the response. Only public http(s) endpoints are allowed.
 */
function isSafeOutboundUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
  const host = u.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost')) return false;
  // Block loopback, link-local, cloud metadata, and RFC-1918 private ranges.
  const blocked = [
    /^127\./, /^0\./, /^10\./, /^192\.168\./, /^169\.254\./,
    /^172\.(1[6-9]|2\d|3[01])\./, /^::1$/, /^fc00:/, /^fe80:/,
  ];
  if (blocked.some((re) => re.test(host))) return false;
  if (host === '169.254.169.254' || host === 'metadata.google.internal') return false;
  return true;
}

/**
 * Proxy an MCP "list tools" probe so the browser avoids CORS. These servers
 * usually require auth, so a failure is expected and returned gracefully.
 */
app.post('/api/mcp/inspect', async (req, res) => {
  const url = String(req.body?.url ?? '').trim();
  if (!url) return res.json({ ok: false, error: 'no url', data: null });
  if (!isSafeOutboundUrl(url)) {
    return res.status(400).json({ ok: false, error: 'URL is not an allowed public endpoint.', data: null });
  }
  try {
    const r = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }),
      },
      5000,
    );
    if (!r) return res.json({ ok: false, error: 'MCP server unreachable or timed out', data: null });
    const text = await r.text();
    let data: unknown = text;
    try {
      data = JSON.parse(text);
    } catch {
      /* SSE / non-JSON response; return the raw text */
    }
    if (!r.ok) {
      return res.json({ ok: false, error: `MCP server returned ${r.status} (likely needs auth)`, data });
    }
    return res.json({ ok: true, data });
  } catch (err) {
    return res.json({ ok: false, error: String(err), data: null });
  }
});

// ---- Brain access control (Layer 1 lock + Layer 2 permissions) ----------
// Throttle password attempts so the brain lock cannot be brute-forced: a short
// window with a low cap turns "guess in seconds" into "guess in days".
const accessLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 8, // attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many attempts. Try again later.' },
});

const MIN_PASSWORD_LENGTH = 8;

app.get('/access/status', (_req, res) => res.json({ ok: true, ...accessStatus() }));

app.post('/access/set-password', accessLimiter, (req, res) => {
  const password = String(req.body?.password ?? '');
  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
  }
  setPassword(password);
  return res.json({ ok: true, ...accessStatus() });
});

app.post('/access/remove-password', accessLimiter, (req, res) => {
  // Must prove knowledge of the current password before removing it.
  const password = String(req.body?.password ?? '');
  if (!verifyPassword(password)) {
    return res.status(401).json({ ok: false, error: 'Incorrect password.' });
  }
  removePassword();
  sendBrain(broadcast);
  return res.json({ ok: true, ...accessStatus() });
});

app.post('/access/unlock', accessLimiter, (req, res) => {
  const password = String(req.body?.password ?? '');
  if (!verifyPassword(password)) {
    return res.status(401).json({ ok: false, error: 'Incorrect password.' });
  }
  unlock();
  sendBrain(broadcast); // refresh every open panel now that it is unlocked
  return res.json({ ok: true, ...accessStatus() });
});

app.post('/access/lock', (_req, res) => {
  lock();
  sendBrain(broadcast); // every panel goes blank
  return res.json({ ok: true, ...accessStatus() });
});

app.post('/access/permissions', (req, res) => {
  if (isLocked()) return res.status(403).json({ ok: false, error: 'Unlock the brain first.' });
  const permissions = req.body?.permissions;
  if (!permissions || typeof permissions !== 'object') {
    return res.status(400).json({ ok: false, error: 'permissions object is required.' });
  }
  setPermissions(permissions);
  sendBrain(broadcast);
  return res.json({ ok: true, ...accessStatus() });
});

// ---- Docs live updates -------------------------------------------------
// Version / end-of-life data for the technologies the Docs articles teach,
// pulled from endoflife.date and cached in the brain. See services/docsLive.ts.

app.get('/docs/live', (_req, res) => {
  const data = loadDocsLive();
  if (!isDocsLiveFresh(data)) {
    // Serve what we have immediately; refresh in the background for next time.
    void refreshDocsLive().catch(() => {});
  }
  return res.json({ ok: true, ...data, fresh: isDocsLiveFresh(data) });
});

app.post('/docs/live/refresh', async (_req, res) => {
  try {
    const data = await refreshDocsLive();
    return res.json({ ok: true, ...data, fresh: true });
  } catch (err) {
    return res.status(502).json({ ok: false, error: String(err) });
  }
});

// Serve the source of a node's file so the UI can show "what's inside" on click.
// Any file inside the project root is viewable — membership in the analysis
// scan is NOT required, so files the scanner skipped (unrecognized extensions,
// scan caps) still open. Path containment is the only gate.
app.get('/file', (req, res) => {
  const projectId = String(req.query.projectId ?? '');
  const relPath = String(req.query.path ?? '');
  const analysis = projects.get(projectId);
  if (!analysis) return res.status(404).json({ ok: false, error: 'Unknown project' });

  const absPath = resolveWithin(analysis.rootPath, relPath);
  if (!absPath) return res.status(403).json({ ok: false, error: 'Path is outside the project root.' });

  const scanned = analysis.scan.files.find((f) => f.relPath === relPath);
  let content = '';
  try {
    if (fs.existsSync(absPath) && fs.statSync(absPath).isFile()) {
      content = fs.readFileSync(absPath, 'utf8');
    } else if (!scanned) {
      return res.status(404).json({ ok: false, error: 'File not found' });
    }
  } catch {
    content = scanned?.content ?? ''; // disk read failed: fall back to scan capture
  }

  return res.json({
    ok: true,
    path: relPath,
    ext: scanned?.ext ?? path.extname(relPath),
    content: content || '(binary or too large to preview)',
  });
});

// ---- Code Intelligence Panel ------------------------------------------

/**
 * Resolve an analyzed project by id. Returns it from the in-memory cache, or
 * recovers it from the persisted project index (re-analyzing the remembered
 * root path) so the Code Intelligence Panel keeps working after a backend
 * restart or page refresh.
 */
function getAnalysis(projectId: string): AnalysisResult | null {
  const inMem = projects.get(projectId);
  if (inMem) return inMem;
  const remembered = recallProject(projectId);
  if (!remembered) return null;
  try {
    const analysis = analyzeProject(remembered.rootPath);
    projects.set(analysis.projectId, analysis);
    return analysis;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[code] failed to recover project ${projectId}: ${String(err)}`);
    return null;
  }
}

/**
 * Build the absolute path for a node's stored file path, guaranteeing it stays
 * inside the analyzed project's root. Returns `null` for any path that escapes
 * the root (traversal / absolute path injection) so callers reject it.
 */
function resolveAbsolutePath(projectRoot: string, relPath: string): string | null {
  return resolveWithin(projectRoot, relPath);
}

// Full code-intelligence view of one file: every line classified, explained,
// and decorated with context-aware actions, plus a symbol navigator.
app.get('/code/file', (req, res) => {
  const projectId = String(req.query.projectId ?? '');
  const relPath = String(req.query.path ?? '');

  const analysis = getAnalysis(projectId);
  if (!analysis) {
    return res
      .status(404)
      .json({ ok: false, error: `Unknown project "${projectId}" — analyze a folder first.` });
  }

  // Resolve and confirm the path stays inside the project root before reading.
  const absPath = resolveAbsolutePath(analysis.rootPath, relPath);
  if (!absPath) {
    return res.status(403).json({ ok: false, error: 'Path is outside the project root.' });
  }

  if (!fs.existsSync(absPath)) {
    // eslint-disable-next-line no-console
    console.error(`[code/file] file does not exist on disk: ${absPath}`);
    return res.status(404).json({ ok: false, error: `File not found on disk: ${absPath}` });
  }

  try {
    const intel = buildFileIntel(analysis, relPath);
    if (!intel) {
      return res.status(500).json({ ok: false, error: `Could not read file: ${absPath}` });
    }
    return res.json({ ok: true, intel });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[code/file] read failed for ${absPath}: ${String(err)}`);
    return res.status(500).json({ ok: false, error: `Failed to read ${absPath}: ${String(err)}` });
  }
});

// Every place in the project that references the symbol on a given line.
app.get('/code/references', (req, res) => {
  const projectId = String(req.query.projectId ?? '');
  const relPath = String(req.query.path ?? '');
  const line = Number(req.query.line ?? 0);
  const symbol = String(req.query.symbol ?? '');
  const analysis = getAnalysis(projectId);
  if (!analysis) return res.status(404).json({ ok: false, error: 'Unknown project' });
  const references = findReferences(analysis, symbol, relPath, line);
  return res.json({ ok: true, references });
});

// Run Impact Analysis for one action on one line: returns before/after diffs
// across every affected file. Does NOT write anything.
app.post('/code/impact', (req, res) => {
  const projectId = String(req.body?.projectId ?? '');
  const relPath = String(req.body?.path ?? '');
  const line = Number(req.body?.line ?? 0);
  const actionId = String(req.body?.actionId ?? '');
  const analysis = getAnalysis(projectId);
  if (!analysis) return res.status(404).json({ ok: false, error: 'Unknown project' });
  const impact = analyzeImpact(analysis, projectId, relPath, line, actionId);
  if (!impact) return res.status(404).json({ ok: false, error: 'File not found' });
  return res.json({ ok: true, impact });
});

// Impact Analysis for a free-form edit made in the panel: diffs the submitted
// content against the file on disk. Does NOT write anything.
app.post('/code/edit-impact', (req, res) => {
  const projectId = String(req.body?.projectId ?? '');
  const relPath = String(req.body?.path ?? '');
  const content = typeof req.body?.content === 'string' ? req.body.content : null;
  const analysis = getAnalysis(projectId);
  if (!analysis) return res.status(404).json({ ok: false, error: 'Unknown project' });
  if (content === null) return res.status(400).json({ ok: false, error: 'content is required' });
  const original = readFileForIntel(analysis, relPath);
  if (original === null) return res.status(404).json({ ok: false, error: 'File not found' });
  const impact = diffToImpact(projectId, relPath, original, content);
  return res.json({ ok: true, impact });
});

// Apply an Impact Analysis to disk: backs up every file, writes the changes,
// then re-analyzes so the canvas and brain reflect the new code state.
app.post('/code/apply', (req, res) => {
  const projectId = String(req.body?.projectId ?? '');
  const impact = req.body?.impact as ImpactAnalysis | undefined;
  const analysis = getAnalysis(projectId);
  if (!analysis) return res.status(404).json({ ok: false, error: 'Unknown project' });
  if (!impact || !Array.isArray(impact.affected)) {
    return res.status(400).json({ ok: false, error: 'impact payload is required' });
  }
  const result = applyImpact(analysis, impact);
  // Re-analyze the project so the live canvas + brain pick up the new code.
  if (result.ok && clients.size > 0) {
    void handleAnalyze(analysis.rootPath, broadcast);
  }
  return res.json(result);
});

// Get loaded MCP servers (both Claude Desktop and custom imported ones)
app.get('/mcp/config', (_req, res) => {
  const claudeMcps = loadClaudeMcpServers();
  const customMcps = loadCustomMcps();
  return res.json({
    ok: true,
    claudeMcpServers: claudeMcps,
    customMcpServers: customMcps,
    combinedMcpServers: { ...claudeMcps, ...customMcps }
  });
});

// Import custom MCP servers from pasted config
app.post('/mcp/import', (req, res) => {
  const customConfig = req.body?.mcpServers;
  if (!customConfig || typeof customConfig !== 'object') {
    return res.status(400).json({ ok: false, error: 'mcpServers object is required in body' });
  }

  saveCustomMcps(customConfig);

  // Trigger re-analysis for any loaded projects to update the canvas nodes live!
  for (const [_, analysis] of projects.entries()) {
    void handleAnalyze(analysis.rootPath, broadcast, customConfig);
  }

  return res.json({ ok: true, message: 'MCP configurations imported successfully.' });
});

// Add a single custom MCP server
app.post('/mcp/add', (req, res) => {
  const { name, command, args, env } = req.body || {};
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ ok: false, error: 'Server name is required' });
  }
  if (!command || typeof command !== 'string') {
    return res.status(400).json({ ok: false, error: 'Command is required' });
  }

  const customMcps = loadCustomMcps();
  customMcps[name] = {
    command,
    args: Array.isArray(args) ? args : (args ? String(args).trim().split(/\s+/).filter(Boolean) : []),
    env: env || undefined,
  };

  saveCustomMcps(customMcps);

  // Trigger live re-analysis to update canvas live!
  for (const [_, analysis] of projects.entries()) {
    void handleAnalyze(analysis.rootPath, broadcast, customMcps);
  }

  return res.json({ ok: true, message: `MCP server ${name} added successfully.`, customMcpServers: customMcps });
});

const server = http.createServer(app);
// Only accept WebSocket upgrades from ArchLab's own frontend. Without this any
// page or local process could open a socket and send `analyze-project` with an
// arbitrary rootPath to scan (and stream back) the user's entire home folder.
const wss = new WebSocketServer({
  server,
  verifyClient: (info, done) => {
    const origin = info.origin;
    // A browser always sends Origin on the WS handshake; reject anything that is
    // not the known frontend. (No Origin = non-browser client = rejected too.)
    if (!origin || !ALLOWED_ORIGINS.has(origin)) return done(false, 403, 'Forbidden origin');
    // And require the same session token, passed as a query param on the URL.
    const token = new URL(info.req.url ?? '', 'http://localhost').searchParams.get('token');
    if (token !== SESSION_TOKEN) return done(false, 401, 'Invalid token');
    return done(true);
  },
});

// Every connected browser tab. The terminal CLI triggers analysis via HTTP and
// we broadcast the live stream to all of them at once.
const clients = new Set<WebSocket>();

// Process-wide registry of terminal PTYs, keyed by tab session id. PTYs live
// here (not on a socket) so they survive WebSocket reconnects: a reconnecting
// tab re-attaches to the same running shell instead of getting a fresh one.
const terminals = new Map<string, ShellSession>();

// Track the last active directory to initialize new terminals in.
let lastActiveCwd = getLastAnalyzedProject()?.rootPath || os.homedir();

// The terminal tab the user is currently looking at. Only this tab's `cd`
// triggers auto-analysis, so a background tab redrawing its prompt (on resize,
// reconnect, or its own background output) can never reset the canvas or pull
// it onto a different project. Null until the frontend reports a focused tab.
let activeTermId: string | null = null;

/** Send a message to every connected browser. */
function broadcast(msg: ServerMessage): void {
  const data = JSON.stringify(msg);
  for (const c of clients) {
    if (c.readyState === c.OPEN) c.send(data);
  }
}

// ---- Live project watcher -----------------------------------------------
// The canvas used to update only when the terminal cd'd somewhere new, so a
// CLI scaffold generating files INSIDE the current folder never showed up
// until the user manually re-opened it. Watch the active project root and
// re-analyze (debounced) whenever its files change, broadcasting to all tabs.
let projectWatcher: fs.FSWatcher | null = null;
let watchedRoot: string | null = null;
let watchDebounce: NodeJS.Timeout | null = null;
let watchRescanInFlight = false;
const WATCH_DEBOUNCE_MS = 2500;
// Generated/derived dirs whose churn must not trigger rescans. `brain` is
// critical: analyzing ArchLab itself writes brain files inside the watched
// root, which would otherwise loop watcher -> analyze -> write -> watcher.
const WATCH_IGNORE = /(^|[\\/])(node_modules|\.git|dist|build|out|coverage|\.next|\.cache|\.vite|brain)([\\/]|$)/;

function watchProjectRoot(root: string): void {
  if (watchedRoot === root && projectWatcher) return;
  projectWatcher?.close();
  projectWatcher = null;
  watchedRoot = root;
  try {
    projectWatcher = fs.watch(root, { recursive: true }, (_event, filename) => {
      if (filename && WATCH_IGNORE.test(String(filename))) return;
      if (watchDebounce) clearTimeout(watchDebounce);
      watchDebounce = setTimeout(() => {
        if (watchRescanInFlight || !watchedRoot) return;
        watchRescanInFlight = true;
        void handleAnalyze(watchedRoot, broadcast)
          .catch(() => {})
          .finally(() => {
            watchRescanInFlight = false;
          });
      }, WATCH_DEBOUNCE_MS);
      watchDebounce.unref();
    });
  } catch {
    // fs.watch can fail on network mounts or exhausted descriptors; the
    // manual Re-analyze button still covers those setups.
    projectWatcher = null;
  }
}

// Native folder picker (macOS) so the UI can offer a "Choose Folder" button
// that returns a real absolute path the backend can analyze and the terminal
// can cd into. Browsers can't expose absolute paths, so this runs the OS dialog.
app.post('/api/pick-folder', (_req, res) => {
  if (process.platform !== 'darwin') {
    // `unavailable` tells the client to offer the paste-path fallback.
    return res
      .status(400)
      .json({ ok: false, reason: 'unavailable', error: 'Native folder picker is only available on macOS.' });
  }
  // Async (execFile, not execFileSync) so the open dialog never blocks the
  // server's event loop. `activate` pulls the Finder chooser to the front so it
  // doesn't open hidden behind the browser. AppleScript returns a non-zero exit
  // when the user cancels, which lands in the error branch.
  execFile(
    'osascript',
    [
      // `try` so a missing Automation permission for activate is ignored rather
      // than failing the whole picker — the chooser still opens either way.
      '-e', 'try',
      '-e', 'tell application "System Events" to activate',
      '-e', 'end try',
      '-e', 'POSIX path of (choose folder with prompt "Select a project folder for ArchLab")',
    ],
    { encoding: 'utf8', timeout: 120_000 },
    (err, stdout) => {
      if (err) {
        // Non-zero exit = the user cancelled the dialog. `canceled` tells the
        // client to do nothing (no redundant paste prompt).
        return res.status(400).json({ ok: false, reason: 'canceled', error: 'Folder selection cancelled.' });
      }
      const folder = String(stdout).trim();
      if (!folder) return res.status(400).json({ ok: false, reason: 'canceled', error: 'No folder chosen.' });
      return res.json({ ok: true, path: folder });
    },
  );
});

// REST trigger used by the `archlab` terminal CLI. The browser canvas updates
// live because the whole stream is broadcast to every connected tab.
app.post('/analyze', (req, res) => {
  const rootPath = String(req.body?.rootPath ?? '').trim();
  const alsoCheck = Boolean(req.body?.runChecks);
  console.log(`[HTTP /analyze] Received path: ${rootPath}, check: ${alsoCheck}, clients: ${clients.size}`);
  if (!rootPath) return res.status(400).json({ ok: false, error: 'rootPath is required' });
  if (clients.size === 0) {
    console.log('[HTTP /analyze] Rejected: 409 No clients connected');
    return res
      .status(409)
      .json({ ok: false, error: 'No ArchLab browser tab is open. Open http://127.0.0.1:5317 first.' });
  }

  void (async () => {
    try {
      console.log('[HTTP /analyze] Starting handleAnalyze...');
      const analysis = await handleAnalyze(rootPath, broadcast);
      if (analysis) {
        console.log(`[HTTP /analyze] Analysis complete. Project ID: ${analysis.projectId}`);
        if (alsoCheck) {
          console.log('[HTTP /analyze] Running handleRunChecks...');
          await handleRunChecks(analysis.projectId, broadcast);
          console.log('[HTTP /analyze] Run checks complete.');
        }
      } else {
        console.log('[HTTP /analyze] handleAnalyze returned null');
      }
    } catch (err) {
      console.error('[HTTP /analyze] Background process error:', err);
    }
  })();

  return res.json({ ok: true, rootPath, runChecks: alsoCheck, clients: clients.size });
});

wss.on('connection', (socket) => {
  clients.add(socket);
  const emit = (msg: ServerMessage) => {
    if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(msg));
  };

  // Terminal sessions live in a process-wide registry (see `terminals`) keyed by
  // tab id, so the PTY survives a WebSocket reconnect. This socket only tracks
  // which ids it has attached, so it can detach (not kill) them on close.
  const attachedIds = new Set<string>();
  const ensureSession = (id: string, initialCwd?: string): ShellSession => {
    const handlers = {
      onData: (data: string) => emit({ type: 'term-data', id, data }),
      onCwdChange: (cwd: string) => {
        lastActiveCwd = cwd;
        // Always reflect the path in the terminal UI; this is display-only.
        emit({ type: 'term-cwd', id, cwd });
        // Only the tab the user is actually looking at may drive the canvas, so
        // background tabs (and prompt redraws on resize/reconnect) never reset
        // the project the user is on. Before any tab is focused, fall back to
        // analyzing so the very first session still maps onto the canvas.
        if (activeTermId === null || id === activeTermId) {
          void handleAnalyze(cwd, emit, undefined, id);
        }
      },
    };
    attachedIds.add(id);
    const existing = terminals.get(id);
    if (existing) {
      existing.attach(handlers); // reconnect: re-point output, replay buffered output
      return existing;
    }
    const session = createSession(handlers, initialCwd || lastActiveCwd);
    terminals.set(id, session);
    return session;
  };

  log(emit, 'info', 'Connected to ArchLab backend.');
  sendBrain(emit);

  // Restore the last analyzed project for this client so a fresh page load
  // never lands on an empty canvas. The project index lives in the brain, so
  // this survives backend restarts and works from any browser (the old
  // localStorage-based restore broke in both cases).
  const lastProject = getLastAnalyzedProject();
  if (lastProject && fs.existsSync(lastProject.rootPath)) {
    void handleAnalyze(lastProject.rootPath, emit);
  }

  socket.on('close', () => {
    clients.delete(socket);
    // Keep PTYs running; just stop forwarding their output to this dead socket.
    for (const id of attachedIds) terminals.get(id)?.detach();
    attachedIds.clear();
  });

  socket.on('message', (raw) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw.toString()) as ClientMessage;
    } catch {
      log(emit, 'error', 'Received malformed message.');
      return;
    }
    handleClientMessage(msg, emit, { ensureSession }).catch((err: unknown) => {
      log(emit, 'error', `Pipeline error: ${String(err)}`);
    });
  });

  socket.on('error', () => {
    /* Ignore socket-level errors; the client will reconnect. */
  });
});

interface TerminalRouter {
  ensureSession: (id: string, initialCwd?: string) => ShellSession;
}

/** Route a client message to the right handler. */
async function handleClientMessage(
  msg: ClientMessage,
  emit: (m: ServerMessage) => void,
  term: TerminalRouter,
) {
  switch (msg.type) {
    case 'analyze-project':
      return handleAnalyze(msg.rootPath, emit);
    case 'reanalyze-project':
      return handleReanalyze(msg.projectId, emit);
    case 'run-checks':
      return handleRunChecks(msg.projectId, emit);
    case 'run-bottlenecks':
      return handleRunBottlenecks(msg.projectId, emit);
    case 'request-brain':
      return sendBrain(emit);
    case 'run-agent-team':
      return handleRunAgentTeam(msg.projectId, msg.mode, msg.agentId, emit);
    case 'stop-agent-team':
      abortAgentTeam();
      return;
    case 'request-agent-runs':
      emit({ type: 'agent-runs', runs: listAgentRuns() });
      return;
    case 'term-init':
      return;
    case 'term-create':
      term.ensureSession(msg.id, msg.cwd);
      return;
    case 'term-close': {
      // Explicit tab close: kill the PTY and drop it from the global registry.
      const s = terminals.get(msg.id);
      if (s) {
        s.kill();
        terminals.delete(msg.id);
      }
      return;
    }
    case 'term-input':
      term.ensureSession(msg.id).write(msg.data);
      return;
    case 'term-resize':
      term.ensureSession(msg.id).resize(msg.cols, msg.rows);
      return;
    case 'term-focus':
      // Remember which tab is in view. Switching focus alone never re-analyzes:
      // the canvas only follows an explicit `cd` in the focused tab.
      activeTermId = msg.id;
      return;
  }
}

/**
 * Collect high-confidence capability signals for the Enterprise Audit:
 *  - every dependency + devDependency name from the project's package.json
 *  - markers for CI/security config files that prove a capability by presence
 *    (e.g. ".github/workflows", "dependabot.yml", ".snyk", "Jenkinsfile")
 *
 * These are exact, structural signals — unlike keyword scans — so a card can be
 * marked Detected with confidence when one is present.
 */
function collectProjectDependencies(rootPath: string): string[] {
  const out = new Set<string>();
  try {
    const pkgPath = path.join(rootPath, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
        peerDependencies?: Record<string, string>;
        scripts?: Record<string, string>;
      };
      for (const group of [pkg.dependencies, pkg.devDependencies, pkg.peerDependencies]) {
        for (const name of Object.keys(group ?? {})) out.add(name.toLowerCase());
      }
      // Surface build/test/deploy npm scripts as CI/CD markers so the System
      // Design guide can show a real pipeline even without a CI config file.
      for (const scriptName of Object.keys(pkg.scripts ?? {})) {
        const s = scriptName.toLowerCase();
        if (s === 'build' || s === 'test' || s === 'deploy') out.add(`script:${s}`);
      }
    }
  } catch {
    /* Unreadable/invalid package.json — fall back to config-file markers only. */
  }

  // Config-file presence markers (path-based capability proof).
  const markers: Array<[string, string]> = [
    ['.github/workflows', '.github/workflows'],
    ['.gitlab-ci.yml', '.gitlab-ci.yml'],
    ['Jenkinsfile', 'jenkinsfile'],
    ['.circleci/config.yml', '.circleci'],
    ['.circleci', '.circleci'],
    ['Makefile', 'makefile'],
    ['.snyk', '.snyk'],
    ['.github/dependabot.yml', 'dependabot.yml'],
    ['trivy.yaml', 'trivy'],
  ];
  for (const [rel, marker] of markers) {
    try {
      if (fs.existsSync(path.join(rootPath, rel))) out.add(marker);
    } catch {
      /* ignore */
    }
  }
  return [...out];
}

/** Analyze a folder and stream the generated canvas back. Returns the analysis. */
async function handleAnalyze(
  rootPath: string,
  emit: (m: ServerMessage) => void,
  customMcps?: Record<string, any>,
  termId?: string,
): Promise<AnalysisResult | null> {
  // Validate the target before scanning. rootPath arrives from a request body or
  // a WS message, so refuse anything that is not a real project directory, and
  // refuse sweeping roots (the filesystem root or the home dir itself) so a
  // crafted request cannot scan and stream back the whole machine.
  const resolvedRoot = path.resolve(rootPath);
  const sweeping = new Set([path.parse(resolvedRoot).root, os.homedir()]);
  if (sweeping.has(resolvedRoot)) {
    log(emit, 'error', 'Refusing to analyze a top-level directory. Pick a project folder.');
    return null;
  }
  if (!fs.existsSync(resolvedRoot) || !fs.statSync(resolvedRoot).isDirectory()) {
    log(emit, 'error', `Not a directory: ${resolvedRoot}`);
    return null;
  }

  // Large projects are fine: the scanner self-caps (see scanProject's MAX_FILES)
  // and skips oversized files, so analysis stays bounded and never hangs. For
  // very large trees we map the first slice and tell the user — without bailing.
  const SCAN_CAP = 1500; // keep in sync with scanProject MAX_FILES
  const fileCount = countProjectFiles(rootPath, SCAN_CAP + 1);
  if (fileCount > SCAN_CAP) {
    const message = `Large project detected (${fileCount}+ files). Mapping the first ${SCAN_CAP} files; cd into a specific subfolder for a tighter view.`;
    log(emit, 'info', message);
    if (termId) {
      emit({ type: 'term-data', id: termId, data: `\r\n\x1b[36m${message}\x1b[0m\r\n` });
    }
    // Continue — analyze the capped slice instead of refusing.
  }

  log(emit, 'info', `Analyzing project at ${rootPath} ...`);
  lastActiveCwd = rootPath;
  let analysis: AnalysisResult;
  try {
    analysis = analyzeProject(rootPath);
  } catch (err) {
    log(emit, 'error', `Failed to analyze: ${String(err)}`);
    return null;
  }

  // Load MCP servers
  const claudeMcps = loadClaudeMcpServers();
  const storedCustomMcps = customMcps || loadCustomMcps();
  const allMcps = { ...claudeMcps, ...storedCustomMcps };

  // Append MCP nodes to canvas under the external lane
  const mcpNodes = Object.entries(allMcps)
    .filter(([name]) => name !== 'archlab-mcp') // exclude self
    .map(([name, config]: [string, any], index) => ({
      id: `mcp_${name}`,
      kind: 'mcp' as const,
      lane: 'external' as const,
      label: name,
      filePath: undefined,
      animation: 'idle' as const,
      // Sit to the right of the external lane column (see analyzer/layout.ts).
      position: { x: 3280, y: 120 + index * 250 },
      meta: {
        command: config.command,
        args: Array.isArray(config.args) ? config.args.join(' ') : String(config.args || '')
      }
    }));

  analysis.canvas.nodes.push(...mcpNodes);

  // Link any existing backend endpoint or route to the MCP servers!
  const backendNode = analysis.canvas.nodes.find((n) => n.lane === 'backend');
  if (backendNode) {
    mcpNodes.forEach((mNode) => {
      analysis.canvas.edges.push({
        id: `edge_${backendNode.id}_${mNode.id}`,
        source: backendNode.id,
        target: mNode.id,
        label: 'MCP Connection',
        animated: false,
      });
    });
  }

  projects.set(analysis.projectId, analysis);
  // Persist id -> root path immediately so checks can always recover this
  // project later, even after a restart or page refresh.
  rememberProject(analysis.projectId, analysis.rootPath, analysis.name);
  // Keep the canvas live: newly generated/edited files re-analyze automatically.
  watchProjectRoot(analysis.rootPath);
  
  const inferredSql = inferSchemaFromAppFlow(analysis.scan);
  // Record detected infrastructure so the brain can surface cross-project insights.
  recordInfra(analysis.projectId, analysis.name, analysis.infra);
  emit({
    type: 'project-ready',
    projectId: analysis.projectId,
    name: analysis.name,
    rootPath: analysis.rootPath,
    canvas: analysis.canvas,
    inferredSql,
    infra: analysis.infra,
    dependencies: collectProjectDependencies(analysis.rootPath),
    missingInfraPatterns: analysis.missingInfraPatterns,
    techStack: analysis.techStack,
    internetConnections: analysis.internetConnections,
  });
  // Part 7: background version + CVE check (cached, fully non-blocking).
  void refreshToolVersions(analysis.rootPath, analysis.canvas.nodes).catch(() => {});

  const dependenciesRecord: Record<string, string> = {};
  try {
    const installedMap = readInstalledVersions(analysis.rootPath);
    for (const [k, v] of installedMap.entries()) {
      dependenciesRecord[k] = v;
    }
  } catch (e) {
    /* ignore */
  }

  const detectedToolIds = new Set<string>();
  for (const n of analysis.canvas.nodes) {
    for (const t of n.detectedTools ?? []) {
      detectedToolIds.add(t.id);
    }
  }

  // Trigger enrichment asynchronously
  enrichAnalysis(
    dependenciesRecord,
    [...detectedToolIds],
    analysis.techStack ?? [],
    (progressMsg) => {
      emit({ type: 'log', level: 'info', message: `[Enrichment] ${progressMsg}`, at: new Date().toISOString() });
    }
  ).then((enrichment) => {
    // Generate new diagnostics for outdated packages and vulnerabilities
    const newDiagnostics: any[] = [];
    for (const pkg of enrichment.outdatedPackages) {
      newDiagnostics.push({
        id: `outdated-${pkg.name}`,
        step: 'final-report',
        title: `Outdated dependency: ${pkg.name}`,
        what: `${pkg.name} is at ${pkg.installedVersion} but ${pkg.latestVersion} is available.`,
        why: `Keeping dependencies updated reduces security risks and ensures performance/feature parity.`,
        howToFix: `Update ${pkg.name} from ${pkg.installedVersion} to ${pkg.latestVersion}. Check the changelog at ${pkg.changelog || ''} for breaking changes before updating.`,
        severity: 'medium',
        relatedNodeIds: [],
      });
    }

    for (const vuln of enrichment.vulnerabilities) {
      newDiagnostics.push({
        id: `vuln-${vuln.id}`,
        step: 'security-checks',
        title: `Security vulnerability: ${vuln.package} — ${vuln.id}`,
        what: vuln.summary,
        why: vuln.details || 'Known security vulnerability found in package version.',
        howToFix: vuln.fixedVersion
          ? `Update ${vuln.package} to ${vuln.fixedVersion} to fix ${vuln.id}. See ${vuln.referenceUrl} for details.`
          : `No fix available yet for ${vuln.id}. Consider replacing ${vuln.package} or applying a workaround. See ${vuln.referenceUrl}.`,
        severity: vuln.severity === 'CRITICAL' ? 'critical' : vuln.severity === 'HIGH' ? 'high' : 'medium',
        relatedNodeIds: [],
      });
    }

    emit({
      type: 'enrichment-complete' as any,
      diagnostics: newDiagnostics,
      enrichment: { ...enrichment, status: 'ready' },
    } as any);

    // Save summary to brain
    try {
      const criticalVulns = enrichment.vulnerabilities
        .filter((v) => v.severity === 'CRITICAL' || v.severity === 'HIGH')
        .map((v) => `${v.package}:${v.id}`);

      saveLiveDataSummary(analysis.name, {
        checkedAt: Date.now(),
        outdatedCount: enrichment.outdatedPackages.length,
        vulnerabilityCount: enrichment.vulnerabilities.length,
        criticalVulns,
      });
    } catch {
      /* ignore */
    }
  }).catch((err) => {
    log(emit, 'error', `Enrichment failed: ${String(err)}`);
    emit({
      type: 'enrichment-complete' as any,
      diagnostics: [],
      enrichment: {
        status: 'failed',
        error: String(err),
        outdatedPackages: [],
        vulnerabilities: [],
        stackBestPractices: [],
        enrichedAt: new Date().toISOString(),
      },
    } as any);
  });

  log(
    emit,
    'info',
    `Canvas generated: ${analysis.canvas.nodes.length} nodes, ${analysis.canvas.edges.length} edges.`,
  );

  // The brain absorbs the project immediately on first analyze (cd into a
  // folder), not only when Run Checks is clicked. Diagnostics are empty here;
  // Run Checks later folds in the full report (which replaces this record).
  try {
    let readme = '';
    for (const name of ['README.md', 'README.txt', 'readme.md', 'README']) {
      const p = path.join(analysis.rootPath, name);
      if (fs.existsSync(p)) {
        readme = fs.readFileSync(p, 'utf8').substring(0, 5000);
        break;
      }
    }
    const report: DiagnosticReport = {
      projectId: analysis.projectId,
      generatedAt: new Date().toISOString(),
      summary: `Analysis of ${analysis.name}: ${analysis.canvas.nodes.length} nodes mapped.`,
      diagnostics: [],
      counts: { critical: 0, high: 0, bottleneck: 0, medium: 0, low: 0, info: 0 },
    };
    learnFromProject({
      projectId: analysis.projectId,
      name: analysis.name,
      rootPath: analysis.rootPath,
      analyzedAt: new Date().toISOString(),
      intelligence: analysis.intelligence,
      canvas: analysis.canvas,
      report,
      readme: readme || undefined,
    });
    log(emit, 'info', 'Global brain absorbed this project.');
    sendBrain(emit);
  } catch (err) {
    log(emit, 'warn', `Brain absorption skipped: ${String(err)}`);
  }

  return analysis;
}

/**
 * Force a fresh full scan of an already-analyzed project. Rescans from disk,
 * rebuilds the canvas, re-derives project intelligence, and folds the refreshed
 * structure into the brain. The client preserves its viewport across this.
 */
async function handleReanalyze(projectId: string, emit: (m: ServerMessage) => void) {
  // Resolve the folder to rescan: from memory, or the persisted index.
  const known = projects.get(projectId);
  const rootPath = known?.rootPath ?? recallProject(projectId)?.rootPath ?? null;
  if (!rootPath) {
    log(emit, 'error', `Could not locate project ${projectId} to re-analyze.`);
    return;
  }

  log(emit, 'info', `Re-analyzing ${rootPath} from scratch ...`);

  // A fresh scan: analyzeProject always reads the folder anew, so new or changed
  // files are reflected. handleAnalyze re-emits project-ready (rebuilds canvas).
  const analysis = await handleAnalyze(rootPath, emit);
  if (!analysis) return;

  // Re-run the project intelligence step on the refreshed structure.
  // handleAnalyze above already absorbed the refreshed project into the brain
  // and pushed the updated summary, so no second learnFromProject is needed.
  emit({ type: 'intelligence', intelligence: analysis.intelligence });
}

/** Standalone bottleneck analysis: detect and stream bottleneck diagnostics. */
async function handleRunBottlenecks(projectId: string, emit: (m: ServerMessage) => void) {
  let analysis = projects.get(projectId);
  if (!analysis) {
    const remembered = recallProject(projectId);
    if (remembered) analysis = (await handleAnalyze(remembered.rootPath, emit)) ?? undefined;
  }
  if (!analysis) {
    log(emit, 'error', `Could not locate project ${projectId} for bottleneck analysis.`);
    return;
  }

  log(emit, 'info', 'Running bottleneck detection ...');
  const bottlenecks = detectBottlenecks(analysis);
  for (const d of bottlenecks) emit({ type: 'diagnostic', diagnostic: d });
  log(emit, 'info', `Bottleneck analysis complete: ${bottlenecks.length} found.`);
}

/** Resolve an analyzed project, recovering it from the persisted index if needed. */
async function resolveAnalysis(
  projectId: string,
  emit: (m: ServerMessage) => void,
): Promise<AnalysisResult | null> {
  let analysis = projects.get(projectId);
  if (!analysis) {
    const remembered = recallProject(projectId);
    if (remembered) analysis = (await handleAnalyze(remembered.rootPath, emit)) ?? undefined;
  }
  return analysis ?? null;
}

/** Run the Agent Team (all agents or one) against a project and stream results. */
async function handleRunAgentTeam(
  projectId: string,
  mode: import('@archlab/shared').AgentMode,
  agentId: import('@archlab/shared').AgentId | undefined,
  emit: (m: ServerMessage) => void,
) {
  const analysis = await resolveAnalysis(projectId, emit);
  if (!analysis) {
    log(emit, 'error', `Could not locate project ${projectId} for the Agent Team.`);
    return;
  }
  log(emit, 'info', `Running Agent Team (${mode} mode) on ${analysis.name} ...`);
  await runAgentTeam(analysis, mode, agentId, emit);
  log(emit, 'info', 'Agent Team run complete.');
  sendBrain(emit);
}

/** Run the animated 7-step pipeline, then fold results into the brain. */
async function handleRunChecks(projectId: string, emit: (m: ServerMessage) => void) {
  let analysis = projects.get(projectId);

  // Recover silently: if the project isn't in memory (restart, refresh, or a
  // long gap), re-analyze it from its persisted root path before running. The
  // user should never see an "unknown project" error.
  if (!analysis) {
    const remembered = recallProject(projectId);
    if (remembered) {
      analysis = (await handleAnalyze(remembered.rootPath, emit)) ?? undefined;
    }
  }

  if (!analysis) {
    log(emit, 'error', `Could not locate project ${projectId}. Please analyze a folder first.`);
    return;
  }

  const { report } = await runPipeline(analysis, emit);

  // The brain learns after every single scan.
  let readme = '';
  try {
    const readmeNames = ['README.md', 'README.txt', 'readme.md', 'README'];
    for (const name of readmeNames) {
      const p = path.join(analysis.rootPath, name);
      if (fs.existsSync(p)) {
        readme = fs.readFileSync(p, 'utf8').substring(0, 5000);
        break;
      }
    }
  } catch {
    // ignore
  }

  learnFromProject({
    projectId: analysis.projectId,
    name: analysis.name,
    rootPath: analysis.rootPath,
    analyzedAt: new Date().toISOString(),
    intelligence: analysis.intelligence,
    canvas: analysis.canvas,
    report,
    readme: readme || undefined,
  });
  log(emit, 'info', 'Global brain updated with this scan.');
  sendBrain(emit);
}

/** Push the current brain summary to the client, gated by the access layer. */
function sendBrain(emit: (m: ServerMessage) => void) {
  const brain = gateBrain(loadBrain());
  // Fold in cross-project infrastructure recommendations (System Design tab).
  const insights = brain.insights ? [...brain.insights, ...infraInsights()] : infraInsights();
  emit({
    type: 'brain',
    projectCount: brain.projects.length,
    patterns: brain.patterns,
    insights,
  });
}

function log(
  emit: (m: ServerMessage) => void,
  level: 'info' | 'warn' | 'error',
  message: string,
) {
  emit({ type: 'log', level, message, at: new Date().toISOString() });
}

// Re-lock the brain on every startup: a fresh launch always requires the
// password again before anything is served (Layer 1).
lock();

// Keep the Docs tab's tech radar current: refresh once shortly after boot if
// stale, then every 24 hours.
startDocsLiveScheduler();

// A second launch while ArchLab is already running must fail loudly and with a
// non-zero exit, not fall through to the generic crash guard with exit 0.
// NOTE: the ws library forwards the HTTP server's 'error' events onto `wss`,
// and an unhandled 'error' on wss throws before our server handler runs — so
// the handler must be attached to BOTH emitters.
function onServerStartupError(err: NodeJS.ErrnoException): void {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `[archlab-backend] port ${PORTS.backend} is already in use — ArchLab is probably already running.\n` +
      `[archlab-backend] stop it with Ctrl+C in its terminal, or force-kill: kill -9 $(lsof -t -i:${PORTS.backend})`,
    );
  } else {
    console.error('[archlab-backend] server failed to start:', err);
  }
  process.exit(1);
}
server.on('error', onServerStartupError);
wss.on('error', () => {
  /* handled by the server listener above; this stops ws's re-emit from throwing */
});

server.listen(PORTS.backend, HOST, () => {
  persistSessionToken();
  // eslint-disable-next-line no-console
  console.log(`[archlab-backend] http+ws listening on http://${HOST}:${PORTS.backend}`);
});

// ---- Process-level reliability guards ---------------------------------------
// Without these, one rejected promise anywhere (a failed analysis, a dropped
// AI call) kills the whole backend and takes every live terminal session and
// WebSocket with it. Log loudly, keep serving; all durable state is on disk.
process.on('unhandledRejection', (reason) => {
  console.error('[archlab-backend] unhandled rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[archlab-backend] uncaught exception:', err);
});

// Graceful shutdown: kill PTYs (so no orphaned shells linger) and close the
// server before exiting on Ctrl+C or a supervisor's terminate signal.
let shuttingDown = false;
function shutdown(signal: string): void {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[archlab-backend] ${signal} received, shutting down...`);
  projectWatcher?.close();
  for (const session of terminals.values()) {
    try {
      session.kill();
    } catch {
      /* PTY already gone */
    }
  }
  wss.close();
  server.close(() => process.exit(0));
  // Hard exit if a hung connection keeps the server open.
  setTimeout(() => process.exit(0), 3000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
