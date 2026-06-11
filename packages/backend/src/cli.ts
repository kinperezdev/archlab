#!/usr/bin/env node
/**
 * `archlab` — the terminal connection.
 *
 * Run it from inside any project folder and ArchLab maps THAT folder onto the
 * live canvas in your browser. It simply POSTs the current working directory
 * (or a path argument) to the local backend, which broadcasts the analysis to
 * every open browser tab over WebSocket.
 *
 * Usage:
 *   archlab                 analyze the current directory
 *   archlab ./some/path     analyze a specific path
 *   archlab --check         analyze + immediately run the 7-step pipeline
 */

import path from 'node:path';
import { PORTS } from '@archlab/shared';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const runChecks = args.includes('--check') || args.includes('-c');
  const pathArg = args.find((a) => !a.startsWith('-'));
  const rootPath = path.resolve(process.cwd(), pathArg ?? '.');

  const url = `http://127.0.0.1:${PORTS.backend}/analyze`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ rootPath, runChecks }),
    });
  } catch {
    fail(
      `Could not reach the ArchLab backend on port ${PORTS.backend}.\n` +
        `Start it with "npm run dev" from the ArchLab repo, then try again.`,
    );
    return;
  }

  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  if (!res.ok || !data.ok) {
    fail(data.error ?? `Backend responded with ${res.status}.`);
    return;
  }

  // eslint-disable-next-line no-console
  console.log(
    `✓ ArchLab is analyzing:\n  ${rootPath}\n` +
      (runChecks ? '  (running the full check pipeline)\n' : '') +
      `\nWatch it live at http://127.0.0.1:${PORTS.frontend}`,
  );
}

function fail(message: string): void {
  // eslint-disable-next-line no-console
  console.error(`✗ ${message}`);
  process.exitCode = 1;
}

void main();
