/**
 * Code Intelligence Panel.
 *
 * Slides in as a third column when a node is locked on the canvas. Shows the
 * node's source file straight from disk: syntax highlighted, every line
 * explained and actionable, every reachable symbol navigable, every referenced
 * line badged with "used in N files". Picking a line action runs Impact
 * Analysis (a project-wide before/after diff) that can be applied to disk.
 */

import { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';
import type {
  CanvasNode,
  Diagnostic,
  FileIntel,
  LineAction,
  LineInfo,
  CodeReference,
  ImpactAnalysis,
  AffectedFile,
  SquiggleMarker,
} from '@archlab/shared';
import { tokenizeLine } from '../lib/codeHighlight.js';
import { useApiKeyContext } from '../state/apiKeyContext.js';
import { NudgeText } from './ConfidenceNudge.js';
import {
  fetchFileIntel,
  fetchReferences,
  fetchImpact,
  fetchEditImpact,
  applyImpact,
  checkSyntax,
} from '../lib/codeApi.js';

/** Stable empty findings array so memoized lines don't re-render needlessly. */
const NO_FINDINGS: Diagnostic[] = [];
const NO_SQUIGGLES: SquiggleMarker[] = [];

/** Whole-line squiggles for lines an ArchLab finding lands on (same match as line actions). */
function findingSquiggles(lines: LineInfo[], findings: Diagnostic[]): SquiggleMarker[] {
  const out: SquiggleMarker[] = [];
  for (const line of lines) {
    const hit = findings.find((f) => {
      const t = f.title.toLowerCase();
      if (line.kind === 'db-query' && t.includes('sql injection')) return true;
      if (line.kind === 'route' && (t.includes('auth') || t.includes('unprotected'))) return true;
      if (line.kind === 'route' && t.includes('rate')) return true;
      return false;
    });
    if (!hit) continue;
    const indent = line.text.length - line.text.trimStart().length;
    out.push({
      line: line.n,
      colStart: indent,
      colEnd: Math.max(indent + 1, line.text.length),
      severity: hit.severity === 'critical' || hit.severity === 'high' ? 'error' : 'warning',
      message: hit.title,
      source: 'finding',
    });
  }
  return out;
}

/** Group all squiggles by 1-based line number for O(1) lookup per rendered line. */
function groupSquiggles(all: SquiggleMarker[]): Map<number, SquiggleMarker[]> {
  const map = new Map<number, SquiggleMarker[]>();
  for (const m of all) {
    const list = map.get(m.line);
    if (list) list.push(m);
    else map.set(m.line, [m]);
  }
  return map;
}

interface CodeIntelPanelProps {
  projectId: string | null;
  node: CanvasNode;
  diagnostics: Diagnostic[];
  onClose: () => void;
  /** Current panel width in px. */
  width: number;
  /** Begin a drag-resize from the left-edge handle. */
  onResizeStart: (e: React.MouseEvent) => void;
  /** Fired when the open file's live syntax-error state changes (for node highlighting). */
  onSyntaxState?: (hasError: boolean) => void;
}

/** A thin left-edge bar the user drags to resize the panel. */
function ResizeHandle({ onResizeStart }: { onResizeStart: (e: React.MouseEvent) => void }) {
  return (
    <div
      className="panel-resize-handle on-dark"
      onMouseDown={onResizeStart}
      title="Drag to resize"
      role="separator"
      aria-orientation="vertical"
    />
  );
}

/** Column wrapper: resolves the file from the locked node and hosts the view. */
export function CodeIntelPanel({
  projectId,
  node,
  diagnostics,
  onClose,
  width,
  onResizeStart,
  onSyntaxState,
}: CodeIntelPanelProps) {
  if (!projectId || !node.filePath) {
    return (
      <aside className="code-panel" style={{ width }}>
        <ResizeHandle onResizeStart={onResizeStart} />
        <header className="code-panel-head">
          <span className="code-panel-title">Code Intelligence</span>
          <button className="code-icon-btn" onClick={onClose} title="Close">✕</button>
        </header>
        <div className="code-empty">This node has no source file to inspect.</div>
      </aside>
    );
  }

  // Findings that touch this node, used to promote fix actions to the top.
  const nodeFindings = useMemo(
    () => diagnostics.filter((d) => d.relatedNodeIds.includes(node.id)),
    [diagnostics, node.id],
  );

  return (
    <aside className="code-panel" style={{ width }}>
      <ResizeHandle onResizeStart={onResizeStart} />
      <CodeIntelView
        projectId={projectId}
        filePath={node.filePath}
        findings={nodeFindings}
        onClose={onClose}
        onSyntaxState={onSyntaxState}
      />
    </aside>
  );
}

interface ViewProps {
  projectId: string;
  filePath: string;
  findings: Diagnostic[];
  onClose: () => void;
  onSyntaxState?: (hasError: boolean) => void;
  /** Secondary instances float over the canvas instead of filling the column. */
  floating?: boolean;
}

/** The workhorse view: header, navigator, highlighted code, menus, overlays. */
function CodeIntelView({ projectId, filePath, findings, onClose, onSyntaxState, floating }: ViewProps) {
  const [intel, setIntel] = useState<FileIntel | null>(null);
  // Live syntax squiggles from unsaved edits; null means "use the on-disk set".
  const [liveSquiggles, setLiveSquiggles] = useState<SquiggleMarker[] | null>(null);
  const syntaxTimer = useRef<number | null>(null);
  // Syntax squiggles (live if editing, else on-disk) + whole-line finding squiggles.
  const squigglesByLine = useMemo(() => {
    if (!intel) return new Map<number, SquiggleMarker[]>();
    const syntax = liveSquiggles ?? intel.squiggles;
    return groupSquiggles([...syntax, ...findingSquiggles(intel.lines, findings)]);
  }, [intel, liveSquiggles, findings]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [impact, setImpact] = useState<ImpactAnalysis | null>(null);
  const [impactBusy, setImpactBusy] = useState(false);
  // Inline ghost suggestion. Hovering an action shows a transient preview; clicking
  // locks it (stops following hover) so the confirm bar can be reached. Tap/Tab
  // confirms and applies, Esc dismisses.
  const [ghost, setGhost] = useState<{
    line: number;
    after: string[];
    impact: ImpactAnalysis;
    locked: boolean;
    key: string;
  } | null>(null);
  const [ghostApplying, setGhostApplying] = useState(false);
  const hoverTimer = useRef<number | null>(null);
  const [popover, setPopover] = useState<{ line: number; symbol: string; refs: CodeReference[] } | null>(null);
  const [secondary, setSecondary] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);

  // Find-in-file state (an in-panel find bar, not the browser's native find).
  const [findOpen, setFindOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeMatch, setActiveMatch] = useState(0);
  const findInputRef = useRef<HTMLInputElement>(null);

  // Editing state. Per-line edits are kept in a ref so typing never re-renders
  // (which would fight the contentEditable cursor). `dirty` only flips once.
  const editsRef = useRef<Map<number, string>>(new Map());
  const dirtyRef = useRef(false);
  const [dirty, setDirty] = useState(false);
  // Bumped to force a fresh mount of all lines (used by Discard to reset DOM).
  const [bodyKey, setBodyKey] = useState(0);
  // Bumped after a successful save to reload the file from disk.
  const [reloadTick, setReloadTick] = useState(0);

  const resetEdits = useCallback(() => {
    editsRef.current.clear();
    dirtyRef.current = false;
    setDirty(false);
    setBodyKey((k) => k + 1);
    setLiveSquiggles(null);
    onSyntaxState?.(false);
  }, [onSyntaxState]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setOpenMenu(null);
    setImpact(null);
    setPopover(null);
    editsRef.current.clear();
    dirtyRef.current = false;
    setDirty(false);
    setLiveSquiggles(null);
    onSyntaxState?.(false);
    fetchFileIntel(projectId, filePath).then((res) => {
      if (!cancelled) {
        setIntel(res.intel);
        setLoadError(res.error);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [projectId, filePath, reloadTick]);

  const jumpToLine = useCallback((line: number) => {
    const el = bodyRef.current?.querySelector<HTMLElement>(`[data-line="${line}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('line-flash');
      setTimeout(() => el.classList.remove('line-flash'), 1200);
    }
  }, []);

  // ---- Find in file -------------------------------------------------------
  // Every case-insensitive occurrence of the query across the raw line text.
  const matches = useMemo(() => {
    if (!intel || !query) return [] as number[];
    const q = query.toLowerCase();
    const lines: number[] = [];
    for (const l of intel.lines) {
      const text = l.text.toLowerCase();
      let idx = text.indexOf(q);
      while (idx !== -1) {
        lines.push(l.n);
        idx = text.indexOf(q, idx + q.length);
      }
    }
    return lines;
  }, [intel, query]);

  const matchLines = useMemo(() => new Set(matches), [matches]);
  const activeLine = matches.length > 0 ? matches[Math.min(activeMatch, matches.length - 1)] : null;

  // Reset the active match whenever the query changes.
  useEffect(() => {
    setActiveMatch(0);
  }, [query]);

  // Keep the active match scrolled into view as the user navigates.
  useEffect(() => {
    if (findOpen && activeLine !== null) {
      const el = bodyRef.current?.querySelector<HTMLElement>(`[data-line="${activeLine}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLine, findOpen]);

  const openFind = useCallback(() => {
    setFindOpen(true);
    requestAnimationFrame(() => findInputRef.current?.focus());
  }, []);
  const closeFind = useCallback(() => {
    setFindOpen(false);
    setQuery('');
  }, []);
  const nextMatch = useCallback(() => {
    setActiveMatch((m) => (matches.length === 0 ? 0 : (m + 1) % matches.length));
  }, [matches.length]);
  const prevMatch = useCallback(() => {
    setActiveMatch((m) => (matches.length === 0 ? 0 : (m - 1 + matches.length) % matches.length));
  }, [matches.length]);

  // Cmd/Ctrl+F opens the in-panel find bar when the panel is focused/hovered.
  useEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        if (findOpen) closeFind();
        else openFind();
      }
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [closeFind, findOpen, openFind]);

  const openReferences = useCallback(
    async (line: number, symbol: string) => {
      setOpenMenu(null);
      const refs = await fetchReferences(projectId, filePath, line, symbol);
      setPopover({ line, symbol, refs });
    },
    [projectId, filePath],
  );

  // Fetch impact and turn it into an inline ghost for this file, or the impact
  // page when the change lands only in other files. `locked` persists it past hover.
  const showGhost = useCallback(
    async (line: LineInfo, action: LineAction, locked: boolean) => {
      const result = await fetchImpact(projectId, filePath, line.n, action.id);
      if (!result) return;
      const here = result.affected.find((f) => f.path === filePath);
      const hunk = here?.hunks[0];
      if (hunk && hunk.after.length > 0) {
        setGhost({ line: hunk.startLine, after: hunk.after, impact: result, locked, key: action.id });
      } else if (locked) {
        setImpact(result);
      }
    },
    [projectId, filePath],
  );

  // Hover an action → transient preview (debounced so moving across the menu
  // doesn't fire a request per option).
  const previewAction = useCallback(
    (line: LineInfo, action: LineAction) => {
      if (action.kind !== 'edit') return;
      if (ghost?.locked) return;
      if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
      hoverTimer.current = window.setTimeout(() => showGhost(line, action, false), 220);
    },
    [ghost, showGhost],
  );

  const clearPreview = useCallback(() => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    setGhost((g) => (g && !g.locked ? null : g));
  }, []);

  const runAction = useCallback(
    async (line: LineInfo, action: LineAction) => {
      if (action.kind === 'reference') {
        await openReferences(line.n, line.symbol ?? '');
        return;
      }
      setOpenMenu(null);
      await showGhost(line, action, true);
    },
    [openReferences, showGhost],
  );

  const dismissGhost = useCallback(() => setGhost(null), []);

  // Stable callbacks so memoized lines aren't re-rendered while editing.
  const toggleMenu = useCallback((n: number) => {
    setOpenMenu((p) => (p === n ? null : n));
  }, []);

  const badgeFor = useCallback(
    (line: LineInfo) => openReferences(line.n, line.symbol ?? ''),
    [openReferences],
  );

  // Reconstruct the full file from the original lines plus any edits.
  const buildEditedContent = useCallback(() => {
    if (!intel) return '';
    return intel.lines.map((l) => (editsRef.current.has(l.n) ? editsRef.current.get(l.n)! : l.text)).join('\n');
  }, [intel]);

  const onEditLine = useCallback(
    (n: number, text: string) => {
      editsRef.current.set(n, text);
      if (!dirtyRef.current) {
        dirtyRef.current = true;
        setDirty(true);
      }
      // Debounced live syntax check on the unsaved buffer.
      if (syntaxTimer.current) window.clearTimeout(syntaxTimer.current);
      syntaxTimer.current = window.setTimeout(async () => {
        const marks = await checkSyntax(filePath, buildEditedContent());
        setLiveSquiggles(marks);
        onSyntaxState?.(marks.some((m) => m.severity === 'error'));
      }, 400);
    },
    [filePath, buildEditedContent, onSyntaxState],
  );

  const onSave = useCallback(async () => {
    if (!intel) return;
    setImpactBusy(true);
    const result = await fetchEditImpact(projectId, filePath, buildEditedContent());
    setImpactBusy(false);
    if (result && result.affected.length > 0) {
      setImpact(result);
    } else {
      // No detectable change — just clear the dirty state.
      resetEdits();
    }
  }, [intel, projectId, filePath, buildEditedContent, resetEdits]);

  // After the edit is written to disk, drop the dirty state and reload from disk.
  const onSaveApplied = useCallback(() => {
    setImpact(null);
    editsRef.current.clear();
    dirtyRef.current = false;
    setDirty(false);
    setLiveSquiggles(null);
    onSyntaxState?.(false);
    setReloadTick((t) => t + 1);
  }, [onSyntaxState]);

  const confirmGhost = useCallback(async () => {
    if (!ghost) return;
    setGhostApplying(true);
    const res = await applyImpact(projectId, ghost.impact);
    setGhostApplying(false);
    setGhost(null);
    if (res?.ok) onSaveApplied();
  }, [ghost, projectId, onSaveApplied]);

  // Once a ghost is locked in, Tab confirms and Esc dismisses.
  useEffect(() => {
    if (!ghost?.locked) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        if (!ghostApplying) confirmGhost();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        dismissGhost();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [ghost, ghostApplying, confirmGhost, dismissGhost]);

  const fileName = filePath.split('/').pop() ?? filePath;

  return (
    <div className={`code-view ${floating ? 'code-view-floating' : ''}`} ref={viewRef} tabIndex={-1}>
      <header className="code-panel-head">
        <div className="code-panel-titlewrap">
          <span className="code-panel-title">
            {fileName}
            {dirty && <span className="code-dirty-dot" title="Unsaved changes">● Unsaved</span>}
          </span>
          <span className="code-panel-path">{filePath}</span>
        </div>
        <div className="code-head-actions">
          {dirty && (
            <>
              <button className="code-head-btn discard" onClick={resetEdits} title="Discard changes">
                Discard
              </button>
              <button className="code-head-btn save" onClick={onSave} title="Review & save changes">
                Save
              </button>
            </>
          )}
          <button className="code-icon-btn" onClick={onClose} title="Close panel">✕</button>
        </div>
      </header>

      <div className="code-toolbar">
        <SymbolNavigator intel={intel} onJump={jumpToLine} />
        <div className={`code-find-bar ${findOpen ? 'is-open' : ''}`}>
          <button
            className={`code-icon-btn code-find-toggle ${findOpen ? 'active' : ''}`}
            onClick={() => (findOpen ? closeFind() : openFind())}
            title="Find in file (⌘F)"
            aria-label="Find in file"
          >
            <Search size={14} />
          </button>
          {findOpen && (
            <>
              <input
                ref={findInputRef}
                className="code-find-input"
                placeholder="Find in file..."
                value={query}
                spellCheck={false}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    closeFind();
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (e.shiftKey) prevMatch();
                    else nextMatch();
                  }
                }}
              />
              <span className={`code-find-count ${query && matches.length === 0 ? 'no-results' : ''}`}>
                {query
                  ? matches.length === 0
                    ? 'No results'
                    : `${activeMatch + 1} of ${matches.length}`
                  : ''}
              </span>
              <button
                className="code-find-nav"
                onClick={prevMatch}
                disabled={matches.length === 0}
                title="Previous match (Shift+Enter)"
                aria-label="Previous match"
              >
                <ChevronUp size={14} />
              </button>
              <button
                className="code-find-nav"
                onClick={nextMatch}
                disabled={matches.length === 0}
                title="Next match (Enter)"
                aria-label="Next match"
              >
                <ChevronDown size={14} />
              </button>
              <button className="code-find-nav" onClick={closeFind} title="Close (Esc)" aria-label="Close find">
                <X size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="code-empty">Reading {fileName} …</div>
      ) : !intel ? (
        <div className="code-empty code-error">
          <strong>Could not load this file.</strong>
          <span className="code-error-detail">{loadError ?? 'Unknown error.'}</span>
        </div>
      ) : (
        <div className="code-body" ref={bodyRef} key={bodyKey}>
          {intel.lines.map((line) => (
            <Fragment key={line.n}>
              <CodeLine
                line={line}
                findings={findings}
                squiggles={squigglesByLine.get(line.n) ?? NO_SQUIGGLES}
                menuOpen={openMenu === line.n}
                dimMenu={Boolean(ghost && !ghost.locked)}
                onToggleMenu={toggleMenu}
                onAction={runAction}
                onActionHover={previewAction}
                onActionLeave={clearPreview}
                onBadge={badgeFor}
                onEdit={onEditLine}
                isFindMatch={findOpen && matchLines.has(line.n)}
                isFindActive={findOpen && activeLine === line.n}
                query={findOpen ? query : ''}
              />
              {ghost && ghost.line === line.n && (
                <div className={`ghost-suggestion ${ghost.locked ? 'locked' : 'preview'}`} role="note">
                  {ghost.after.map((t, i) => (
                    <div key={i} className="ghost-line">
                      <span className="code-lineno" />
                      <code className="code-text ghost-text">{t || ' '}</code>
                    </div>
                  ))}
                  {ghost.locked && (
                    <div className="ghost-actions">
                      <button className="ghost-btn confirm" onClick={confirmGhost} disabled={ghostApplying}>
                        {ghostApplying ? 'Applying…' : 'Confirm (Tab)'}
                      </button>
                      <button className="ghost-btn" onClick={dismissGhost} disabled={ghostApplying}>
                        Dismiss (Esc)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </Fragment>
          ))}
        </div>
      )}

      {impactBusy && <div className="code-toast">Scanning project for impact …</div>}

      {impact && (
        <ImpactView
          projectId={projectId}
          impact={impact}
          onClose={() => setImpact(null)}
          onApplied={() =>
            impact.request.actionId === 'manual-edit' ? onSaveApplied() : setImpact(null)
          }
        />
      )}

      {popover && (
        <ConnectionsPopover
          symbol={popover.symbol}
          refs={popover.refs}
          onClose={() => setPopover(null)}
          onOpenFile={(p) => {
            setPopover(null);
            setSecondary(p);
          }}
        />
      )}

      {secondary && (
        <div className="code-secondary-overlay">
          <CodeIntelView
            projectId={projectId}
            filePath={secondary}
            findings={NO_FINDINGS}
            floating
            onClose={() => setSecondary(null)}
          />
        </div>
      )}
    </div>
  );
}

/** The function/class/route/method navigator dropdown. */
function SymbolNavigator({ intel, onJump }: { intel: FileIntel | null; onJump: (line: number) => void }) {
  const count = intel?.symbols.length ?? 0;
  return (
    <select
      className="code-nav-select"
      value=""
      disabled={count === 0}
      onChange={(e) => {
        const line = Number(e.target.value);
        if (line) onJump(line);
        e.currentTarget.value = '';
      }}
    >
      <option value="">{count > 0 ? `Navigate (${count} symbols)…` : 'No symbols detected'}</option>
      {intel?.symbols.map((s) => (
        <option key={`${s.kind}-${s.name}-${s.line}`} value={s.line}>
          {symbolGlyph(s.kind)} {s.name}  · L{s.line}
        </option>
      ))}
    </select>
  );
}

function symbolGlyph(kind: string): string {
  switch (kind) {
    case 'function': return 'ƒ';
    case 'class': return '◇';
    case 'method': return '·ƒ';
    case 'route': return '→';
    case 'type': return 'T';
    default: return '•';
  }
}

/**
 * A single rendered source line: gutter dot, number, editable tokens, badge,
 * menu. The code text is contentEditable so the user can click and type. It is
 * memoized with stable callbacks so typing never re-renders the line (which
 * would reset the DOM and lose the cursor). Edits are reported up via onEdit.
 */
const CodeLine = memo(function CodeLine({
  line,
  findings,
  squiggles,
  menuOpen,
  dimMenu = false,
  onToggleMenu,
  onAction,
  onActionHover,
  onActionLeave,
  onBadge,
  onEdit,
  isFindMatch = false,
  isFindActive = false,
  query = '',
}: {
  line: LineInfo;
  findings: Diagnostic[];
  squiggles: SquiggleMarker[];
  menuOpen: boolean;
  dimMenu?: boolean;
  onToggleMenu: (n: number) => void;
  onAction: (line: LineInfo, a: LineAction) => void;
  onActionHover: (line: LineInfo, a: LineAction) => void;
  onActionLeave: () => void;
  onBadge: (line: LineInfo) => void;
  onEdit: (n: number, text: string) => void;
  isFindMatch?: boolean;
  isFindActive?: boolean;
  query?: string;
}) {
  const tokens = useMemo(() => tokenizeLine(line.text), [line.text]);
  const actions = useMemo(() => promoteFindingActions(line, findings), [line, findings]);

  // While a search is active, matched lines render their text with the query
  // occurrences highlighted; otherwise the normal token coloring is used.
  const highlighted = useMemo(() => {
    if (!query || !isFindMatch) return null;
    return buildHighlighted(line.text, query, isFindActive);
  }, [query, isFindMatch, isFindActive, line.text]);

  return (
    <div className={`code-line${isFindActive ? ' find-active-line' : ''}`} data-line={line.n}>
      <button
        className={`code-gutter-toggle ${menuOpen ? 'open' : ''}`}
        onClick={() => onToggleMenu(line.n)}
        title="Line actions"
      >
        <span className="gutter-dot">▾</span>
      </button>
      <span className={`code-lineno${squiggles.length ? ' has-squiggle' : ''}`}>{line.n}</span>
      <span className="code-text-wrap">
      <code
        className="code-text"
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        onInput={(e) => onEdit(line.n, e.currentTarget.textContent ?? '')}
        onKeyDown={(e) => {
          // Keep the per-line model intact: Enter would split a line into block
          // children and corrupt textContent, so suppress it.
          if (e.key === 'Enter') e.preventDefault();
        }}
      >
        {highlighted ? (
          highlighted
        ) : tokens.length === 0 ? (
          ' '
        ) : (
          tokens.map((t, i) => (
            <span key={i} className={`tok tok-${t.type}`}>
              {t.text}
            </span>
          ))
        )}
      </code>
        {squiggles.length > 0 && (
          <span className="squiggle-layer" aria-hidden="true">
            {squiggles.map((s, i) => (
              <span
                key={i}
                className={`squiggle squiggle-${s.severity}`}
                style={{ left: `${s.colStart}ch`, width: `${Math.max(1, s.colEnd - s.colStart)}ch` }}
                title={s.message}
              />
            ))}
          </span>
        )}
      </span>
      {line.refCount > 0 && (
        <button className="code-conn-badge" onClick={() => onBadge(line)} title="Show references">
          used in {line.refCount} {line.refCount === 1 ? 'file' : 'files'}
        </button>
      )}

      {menuOpen && (
        <div className={`code-line-menu${dimMenu ? ' menu-dimmed' : ''}`}>
          {line.context && (
            <div className="menu-breadcrumb" title="Where this line sits in the code">
              {line.context.breadcrumb}
            </div>
          )}
          <div className="menu-section">
            <div className="menu-section-title">What this does</div>
            <p className="menu-explanation">{line.explanation}</p>
          </div>
          <div className="menu-section">
            <div className="menu-section-title">What you can do here</div>
            <ul className="menu-actions">
              {actions.map((a) => (
                <li key={a.id + a.label}>
                  <button
                    className={`menu-action ${a.fromFinding || a.critical ? 'from-finding' : ''}`}
                    onClick={() => onAction(line, a)}
                    onMouseEnter={() => onActionHover(line, a)}
                    onMouseLeave={onActionLeave}
                  >
                    {(a.fromFinding || a.critical) && <span className="finding-spark">⚠</span>}
                    {a.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
});

/**
 * Render a line's text with every case-insensitive occurrence of `query`
 * wrapped in a highlight mark. On the active line the marks use the brighter
 * (active) style.
 */
function buildHighlighted(text: string, query: string, active: boolean): ReactNode[] {
  const q = query.toLowerCase();
  if (!q) return [text];
  const lower = text.toLowerCase();
  const out: ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i <= text.length) {
    const idx = lower.indexOf(q, i);
    if (idx === -1) {
      if (i < text.length) out.push(<span key={key++}>{text.slice(i)}</span>);
      break;
    }
    if (idx > i) out.push(<span key={key++}>{text.slice(i, idx)}</span>);
    out.push(
      <mark key={key++} className={`code-find-hl${active ? ' active' : ''}`}>
        {text.slice(idx, idx + query.length)}
      </mark>,
    );
    i = idx + query.length;
  }
  return out;
}

/**
 * Promote pipeline-finding fixes to the top of a line's action list when a
 * finding relates to this node and matches the line's role.
 */
function promoteFindingActions(line: LineInfo, findings: Diagnostic[]): LineAction[] {
  const promoted: LineAction[] = [];
  for (const f of findings) {
    const t = f.title.toLowerCase();
    if (line.kind === 'db-query' && t.includes('sql injection')) {
      promoted.push({ id: 'fix-sql-injection', label: 'Fix SQL injection', kind: 'edit', fromFinding: true });
    }
    if (line.kind === 'route' && (t.includes('auth') || t.includes('unprotected'))) {
      promoted.push({ id: 'add-auth-check', label: 'Add authentication', kind: 'edit', fromFinding: true });
    }
    if (line.kind === 'route' && t.includes('rate')) {
      promoted.push({ id: 'add-rate-limiting', label: 'Add rate limiting', kind: 'edit', fromFinding: true });
    }
  }
  // Dedupe promoted, then append the base actions that are not already promoted.
  const seen = new Set(promoted.map((a) => a.id));
  const base = line.actions.filter((a) => !seen.has(a.id));
  return [...promoted, ...base];
}

/** Render a file's hunks as a stacked before(red)/after(green) diff. */
function FileDiff({ file }: { file: AffectedFile }) {
  return (
    <div className="impact-diff">
      {file.hunks.map((h, hi) => (
        <div key={hi} className="diff-hunk">
          <div className="diff-hunk-loc">@ line {h.startLine}</div>
          {h.before.map((l, li) => (
            <div key={`b${li}`} className="diff-line removed">
              <span className="diff-sign">-</span>
              <code>{l || ' '}</code>
            </div>
          ))}
          {h.after.map((l, li) => (
            <div key={`a${li}`} className="diff-line added">
              <span className="diff-sign">+</span>
              <code>{l || ' '}</code>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * The Impact Analysis split panel: a full-screen overlay over the canvas.
 * Top bar shows the file count + a severity indicator. Left pane shows the
 * primary edited file's diff; right pane lists every other affected file,
 * expandable to its line-level before/after diff. Apply writes everything to
 * disk (with a timestamped backup in brain/backups); Cancel discards.
 */
function ImpactView({
  projectId,
  impact,
  onClose,
  onApplied,
}: {
  projectId: string;
  impact: ImpactAnalysis;
  onClose: () => void;
  onApplied: () => void;
}) {
  const { hasApiKey, openApiKeys } = useApiKeyContext();
  const primary =
    impact.affected.find((f) => f.path === impact.request.path) ?? impact.affected[0] ?? null;
  const others = impact.affected.filter((f) => f !== primary);

  const [expanded, setExpanded] = useState<Set<string>>(new Set(others.map((f) => f.path)));
  const [applying, setApplying] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  // Severity scales with blast radius: 1 file = low, 2-3 = medium, 4+ = high.
  const count = impact.affected.length;
  const severity = count <= 1 ? 'low' : count <= 3 ? 'medium' : 'high';

  const toggle = (p: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(p) ? next.delete(p) : next.add(p);
      return next;
    });

  const apply = async () => {
    setApplying(true);
    const res = await applyImpact(projectId, impact);
    setApplying(false);
    if (res?.ok) {
      setDone(`Applied to ${res.written.length} file${res.written.length === 1 ? '' : 's'}. Backup saved to brain/backups.`);
      setTimeout(onApplied, 1400);
    } else {
      setDone(res?.error ? `Failed: ${res.error}` : 'Failed to apply changes.');
    }
  };

  return (
    <div className="impact-overlay">
      <div className="impact-panel">
        <header className="impact-head">
          <div className="impact-head-text">
            <h3>Impact Analysis</h3>
            <p className="impact-summary">
              This change affects {count} file{count === 1 ? '' : 's'}.
            </p>
          </div>
          <span className={`impact-severity sev-${severity}`}>{severity} impact</span>
          <button className="code-icon-btn" onClick={onClose} title="Cancel">✕</button>
        </header>

        <div className="impact-split">
          <section className="impact-pane impact-pane-left">
            <div className="impact-pane-title">
              <span className="impact-pane-label">Editing</span>
              <span className="impact-file-path">{primary?.path ?? impact.request.path}</span>
            </div>
            {primary ? (
              <FileDiff file={primary} />
            ) : (
              <div className="impact-empty">No direct change to preview.</div>
            )}
          </section>
          <section className="impact-pane impact-pane-right">
            <div className="impact-pane-title">
              <span className="impact-pane-label">
                {others.length} other file{others.length === 1 ? '' : 's'} affected
              </span>
            </div>
            {others.length === 0 && (
              <div className="impact-empty">No other files are affected by this change.</div>
            )}
          {others.map((file) => (
            <div key={file.path} className="impact-file">
              <button className="impact-file-head" onClick={() => toggle(file.path)}>
                <span className="impact-file-caret">{expanded.has(file.path) ? '▾' : '▸'}</span>
                <span className="impact-file-path">{file.path}</span>
                <span className="impact-file-reason">{file.reason}</span>
              </button>
              {expanded.has(file.path) && (
                <div className="impact-diff">
                  {file.hunks.map((h, hi) => (
                    <div key={hi} className="diff-hunk">
                      <div className="diff-hunk-loc">@ line {h.startLine}</div>
                      {h.before.map((l, li) => (
                        <div key={`b${li}`} className="diff-line removed">
                          <span className="diff-sign">-</span>
                          <code>{l || ' '}</code>
                        </div>
                      ))}
                      {h.after.map((l, li) => (
                        <div key={`a${li}`} className="diff-line added">
                          <span className="diff-sign">+</span>
                          <code>{l || ' '}</code>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          </section>
        </div>

        {!hasApiKey && (
          <div className="impact-confidence-note">
            <NudgeText tone="muted">
              Impact analysis is estimated from static references.{' '}
            </NudgeText>
            <NudgeText tone="amber" onClick={openApiKeys}>
              ⚡ Connect API key for AI-powered impact tracing.
            </NudgeText>
          </div>
        )}

        <footer className="impact-foot">
          {done ? (
            <span className="impact-done">{done}</span>
          ) : (
            <>
              <button className="impact-btn cancel" onClick={onClose} disabled={applying}>
                Cancel
              </button>
              <button className="impact-btn apply" onClick={apply} disabled={applying}>
                {applying ? 'Applying…' : 'Apply All Changes'}
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}

/** Popover listing every file that references a line's symbol. */
function ConnectionsPopover({
  symbol,
  refs,
  onClose,
  onOpenFile,
}: {
  symbol: string;
  refs: CodeReference[];
  onClose: () => void;
  onOpenFile: (path: string) => void;
}) {
  return (
    <div className="conn-popover">
      <header className="conn-pop-head">
        <span>
          <strong>{symbol || 'symbol'}</strong> · {refs.length} reference{refs.length === 1 ? '' : 's'}
        </span>
        <button className="code-icon-btn" onClick={onClose} title="Close">✕</button>
      </header>
      <ul className="conn-pop-list">
        {refs.length === 0 && <li className="conn-pop-empty">No references found in this project.</li>}
        {refs.map((r, i) => (
          <li key={i}>
            <button className="conn-pop-item" onClick={() => onOpenFile(r.path)}>
              <span className="conn-pop-loc">
                {r.path}:{r.line}
              </span>
              <code className="conn-pop-snippet">{r.snippet}</code>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
