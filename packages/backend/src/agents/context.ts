/**
 * Agent context builder.
 *
 * Assembles the structured JSON block every agent is pre-loaded with: the
 * project intelligence report, current architecture map, database schema, the
 * detected infrastructure map, and cross-project patterns/insights from the
 * brain. This is injected into each agent prompt so no agent starts from zero.
 */

import type { AnalysisResult } from '../analyzer/analyzer.js';
import { loadBrain } from '../brain/brainStore.js';
import { inferSchemaFromAppFlow } from '../analyzer/inference.js';

export interface AgentContext {
  project: { id: string; name: string; techStack: string[] };
  intelligence: unknown;
  architecture: {
    nodes: { id: string; kind: string; lane: string; label: string; file?: string }[];
    edges: { source: string; target: string; label?: string }[];
    isolatedNodes: string[];
  };
  databaseSchema: string;
  infrastructure: AnalysisResult['infra'];
  brain: {
    patterns: unknown[];
    insights: unknown[];
    projectCount: number;
  };
}

/** Build the full context object for an analyzed project. */
export function buildAgentContext(analysis: AnalysisResult): AgentContext {
  const brain = loadBrain();
  const { nodes, edges } = analysis.canvas;

  const degree = new Set<string>();
  for (const e of edges) {
    degree.add(e.source);
    degree.add(e.target);
  }
  const isolatedNodes = nodes.filter((n) => !degree.has(n.id)).map((n) => n.id);

  return {
    project: { id: analysis.projectId, name: analysis.name, techStack: analysis.techStack },
    intelligence: analysis.intelligence,
    architecture: {
      nodes: nodes.map((n) => ({ id: n.id, kind: n.kind, lane: n.lane, label: n.label, file: n.filePath })),
      edges: edges.map((e) => ({ source: e.source, target: e.target, label: e.label })),
      isolatedNodes,
    },
    databaseSchema: inferSchemaFromAppFlow(analysis.scan),
    infrastructure: analysis.infra,
    brain: {
      patterns: brain.patterns,
      insights: brain.insights,
      projectCount: brain.projects.length,
    },
  };
}

/** Serialize the context to a compact JSON string for the prompt. */
export function contextToBlock(ctx: AgentContext): string {
  return JSON.stringify(ctx, null, 1);
}
