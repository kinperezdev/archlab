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

/** Per-tab terminal session: a live PTY plus its tracked cwd. The PTY outlives
 *  any single WebSocket so a reconnect re-attaches to the same running process. */
export interface ShellSession {
  cwd: string;
  /** Write raw keystrokes/data to the PTY's stdin. */
  write(data: string): void;
  /** Resize the PTY to match the front-end terminal viewport. */
  resize(cols: number, rows: number): void;
  /** Kill the PTY (called when the tab is explicitly closed). */
  kill(): void;
  /** Point output at a (new) socket and replay anything buffered while detached. */
  attach(handlers: SessionHandlers): void;
  /** Stop forwarding output (socket closed) but keep the PTY running. */
  detach(): void;
}

/** Spawn a real shell in a PTY and start streaming its output. */
export function createSession(handlers: SessionHandlers, initialCwd?: string): ShellSession {
  ensureSpawnHelperExecutable();

  const home = os.homedir();
  const startCwd = (initialCwd && fs.existsSync(initialCwd)) ? initialCwd : home;
  // Make the shell report its cwd via OSC 7 on every prompt. Without this, a
  // shell launched under node-pty (no TERM_PROGRAM=Apple_Terminal, and most
  // user rc files don't emit it themselves) never tells us when the user `cd`s,
  // so auto-analysis never fires and the canvas stays "No project loaded".
  const cwdReporting = buildCwdReportingEnv(home);
  // The backend loads the user's AI provider keys into its own process.env
  // (from brain/api_keys.json). The PTY must NOT inherit them: anything run in
  // the in-app terminal could otherwise read them with a one-line `echo`.
  const shellEnv: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value === undefined) continue;
    if (key === 'ANTHROPIC_API_KEY' || key === 'OPENAI_API_KEY' || key === 'GEMINI_API_KEY') continue;
    shellEnv[key] = value;
  }
  const term = pty.spawn(SHELL, os.platform() === 'win32' ? [] : ['-l'], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd: startCwd,
    env: { ...shellEnv, TERM: 'xterm-256color', ...cwdReporting.env },
  });

  // Current output sink. Starts as the initial handlers; swapped on re-attach.
  let current: SessionHandlers | null = handlers;
  // Rolling output replayed on every browser attach. The frontend has its own
  // sessionStorage backup, but that can be stale or absent after a refresh while
  // this backend PTY is still alive. Replaying a bounded server-side buffer keeps
  // a waiting shell prompt visible instead of leaving the new xterm blank.
  let replayBuffer = '';
  const REPLAY_CAP = 200_000;
  // Output produced while no socket is attached. This is kept separately so a
  // reconnect can receive only the detached delta when a full replay is not
  // needed, but it is also appended to the rolling replay buffer below.
  let detachedBuffer = '';
  const DETACHED_CAP = 200_000;

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
      cwdReporting.cleanup();
    },
    attach: (next) => {
      current = next;
      if (replayBuffer) next.onData(replayBuffer);
      detachedBuffer = '';
    },
    detach: () => {
      current = null;
    },
  };

  let hasEmittedInitialCwd = false;

  term.onData((data) => {
    replayBuffer += data;
    if (replayBuffer.length > REPLAY_CAP) replayBuffer = replayBuffer.slice(-REPLAY_CAP);
    const cwd = parseOsc7Cwd(data);
    if (cwd) {
      const isChanged = cwd !== session.cwd;
      session.cwd = cwd;
      if (isChanged || !hasEmittedInitialCwd) {
        hasEmittedInitialCwd = true;
        current?.onCwdChange(cwd);
      }
    }
    if (current) {
      current.onData(data);
    } else {
      detachedBuffer += data;
      if (detachedBuffer.length > DETACHED_CAP) detachedBuffer = detachedBuffer.slice(-DETACHED_CAP);
    }
  });

  return session;
}

/** Result of preparing the environment that makes a shell emit OSC 7. */
interface CwdReporting {
  /** Extra env vars to merge into the PTY's environment. */
  env: NodeJS.ProcessEnv;
  /** Remove any temp files created for the shell (called when the PTY dies). */
  cleanup: () => void;
}

/**
 * Build the environment that makes the launched shell emit an OSC 7 cwd report
 * on every prompt, so `parseOsc7Cwd` can track `cd`s.
 *
 * - zsh: we point `ZDOTDIR` at a throwaway directory whose `.zshrc` first sources
 *   the user's real config, then registers a `precmd` hook that prints OSC 7.
 *   Login startup files (`.zshenv`/`.zprofile`/`.zlogin`) are forwarded too so
 *   the user's environment is unchanged.
 * - bash: we prepend an OSC 7 emitter to `PROMPT_COMMAND`.
 * - other shells (incl. Windows): left untouched.
 */
function buildCwdReportingEnv(home: string): CwdReporting {
  const noop: CwdReporting = { env: {}, cleanup: () => {} };
  if (os.platform() === 'win32') return noop;

  const shellName = path.basename(SHELL);

  if (shellName.includes('zsh')) {
    // Where the user's real zsh config lives (honour an existing ZDOTDIR).
    const realZdotdir = process.env.ZDOTDIR || home;
    let dir: string;
    try {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'archlab-zdotdir-'));
    } catch {
      return noop;
    }

    // Forward the login startup files to the user's real ones so nothing in the
    // user's environment is lost by hijacking ZDOTDIR.
    const forward = (name: string) =>
      `[ -f "${realZdotdir}/${name}" ] && source "${realZdotdir}/${name}"\n`;

    const osc7Hook =
      'autoload -Uz add-zsh-hook 2>/dev/null\n' +
      "__archlab_osc7() { printf '\\033]7;file://%s%s\\007' \"${HOST}\" \"${PWD}\"; }\n" +
      'add-zsh-hook precmd __archlab_osc7 2>/dev/null || precmd_functions+=(__archlab_osc7)\n' +
      '__archlab_osc7\n';

    try {
      fs.writeFileSync(path.join(dir, '.zshenv'), forward('.zshenv'));
      fs.writeFileSync(path.join(dir, '.zprofile'), forward('.zprofile'));
      fs.writeFileSync(path.join(dir, '.zlogin'), forward('.zlogin'));
      fs.writeFileSync(path.join(dir, '.zshrc'), forward('.zshrc') + osc7Hook);
    } catch {
      try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
      return noop;
    }

    return {
      env: { ZDOTDIR: dir },
      cleanup: () => {
        try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
      },
    };
  }

  if (shellName.includes('bash')) {
    const emitter = `printf '\\033]7;file://%s%s\\007' "$HOSTNAME" "$PWD"`;
    const existing = process.env.PROMPT_COMMAND;
    return {
      env: { PROMPT_COMMAND: existing ? `${emitter}; ${existing}` : emitter },
      cleanup: () => {},
    };
  }

  return noop;
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
