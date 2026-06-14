/**
 * Bottom panel: a tabbed surface with multiple independent terminal sessions
 * plus the backend log stream.
 *
 * Each terminal tab is its own PTY (own cwd, history, and running process), so
 * you can have `npm run dev` in one, git in another, and an AI agent CLI in a
 * third — all live at once. The first terminal can't be closed. Right-click a
 * tab to rename, duplicate, or close it.
 */

import { useEffect, useRef, useState } from 'react';
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
}: BottomPanelProps) {
  const [tabs, setTabs] = useState<TermTab[]>([{ id: 'term-1', title: 'Terminal 1' }]);
  const [active, setActive] = useState<string>('term-1'); // a tab id, or 'logs'
  const [menu, setMenu] = useState<ContextMenu | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (active === 'logs') logEndRef.current?.scrollIntoView({ block: 'end' });
  }, [logs, active]);

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

  const addTab = () => {
    const id = newTermId();
    const title = `Terminal ${tabs.length + 1}`;
    setTabs((t) => [...t, { id, title }]);
    setActive(id);
  };

  const duplicateTab = (sourceId: string) => {
    const src = tabs.find((t) => t.id === sourceId);
    const id = newTermId();
    setTabs((t) => [...t, { id, title: `${src?.title ?? 'Terminal'} copy` }]);
    setActive(id);
    setMenu(null);
  };

  const closeTab = (id: string) => {
    // The first terminal can never be closed.
    if (id === 'term-1') return;
    terminalApi.closeTerminal(id);
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      const next = prev.filter((t) => t.id !== id);
      if (active === id) {
        const fallback = next[Math.max(0, idx - 1)] ?? next[0];
        setActive(fallback ? fallback.id : 'logs');
      }
      return next;
    });
    setMenu(null);
  };

  const renameTab = (id: string, title: string) => {
    const trimmed = title.trim();
    if (trimmed) setTabs((t) => t.map((tab) => (tab.id === id ? { ...tab, title: trimmed } : tab)));
    setRenaming(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = height;
    const onMove = (ev: MouseEvent) => {
      const next = Math.max(100, Math.min(600, startHeight - (ev.clientY - startY)));
      onResize(next);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <footer className="bottom-panel bottom-panel-solo">
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
              {t.id !== 'term-1' && (
                <button
                  className="term-tab-close"
                  title="Close terminal"
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
          <button className="term-tab-add" title="New terminal" onClick={addTab}>
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
            disabled={menu.tabId === 'term-1'}
            onClick={() => closeTab(menu.tabId)}
          >
            Close
          </button>
        </div>
      )}
    </footer>
  );
}
