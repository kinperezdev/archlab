/**
 * Thin client for the Code Intelligence REST endpoints on the backend.
 * Everything stays on localhost; these mirror the routes in backend/index.ts.
 */

import {
  PORTS,
  type FileIntel,
  type LineAction,
  type LineInfo,
  type CodeReference,
  type ImpactAnalysis,
  type ApplyResult,
  type SquiggleMarker,
} from '@archlab/shared';

const BASE = `http://127.0.0.1:${PORTS.backend}`;
const FALLBACK_ACTIONS: LineAction[] = [
  { id: 'explain-line', label: 'Explain this line', kind: 'reference' },
];

/** Result of a file-intel load: the parsed intel, or a clear error message. */
export interface FileIntelResult {
  intel: FileIntel | null;
  error: string | null;
}

export interface RawFileResult {
  intel: FileIntel | null;
  error: string | null;
}

/** Load raw source quickly so the panel can paint before full code intel is ready. */
export async function fetchRawFileIntel(projectId: string, relPath: string): Promise<RawFileResult> {
  const url = `${BASE}/file?projectId=${encodeURIComponent(projectId)}&path=${encodeURIComponent(relPath)}`;
  const res = await fetch(url).then((r) => r.json()).catch((err) => ({
    ok: false,
    error: String(err),
  }));
  if (!res?.ok) {
    return {
      intel: null,
      error: typeof res?.error === 'string' ? res.error : 'Unknown error loading file.',
    };
  }

  const content = typeof res.content === 'string' ? res.content : '';
  const lines = content.split('\n').map((text: string, index: number): LineInfo => ({
    n: index + 1,
    text,
    kind: inferFastLineKind(text),
    explanation: 'Source line. Full code intelligence is still loading.',
    actions: FALLBACK_ACTIONS,
    refCount: 0,
  }));

  return {
    intel: {
      path: typeof res.path === 'string' ? res.path : relPath,
      ext: typeof res.ext === 'string' ? res.ext : '',
      lines,
      symbols: [],
      squiggles: [],
    },
    error: null,
  };
}

/** Load the full code-intelligence view (classified lines + symbols) of a file. */
export async function fetchFileIntel(projectId: string, relPath: string): Promise<FileIntelResult> {
  const url = `${BASE}/code/file?projectId=${encodeURIComponent(projectId)}&path=${encodeURIComponent(relPath)}`;
  const request = async () => {
    const response = await fetch(url);
    return response.json();
  };
  try {
    const res = await request();
    if (res?.ok) return normalizeFileIntel(res.intel, relPath);
    return { intel: null, error: typeof res?.error === 'string' ? res.error : 'Unknown error loading file.' };
  } catch (firstErr) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    try {
      const res = await request();
      if (res?.ok) return normalizeFileIntel(res.intel, relPath);
      return { intel: null, error: typeof res?.error === 'string' ? res.error : 'Unknown error loading file.' };
    } catch {
      return {
        intel: null,
        error: `Backend file loader is unavailable. Make sure the ArchLab backend is running, then reopen this node. Original error: ${String(firstErr)}`,
      };
    }
  }
}

function normalizeFileIntel(raw: unknown, relPath: string): FileIntelResult {
  if (!raw || typeof raw !== 'object') {
    return { intel: null, error: 'Backend returned an invalid file payload.' };
  }
  const value = raw as Partial<FileIntel>;
  const rawLines = Array.isArray(value.lines) ? value.lines : null;
  if (!rawLines) {
    return { intel: null, error: 'Backend returned a file payload with no lines.' };
  }

  const lines = rawLines.map((line, index) => normalizeLineInfo(line, index));
  const symbols = Array.isArray(value.symbols)
    ? value.symbols
        .filter((symbol) => symbol && typeof symbol === 'object')
        .map((symbol) => {
          const item = symbol as { name?: unknown; kind?: unknown; line?: unknown };
          return {
            name: typeof item.name === 'string' ? item.name : 'symbol',
            kind: isSymbolKind(item.kind) ? item.kind : 'function',
            line: toPositiveNumber(item.line, 1),
          };
        })
    : [];

  const intel: FileIntel = {
    path: typeof value.path === 'string' ? value.path : relPath,
    ext: typeof value.ext === 'string' ? value.ext : '',
    lines,
    symbols,
    squiggles: Array.isArray(value.squiggles) ? (value.squiggles as SquiggleMarker[]) : [],
  };
  return { intel, error: null };
}

