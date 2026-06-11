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
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { PORTS, type ClientMessage, type ServerMessage, type DiagnosticReport } from '@archlab/shared';
import { analyzeProject, type AnalysisResult } from './analyzer/analyzer.js';
import { rememberProject, recallProject } from './analyzer/projectIndex.js';
import { runPipeline } from './pipeline/pipeline.js';
import { detectBottlenecks } from './pipeline/bottleneck.js';
import { learnFromProject, loadBrain } from './brain/brainStore.js';
import { BRAIN_DIR } from './brain/paths.js';
import { createSession, runCommand, type ShellSession } from './terminal/shell.js';
import { inferSchemaFromAppFlow } from './analyzer/inference.js';

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
app.use(express.json());

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

// Read-only brain snapshot over HTTP (handy for tools and debugging).
app.get('/brain', (_req, res) => res.json(loadBrain()));

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

  // Each tab gets its own terminal session (its own working directory).
  const session = createSession();

  log(emit, 'info', 'Connected to ArchLab backend.');
  sendBrain(emit);
  emit({ type: 'term-cwd', cwd: session.cwd });

  socket.on('close', () => clients.delete(socket));

  socket.on('message', (raw) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw.toString()) as ClientMessage;
    } catch {
      log(emit, 'error', 'Received malformed message.');
      return;
    }
    handleClientMessage(msg, emit, session).catch((err: unknown) => {
      log(emit, 'error', `Pipeline error: ${String(err)}`);
    });
  });

  socket.on('error', () => {
    /* Ignore socket-level errors; the client will reconnect. */
  });
});

/** Route a client message to the right handler. */
async function handleClientMessage(
  msg: ClientMessage,
  emit: (m: ServerMessage) => void,
  session: ShellSession,
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
      emit({ type: 'term-cwd', cwd: session.cwd });
      return;
    case 'term-input':
      return handleTerminalInput(msg.line, emit, session);
  }
}

/**
 * Run a terminal command. When the command changes directory (a `cd`), ArchLab
 * immediately reads the new folder and maps it onto the canvas — this is the
 * core "cd into a folder and it analyzes it" behaviour.
 */
async function handleTerminalInput(
  line: string,
  emit: (m: ServerMessage) => void,
  session: ShellSession,
) {
  const result = await runCommand(session, line);
  if (result.output) {
    emit({ type: 'term-output', data: result.output, stream: result.stream });
  }
  if (result.cwdChanged) {
    emit({ type: 'term-cwd', cwd: session.cwd });
    // Auto-analyze the folder we just stepped into.
    await handleAnalyze(session.cwd, emit);
  }
}

/** Analyze a folder and stream the generated canvas back. Returns the analysis. */
async function handleAnalyze(
  rootPath: string,
  emit: (m: ServerMessage) => void,
  customMcps?: Record<string, any>,
): Promise<AnalysisResult | null> {
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
  emit({
    type: 'project-ready',
    projectId: analysis.projectId,
    name: analysis.name,
    rootPath: analysis.rootPath,
    canvas: analysis.canvas,
    inferredSql,
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

/** Push the current brain summary to the client. */
function sendBrain(emit: (m: ServerMessage) => void) {
  const brain = loadBrain();
  emit({
    type: 'brain',
    projectCount: brain.projects.length,
    patterns: brain.patterns,
    insights: brain.insights,
  });
}

function log(
  emit: (m: ServerMessage) => void,
  level: 'info' | 'warn' | 'error',
  message: string,
) {
  emit({ type: 'log', level, message, at: new Date().toISOString() });
}

server.listen(PORTS.backend, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`[archlab-backend] http+ws listening on http://${HOST}:${PORTS.backend}`);
});
