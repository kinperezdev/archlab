/**
 * Lightweight scope tracker.
 *
 * Walks a file line by line, counting braces, to build a tree of structural
 * scopes (functions, methods, classes, conditionals, try/catch, loops, route
 * handlers, React components, hooks). For any line it can tell you the full
 * stack of scopes it sits inside — what it is "inside of", not just what it is.
 *
 * This is deliberately not a real AST: it is a brace-depth + regex heuristic
 * tuned for JS/TS that degrades gracefully. It powers the Code Intelligence
 * Panel's breadcrumb and its context-aware actions.
 */

export type FrameKind =
  | 'function'
  | 'method'
  | 'class'
  | 'if'
  | 'else'
  | 'try'
  | 'catch'
  | 'finally'
  | 'loop'
  | 'route'
  | 'component'
  | 'hook';

export interface Frame {
  kind: FrameKind;
  /** Short label, e.g. function name, "GET /users", "useEffect". */
  label: string;
  /** 1-based line where the scope opened. */
  startLine: number;
  /** 1-based line where the scope closed (inclusive). Set in a second pass. */
  endLine: number;
  /** Structural metadata used by action generation. */
  meta: FrameMeta;
  /** Facts about the frame's body, computed after the body is known. */
  facts: FrameFacts;
}

export interface FrameMeta {
  name?: string;
  params?: string;
  isAsync?: boolean;
  className?: string;
  methodName?: string;
  httpMethod?: string;
  routePath?: string;
  condition?: string;
  componentName?: string;
  props?: string;
  hookType?: string;
  depArray?: string;
  iterates?: string;
}

export interface FrameFacts {
  containsAwait: boolean;
  containsTry: boolean;
  containsDbQuery: boolean;
  hasAuthInBody: boolean;
  readsGlobalState: boolean;
  /** For catch frames: the catch body only logs (console.log) and nothing else. */
  catchOnlyLogs: boolean;
}

/** Net change in brace depth on a line (naive: ignores braces in strings). */
function braceDelta(line: string): number {
  let d = 0;
  for (const ch of line) {
    if (ch === '{') d++;
    else if (ch === '}') d--;
  }
  return d;
}

