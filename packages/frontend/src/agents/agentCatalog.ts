/** Frontend mirror of the agent metadata (name, role, accent color, glyph). */

import type { AgentId, AgentMeta } from '@archlab/shared';

export interface AgentCatalogEntry extends AgentMeta {
  glyph: string;
}

export const AGENT_CATALOG: AgentCatalogEntry[] = [
  { id: 'security', name: 'Security Agent', glyph: '🛡', color: '#ef4444', role: 'Vulnerabilities, exposed secrets, missing auth, SQL injection, CORS.' },
  { id: 'performance', name: 'Performance Agent', glyph: '⚡', color: '#f59e0b', role: 'Bottlenecks, N+1 queries, caching, blocking & unbounded operations.' },
  { id: 'architecture', name: 'Architecture Agent', glyph: '🏛', color: '#3b82f6', role: 'System design, missing infra layers, pattern conformance.' },
  { id: 'database', name: 'Database Agent', glyph: '🗄', color: '#a855f7', role: 'Schema, indexes, FK integrity, query optimization.' },
  { id: 'quality', name: 'Code Quality Agent', glyph: '✦', color: '#10b981', role: 'Patterns, technical debt, error handling, types, dead code.' },
  { id: 'orchestrator', name: 'Orchestrator Agent', glyph: '◎', color: '#6366f1', role: 'Synthesizes all findings into a prioritized team report.' },
];

const BY_ID = new Map(AGENT_CATALOG.map((a) => [a.id, a]));
export function agentInfo(id: AgentId): AgentCatalogEntry {
  return BY_ID.get(id) ?? { id, name: id, glyph: '•', color: '#71717a', role: '' };
}
