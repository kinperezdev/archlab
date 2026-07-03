/**
 * Diagnostic → squiggle mapping shared by the fast parser (this file) and the
 * full type-checker (typeCheck.ts). detectSyntaxSquiggles is the instant,
 * project-free parse used for live typing; typeCheck adds semantic/compile errors.
 */

import ts from 'typescript';
import type { SquiggleMarker, SquiggleFix, SquiggleHelp } from '@archlab/shared';

export const SCRIPT_KINDS: Record<string, ts.ScriptKind> = {
  '.ts': ts.ScriptKind.TS,
  '.tsx': ts.ScriptKind.TSX,
  '.mts': ts.ScriptKind.TS,
  '.cts': ts.ScriptKind.TS,
  '.js': ts.ScriptKind.JS,
  '.jsx': ts.ScriptKind.JSX,
  '.mjs': ts.ScriptKind.JS,
  '.cjs': ts.ScriptKind.JS,
};

export function extname(relPath: string): string {
  const i = relPath.lastIndexOf('.');
  return i < 0 ? '' : relPath.slice(i).toLowerCase();
}

// Plain-English help (and an instant fix when possible) per error, keyed by the
// TS code or the message shape. Covers both parser and type-checker errors.
export function explain(
  message: string,
  code: number,
  col: number,
): { fix?: SquiggleFix; help?: SquiggleHelp } {
  const expected = message.match(/^'(.+?)' expected/);
  if (expected) {
    const token = expected[1];
    return {
      fix: { insert: token, col, label: `Insert '${token}'` },
      help: {
        why: `The parser required a '${token}' here to finish the previous statement or expression, but found something else.`,
        lookFor: `Check the token just before the underline. A '${token}' is usually missing right after it.`,
      },
    };
  }

  const help: Record<number, SquiggleHelp> = {
    1109: {
      why: 'An expression (a value, variable, or call) was expected here, but the code ended or hit an operator instead.',
      lookFor: 'Look for a dangling operator, empty parentheses, or an unfinished statement just before the marker.',
    },
    1002: { why: 'A string literal was left unterminated.', lookFor: 'Check for a missing closing quote on this line.' },
    1003: { why: 'An identifier (a name) was expected here.', lookFor: 'Check for a reserved word, a stray symbol, or a missing name.' },
    2304: {
      why: 'This name is not declared, imported, or in scope where it is used.',
      lookFor: 'Check the spelling, add the missing import, or confirm the variable exists in this scope.',
    },
    2307: {
      why: 'The module in this import path cannot be found.',
      lookFor: 'Verify the path is correct and the package is installed (node_modules).',
    },
    2322: { why: 'A value was assigned to something whose type does not accept it.', lookFor: 'Compare the expected type with the value on the right side of the assignment.' },
    2345: { why: 'An argument type does not match what the function parameter expects.', lookFor: 'Check the argument against the function signature it is passed to.' },
    2339: { why: 'This property does not exist on the value being accessed.', lookFor: 'Check the object type for a typo or a missing/renamed property.' },
    2551: { why: 'This property does not exist, but a similar one does.', lookFor: 'The message usually suggests the correct name — check for a typo.' },
    2532: { why: 'The value may be undefined at this point.', lookFor: 'Add a guard, a default, or optional chaining (?.) before using it.' },
    18048: { why: 'The value is possibly undefined here.', lookFor: 'Narrow the type with a check or use optional chaining (?.).' },
    2554: { why: 'The function is called with the wrong number of arguments.', lookFor: 'Compare the call to the function signature (too few or too many arguments).' },
    7006: { why: 'This parameter has an implicit any type because none was annotated.', lookFor: 'Add a type annotation to the parameter.' },
    6133: { why: 'This is declared but never used.', lookFor: 'Remove it, or use it, to clear the warning.' },
    2769: { why: 'No overload of this function matches the arguments given.', lookFor: 'Check each argument against the accepted overloads in the message.' },
  };

  return {
    help:
      help[code] ?? {
        why: message,
        lookFor: 'Compare this line with a working one nearby and check types, brackets, quotes, and commas.',
      },
  };
}

/** Map any TS diagnostic (with a source file) to a squiggle marker. */
export function markerFromDiagnostic(diag: ts.Diagnostic): SquiggleMarker | null {
  if (!diag.file || typeof diag.start !== 'number') return null;
  const start = diag.file.getLineAndCharacterOfPosition(diag.start);
  const end = diag.file.getLineAndCharacterOfPosition(diag.start + Math.max(1, diag.length ?? 1));
  const lineText = diag.file.text.split('\n')[start.line] ?? '';
  const colEnd = end.line === start.line ? end.character : lineText.length;
  const message = ts.flattenDiagnosticMessageText(diag.messageText, '\n');
  const severity: 'error' | 'warning' =
    diag.category === ts.DiagnosticCategory.Error ? 'error' : 'warning';
  const { fix, help } = explain(message, diag.code, start.character);
  return {
    line: start.line + 1,
    colStart: start.character,
    colEnd: Math.max(start.character + 1, colEnd),
    severity,
    message: `${message} (TS${diag.code})`,
    source: 'syntax',
    fix,
    help,
  };
}

/** Instant, project-free syntax squiggles (used for live typing). */
export function detectSyntaxSquiggles(relPath: string, content: string): SquiggleMarker[] {
  const scriptKind = SCRIPT_KINDS[extname(relPath)];
  if (scriptKind === undefined) return [];
  try {
    const source = ts.createSourceFile(relPath, content, ts.ScriptTarget.Latest, false, scriptKind);
    const parseErrors =
      (source as unknown as { parseDiagnostics?: ts.DiagnosticWithLocation[] }).parseDiagnostics ?? [];
    return parseErrors.map(markerFromDiagnostic).filter((m): m is SquiggleMarker => m !== null);
  } catch {
    return [];
  }
}
