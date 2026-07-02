/**
 * Persistence for the Database tab's SQL text, scoped per project so each
 * canvas project keeps its own schema. Backend first (survives across
 * browsers), localStorage as the offline fallback, seeded SQL as last resort.
 */

import { PORTS } from '@archlab/shared';
import { loadJSON, saveJSON } from './storage.js';

const BASE = `http://127.0.0.1:${PORTS.backend}`;
const LOCAL_KEY = 'archlab.database.sql.v1';

function localKeyFor(projectId?: string | null): string {
  return projectId ? `${LOCAL_KEY}:${projectId}` : LOCAL_KEY;
}

export async function loadSchema(fallbackSql: string, projectId?: string | null): Promise<string> {
  try {
    const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    const res = await fetch(`${BASE}/schema${query}`);
    const data = await res.json();
    if (data?.ok && data.sql && data.sql.trim() !== '') {
      return data.sql;
    }
  } catch {
    /* backend offline; use local fallback */
  }
  const local = loadJSON<string>(localKeyFor(projectId), fallbackSql);
  if (!local || local.trim() === '') return fallbackSql;
  return local;
}

export async function saveSchema(sql: string, projectId?: string | null): Promise<void> {
  saveJSON(localKeyFor(projectId), sql);
  try {
    await fetch(`${BASE}/schema`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql, projectId: projectId ?? undefined }),
    });
  } catch {
    /* backend offline; local fallback already saved */
  }
}
