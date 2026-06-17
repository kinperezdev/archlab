/**
 * In-app terminal — a real terminal emulator (xterm.js) wired to a backend PTY.
 *
 * Everything you'd expect from Terminal.app or iTerm works here: run any command
 * (npm scripts, git, `claude`, `cursor`, any CLI), interactive prompts that ask
 * for input mid-run, full ANSI colour, plus shell-native history (arrow keys)
 * and tab completion — because the shell itself is what's running. `cd` into any
 * folder and ArchLab maps it onto the canvas.
 *
 * File handoff: drag-and-drop a file (or folder/zip) onto the terminal, or use
 * the paperclip picker. The file is copied to a temp working dir and its
 * absolute path is typed straight into the shell, ready to pass to a CLI (e.g.
 * drop a screenshot and hand it to `claude`). A staging bar shows what's ready,
 * with an inline thumbnail for images.
 */

import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import {
  collectDrop,
  formatSize,
  shellQuote,
  uploadFile,
  uploadFolder,
  type StagedFile,
} from '../lib/terminalUpload.js';

export interface TerminalApi {
  /** Subscribe to a session's raw PTY output. Returns an unsubscribe function. */
  onData: (id: string, cb: (data: string) => void) => () => void;
  /** Spawn the backend PTY session for an id. */
  createTerminal: (id: string) => void;
  /** Kill the backend PTY session for an id. */
  closeTerminal: (id: string) => void;
  /** Mark a session as the focused tab (only its `cd` drives the canvas). */
  focusTerminal: (id: string) => void;
  /** Send raw keystrokes/data to a session's stdin. */
  sendInput: (id: string, data: string) => void;
  /** Tell the backend PTY the new viewport size. */
  resize: (id: string, cols: number, rows: number) => void;
}

interface TerminalProps {
  /** Stable session id for this terminal tab. */
  id: string;
  api: TerminalApi;
}

// Pure black background; ANSI palette mapped to the ArchLab design tokens so
// command output color-codes consistently (error red, success green, etc.).
const TERM_THEME = {
  background: '#080808',
  foreground: '#f8f8ff',
  cursor: '#5ad6b0',
  selectionBackground: 'rgba(90, 140, 255, 0.3)',
  black: '#1a1a20',
  red: '#ef4444',
  green: '#10b981',
  yellow: '#f59e0b',
  blue: '#3b82f6',
  magenta: '#a855f7',
  cyan: '#2dd4bf',
  white: '#d7dce5',
  brightBlack: '#4a4a5a',
  brightRed: '#f87171',
  brightGreen: '#34d399',
  brightYellow: '#fbbf24',
  brightBlue: '#60a5fa',
  brightMagenta: '#c084fc',
  brightCyan: '#5eead4',
  brightWhite: '#ffffff',
};

/** Short type label for a non-image card, e.g. "PDF", "JS", "FOLDER". */
function typeLabel(file: StagedFile): string {
  if (file.kind === 'folder') return 'FOLDER';
  const dot = file.name.lastIndexOf('.');
  const ext = dot >= 0 ? file.name.slice(dot + 1).toUpperCase() : '';
  return ext || 'FILE';
}

