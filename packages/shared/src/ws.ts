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

/** Messages the client sends to the server. */
export type ClientMessage =
  | { type: 'analyze-project'; rootPath: string }
  | { type: 'reanalyze-project'; projectId: string }
  | { type: 'run-checks'; projectId: string }
  | { type: 'run-bottlenecks'; projectId: string }
  | { type: 'request-brain' }
  // In-app terminal: a typed command line, and a request for the initial cwd.
  | { type: 'term-input'; line: string }
  | { type: 'term-init' };

/** Messages the server sends to the client. */
export type ServerMessage =
  | { type: 'log'; level: 'info' | 'warn' | 'error'; message: string; at: string }
  | { type: 'project-ready'; projectId: string; name: string; rootPath: string; canvas: CanvasGraph; inferredSql?: string }
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
  // In-app terminal: streamed command output and the live working directory.
  | { type: 'term-output'; data: string; stream: 'stdout' | 'stderr' | 'system' }
  | { type: 'term-cwd'; cwd: string };
