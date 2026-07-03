/**
 * Dart error detection via the Dart SDK's own analyzer (`dart analyze`). Gives
 * real syntax AND semantic errors, the same ones the IDE shows. Runs the file in
 * place so imports resolve; for unsaved buffers it analyzes a temp copy in the
 * same folder so package context still resolves.
 */

import fs from 'node:fs';
import path from 'node:path';
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

  // Dart gives a start position, not a range — underline the word that starts there.
  const text = sourceLines[lineNo - 1] ?? '';
  const word = /^[\w$]+/.exec(text.slice(colStart));
  const colEnd = colStart + (word ? word[0].length : 1);

  // Dart messages often read "Problem. Try fixing X." — split into why / look-for.
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

/** Real Dart diagnostics for a file (on-disk) or an unsaved buffer (`content`). */
export async function checkDartSyntax(absPath: string, content?: string): Promise<SquiggleMarker[]> {
  if (!(await hasDart())) return [];

  // On-disk: analyze the real file so imports resolve.
  if (content === undefined) {
    if (!fs.existsSync(absPath)) return [];
    const source = fs.readFileSync(absPath, 'utf8').split('\n');
    return analyze(absPath, source);
  }

  // Unsaved buffer: analyze a temp copy in the same directory for correct context.
  const tmp = path.join(path.dirname(absPath), `.archlab_${Date.now()}.dart`);
  try {
    fs.writeFileSync(tmp, content, 'utf8');
    const markers = await analyze(tmp, content.split('\n'));
    return markers;
  } catch {
    return [];
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}
