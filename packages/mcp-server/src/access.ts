/**
 * Read-only view of the brain access gate for the MCP server.
 *
 * The backend owns writes to `access.json` and the `.unlocked` sentinel; the MCP
 * server only reads them so it honours the same bouncer: serve nothing while
 * locked, and respect per-category / per-project permissions while unlocked.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
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
  mcpEnabled: true,
};

interface AccessConfig {
  passwordHash: string | null;
  salt: string | null;
  permissions: BrainPermissions;
}

function loadAccess(): AccessConfig {
  try {
    const raw = JSON.parse(fs.readFileSync(ACCESS_FILE, 'utf8'));
    return {
      passwordHash: typeof raw.passwordHash === 'string' ? raw.passwordHash : null,
      salt: typeof raw.salt === 'string' ? raw.salt : null,
      permissions: { ...DEFAULT_PERMISSIONS, ...(raw.permissions ?? {}) },
    };
  } catch {
    return { passwordHash: null, salt: null, permissions: { ...DEFAULT_PERMISSIONS } };
  }
}

/** Must match the backend's `expectedUnlockToken` exactly. */
function expectedUnlockToken(cfg: AccessConfig): string {
  return crypto.createHash('sha256').update(`${cfg.passwordHash}:${cfg.salt}`).digest('hex');
}

/** Locked when a password is set and the sentinel does not match the password. */
export function isLocked(): boolean {
  const cfg = loadAccess();
  if (!cfg.passwordHash) return false;
  try {
    const token = fs.readFileSync(UNLOCK_FILE, 'utf8').trim();
    return token !== expectedUnlockToken(cfg);
  } catch {
    return true;
  }
}

/** Global MCP kill switch: when disabled, every tool returns nothing. */
export function isMcpDisabled(): boolean {
  return loadAccess().permissions.mcpEnabled === false;
}

/** True when the gate is closed for any reason (locked or MCP disabled). */
export function isGated(): boolean {
  return isLocked() || isMcpDisabled();
}

export function getPermissions(): BrainPermissions {
  return loadAccess().permissions;
}

/** Standard message returned by every tool while the brain is locked. */
export const LOCKED_MESSAGE =
  'The ArchLab brain is locked. Unlock it in ArchLab (enter the local password) before any brain data can be read.';

/** Message returned when the global MCP switch is off. */
export const MCP_DISABLED_MESSAGE =
  'ArchLab MCP access is disabled. Enable it in ArchLab (Brain Security) to allow AI tools to read brain data.';
