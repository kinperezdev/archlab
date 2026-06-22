/**
 * Team debate runner — streams a multi-persona review of a single queue item
 * by calling the Anthropic API once per participating member. The architect
 * speaks last and synthesizes a decision + a Claude Code fix prompt.
 *
 * Token usage from each call is reported via `onTokensUsed` so the caller can
 * track it against Fran's budget.
 */

import { TEAM_MEMBERS } from './teamPersonas.js';
import { completeWithProvider, type AIProviderConfig } from './archco/multiProviderAI.js';

export interface DebateMessage {
  memberId: string;
  memberName: string;
  role: string;
  color: string;
  message: string;
  isStreaming: boolean;
  timestamp: number;
}

export type DebateSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface DebateItem {
  id: string;
  title: string;
  description: string;
  severity: DebateSeverity;
  type: string;
}

/** Which members join the debate, scaled by severity. */
function participantsFor(severity: DebateSeverity): string[] {
  switch (severity) {
    case 'critical':
      return ['backend', 'security', 'sre', 'pm', 'frontend', 'designer', 'architect'];
    case 'high':
      return ['backend', 'security', 'sre', 'architect'];
    case 'medium':
      return ['backend', 'sre', 'architect'];
    default:
      return ['architect'];
  }
}

/**
 * Stream the debate for one item. Yields one message per member. The architect's
 * message includes ACTION:/PROMPT: lines the caller can parse for the decision.
 */
export async function* runItemDebate(
  item: DebateItem,
  projectContext: string,
  providerConfig: AIProviderConfig,
  onTokensUsed: (tokens: number) => void,
): AsyncGenerator<DebateMessage> {
  const memberIds = participantsFor(item.severity);
  const members = TEAM_MEMBERS.filter((m) => memberIds.includes(m.id));
  const conversationHistory: string[] = [];

  for (const member of members) {
    const isArchitect = member.id === 'architect';

    const systemPrompt = `You are ${member.name}, ${member.role} at the ArchCo engineering team.
Personality: ${member.personality}
Focus areas: ${member.focusAreas.join(', ')}
Project context: ${projectContext || 'an existing software project'}

You are in a team review discussing a ${item.severity.toUpperCase()} severity issue.
Stay in character. Be specific — reference the actual finding. Keep it to 3-5 sentences.
${
  isArchitect
    ? 'As architect, synthesize the team discussion and give a final decision with a specific action item.'
    : 'Respond naturally; agree or disagree with previous speakers when appropriate.'
}`;

    const userPrompt = isArchitect
      ? `Team discussion so far:\n${conversationHistory.join('\n\n')}\n\nAs ${member.name}, synthesize and make the final call. End with two lines exactly:\nACTION: [specific next step]\nPROMPT: [one-sentence Claude Code prompt to fix this]`
      : `Issue being reviewed:\nTitle: ${item.title}\nDescription: ${item.description || item.title}\nSeverity: ${item.severity}\n\nPrevious discussion:\n${
          conversationHistory.join('\n\n') || '(you are first to speak)'
        }\n\nAs ${member.name}, respond in 3-5 sentences.`;

    const { text, tokensUsed, error } = await completeWithProvider(
      providerConfig,
      systemPrompt,
      userPrompt,
      300,
    );
    if (tokensUsed > 0) onTokensUsed(tokensUsed);
    const message = error ? `(${member.name}: ${text})` : text || `(${member.name} had nothing to add.)`;

    conversationHistory.push(`${member.name} (${member.role}): ${message}`);

    yield {
      memberId: member.id,
      memberName: member.name,
      role: member.role,
      color: member.color,
      message,
      isStreaming: false,
      timestamp: Date.now(),
    };
  }
}

// ─── Docs / knowledge-based review (no API key required) ─────────────────────

type Category =
  | 'security'
  | 'performance'
  | 'api'
  | 'frontend'
  | 'reliability'
  | 'database'
  | 'testing'
  | 'accessibility'
  | 'devops'
  | 'data'
  | 'general';

