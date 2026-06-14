/**
 * Client helpers for the brain access gate (Layer 1 password lock + Layer 2
 * permissions). Thin wrappers over the backend REST endpoints.
 */

import { PORTS, type BrainAccessStatus, type BrainPermissions, type BrainState } from '@archlab/shared';

const BASE = `http://127.0.0.1:${PORTS.backend}`;

async function postJson(path: string, body?: unknown): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function fetchAccessStatus(): Promise<BrainAccessStatus> {
  const res = await fetch(`${BASE}/access/status`);
  const data = await res.json();
  return { hasPassword: data.hasPassword, locked: data.locked, permissions: data.permissions };
}

export async function setBrainPassword(password: string): Promise<BrainAccessStatus> {
  const res = await postJson('/access/set-password', { password });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error ?? 'Could not set password.');
  return data;
}

export async function unlockBrain(password: string): Promise<BrainAccessStatus> {
  const res = await postJson('/access/unlock', { password });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error ?? 'Incorrect password.');
  return data;
}

export async function lockBrain(): Promise<BrainAccessStatus> {
  const res = await postJson('/access/lock');
  return res.json();
}

export async function updateBrainPermissions(
  permissions: Partial<BrainPermissions>,
): Promise<BrainAccessStatus> {
  const res = await postJson('/access/permissions', { permissions });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error ?? 'Could not update permissions.');
  return data;
}

/** Fetch the gated brain (used to list projects for the permissions UI). */
export async function fetchBrain(): Promise<BrainState> {
  const res = await fetch(`${BASE}/brain`);
  return res.json();
}
