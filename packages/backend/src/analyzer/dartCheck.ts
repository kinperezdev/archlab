/** Dart error detection via `dart analyze` — real syntax + semantic diagnostics. */

import fs from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { SquiggleMarker } from '@archlab/shared';

const run = promisify(execFile);
const TIMEOUT_MS = 8000;

// `dart analyze` line: "  error - path:line:col - message - error_code"
const LINE_RE = /^\s*(error|warning|info)\s+-\s+(.*?):(\d+):(\d+)\s+-\s+(.*?)\s+-\s+(\S+)\s*$/;

let dartAvailable: boolean | null = null;

async function hasDart(): Promise<boolean> {
  if (dartAvailable !== null) return dartAvailable;
  try {
    await run('dart', ['--version'], { timeout: TIMEOUT_MS });
    dartAvailable = true;
  } catch {
    dartAvailable = false;
  }
  return dartAvailable;
}

function markerFromLine(line: string, sourceLines: string[]): SquiggleMarker | null {
  const m = LINE_RE.exec(line);
  if (!m) return null;
  const [, severity, , lineStr, colStr, rawMessage, code] = m;
  const lineNo = parseInt(lineStr, 10);
  const colStart = Math.max(0, parseInt(colStr, 10) - 1);

  // Underline the word at the reported start position (Dart gives no range).
  const text = sourceLines[lineNo - 1] ?? '';
  const word = /^[\w$]+/.exec(text.slice(colStart));
  const colEnd = colStart + (word ? word[0].length : 1);

  // Split "Problem. Try fixing X." into why / look-for.
  const dot = rawMessage.indexOf('. Try ');
  const why = dot >= 0 ? rawMessage.slice(0, dot + 1) : rawMessage;
  const lookFor = dot >= 0 ? rawMessage.slice(dot + 2) : 'Check the Dart analyzer message and the referenced symbols.';

  return {
    line: lineNo,
    colStart,
    colEnd: Math.max(colStart + 1, colEnd),
    severity: severity === 'error' ? 'error' : 'warning',
    message: `${rawMessage} (${code})`,
    source: 'syntax',
    help: { why, lookFor },
  };
}

async function analyze(target: string, sourceLines: string[]): Promise<SquiggleMarker[]> {
  let stdout = '';
  try {
    const res = await run('dart', ['analyze', target], { timeout: TIMEOUT_MS });
    stdout = res.stdout;
  } catch (err) {
    // `dart analyze` exits non-zero when it finds issues; the report is on stdout.
    stdout = (err as { stdout?: string }).stdout ?? '';
    if (!stdout) return [];
  }
  return stdout
    .split('\n')
    .map((l) => markerFromLine(l, sourceLines))
    .filter((m): m is SquiggleMarker => m !== null);
}

/**
 * Real Dart diagnostics for a file. Always analyzes the on-disk file so imports
 * resolve and we never write into the user's project (which would trip Flutter
 * hot-reload / the analysis server). Squiggles refresh on save, not per keystroke.
 */
export async function checkDartSyntax(absPath: string): Promise<SquiggleMarker[]> {
  if (!(await hasDart())) return [];
  if (!fs.existsSync(absPath)) return [];
  const source = fs.readFileSync(absPath, 'utf8').split('\n');
  return analyze(absPath, source);
}
