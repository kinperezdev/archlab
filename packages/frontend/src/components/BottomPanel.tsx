/**
 * Bottom panel: a tabbed surface with multiple independent terminal sessions
 * plus the backend log stream.
 *
 * Each terminal tab is its own PTY (own cwd, history, and running process), so
 * you can have `npm run dev` in one, git in another, and an AI agent CLI in a
 * third — all live at once. The first terminal can't be closed. Right-click a
 * tab to rename, duplicate, or close it.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { LogLine } from '../state/useArchLab.js';
import { Terminal, type TerminalApi } from './Terminal.js';

interface BottomPanelProps {
  logs: LogLine[];
  terminalApi: TerminalApi;
  height: number;
  onResize: (height: number) => void;
  /** Collapse the whole panel to zero height. */
  onCollapse: () => void;
  /** Hide the collapse toggle (e.g. while a modal is open). */
  toggleHidden?: boolean;
  /** Hide the panel with CSS (display:none) WITHOUT unmounting it, so every
   *  terminal's PTY session, scrollback, and cwd survive being collapsed. */
  hidden?: boolean;
}

const TABS_KEY = 'archlab:term-tabs';
const ACTIVE_KEY = 'archlab:term-active';

/** Restore the tab list from sessionStorage so a refresh keeps the same tabs. */
function loadTabs(): TermTab[] {
  try {
    const raw = sessionStorage.getItem(TABS_KEY);
    const parsed = raw ? (JSON.parse(raw) as TermTab[]) : null;
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    /* fall through to default */
  }
  return [{ id: 'term-1', title: 'Terminal 1' }];
}

interface TermTab {
  id: string;
  title: string;
}

interface ContextMenu {
  tabId: string;
  x: number;
  y: number;
}

/** Monotonic id source so reused titles never collide with live sessions. */
let nextTermSeq = 2;
const newTermId = () => `term-${nextTermSeq++}-${Date.now().toString(36)}`;

