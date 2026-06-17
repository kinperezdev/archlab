/**
 * WebSocket message protocol between frontend and backend.
 *
 * Every real-time update flows through these discriminated-union messages so
 * both sides stay type-safe. `type` is the discriminant.
 */

import type { CanvasGraph, NodeAnimationState } from './canvas.js';
import type {
  Diagnostic,
  DiagnosticReport,
  PipelineStep,
  PipelineStepId,
  StepStatus,
} from './pipeline.js';
import type { ProjectIntelligence } from './intelligence.js';
import type { BrainInsight, BrainPattern } from './brain.js';
import type { SystemDesignMap } from './systemdesign.js';
import type {
  AgentFinding,
  AgentId,
  AgentMode,
  AgentRunSummary,
  AgentStatus,
  PersistentIssue,
  TeamReport,
} from './agents.js';

/** Messages the client sends to the server. */
export type ClientMessage =
  | { type: 'analyze-project'; rootPath: string }
  | { type: 'reanalyze-project'; projectId: string }
  | { type: 'run-checks'; projectId: string }
  | { type: 'run-bottlenecks'; projectId: string }
  | { type: 'request-brain' }
  // Agent Team: run all agents (sequential/parallel) or one (single).
  | { type: 'run-agent-team'; projectId: string; mode: AgentMode; agentId?: AgentId }
  | { type: 'stop-agent-team' }
  | { type: 'request-agent-runs' }
  // In-app terminal (real PTY). Multiple independent sessions per tab, keyed by
  // `id`: create/close a session, stream raw stdin, and resize the viewport.
  | { type: 'term-create'; id: string; cwd?: string }
  | { type: 'term-close'; id: string }
  | { type: 'term-input'; id: string; data: string }
  | { type: 'term-resize'; id: string; cols: number; rows: number }
  // The tab the user is currently looking at. Only the active tab's `cd` drives
  // auto-analysis, so background tabs never hijack the canvas.
  | { type: 'term-focus'; id: string }
  | { type: 'term-init' };

/** Messages the server sends to the client. */
export type ServerMessage =
  | { type: 'log'; level: 'info' | 'warn' | 'error'; message: string; at: string }
  | { type: 'project-ready'; projectId: string; name: string; rootPath: string; canvas: CanvasGraph; inferredSql?: string; infra?: SystemDesignMap; dependencies?: string[] }
  | { type: 'canvas-update'; canvas: CanvasGraph }
  | {
      type: 'node-animate';
      nodeId: string;
      state: NodeAnimationState;
    }
  | { type: 'edge-animate'; edgeId: string; animated: boolean }
  | { type: 'pipeline-init'; steps: PipelineStep[] }
  | { type: 'step-status'; stepId: PipelineStepId; status: StepStatus; summary?: string }
  | { type: 'intelligence'; intelligence: ProjectIntelligence }
  | { type: 'diagnostic'; diagnostic: Diagnostic }
  | { type: 'report'; report: DiagnosticReport }
  | {
      type: 'brain';
      projectCount: number;
      patterns: BrainPattern[];
      insights: BrainInsight[];
    }
  // In-app terminal: raw PTY output (ANSI) and the live working directory, per
  // session `id`.
  | { type: 'term-data'; id: string; data: string }
  | { type: 'term-cwd'; id: string; cwd: string }
  // Agent Team live stream.
  | { type: 'agent-status'; agentId: AgentId; status: AgentStatus; summary?: string }
  | { type: 'agent-output'; agentId: AgentId; chunk: string }
  | { type: 'agent-findings'; agentId: AgentId; findings: AgentFinding[] }
  | { type: 'agent-report'; report: TeamReport }
  | { type: 'agent-report-saved'; path: string }
  | { type: 'agent-run-saved'; summary: AgentRunSummary }
  | { type: 'agent-persistent-issues'; issues: PersistentIssue[] }
  | { type: 'agent-runs'; runs: AgentRunSummary[] }
  | { type: 'agent-error'; agentId: AgentId; message: string };
