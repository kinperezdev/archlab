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
} from '@archlab/shared';

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
  const createTerminal = useCallback((id: string) => send({ type: 'term-create', id }), [send]);
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
      onTerminalData,
      createTerminal,
      closeTerminal,
      sendTerminalInput,
      resizeTerminal,
    ],
  );
}
