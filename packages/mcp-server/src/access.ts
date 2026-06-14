/**
 * Read-only view of the brain access gate for the MCP server.
 *
 * The backend owns writes to `access.json` and the `.unlocked` sentinel; the MCP
 * server only reads them so it honours the same bouncer: serve nothing while
 * locked, and respect per-category / per-project permissions while unlocked.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BrainPermissions } from '@archlab/shared';

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
const ACCESS_FILE = path.join(BRAIN_DIR, 'access.json');
const UNLOCK_FILE = path.join(BRAIN_DIR, '.unlocked');

const DEFAULT_PERMISSIONS: BrainPermissions = {
  patterns: true,
  insights: true,
  projectFindings: true,
  lockedProjects: [],
};

interface AccessConfig {
  passwordHash: string | null;
  permissions: BrainPermissions;
}

function loadAccess(): AccessConfig {
  try {
    const raw = JSON.parse(fs.readFileSync(ACCESS_FILE, 'utf8'));
    return {
      passwordHash: typeof raw.passwordHash === 'string' ? raw.passwordHash : null,
      permissions: { ...DEFAULT_PERMISSIONS, ...(raw.permissions ?? {}) },
    };
  } catch {
    return { passwordHash: null, permissions: { ...DEFAULT_PERMISSIONS } };
  }
}

/** Locked when a password is set and the brain has not been unlocked. */
export function isLocked(): boolean {
  return Boolean(loadAccess().passwordHash) && !fs.existsSync(UNLOCK_FILE);
}

export function getPermissions(): BrainPermissions {
  return loadAccess().permissions;
}

/** Standard message returned by every tool while the brain is locked. */
export const LOCKED_MESSAGE =
  'The ArchLab brain is locked. Unlock it in ArchLab (enter the local password) before any brain data can be read.';
