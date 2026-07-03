/**
 * Swift syntax-error detection via native tree-sitter bindings. Native (not WASM)
 * so it can't crash the runtime the way the WASM grammars did. Reports ERROR and
 * MISSING nodes. Syntax-level only — deep Swift checking would need sourcekit-lsp.
 */

import { createRequire } from 'node:module';
import type { SquiggleMarker } from '@archlab/shared';

const require = createRequire(import.meta.url);

interface TSNode {
  type: string;
  text: string;
  isError: boolean;
  isMissing: boolean;
  hasError: boolean;
  children: TSNode[];
  startPosition: { row: number; column: number };
  endPosition: { row: number; column: number };
}

interface TSParser {
  parse(input: string): { rootNode: TSNode };
}

// Lazily build the parser once. A native load failure throws (catchable) rather
// than crashing the process, so a bad install degrades to "no squiggles".
let parser: TSParser | null = null;
let loadFailed = false;

function getParser(): TSParser | null {
  if (parser) return parser;
  if (loadFailed) return null;
  try {
    const Parser = require('tree-sitter');
    const Swift = require('tree-sitter-swift');
    const p = new Parser();
    p.setLanguage(Swift);
    parser = p as TSParser;
    return parser;
  } catch (err) {
    loadFailed = true;
    console.error('[swift] native parser unavailable', err);
    return null;
  }
}

function collectErrors(node: TSNode, out: TSNode[]): void {
  if (node.isError || node.isMissing) {
    out.push(node);
    return;
  }
  if (!node.hasError) return;
  for (const child of node.children) collectErrors(child, out);
}

/** Syntax-error squiggles for a Swift file, or [] if the parser is unavailable. */
export function checkSwiftSyntax(content: string): SquiggleMarker[] {
  const p = getParser();
  if (!p) return [];
  try {
    const tree = p.parse(content);
    const errors: TSNode[] = [];
    collectErrors(tree.rootNode, errors);
    const lines = content.split('\n');

    return errors.map((node) => {
      const sp = node.startPosition;
      const ep = node.endPosition;
      const lineText = lines[sp.row] ?? '';
      const colEnd = ep.row === sp.row ? ep.column : lineText.length;
      const missing = node.isMissing;
      return {
        line: sp.row + 1,
        colStart: sp.column,
        colEnd: Math.max(sp.column + 1, colEnd),
        severity: 'error' as const,
        message: missing
          ? `Missing '${node.type}'`
          : `Unexpected syntax near '${(node.text || '').slice(0, 24)}'`,
        source: 'syntax' as const,
        help: {
          why: missing
            ? 'The parser expected more code here to complete the statement or block.'
            : 'The parser could not make sense of this Swift code.',
          lookFor: 'Check braces, parentheses, and that the line just before this is complete.',
        },
      };
    });
  } catch {
    return [];
  }
}
