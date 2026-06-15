/**
 * Brain access control — the bouncer at the door.
 *
 * Two layers, both at the *access* layer (the files themselves are never
 * encrypted, so reads and writes stay fast):
 *
 *   Layer 1 — local password lock. A password is hashed (scrypt + per-install
 *     salt) and stored locally, never in plain text. While the brain is locked,
 *     nothing gets through: the panel shows nothing and the MCP server serves
 *     nothing. Unlock state is a sentinel file so the separate MCP process can
 *     see it too.
 *
 *   Layer 2 — permissions. Fine-grained control over what may be read even when
 *     unlocked: patterns, insights, per-project findings, and a list of fully
 *     locked projects that no AI tool can reach via MCP.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { BrainAccessStatus, BrainPermissions, BrainState } from '@archlab/shared';
import { BRAIN_DIR } from './paths.js';

const ACCESS_FILE = path.join(BRAIN_DIR, 'access.json');
/** Presence of this file means "unlocked this session". Removed on lock/start. */
const UNLOCK_FILE = path.join(BRAIN_DIR, '.unlocked');

interface AccessConfig {
  passwordHash: string | null;
  salt: string | null;
  permissions: BrainPermissions;
}

const DEFAULT_PERMISSIONS: BrainPermissions = {
  patterns: true,
  insights: true,
  projectFindings: true,
  lockedProjects: [],
  mcpEnabled: true,
};

/** Load the access config from disk, falling back to open defaults. */
export function loadAccess(): AccessConfig {
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

function saveAccess(cfg: AccessConfig): void {
  fs.mkdirSync(BRAIN_DIR, { recursive: true });
  fs.writeFileSync(ACCESS_FILE, JSON.stringify(cfg, null, 2), 'utf8');
}

/** scrypt hash of a password with a per-install salt, as hex. */
function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export function hasPassword(): boolean {
  return Boolean(loadAccess().passwordHash);
}

/** Set (or change) the local password. Re-locks afterwards. */
export function setPassword(password: string): void {
  const cfg = loadAccess();
  const salt = crypto.randomBytes(16).toString('hex');
  cfg.salt = salt;
  cfg.passwordHash = hashPassword(password, salt);
  saveAccess(cfg);
  lock(); // setting/changing a password always re-locks
}

/** Remove the local password entirely (no lock screen on future launches). */
export function removePassword(): void {
  const cfg = loadAccess();
  cfg.passwordHash = null;
  cfg.salt = null;
  saveAccess(cfg);
  unlock(); // nothing to lock anymore
}

/** Verify a password against the stored hash in constant time. */
export function verifyPassword(password: string): boolean {
  const cfg = loadAccess();
  if (!cfg.passwordHash || !cfg.salt) return true; // no password set: always open
  const candidate = hashPassword(password, cfg.salt);
  const a = Buffer.from(candidate, 'hex');
  const b = Buffer.from(cfg.passwordHash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function unlock(): void {
  fs.mkdirSync(BRAIN_DIR, { recursive: true });
  fs.writeFileSync(UNLOCK_FILE, new Date().toISOString(), 'utf8');
}

export function lock(): void {
  try {
    fs.rmSync(UNLOCK_FILE, { force: true });
  } catch {
    /* already gone */
  }
}

/** Locked when a password is set and the session has not been unlocked. */
export function isLocked(): boolean {
  return hasPassword() && !fs.existsSync(UNLOCK_FILE);
}

export function getPermissions(): BrainPermissions {
  return loadAccess().permissions;
}

export function setPermissions(permissions: Partial<BrainPermissions>): void {
  const cfg = loadAccess();
  cfg.permissions = { ...cfg.permissions, ...permissions };
  saveAccess(cfg);
}

export function accessStatus(): BrainAccessStatus {
  return { hasPassword: hasPassword(), locked: isLocked(), permissions: getPermissions() };
}

/** Empty brain shape used when the gate is fully closed. */
function emptyBrain(brain: BrainState): BrainState {
  return { ...brain, projects: [], patterns: [], insights: [] };
}

/**
 * Apply the access gate to a brain snapshot. Returns an empty brain when locked,
 * otherwise filters out anything the permissions disallow.
 */
export function gateBrain(brain: BrainState): BrainState {
  if (isLocked()) return emptyBrain(brain);
  const perms = getPermissions();
  const projects = brain.projects
    .filter((p) => !perms.lockedProjects.includes(p.projectId))
    .map((p) =>
      perms.projectFindings
        ? p
        : { ...p, report: { ...p.report, diagnostics: [] } },
    );
  return {
    ...brain,
    projects,
    patterns: perms.patterns ? brain.patterns : [],
    insights: perms.insights ? brain.insights : [],
  };
}
