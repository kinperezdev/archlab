/**
 * Blueprint canvas persistence, backed by the backend file brain/blueprint.json.
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

/** Load the saved blueprint canvas from brain/blueprint.json (or local fallback). */
export async function loadIdeas(): Promise<IdeasDoc> {
  try {
    const res = await fetch(`${BASE}/blueprint`);
    const data = await res.json();
    if (data?.ok) return { nodes: data.nodes ?? [], edges: data.edges ?? [] };
  } catch {
    /* backend offline; use local fallback */
  }
  return loadJSON<IdeasDoc>(LOCAL_KEY, { nodes: [], edges: [] });
}

/** Persist the blueprint canvas to brain/blueprint.json (and local fallback). */
export async function saveIdeas(doc: IdeasDoc): Promise<void> {
  saveJSON(LOCAL_KEY, doc);
  try {
    await fetch(`${BASE}/blueprint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc),
    });
  } catch {
    /* backend offline; local fallback already saved */
  }
}

/** Append nodes (e.g. database tables) to the existing blueprint canvas. */
export async function appendToIdeas(nodes: unknown[]): Promise<void> {
  const current = await loadIdeas();
  await saveIdeas({ nodes: [...current.nodes, ...nodes], edges: current.edges });
}
