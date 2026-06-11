/**
 * In-app terminal engine.
 *
 * A lightweight, stateful command runner (not a full PTY) tuned for ArchLab's
 * core flow: you `cd` into a folder and ArchLab immediately reads it. It tracks
 * the working directory per connection, runs ordinary commands with that cwd,
 * and special-cases `cd`/`pwd` so the directory state stays accurate.
 *
 * Security note: this executes shell commands on the local machine, exactly
 * like the terminal app it replaces. It is bound to localhost and intended for
 * the single local user who owns the machine.
 */

import { exec } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** Per-connection terminal session state. */
export interface ShellSession {
  cwd: string;
}

/** Create a session starting in the user's home directory. */
export function createSession(): ShellSession {
  return { cwd: os.homedir() };
}

export interface CommandResult {
  /** Combined output to print in the terminal. */
  output: string;
  stream: 'stdout' | 'stderr' | 'system';
  /** True when the command changed the working directory (triggers analysis). */
  cwdChanged: boolean;
}

/** Run one command line against the session, mutating cwd for `cd`. */
export async function runCommand(
  session: ShellSession,
  line: string,
): Promise<CommandResult> {
  const trimmed = line.trim();
  if (trimmed === '') return { output: '', stream: 'system', cwdChanged: false };

  // Handle `cd` ourselves so we can keep accurate directory state.
  if (trimmed === 'cd' || trimmed.startsWith('cd ')) {
    return handleCd(session, trimmed.slice(2).trim());
  }
  if (trimmed === 'pwd') {
    return { output: `${session.cwd}\n`, stream: 'stdout', cwdChanged: false };
  }

  // Everything else runs as a normal shell command in the current cwd.
  return execInCwd(session, trimmed);
}

/** Resolve and apply a `cd` target. */
function handleCd(session: ShellSession, rawTarget: string): CommandResult {
  // Empty `cd` or `cd ~` go home; expand a leading ~ otherwise.
  let target = rawTarget === '' || rawTarget === '~' ? os.homedir() : rawTarget;
  if (target.startsWith('~/')) target = path.join(os.homedir(), target.slice(2));

  const next = path.resolve(session.cwd, target);

  if (!fs.existsSync(next) || !fs.statSync(next).isDirectory()) {
    return { output: `cd: no such directory: ${rawTarget}\n`, stream: 'stderr', cwdChanged: false };
  }

  session.cwd = next;
  return {
    output: `→ now in ${next}\n`,
    stream: 'system',
    cwdChanged: true,
  };
}

/** Execute a non-builtin command, capturing stdout + stderr. */
function execInCwd(session: ShellSession, command: string): Promise<CommandResult> {
  return new Promise((resolve) => {
    exec(
      command,
      { cwd: session.cwd, timeout: 15_000, maxBuffer: 2_000_000, shell: '/bin/zsh' },
      (err, stdout, stderr) => {
        if (err && !stdout && stderr) {
          resolve({ output: stderr, stream: 'stderr', cwdChanged: false });
          return;
        }
        const output = `${stdout}${stderr}`;
        resolve({ output, stream: stderr ? 'stderr' : 'stdout', cwdChanged: false });
      },
    );
  });
}