export function Terminal({ id, api }: TerminalProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const writeRef = useRef<((data: string) => void) | null>(null);
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // Spawn the backend PTY for this tab as soon as it mounts.
    api.createTerminal(id);

    const term = new XTerm({
      fontFamily: 'Menlo, Monaco, "SF Mono", "Courier New", monospace',
      fontSize: 12,
      lineHeight: 1.2,
      cursorBlink: true,
      convertEol: false,
      scrollback: 5000,
      theme: TERM_THEME,
      allowProposedApi: true,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.loadAddon(new WebLinksAddon());
    term.open(host);
    writeRef.current = (data: string) => api.sendInput(id, data);

    // Allow custom shortcuts to bubble past xterm.js
    term.attachCustomKeyEventHandler((e) => {
      const isMod = e.ctrlKey || e.metaKey;
      const isAlt = e.altKey;
      if (isMod && isAlt && (e.code === 'KeyT' || e.code === 'KeyW')) {
        return false;
      }
      return true;
    });

    const safeFit = () => {
      try {
        fit.fit();
        api.resize(id, term.cols, term.rows);
      } catch {
        /* host not measurable yet */
      }
    };
    safeFit();

    // Restore prior output after a refresh, then keep the rolling buffer in
    // sessionStorage so the last session's output survives an accidental reload.
    const bufKey = `archlab:term-buf:${id}`;
    const BUF_CAP = 200_000;
    let buf = sessionStorage.getItem(bufKey) ?? '';
    if (buf) term.write(buf);
    const persist = () => {
      try {
        sessionStorage.setItem(bufKey, buf.length > BUF_CAP ? buf.slice(-BUF_CAP) : buf);
      } catch {
        /* sessionStorage full or unavailable */
      }
    };
    const flushTimer = setInterval(persist, 1000);

    const unsubscribe = api.onData(id, (data) => {
      term.write(data);
      buf += data;
      if (buf.length > BUF_CAP) buf = buf.slice(-BUF_CAP);
    });
    const inputDisposable = term.onData((data) => api.sendInput(id, data));
    const resizeDisposable = term.onResize(({ cols, rows }) => api.resize(id, cols, rows));

    const ro = new ResizeObserver(() => safeFit());
    ro.observe(host);

    term.focus();

    return () => {
      clearInterval(flushTimer);
      persist();
      unsubscribe();
      inputDisposable.dispose();
      resizeDisposable.dispose();
      ro.disconnect();
      term.dispose();
      writeRef.current = null;
    };
  }, [api, id]);

  // Type a staged item's path into the shell at the cursor.
  const insertPath = (file: StagedFile) => {
    writeRef.current?.(`${shellQuote(file.path)} `);
  };

  const stageAndInsert = (file: StagedFile) => {
    setStaged((prev) => [...prev, file]);
    insertPath(file);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!e.dataTransfer) return;
    setBusy(true);
    setError(null);
    try {
      const { files, folder } = await collectDrop(e.dataTransfer);
      if (folder && folder.entries.length > 0) {
        stageAndInsert(await uploadFolder(folder.name, folder.entries));
      }
      for (const file of files) {
        stageAndInsert(await uploadFile(file));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  const removeStaged = (index: number) => {
    setStaged((prev) => {
      const item = prev[index];
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  return (
    <div
      className={`terminal-pane ${dragOver ? 'drag-over' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        if (!dragOver) setDragOver(true);
      }}
      onDragLeave={(e) => {
        // Only clear when leaving the pane, not when moving over children.
        if (e.currentTarget === e.target) setDragOver(false);
      }}
      onDrop={onDrop}
    >
      <div className="terminal xterm-host" ref={hostRef} />

      {dragOver && <div className="terminal-drop-hint">Drop to stage its path</div>}

      {/* Preview cards float inside the terminal output area (bottom-left),
          right where the dropped path lands at the prompt. */}
      {(staged.length > 0 || busy || error) && (
        <div className="terminal-preview-layer">
          {error && <div className="preview-error">{error}</div>}
          {busy && <div className="preview-busy">Saving file…</div>}
          {staged.map((f, i) => (
            <div key={`${f.path}-${i}`} className={`preview-card ${f.isImage ? 'is-image' : ''}`} title={f.path}>
              {f.isImage && f.previewUrl ? (
                <img className="preview-thumb" src={f.previewUrl} alt={f.name} />
              ) : (
                <span className="preview-icon">{f.kind === 'folder' ? '📁' : '📄'}</span>
              )}
              <span className="preview-meta">
                <span className="preview-name">{f.name}</span>
                <span className="preview-sub">
                  {typeLabel(f)} · {f.kind === 'folder' ? 'folder' : formatSize(f.size)}
                </span>
              </span>
              <span className="preview-actions">
                <button className="preview-btn" title="Insert path again" onClick={() => insertPath(f)}>
                  ↵
                </button>
                <button className="preview-btn" title="Dismiss" onClick={() => removeStaged(i)}>
                  ✕
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
