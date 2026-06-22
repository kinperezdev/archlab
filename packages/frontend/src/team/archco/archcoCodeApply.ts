/**
 * ArchCo code-modification client.
 *
 * ArchCo can apply fixes to disk, but only inside directories the user has
 * allowlisted (the standing "permission"). The backend validates every write
 * (no traversal / symlink escape), backs up the original, and logs the change.
 */

import { PORTS } from '@archlab/shared';
import { completeWithProvider, type AIProviderConfig } from './multiProviderAI.js';

const BASE = `http://127.0.0.1:${PORTS.backend}`;

export interface ProposedFix {
  path: string;
  content: string;
  summary: string;
}

export interface ApplyResult {
  ok: boolean;
  applied?: boolean;
  path?: string;
  created?: boolean;
  error?: string;
  /** Set when the target path is outside the allowlist. */
  needsApproval?: boolean;
}

export interface CodeChange {
  path: string;
  bytes: number;
  created: boolean;
  note: string;
  at: number;
}

export async function getAllowlist(): Promise<string[]> {
  try {
    const r = await fetch(`${BASE}/api/archco/allowlist`);
    const d = await r.json();
    return Array.isArray(d?.paths) ? d.paths : [];
  } catch {
    return [];
  }
}

export async function setAllowlist(paths: string[]): Promise<string[]> {
  const r = await fetch(`${BASE}/api/archco/allowlist`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ paths }),
  });
  const d = await r.json();
  return Array.isArray(d?.paths) ? d.paths : [];
}

/** Grant ArchCo permission to write inside one more directory. */
export async function addAllowlistPath(dir: string): Promise<string[]> {
  const current = await getAllowlist();
  return setAllowlist([...new Set([...current, dir])]);
}

export async function applyChange(filePath: string, content: string, note = ''): Promise<ApplyResult> {
  try {
    const r = await fetch(`${BASE}/api/archco/apply`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ path: filePath, content, note }),
    });
    return await r.json();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'network error' };
  }
}

export async function listChanges(): Promise<CodeChange[]> {
  try {
    const r = await fetch(`${BASE}/api/archco/changes`);
    const d = await r.json();
    return Array.isArray(d?.changes) ? d.changes : [];
  } catch {
    return [];
  }
}

/**
 * Ask the active AI provider to propose a concrete file edit for a fix. Returns
 * null when no provider is available or the model didn't return usable JSON —
 * the caller then falls back (e.g. copy the fix prompt for manual application).
 */
export async function proposeFix(
  provider: AIProviderConfig,
  projectRoot: string,
  issueTitle: string,
  fixPrompt: string,
): Promise<ProposedFix | null> {
  if (!provider.available || !projectRoot) return null;
  const system = `You are a senior engineer applying a single fix in the project rooted at ${projectRoot}.
Return ONLY valid JSON, no markdown:
{ "path": "<absolute path to the one file to change, under the project root>", "content": "<the COMPLETE new file content>", "summary": "<one-line description of the change>" }
Choose the single most relevant existing file and output its entire new content, not a diff.`;
  const user = `Issue: ${issueTitle}\nFix to apply: ${fixPrompt}`;
  const { text, error } = await completeWithProvider(provider, system, user, 2000);
  if (error) return null;
  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    if (typeof parsed.path === 'string' && typeof parsed.content === 'string') {
      return { path: parsed.path, content: parsed.content, summary: String(parsed.summary ?? '') };
    }
  } catch {
    /* model returned non-JSON */
  }
  return null;
}
