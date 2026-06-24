/**
 * Project intelligence types — the output of pipeline step 1.
 */

export interface ProjectIntelligence {
  projectId: string;
  /** Plain English: what the product does and who it is for. */
  summary: string;
  /** Detected tech stack, e.g. ["React", "TypeScript", "Express"]. */
  techStack: string[];
  /** Inferred goals of the product. */
  goals: string[];
  /** Every current feature mapped from the code. */
  currentFeatures: string[];
  /** Suggested future features based on what is missing or partial. */
  suggestedFeatures: string[];
  /** Plain English explanation of how everything connects. */
  howItConnects: string;
}

/** A major piece of infrastructure the analyzer detected as absent. */
export type MissingInfraType =
  | 'no-backend'
  | 'no-frontend'
  | 'no-database'
  | 'no-auth'
  | 'no-api'
  | 'frontend-only'
  | 'backend-only'
  | 'no-tests'
  | 'no-config';

export interface MissingInfraPattern {
  type: MissingInfraType;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  /** What was detected, e.g. "React + TypeScript". */
  detectedStack: string;
  /** One sentence describing what to add. */
  suggestedImplementation: string;
  /** Full, project-specific implementation prompt. */
  generatedPrompt: string;
}
