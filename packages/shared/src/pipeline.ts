/**
 * Structured check pipeline types.
 *
 * The pipeline always runs these 7 steps in this exact order after the canvas
 * is generated. Each step animates live on the canvas and can raise diagnostics.
 */

/** Stable identifiers for the 7 pipeline steps, in execution order. */
export const PIPELINE_STEPS = [
  'project-intelligence',
  'architecture-mapping',
  'data-flow-tracing',
  'security-checks',
  'performance-checks',
  'scale-analysis',
  'final-report',
] as const;

export type PipelineStepId = (typeof PIPELINE_STEPS)[number];

/** Lifecycle status of a single pipeline step. */
export type StepStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';

export interface PipelineStep {
  id: PipelineStepId;
  title: string;
  status: StepStatus;
  /** Short human readable summary produced when the step finishes. */
  summary?: string;
  /** Diagnostic ids raised during this step. */
  diagnosticIds: string[];
}

/**
 * Severity used by diagnostics. `bottleneck` (amber) sits between high and
 * medium and is reserved for scale/architecture bottlenecks, kept visually
 * distinct from red critical security findings.
 */
export type Severity = 'critical' | 'high' | 'bottleneck' | 'medium' | 'low' | 'info';

/**
 * A diagnostic is what the Diagnostic Prompt renders. It always teaches:
 * what is wrong, why, how to fix it, and what to optimize beyond the fix.
 */
export interface Diagnostic {
  id: string;
  step: PipelineStepId;
  severity: Severity;
  title: string;
  /** What is wrong, in plain language. */
  what: string;
  /** Why it is wrong (root cause). */
  why: string;
  /** Exactly how to fix it. */
  howToFix: string;
  /** What could be optimized or improved beyond the fix. */
  optimization: string;
  /** Node ids this diagnostic relates to, for highlighting on the canvas. */
  relatedNodeIds: string[];
  /**
   * For bottleneck diagnostics: the bottleneck category label shown on the node
   * and in the sidebar, e.g. "DB HOTSPOT" or "UNBOUNDED QUERY".
   */
  bottleneckType?: string;
  /**
   * For bottleneck diagnostics: a concrete scale threshold estimate, e.g.
   * "this will become a problem around 1,000 concurrent users".
   */
  userThreshold?: string;
  /**
   * Optional copy-paste build prompt. Architecture advisories use this to hand
   * the user (or an AI agent) a ready-to-run instruction for closing the gap,
   * e.g. "scaffold a backend and connect these screens".
   */
  suggestedPrompt?: string;
}

/** The complete diagnostic report assembled in step 7. */
export interface DiagnosticReport {
  projectId: string;
  generatedAt: string;
  summary: string;
  diagnostics: Diagnostic[];
  /** Counts by severity for quick scanning. */
  counts: Record<Severity, number>;
}
