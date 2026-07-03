/**
 * Thin client for the Code Intelligence REST endpoints on the backend.
 * Everything stays on localhost; these mirror the routes in backend/index.ts.
 */

import {
  PORTS,
  type FileIntel,
  type CodeReference,
  type ImpactAnalysis,
  type ApplyResult,
  type SquiggleMarker,
} from '@archlab/shared';

const BASE = `http://127.0.0.1:${PORTS.backend}`;

/** Result of a file-intel load: the parsed intel, or a clear error message. */
export interface FileIntelResult {
  intel: FileIntel | null;
  error: string | null;
}

/** Load the full code-intelligence view (classified lines + symbols) of a file. */
export async function fetchFileIntel(projectId: string, relPath: string): Promise<FileIntelResult> {
  const url = `${BASE}/code/file?projectId=${encodeURIComponent(projectId)}&path=${encodeURIComponent(relPath)}`;
  const request = async () => {
    const response = await fetch(url);
    return response.json();
  };
  try {
    const res = await request();
    if (res?.ok) return { intel: res.intel as FileIntel, error: null };
    return { intel: null, error: typeof res?.error === 'string' ? res.error : 'Unknown error loading file.' };
  } catch (firstErr) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    try {
      const res = await request();
      if (res?.ok) return { intel: res.intel as FileIntel, error: null };
      return { intel: null, error: typeof res?.error === 'string' ? res.error : 'Unknown error loading file.' };
    } catch {
      return {
        intel: null,
        error: `Backend file loader is unavailable. Make sure the ArchLab backend is running, then reopen this node. Original error: ${String(firstErr)}`,
      };
    }
  }
}

/** Every project reference to the symbol declared on a line. */
export async function fetchReferences(
  projectId: string,
  relPath: string,
  line: number,
  symbol: string,
): Promise<CodeReference[]> {
  const url =
    `${BASE}/code/references?projectId=${encodeURIComponent(projectId)}` +
    `&path=${encodeURIComponent(relPath)}&line=${line}&symbol=${encodeURIComponent(symbol)}`;
  const res = await fetch(url).then((r) => r.json()).catch(() => null);
  return res?.ok ? (res.references as CodeReference[]) : [];
}

/** Run Impact Analysis for an action on a line (no writes). */
export async function fetchImpact(
  projectId: string,
  relPath: string,
  line: number,
  actionId: string,
): Promise<ImpactAnalysis | null> {
  const res = await fetch(`${BASE}/code/impact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, path: relPath, line, actionId }),
  })
    .then((r) => r.json())
    .catch(() => null);
  return res?.ok ? (res.impact as ImpactAnalysis) : null;
}

/** Impact Analysis for a free-form full-file edit made in the panel (no writes). */
export async function fetchEditImpact(
  projectId: string,
  relPath: string,
  content: string,
): Promise<ImpactAnalysis | null> {
  const res = await fetch(`${BASE}/code/edit-impact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, path: relPath, content }),
  })
    .then((r) => r.json())
    .catch(() => null);
  return res?.ok ? (res.impact as ImpactAnalysis) : null;
}

/** Live syntax check of an unsaved buffer; returns squiggles for the edited text. */
export async function checkSyntax(relPath: string, content: string): Promise<SquiggleMarker[]> {
  const res = await fetch(`${BASE}/code/syntax-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: relPath, content }),
  })
    .then((r) => r.json())
    .catch(() => null);
  return res?.ok ? (res.squiggles as SquiggleMarker[]) : [];
}

/** Write an Impact Analysis to disk (backs up first, then re-analyzes). */
export async function applyImpact(
  projectId: string,
  impact: ImpactAnalysis,
): Promise<ApplyResult | null> {
  const res = await fetch(`${BASE}/code/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, impact }),
  })
    .then((r) => r.json())
    .catch(() => null);
  return res as ApplyResult | null;
}
