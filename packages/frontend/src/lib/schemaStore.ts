/**
 * Persistence for the Database tab's SQL text. Backend first (survives across
 * browsers), localStorage as the offline fallback, seeded SQL as last resort.
 */

import { PORTS } from '@archlab/shared';
import { loadJSON, saveJSON } from './storage.js';

const BASE = `http://127.0.0.1:${PORTS.backend}`;
const LOCAL_KEY = 'archlab.database.sql.v1';

export async function loadSchema(fallbackSql: string): Promise<string> {
  try {
    const res = await fetch(`${BASE}/schema`);
    const data = await res.json();
    if (data?.ok && data.sql && data.sql.trim() !== '') {
      return data.sql;
    }
  } catch {
    /* backend offline; use local fallback */
  }
  const local = loadJSON<string>(LOCAL_KEY, fallbackSql);
  if (!local || local.trim() === '') return fallbackSql;
  return local;
}

export async function saveSchema(sql: string): Promise<void> {
  saveJSON(LOCAL_KEY, sql);
  try {
    await fetch(`${BASE}/schema`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql }),
    });
  } catch {
    /* backend offline; local fallback already saved */
  }
}
