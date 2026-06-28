/**
 * Doctor: system health + security self-check.
 *
 * `buildHealthReport` answers "is everything wired" (backend up, keys set, brain
 * readable, MCP found). `buildSecurityReport` lets the server introspect its OWN
 * hardening and report it truthfully to the UI — turning the security work into
 * a live, demoable surface. Every security row is tagged `real` or `deterrence`
 * so the panel can never overstate protection (see [[feedback-enterprise-...]]).
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { DoctorCheck, DoctorReport, CheckStatus } from '@archlab/shared';
import { BRAIN_DIR } from '../brain/paths.js';

/** Worst status across checks becomes the roll-up. */
function rollUp(checks: DoctorCheck[]): CheckStatus {
  if (checks.some((c) => c.status === 'fail')) return 'fail';
  if (checks.some((c) => c.status === 'warn')) return 'warn';
  return 'ok';
}

function report(checks: DoctorCheck[]): DoctorReport {
  return { status: rollUp(checks), checks, generatedAt: Date.now() };
}

/** System health: the "is everything plugged in" view. */
export function buildHealthReport(): DoctorReport {
  const checks: DoctorCheck[] = [];

  // Node runtime.
  const major = Number(process.versions.node.split('.')[0]);
  checks.push({
    id: 'node',
    label: 'Node runtime',
    status: major >= 18 ? 'ok' : 'warn',
    detail: `Node ${process.versions.node}${major >= 18 ? '' : ' (18+ recommended)'}`,
  });

  // Provider keys configured (presence only, never values).
  const keysFile = path.join(BRAIN_DIR, 'api_keys.json');
  let anyKey = false;
  try {
    if (fs.existsSync(keysFile)) {
      const k = JSON.parse(fs.readFileSync(keysFile, 'utf8'));
      anyKey = Boolean(k.anthropic || k.openai || k.gemini);
    }
  } catch {
    /* treated as no keys */
  }
  checks.push({
    id: 'ai-keys',
    label: 'AI provider key',
    status: anyKey ? 'ok' : 'warn',
    detail: anyKey ? 'At least one provider configured' : 'No provider key set (configure in API Keys)',
  });

  // Brain directory readable.
  let brainOk = false;
  try {
    brainOk = fs.existsSync(BRAIN_DIR) && fs.statSync(BRAIN_DIR).isDirectory();
  } catch {
    /* brainOk stays false */
  }
  checks.push({
    id: 'brain',
    label: 'Brain storage',
    status: brainOk ? 'ok' : 'fail',
    detail: brainOk ? 'Brain directory readable' : 'Brain directory missing or unreadable',
  });

  // Claude Desktop MCP config (informational).
  const mcpConfig = path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  const mcpFound = fs.existsSync(mcpConfig);
  checks.push({
    id: 'mcp-config',
    label: 'MCP config',
    status: mcpFound ? 'ok' : 'warn',
    detail: mcpFound ? 'Claude Desktop MCP config found' : 'No Claude Desktop MCP config (optional)',
  });

  return report(checks);
}

/**
 * Security self-check. `posture` is supplied by the server entry point, which
 * is the source of truth for how it configured itself, so these rows reflect the
 * ACTUAL running config rather than assumptions.
 */
export interface SecurityPosture {
  corsLocked: boolean;
  authRequired: boolean;
  keysAreBooleans: boolean;
  bodyLimited: boolean;
  rateLimited: boolean;
  unlockTokenBound: boolean;
  ssrfGuarded: boolean;
  pathSandboxed: boolean;
  boundToLocalhost: boolean;
}

export function buildSecurityReport(posture: SecurityPosture): DoctorReport {
  const ok = (v: boolean): CheckStatus => (v ? 'ok' : 'fail');
  const checks: DoctorCheck[] = [
    {
      id: 'cors',
      label: 'Cross-origin access locked',
      status: ok(posture.corsLocked),
      detail: posture.corsLocked ? 'CORS restricted to the ArchLab frontend' : 'CORS open to any origin',
      kind: 'real',
    },
    {
      id: 'auth',
      label: 'Auth required on endpoints',
      status: ok(posture.authRequired),
      detail: posture.authRequired ? 'Session token enforced on every route + WebSocket' : 'Endpoints unauthenticated',
      kind: 'real',
    },
    {
      id: 'keys',
      label: 'API keys never sent to the client',
      status: ok(posture.keysAreBooleans),
      detail: posture.keysAreBooleans ? 'Key endpoint returns presence booleans only' : 'Key values exposed over HTTP',
      kind: 'real',
    },
    {
      id: 'paths',
      label: 'File access sandboxed',
      status: ok(posture.pathSandboxed),
      detail: posture.pathSandboxed ? 'All file paths confined to the project root' : 'Paths can escape the project root',
      kind: 'real',
    },
    {
      id: 'ssrf',
      label: 'Outbound requests guarded',
      status: ok(posture.ssrfGuarded),
      detail: posture.ssrfGuarded ? 'MCP inspect blocks internal/metadata targets' : 'Server can be pointed at internal hosts',
      kind: 'real',
    },
    {
      id: 'unlock',
      label: 'Brain lock forgery-proof',
      status: ok(posture.unlockTokenBound),
      detail: posture.unlockTokenBound ? 'Unlock sentinel bound to the password' : 'Unlock can be forged with an empty file',
      kind: 'real',
    },
    {
      id: 'localhost',
      label: 'Backend bound to localhost',
      status: ok(posture.boundToLocalhost),
      detail: posture.boundToLocalhost ? 'Server listens on 127.0.0.1 only' : 'Server reachable beyond localhost',
      kind: 'real',
    },
    {
      id: 'ratelimit',
      label: 'Brute-force throttling',
      status: posture.rateLimited ? 'ok' : 'warn',
      detail: posture.rateLimited ? 'Password attempts are rate-limited' : 'No rate limit on password attempts',
      kind: 'deterrence',
    },
    {
      id: 'bodylimit',
      label: 'Request body size limit',
      status: posture.bodyLimited ? 'ok' : 'warn',
      detail: posture.bodyLimited ? 'Oversized requests rejected (uploads excepted)' : 'No request size limit',
      kind: 'deterrence',
    },
  ];

  return report(checks);
}