function normalizeLineInfo(raw: unknown, index: number): LineInfo {
  const line = raw && typeof raw === 'object' ? raw as Partial<LineInfo> : {};
  return {
    n: toPositiveNumber(line.n, index + 1),
    text: typeof line.text === 'string' ? line.text : '',
    kind: isLineKind(line.kind) ? line.kind : 'code',
    explanation: typeof line.explanation === 'string' ? line.explanation : 'Source line.',
    actions: normalizeActions(line.actions),
    refCount: toNonNegativeNumber(line.refCount, 0),
    symbol: typeof line.symbol === 'string' ? line.symbol : undefined,
    context:
      line.context && typeof line.context === 'object' && typeof line.context.breadcrumb === 'string'
        ? line.context
        : undefined,
  };
}

function normalizeActions(raw: unknown): LineAction[] {
  if (!Array.isArray(raw)) return FALLBACK_ACTIONS;
  const actions = raw.flatMap((item): LineAction[] => {
    if (!item || typeof item !== 'object') return [];
    const action = item as Partial<LineAction>;
    if (typeof action.id !== 'string' || typeof action.label !== 'string') return [];
    return [{
      id: action.id,
      label: action.label,
      kind: action.kind === 'edit' ? 'edit' : 'reference',
      fromFinding: action.fromFinding,
      critical: action.critical,
    }];
  });
  return actions.length > 0 ? actions : FALLBACK_ACTIONS;
}

function toPositiveNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

function toNonNegativeNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function isLineKind(value: unknown): value is LineInfo['kind'] {
  return typeof value === 'string' && [
    'empty',
    'comment',
    'import',
    'export',
    'function',
    'class',
    'route',
    'db-query',
    'return',
    'assignment',
    'call',
    'control',
    'jsx',
    'brace',
    'type',
    'code',
  ].includes(value);
}

function isSymbolKind(value: unknown): value is FileIntel['symbols'][number]['kind'] {
  return typeof value === 'string' && ['function', 'class', 'method', 'route', 'type'].includes(value);
}

function inferFastLineKind(text: string): LineInfo['kind'] {
  const trimmed = text.trim();
  if (!trimmed) return 'empty';
  if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return 'comment';
  if (/^import\b/.test(trimmed)) return 'import';
  if (/^export\b/.test(trimmed)) return 'export';
  if (/^(class|abstract class)\b/.test(trimmed)) return 'class';
  if (/^(if|else|for|while|switch|try|catch|finally)\b/.test(trimmed)) return 'control';
  if (/^return\b/.test(trimmed)) return 'return';
  if (/^(type|interface|enum)\b/.test(trimmed)) return 'type';
  if (/^[{}()[\],;]+$/.test(trimmed)) return 'brace';
  return 'code';
}

/** Every project reference to the symbol declared on a line. */
export async function fetchReferences(
  projectId: string,
  relPath: string,
  line: number,
  symbol: string,
): Promise<CodeReference[]> {
  const url =
    `${BASE}/code/references?projectId=${encodeURIComponent(projectId)}` +
    `&path=${encodeURIComponent(relPath)}&line=${line}&symbol=${encodeURIComponent(symbol)}`;
  const res = await fetch(url).then((r) => r.json()).catch(() => null);
  return res?.ok ? (res.references as CodeReference[]) : [];
}

/** Run Impact Analysis for an action on a line (no writes). */
export async function fetchImpact(
  projectId: string,
  relPath: string,
  line: number,
  actionId: string,
): Promise<ImpactAnalysis | null> {
  const res = await fetch(`${BASE}/code/impact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, path: relPath, line, actionId }),
  })
    .then((r) => r.json())
    .catch(() => null);
  return res?.ok ? (res.impact as ImpactAnalysis) : null;
}

/** Impact Analysis for a free-form full-file edit made in the panel (no writes). */
export async function fetchEditImpact(
  projectId: string,
  relPath: string,
  content: string,
): Promise<ImpactAnalysis | null> {
  const res = await fetch(`${BASE}/code/edit-impact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, path: relPath, content }),
  })
    .then((r) => r.json())
    .catch(() => null);
  return res?.ok ? (res.impact as ImpactAnalysis) : null;
}

/** Live check of an unsaved buffer; returns squiggles (syntax + compile) for the edit. */
export async function checkSyntax(
  projectId: string,
  relPath: string,
  content: string,
): Promise<SquiggleMarker[]> {
  const res = await fetch(`${BASE}/code/syntax-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, path: relPath, content }),
  })
    .then((r) => r.json())
    .catch(() => null);
  return res?.ok ? (res.squiggles as SquiggleMarker[]) : [];
}

/** Write an Impact Analysis to disk (backs up first, then re-analyzes). */
export async function applyImpact(
  projectId: string,
  impact: ImpactAnalysis,
): Promise<ApplyResult | null> {
  const res = await fetch(`${BASE}/code/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, impact }),
  })
    .then((r) => r.json())
    .catch(() => null);
  return res as ApplyResult | null;
}
