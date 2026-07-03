/**
 * Code-intelligence engine.
 *
 * Reads a single file from disk and produces the structured view the Code
 * Intelligence Panel renders: every line classified by role, explained in plain
 * English, and decorated with context-aware actions. It also resolves
 * cross-project references so a line can show "used in N files".
 *
 * Everything here is deterministic and heuristic — no AI calls. Heuristics are
 * tuned for JS/TS but degrade gracefully for other languages.
 */

import fs from 'node:fs';
import path from 'node:path';
import type {
  FileIntel,
  LineAction,
  LineContext,
  LineInfo,
  LineKind,
  ScopeKind,
  SymbolInfo,
  CodeReference,
} from '@archlab/shared';
import type { AnalysisResult } from './analyzer.js';
import { trackScopes, framesAtLine, type Frame } from './scopeTracker.js';
import { detectSyntaxSquiggles } from './syntaxCheck.js';
import { resolveWithin } from '../security/paths.js';

/**
 * Read a file's raw text from disk. The node only carries a path relative to
 * the analyzed project, so we join it onto the stored project root to get the
 * absolute path before reading. Falls back to the in-memory scan if disk read
 * fails (e.g. the file moved since the scan).
 */
export function readFileForIntel(analysis: AnalysisResult, relPath: string): string | null {
  // Resolve against the project root and reject anything that escapes it, so a
  // crafted relative or absolute path cannot read files outside the project.
  const abs = resolveWithin(analysis.rootPath, relPath);
  if (abs) {
    try {
      if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
        return fs.readFileSync(abs, 'utf8');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[code-intel] read failed for ${relPath}: ${String(err)}`);
    }
  }
  // Fall back to scanned content if we captured it earlier.
  const file = analysis.scan.files.find((f) => f.relPath === relPath);
  return file?.content ?? null;
}

// ---- Line classification --------------------------------------------------

/** Classify a single line into a coarse syntactic role. */
export function classifyLine(raw: string): LineKind {
  const line = raw.trim();
  if (line === '') return 'empty';
  if (line === '{' || line === '}' || line === '},' || line === '});' || line === ')') return 'brace';
  if (line.startsWith('//') || line.startsWith('/*') || line.startsWith('*') || line.startsWith('#')) {
    return 'comment';
  }
  if (/^import\b|^const\s+\w+\s*=\s*require\(|^from\s+\S+\s+import\b/.test(line)) return 'import';
  if (/\.(get|post|put|delete|patch|use|all)\s*\(\s*['"`]/.test(line) || /router\.(get|post|put|delete|patch|use)\b/.test(line)) {
    return 'route';
  }
  if (/\b(select|insert\s+into|update\s+\w+\s+set|delete\s+from)\b/i.test(line) ||
      /\.(query|findMany|findUnique|findFirst|aggregate|create|update|delete|deleteMany|raw)\s*\(/.test(line) ||
      /\b(prisma|db|knex|mongoose|collection)\.\w+/.test(line)) {
    return 'db-query';
  }
  if (/^(export\s+)?(interface|type)\s+\w+/.test(line)) return 'type';
  if (/^(export\s+)?(abstract\s+)?class\s+\w+/.test(line)) return 'class';
  if (/^(export\s+)?(default\s+)?(async\s+)?function\s+\w+/.test(line) ||
      /^(export\s+)?const\s+\w+\s*=\s*(async\s*)?\(?[^)]*\)?\s*=>/.test(line) ||
      /^\s*(public|private|protected|static|async)?\s*\w+\s*\([^)]*\)\s*[:{]/.test(line) && /[{]/.test(line)) {
    return 'function';
  }
  if (line.startsWith('export')) return 'export';
  if (/^(if|for|while|switch|else|try|catch|finally)\b/.test(line)) return 'control';
  if (line.startsWith('return')) return 'return';
  if (/<[A-Za-z][^>]*\/?>/.test(line) && /return|=>|\(/.test(raw)) return 'jsx';
  if (/^(const|let|var)\s+\w+\s*=/.test(line) || /^\w[\w.]*\s*=[^=]/.test(line)) return 'assignment';
  if (/\w+\s*\(.*\)\s*;?$/.test(line)) return 'call';
  return 'code';
}

/** A short plain-English description of what a line does, given its role. */
export function explainLine(raw: string, kind: LineKind): string {
  const line = raw.trim();
  switch (kind) {
    case 'empty':
      return 'Blank line — a natural insertion point for new code.';
    case 'comment':
      return 'A comment documenting the code around it.';
    case 'import': {
      const m = line.match(/from\s+['"]([^'"]+)['"]/) ?? line.match(/require\(\s*['"]([^'"]+)['"]/);
      return m ? `Imports functionality from "${m[1]}".` : 'Imports a dependency used in this file.';
    }
    case 'route': {
      const m = line.match(/\.(get|post|put|delete|patch|use|all)\s*\(\s*['"`]([^'"`]+)/i);
      return m ? `Registers an HTTP ${m[1].toUpperCase()} route at "${m[2]}".` : 'Registers an HTTP route handler.';
    }
    case 'db-query':
      return 'Runs a database query — reads or writes persisted data.';
    case 'function': {
      const m = line.match(/function\s+(\w+)/) ?? line.match(/const\s+(\w+)/) ?? line.match(/(\w+)\s*\(/);
      const name = m?.[1] ?? 'a function';
      return `Declares ${name === 'a function' ? name : `the function "${name}"`}${/async/.test(line) ? ' (async)' : ''}.`;
    }
    case 'class': {
      const m = line.match(/class\s+(\w+)/);
      return m ? `Declares the class "${m[1]}".` : 'Declares a class.';
    }
    case 'type': {
      const m = line.match(/(interface|type)\s+(\w+)/);
      return m ? `Declares the ${m[1]} "${m[2]}".` : 'Declares a type.';
    }
    case 'export':
      return 'Exports a value so other modules can import it.';
    case 'control':
      return 'Control flow — branches or loops over the logic below.';
    case 'return':
      return 'Returns a value from the current function.';
    case 'jsx':
      return 'Renders UI markup for this component.';
    case 'assignment':
      return 'Assigns a value to a variable.';
    case 'call':
      return 'Calls a function with the given arguments.';
    case 'brace':
      return 'A block delimiter.';
    default:
      return 'A line of source code.';
  }
}

// ---- Context-aware actions ------------------------------------------------

const A = (id: string, label: string, kind: LineAction['kind'] = 'edit'): LineAction => ({ id, label, kind });

/**
 * The base action set for a line, derived from its role and the file's type.
 * Pipeline-finding-driven priority actions are layered on by the frontend.
 */
export function baseActions(kind: LineKind, fileKind: string): LineAction[] {
  const routeFile = fileKind === 'route' || fileKind === 'endpoint';
  switch (kind) {
    case 'empty':
    case 'brace':
      return [
        A('add-auth-check', 'Add authentication check'),
        A('add-rate-limiting', 'Add rate limiting middleware'),
        A('add-input-validation', 'Add input validation'),
        A('add-error-handling', 'Add error handling'),
        A('add-db-query', 'Add database query'),
        A('add-logging', 'Add logging'),
        A('add-caching', 'Add caching'),
        A('add-pagination', 'Add pagination'),
        A('add-type', 'Add TypeScript type'),
        A('wrap-async', 'Add async await wrapper'),
      ];
    case 'db-query':
      return [
        A('fix-sql-injection', 'Convert to parameterized query'),
        A('add-error-handling', 'Add error handling'),
        A('add-result-validation', 'Add result validation'),
        A('add-pagination', 'Add pagination limit'),
        A('extract-repository', 'Extract to repository function'),
        A('add-caching', 'Add caching layer'),
      ];
    case 'function':
      return [
        A('add-jsdoc', 'Add JSDoc comment'),
        A('convert-async', 'Convert to async'),
        A('add-input-validation', 'Add input validation'),
        A('add-error-handling', 'Add error boundary'),
        A('extract-file', 'Extract to separate file'),
        A('add-test-stub', 'Add unit test stub'),
      ];
    case 'import':
      return [
        A('find-usages', 'Check if this is used anywhere', 'reference'),
        A('find-references', 'Find all references', 'reference'),
        A('replace-library', 'Replace with alternative library'),
      ];
    case 'route':
      return [
        A('add-auth-check', 'Add authentication middleware'),
        A('add-rate-limiting', 'Add rate limiting'),
        A('add-input-validation', 'Add request validation'),
        A('add-caching', 'Add response caching'),
        A('add-error-handling', 'Add error handler'),
      ];
    case 'class':
    case 'type':
    case 'export':
      return [
        A('find-references', 'Find all references', 'reference'),
        A('add-jsdoc', 'Add JSDoc comment'),
        A('add-error-handling', 'Add error handling'),
      ];
    default:
      return [
        A('add-error-handling', 'Add error handling'),
        A('add-logging', 'Add logging'),
        A('find-references', 'Find all references', 'reference'),
        ...(routeFile ? [A('add-auth-check', 'Add authentication check')] : []),
      ];
  }
}

// ---- Structural context (breadcrumb + context-aware actions) --------------

/** Human label for one frame, used in the breadcrumb. */
function frameLabel(f: Frame): string {
  switch (f.kind) {
    case 'class':
      return `Class: ${f.meta.className ?? f.label}`;
    case 'component':
      return `Component: ${f.meta.componentName ?? f.label}`;
    case 'function':
      return `Function: ${f.meta.name ?? f.label}`;
    case 'method':
      return `Method: ${f.meta.methodName ?? f.label}`;
    case 'route':
      return `Route: ${f.label}`;
    case 'hook':
      return `Hook: ${f.meta.hookType ?? f.label}`;
    case 'if':
      return `Inside: if (${f.meta.condition ?? ''})`;
    case 'else':
      return `Inside: ${f.label}`;
    case 'try':
      return 'Inside: try block';
    case 'catch':
      return 'Inside: catch block';
    case 'finally':
      return 'Inside: finally block';
    case 'loop':
      return `Inside: loop (${f.meta.iterates ?? f.label})`;
    default:
      return f.label;
  }
}

/** The innermost scope kind for a line, or 'top-level'. */
function scopeOf(frames: Frame[]): ScopeKind {
  if (frames.length === 0) return 'top-level';
  return frames[frames.length - 1].kind as ScopeKind;
}

/** Build the breadcrumb string for a line, e.g. "File: x → Function: y → Inside: try block". */
function buildContext(fileName: string, frames: Frame[]): LineContext {
  const parts = ['File: ' + fileName, ...frames.map(frameLabel)];
  return { scope: scopeOf(frames), breadcrumb: parts.join(' → ') };
}

const CA = (id: string, label: string, kind: LineAction['kind'] = 'edit', flags: { critical?: boolean } = {}): LineAction => ({
  id,
  label,
  kind,
  ...flags,
});

/**
 * Generate actions that depend on the line's structural context — what it sits
 * inside of — layered on top of the base, line-kind actions. Critical structural
 * problems (e.g. an N+1 query in a loop) are flagged and sorted to the top.
 */
function contextActions(kind: LineKind, frames: Frame[], rawLine: string, allFrames: Frame[]): LineAction[] {
  const out: LineAction[] = [];
  const enclosingFn = [...frames].reverse().find((f) => f.kind === 'function' || f.kind === 'method' || f.kind === 'component');
  const route = frames.find((f) => f.kind === 'route');
  const loop = [...frames].reverse().find((f) => f.kind === 'loop');
  const hook = [...frames].reverse().find((f) => f.kind === 'hook');
  const component = frames.find((f) => f.kind === 'component');
  const inTry = frames.some((f) => f.kind === 'try');

  // N+1: a DB query inside a loop is a critical performance problem.
  if (loop && (kind === 'db-query' || loop.facts.containsDbQuery)) {
    out.push(CA('move-db-out-of-loop', 'Move database query outside loop: N+1 query problem', 'edit', { critical: true }));
  }

  // Route handler with no auth middleware in its body.
  if (route && !route.facts.hasAuthInBody) {
    out.push(CA('add-auth-check', 'Add authentication check before this route'));
  }

  // useEffect with an empty dependency array.
  if (hook && hook.meta.hookType === 'useEffect' && (hook.meta.depArray ?? '').replace(/\s/g, '') === '[]') {
    out.push(CA('add-effect-deps', 'Add missing dependencies to dependency array'));
  }

  // Method/function that uses await but is not async.
  if (enclosingFn && enclosingFn.facts.containsAwait && !enclosingFn.meta.isAsync) {
    const noun = enclosingFn.kind === 'method' ? 'method' : 'function';
    out.push(CA('convert-async', `Convert ${noun} to async`));
  }

  // try block whose paired catch only logs.
  if (inTry) {
    const tryFrame = [...frames].reverse().find((f) => f.kind === 'try');
    const sibCatch = tryFrame
      ? allFrames.find(
          (f) => f.kind === 'catch' && f.startLine >= tryFrame.endLine && f.startLine <= tryFrame.endLine + 2,
        )
      : undefined;
    if (sibCatch?.facts.catchOnlyLogs) {
      out.push(CA('improve-error-handling', 'Improve error handling: add a proper error response'));
    }
  }

  // React component reading large global state on this line.
  if (component && component.facts.readsGlobalState && /useSelector|useStore|useContext|store\.getState/.test(rawLine)) {
    out.push(CA('add-memo', 'Add useMemo / useCallback to prevent unnecessary re-renders'));
  }

  // Enclosing function with no try/catch — offer to wrap it.
  if (enclosingFn && !enclosingFn.facts.containsTry && (kind === 'empty' || kind === 'brace' || kind === 'return' || kind === 'call')) {
    out.push(CA('wrap-function-error-handling', `Add error handling wrapper around this ${enclosingFn.kind === 'method' ? 'method' : 'function'}`));
  }

  // Empty line inside a function body: offer additions tuned to the function type.
  if (kind === 'empty' || kind === 'brace') {
    if (route) {
      out.push(
        CA('add-input-validation', 'Add input validation'),
        CA('add-rate-limiting', 'Add rate limiting'),
        CA('add-logging', 'Add logging'),
        CA('add-caching', 'Add caching'),
      );
    } else if (enclosingFn && enclosingFn.facts.containsDbQuery) {
      out.push(
        CA('add-transaction', 'Add transaction wrapper'),
        CA('add-connection-error-handling', 'Add connection error handling'),
        CA('add-query-timeout', 'Add query timeout'),
      );
    }
  }

  return out;
}

/** Merge context actions ahead of base actions, de-duplicating by id. */
function mergeActions(context: LineAction[], base: LineAction[]): LineAction[] {
  const seen = new Set<string>();
  const merged: LineAction[] = [];
  // Critical first, then other context actions, then base.
  for (const a of [...context].sort((x, y) => Number(Boolean(y.critical)) - Number(Boolean(x.critical)))) {
    if (seen.has(a.id)) continue;
    seen.add(a.id);
    merged.push(a);
  }
  for (const a of base) {
    if (seen.has(a.id)) continue;
    seen.add(a.id);
    merged.push(a);
  }
  return merged;
}

// ---- Symbol detection -----------------------------------------------------

/** Extract navigable symbols (functions, classes, methods, routes, types). */
export function detectSymbols(content: string): SymbolInfo[] {
  const symbols: SymbolInfo[] = [];
  const lines = content.split('\n');
  const seen = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const n = i + 1;
    let m: RegExpMatchArray | null;

    if ((m = line.match(/(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+(\w+)/))) {
      push('function', m[1], n);
    } else if ((m = line.match(/(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\(?[^)]*\)?\s*=>/))) {
      push('function', m[1], n);
    } else if ((m = line.match(/(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/))) {
      push('class', m[1], n);
    } else if ((m = line.match(/(?:export\s+)?(?:interface|type)\s+(\w+)/))) {
      push('type', m[1], n);
    } else if ((m = line.match(/\.(?:get|post|put|delete|patch|use|all)\s*\(\s*['"`]([^'"`]+)/i))) {
      const verb = line.match(/\.(get|post|put|delete|patch|use|all)\s*\(/i)?.[1]?.toUpperCase() ?? 'ROUTE';
      push('route', `${verb} ${m[1]}`, n);
    } else if ((m = line.match(/^\s*(?:public|private|protected|static|async)\s+(\w+)\s*\(/))) {
      push('method', m[1], n);
    }
  }

  function push(kind: SymbolInfo['kind'], name: string, line: number) {
    const key = `${kind}:${name}:${line}`;
    if (seen.has(key)) return;
    seen.add(key);
    symbols.push({ name, kind, line });
  }

  return symbols;
}

// ---- Cross-project references ---------------------------------------------

/** Symbol declared on a given line, if any (used for the connections badge). */
function symbolOnLine(raw: string): string | undefined {
  const line = raw.trim();
  const patterns = [
    /(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+(\w+)/,
    /(?:export\s+)?const\s+(\w+)\s*=/,
    /(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/,
    /(?:export\s+)?(?:interface|type)\s+(\w+)/,
    /^\s*(?:public|private|protected|static|async)\s+(\w+)\s*\(/,
    /import\s+(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)/,
  ];
  for (const p of patterns) {
    const m = line.match(p);
    if (m?.[1]) return m[1];
  }
  return undefined;
}

const COMMON_WORDS = new Set([
  'default', 'const', 'let', 'var', 'type', 'class', 'function', 'return', 'async',
  'await', 'import', 'export', 'from', 'this', 'self', 'data', 'value', 'props',
]);

/**
 * Find every reference to `symbol` across the project (excluding its own
 * declaration line in its own file). Returns at most `limit` references.
 */
export function findReferences(
  analysis: AnalysisResult,
  symbol: string,
  declFile: string,
  declLine: number,
  limit = 200,
): CodeReference[] {
  if (!symbol || symbol.length < 3 || COMMON_WORDS.has(symbol)) return [];
  const re = new RegExp(`\\b${escapeRegExp(symbol)}\\b`);
  const refs: CodeReference[] = [];

  for (const file of analysis.scan.files) {
    if (!file.content) continue;
    const lines = file.content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (file.relPath === declFile && i + 1 === declLine) continue; // skip declaration
      if (!re.test(lines[i])) continue;
      refs.push({ path: file.relPath, line: i + 1, snippet: lines[i].trim().slice(0, 200) });
      if (refs.length >= limit) return refs;
    }
  }
  return refs;
}

/** Count of distinct other files that reference a symbol. */
export function countReferencingFiles(
  analysis: AnalysisResult,
  symbol: string,
  declFile: string,
): number {
  if (!symbol || symbol.length < 3 || COMMON_WORDS.has(symbol)) return 0;
  const re = new RegExp(`\\b${escapeRegExp(symbol)}\\b`);
  const files = new Set<string>();
  for (const file of analysis.scan.files) {
    if (file.relPath === declFile || !file.content) continue;
    if (re.test(file.content)) files.add(file.relPath);
  }
  return files.size;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---- Assembly -------------------------------------------------------------

/** The node kind associated with a file path, used to tune actions. */
function fileKindFor(analysis: AnalysisResult, relPath: string): string {
  const node = analysis.canvas.nodes.find((n) => n.filePath === relPath);
  return node?.kind ?? 'unknown';
}

/** Build the full code-intelligence payload for one file. */
export function buildFileIntel(analysis: AnalysisResult, relPath: string): FileIntel | null {
  const content = readFileForIntel(analysis, relPath);
  if (content === null) return null;

  const fileKind = fileKindFor(analysis, relPath);
  const rawLines = content.split('\n');
  const fileName = relPath.split('/').pop() ?? relPath;
  const frames = trackScopes(rawLines);

  const lines: LineInfo[] = rawLines.map((text, i) => {
    const n = i + 1;
    const kind = classifyLine(text);
    const symbol = symbolOnLine(text);
    const refCount =
      symbol && (kind === 'function' || kind === 'class' || kind === 'type' || kind === 'export')
        ? countReferencingFiles(analysis, symbol, relPath)
        : 0;
    const lineFrames = framesAtLine(frames, n);
    const context = buildContext(fileName, lineFrames);
    const actions = mergeActions(contextActions(kind, lineFrames, text, frames), baseActions(kind, fileKind));
    return {
      n,
      text,
      kind,
      explanation: explainLine(text, kind),
      actions,
      refCount,
      symbol,
      context,
    };
  });

  return {
    path: relPath,
    ext: path.extname(relPath),
    lines,
    symbols: detectSymbols(content),
    squiggles: detectSyntaxSquiggles(relPath, content),
  };
}
