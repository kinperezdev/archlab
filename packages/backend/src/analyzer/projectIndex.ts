/**
 * Persistent project index.
 *
 * Maps each analyzed project's id to the folder it was scanned from, on local
 * disk, so checks can always recover the project even after a backend restart
 * or a page refresh. The project id is a deterministic hash of the root path,
 * so re-analyzing the remembered path always reproduces the same project.
 *
 * This is a tiny local JSON file. Nothing leaves the machine.
 */

import fs from 'node:fs';
import path from 'node:path';
import { BRAIN_DIR } from '../brain/paths.js';

const INDEX_FILE = path.join(BRAIN_DIR, 'projects_index.json');

export interface RememberedProject {
  projectId: string;
  rootPath: string;
  name: string;
  analyzedAt: string;
}

type Index = Record<string, RememberedProject>;

/** Read the whole index, tolerating a missing or malformed file. */
function readIndex(): Index {
  try {
    if (!fs.existsSync(INDEX_FILE)) return {};
    return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8')) as Index;
  } catch {
    return {};
  }
}

/** Persist a project's id -> root path mapping immediately after analysis. */
export function rememberProject(projectId: string, rootPath: string, name: string): void {
  const index = readIndex();
  index[projectId] = { projectId, rootPath, name, analyzedAt: new Date().toISOString() };
  try {
    fs.mkdirSync(path.dirname(INDEX_FILE), { recursive: true });
    fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2), 'utf8');
  } catch {
    // Best-effort persistence; in-memory analysis still works this session.
  }
}

/** Look up a previously analyzed project's root path by id, if known. */
export function recallProject(projectId: string): RememberedProject | null {
  return readIndex()[projectId] ?? null;
}

/** Get the most recently analyzed project to initialize paths after restart. */
export function getLastAnalyzedProject(): RememberedProject | null {
  const index = readIndex();
  const items = Object.values(index);
  if (items.length === 0) return null;
  items.sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime());
  return items[0];
}
