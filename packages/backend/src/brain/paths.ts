/**
 * Resolves the on-disk location of the global brain.
 *
 * The brain lives in `<repoRoot>/brain` by default so both the backend and the
 * standalone MCP server point at the exact same files. Override with the
 * ARCHLAB_BRAIN_DIR env var. Everything stays on localhost / local disk.
 */

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

/** Walk upward from a starting dir until we find the workspace root package.json. */
function findRepoRoot(startDir: string): string {
  let dir = startDir;
  // Stop at filesystem root to avoid an infinite loop.
  while (dir !== path.dirname(dir)) {
    const pkg = path.join(dir, 'package.json');
    if (fs.existsSync(pkg)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(pkg, 'utf8')) as { workspaces?: unknown };
        if (parsed.workspaces) return dir;
      } catch {
        // Ignore malformed package.json files and keep walking up.
      }
    }
    dir = path.dirname(dir);
  }
  // Fall back to the current working directory if no workspace root was found.
  return process.cwd();
}

const thisDir = path.dirname(fileURLToPath(import.meta.url));

/** Absolute path to the brain directory. */
export const BRAIN_DIR =
  process.env.ARCHLAB_BRAIN_DIR ?? path.join(findRepoRoot(thisDir), 'brain');

/** The single JSON file holding the canonical brain state. */
export const BRAIN_STATE_FILE = path.join(BRAIN_DIR, 'brain.json');

/** Per-project living-document markdown lives here. */
export const BRAIN_PROJECTS_DIR = path.join(BRAIN_DIR, 'projects');
