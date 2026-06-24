/**
 * Failure Simulation engine.
 *
 * Given an origin node, a failure scenario, and the real canvas graph, this
 * computes how the failure cascades through dependent nodes, who it affects,
 * what recovers automatically, and an AI remediation prompt. Pure and
 * deterministic: no network, no backend, no mutation of the inputs.
 *
 * Cascade direction: edges run source -> target (the source depends on / calls
 * the target). So a failure propagates BACKWARD along edges, from a failed node
 * to the nodes that depend on it (its callers).
 */

import type { CanvasEdge, CanvasNode, Diagnostic } from '@archlab/shared';

export type SimulationSeverity = 'low' | 'medium' | 'high' | 'critical';
export type TrafficLevel = 'off-peak' | 'normal' | 'peak' | 'black-friday';
export type SimulationDuration = '30s' | '5m' | '1h' | 'permanent';
export type NodeSimState =
  | 'healthy'
  | 'warning'
  | 'degraded'
  | 'failed'
  | 'cascade-failed'
  | 'recovering';

export interface SimulationScenario {
  nodeId: string;
  nodeLabel: string;
  nodeType: string;
  scenario: string;
  severity: SimulationSeverity;
  trafficLevel: TrafficLevel;
  duration: SimulationDuration;
}

export interface NodeSimulationState {
  nodeId: string;
  state: NodeSimState;
  reason: string;
  hopCount: number;
  affectedAtMs: number;
  recovers: boolean;
}

export interface SimulationResult {
  scenario: SimulationScenario;
  nodeStates: NodeSimulationState[];
  cascadeChain: string[][];
  estimatedUsersAffected: number;
  estimatedImpact: string;
  autoRecoveryNodes: string[];
  manualInterventionNodes: string[];
  enterpriseAuditCorrelations: string[];
  generatedPrompt: string;
}

// ---------------------------------------------------------------------------
// Node type normalization
// ---------------------------------------------------------------------------

/** A simulation-facing node category, richer than the raw canvas kind. */
export type SimType =
  | 'cdn'
  | 'load-balancer'
  | 'auth'
  | 'database'
  | 'cache'
  | 'api-gateway'
  | 'microservice'
  | 'pubsub'
  | 'frontend'
  | 'default';

/** Map a canvas node (kind + label hints) onto a simulation category. */
export function normalizeSimType(node: { kind: string; label?: string }): SimType {
  const text = `${node.label ?? ''}`.toLowerCase();
  if (/\bcdn\b|cloudfront|cloudflare|fastly/.test(text)) return 'cdn';
  if (/load.?balanc|haproxy|\belb\b|\balb\b|nginx/.test(text)) return 'load-balancer';
  if (/redis|memcache|\bcache\b/.test(text)) return 'cache';
  if (/kafka|rabbit|\bsqs\b|pubsub|queue|topic|stream/.test(text)) return 'pubsub';
  if (/gateway/.test(text)) return 'api-gateway';

  switch (node.kind) {
    case 'auth':
      return 'auth';
    case 'database':
      return 'database';
    case 'endpoint':
      return 'api-gateway';
    case 'middleware':
    case 'external-service':
    case 'mcp':
      return 'microservice';
    case 'route':
    case 'component':
      return 'frontend';
    default:
      return 'default';
  }
}

/** Preset "what goes wrong" scenarios per simulation category. */
export const PRESET_SCENARIOS: Record<SimType, string[]> = {
  database: ['Connection timeout', 'Disk full', 'Slow queries', 'Primary fails'],
  auth: ['Service down', 'Token validation failing', 'Rate limited'],
  cache: ['Cache miss storm', 'Memory exhausted', 'Connection refused'],
  'api-gateway': ['Overloaded', 'SSL certificate expired', 'Config error'],
  microservice: ['Pod crash loop', 'Memory leak', 'Dependency unavailable'],
  cdn: ['Cache purge storm', 'Origin unreachable', 'DDoS absorption'],
  'load-balancer': ['Health check failing', 'All backends unhealthy'],
  pubsub: ['Queue full', 'Consumer lag', 'Message loss'],
  frontend: ['Bundle fails to load', 'Render crash', 'API calls failing'],
  default: ['Service unavailable', 'High latency', 'Error rate spike'],
};

/** Preset scenarios for a node, by its normalized type. */
export function presetsForNode(node: { kind: string; label?: string }): string[] {
  return PRESET_SCENARIOS[normalizeSimType(node)];
}

// ---------------------------------------------------------------------------
// Impact model
// ---------------------------------------------------------------------------

