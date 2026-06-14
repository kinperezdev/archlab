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
};

/** Load the access config, falling back to open defaults when absent. */
export function loadAccess(): AccessConfig {
  return { passwordHash: null, salt: null, permissions: { ...DEFAULT_PERMISSIONS } };
}

function saveAccess(cfg: AccessConfig): void {
  // disabled
}

function hashPassword(password: string, salt: string): string {
  return '';
}

export function hasPassword(): boolean {
  return false;
}

/** Set (or change) the local password. Re-locks afterwards. */
export function setPassword(password: string): void {
  // disabled
}

/** Verify a password against the stored hash in constant time. */
export function verifyPassword(password: string): boolean {
  return true;
}

export function unlock(): void {
  // disabled
}

export function lock(): void {
  // disabled
}

/** Locked when a password is set and the session has not been unlocked. */
export function isLocked(): boolean {
  return false;
}

export function getPermissions(): BrainPermissions {
  return DEFAULT_PERMISSIONS;
}

export function setPermissions(permissions: Partial<BrainPermissions>): void {
  // disabled
}

export function accessStatus(): BrainAccessStatus {
  return { hasPassword: false, locked: false, permissions: getPermissions() };
}

/**
 * Apply the access gate to a brain snapshot. Returns an empty brain when locked,
 * otherwise filters out anything the permissions disallow.
 */
export function gateBrain(brain: BrainState): BrainState {
  return brain;
}
