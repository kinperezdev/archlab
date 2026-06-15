/**
 * Code action engine.
 *
 * Turns a "what you can do here" action into a project-wide Impact Analysis:
 * deterministic before/after diffs for the edited file plus any other files the
 * change ripples into (e.g. callers that must `await` a now-async function).
 *
 * Applying an analysis backs every touched file up to brain/backups/<ts>/ first,
 * then writes the new content to disk. Nothing is destructive without a backup.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { AffectedFile, DiffHunk, ImpactAnalysis, ApplyResult } from '@archlab/shared';
import type { AnalysisResult } from './analyzer.js';
import { readFileForIntel, findReferences } from './codeIntel.js';
import { BRAIN_DIR } from '../brain/paths.js';

/** Leading whitespace of a line, so inserted code matches its surroundings. */
function indentOf(line: string): string {
  return line.match(/^\s*/)?.[0] ?? '';
}

/** Build a pure-insertion hunk that drops `after` in just below `line`. */
function insertAfter(lineNo: number, indent: string, after: string[]): DiffHunk {
  return { startLine: lineNo + 1, before: [], after: after.map((l) => (l ? indent + l : l)) };
}

/** Build a pure-insertion hunk that drops `after` just above `line`. */
function insertBefore(lineNo: number, indent: string, after: string[]): DiffHunk {
  return { startLine: lineNo, before: [], after: after.map((l) => (l ? indent + l : l)) };
}

/** Snippets keyed by action id — the code each additive action injects. */
const SNIPPETS: Record<string, string[]> = {
  'add-auth-check': [
    '// Require an authenticated user before continuing.',
    'if (!req.user) return res.status(401).json({ error: "Unauthorized" });',
  ],
  'add-rate-limiting': [
    '// Throttle this handler to protect it from abuse.',
    'app.use(rateLimit({ windowMs: 60_000, max: 100 }));',
  ],
  'add-input-validation': [
    '// Validate incoming data at the boundary before using it.',
    'const parsed = inputSchema.safeParse(req.body);',
    'if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });',
  ],
  'add-error-handling': [
    'try {',
    '  // ... existing logic',
    '} catch (err) {',
    '  console.error(err);',
    '  return res.status(500).json({ error: "Internal error" });',
    '}',
  ],
  'add-db-query': [
    '// Fetch the records this handler needs.',
    'const rows = await db.query("SELECT * FROM table WHERE id = $1", [id]);',
  ],
  'add-logging': ['console.info("[trace]", { at: new Date().toISOString() });'],
  'add-caching': [
    '// Serve from cache when available, fall back to the source.',
    'const cached = await cache.get(cacheKey);',
    'if (cached) return cached;',
  ],
  'add-pagination': [
    '// Bound the result set so large tables stay fast.',
    'const limit = Math.min(Number(req.query.limit ?? 20), 100);',
    'const offset = Number(req.query.offset ?? 0);',
  ],
  'add-type': ['type Payload = { id: string; createdAt: Date };'],
  'wrap-async': [
    '(async () => {',
    '  // ... awaited work',
    '})().catch((err) => console.error(err));',
  ],
  'add-result-validation': [
    'if (!rows || rows.length === 0) return res.status(404).json({ error: "Not found" });',
  ],
  'extract-repository': [
    '// TODO: move this query into a repository function, e.g. repo.findById(id).',
  ],
  'extract-file': ['// TODO: extract this declaration into its own module and import it back.'],
  'add-test-stub': [
    '// test("describe the behaviour", () => {',
    '//   expect(subject()).toBe(expected);',
    '// });',
  ],
  'replace-library': ['// TODO: swap this dependency for the chosen alternative and update usages.'],
  // --- Structural-context actions ---
  'wrap-function-error-handling': [
    '// Wrap this function body in error handling.',
    'try {',
    '  // ... existing logic',
    '} catch (err) {',
    '  console.error(err);',
    '  throw err;',
    '}',
  ],
  'move-db-out-of-loop': [
    '// N+1 query: hoist this lookup out of the loop and batch it.',
    '// e.g. const rows = await db.query("SELECT * FROM t WHERE id = ANY($1)", [ids]);',
    '// then read from a Map inside the loop instead of querying per iteration.',
  ],
  'add-effect-deps': [
    '// Add the values this effect reads to the dependency array so it re-runs',
    '// when they change (avoids stale closures).',
  ],
  'add-memo': [
    '// Memoize derived values / callbacks to avoid unnecessary re-renders.',
    'const memoized = useMemo(() => compute(state), [state]);',
  ],
  'improve-error-handling': [
    '// Replace the bare log with a real error response / propagation.',
    'return res.status(500).json({ error: "Internal error" });',
  ],
  'add-transaction': [
    '// Run these writes inside a transaction so they commit or roll back together.',
    'await db.transaction(async (tx) => {',
    '  // ... move the queries here, using tx',
    '});',
  ],
  'add-connection-error-handling': [
    '// Handle connection failures explicitly.',
    'try {',
    '  await db.connect();',
    '} catch (err) {',
    '  console.error("DB connection failed", err);',
    '  throw err;',
    '}',
  ],
  'add-query-timeout': [
    '// Bound how long this query can run so a slow query cannot hang the request.',
    'const result = await Promise.race([',
    '  query,',
    '  new Promise((_, reject) => setTimeout(() => reject(new Error("query timeout")), 5000)),',
    ']);',
  ],
};

