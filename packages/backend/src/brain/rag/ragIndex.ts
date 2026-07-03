/**
 * RAG index — the bridge between brain content and the vector store.
 *
 * Responsibilities:
 *   - Turn brain records (wiki entries, patterns, insights) into embeddings.
 *   - Keep the vector store in sync as the brain learns.
 *   - Retrieve the most relevant brain chunks for a natural-language query.
 *
 * Everything here is local: local embedding model + local JSON vector store.
 */

import type { BrainInsight, BrainPattern } from '@archlab/shared';
import { embedText, embedTexts } from './embedder.js';
import {
  upsertVectors,
  removeVectors,
  searchVectors,
  vectorCount,
  type VectorHit,
  type VectorKind,
} from './vectorStore.js';

/** Minimal shape needed to index a company-wiki entry (avoids a store import cycle). */
export interface IndexableWikiEntry {
  id: string;
  projectName: string;
  decision: string;
  rationale: string;
  outcome?: string;
  tags: string[];
}

// ---- Text builders: how each record collapses into one embeddable string -----

function wikiText(e: IndexableWikiEntry): string {
  return [
    `Project: ${e.projectName}`,
    `Decision: ${e.decision}`,
    `Rationale: ${e.rationale}`,
    e.outcome ? `Outcome: ${e.outcome}` : '',
    e.tags.length ? `Tags: ${e.tags.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function patternText(p: BrainPattern): string {
  return [
    `Pattern (${p.category}): ${p.description}`,
    p.resolution ? `Resolution: ${p.resolution}` : '',
    `Seen in ${p.count} project(s).`,
  ]
    .filter(Boolean)
    .join('\n');
}

function insightText(i: BrainInsight): string {
  return `Insight (${i.severity}): ${i.message}`;
}

// ---- Indexing ---------------------------------------------------------------

/** Embed and upsert a single wiki entry. */
export async function indexWikiEntry(entry: IndexableWikiEntry): Promise<void> {
  const vector = await embedText(wikiText(entry));
  upsertVectors([
    {
      id: `wiki:${entry.id}`,
      kind: 'wiki',
      text: wikiText(entry),
      vector,
      meta: { projectName: entry.projectName },
    },
  ]);
}

/** Remove a wiki entry's vector (e.g. when the entry is deleted). */
export function unindexWikiEntry(entryId: string): void {
  removeVectors([`wiki:${entryId}`]);
}

/**
 * Rebuild vectors for all patterns and insights in one batched pass.
 * Call after a brain scan folds in new learning. Wiki entries are indexed
 * incrementally on write, so they are left untouched here.
 */
export async function reindexBrainLearning(
  patterns: BrainPattern[],
  insights: BrainInsight[],
): Promise<void> {
  const texts = [...patterns.map(patternText), ...insights.map(insightText)];
  if (texts.length === 0) return;

  const vectors = await embedTexts(texts);

  const patternRecords = patterns.map((p, i) => ({
    id: `pattern:${p.id}`,
    kind: 'pattern' as VectorKind,
    text: texts[i],
    vector: vectors[i],
    meta: { category: p.category, count: p.count },
  }));

  const offset = patterns.length;
  const insightRecords = insights.map((ins, i) => ({
    id: `insight:${ins.id}`,
    kind: 'insight' as VectorKind,
    text: texts[offset + i],
    vector: vectors[offset + i],
    meta: { severity: ins.severity, patternId: ins.patternId },
  }));

  upsertVectors([...patternRecords, ...insightRecords]);
}

// ---- Retrieval --------------------------------------------------------------

/** Retrieve the top-k most relevant brain chunks for a query. */
export async function retrieve(
  query: string,
  options: { k?: number; kinds?: VectorKind[] } = {},
): Promise<VectorHit[]> {
  const trimmed = query.trim();
  if (!trimmed || vectorCount() === 0) return [];
  const queryVector = await embedText(trimmed);
  return searchVectors(queryVector, options);
}