/** Share of users directly affected when a node of this category fails. */
const USER_IMPACT_PCT: Record<SimType, number> = {
  cdn: 100,
  'load-balancer': 100,
  'api-gateway': 100,
  auth: 80,
  database: 90,
  cache: 0,
  microservice: 30,
  pubsub: 20,
  frontend: 50,
  default: 40,
};

/** Notional concurrent users by traffic level, for an absolute estimate. */
const TRAFFIC_BASE: Record<TrafficLevel, number> = {
  'off-peak': 1_000,
  normal: 10_000,
  peak: 50_000,
  'black-friday': 200_000,
};

const TRAFFIC_LABEL: Record<TrafficLevel, string> = {
  'off-peak': 'off-peak',
  normal: 'normal',
  peak: 'peak',
  'black-friday': 'Black Friday',
};

const DURATION_LABEL: Record<SimulationDuration, string> = {
  '30s': '30-second',
  '5m': '5-minute',
  '1h': '1-hour',
  permanent: 'permanent',
};

/** Wave spacing for the cascade animation (ms per hop). */
const HOP_MS = 800;

// ---------------------------------------------------------------------------
// Cascade computation
// ---------------------------------------------------------------------------

const SEVERITY_BASE: Record<SimulationSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const STATE_LADDER: NodeSimState[] = ['failed', 'degraded', 'warning'];

/** Resolve the failure state for a node at a given hop from the origin. */
function stateForHop(hop: number, severity: SimulationSeverity): NodeSimState {
  if (hop === 0) return 'failed';
  const idx = SEVERITY_BASE[severity] + (hop - 1);
  const ladded = STATE_LADDER[Math.min(idx, STATE_LADDER.length - 1)];
  // A non-origin node that lands on "failed" is a cascade failure.
  return ladded === 'failed' ? 'cascade-failed' : ladded;
}

/** Does any diagnostic for this node indicate built-in resilience? */
function nodeRecovers(nodeId: string, diagnostics: Diagnostic[]): boolean {
  return diagnostics.some(
    (d) =>
      d.relatedNodeIds.includes(nodeId) &&
      /circuit.?breaker|retry|fallback|back-?off|graceful|failover/i.test(
        `${d.title} ${d.what} ${d.why} ${d.howToFix} ${d.optimization}`,
      ),
  );
}

const MAX_HOP = 4;

/**
 * Run a failure simulation from the origin node outward through its dependents.
 */
