/**
 * Agent Team types — a local multi-agent orchestration system.
 *
 * Six specialized agents (security, performance, architecture, database, code
 * quality, and an orchestrator) run against a project, each pre-loaded with full
 * context from the ArchLab brain, coordinating through a shared message bus, and
 * reporting findings back into the UI in real time.
 */

import type { Severity } from './pipeline.js';

/** The six agent roles. The orchestrator synthesizes the other five. */
export type AgentId =
  | 'security'
  | 'performance'
  | 'architecture'
  | 'database'
  | 'quality'
  | 'orchestrator';

/** Live status of a single agent, drives the colored indicator. */
export type AgentStatus = 'idle' | 'thinking' | 'working' | 'error' | 'complete';

/** How the team is run. */
export type AgentMode = 'sequential' | 'parallel' | 'single';

/** Static metadata describing an agent (name, role, color). */
export interface AgentMeta {
  id: AgentId;
  name: string;
  role: string;
  /** Accent color for the agent's card + finding badge. */
  color: string;
}

/** One finding produced by an agent, shaped like a pipeline diagnostic. */
export interface AgentFinding {
  id: string;
  agentId: AgentId;
  severity: Severity;
  title: string;
  /** Project-relative file path, when the finding is file-specific. */
  file?: string;
  description: string;
  suggestedFix: string;
}

/** One actionable item in the orchestrator's report. */
export interface ReportItem {
  title: string;
  detail: string;
  /** Effort hint shown on the card (e.g. "<30 min", "planning required"). */
  effort?: string;
}

/** The orchestrator's synthesized team report. */
export interface TeamReport {
  summary: string;
  priorityActions: ReportItem[];
  quickWins: ReportItem[];
  architectureDecisions: ReportItem[];
  technicalDebt: ReportItem[];
}

/** A persisted record of one agent-team run (stored in brain/agent-runs). */
export interface AgentRunSummary {
  /** Timestamp id (also the filename stem). */
  id: string;
  at: string;
  mode: AgentMode;
  projectId: string;
  projectName: string;
  /** Finding count per agent. */
  findingCounts: Partial<Record<AgentId, number>>;
  totalFindings: number;
  report?: TeamReport;
}

/** A message posted to the inter-agent bus during a run. */
export interface AgentMessage {
  from: AgentId;
  to: AgentId | 'all';
  text: string;
}

/** A finding seen across multiple runs of the same project (3+ = persistent). */
export interface PersistentIssue {
  agentId: AgentId;
  title: string;
  /** How many runs it has appeared in. */
  count: number;
  projectId: string;
  /** ISO timestamp it was first seen. */
  firstSeen: string;
}
