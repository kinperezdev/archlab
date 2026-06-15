/**
 * Central client state for ArchLab.
 *
 * Owns the single WebSocket connection to the backend and reduces every
 * incoming ServerMessage into React state: the live canvas, pipeline progress,
 * diagnostics, project intelligence, the final report, and the brain summary.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  PORTS,
  type CanvasGraph,
  type Diagnostic,
  type DiagnosticReport,
  type PipelineStep,
  type ProjectIntelligence,
  type ServerMessage,
  type ClientMessage,
  type BrainInsight,
  type BrainPattern,
  type SystemDesignMap,
  type AgentId,
  type AgentStatus,
  type AgentFinding,
  type AgentMode,
  type AgentRunSummary,
  type TeamReport,
  type PersistentIssue,
} from '@archlab/shared';

/** Per-agent live state in the Agent Team panel. */
export interface AgentState {
  status: AgentStatus;
  output: string;
  findings: AgentFinding[];
  summary?: string;
}

const AGENT_IDS: AgentId[] = ['security', 'performance', 'architecture', 'database', 'quality', 'orchestrator'];

function emptyAgents(): Record<AgentId, AgentState> {
  const out = {} as Record<AgentId, AgentState>;
  for (const id of AGENT_IDS) out[id] = { status: 'idle', output: '', findings: [] };
  return out;
}

/** Map an agent id to the pipeline step its findings belong under. */
const AGENT_STEP: Record<AgentId, PipelineStep['id']> = {
  security: 'security-checks',
  performance: 'performance-checks',
  architecture: 'architecture-mapping',
  database: 'data-flow-tracing',
  quality: 'final-report',
  orchestrator: 'final-report',
};

/** Convert an agent finding into a Diagnostic so it shows on the canvas + panel. */
function agentFindingToDiagnostic(f: AgentFinding, canvas: CanvasGraph): Diagnostic {
  const related = f.file ? canvas.nodes.filter((n) => n.filePath === f.file).map((n) => n.id) : [];
  return {
    id: f.id,
    step: AGENT_STEP[f.agentId],
    severity: f.severity,
    title: f.title,
    what: f.description,
    why: f.description,
    howToFix: f.suggestedFix,
    optimization: '',
    relatedNodeIds: related,
    agentId: f.agentId,
  };
}

export interface AgentTeamState {
  running: boolean;
  agents: Record<AgentId, AgentState>;
  report: TeamReport | null;
  runs: AgentRunSummary[];
  /** Persistent unresolved issues (3+ runs), surfaced in the Brain panel. */
  persistentIssues: PersistentIssue[];
  /** Path the report was auto-written to (drives the success toast). */
  reportSavedPath: string | null;
}

export interface LogLine {
  level: 'info' | 'warn' | 'error';
  message: string;
  at: string;
}

export interface BrainSummary {
  projectCount: number;
  patterns: BrainPattern[];
  insights: BrainInsight[];
}

export interface TerminalState {
  /** Current working directory of the PTY (drives auto-analysis on the backend). */
  cwd: string;
}

export interface ArchLabState {
  connected: boolean;
  projectId: string | null;
  projectName: string | null;
  projectPath: string | null;
  /** Epoch ms of the most recent successful analysis, for the freshness stamp. */
  analyzedAt: number | null;
  /** True while a forced re-analysis is in flight (drives the button spinner). */
  reanalyzing: boolean;
  canvas: CanvasGraph;
  steps: PipelineStep[];
  diagnostics: Diagnostic[];
  intelligence: ProjectIntelligence | null;
  report: DiagnosticReport | null;
  brain: BrainSummary;
  logs: LogLine[];
  terminal: TerminalState;
  inferredSql: string | null;
  /** Detected infrastructure map for the System Design tab (Detected Mode). */
  infra: SystemDesignMap | null;
  /** Agent Team live state. */
  agentTeam: AgentTeamState;
}

const EMPTY_CANVAS: CanvasGraph = { nodes: [], edges: [] };

