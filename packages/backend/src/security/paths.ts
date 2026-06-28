/**
 * Path containment helpers.
 *
 * ArchLab reads and writes files on behalf of the UI. Any path that originates
 * from a request (a node's stored path, a code-apply payload, a URL param) must
 * be proven to stay inside its intended project root before it touches disk.
 * Otherwise a crafted "../../.." path can read or overwrite files anywhere the
 * process can reach (SSH keys, shell rc files, the brain's own secrets).
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Resolve `relPath` against `root` and guarantee the result stays inside
 * `root`. Returns the absolute path on success, or `null` if the path escapes
 * the root (traversal) — callers must treat `null` as a hard rejection.
 *
 * Symlinks are resolved with `fs.realpathSync` when the target exists so a
 * symlink inside the root cannot point outside it. When the target does not
 * exist yet (a new file being written) we fall back to a lexical check.
 */
export function resolveWithin(root: string, relPath: string): string | null {
  const safeRoot = path.resolve(root);
  // Treat absolute inputs as relative to the root: a stored path that begins
  // with "/" must never bypass the root.
  const cleaned = relPath.replace(/^[/\\]+/, '');
  const candidate = path.resolve(safeRoot, cleaned);

  const realRoot = safeReal(safeRoot);
  const realCandidate = fs.existsSync(candidate) ? safeReal(candidate) : candidate;

  if (realCandidate === realRoot) return realCandidate;
  if (realCandidate.startsWith(realRoot + path.sep)) return realCandidate;
  return null;
}

/** Resolve symlinks where possible; fall back to the lexical path. */
function safeReal(p: string): string {
  try {
    return fs.realpathSync(p);
  } catch {
    return p;
  }
}