/** Map a free-form item type/title to a knowledge category. */
function categorize(item: DebateItem): Category {
  const s = `${item.type} ${item.title}`.toLowerCase();
  if (/secur|auth|secret|inject|xss|csrf|permission|access|owasp|vuln/.test(s)) return 'security';
  if (/\bdb\b|database|sql|query|schema|migration|postgres|index|orm/.test(s)) return 'database';
  if (/perf|bottleneck|slow|latency|n\+1|cache|memory|throughput/.test(s)) return 'performance';
  if (/\bapi\b|endpoint|route|middleware|contract|token|graphql|rest/.test(s)) return 'api';
  if (/a11y|accessib|aria|contrast|screen reader|keyboard|wcag/.test(s)) return 'accessibility';
  if (/frontend|ui|ux|layout|bundle|render|css|component|hydrat/.test(s)) return 'frontend';
  if (/test|coverage|flaky|e2e|unit|regression|qa/.test(s)) return 'testing';
  if (/deploy|ci\/cd|pipeline|docker|k8s|kubernetes|infra|terraform|rollout/.test(s)) return 'devops';
  if (/\bml\b|model|training|inference|dataset|pipeline|etl|feature store|llm/.test(s)) return 'data';
  if (/reliab|scal|observ|incident|uptime|sre|slo|alert/.test(s)) return 'reliability';
  return 'general';
}

/**
 * Static best-practice guidance per member per category — a curated, current
 * engineering knowledge base (used when no AI key is configured). Keyed to the
 * ArchCo review roles. Refresh this as standards evolve.
 *
 * Last reviewed: 2026-06 (OWASP Top 10 2021, Core Web Vitals incl. INP,
 * WCAG 2.2 AA, OpenTelemetry, parameterized queries, supply-chain pinning).
 */
const KNOWLEDGE: Record<string, Partial<Record<Category, string>> & { default: string }> = {
  // Marcus Webb — Backend Lead
  backend: {
    security: 'Parameterize every query and validate input at the boundary — never interpolate user data (OWASP A03 injection). Wrap multi-step writes in a transaction so a partial failure cannot corrupt state.',
    database: 'Check the query plan: kill N+1s, add the covering index, and avoid SELECT *. Make migrations additive and backward-compatible so deploys stay zero-downtime.',
    performance: 'Profile before optimizing. Batch or cache the hot path and stream large results instead of buffering them in memory.',
    api: 'Lock down the contract: validate with a schema (Zod) at the edge, return a consistent error envelope, version the route, and re-verify auth on every mutation.',
    reliability: 'Add retries with exponential backoff and an idempotency key so a flaky downstream cannot double-process.',
    data: 'Treat the data contract as an API — validate shapes on ingest and fail loudly on schema drift.',
    default: 'Tighten input validation, error handling, and transactional integrity around this path.',
  },
  // Sarah Chen — Security Engineer
  security: {
    security: 'This is the class of bug that leaks data. Enforce authorization server-side and fail closed, rotate any exposed secret immediately, and add a regression test for the unauthorized case.',
    api: 'Confirm the auth middleware actually rejects expired and forged tokens — test the negative paths. Add rate limiting and avoid leaking stack traces in error responses.',
    database: 'Least-privilege the DB role, encrypt sensitive columns at rest, and make sure PII never lands in logs.',
    devops: 'Pin and verify dependencies (lockfile + SRI), scan images, and keep secrets in a manager — never in env files committed to the repo.',
    data: 'For any model/data path, watch for prompt injection and PII exposure; sanitize and red-team the inputs.',
    default: 'From a security lens, make sure the fix does not widen the attack surface or log anything sensitive.',
  },
  // Jordan Lee — SRE
  sre: {
    reliability: 'Define an SLO and alert on burn rate, not raw errors. Ship behind a flag with a one-step rollback so we can revert in seconds if it regresses.',
    performance: 'Instrument latency with OpenTelemetry traces so we can prove the fix in prod, not just locally. Watch p95/p99, not the average.',
    devops: 'Make the deploy progressive (canary or blue-green) and automate the rollback trigger on error-rate spikes.',
    security: 'Keep an audit trail — if this is exploited we need to detect and respond fast.',
    default: 'Instrument it, alert on it, and have a tested rollback path ready before shipping.',
  },
  // Priya Nair — Product Manager
  pm: {
    accessibility: 'This blocks real users — treat a11y as a launch requirement, not a nice-to-have. Prioritize it accordingly.',
    testing: 'Make sure acceptance criteria are testable and tied to the user outcome, not just code coverage.',
    default: 'Scope the fix to this issue, not a rewrite, and sequence it by user impact so we ship value first.',
  },
  // Kai Nakamura — Frontend Lead
  frontend: {
    frontend: 'Keep the bundle lean — code-split and lazy-load this, and animate only transform/opacity so we never jank the main thread. Guard INP by keeping handlers cheap.',
    performance: 'Protect Core Web Vitals: reserve space to avoid CLS, defer non-critical JS, and keep interactions under the INP budget (200ms).',
    accessibility: 'Ship it keyboard-first: real focus states, semantic HTML over ARIA, visible focus order, and 4.5:1 contrast (WCAG 2.2 AA).',
    api: 'Coordinate the response shape with backend so the UI is not over-fetching or waterfalling requests.',
    default: 'From the UX side, make sure the fix does not block first render or break accessibility.',
  },
  // Zara Okafor — Product Designer
  designer: {
    accessibility: 'Check contrast and target sizes against WCAG 2.2 AA, and make sure state is never communicated by color alone.',
    frontend: 'Keep the change consistent with the design system tokens — no one-off spacing, radius, or color we have to maintain forever.',
    default: 'Keep it visually consistent with the system and make the affordances obvious.',
  },
};

