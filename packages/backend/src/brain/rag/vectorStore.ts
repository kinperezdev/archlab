/**
 * Vector store — persists embeddings next to the brain, on local disk only.
 *
 * Storage: a single JSON file (brain-vectors.json) inside BRAIN_DIR. At ArchLab's
 * scale (hundreds to low-thousands of brain entries) a brute-force cosine scan is
 * more than fast enough and needs zero extra infrastructure — no Postgres, no
 * pgvector, no dedicated vector database.
 *
 * Writes are atomic (temp file + rename) to match the rest of the brain store,
 * and updates are immutable (new arrays, never in-place mutation).
 */

import fs from 'node:fs';
import path from 'node:path';
import { BRAIN_DIR } from '../paths.js';

/** What kind of brain content a vector was derived from. */
export type VectorKind = 'wiki' | 'pattern' | 'insight';

/** One stored embedding plus the text and metadata it was built from. */
export interface VectorRecord {
  /** Stable id, namespaced by kind e.g. "wiki:<entryId>". */
  id: string;
  kind: VectorKind;
  /** The exact text that was embedded (used for display + re-ranking). */
  text: string;
  /** L2-normalized embedding of `text`. */
  vector: number[];
  /** Optional pointers back to the source record. */
  meta?: Record<string, unknown>;
}

/** A search hit: the stored record plus its similarity score in [-1, 1]. */
export interface VectorHit {
  record: VectorRecord;
  score: number;
}

const VECTORS_FILE = path.join(BRAIN_DIR, 'brain-vectors.json');

function readAll(): VectorRecord[] {
  try {
    if (!fs.existsSync(VECTORS_FILE)) return [];
    return JSON.parse(fs.readFileSync(VECTORS_FILE, 'utf8')) as VectorRecord[];
  } catch {
    return [];
  }
}

function writeAll(records: VectorRecord[]): void {
  fs.mkdirSync(path.dirname(VECTORS_FILE), { recursive: true });
  const tmp = `${VECTORS_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(records, null, 2), 'utf8');
  fs.renameSync(tmp, VECTORS_FILE);
  console.log(`[RAG] wrote ${records.length} vectors`);
}

/** Insert or replace records by id. Immutable: builds and persists a new array. */
export function upsertVectors(incoming: VectorRecord[]): void {
  if (incoming.length === 0) return;
  const incomingIds = new Set(incoming.map((r) => r.id));
  const kept = readAll().filter((r) => !incomingIds.has(r.id));
  writeAll([...kept, ...incoming]);
}

/** Remove records by id. */
export function removeVectors(ids: string[]): void {
  if (ids.length === 0) return;
  const drop = new Set(ids);
  const next = readAll().filter((r) => !drop.has(r.id));
  writeAll(next);
}

/** Total number of stored vectors. */
export function vectorCount(): number {
  return readAll().length;
}

/**
 * Cosine similarity of two L2-normalized vectors == their dot product.
 * Falls back to a full cosine calc if lengths ever disagree.
 */
function similarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return -1;
  let dot = 0;
  for (let i = 0; i < a.length; i += 1) dot += a[i] * b[i];
  return dot;
}

/** Return the top-k most similar records to a query vector, optionally by kind. */
export function searchVectors(
  queryVector: number[],
  options: { k?: number; kinds?: VectorKind[] } = {},
): VectorHit[] {
  const { k = 5, kinds } = options;
  const kindFilter = kinds ? new Set(kinds) : null;

  const scored: VectorHit[] = [];
  for (const record of readAll()) {
    if (kindFilter && !kindFilter.has(record.kind)) continue;
    scored.push({ record, score: similarity(queryVector, record.vector) });
  }

  return scored.sort((x, y) => y.score - x.score).slice(0, Math.max(0, k));
}
