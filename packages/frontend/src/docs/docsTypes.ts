/**
 * Type system for the standalone Docs tab.
 *
 * The Docs surface is fully offline and data-driven: every article in
 * `docsContent.ts` conforms to {@link DocArticle}, and every renderer in this
 * folder consumes these shapes only. No backend, no project, no network.
 */

export type DocDifficulty = 'Beginner' | 'Intermediate' | 'Senior' | 'Principal';

export type DocCategory =
  | 'System Design Fundamentals'
  | 'API Design'
  | 'Security'
  | 'Databases'
  | 'Infrastructure'
  | 'Observability'
  | 'Architecture Patterns'
  | 'Mobile Engineering'
  | 'DevOps and Deployment'
  | 'Code Quality';

export type CodeLanguage =
  | 'typescript'
  | 'python'
  | 'go'
  | 'java'
  | 'rust'
  | 'kotlin'
  | 'swift';

export type DiagramType =
  | 'flow'
  | 'sequence'
  | 'architecture'
  | 'comparison'
  | 'timeline';

export interface DocSection {
  heading: string;
  /** Full prose paragraph. Rendered as a paragraph, never as a bullet list. */
  body: string;
}

export interface DocDiagram {
  title: string;
  description: string;
  type: DiagramType;
  /** Inner markup of an <svg> element (no outer <svg> tag). */
  svgContent: string;
}

export interface RealWorldExample {
  company: string;
  problem: string;
  solution: string;
  outcome: string;
}

export interface CodeExample {
  language: CodeLanguage;
  label: string;
  description: string;
  code: string;
}

export interface DocArticle {
  id: string;
  title: string;
  category: DocCategory;
  difficulty: DocDifficulty;
  /** Estimated reading time in minutes. */
  readTime: number;
  summary: string;
  whyItMatters: string;
  content: DocSection[];
  diagrams: DocDiagram[];
  realWorldExamples: RealWorldExample[];
  codeExamples: CodeExample[];
  commonMistakes: string[];
  whenNotToUse: string;
  /** Article ids of related topics, rendered as clickable pills. */
  relatedTopics: string[];
  industryStandard: string;
  interviewTips: string;
}

/** Ordered list of categories so the sidebar renders in a stable, intentional order. */
export const DOC_CATEGORY_ORDER: DocCategory[] = [
  'System Design Fundamentals',
  'API Design',
  'Security',
  'Databases',
  'Infrastructure',
  'Observability',
  'Architecture Patterns',
  'Mobile Engineering',
  'DevOps and Deployment',
  'Code Quality',
];

export const DIFFICULTY_ORDER: DocDifficulty[] = [
  'Beginner',
  'Intermediate',
  'Senior',
  'Principal',
];
