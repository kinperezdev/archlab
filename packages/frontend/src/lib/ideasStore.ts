/**
 * Ideas canvas persistence, backed by the backend file brain/ideas.json.
 * Falls back to localStorage if the backend is unreachable so sketches are
 * never lost.
 */

import { PORTS } from '@archlab/shared';
import { loadJSON, saveJSON } from './storage.js';

const BASE = `http://127.0.0.1:${PORTS.backend}`;
const LOCAL_KEY = 'archlab.ideas.fallback.v1';

export interface IdeasDoc {
  nodes: unknown[];
  edges: unknown[];
}

/** Load the saved ideas canvas from brain/ideas.json (or local fallback). */
export async function loadIdeas(): Promise<IdeasDoc> {
  try {
    const res = await fetch(`${BASE}/ideas`);
    const data = await res.json();
    if (data?.ok) return { nodes: data.nodes ?? [], edges: data.edges ?? [] };
  } catch {
    /* backend offline; use local fallback */
  }
  return loadJSON<IdeasDoc>(LOCAL_KEY, { nodes: [], edges: [] });
}

/** Persist the ideas canvas to brain/ideas.json (and local fallback). */
export async function saveIdeas(doc: IdeasDoc): Promise<void> {
  saveJSON(LOCAL_KEY, doc);
  try {
    await fetch(`${BASE}/ideas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc),
    });
  } catch {
    /* backend offline; local fallback already saved */
  }
}

/** Append nodes (e.g. database tables) to the existing ideas canvas. */
export async function appendToIdeas(nodes: unknown[]): Promise<void> {
  const current = await loadIdeas();
  await saveIdeas({ nodes: [...current.nodes, ...nodes], edges: current.edges });
}
