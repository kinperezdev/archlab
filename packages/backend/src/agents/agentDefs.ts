/**
 * The six specialized agents: their identity, accent color, role description,
 * and the system-prompt builder that frames each one's job. Every agent is told
 * to return findings in a strict JSON shape so the response parses cleanly.
 */

import type { AgentId, AgentMeta } from '@archlab/shared';

export const AGENT_META: Record<AgentId, AgentMeta> = {
  security: {
    id: 'security',
    name: 'Security Agent',
    role: 'Monitors for vulnerabilities, exposed secrets, missing auth, SQL injection, and CORS misconfigurations.',
    color: '#ef4444',
  },
  performance: {
    id: 'performance',
    name: 'Performance Agent',
    role: 'Finds bottlenecks, N+1 queries, missing caching, unoptimized components, and blocking/unbounded operations.',
    color: '#f59e0b',
  },
  architecture: {
    id: 'architecture',
    name: 'Architecture Agent',
    role: 'Reviews system design, missing infrastructure layers, and whether code matches existing patterns.',
    color: '#3b82f6',
  },
  database: {
    id: 'database',
    name: 'Database Agent',
    role: 'Validates schema, indexes, foreign-key integrity, and query optimizations.',
    color: '#a855f7',
  },
  quality: {
    id: 'quality',
    name: 'Code Quality Agent',
    role: 'Reviews patterns, technical debt, error handling, types, and dead code.',
    color: '#10b981',
  },
  orchestrator: {
    id: 'orchestrator',
    name: 'Orchestrator Agent',
    role: 'Coordinates the team, synthesizes findings, prioritizes by impact, and produces the final report.',
    color: '#6366f1',
  },
};

/** Worker agents run before the orchestrator, in this order (sequential mode). */
export const WORKER_AGENTS: AgentId[] = ['security', 'performance', 'architecture', 'database', 'quality'];

/** The shared JSON-output contract appended to every worker agent's prompt. */
const FINDINGS_CONTRACT = `
Return ONLY a JSON object (no prose, no markdown fences) of the form:
{
  "findings": [
    {
      "severity": "critical" | "high" | "medium" | "low" | "info",
      "title": "short title",
      "file": "relative/path or null",
      "description": "what is wrong and why it matters",
      "suggestedFix": "concrete, actionable fix",
      "message_to": "security|performance|architecture|database|quality|null",
      "message": "optional note to hand to another agent, or null"
    }
  ]
}
Keep findings specific and grounded in the provided context. If nothing is wrong, return {"findings": []}.`;

/** Build the system prompt for one worker agent. */
export function workerSystemPrompt(id: AgentId): string {
  const meta = AGENT_META[id];
  return `You are the ${meta.name} on a multi-agent engineering review team for a software project.
Your role: ${meta.role}
You are pre-loaded with the full project context (intelligence, findings, architecture map, database schema, infrastructure map, and cross-project patterns) as a JSON block in the user message. You start fully informed; never claim you lack context.
Focus strictly on your specialty. Be precise and reference real files from the context where possible.
${FINDINGS_CONTRACT}`;
}

/** Build the orchestrator's system prompt. */
export function orchestratorSystemPrompt(): string {
  return `You are the Orchestrator Agent leading a multi-agent engineering review team.
You are given the full project context plus every finding the five specialist agents produced and the messages they posted to each other.
Synthesize everything into a single prioritized action plan. Resolve conflicts, deduplicate, and rank by impact vs effort.
Return ONLY a JSON object (no prose, no markdown fences) of the form:
{
  "summary": "2-3 sentence executive summary",
  "priorityActions": [ { "title": "...", "detail": "...", "effort": "..." } ],
  "quickWins": [ { "title": "...", "detail": "...", "effort": "<30 min" } ],
  "architectureDecisions": [ { "title": "...", "detail": "...", "effort": "planning required" } ],
  "technicalDebt": [ { "title": "...", "detail": "...", "effort": "..." } ]
}
priorityActions: the top 5 most important fixes. quickWins: high-impact fixes under 30 minutes. architectureDecisions: strategic changes needing planning. technicalDebt: a prioritized debt list.`;
}
