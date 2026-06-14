/**
 * In-app terminal engine — a real PTY.
 *
 * Each browser tab gets its own pseudo-terminal running the user's login shell
 * via node-pty. This makes the in-app terminal behave exactly like Terminal.app
 * or iTerm: interactive prompts work, stdin is real, ANSI colours render, and
 * the shell itself provides history (arrow keys) and tab completion. There is no
 * "no stdin data received" failure mode because input is streamed straight to
 * the PTY's stdin.
 *
 * ArchLab still wants to know the current working directory so it can map a
 * folder onto the canvas the moment you `cd` into it. Modern shells emit an
 * OSC 7 escape sequence (`ESC ] 7 ; file://host/path ST`) on every prompt; we
 * parse that out of the PTY's output stream to track cwd changes without
 * interfering with the shell.
 *
 * Security note: this executes a real shell on the local machine, exactly like
 * the terminal app it replaces. It is bound to localhost and intended for the
 * single local user who owns the machine.
 */

import * as pty from 'node-pty';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** The shell to launch. Honour the user's $SHELL, fall back to zsh then bash. */
const SHELL = process.env.SHELL || (os.platform() === 'win32' ? 'powershell.exe' : '/bin/zsh');

/** Callbacks the server wires into a session. */
export interface SessionHandlers {
  /** Raw PTY output (ANSI included) to forward to the browser terminal. */
  onData: (data: string) => void;
  /** Fired when the shell changes directory (drives auto-analysis). */
  onCwdChange: (cwd: string) => void;
}

/** Per-connection terminal session: a live PTY plus its tracked cwd. */
export interface ShellSession {
  cwd: string;
  /** Write raw keystrokes/data to the PTY's stdin. */
  write(data: string): void;
  /** Resize the PTY to match the front-end terminal viewport. */
  resize(cols: number, rows: number): void;
  /** Kill the PTY (called when the socket closes). */
  kill(): void;
}

/** Spawn a real shell in a PTY and start streaming its output. */
export function createSession(handlers: SessionHandlers, initialCwd?: string): ShellSession {
  ensureSpawnHelperExecutable();

  const home = os.homedir();
  const startCwd = (initialCwd && fs.existsSync(initialCwd)) ? initialCwd : home;
  const term = pty.spawn(SHELL, os.platform() === 'win32' ? [] : ['-l'], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd: startCwd,
    env: { ...process.env, TERM: 'xterm-256color' },
  });

  const session: ShellSession = {
    cwd: startCwd,
    write: (data) => {
      try {
        term.write(data);
      } catch {
        /* PTY already exited; ignore. */
      }
    },
    resize: (cols, rows) => {
      try {
        term.resize(Math.max(1, cols), Math.max(1, rows));
      } catch {
        /* Ignore resize on a dead PTY. */
      }
    },
    kill: () => {
      try {
        term.kill();
      } catch {
        /* Already gone. */
      }
    },
  };

  term.onData((data) => {
    const cwd = parseOsc7Cwd(data);
    if (cwd && cwd !== session.cwd) {
      session.cwd = cwd;
      handlers.onCwdChange(cwd);
    }
    handlers.onData(data);
  });

  return session;
}

/**
 * Extract the working directory from any OSC 7 sequences in a chunk of PTY
 * output. Returns the last cwd seen in the chunk, or null if none. The sequence
 * looks like: ESC ] 7 ; file://HOST/the/path  (BEL | ESC \).
 */
function parseOsc7Cwd(data: string): string | null {
  // eslint-disable-next-line no-control-regex
  const re = /\x1b\]7;file:\/\/[^/]*([^\x07\x1b]*)(?:\x07|\x1b\\)/g;
  let match: RegExpExecArray | null;
  let last: string | null = null;
  while ((match = re.exec(data)) !== null) {
    try {
      last = decodeURIComponent(match[1]);
    } catch {
      last = match[1];
    }
  }
  return last;
}

/**
 * node-pty ships a prebuilt `spawn-helper` binary, but npm install occasionally
 * lands it without the execute bit, which makes `posix_spawnp` fail at runtime.
 * Restore the execute bit on the prebuild for the current platform/arch so the
 * terminal always works, even right after a fresh install.
 */
let spawnHelperChecked = false;
function ensureSpawnHelperExecutable(): void {
  if (spawnHelperChecked || os.platform() === 'win32') return;
  spawnHelperChecked = true;
  try {
    const here = path.dirname(fileURLToPath(import.meta.url));
    // Resolve node-pty's package root from this file (src or dist), then the
    // platform prebuild directory.
    const ptyRoot = findNodePtyRoot(here);
    if (!ptyRoot) return;
    const helper = path.join(
      ptyRoot,
      'prebuilds',
      `${os.platform()}-${process.arch}`,
      'spawn-helper',
    );
    if (fs.existsSync(helper)) {
      fs.chmodSync(helper, 0o755);
    }
  } catch {
    /* Best effort; if this fails the spawn will surface a clear error. */
  }
}

/** Walk up from a starting dir to find node_modules/node-pty. */
function findNodePtyRoot(start: string): string | null {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    const candidate = path.join(dir, 'node_modules', 'node-pty');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}
