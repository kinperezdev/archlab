/**
 * Built-in "also good to implement" heuristics for node capability chips.
 *
 * Given a detected tool (name + category), suggest one high-value improvement
 * and the reason it's better. Name-specific advice wins over the category
 * default. Pure data, no API calls, so it renders instantly and offline.
 */

export interface NodeRecommendation {
  /** What to add / implement next. */
  recommend: string;
  /** Why it's better: the payoff. */
  why: string;
  /** Lowercased tool names/categories that already satisfy this advice. If the
   *  same node already has one of these, the tip is redundant and hidden. */
  redundantWith?: string[];
}

/** Full payload shown in the dedicated right panel when a chip is clicked. */
export interface CapabilityDetail {
  nodeLabel: string;
  toolName: string;
  category: string;
  color: string;
  recommend?: string;
  why?: string;
}

/** Category-level defaults (fallback when there's no name-specific advice). */
const BY_CATEGORY: Record<string, NodeRecommendation> = {
  auth: {
    recommend: 'Add email verification + rate limiting on auth routes',
    why: 'Blocks fake signups and credential-stuffing / brute-force attempts.',
  },
  database: {
    recommend: 'Use parameterized queries, indexes on hot columns, and pooling',
    why: 'Prevents SQL injection, full-table scans, and connection exhaustion under load.',
  },
  storage: {
    recommend: 'Use signed URLs with size + content-type limits',
    why: 'Stops unauthorized access and abuse of your storage bucket.',
  },
  realtime: {
    recommend: 'Add reconnect/backoff and auth on every channel',
    why: 'Keeps live updates resilient and blocks unauthorized subscriptions.',
  },
  'api-client': {
    recommend: 'Add timeouts, retries, and response caching (e.g. TanStack Query)',
    why: 'Survives flaky networks and cuts redundant calls and latency.',
    redundantWith: ['tanstack query', 'react query', 'react-query', 'swr'],
  },
  ai: {
    recommend: 'Add prompt-injection guards, output validation, and token budgets',
    why: 'Prevents jailbreaks, malformed output, and runaway API cost.',
  },
  payment: {
    recommend: 'Verify webhook signatures and make handlers idempotent',
    why: 'Stops spoofed events and double-charging on provider retries.',
  },
};

/** Name-specific advice for tools where the generic category misses the point. */
const BY_NAME: Record<string, NodeRecommendation> = {
  Firebase: {
    recommend: 'Lock down with Firestore Security Rules + App Check',
    why: 'The web config is public by design. Rules are the real access control, and App Check blocks abuse.',
  },
  'Firebase Auth': {
    recommend: 'Require email verification and enforce Security Rules per user',
    why: 'Auth alone does not authorize data access. Rules do.',
  },
  Supabase: {
    recommend: 'Enable Row Level Security (RLS) on every table',
    why: 'Without RLS the public anon key can read and write everything.',
  },
  'Supabase Auth': {
    recommend: 'Pair auth with Row Level Security policies',
    why: 'RLS is what actually scopes each user to their own rows.',
  },
  MongoDB: {
    recommend: 'Add schema validation and indexes on queried fields',
    why: 'Prevents malformed documents and slow collection scans as data grows.',
  },
  Stripe: {
    recommend: 'Verify webhook signatures and key handlers by idempotency key',
    why: 'Stops forged webhook calls and prevents double-charging on retries.',
  },
  GraphQL: {
    recommend: 'Add query depth/complexity limits and persisted queries',
    why: 'Prevents expensive nested queries from being used to DoS the API.',
  },
};

/**
 * Resolve advice for a tool, or null when none applies. `presentOnNode` is the
 * set of other tool names/categories already on the same node (lowercased); a
 * tip is suppressed when the node already satisfies it.
 */
export function getNodeRecommendation(
  toolName: string,
  category: string,
  presentOnNode?: Set<string>,
): NodeRecommendation | null {
  const rec = BY_NAME[toolName] ?? BY_CATEGORY[category] ?? null;
  if (!rec) return null;
  if (rec.redundantWith && presentOnNode) {
    if (rec.redundantWith.some((token) => presentOnNode.has(token))) return null;
  }
  return rec;
}
