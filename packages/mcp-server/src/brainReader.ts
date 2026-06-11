/**
 * Read-only access to the global brain for the MCP server.
 *
 * The MCP server only serves localhost connections and never writes the brain;
 * the backend owns writes. It resolves the same `<repoRoot>/brain/brain.json`
 * file (override with ARCHLAB_BRAIN_DIR).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BrainState } from '@archlab/shared';

function findRepoRoot(startDir: string): string {
  let dir = startDir;
  while (dir !== path.dirname(dir)) {
    const pkg = path.join(dir, 'package.json');
    if (fs.existsSync(pkg)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(pkg, 'utf8')) as { workspaces?: unknown };
        if (parsed.workspaces) return dir;
      } catch {
        /* keep walking */
      }
    }
    dir = path.dirname(dir);
  }
  return process.cwd();
}

const thisDir = path.dirname(fileURLToPath(import.meta.url));
const BRAIN_DIR = process.env.ARCHLAB_BRAIN_DIR ?? path.join(findRepoRoot(thisDir), 'brain');
const BRAIN_STATE_FILE = path.join(BRAIN_DIR, 'brain.json');

/** Read the brain, returning an empty shape if it does not exist yet. */
export function readBrain(): BrainState {
  try {
    return JSON.parse(fs.readFileSync(BRAIN_STATE_FILE, 'utf8')) as BrainState;
  } catch {
    return { version: 1, updatedAt: new Date().toISOString(), projects: [], patterns: [], insights: [] };
  }
}
