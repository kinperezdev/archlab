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
import { execFileSync } from 'node:child_process';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { PORTS, type ClientMessage, type ServerMessage, type DiagnosticReport } from '@archlab/shared';
import { analyzeProject, type AnalysisResult } from './analyzer/analyzer.js';
import { rememberProject, recallProject } from './analyzer/projectIndex.js';
import { runPipeline } from './pipeline/pipeline.js';
import { detectBottlenecks } from './pipeline/bottleneck.js';
import { learnFromProject, loadBrain } from './brain/brainStore.js';
import { recordInfra, infraInsights } from './brain/infraBrain.js';
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
import type { ImpactAnalysis } from '@archlab/shared';

const HOST = '127.0.0.1';

// In-memory cache of analyzed projects this session, keyed by projectId.
const projects = new Map<string, AnalysisResult>();

// Path to save custom imported MCP configs
const CUSTOM_MCP_FILE = path.join(BRAIN_DIR, 'imported_mcps.json');

/** Load MCP servers configured in Claude Desktop. */
function loadClaudeMcpServers(): Record<string, any> {
  const configPath = '/Users/kinclarkperez/Library/Application Support/Claude/claude_desktop_config.json';
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
// Generous limit so files dropped into the terminal (base64) fit in one request.
app.use(express.json({ limit: '128mb' }));

// Enable CORS for frontend requests
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Health check.
app.get('/health', (_req, res) => res.json({ ok: true, service: 'archlab-backend' }));

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

app.post('/terminal/upload', (req, res) => {
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

app.post('/terminal/upload-batch', (req, res) => {
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

// ---- Ideas canvas persistence (brain/ideas.json) ----------------------
const IDEAS_FILE = path.join(BRAIN_DIR, 'ideas.json');
const SCHEMA_FILE = path.join(BRAIN_DIR, 'schema.json');

app.get('/ideas', (_req, res) => {
  try {
    if (!fs.existsSync(IDEAS_FILE)) return res.json({ ok: true, nodes: [], edges: [] });
    const data = JSON.parse(fs.readFileSync(IDEAS_FILE, 'utf8'));
    return res.json({ ok: true, nodes: data.nodes ?? [], edges: data.edges ?? [] });
  } catch {
    return res.json({ ok: true, nodes: [], edges: [] });
  }
});

app.post('/ideas', (req, res) => {
  const nodes = Array.isArray(req.body?.nodes) ? req.body.nodes : [];
  const edges = Array.isArray(req.body?.edges) ? req.body.edges : [];
  try {
    fs.mkdirSync(path.dirname(IDEAS_FILE), { recursive: true });
    fs.writeFileSync(IDEAS_FILE, JSON.stringify({ nodes, edges }, null, 2), 'utf8');
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

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

app.get('/schema', (_req, res) => {
  try {
    if (!fs.existsSync(SCHEMA_FILE)) return res.json({ ok: true, sql: '' });
    const data = JSON.parse(fs.readFileSync(SCHEMA_FILE, 'utf8'));
    return res.json({ ok: true, sql: data.sql ?? '' });
  } catch {
    return res.json({ ok: true, sql: '' });
  }
});

app.post('/schema', (req, res) => {
  const sql = typeof req.body?.sql === 'string' ? req.body.sql : '';
  try {
    fs.mkdirSync(path.dirname(SCHEMA_FILE), { recursive: true });
    fs.writeFileSync(SCHEMA_FILE, JSON.stringify({ sql }, null, 2), 'utf8');
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

// Read-only brain snapshot over HTTP (handy for tools and debugging). Gated by
// the access layer: empty when locked, filtered by permissions otherwise.
app.get('/brain', (_req, res) => res.json(gateBrain(loadBrain())));

// ---- Brain access control (Layer 1 lock + Layer 2 permissions) ----------
app.get('/access/status', (_req, res) => res.json({ ok: true, ...accessStatus() }));

app.post('/access/set-password', (req, res) => {
  const password = String(req.body?.password ?? '');
  if (password.length < 4) {
    return res.status(400).json({ ok: false, error: 'Password must be at least 4 characters.' });
  }
  setPassword(password);
  return res.json({ ok: true, ...accessStatus() });
});

app.post('/access/remove-password', (req, res) => {
  // Must prove knowledge of the current password before removing it.
  const password = String(req.body?.password ?? '');
  if (!verifyPassword(password)) {
    return res.status(401).json({ ok: false, error: 'Incorrect password.' });
  }
  removePassword();
  sendBrain(broadcast);
  return res.json({ ok: true, ...accessStatus() });
});

app.post('/access/unlock', (req, res) => {
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

// Serve the source of a node's file so the UI can show "what's inside" on click.
// Content is served from the in-memory scan captured at analysis time.
app.get('/file', (req, res) => {
  const projectId = String(req.query.projectId ?? '');
  const relPath = String(req.query.path ?? '');
  const analysis = projects.get(projectId);
  if (!analysis) return res.status(404).json({ ok: false, error: 'Unknown project' });
  const file = analysis.scan.files.find((f) => f.relPath === relPath);
  if (!file) return res.status(404).json({ ok: false, error: 'File not found' });

  // Read file directly from disk to avoid in-memory scanner limits
  const absPath = path.join(analysis.rootPath, file.relPath);
  let content = '';
  try {
    if (fs.existsSync(absPath)) {
      content = fs.readFileSync(absPath, 'utf8');
    }
  } catch {
    content = file.content; // fallback
  }

  return res.json({
    ok: true,
    path: file.relPath,
    ext: file.ext,
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
 * Build the absolute path for a node's stored file path. The path may already
 * be absolute (starts with "/") — use it as-is — otherwise join it onto the
 * analyzed project's root path.
 */
function resolveAbsolutePath(projectRoot: string, relPath: string): string {
  return relPath.startsWith('/') ? relPath : path.join(projectRoot, relPath);
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

  // Build and log the exact absolute path before attempting the read.
  const absPath = resolveAbsolutePath(analysis.rootPath, relPath);
  // eslint-disable-next-line no-console
  console.log(`[code/file] projectRoot="${analysis.rootPath}" relPath="${relPath}" -> reading: ${absPath}`);

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

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Every connected browser tab. The terminal CLI triggers analysis via HTTP and
// we broadcast the live stream to all of them at once.
const clients = new Set<WebSocket>();

// Process-wide registry of terminal PTYs, keyed by tab session id. PTYs live
// here (not on a socket) so they survive WebSocket reconnects: a reconnecting
// tab re-attaches to the same running shell instead of getting a fresh one.
const terminals = new Map<string, ShellSession>();

/** Send a message to every connected browser. */
function broadcast(msg: ServerMessage): void {
  const data = JSON.stringify(msg);
  for (const c of clients) {
    if (c.readyState === c.OPEN) c.send(data);
  }
}

// REST trigger used by the `archlab` terminal CLI. The browser canvas updates
// live because the whole stream is broadcast to every connected tab.
app.post('/analyze', (req, res) => {
  const rootPath = String(req.body?.rootPath ?? '').trim();
  const alsoCheck = Boolean(req.body?.runChecks);
  if (!rootPath) return res.status(400).json({ ok: false, error: 'rootPath is required' });
  if (clients.size === 0) {
    return res
      .status(409)
      .json({ ok: false, error: 'No ArchLab browser tab is open. Open http://127.0.0.1:5317 first.' });
  }

  void (async () => {
    const analysis = await handleAnalyze(rootPath, broadcast);
    if (analysis && alsoCheck) await handleRunChecks(analysis.projectId, broadcast);
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
  const ensureSession = (id: string): ShellSession => {
    const handlers = {
      onData: (data: string) => emit({ type: 'term-data', id, data }),
      onCwdChange: (cwd: string) => {
        emit({ type: 'term-cwd', id, cwd });
        void handleAnalyze(cwd, emit, undefined, id);
      },
    };
    attachedIds.add(id);
    const existing = terminals.get(id);
    if (existing) {
      existing.attach(handlers); // reconnect: re-point output, replay buffered output
      return existing;
    }
    const session = createSession(handlers);
    terminals.set(id, session);
    return session;
  };

  log(emit, 'info', 'Connected to ArchLab backend.');
  sendBrain(emit);

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
  ensureSession: (id: string) => ShellSession;
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
    case 'term-init':
      return;
    case 'term-create':
      term.ensureSession(msg.id);
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
  }
}

/** Analyze a folder and stream the generated canvas back. Returns the analysis. */
async function handleAnalyze(
  rootPath: string,
  emit: (m: ServerMessage) => void,
  customMcps?: Record<string, any>,
  termId?: string,
): Promise<AnalysisResult | null> {
  // Guard: a folder with too many files (e.g. a home directory or a monorepo
  // root) is not a useful analysis target. Warn and bail so the user picks a
  // specific project subfolder instead.
  const FOLDER_FILE_LIMIT = 500;
  const fileCount = countProjectFiles(rootPath, FOLDER_FILE_LIMIT * 4);
  if (fileCount > FOLDER_FILE_LIMIT) {
    const message = `This folder contains ${fileCount}${
      fileCount >= FOLDER_FILE_LIMIT * 4 ? '+' : ''
    } files which is too large to analyze effectively. Please cd into a specific project subfolder instead.`;
    log(emit, 'warn', message);
    // Surface it right in the originating terminal too (amber, on its own line).
    if (termId) {
      emit({ type: 'term-data', id: termId, data: `\r\n\x1b[33m${message}\x1b[0m\r\n` });
    }
    return null;
  }

  log(emit, 'info', `Analyzing project at ${rootPath} ...`);
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
  });
  log(
    emit,
    'info',
    `Canvas generated: ${analysis.canvas.nodes.length} nodes, ${analysis.canvas.edges.length} edges.`,
  );
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
  emit({ type: 'intelligence', intelligence: analysis.intelligence });

  // Fold the refreshed analysis into the brain (no findings yet: that is what
  // Run Checks adds).
  const report: DiagnosticReport = {
    projectId: analysis.projectId,
    generatedAt: new Date().toISOString(),
    summary: `Re-analysis of ${analysis.name}: ${analysis.canvas.nodes.length} nodes mapped.`,
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
  });
  log(emit, 'info', 'Global brain updated with the fresh analysis.');
  sendBrain(emit);
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
  learnFromProject({
    projectId: analysis.projectId,
    name: analysis.name,
    rootPath: analysis.rootPath,
    analyzedAt: new Date().toISOString(),
    intelligence: analysis.intelligence,
    canvas: analysis.canvas,
    report,
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

server.listen(PORTS.backend, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`[archlab-backend] http+ws listening on http://${HOST}:${PORTS.backend}`);
});
