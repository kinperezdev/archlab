/**
 * Agent context builder.
 *
 * Assembles the structured JSON block every agent is pre-loaded with: the
 * project intelligence report, current architecture map, database schema, the
 * detected infrastructure map, and cross-project patterns/insights from the
 * brain. This is injected into each agent prompt so no agent starts from zero.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { AnalysisResult } from '../analyzer/analyzer.js';
import { loadBrain } from '../brain/brainStore.js';
import { retrieve } from '../brain/rag/ragIndex.js';
import { inferSchemaFromAppFlow } from '../analyzer/inference.js';

export interface AgentContext {
  project: { id: string; name: string; techStack: string[]; readme?: string };
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

  // Read README for high-level project purpose
  let readme = '';
  try {
    const readmeNames = ['README.md', 'README.txt', 'readme.md', 'README'];
    for (const name of readmeNames) {
      const p = path.join(analysis.rootPath, name);
      if (fs.existsSync(p)) {
        readme = fs.readFileSync(p, 'utf8').substring(0, 5000);
        break;
      }
    }
  } catch {
    // ignore
  }

  return {
    project: {
      id: analysis.projectId,
      name: analysis.name,
      techStack: analysis.techStack,
      readme: readme || undefined,
    },
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

/** One retrieved brain chunk, ready to drop into a prompt. */
export interface RetrievedBrainChunk {
  kind: string;
  text: string;
  score: number;
}

/**
 * Retrieval-augmented brain context.
 *
 * Instead of dumping every pattern and insight into the prompt (which grows
 * unbounded and burns tokens), this pulls only the top-k brain chunks that are
 * semantically relevant to the agent's task. Returns [] gracefully if nothing
 * has been embedded yet, so callers can fall back to the full context.
 */
export async function retrieveBrainForTask(
  task: string,
  k = 6,
): Promise<RetrievedBrainChunk[]> {
  const hits = await retrieve(task, { k });
  return hits.map((h) => ({
    kind: h.record.kind,
    text: h.record.text,
    score: Number(h.score.toFixed(3)),
  }));
}

/** Serialize the context to a compact JSON string for the prompt. */
export function contextToBlock(ctx: AgentContext): string {
  return JSON.stringify(ctx, null, 1);
}