const ARCHITECT_DECISION: Record<Category, { action: string; prompt: (t: string) => string }> = {
  security: { action: 'Enforce server-side authorization (fail closed), rotate exposed secrets, and add a test for the unauthorized case.', prompt: (t) => `Fix "${t}" by enforcing server-side authorization and adding a regression test for the unauthorized path.` },
  database: { action: 'Fix the query plan (index / kill N+1) and keep the migration additive and zero-downtime.', prompt: (t) => `Fix "${t}" by adding the missing index / removing the N+1 and writing a backward-compatible migration.` },
  performance: { action: 'Profile the hot path, remove the N+1 / add the missing index or cache, and add a perf metric.', prompt: (t) => `Optimize "${t}" by removing the N+1 or adding the missing index/cache, and add a benchmark.` },
  api: { action: 'Harden the endpoint: schema-validate inputs, verify auth, version it, and standardize the error envelope.', prompt: (t) => `Fix "${t}" by schema-validating request inputs and re-verifying auth on the endpoint.` },
  frontend: { action: 'Code-split the bundle, move animations to transform/opacity, and protect INP/CLS.', prompt: (t) => `Fix "${t}" by code-splitting the bundle and using transform/opacity for animation.` },
  accessibility: { action: 'Make it keyboard-accessible with semantic HTML, visible focus, and WCAG 2.2 AA contrast.', prompt: (t) => `Fix "${t}" for WCAG 2.2 AA: keyboard navigation, focus states, and 4.5:1 contrast.` },
  testing: { action: 'Add the missing unit + regression test that reproduces this, then fix to green.', prompt: (t) => `Add a failing regression test for "${t}", then implement the fix until it passes.` },
  devops: { action: 'Ship behind a flag with a progressive rollout and an automated rollback trigger.', prompt: (t) => `Fix "${t}" with a canary rollout behind a flag and an automated rollback on error spikes.` },
  data: { action: 'Validate the data/model contract, add drift checks, and gate on an offline eval.', prompt: (t) => `Fix "${t}" by validating the data contract and adding a drift/eval check before rollout.` },
  reliability: { action: 'Add retry/backoff + idempotency, an SLO-based alert, and a one-step rollback.', prompt: (t) => `Make "${t}" resilient with retry/backoff, an idempotency key, and an SLO alert.` },
  general: { action: 'Implement the targeted fix with input validation, tests, and a metric.', prompt: (t) => `Fix "${t}" with input validation, error handling, and a regression test.` },
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Knowledge-based fallback review for one item — no API key needed. Yields the
 * same DebateMessage shape as runItemDebate, sourced from static engineering
 * best-practice guidance instead of a live model.
 */
export async function* runItemReviewFromKnowledge(item: DebateItem): AsyncGenerator<DebateMessage> {
  const category = categorize(item);
  const memberIds = participantsFor(item.severity);
  const members = TEAM_MEMBERS.filter((m) => memberIds.includes(m.id));

  for (const member of members) {
    await sleep(200); // light pacing so it reads like a streaming discussion
    let message: string;
    if (member.id === 'architect') {
      const d = ARCHITECT_DECISION[category];
      message = `Synthesizing the team's input on this ${item.severity} ${category} issue. Here's the call.\nACTION: ${d.action}\nPROMPT: ${d.prompt(item.title)}`;
    } else {
      const k = KNOWLEDGE[member.id];
      message = (k && (k[category] ?? k.default)) ?? 'Worth a closer look from my area.';
    }
    yield {
      memberId: member.id,
      memberName: member.name,
      role: member.role,
      color: member.color,
      message,
      isStreaming: false,
      timestamp: Date.now(),
    };
  }
}

/** Pull ACTION:/PROMPT: lines out of the architect's closing message. */
export function parseArchitectDecision(message: string): { decision: string; fixPrompt: string } {
  const actionMatch = message.match(/ACTION:\s*(.+)/i);
  const promptMatch = message.match(/PROMPT:\s*(.+)/i);
  const decision = actionMatch?.[1]?.trim() || message.trim();
  const fixPrompt = promptMatch?.[1]?.trim() || '';
  return { decision, fixPrompt };
}
