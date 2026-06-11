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
