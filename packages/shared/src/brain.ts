/**
 * Global brain types.
 *
 * The brain is global: it learns across every project ever run through ArchLab.
 * Stored entirely on localhost as JSON + Markdown. Never sent anywhere.
 */

import type { ProjectIntelligence } from './intelligence.js';
import type { CanvasGraph } from './canvas.js';
import type { DiagnosticReport, Severity } from './pipeline.js';

/** One project's full record inside the brain. */
export interface BrainProjectRecord {
  projectId: string;
  name: string;
  rootPath: string;
  analyzedAt: string;
  intelligence: ProjectIntelligence;
  canvas: CanvasGraph;
  report: DiagnosticReport;
}

/** A recurring pattern the brain has learned across projects. */
export interface BrainPattern {
  id: string;
  /** "error" | "architecture" | "performance" | "security" | "feature". */
  category: string;
  /** Plain English description of the pattern. */
  description: string;
  /** How it was fixed / what tends to work, when known. */
  resolution?: string;
  /** Project ids where this pattern appeared. */
  occurrences: string[];
  /** How many times observed — drives proactive surfacing. */
  count: number;
}

/** A cross-project insight the brain surfaces proactively. */
export interface BrainInsight {
  id: string;
  message: string;
  severity: Severity;
  patternId?: string;
}

/**
 * Brain access permissions (Layer 2). Controls what the MCP server and brain
 * panel are allowed to surface. Enforced at the access layer, not by encrypting
 * the files — reads and writes stay fast.
 */
export interface BrainPermissions {
  /** Allow reading cross-project architecture/learned patterns. */
  patterns: boolean;
  /** Allow reading proactive cross-project insights. */
  insights: boolean;
  /** Allow reading per-project diagnostics/findings. */
  projectFindings: boolean;
  /** Project ids fully blocked from any AI tool via MCP, even when unlocked. */
  lockedProjects: string[];
}

/** Status of the brain access gate (Layer 1 lock + Layer 2 permissions). */
export interface BrainAccessStatus {
  /** Whether a local password has been set. */
  hasPassword: boolean;
  /** Whether the brain is currently locked (password set and not unlocked). */
  locked: boolean;
  permissions: BrainPermissions;
}

/** The full in-memory shape of the global brain. */
export interface BrainState {
  version: number;
  updatedAt: string;
  projects: BrainProjectRecord[];
  patterns: BrainPattern[];
  insights: BrainInsight[];
}