/** JSDoc block inserted above a function declaration. */
function jsdocFor(line: string): string[] {
  const name = line.match(/function\s+(\w+)/)?.[1] ?? line.match(/const\s+(\w+)/)?.[1] ?? 'this function';
  return ['/**', ` * ${name} — describe what it does.`, ' * @returns describe the result', ' */'];
}

/**
 * Convert a string-interpolated SQL query into a parameterized one. Best-effort:
 * replaces `${expr}` holes with `$1, $2, ...` and collects the expressions.
 */
function parameterizeSql(line: string): string | null {
  if (!/\$\{[^}]+\}/.test(line)) return null;
  const params: string[] = [];
  let idx = 0;
  const replaced = line.replace(/\$\{([^}]+)\}/g, (_m, expr) => {
    params.push(expr.trim());
    idx += 1;
    return `$${idx}`;
  });
  // Drop template backticks down to a normal string and append the params array.
  const normalized = replaced.replace(/`/g, '"');
  const trimmed = normalized.trimEnd().replace(/;?\s*$/, '');
  return `${trimmed}, [${params.join(', ')}]);`.replace(/\(\s*"/, '("');
}

/** Run Impact Analysis for one action on one line. */
export function analyzeImpact(
  analysis: AnalysisResult,
  projectId: string,
  relPath: string,
  line: number,
  actionId: string,
): ImpactAnalysis | null {
  const content = readFileForIntel(analysis, relPath);
  if (content === null) return null;
  const lines = content.split('\n');
  const target = lines[line - 1] ?? '';
  const indent = indentOf(target);
  const affected: AffectedFile[] = [];

  // 1. The edited file itself.
  const selfHunks: DiffHunk[] = [];
  let reason = 'The action is applied here.';

  if (actionId === 'add-jsdoc') {
    selfHunks.push(insertBefore(line, indent, jsdocFor(target)));
    reason = 'A documentation block is added above the declaration.';
  } else if (actionId === 'fix-sql-injection') {
    const fixed = parameterizeSql(target);
    if (fixed) {
      selfHunks.push({ startLine: line, before: [target], after: [indent + fixed.trim()] });
      reason = 'User input is moved out of the SQL string into bound parameters.';
    } else {
      selfHunks.push(insertBefore(line, indent, ['// Use bound parameters instead of string interpolation here.']));
      reason = 'A reminder to parameterize this query is added.';
    }
  } else if (actionId === 'convert-async' || actionId === 'convert-to-async') {
    if (!/\basync\b/.test(target)) {
      const next = target.replace(/(\bfunction\b)/, 'async $1').replace(/(const\s+\w+\s*=\s*)\(/, '$1async (');
      selfHunks.push({ startLine: line, before: [target], after: [next === target ? `${indent}async ${target.trim()}` : next] });
      reason = 'The function is marked async.';
    }
  } else if (SNIPPETS[actionId]) {
    selfHunks.push(insertAfter(line, indent, SNIPPETS[actionId]));
    reason = 'New code is inserted at this location.';
  } else {
    // Unknown action: insert a neutral marker so the preview is never empty.
    selfHunks.push(insertAfter(line, indent, [`// ${actionId}`]));
  }

  if (selfHunks.length > 0) affected.push({ path: relPath, reason, hunks: selfHunks });

  // 2. Cross-file ripple: making a function async means callers must await it.
  if ((actionId === 'convert-async' || actionId === 'convert-to-async')) {
    const name =
      target.match(/function\s+(\w+)/)?.[1] ?? target.match(/const\s+(\w+)/)?.[1] ?? null;
    if (name) {
      const refs = findReferences(analysis, name, relPath, line, 100);
      const byFile = new Map<string, DiffHunk[]>();
      for (const ref of refs) {
        if (!new RegExp(`\\b${name}\\s*\\(`).test(ref.snippet)) continue; // only call sites
        if (/\bawait\b/.test(ref.snippet)) continue; // already awaited
        const refLines = byFile.get(ref.path) ?? [];
        const refIndent = ref.snippet.match(/^\s*/)?.[0] ?? '';
        const updated = ref.snippet.replace(new RegExp(`(\\b${name}\\s*\\()`), 'await $1');
        refLines.push({ startLine: ref.line, before: [ref.snippet], after: [refIndent + updated] });
        byFile.set(ref.path, refLines);
      }
      for (const [p, hunks] of byFile) {
        affected.push({ path: p, reason: 'Caller must await the now-async function.', hunks });
      }
    }
  }

  const fileWord = affected.length === 1 ? 'file' : 'files';
  return {
    request: { projectId, path: relPath, line, actionId },
    summary: `This change affects ${affected.length} ${fileWord}. Here is what will update.`,
    affected,
  };
}