const DB_QUERY_RE =
  /\b(select|insert\s+into|update\s+\w+\s+set|delete\s+from)\b|\.(query|findMany|findUnique|findFirst|aggregate|create|update|delete|deleteMany|raw)\s*\(|\b(prisma|db|knex|mongoose|collection)\.\w+/i;
const AUTH_RE = /requireAuth|isAuthenticated|authMiddleware|verifyToken|passport\.|ensureAuth|withAuth|getSession|auth\(/i;
const GLOBAL_STATE_RE = /useSelector|useStore|useContext|useAppState|store\.getState|useGlobal/;

/** Detect a scope opening on a line; return a partial frame or null. */
function detectOpen(line: string, parentIsClass: boolean): { kind: FrameKind; label: string; meta: FrameMeta } | null {
  const t = line.trim();

  // Route handler: app.get('/x', ... or router.post('/x', ...
  let m = t.match(/\.(get|post|put|patch|delete|use|all)\s*\(\s*['"`]([^'"`]+)['"`]/i);
  if (m) {
    return {
      kind: 'route',
      label: `${m[1].toUpperCase()} ${m[2]}`,
      meta: { httpMethod: m[1].toUpperCase(), routePath: m[2] },
    };
  }

  // React hook: useEffect/useMemo/useCallback/useXxx(
  m = t.match(/\b(use[A-Z]\w*)\s*\(/);
  if (m) {
    const depMatch = line.match(/\},\s*(\[[^\]]*\])\s*\)/);
    return { kind: 'hook', label: m[1], meta: { hookType: m[1], depArray: depMatch?.[1] } };
  }

  // Class declaration
  m = t.match(/^(?:export\s+)?(?:default\s+)?(?:abstract\s+)?class\s+(\w+)/);
  if (m) return { kind: 'class', label: m[1], meta: { className: m[1] } };

  // React component: PascalCase function/const returning JSX-ish.
  m = t.match(/^(?:export\s+)?(?:default\s+)?function\s+([A-Z]\w*)\s*\(([^)]*)\)/);
  if (m) return { kind: 'component', label: m[1], meta: { componentName: m[1], props: m[2].trim() } };
  m = t.match(/^(?:export\s+)?const\s+([A-Z]\w*)\s*[:=].*\(([^)]*)\)\s*(?::[^=]+)?=>/);
  if (m) return { kind: 'component', label: m[1], meta: { componentName: m[1], props: m[2].trim() } };

  // Plain function
  m = t.match(/^(?:export\s+)?(?:default\s+)?(async\s+)?function\s+(\w+)\s*\(([^)]*)\)\s*(?::\s*([^={]+))?/);
  if (m) {
    return {
      kind: 'function',
      label: m[2],
      meta: { name: m[2], params: m[3].trim(), isAsync: Boolean(m[1]), },
    };
  }
  m = t.match(/^(?:export\s+)?const\s+(\w+)\s*[:=].*?(async\s*)?\(([^)]*)\)\s*(?::\s*([^=]+))?=>/);
  if (m) {
    return {
      kind: 'function',
      label: m[1],
      meta: { name: m[1], params: m[3].trim(), isAsync: Boolean(m[2]) },
    };
  }

  // Control flow
  m = t.match(/^\}?\s*else\s+if\s*\(([^)]*)\)/);
  if (m) return { kind: 'else', label: 'else if', meta: { condition: m[1].trim() } };
  if (/^\}?\s*else\b/.test(t)) return { kind: 'else', label: 'else', meta: {} };
  m = t.match(/^if\s*\(([^)]*)\)/);
  if (m) return { kind: 'if', label: 'if', meta: { condition: m[1].trim() } };
  if (/^try\b/.test(t)) return { kind: 'try', label: 'try', meta: {} };
  m = t.match(/^\}?\s*catch\b/);
  if (m) return { kind: 'catch', label: 'catch', meta: {} };
  if (/^\}?\s*finally\b/.test(t)) return { kind: 'finally', label: 'finally', meta: {} };

  // Loops
  m = t.match(/^(for|while)\s*\(([^)]*)\)/);
  if (m) return { kind: 'loop', label: m[1], meta: { iterates: m[2].trim() } };
  m = t.match(/\.(forEach|map|filter|reduce)\s*\(/);
  if (m) return { kind: 'loop', label: `.${m[1]}`, meta: { iterates: m[1] } };

  // Class method (only meaningful inside a class): name(args) { or async name(args) {
  if (parentIsClass) {
    m = t.match(/^(?:public|private|protected|static|async|readonly|\s)*\b(\w+)\s*\(([^)]*)\)\s*(?::[^={]+)?\{/);
    if (m && !['if', 'for', 'while', 'switch', 'catch'].includes(m[1])) {
      return { kind: 'method', label: m[1], meta: { methodName: m[1], params: m[2].trim(), isAsync: /\basync\b/.test(t) } };
    }
  }

  return null;
}

/** Build the full frame tree for a file's lines. */
export function trackScopes(lines: string[]): Frame[] {
  const frames: Frame[] = [];
  // Stack of open frames with the brace depth at which they should close.
  const stack: { frame: Frame; closeDepth: number }[] = [];
  let depth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parentIsClass = stack.length > 0 && stack[stack.length - 1].frame.kind === 'class';

    // A scope opens if this line both matches an opener and increases depth.
    const opensBrace = braceDelta(line) > 0 || /\{\s*$/.test(line.trim());
    if (opensBrace) {
      const det = detectOpen(line, parentIsClass);
      if (det) {
        const frame: Frame = {
          kind: det.kind,
          label: det.label,
          startLine: i + 1,
          endLine: lines.length,
          meta: det.meta,
          facts: blankFacts(),
        };
        frames.push(frame);
        // It closes when depth falls back to the current depth.
        stack.push({ frame, closeDepth: depth });
      }
    }

    depth += braceDelta(line);
    if (depth < 0) depth = 0;

    // Pop any frames whose closing depth we have returned to.
    while (stack.length > 0 && depth <= stack[stack.length - 1].closeDepth) {
      const popped = stack.pop()!;
      popped.frame.endLine = i + 1;
    }
  }

  computeFacts(frames, lines);
  return frames;
}

function blankFacts(): FrameFacts {
  return {
    containsAwait: false,
    containsTry: false,
    containsDbQuery: false,
    hasAuthInBody: false,
    readsGlobalState: false,
    catchOnlyLogs: false,
  };
}

/** Scan each frame's body to populate its facts. */
function computeFacts(frames: Frame[], lines: string[]): void {
  for (const f of frames) {
    let nonLogStatements = 0;
    let logStatements = 0;
    for (let i = f.startLine; i <= f.endLine - 1 && i < lines.length; i++) {
      const body = lines[i];
      if (/\bawait\b/.test(body)) f.facts.containsAwait = true;
      if (/\btry\b\s*\{/.test(body)) f.facts.containsTry = true;
      if (DB_QUERY_RE.test(body)) f.facts.containsDbQuery = true;
      if (AUTH_RE.test(body)) f.facts.hasAuthInBody = true;
      if (GLOBAL_STATE_RE.test(body)) f.facts.readsGlobalState = true;
      const t = body.trim();
      if (t && !/^[{}]/.test(t) && t !== 'catch' && !/^\}?\s*catch/.test(t)) {
        if (/console\.(log|error|warn)/.test(t)) logStatements++;
        else if (!/^\/\//.test(t)) nonLogStatements++;
      }
    }
    if (f.kind === 'catch') {
      f.facts.catchOnlyLogs = logStatements > 0 && nonLogStatements === 0;
    }
  }
}

/** The frame stack containing a 1-based line, outermost first. */
export function framesAtLine(frames: Frame[], line: number): Frame[] {
  return frames
    .filter((f) => line >= f.startLine && line <= f.endLine)
    .sort((a, b) => a.startLine - b.startLine);
}
