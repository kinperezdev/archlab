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

/** The full in-memory shape of the global brain. */
export interface BrainState {
  version: number;
  updatedAt: string;
  projects: BrainProjectRecord[];
  patterns: BrainPattern[];
  insights: BrainInsight[];
}
