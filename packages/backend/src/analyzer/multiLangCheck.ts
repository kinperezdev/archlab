/**
 * Universal syntax-error detection via tree-sitter. Covers the languages the TS
 * compiler can't (Dart, Swift, Kotlin, Python, Go, Rust, Java, C/C++, Ruby, PHP,
 * and more) by parsing with the matching grammar and reporting ERROR/MISSING
 * nodes. Syntax-level only — deep type-checking still needs each language's own
 * toolchain, which we don't bundle.
 */

import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { Parser, Language, type Node } from 'web-tree-sitter';
import type { SquiggleMarker } from '@archlab/shared';

const require = createRequire(import.meta.url);
const GRAMMAR_DIR = path.join(path.dirname(require.resolve('tree-sitter-wasms/package.json')), 'out');
const CORE_WASM = require.resolve('web-tree-sitter/tree-sitter.wasm');

// File extension → grammar name (JS/TS are handled by the TS compiler, not here).
const EXT_GRAMMAR: Record<string, string> = {
  '.dart': 'dart',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.kts': 'kotlin',
  '.py': 'python',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.rb': 'ruby',
  '.php': 'php',
  '.c': 'c',
  '.h': 'c',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.cxx': 'cpp',
  '.hpp': 'cpp',
  '.cs': 'c_sharp',
  '.scala': 'scala',
  '.ex': 'elixir',
  '.exs': 'elixir',
  '.elm': 'elm',
  '.lua': 'lua',
  '.sh': 'bash',
  '.bash': 'bash',
  '.m': 'objc',
  '.sol': 'solidity',
  '.zig': 'zig',
};

function ext(relPath: string): string {
  const i = relPath.lastIndexOf('.');
  return i < 0 ? '' : relPath.slice(i).toLowerCase();
}

/** True if we have a tree-sitter grammar for this file's language. */
export function hasTreeSitterGrammar(relPath: string): boolean {
  return EXT_GRAMMAR[ext(relPath)] !== undefined;
}

let initPromise: Promise<void> | null = null;
const languages = new Map<string, Language>();

async function getLanguage(name: string): Promise<Language | null> {
  if (!initPromise) initPromise = Parser.init({ locateFile: () => CORE_WASM });
  await initPromise;

  const cached = languages.get(name);
  if (cached) return cached;

  const wasmPath = path.join(GRAMMAR_DIR, `tree-sitter-${name}.wasm`);
  if (!fs.existsSync(wasmPath)) return null;
  const lang = await Language.load(new Uint8Array(fs.readFileSync(wasmPath)));
  languages.set(name, lang);
  return lang;
}

/** Depth-first collect ERROR and MISSING nodes, pruning clean subtrees. */
function collectErrors(node: Node, out: Node[]): void {
  if (node.isError || node.isMissing) {
    out.push(node);
    return;
  }
  if (!node.hasError) return;
  for (const child of node.children) {
    if (child) collectErrors(child, out);
  }
}

/** Syntax-error squiggles for a non-JS/TS file, or [] if unsupported/parse fails. */
export async function checkTreeSitterSyntax(
  relPath: string,
  content: string,
): Promise<SquiggleMarker[]> {
  const name = EXT_GRAMMAR[ext(relPath)];
  if (!name) return [];

  try {
    const lang = await getLanguage(name);
    if (!lang) return [];
    const parser = new Parser();
    parser.setLanguage(lang);
    const tree = parser.parse(content);
    if (!tree) return [];

    const errors: Node[] = [];
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
            : 'The parser could not make sense of this code in this language.',
          lookFor: 'Check brackets, quotes, indentation, and that the line just before this is complete.',
        },
      };
    });
  } catch {
    return [];
  }
}
