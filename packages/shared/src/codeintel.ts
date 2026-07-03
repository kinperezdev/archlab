/**
 * Code Intelligence types — the contract behind the Code Intelligence Panel.
 *
 * The panel reads a file from disk, classifies every line, explains what each
 * line does, offers context-aware actions, and (when an action is picked) runs
 * a project-wide Impact Analysis that produces real before/after diffs the user
 * can apply to disk. Everything is deterministic and computed from the code.
 */

/** Coarse syntactic role of a single source line, drives explanation + actions. */
export type LineKind =
  | 'empty'
  | 'comment'
  | 'import'
  | 'export'
  | 'function' // function / method declaration
  | 'class'
  | 'route' // an HTTP route / endpoint registration
  | 'db-query' // a database read/write
  | 'return'
  | 'assignment'
  | 'call'
  | 'control' // if / for / while / switch
  | 'jsx'
  | 'brace' // a lone block delimiter
  | 'type' // type / interface declaration
  | 'code'; // anything else

/** A clickable action offered in a line's "What you can do here" menu. */
export interface LineAction {
  /** Stable id consumed by the impact endpoint. */
  id: string;
  /** Button label shown in the menu. */
  label: string;
  /**
   * Reference actions ("Find all references") open the connections popover
   * instead of the impact panel. Edit actions run Impact Analysis.
   */
  kind: 'edit' | 'reference';
  /** When true this action was promoted to the top by a pipeline finding. */
  fromFinding?: boolean;
  /**
   * When true this action addresses a critical structural problem detected from
   * the code context (e.g. an N+1 query inside a loop). Rendered in red and
   * sorted to the top, like a finding.
   */
  critical?: boolean;
}

/** The innermost structural scope a line sits inside. */
export type ScopeKind =
  | 'top-level'
  | 'function'
  | 'method'
  | 'if'
  | 'else'
  | 'try'
  | 'catch'
  | 'finally'
  | 'loop'
  | 'route'
  | 'component'
  | 'hook';

/**
 * Structural context for a line: what it sits inside of, derived by a
 * lightweight scope tracker. Drives the breadcrumb and context-aware actions.
 */
export interface LineContext {
  /** Innermost scope kind. */
  scope: ScopeKind;
  /** Breadcrumb like "File: App.tsx → Function: handleSubmit → Inside: try block". */
  breadcrumb: string;
}

/** Everything the panel needs to render one line. */
export interface LineInfo {
  /** 1-based line number. */
  n: number;
  /** Raw source text of the line (untrimmed). */
  text: string;
  kind: LineKind;
  /** Plain-English one-liner describing what this specific line does. */
  explanation: string;
  /** Context-aware actions for this line. */
  actions: LineAction[];
  /**
   * Count of other files that reference the symbol declared on this line.
   * Drives the "used in N files" connections badge. 0 means no badge.
   */
  refCount: number;
  /** The symbol name this line declares/imports, used to resolve references. */
  symbol?: string;
  /** Structural context (what this line sits inside of) for the breadcrumb. */
  context?: LineContext;
}

/** A navigable symbol (function / class / route / method) for the navigator. */
export interface SymbolInfo {
  name: string;
  kind: 'function' | 'class' | 'method' | 'route' | 'type';
  /** 1-based line where the symbol is declared. */
  line: number;
}

/**
 * One editor-style squiggle: a red (error) or amber (warning) underline under a
 * character range on a line, exactly like VSCode's inline diagnostics.
 */
export interface SquiggleFix {
  /** Text to insert to fix the error. */
  insert: string;
  /** 0-based column to insert at. */
  col: number;
  /** Button label, e.g. "Insert ','". */
  label: string;
}

/** Educational hover help for a squiggle: cause, fix, and what to look for. */
export interface SquiggleHelp {
  /** Why the error happens, in plain English. */
  why: string;
  /** How to debug it / what to look for. */
  lookFor: string;
}

export interface SquiggleMarker {
  /** 1-based line number. */
  line: number;
  /** 0-based column where the underline starts (inclusive). */
  colStart: number;
  /** 0-based column where the underline ends (exclusive). */
  colEnd: number;
  severity: 'error' | 'warning';
  /** Hover message, e.g. "',' expected (TS1005)" or an ArchLab finding title. */
  message: string;
  /** Where the squiggle came from, for styling/grouping. */
  source: 'syntax' | 'finding';
  /** Instant heuristic quick-fix, when the error is a simple missing token. */
  fix?: SquiggleFix;
  /** Plain-English debugging help shown on hover. */
  help?: SquiggleHelp;
}

/** The full code-intelligence payload for one file. */
export interface FileIntel {
  path: string;
  ext: string;
  lines: LineInfo[];
  symbols: SymbolInfo[];
  /** Editor-style squiggles for this file (syntax errors + ArchLab findings). */
  squiggles: SquiggleMarker[];
}

/** One place in the project that references a symbol. */
export interface CodeReference {
  /** Project-relative file path. */
  path: string;
  /** 1-based line number of the reference. */
  line: number;
  /** Trimmed source of the referencing line, for a preview snippet. */
  snippet: string;
}

/** A contiguous change inside one file: replace `before` lines with `after`. */
export interface DiffHunk {
  /** 1-based line where the hunk starts in the original file. */
  startLine: number;
  /** Original lines being replaced (may be empty for a pure insertion). */
  before: string[];
  /** Replacement lines (may be empty for a pure deletion). */
  after: string[];
}

/** Every change Impact Analysis wants to make to a single file. */
export interface AffectedFile {
  path: string;
  /** Why this file is affected, e.g. "callers must await the now-async function". */
  reason: string;
  hunks: DiffHunk[];
}

/** The result of running Impact Analysis for one action on one line. */
export interface ImpactAnalysis {
  /** Echo of what was requested, so apply can re-run deterministically. */
  request: { projectId: string; path: string; line: number; actionId: string };
  /** Human summary, e.g. "This change affects 3 files. Here is what will update." */
  summary: string;
  affected: AffectedFile[];
}

/** Result of writing an Impact Analysis to disk. */
export interface ApplyResult {
  ok: boolean;
  /** Absolute path of the timestamped backup folder created before writing. */
  backupDir: string;
  /** Project-relative paths that were written. */
  written: string[];
  error?: string;
}
