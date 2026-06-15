/**
 * System Design (Design Mode) persistence, backed by brain/system-design.json.
 * Falls back to localStorage if the backend is unreachable so plans are never
 * lost. Mirrors the ideasStore pattern.
 */

import { PORTS } from '@archlab/shared';
import { loadJSON, saveJSON } from './storage.js';

const BASE = `http://127.0.0.1:${PORTS.backend}`;
const LOCAL_KEY = 'archlab.systemdesign.fallback.v1';

export interface SystemDesignDoc {
  nodes: unknown[];
  edges: unknown[];
}

/** Load the saved Design Mode canvas (or local fallback). */
export async function loadSystemDesign(): Promise<SystemDesignDoc> {
  try {
    const res = await fetch(`${BASE}/system-design`);
    const data = await res.json();
    if (data?.ok) return { nodes: data.nodes ?? [], edges: data.edges ?? [] };
  } catch {
    /* backend offline; use local fallback */
  }
  return loadJSON<SystemDesignDoc>(LOCAL_KEY, { nodes: [], edges: [] });
}

/** Persist the Design Mode canvas to brain/system-design.json (and local). */
export async function saveSystemDesign(doc: SystemDesignDoc): Promise<void> {
  saveJSON(LOCAL_KEY, doc);
  try {
    await fetch(`${BASE}/system-design`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc),
    });
  } catch {
    /* backend offline; local fallback already saved */
  }
}
