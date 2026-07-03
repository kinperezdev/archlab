/**
 * Real syntax-error detection for the Code Intelligence Panel, using the
 * TypeScript parser (no type-checking) so the red squiggles are genuine.
 */

import ts from 'typescript';
import type { SquiggleMarker } from '@archlab/shared';

const SCRIPT_KINDS: Record<string, ts.ScriptKind> = {
  '.ts': ts.ScriptKind.TS,
  '.tsx': ts.ScriptKind.TSX,
  '.mts': ts.ScriptKind.TS,
  '.cts': ts.ScriptKind.TS,
  '.js': ts.ScriptKind.JS,
  '.jsx': ts.ScriptKind.JSX,
  '.mjs': ts.ScriptKind.JS,
  '.cjs': ts.ScriptKind.JS,
};

function extname(relPath: string): string {
  const i = relPath.lastIndexOf('.');
  return i < 0 ? '' : relPath.slice(i).toLowerCase();
}

/** Real syntax-error squiggles for a file, or [] for languages we can't parse. */
export function detectSyntaxSquiggles(relPath: string, content: string): SquiggleMarker[] {
  const scriptKind = SCRIPT_KINDS[extname(relPath)];
  if (scriptKind === undefined) return [];

  try {
    const source = ts.createSourceFile(relPath, content, ts.ScriptTarget.Latest, false, scriptKind);
    const parseErrors =
      (source as unknown as { parseDiagnostics?: ts.DiagnosticWithLocation[] }).parseDiagnostics ?? [];

    const markers: SquiggleMarker[] = [];
    for (const d of parseErrors) {
      if (typeof d.start !== 'number') continue;
      const start = source.getLineAndCharacterOfPosition(d.start);
      const end = source.getLineAndCharacterOfPosition(d.start + Math.max(1, d.length ?? 1));
      const lineText = content.split('\n')[start.line] ?? '';
      const colEnd = end.line === start.line ? end.character : lineText.length;

      markers.push({
        line: start.line + 1,
        colStart: start.character,
        colEnd: Math.max(start.character + 1, colEnd),
        severity: 'error',
        message: `${ts.flattenDiagnosticMessageText(d.messageText, '\n')} (TS${d.code})`,
        source: 'syntax',
      });
    }
    return markers;
  } catch {
    return [];
  }
}
