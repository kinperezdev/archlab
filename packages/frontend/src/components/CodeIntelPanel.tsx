/**
 * Code Intelligence Panel.
 *
 * Slides in as a third column when a node is locked on the canvas. Shows the
 * node's source file straight from disk: syntax highlighted, every line
 * explained and actionable, every reachable symbol navigable, every referenced
 * line badged with "used in N files". Picking a line action runs Impact
 * Analysis (a project-wide before/after diff) that can be applied to disk.
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  CanvasNode,
  Diagnostic,
  FileIntel,
  LineAction,
  LineInfo,
  CodeReference,
  ImpactAnalysis,
  AffectedFile,
} from '@archlab/shared';
import { tokenizeLine } from '../lib/codeHighlight.js';
import {
  fetchFileIntel,
  fetchReferences,
  fetchImpact,
  fetchEditImpact,
  applyImpact,
} from '../lib/codeApi.js';

/** Stable empty findings array so memoized lines don't re-render needlessly. */
const NO_FINDINGS: Diagnostic[] = [];

interface CodeIntelPanelProps {
  projectId: string | null;
  node: CanvasNode;
  diagnostics: Diagnostic[];
  onClose: () => void;
  /** Current panel width in px. */
  width: number;
  /** Begin a drag-resize from the left-edge handle. */
  onResizeStart: (e: React.MouseEvent) => void;
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
      />
    </aside>
  );
}

interface ViewProps {
  projectId: string;
  filePath: string;
  findings: Diagnostic[];
  onClose: () => void;
  /** Secondary instances float over the canvas instead of filling the column. */
  floating?: boolean;
}

/** The workhorse view: header, navigator, highlighted code, menus, overlays. */
function CodeIntelView({ projectId, filePath, findings, onClose, floating }: ViewProps) {
  const [intel, setIntel] = useState<FileIntel | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [impact, setImpact] = useState<ImpactAnalysis | null>(null);
  const [impactBusy, setImpactBusy] = useState(false);
  const [popover, setPopover] = useState<{ line: number; symbol: string; refs: CodeReference[] } | null>(null);
  const [secondary, setSecondary] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

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
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setOpenMenu(null);
    setImpact(null);
    setPopover(null);
    editsRef.current.clear();
    dirtyRef.current = false;
    setDirty(false);
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

  const openReferences = useCallback(
    async (line: number, symbol: string) => {
      setOpenMenu(null);
      const refs = await fetchReferences(projectId, filePath, line, symbol);
      setPopover({ line, symbol, refs });
    },
    [projectId, filePath],
  );

  const runAction = useCallback(
    async (line: LineInfo, action: LineAction) => {
      if (action.kind === 'reference') {
        await openReferences(line.n, line.symbol ?? '');
        return;
      }
      setOpenMenu(null);
      setImpactBusy(true);
      const result = await fetchImpact(projectId, filePath, line.n, action.id);
      setImpactBusy(false);
      if (result) setImpact(result);
    },
    [projectId, filePath, openReferences],
  );

  // Stable callbacks so memoized lines aren't re-rendered while editing.
  const toggleMenu = useCallback((n: number) => {
    setOpenMenu((p) => (p === n ? null : n));
  }, []);

  const badgeFor = useCallback(
    (line: LineInfo) => openReferences(line.n, line.symbol ?? ''),
    [openReferences],
  );

  const onEditLine = useCallback((n: number, text: string) => {
    editsRef.current.set(n, text);
    if (!dirtyRef.current) {
      dirtyRef.current = true;
      setDirty(true);
    }
  }, []);

  // Reconstruct the full file from the original lines plus any edits.
  const buildEditedContent = useCallback(() => {
    if (!intel) return '';
    return intel.lines.map((l) => (editsRef.current.has(l.n) ? editsRef.current.get(l.n)! : l.text)).join('\n');
  }, [intel]);

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
    setReloadTick((t) => t + 1);
  }, []);

  const fileName = filePath.split('/').pop() ?? filePath;

  return (
    <div className={`code-view ${floating ? 'code-view-floating' : ''}`}>
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
            <CodeLine
              key={line.n}
              line={line}
              findings={findings}
              menuOpen={openMenu === line.n}
              onToggleMenu={toggleMenu}
              onAction={runAction}
              onBadge={badgeFor}
              onEdit={onEditLine}
            />
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
  menuOpen,
  onToggleMenu,
  onAction,
  onBadge,
  onEdit,
}: {
  line: LineInfo;
  findings: Diagnostic[];
  menuOpen: boolean;
  onToggleMenu: (n: number) => void;
  onAction: (line: LineInfo, a: LineAction) => void;
  onBadge: (line: LineInfo) => void;
  onEdit: (n: number, text: string) => void;
}) {
  const tokens = useMemo(() => tokenizeLine(line.text), [line.text]);
  const actions = useMemo(() => promoteFindingActions(line, findings), [line, findings]);

  return (
    <div className="code-line" data-line={line.n}>
      <button
        className={`code-gutter-toggle ${menuOpen ? 'open' : ''}`}
        onClick={() => onToggleMenu(line.n)}
        title="Line actions"
      >
        <span className="gutter-dot">▾</span>
      </button>
      <span className="code-lineno">{line.n}</span>
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
        {tokens.length === 0 ? (
          ' '
        ) : (
          tokens.map((t, i) => (
            <span key={i} className={`tok tok-${t.type}`}>
              {t.text}
            </span>
          ))
        )}
      </code>
      {line.refCount > 0 && (
        <button className="code-conn-badge" onClick={() => onBadge(line)} title="Show references">
          used in {line.refCount} {line.refCount === 1 ? 'file' : 'files'}
        </button>
      )}

      {menuOpen && (
        <div className="code-line-menu">
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