export function BottomPanel({
  logs,
  terminalApi,
  height,
  onResize,
  onCollapse,
  toggleHidden,
  hidden,
}: BottomPanelProps) {
  const [tabs, setTabs] = useState<TermTab[]>(() => loadTabs());
  const [active, setActive] = useState<string>(
    () => sessionStorage.getItem(ACTIVE_KEY) ?? 'term-1',
  );
  const [menu, setMenu] = useState<ContextMenu | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (active === 'logs') logEndRef.current?.scrollIntoView({ block: 'end' });
  }, [logs, active]);

  // Persist tabs + active selection so a refresh restores the same layout.
  useEffect(() => {
    sessionStorage.setItem(TABS_KEY, JSON.stringify(tabs));
  }, [tabs]);
  useEffect(() => {
    sessionStorage.setItem(ACTIVE_KEY, active);
  }, [active]);

  // Dismiss the context menu on any outside click.
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('resize', close);
    };
  }, [menu]);

  const addTab = useCallback(() => {
    const id = newTermId();
    const title = `Terminal ${tabs.length + 1}`;
    setTabs((t) => [...t, { id, title }]);
    setActive(id);
  }, [tabs.length]);

  const duplicateTab = (sourceId: string) => {
    const src = tabs.find((t) => t.id === sourceId);
    const id = newTermId();
    setTabs((t) => [...t, { id, title: `${src?.title ?? 'Terminal'} copy` }]);
    setActive(id);
    setMenu(null);
  };

  const closeTab = useCallback((id: string) => {
    // We should only prevent closing if it's the last terminal tab left.
    if (tabs.length <= 1) return;
    terminalApi.closeTerminal(id);
    try {
      sessionStorage.removeItem(`archlab:term-buf:${id}`);
    } catch {
      /* ignore */
    }
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      const next = prev.filter((t) => t.id !== id);
      
      // Auto-renumber default titles to keep them sequential
      const renumbered = next.map((tab, index) => {
        const defaultTitleRegex = /^Terminal \d+$/;
        if (defaultTitleRegex.test(tab.title)) {
          return { ...tab, title: `Terminal ${index + 1}` };
        }
        return tab;
      });
      
      if (active === id) {
        const fallback = renumbered[Math.max(0, idx - 1)] ?? renumbered[0];
        setActive(fallback ? fallback.id : 'logs');
      }
      return renumbered;
    });
    setMenu(null);
  }, [tabs.length, active, terminalApi]);

  // Terminal tab keyboard shortcuts: Cmd+Opt+T / Ctrl+Alt+T (new tab), Cmd+Opt+W / Ctrl+Alt+W (close tab)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      const isAlt = e.altKey;

      if (isMod && isAlt) {
        if (e.code === 'KeyT') {
          e.preventDefault();
          addTab();
        } else if (e.code === 'KeyW') {
          e.preventDefault();
          if (active !== 'logs') {
            closeTab(active);
          }
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [addTab, closeTab, active]);

  const renameTab = (id: string, title: string) => {
    const trimmed = title.trim();
    if (trimmed) setTabs((t) => t.map((tab) => (tab.id === id ? { ...tab, title: trimmed } : tab)));
    setRenaming(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = height;
    document.body.classList.add('is-resizing');
    const onMove = (ev: MouseEvent) => {
      const maxHeight = Math.max(300, window.innerHeight * 0.65);
      const next = Math.max(160, Math.min(maxHeight, startHeight - (ev.clientY - startY)));
      onResize(next);
    };
    const onUp = () => {
      document.body.classList.remove('is-resizing');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <footer
      className="bottom-panel bottom-panel-solo"
      style={hidden ? { display: 'none' } : undefined}
    >
      <div className="bottom-panel-resizer" onMouseDown={handleMouseDown} />
      <button
        className="bottom-collapse-btn"
        onClick={onCollapse}
        title="Hide bottom panel (M)"
        style={toggleHidden ? { display: 'none' } : undefined}
      >
        ▼
      </button>

      <div className="bottom-right">
        <div className="tab-bar term-tab-bar">
          {tabs.map((t) => (
            <div
              key={t.id}
              className={`tab term-tab ${active === t.id ? 'tab-active' : ''}`}
              onClick={() => setActive(t.id)}
              onDoubleClick={() => setRenaming(t.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                setActive(t.id);
                setMenu({ tabId: t.id, x: e.clientX, y: e.clientY });
              }}
            >
              {renaming === t.id ? (
                <input
                  className="term-tab-rename"
                  autoFocus
                  defaultValue={t.title}
                  onBlur={(e) => renameTab(t.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') renameTab(t.id, (e.target as HTMLInputElement).value);
                    if (e.key === 'Escape') setRenaming(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="term-tab-label">{t.title}</span>
              )}
              {tabs.length > 1 && (
                <button
                  className="term-tab-close"
                  title="Close terminal (⌘⌥W)"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(t.id);
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button className="term-tab-add" title="New terminal (⌘⌥T)" onClick={addTab}>
            +
          </button>
          <button
            className={`tab term-logs-tab ${active === 'logs' ? 'tab-active' : ''}`}
            onClick={() => setActive('logs')}
          >
            Logs
          </button>
        </div>

        {/* Every terminal stays mounted (hidden when inactive) so its PTY session
            and scrollback survive tab switches. */}
        {tabs.map((t) => (
          <div
            key={t.id}
            style={{ display: active === t.id ? 'flex' : 'none', flex: 1, minHeight: 0 }}
          >
            <Terminal id={t.id} api={terminalApi} />
          </div>
        ))}

        {active === 'logs' && (
          <div className="log-stream">
            {logs.map((l, i) => (
              <div key={i} className={`log-line log-${l.level}`}>
                <span className="log-time">{l.at.slice(11, 19)}</span>
                <span className="log-msg">{l.message}</span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        )}
      </div>

      {menu && (
        <div
          className="term-context-menu"
          style={{ left: menu.x, top: menu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setRenaming(menu.tabId);
              setMenu(null);
            }}
          >
            Rename
          </button>
          <button onClick={() => duplicateTab(menu.tabId)}>Duplicate</button>
          <button
            className="term-context-danger"
            disabled={tabs.length <= 1}
            onClick={() => closeTab(menu.tabId)}
          >
            Close
          </button>
        </div>
      )}
    </footer>
  );
}
