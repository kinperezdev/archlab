/**
 * Architecture advisories — proactive, gap-finding guidance raised during the
 * Architecture Mapping step.
 *
 * Instead of only reporting bugs, ArchLab looks at the SHAPE of the project and
 * tells you what is structurally missing: "this app has screens but no backend",
 * "these screens call APIs that don't exist yet", "no database", "auth screens
 * with no auth layer". Each advisory includes a ready-to-paste build prompt so
 * you (or an AI agent) can close the gap immediately.
 */

import crypto from 'node:crypto';
import type { CanvasNode, Diagnostic, Severity } from '@archlab/shared';
import type { AnalysisResult } from '../analyzer/analyzer.js';

/** Regex matching frontend API calls, to see which screens expect a backend. */
const FETCH_RE = /(?:fetch|axios(?:\.\w+)?)\(\s*[`'"]([^`'"]+)[`'"]/g;

function advisory(
  severity: Severity,
  title: string,
  what: string,
  why: string,
  howToFix: string,
  optimization: string,
  suggestedPrompt: string,
  relatedNodeIds: string[] = [],
): Diagnostic {
  return {
    id: crypto.randomUUID(),
    step: 'architecture-mapping',
    severity,
    title,
    what,
    why,
    howToFix,
    optimization,
    suggestedPrompt,
    relatedNodeIds,
  };
}

/** Frontend nodes that represent user-facing screens. */
function screens(nodes: CanvasNode[]): CanvasNode[] {
  return nodes.filter((n) => n.lane === 'frontend' && (n.kind === 'route' || n.kind === 'component'));
}

/** Collect the API paths the frontend tries to call. */
function intendedApiCalls(analysis: AnalysisResult): string[] {
  const calls = new Set<string>();
  for (const f of analysis.scan.files) {
    if (!f.content) continue;
    const node = analysis.canvas.nodes.find((n) => n.filePath === f.relPath);
    if (!node || node.lane !== 'frontend') continue;
    for (const m of f.content.matchAll(FETCH_RE)) {
      const url = m[1];
      if (url.startsWith('/') || url.includes('/api') || url.startsWith('http')) calls.add(url);
    }
  }
  return [...calls];
}

/** Produce architecture advisories for the analyzed project. */
export function architectureAdvisories(analysis: AnalysisResult): Diagnostic[] {
  const out: Diagnostic[] = [];
  const nodes = analysis.canvas.nodes;
  const hasFrontend = nodes.some((n) => n.lane === 'frontend');
  const hasBackend = nodes.some((n) => n.lane === 'backend');
  const hasDb = nodes.some((n) => n.kind === 'database');
  const hasAuth = nodes.some((n) => n.kind === 'auth');
  const frontScreens = screens(nodes);
  const apiCalls = intendedApiCalls(analysis);

  // 1. App/web with a UI but no backend at all.
  if (hasFrontend && !hasBackend) {
    const screenList = frontScreens.map((s) => `  - ${s.label}`).join('\n') || '  - (your screens)';
    const callList = apiCalls.length
      ? `\nThese screens already try to call APIs that have nowhere to go:\n${apiCalls
          .map((c) => `  - ${c}`)
          .join('\n')}`
      : '';

    out.push(
      advisory(
        'high',
        'No backend detected — add a backend first',
        `This project has a frontend (${frontScreens.length} screen(s)) but no backend was found. The app can render, but it has nothing to store data, authenticate users, or serve dynamic content.${callList}`,
        'A frontend alone cannot persist data, keep secrets, or enforce access control. Any feature beyond static display needs a backend to connect to.',
        `Add a backend service first, then connect each screen to it. Start with:\n` +
          `1. A server (Express/Fastify/Next API routes) exposing JSON endpoints.\n` +
          `2. One endpoint per screen that needs data.\n` +
          `3. A data layer (database) the endpoints read/write.\n` +
          `4. Wire each screen's fetch call to its endpoint.\n\nScreens to connect:\n${screenList}`,
        'Once the backend exists, add auth and a database so the screens can show real, per-user data.',
        buildBackendPrompt(analysis, frontScreens, apiCalls),
        frontScreens.map((s) => s.id),
      ),
    );
  }

  // 2. Frontend calls APIs but no endpoint nodes resolve (broken/absent wiring).
  if (hasBackend && apiCalls.length > 0) {
    const endpointLabels = nodes
      .filter((n) => n.kind === 'endpoint')
      .map((n) => n.label.toLowerCase());
    const unmatched = apiCalls.filter((c) => {
      const seg = c.split('?')[0].split('/').filter(Boolean).pop() ?? '';
      return seg && !endpointLabels.some((l) => l.includes(seg.toLowerCase()));
    });
    if (unmatched.length > 0) {
      out.push(
        advisory(
          'medium',
          'Screens call APIs that have no matching endpoint',
          `The frontend calls ${unmatched.length} API path(s) that don't map to any detected backend endpoint:\n${unmatched
            .map((u) => `  - ${u}`)
            .join('\n')}`,
          'A screen calling a missing endpoint will fail at runtime with a 404 or network error.',
          'Create a backend endpoint for each listed path, or fix the frontend URL to match an existing endpoint.',
          'Generate a typed API client so the frontend and backend share one contract and drift like this is caught at build time.',
          `In the backend, add handlers for these routes and return JSON:\n${unmatched.join('\n')}`,
        ),
      );
    }
  }

  // 3. Backend with no persistence.
  if (hasBackend && !hasDb) {
    out.push(
      advisory(
        'medium',
        'No database / persistence layer',
        'A backend exists but no database or data model was detected.',
        'Without persistence the backend cannot remember anything between requests or restarts.',
        'Add a database (Postgres/SQLite) and a data layer (Prisma/Drizzle), then have endpoints read/write through it.',
        'Add migrations and seed data so the schema is reproducible across environments.',
        'Add a database to this project: set up Prisma (or Drizzle) with a Postgres schema, generate the client, and connect the existing endpoints to read and write through it.',
      ),
    );
  }

  // 4. Auth-looking screens but no auth layer.
  const looksLikeAuthUi = frontScreens.some((s) => /(login|signup|sign-in|auth|account|register)/i.test(s.label));
  if (looksLikeAuthUi && !hasAuth) {
    out.push(
      advisory(
        'high',
        'Auth screens with no authentication layer',
        'There are login/signup style screens, but no authentication layer was detected on the backend.',
        'Login UI without a real auth backend is non-functional and dangerously misleading.',
        'Add an auth layer: session or JWT issuance, password hashing, protected-route middleware, then connect the auth screens to it.',
        'Consider a managed auth provider (Clerk/Auth.js) to avoid hand-rolling credential security.',
        'Add authentication: create signup/login endpoints with hashed passwords and JWT or session cookies, add middleware to protect routes, and wire the existing login/signup screens to these endpoints.',
        frontScreens.filter((s) => /(login|signup|auth|account|register)/i.test(s.label)).map((s) => s.id),
      ),
    );
  }

  return out;
}

/** Build a concrete, copy-paste prompt for scaffolding the missing backend. */
function buildBackendPrompt(
  analysis: AnalysisResult,
  frontScreens: CanvasNode[],
  apiCalls: string[],
): string {
  const stack = analysis.techStack.join(', ') || 'the existing frontend stack';
  const screensTxt = frontScreens.map((s) => s.label).join(', ') || 'all screens';
  const endpoints = apiCalls.length
    ? apiCalls.join(', ')
    : 'one endpoint per screen that needs data';

  return [
    `Add a backend to this ${stack} project.`,
    ``,
    `1. Scaffold a Node + TypeScript server (Express or Fastify) that runs on localhost.`,
    `2. Create JSON REST endpoints for: ${endpoints}.`,
    `3. Add a database layer (Prisma + SQLite/Postgres) with models for the data these screens show.`,
    `4. Add input validation (Zod) and centralized error handling on every endpoint.`,
    `5. Connect these frontend screens to the new endpoints: ${screensTxt}.`,
    `6. Add CORS for the frontend origin and an auth layer if any screen is user-specific.`,
    ``,
    `Keep everything typed end to end and return a consistent { success, data, error } envelope.`,
  ].join('\n');
}