export function useArchLab() {
  const wsRef = useRef<WebSocket | null>(null);
  const [state, setState] = useState<ArchLabState>({
    connected: false,
    projectId: null,
    projectName: null,
    projectPath: null,
    analyzedAt: null,
    reanalyzing: false,
    canvas: EMPTY_CANVAS,
    steps: [],
    diagnostics: [],
    intelligence: null,
    report: null,
    brain: { projectCount: 0, patterns: [], insights: [] },
    logs: [],
    terminal: { cwd: '~' },
    inferredSql: null,
    infra: null,
    agentTeam: {
      running: false,
      agents: emptyAgents(),
      report: null,
      runs: [],
      persistentIssues: [],
      reportSavedPath: null,
    },
  });

  // Subscribers for raw PTY output, keyed by terminal-session id. Terminal data
  // bypasses React state and is pushed straight to xterm.js to avoid
  // re-rendering the whole app per chunk.
  const termListeners = useRef<Map<string, Set<(data: string) => void>>>(new Map());

  // Reduce one server message into the next immutable state.
  const reduce = useCallback((prev: ArchLabState, msg: ServerMessage): ArchLabState => {
    switch (msg.type) {
      case 'log':
        return { ...prev, logs: [...prev.logs.slice(-200), msg] };

      case 'project-ready':
        return {
          ...prev,
          projectId: msg.projectId,
          projectName: msg.name,
          projectPath: msg.rootPath,
          analyzedAt: Date.now(),
          reanalyzing: false,
          canvas: msg.canvas,
          diagnostics: [],
          report: null,
          intelligence: null,
          inferredSql: msg.inferredSql ?? null,
          infra: msg.infra ?? null,
        };

      case 'canvas-update':
        return { ...prev, canvas: msg.canvas };

      case 'node-animate':
        return {
          ...prev,
          canvas: {
            ...prev.canvas,
            nodes: prev.canvas.nodes.map((n) =>
              n.id === msg.nodeId ? { ...n, animation: msg.state } : n,
            ),
          },
        };

      case 'edge-animate':
        return {
          ...prev,
          canvas: {
            ...prev.canvas,
            edges: prev.canvas.edges.map((e) =>
              e.id === msg.edgeId ? { ...e, animated: msg.animated } : e,
            ),
          },
        };

      case 'pipeline-init':
        return { ...prev, steps: msg.steps, diagnostics: [], report: null };

      case 'step-status':
        return {
          ...prev,
          steps: prev.steps.map((s) =>
            s.id === msg.stepId ? { ...s, status: msg.status, summary: msg.summary ?? s.summary } : s,
          ),
        };

      case 'intelligence':
        return { ...prev, intelligence: msg.intelligence };

      case 'diagnostic':
        return { ...prev, diagnostics: [...prev.diagnostics, msg.diagnostic] };

      case 'report':
        return { ...prev, report: msg.report };

      case 'brain':
        return {
          ...prev,
          brain: {
            projectCount: msg.projectCount,
            patterns: msg.patterns,
            insights: msg.insights,
          },
        };

      case 'term-cwd':
        return { ...prev, terminal: { ...prev.terminal, cwd: msg.cwd } };

      case 'agent-status': {
        const a = prev.agentTeam.agents[msg.agentId];
        const running = msg.status === 'thinking' || msg.status === 'working' ? true : prev.agentTeam.running;
        return {
          ...prev,
          agentTeam: {
            ...prev.agentTeam,
            running,
            agents: {
              ...prev.agentTeam.agents,
              [msg.agentId]: { ...a, status: msg.status, summary: msg.summary ?? a.summary },
            },
          },
        };
      }

      case 'agent-output': {
        const a = prev.agentTeam.agents[msg.agentId];
        return {
          ...prev,
          agentTeam: {
            ...prev.agentTeam,
            agents: {
              ...prev.agentTeam.agents,
              [msg.agentId]: { ...a, output: (a.output + msg.chunk).slice(-20000) },
            },
          },
        };
      }

      case 'agent-findings': {
        const a = prev.agentTeam.agents[msg.agentId];
        // Bridge agent findings into the main diagnostics so they highlight
        // nodes on the canvas and appear in the findings panel. Replace any
        // prior diagnostics from this same agent (re-runs overwrite cleanly).
        const bridged = msg.findings.map((f) => agentFindingToDiagnostic(f, prev.canvas));
        const diagnostics = [
          ...prev.diagnostics.filter((d) => d.agentId !== msg.agentId),
          ...bridged,
        ];
        return {
          ...prev,
          diagnostics,
          agentTeam: {
            ...prev.agentTeam,
            agents: { ...prev.agentTeam.agents, [msg.agentId]: { ...a, findings: msg.findings } },
          },
        };
      }

      case 'agent-error': {
        const a = prev.agentTeam.agents[msg.agentId];
        return {
          ...prev,
          agentTeam: {
            ...prev.agentTeam,
            running: false,
            agents: {
              ...prev.agentTeam.agents,
              [msg.agentId]: { ...a, status: 'error', output: `${a.output}\n[error] ${msg.message}` },
            },
          },
        };
      }

      case 'agent-report':
        return { ...prev, agentTeam: { ...prev.agentTeam, report: msg.report } };

      case 'agent-report-saved':
        return { ...prev, agentTeam: { ...prev.agentTeam, reportSavedPath: msg.path } };

      case 'agent-persistent-issues':
        return { ...prev, agentTeam: { ...prev.agentTeam, persistentIssues: msg.issues } };

      case 'agent-run-saved':
        return {
          ...prev,
          agentTeam: { ...prev.agentTeam, running: false, runs: [msg.summary, ...prev.agentTeam.runs] },
        };

      case 'agent-runs':
        return { ...prev, agentTeam: { ...prev.agentTeam, runs: msg.runs } };

      default:
        return prev;
    }
  }, []);

  // Connect once on mount, with simple auto-reconnect.
  useEffect(() => {
    let closed = false;
    let retry: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      const ws = new WebSocket(`ws://127.0.0.1:${PORTS.backend}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setState((p) => ({ ...p, connected: true }));
        ws.send(JSON.stringify({ type: 'term-init' }));
      };
      ws.onclose = () => {
        setState((p) => ({ ...p, connected: false }));
        if (!closed) retry = setTimeout(connect, 1500);
      };
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data as string) as ServerMessage;
          // PTY output is high-frequency: push it straight to subscribers
          // (xterm.js) instead of through React state.
          if (msg.type === 'term-data') {
            const set = termListeners.current.get(msg.id);
            if (set) for (const fn of set) fn(msg.data);
            return;
          }
          setState((p) => reduce(p, msg));
        } catch {
          /* ignore malformed frames */
        }
      };
    };

    connect();
    return () => {
      closed = true;
      if (retry) clearTimeout(retry);
      wsRef.current?.close();
    };
  }, [reduce]);

  const send = useCallback((msg: ClientMessage) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  }, []);

  const analyzeProject = useCallback((rootPath: string) => {
    send({ type: 'analyze-project', rootPath });
  }, [send]);

  const runChecks = useCallback(() => {
    if (state.projectId) send({ type: 'run-checks', projectId: state.projectId });
  }, [send, state.projectId]);

  const reanalyzeProject = useCallback(() => {
    if (!state.projectId) return;
    setState((p) => ({ ...p, reanalyzing: true }));
    send({ type: 'reanalyze-project', projectId: state.projectId });
  }, [send, state.projectId]);

  const refreshBrain = useCallback(() => send({ type: 'request-brain' }), [send]);

  // ---- Agent Team -----------------------------------------------------------
  const runAgentTeam = useCallback(
    (mode: AgentMode, agentId?: AgentId) => {
      if (!state.projectId) return;
      // Reset the live panel for the agents about to run.
      setState((p) => ({
        ...p,
        agentTeam: { ...p.agentTeam, running: true, report: null, reportSavedPath: null, agents: emptyAgents() },
      }));
      send({ type: 'run-agent-team', projectId: state.projectId, mode, agentId });
    },
    [send, state.projectId],
  );

  const stopAgentTeam = useCallback(() => {
    send({ type: 'stop-agent-team' });
    setState((p) => {
      const updatedAgents = { ...p.agentTeam.agents };
      for (const id of AGENT_IDS) {
        const a = updatedAgents[id];
        if (a.status === 'thinking' || a.status === 'working') {
          updatedAgents[id] = {
            ...a,
            status: 'error',
            output: `${a.output}\n[error] Stopped by user.`,
          };
        }
      }
      return {
        ...p,
        agentTeam: {
          ...p.agentTeam,
          running: false,
          agents: updatedAgents,
        },
      };
    });
  }, [send]);

  const requestAgentRuns = useCallback(() => send({ type: 'request-agent-runs' }), [send]);

  // ---- Real-terminal (PTY) API, per session id ----------------------------
  // Subscribe to one session's raw PTY output. Returns an unsubscribe function.
  const onTerminalData = useCallback((id: string, cb: (data: string) => void) => {
    let set = termListeners.current.get(id);
    if (!set) {
      set = new Set();
      termListeners.current.set(id, set);
    }
    set.add(cb);
    return () => {
      set?.delete(cb);
      if (set && set.size === 0) termListeners.current.delete(id);
    };
  }, []);

  // Spawn / tear down a backend PTY session for a terminal tab.
  const createTerminal = useCallback((id: string, cwd?: string) => send({ type: 'term-create', id, cwd }), [send]);
  const closeTerminal = useCallback((id: string) => send({ type: 'term-close', id }), [send]);

  // Stream raw keystrokes to a session's stdin.
  const sendTerminalInput = useCallback(
    (id: string, data: string) => send({ type: 'term-input', id, data }),
    [send],
  );

  // Keep a session's PTY viewport in sync with the on-screen terminal size.
  const resizeTerminal = useCallback(
    (id: string, cols: number, rows: number) => send({ type: 'term-resize', id, cols, rows }),
    [send],
  );

  return useMemo(
    () => ({
      state,
      analyzeProject,
      reanalyzeProject,
      runChecks,
      refreshBrain,
      runAgentTeam,
      stopAgentTeam,
      requestAgentRuns,
      onTerminalData,
      createTerminal,
      closeTerminal,
      sendTerminalInput,
      resizeTerminal,
    }),
    [
      state,
      analyzeProject,
      reanalyzeProject,
      runChecks,
      refreshBrain,
      runAgentTeam,
      stopAgentTeam,
      requestAgentRuns,
      onTerminalData,
      createTerminal,
      closeTerminal,
      sendTerminalInput,
      resizeTerminal,
    ],
  );
}