export function runSimulation(
  scenario: SimulationScenario,
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  diagnostics: Diagnostic[],
): SimulationResult {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const origin = byId.get(scenario.nodeId);
  const originLabel = origin?.label ?? scenario.nodeLabel;

  // Reverse adjacency: a node's dependents are the sources that point at it.
  const dependents = new Map<string, string[]>();
  for (const e of edges) {
    const list = dependents.get(e.target);
    if (list) list.push(e.source);
    else dependents.set(e.target, [e.source]);
  }

  const isLow = scenario.severity === 'low';
  const visited = new Set<string>();
  const nodeStates: NodeSimulationState[] = [];

  // BFS from the origin over reverse edges, capped at MAX_HOP.
  const queue: Array<{ id: string; hop: number }> = [{ id: scenario.nodeId, hop: 0 }];
  while (queue.length > 0) {
    const { id, hop } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const node = byId.get(id);
    if (!node) continue;
    const state = stateForHop(hop, scenario.severity);
    const recovers = nodeRecovers(id, diagnostics);

    nodeStates.push({
      nodeId: id,
      state,
      reason:
        hop === 0
          ? `${scenario.scenario} (${scenario.severity})`
          : `Depends on ${originLabel}, which failed`,
      hopCount: hop,
      affectedAtMs: hop * HOP_MS,
      recovers,
    });

    // Low severity is contained at the origin; otherwise keep cascading.
    if (!isLow && hop < MAX_HOP) {
      for (const dep of dependents.get(id) ?? []) {
        if (!visited.has(dep)) queue.push({ id: dep, hop: hop + 1 });
      }
    }
  }

  // Group node ids into waves by hop count for the timeline + animation.
  const maxHop = nodeStates.reduce((m, ns) => Math.max(m, ns.hopCount), 0);
  const cascadeChain: string[][] = [];
  for (let h = 0; h <= maxHop; h++) {
    cascadeChain.push(nodeStates.filter((ns) => ns.hopCount === h).map((ns) => ns.nodeId));
  }

  const labelFor = (id: string) => byId.get(id)?.label ?? id;

  const autoRecoveryNodes = nodeStates
    .filter((ns) => ns.recovers && ns.state !== 'healthy' && ns.state !== 'warning')
    .map((ns) => labelFor(ns.nodeId));

  const manualInterventionNodes = nodeStates
    .filter((ns) => !ns.recovers && (ns.state === 'failed' || ns.state === 'cascade-failed'))
    .map((ns) => labelFor(ns.nodeId));

  // Users affected, from the origin category and traffic level.
  const simType = normalizeSimType({ kind: origin?.kind ?? 'unknown', label: originLabel });
  const pct = USER_IMPACT_PCT[simType];
  const base = TRAFFIC_BASE[scenario.trafficLevel];
  const estimatedUsersAffected = Math.round((base * pct) / 100);
  const estimatedImpact =
    simType === 'cache'
      ? `No direct user-facing errors, but expect roughly a 3x latency spike as read load falls through to the database under ${TRAFFIC_LABEL[scenario.trafficLevel]} traffic.`
      : `~${pct}% of active users (≈${estimatedUsersAffected.toLocaleString()}) would be affected during a ${DURATION_LABEL[scenario.duration]} ${TRAFFIC_LABEL[scenario.trafficLevel]}-traffic outage.`;

  // Correlate hard failures with known critical/high findings (Enterprise Audit
  // critical gaps are derived from exactly these diagnostics).
  const failedIds = new Set(
    nodeStates.filter((ns) => ns.state === 'failed' || ns.state === 'cascade-failed').map((ns) => ns.nodeId),
  );
  const seenCorr = new Set<string>();
  const enterpriseAuditCorrelations: string[] = [];
  for (const d of diagnostics) {
    if (d.severity !== 'critical' && d.severity !== 'high') continue;
    const hit = d.relatedNodeIds.find((id) => failedIds.has(id));
    if (!hit) continue;
    const line = `${labelFor(hit)} failure confirms a ${d.severity} gap: ${d.title}`;
    if (seenCorr.has(line)) continue;
    seenCorr.add(line);
    enterpriseAuditCorrelations.push(line);
  }

  const generatedPrompt = buildPrompt(scenario, {
    originLabel,
    cascadeChain,
    labelFor,
    estimatedImpact,
    autoRecoveryNodes,
    manualInterventionNodes,
    enterpriseAuditCorrelations,
  });

  return {
    scenario,
    nodeStates,
    cascadeChain,
    estimatedUsersAffected,
    estimatedImpact,
    autoRecoveryNodes,
    manualInterventionNodes,
    enterpriseAuditCorrelations,
    generatedPrompt,
  };
}

/** Build the PERSONA / TASK / FORMAT / CONTEXT remediation prompt. */
function buildPrompt(
  scenario: SimulationScenario,
  ctx: {
    originLabel: string;
    cascadeChain: string[][];
    labelFor: (id: string) => string;
    estimatedImpact: string;
    autoRecoveryNodes: string[];
    manualInterventionNodes: string[];
    enterpriseAuditCorrelations: string[];
  },
): string {
  const waves = ctx.cascadeChain
    .map((ids, i) => `  Wave ${i + 1} (${i * HOP_MS}ms): ${ids.map(ctx.labelFor).join(', ') || '(none)'}`)
    .join('\n');
  const list = (arr: string[]) => (arr.length ? arr.join(', ') : 'none');

  return [
    'PERSONA: You are a senior site reliability engineer who specializes in resilience and failure-mode analysis.',
    `TASK: Harden this system against the simulated failure of "${ctx.originLabel}" (${scenario.scenario}). Recommend concrete, prioritized remediations that stop the cascade and shrink the blast radius.`,
    'FORMAT: A prioritized list of remediation steps. For each, state the failure mode it addresses, the specific pattern or tool to apply (circuit breaker, retry with backoff, bulkhead, replica/failover, cache fallback, rate limit, health check), and where in the architecture it belongs.',
    'CONTEXT:',
    `- Origin: ${ctx.originLabel} (${scenario.nodeType}); scenario: ${scenario.scenario}; severity: ${scenario.severity}.`,
    `- Traffic level: ${scenario.trafficLevel}; outage duration: ${scenario.duration}.`,
    `- Estimated impact: ${ctx.estimatedImpact}`,
    '- Cascade waves:',
    waves,
    `- Auto-recovering components (already resilient): ${list(ctx.autoRecoveryNodes)}.`,
    `- Components needing manual intervention: ${list(ctx.manualInterventionNodes)}.`,
    `- Confirmed critical findings: ${list(ctx.enterpriseAuditCorrelations)}.`,
  ].join('\n');
}
