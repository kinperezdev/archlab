/**
 * Tiny dependency-free syntax tokenizer for the Code Intelligence Panel.
 *
 * Splits one line of source into typed tokens the panel renders as colored
 * spans (VS Code dark palette): keywords blue, strings green, comments grey,
 * functions yellow, types teal, numbers/errors red, everything else plain.
 *
 * It is heuristic and language-agnostic — good enough for a readable preview,
 * not a full parser.
 */

export type TokenType =
  | 'keyword'
  | 'string'
  | 'comment'
  | 'function'
  | 'type'
  | 'number'
  | 'punctuation'
  | 'plain';

export interface Token {
  text: string;
  type: TokenType;
}

const KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'switch',
  'case', 'break', 'continue', 'new', 'class', 'extends', 'super', 'this', 'import',
  'export', 'default', 'from', 'as', 'async', 'await', 'try', 'catch', 'finally',
  'throw', 'typeof', 'instanceof', 'in', 'of', 'do', 'yield', 'delete', 'void',
  'interface', 'type', 'enum', 'public', 'private', 'protected', 'static', 'readonly',
  'abstract', 'implements', 'namespace', 'declare', 'def', 'self', 'None', 'True',
  'False', 'null', 'undefined', 'true', 'false', 'and', 'or', 'not', 'with', 'lambda',
]);

const TYPE_WORDS = new Set([
  'string', 'number', 'boolean', 'any', 'unknown', 'never', 'void', 'object',
  'Promise', 'Array', 'Record', 'Map', 'Set', 'Date', 'Partial', 'Readonly',
]);

/** Tokenize one line of code into colored spans. */
export function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  // Whole-line comment fast path.
  const trimmed = line.trimStart();
  if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
    return [{ text: line, type: 'comment' }];
  }

  while (i < line.length) {
    const ch = line[i];

    // Inline comment to end of line.
    if (ch === '/' && line[i + 1] === '/') {
      tokens.push({ text: line.slice(i), type: 'comment' });
      break;
    }

    // Strings: ', ", or `.
    if (ch === '"' || ch === "'" || ch === '`') {
      let j = i + 1;
      while (j < line.length && line[j] !== ch) {
        if (line[j] === '\\') j++;
        j++;
      }
      tokens.push({ text: line.slice(i, Math.min(j + 1, line.length)), type: 'string' });
      i = j + 1;
      continue;
    }

    // Numbers.
    if (/[0-9]/.test(ch) && !/[A-Za-z_$]/.test(line[i - 1] ?? '')) {
      let j = i;
      while (j < line.length && /[0-9_.xa-fA-F]/.test(line[j])) j++;
      tokens.push({ text: line.slice(i, j), type: 'number' });
      i = j;
      continue;
    }

    // Identifiers / keywords / functions / types.
    if (/[A-Za-z_$]/.test(ch)) {
      let j = i;
      while (j < line.length && /[A-Za-z0-9_$]/.test(line[j])) j++;
      const word = line.slice(i, j);
      const isCall = line[j] === '(';
      const isType = TYPE_WORDS.has(word) || (/^[A-Z]/.test(word) && !isCall);
      if (KEYWORDS.has(word)) tokens.push({ text: word, type: 'keyword' });
      else if (isCall) tokens.push({ text: word, type: 'function' });
      else if (isType) tokens.push({ text: word, type: 'type' });
      else tokens.push({ text: word, type: 'plain' });
      i = j;
      continue;
    }

    // Punctuation and whitespace runs.
    if (/[{}()[\].,;:=<>+\-*/%!&|?]/.test(ch)) {
      tokens.push({ text: ch, type: 'punctuation' });
      i++;
      continue;
    }

    tokens.push({ text: ch, type: 'plain' });
    i++;
  }

  return tokens;
}
