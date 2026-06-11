/**
 * Operation inference for backend connector ports.
 *
 * Given a connection between two nodes, infers the operation it performs
 * (CREATE, READ, AUTHENTICATE, EMIT, ...) from the node kinds and any edge/label
 * hints, picks a destination label, and supplies a color for instant visual
 * scanning. Pure and deterministic so it can run on every render.
 */

export type Operation =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'AUTHENTICATE'
  | 'VALIDATE'
  | 'MIDDLEWARE'
  | 'REDIRECT'
  | 'EMIT'
  | 'SUBSCRIBE'
  | 'QUERY'
  | 'SEED'
  | 'MIGRATE';

/** Operation -> color. The eight required ones are exact; the rest are tuned. */
export const OPERATION_COLORS: Record<Operation, string> = {
  CREATE: '#34d399', // green
  READ: '#60a5fa', // blue
  UPDATE: '#fb923c', // orange
  DELETE: '#f87171', // red
  AUTHENTICATE: '#c084fc', // purple
  MIDDLEWARE: '#a1a1aa', // grey
  EMIT: '#facc15', // yellow
  SUBSCRIBE: '#2dd4bf', // teal
  // Sensible extras
  VALIDATE: '#22d3ee',
  REDIRECT: '#f472b6',
  QUERY: '#38bdf8',
  SEED: '#84cc16',
  MIGRATE: '#818cf8',
};

interface InferInput {
  otherKind?: string;
  edgeLabel?: string;
  /** Text from the originating node (label + file) used to refine the verb. */
  sourceHint?: string;
  direction: 'in' | 'out';
}

/** Infer the operation an edge represents. */
export function inferOperation({ otherKind, edgeLabel, sourceHint, direction }: InferInput): Operation {
  const text = `${edgeLabel ?? ''} ${sourceHint ?? ''}`.toLowerCase();

  if (/socket|websocket|\bws\b|emit|broadcast|publish/.test(text)) {
    return direction === 'out' ? 'EMIT' : 'SUBSCRIBE';
  }
  if (otherKind === 'auth' || /\bauth|jwt|login|passport|session|oauth\b/.test(text)) return 'AUTHENTICATE';
  if (otherKind === 'middleware' || /middleware/.test(text)) return 'MIDDLEWARE';
  if (/redirect|nav:|navigate|location\./.test(text)) return 'REDIRECT';
  if (/valid|sanitiz|zod|joi|schema\.parse|assert/.test(text)) return 'VALIDATE';

  if (otherKind === 'database') {
    if (/seed/.test(text)) return 'SEED';
    if (/migrat/.test(text)) return 'MIGRATE';
    if (/create|insert|post|add|new/.test(text)) return 'CREATE';
    if (/update|put|patch|edit/.test(text)) return 'UPDATE';
    if (/delete|remove|destroy|drop/.test(text)) return 'DELETE';
    if (/get|read|find|select|list|fetch|query/.test(text)) return 'READ';
    return 'QUERY';
  }

  if (/create|insert|post|add|register/.test(text)) return 'CREATE';
  if (/update|put|patch/.test(text)) return 'UPDATE';
  if (/delete|remove|destroy/.test(text)) return 'DELETE';
  if (/get|read|list|fetch|load/.test(text)) return 'READ';

  return 'READ';
}

/** A human destination label like "users table" or "JWT middleware". */
export function destinationLabel(node?: { label: string; kind: string }): string {
  if (!node) return 'unknown';
  switch (node.kind) {
    case 'database':
      return `${node.label} table`;
    case 'auth':
      return `${node.label} auth`;
    case 'middleware':
      return `${node.label} middleware`;
    case 'mcp':
      return `${node.label} MCP`;
    case 'external-service':
      return `${node.label} service`;
    case 'endpoint':
      return `${node.label} endpoint`;
    case 'component':
      return `${node.label} component`;
    case 'route':
      return `${node.label} page`;
    default:
      return node.label;
  }
}