/**
 * Turn a free-form full-file edit into an Impact Analysis. Computes a minimal
 * line diff (trimming the common prefix and suffix) so the split view shows only
 * the region that actually changed, and the same hunk applies cleanly to disk.
 */
export function diffToImpact(
  projectId: string,
  relPath: string,
  original: string,
  edited: string,
): ImpactAnalysis {
  const o = original.split('\n');
  const n = edited.split('\n');

  let prefix = 0;
  while (prefix < o.length && prefix < n.length && o[prefix] === n[prefix]) prefix++;

  let suffix = 0;
  while (
    suffix < o.length - prefix &&
    suffix < n.length - prefix &&
    o[o.length - 1 - suffix] === n[n.length - 1 - suffix]
  ) {
    suffix++;
  }

  const before = o.slice(prefix, o.length - suffix);
  const after = n.slice(prefix, n.length - suffix);
  const changed = before.length > 0 || after.length > 0;

  const affected: AffectedFile[] = changed
    ? [
        {
          path: relPath,
          reason: 'Edited directly in the Code Intelligence Panel.',
          hunks: [{ startLine: prefix + 1, before, after }],
        },
      ]
    : [];

  return {
    request: { projectId, path: relPath, line: prefix + 1, actionId: 'manual-edit' },
    summary: changed
      ? 'This change affects 1 file. Here is what will update.'
      : 'No changes detected.',
    affected,
  };
}

/** Apply hunks to a file's lines, returning the new content. */
function applyHunks(content: string, hunks: DiffHunk[]): string {
  const lines = content.split('\n');
  // Apply bottom-up so earlier line numbers stay valid as we splice.
  const ordered = [...hunks].sort((a, b) => b.startLine - a.startLine);
  for (const h of ordered) {
    lines.splice(h.startLine - 1, h.before.length, ...h.after);
  }
  return lines.join('\n');
}

/**
 * Write an Impact Analysis to disk. Every touched file is first copied to a
 * timestamped backup folder so changes can be reverted by hand.
 */
export function applyImpact(analysis: AnalysisResult, impact: ImpactAnalysis): ApplyResult {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(BRAIN_DIR, 'backups', stamp);
  const written: string[] = [];

  try {
    for (const file of impact.affected) {
      const abs = path.join(analysis.rootPath, file.path);
      if (!fs.existsSync(abs)) continue;
      const original = fs.readFileSync(abs, 'utf8');

      // Back up first, preserving the project's folder structure.
      const backupPath = path.join(backupDir, file.path);
      fs.mkdirSync(path.dirname(backupPath), { recursive: true });
      fs.writeFileSync(backupPath, original, 'utf8');

      // Then write the updated content.
      const next = applyHunks(original, file.hunks);
      fs.writeFileSync(abs, next, 'utf8');
      written.push(file.path);
    }
    return { ok: true, backupDir, written };
  } catch (err) {
    return { ok: false, backupDir, written, error: String(err) };
  }
}
