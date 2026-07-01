/**
 * Enterprise Audit mode — a ReactFlow capability map.
 *
 * Every capability is a card node, grouped into 8 horizontal section bands and
 * wired together by dependency edges. Each card reads the real detected infra
 * (`infra`), package.json dependencies, README-stated tech, and pipeline
 * findings and resolves to evidence-backed assessment states. A compact evidence
 * coverage header sits above the canvas, and a slide-in
 * detail panel opens on card click.
 *
 * Detection logic only reads the props passed in — it never touches the backend.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type {
  Diagnostic,
  EnterpriseAuditResult,
  EnterpriseCard,
  EnterpriseCardState,
  EnterpriseSection,
  InfraNodeType,
  Severity,
  SystemDesignMap,
} from '@archlab/shared';
import type { LucideIcon } from 'lucide-react';
import { CopyPromptButton } from '../components/CopyPromptButton.js';
import { ENTERPRISE_SECTIONS, type CardDef, type SectionDef } from './enterpriseCatalog.js';
import { useApiKeyContext } from '../state/apiKeyContext.js';
import { formatRunTimestamp } from '../lib/formatTime.js';

interface EnterpriseAuditProps {
  infra: SystemDesignMap;
  findings: Diagnostic[];
  /** package.json dependency names + CI/scan config markers (lowercased). */
  dependencies?: string[];
  /** Whether the project is loaded (guards against an empty canvas). */
  hasProject?: boolean;
  /** Whether an Anthropic API key is configured (gates Agent Team nudges). */
  hasApiKey?: boolean;
  /** Open the Agent Team modal (and close the detail panel). */
  onRunAgentTeam?: () => void;
  /** Open the API Keys modal. */
  onAddApiKey?: () => void;
}

const STATE_LABEL: Record<EnterpriseCardState, string> = {
  verified: 'Verified',
  inferred: 'Inferred',
  unknown: 'Unknown',
  'not-applicable': 'Not Applicable',
  gap: 'Gap',
  'critical-gap': 'Critical Gap',
};

const BADGE: Record<EnterpriseCardState, string> = {
  verified: '✓',
  inferred: '≈',
  unknown: '?',
  'not-applicable': '–',
  gap: '!',
  'critical-gap': '✕',
};

const HIGH_SEVERITIES: Severity[] = ['critical', 'high'];
const MED_SEVERITIES: Severity[] = ['bottleneck', 'medium'];

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

interface DetectCtx {
  nodeTypes: Set<InfraNodeType>;
  /** Source evidence grouped by the infrastructure node type it established. */
  nodeEvidence: Map<InfraNodeType, string[]>;
  /** Lowercased searchable text built from the detected infra (project evidence). */
  corpus: string;
  /** Lowercased package.json dependency names + CI/scan config markers. */
  deps: Set<string>;
  /** Lowercased technologies named explicitly in the README. */
  readme: Set<string>;
  findings: Diagnostic[];
  serviceCount: number;
  hasBackend: boolean;
  hasStatefulData: boolean;
  hasPublicEdge: boolean;
  hasDeploymentEvidence: boolean;
}

/** Build the detection context once from infra + findings + dependencies. */
function buildContext(infra: SystemDesignMap, findings: Diagnostic[], dependencies: string[]): DetectCtx {
  const nodeTypes = new Set<InfraNodeType>(infra.nodes.map((n) => n.type));
  const nodeEvidence = new Map<InfraNodeType, string[]>();
  const parts: string[] = [];
  for (const n of infra.nodes) {
    nodeEvidence.set(
      n.type,
      n.evidence.map((ev) => `${ev.file}: ${ev.pattern}`),
    );
    parts.push(n.type, n.label);
    for (const ev of n.evidence) {
      parts.push(ev.pattern);
      if (ev.snippet) parts.push(ev.snippet);
      parts.push(ev.file);
    }
  }
  const corpus = parts.join(' \n ').toLowerCase();
  const deps = new Set(dependencies.map((d) => d.toLowerCase()));
  const readme = new Set((infra.projectContext?.technologies ?? []).map((t) => t.toLowerCase()));
  const serviceCount = infra.nodes.filter((n) => n.type === 'microservice').length;
  const hasBackend = serviceCount > 0 || ['express', 'fastify', 'nestjs', 'django', 'flask', 'spring-boot', 'laravel'].some((d) => deps.has(d));
  const hasStatefulData = infra.nodes.some((n) => ['postgres', 'mysql', 'mongodb', 'redis', 'private-bucket', 'public-bucket'].includes(n.type));
  const hasPublicEdge = infra.nodes.some((n) => ['cdn', 'load-balancer', 'api-gateway', 'waf', 'ddos-protection'].includes(n.type));
  const hasDeploymentEvidence = /dockerfile|docker-compose|kubernetes|helm|terraform|pulumi|vercel|netlify|fly\.io|railway|ecs|cloud run/.test(corpus) || hasPublicEdge;
  return { nodeTypes, nodeEvidence, corpus, deps, readme, findings, serviceCount, hasBackend, hasStatefulData, hasPublicEdge, hasDeploymentEvidence };
}

/** Escape a keyword so it can be embedded literally in a RegExp. */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Whole-word keyword test. Word boundaries stop "scale" matching "scalability",
 * "rest" matching "restore", or "sse" matching "classes".
 */
function wordHit(keyword: string, corpus: string): boolean {
  return new RegExp('\\b' + escapeRegex(keyword) + '\\b', 'i').test(corpus);
}

/** Count how many of a card's keywords appear as whole words in the corpus. */
function corpusKeywordHits(keywords: string[] | undefined, corpus: string): number {
  if (!keywords) return 0;
  return keywords.reduce((n, k) => (wordHit(k, corpus) ? n + 1 : n), 0);
}

/** Does the project depend on any package (or config marker) that proves this card? */
function dependencyProof(def: CardDef, ctx: DetectCtx): string | null {
  return def.packages?.find((p) => ctx.deps.has(p.toLowerCase())) ?? null;
}

/**
 * Does the README explicitly name a technology that proves this card? Treated as
 * high confidence — equal to a dependency match.
 */
function readmeProof(def: CardDef, ctx: DetectCtx): string | null {
  const fromKeywords = def.keywords?.find((k) => ctx.readme.has(k.toLowerCase()));
  if (fromKeywords) return fromKeywords;
  return def.packages?.find((p) => ctx.readme.has(p.toLowerCase())) ?? null;
}

/** Does a finding mention any of the keywords in its title or body text? */
function findingMatches(f: Diagnostic, keywords: string[]): boolean {
  // Version intelligence describes one dependency's maintenance state. It is
  // not evidence that an architectural capability such as CI or test coverage
  // is absent, even when the dependency name happens to match a keyword.
  if (f.step === 'final-report' && /^outdated dependency:/i.test(f.title)) return false;
  const hay = `${f.title} ${f.what} ${f.why} ${f.howToFix}`.toLowerCase();
  return keywords.some((k) => wordHit(k, hay));
}

type Applicability = { applies: boolean; reason: string };

const PUBLIC_EDGE_CAPABILITIES = new Set([
  'cdn', 'load-balancer', 'waf', 'ddos-protection', 'auto-scaling', 'blue-green', 'canary-releases', 'multi-region', 'sla-slo-sli', 'cost-monitoring',
]);
const MULTI_SERVICE_CAPABILITIES = new Set([
  'service-mesh', 'mtls', 'circuit-breaker', 'bulkhead-pattern', 'failover-strategy', 'chaos-engineering',
]);
const STATEFUL_CAPABILITIES = new Set([
  'database-sharding', 'read-replicas', 'caching-strategy', 'consistency-model', 'data-partitioning', 'backup-strategy', 'encryption-at-rest', 'migration-strategy',
]);
const BACKEND_CAPABILITIES = new Set([
  'auth-service', 'access-control', 'business-logic-abuse', 'external-apis', 'ssrf', 'sensitive-data-exposure', 'input-validation', 'rate-limiting', 'api-inventory', 'configuration-security', 'structured-logging', 'metrics-collection', 'distributed-tracing', 'alerting-rules', 'health-checks', 'uptime-monitoring', 'error-tracking', 'audit-logging', 'retry-logic', 'timeout-handling', 'graceful-degradation', 'secrets-management', 'rbac',
]);

function applicabilityFor(def: CardDef, ctx: DetectCtx): Applicability {
  if ((def.id === 'microservices' || def.id === 'microservices-architecture') && ctx.serviceCount < 2) {
    return { applies: false, reason: 'A single deployable service was detected, not a microservice architecture.' };
  }
  if (PUBLIC_EDGE_CAPABILITIES.has(def.id) && !ctx.hasDeploymentEvidence) {
    return { applies: false, reason: 'No production edge or deployment configuration was detected.' };
  }
  if (MULTI_SERVICE_CAPABILITIES.has(def.id) && ctx.serviceCount < 2) {
    return { applies: false, reason: 'This control applies once multiple independently deployed services exist.' };
  }
  if (STATEFUL_CAPABILITIES.has(def.id) && !ctx.hasStatefulData) {
    return { applies: false, reason: 'No stateful data store was detected.' };
  }
  if (BACKEND_CAPABILITIES.has(def.id) && !ctx.hasBackend) {
    return { applies: false, reason: 'No backend service was detected.' };
  }
  return { applies: true, reason: '' };
}

function evidenceForNodeTypes(def: CardDef, ctx: DetectCtx): string[] {
  return [...ctx.nodeTypes]
    .filter((type) => def.nodeTypes?.includes(type))
    .flatMap((type) => ctx.nodeEvidence.get(type) ?? [`Detected infrastructure node: ${type}`])
    .slice(0, 4);
}

/** Resolve one card from evidence. Absence is unknown, never a finding by itself. */
function evaluateCard(def: CardDef, ctx: DetectCtx): Pick<EnterpriseCard, 'state' | 'detail' | 'evidence' | 'confidence'> {
  const applicability = applicabilityFor(def, ctx);
  if (!applicability.applies) {
    return { state: 'not-applicable', detail: applicability.reason, evidence: [], confidence: 1 };
  }

  if (def.negativeKeywords?.some((k) => wordHit(k, ctx.corpus))) {
    const riskyPatterns = def.negativeKeywords.filter((k) => wordHit(k, ctx.corpus));
    return { state: 'critical-gap', detail: 'A risky anti-pattern was found in scanned project evidence.', evidence: riskyPatterns.map((k) => `Risk pattern: ${k}`), confidence: 0.95 };
  }

  if (def.nodeTypes?.some((t) => ctx.nodeTypes.has(t))) {
    return { state: 'verified', detail: 'Direct infrastructure evidence was detected in the project.', evidence: evidenceForNodeTypes(def, ctx), confidence: 0.95 };
  }

  const dep = dependencyProof(def, ctx);
  if (dep) {
    return { state: 'inferred', detail: `A project dependency/config indicates this capability: ${dep}.`, evidence: [`Dependency/config: ${dep}`], confidence: 0.75 };
  }

  const readme = readmeProof(def, ctx);
  if (readme) {
    return { state: 'inferred', detail: `The README claims this capability: ${readme}.`, evidence: [`README statement: ${readme}`], confidence: 0.65 };
  }

  const pool = def.securityStep ? ctx.findings.filter((f) => f.step === 'security-checks') : ctx.findings;
  const matched = def.keywords ? pool.filter((f) => findingMatches(f, def.keywords!)) : [];
  const highFinding = matched.find((f) => HIGH_SEVERITIES.includes(f.severity));
  const mediumFinding = matched.find((f) => MED_SEVERITIES.includes(f.severity));
  if (highFinding) {
    return { state: 'critical-gap', detail: `A ${highFinding.severity} finding identifies this as a risk: ${highFinding.title}.`, evidence: [`${highFinding.step}: ${highFinding.title}`], confidence: 0.85 };
  }
  if (mediumFinding) {
    return { state: 'gap', detail: `A finding identifies this as incomplete: ${mediumFinding.title}.`, evidence: [`${mediumFinding.step}: ${mediumFinding.title}`], confidence: 0.75 };
  }

  const hits = corpusKeywordHits(def.keywords, ctx.corpus);
  if (hits >= 2) {
    return { state: 'inferred', detail: 'Multiple code signals suggest this capability, but runtime behavior is unverified.', evidence: [`${hits} matching project signals`], confidence: 0.6 };
  }
  if (def.partialTypes?.some((t) => ctx.nodeTypes.has(t))) {
    return { state: 'inferred', detail: 'Related infrastructure exists, but this capability is not directly proven.', evidence: ['Related infrastructure node detected'], confidence: 0.5 };
  }
  if (hits === 1) {
    return { state: 'inferred', detail: 'One weak project signal was found. Verify before relying on it.', evidence: ['One matching project signal'], confidence: 0.35 };
  }
  return { state: 'unknown', detail: 'Static analysis has no evidence either way. This requires runtime, deployment, or process evidence.', evidence: [], confidence: 0 };
}

/** Direct verification coverage, excluding controls that do not apply to this project. */
function scoreOf(cards: EnterpriseCard[]): number {
  const applicable = cards.filter((c) => c.state !== 'not-applicable');
  if (applicable.length === 0) return 0;
  const verified = applicable.filter((c) => c.state === 'verified');
  return Math.round((verified.length / applicable.length) * 100);
}

export function computeAudit(infra: SystemDesignMap, findings: Diagnostic[], dependencies: string[]): EnterpriseAuditResult {
  const ctx = buildContext(infra, findings, dependencies);
  const sections: EnterpriseSection[] = ENTERPRISE_SECTIONS.map((section: SectionDef) => {
    const cards: EnterpriseCard[] = section.cards.map((def) => {
      const assessment = evaluateCard(def, ctx);
      return { id: def.id, label: def.label, what: def.what, why: def.why, fixPrompt: def.fix, ...assessment };
    });
    return { id: section.id, title: section.title, color: section.color, cards, score: scoreOf(cards) };
  });

  const allCards = sections.flatMap((s) => s.cards);
  const count = (state: EnterpriseCardState) => allCards.filter((c) => c.state === state).length;
  const score = scoreOf(allCards);
  const verdict = 'Static Verification Only';

  return {
    sections,
    score,
    verdict,
    totalCards: allCards.length,
    applicableCount: allCards.length - count('not-applicable'),
    verifiedCount: count('verified'),
    inferredCount: count('inferred'),
    unknownCount: count('unknown'),
    notApplicableCount: count('not-applicable'),
    gapCount: count('gap'),
    criticalGapCount: count('critical-gap'),
  };
}

export function getOverallVerdict(result: EnterpriseAuditResult): { text: string; label: string; score: number } {
  const allCards = result.sections.flatMap((s) =>
    s.cards.map((card) => ({ card, sectionId: s.id }))
  );
  const criticalGaps = allCards
    .filter((c) => c.card.state === 'critical-gap')
    .sort((a, b) => sectionRank(a.sectionId) - sectionRank(b.sectionId));
  const top3 = criticalGaps.slice(0, 3).map((c) => c.card.label);
  const risks = top3.length > 0 ? top3.join(', ') : 'no critical risks were evidenced';
  const text = `${result.verifiedCount} of ${result.applicableCount} applicable capabilities are directly verified in the current project. ${result.inferredCount} are inferred from indirect evidence, ${result.unknownCount} need runtime or deployment evidence, and ${result.criticalGapCount} critical risks are evidenced. Highest-priority risks: ${risks}.`;
  return {
    text,
    label: result.verdict,
    score: result.score
  };
}

/** Direct verification is informational, never a pass/fail risk score. */
function verificationColor(): string {
  return '#60A5FA';
}

// ---------------------------------------------------------------------------
// Graph layout
// ---------------------------------------------------------------------------

const CARD_GAP_X = 200;
const SECTION_GAP_Y = 180;

/** Dependency connections between cards, by card id. */
const CARD_EDGES: Array<[string, string]> = [
  ['cdn', 'load-balancer'],
  ['load-balancer', 'api-gateway'],
  ['api-gateway', 'auth-service'],
  ['auth-service', 'database'],
  ['rate-limiting', 'api-gateway'],
  ['waf', 'cdn'],
  ['input-validation', 'auth-service'],
  ['secrets-management', 'auth-service'],
  ['structured-logging', 'error-tracking'],
  ['error-tracking', 'alerting-rules'],
  ['health-checks', 'auto-scaling'],
  ['database', 'read-replicas'],
  ['read-replicas', 'database-sharding'],
  ['cicd-pipeline', 'blue-green'],
  ['blue-green', 'canary-releases'],
  ['encryption-at-rest', 'database'],
  ['mtls', 'service-mesh'],
];

/** Lucide icon for a card, looked up from the catalog. */
function iconFor(cardId: string): LucideIcon | null {
  for (const s of ENTERPRISE_SECTIONS) {
    const c = s.cards.find((card) => card.id === cardId);
    if (c) return c.icon;
  }
  return null;
}

// Static lookups built once from the catalog (it never changes at runtime).
const CARD_DEF_BY_ID = new Map<string, CardDef>();
const CARD_COLOR_BY_ID = new Map<string, string>();
const SECTION_OF_CARD = new Map<string, { id: string; title: string; color: string }>();
for (const s of ENTERPRISE_SECTIONS) {
  for (const c of s.cards) {
    CARD_DEF_BY_ID.set(c.id, c);
    CARD_COLOR_BY_ID.set(c.id, s.color);
    SECTION_OF_CARD.set(c.id, { id: s.id, title: s.title, color: s.color });
  }
}

/**
 * Re-resolve a card's state against the latest context (findings). Used to patch
 * node data in place when the Agent Team runs — never to rebuild node positions.
 */
function reEvaluateCard(card: EnterpriseCard, ctx: DetectCtx): EnterpriseCard {
  const def = CARD_DEF_BY_ID.get(card.id);
  if (!def) return card;
  return { ...card, ...evaluateCard(def, ctx) };
}

/** Section priority for the Master Action Plan (lower = surfaced first). */
const SECTION_PRIORITY: Record<string, number> = {
  'api-security': 0,
  'security-hardening': 1,
  resilience: 2,
  observability: 3,
};
const sectionRank = (sectionId: string): number => SECTION_PRIORITY[sectionId] ?? 5;

/** Config-file markers that are NOT installable npm packages. */
const PATH_MARKERS = new Set([
  '.github/workflows', '.gitlab-ci.yml', 'jenkinsfile', '.circleci', '.snyk', 'dependabot.yml', 'trivy',
]);

/** First installable npm package that proves a card, or null. */
function npmPackageFor(cardId: string): string | null {
  const def = CARD_DEF_BY_ID.get(cardId);
  return def?.packages?.find((p) => !p.startsWith('.') && !PATH_MARKERS.has(p.toLowerCase())) ?? null;
}

interface CardNodeData {
  card: EnterpriseCard;
  color: string;
  icon: LucideIcon | null;
  showAgentNudge: boolean;
  onRunAgentTeam: () => void;
}

interface LabelNodeData {
  title: string;
  color: string;
}

/** A floating, non-interactive section label above each band. */
function SectionLabelNode({ data }: NodeProps<LabelNodeData>) {
  return (
    <div className="ea-flow-section-label" style={{ color: data.color }}>
      {data.title}
    </div>
  );
}

/** A capability card node. */
function AuditCardNode({ data }: NodeProps<CardNodeData>) {
  const { card, color, icon: Icon, showAgentNudge, onRunAgentTeam } = data;
  return (
    <div className={`ea-flow-card ea-flow-${card.state}`} style={{ ['--glow' as string]: color }}>
      <Handle type="target" position={Position.Left} className="ea-flow-handle" />
      <Handle type="target" position={Position.Top} className="ea-flow-handle" />
      <div className="ea-flow-card-icon">{Icon && <Icon size={28} strokeWidth={1.75} />}</div>
      <div className="ea-flow-card-label">{card.label}</div>
      {BADGE[card.state] && (
        <span className={`ea-flow-badge ea-badge-${card.state}`}>{BADGE[card.state]}</span>
      )}
      {showAgentNudge && (
        <button
          className="ea-flow-agent-pill"
          onClick={(e) => {
            e.stopPropagation();
            onRunAgentTeam();
          }}
        >
          ⚡ Run Agent Team
        </button>
      )}
      <Handle type="source" position={Position.Right} className="ea-flow-handle" />
      <Handle type="source" position={Position.Bottom} className="ea-flow-handle" />
    </div>
  );
}

const NODE_TYPES = { auditCard: AuditCardNode, sectionLabel: SectionLabelNode };

// ---------------------------------------------------------------------------
// Score header + detail panel
// ---------------------------------------------------------------------------

const SMALL_RING_R = 24;
const SMALL_RING_C = 2 * Math.PI * SMALL_RING_R;

function DetailPanel({
  card,
  color,
  neighbors,
  showAgentNudge,
  onClose,
  onRunAgentTeam,
}: {
  card: EnterpriseCard;
  color: string;
  neighbors: string[];
  showAgentNudge: boolean;
  onClose: () => void;
  onRunAgentTeam: () => void;
}) {
  return (
    <aside className="ea-detail-panel" style={{ ['--glow' as string]: color }}>
      <div className="ea-detail-head">
        <span className="ea-detail-title">{card.label}</span>
        <span className={`ea-detail-state ea-badge-${card.state}`}>{STATE_LABEL[card.state]}</span>
        <button className="ea-detail-close" onClick={onClose} aria-label="Close">✕</button>
      </div>
      <div className="ea-detail-body">
        <h5 className="ea-detail-label">What it is</h5>
        <p className="ea-detail-text">{card.what}</p>
        <h5 className="ea-detail-label">Why it matters at enterprise scale</h5>
        <p className="ea-detail-text">{card.why}</p>
        <h5 className="ea-detail-label">What ArchLab found</h5>
        <p className="ea-detail-text">{card.detail}</p>
        {card.evidence.length > 0 && (
          <>
            <h5 className="ea-detail-label">Evidence</h5>
            <ul className="ea-detail-neighbors">
              {card.evidence.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </>
        )}
        <h5 className="ea-detail-label">Assessment confidence</h5>
        <p className="ea-detail-text">{Math.round(card.confidence * 100)}%</p>
        {neighbors.length > 0 && (
          <>
            <h5 className="ea-detail-label">Connected capabilities</h5>
            <ul className="ea-detail-neighbors">
              {neighbors.map((n) => <li key={n}>{n}</li>)}
            </ul>
          </>
        )}
        {showAgentNudge && (
          <button className="ea-detail-agent-btn" onClick={onRunAgentTeam}>
            ⚡ Run Agent Team for AI-backed analysis
          </button>
        )}
        <div className="ea-detail-fix">
          <CopyPromptButton prompt={card.fixPrompt} label="Copy fix prompt" />
        </div>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Export (print to PDF)
// ---------------------------------------------------------------------------

function exportReport(result: EnterpriseAuditResult) {
  const win = window.open('', '_blank');
  if (!win) return;
  const sectionHtml = result.sections
    .map((s) => {
      const cards = s.cards
        .map(
          (c) => `
            <li class="row state-${c.state}">
              <span class="dot" style="background:${s.color}"></span>
              <div>
                <div class="row-head"><strong>${c.label}</strong> <em>${STATE_LABEL[c.state]}</em></div>
                <div class="row-body"><b>What:</b> ${c.what}</div>
                <div class="row-body"><b>Why:</b> ${c.why}</div>
                <div class="row-body"><b>Found:</b> ${c.detail}</div>
                ${c.evidence.length ? `<div class="row-body"><b>Evidence:</b> ${c.evidence.join(' · ')}</div>` : ''}
                <div class="row-fix"><b>Fix:</b> ${c.fixPrompt}</div>
              </div>
            </li>`,
        )
        .join('');
      return `
        <section class="sec">
          <h2 style="color:${s.color}">${s.title} <span class="sec-score">Direct verification</span></h2>
          <ul class="rows">${cards}</ul>
        </section>`;
    })
    .join('');

  win.document.write(`
    <html>
      <head>
        <title>ArchLab Enterprise Audit</title>
        <style>
          body { background:#080810; color:#f4f4ff; font-family:'Inter',system-ui,sans-serif; padding:40px; }
          h1 { font-size:28px; margin:0 0 4px; }
          .score { font-size:48px; font-weight:800; color:${verificationColor()}; }
          .verdict { font-size:18px; color:#c4c4d4; margin-bottom:28px; }
          .sec { break-inside:avoid; margin-bottom:28px; border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:20px; background:#10101c; }
          .sec h2 { font-size:18px; margin:0 0 14px; display:flex; justify-content:space-between; }
          .sec-score { color:#9aa; font-weight:600; }
          .rows { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:12px; }
          .row { display:flex; gap:10px; break-inside:avoid; }
          .dot { width:10px; height:10px; border-radius:50%; margin-top:5px; flex-shrink:0; }
          .row-head em { color:#8a8; font-style:normal; font-size:12px; }
          .state-critical-gap .row-head em { color:#f66; }
          .state-gap .row-head em { color:#fb3; }
          .state-unknown .row-head em { color:#9aa; }
          .state-not-applicable .row-head em { color:#778; }
          .row-body, .row-fix { font-size:13px; color:#bcbccc; margin-top:3px; }
          .row-fix { color:#9cf; }
        </style>
      </head>
      <body>
        <h1>ArchLab Enterprise Audit</h1>
        <div class="score">${result.verifiedCount} / ${result.applicableCount} verified controls</div>
        <div class="verdict">${result.verifiedCount} verified · ${result.inferredCount} inferred · ${result.unknownCount} unknown · ${result.notApplicableCount} not applicable · ${result.gapCount} gaps · ${result.criticalGapCount} critical gaps across ${result.applicableCount} applicable capabilities.</div>
        ${sectionHtml}
        <script>window.onload=function(){window.print();window.close();}</script>
      </body>
    </html>
  `);
  win.document.close();
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function EnterpriseAudit({
  infra,
  findings,
  dependencies = [],
  hasProject = true,
  hasApiKey = false,
  onRunAgentTeam,
  onAddApiKey,
}: EnterpriseAuditProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Detection context — the only thing that should change when findings update.
  const context = useMemo(
    () => buildContext(infra, findings, dependencies),
    [infra, findings, dependencies],
  );

  // Full evaluated result for the score header, detail panel, and action plan.
  const result = useMemo(
    () => computeAudit(infra, findings, dependencies),
    [infra, findings, dependencies],
  );

  // Production-ready score from ONLY what is actually evaluable right now:
  // verified out of (verified + inferred). The "unknown" controls need runtime/
  // deployment evidence we don't have, so excluding them avoids understating
  // readiness with things that simply can't be checked statically yet.
  const evaluableCount = result.verifiedCount + result.inferredCount;
  const productionReady =
    evaluableCount > 0 ? Math.round((result.verifiedCount / evaluableCount) * 100) : 0;

  // Agent-sourced findings carry an agentId; absence means no AI analysis yet.
  const hasAgentFindings = useMemo(() => findings.some((f) => Boolean(f.agentId)), [findings]);

  // App-wide confidence signal: the Agent Team has run (and when).
  const { agentTeamHasRun, lastAgentRunAt } = useApiKeyContext();
  const aiEnhanced = agentTeamHasRun || hasAgentFindings;

  const closePanel = useCallback(() => setSelectedId(null), []);
  const runAgentTeam = useCallback(() => {
    setSelectedId(null);
    onRunAgentTeam?.();
  }, [onRunAgentTeam]);

  /** Whether a card should show the "Run Agent Team" nudge. */
  const showNudgeFor = useCallback(
    (state: EnterpriseCardState) => (state === 'critical-gap' || state === 'gap') && (!hasApiKey || !hasAgentFindings),
    [hasApiKey, hasAgentFindings],
  );

  // Build node/edge layout ONCE per project (infra + dependencies). Card states
  // here are seeded from a findings-free context; the effect below patches them
  // in place when findings arrive, so positions never reset (no blank canvas).
  const initialNodes = useMemo<Node[]>(() => {
    const base = buildContext(infra, [], dependencies);
    const out: Node[] = [];
    ENTERPRISE_SECTIONS.forEach((section, sIdx) => {
      const bandY = sIdx * SECTION_GAP_Y;
      out.push({
        id: `section-${section.id}`,
        type: 'sectionLabel',
        position: { x: 0, y: bandY },
        data: { title: section.title, color: section.color },
        draggable: false,
        selectable: false,
        connectable: false,
      });
      section.cards.forEach((def, cIdx) => {
        const assessment = evaluateCard(def, base);
        const card: EnterpriseCard = {
          id: def.id, label: def.label, what: def.what, why: def.why, fixPrompt: def.fix, ...assessment,
        };
        out.push({
          id: def.id,
          type: 'auditCard',
          position: { x: cIdx * CARD_GAP_X, y: bandY + 46 },
          data: {
            card,
            color: section.color,
            icon: iconFor(def.id),
            showAgentNudge: showNudgeFor(assessment.state),
            onRunAgentTeam: runAgentTeam,
          } satisfies CardNodeData,
          draggable: false,
        });
      });
    });
    return out;
    // showNudgeFor/runAgentTeam intentionally excluded — the effect below keeps
    // them current without rebuilding (and resetting) the layout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [infra, dependencies]);

  const initialEdges = useMemo<Edge[]>(() => {
    const base = buildContext(infra, [], dependencies);
    const stateOf = (id: string) => {
      const def = CARD_DEF_BY_ID.get(id);
      return def ? evaluateCard(def, base).state : 'missing';
    };
    return CARD_EDGES.filter(([s, t]) => CARD_DEF_BY_ID.has(s) && CARD_DEF_BY_ID.has(t)).map(
      ([source, target]) => {
        const isCritical = stateOf(source) === 'critical-gap';
        return {
          id: `${source}->${target}`,
          source,
          target,
          type: 'smoothstep',
          animated: isCritical,
          style: { stroke: `${CARD_COLOR_BY_ID.get(source) ?? '#888'}66`, strokeWidth: 2 },
          className: isCritical ? 'ea-edge-critical' : undefined,
        } satisfies Edge;
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [infra, dependencies]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Reset layout only when the project (infra/dependencies) changes.
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Findings changed: patch ONLY the data of existing card nodes (and edge
  // criticality). Positions are never touched, so the canvas never blanks.
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.type !== 'auditCard') return n;
        const data = n.data as CardNodeData;
        const card = reEvaluateCard(data.card, context);
        return {
          ...n,
          data: { ...data, card, showAgentNudge: showNudgeFor(card.state), onRunAgentTeam: runAgentTeam },
        };
      }),
    );
    setEdges((eds) =>
      eds.map((e) => {
        const def = CARD_DEF_BY_ID.get(e.source);
        const isCritical = def ? evaluateCard(def, context).state === 'critical-gap' : false;
        return { ...e, animated: isCritical, className: isCritical ? 'ea-edge-critical' : undefined };
      }),
    );
  }, [context, showNudgeFor, runAgentTeam, setNodes, setEdges]);

  // Selected card + connected neighbors for the detail panel.
  const selected = useMemo(() => {
    if (!selectedId) return null;
    const node = nodes.find((n) => n.id === selectedId);
    const data = node?.data as CardNodeData | undefined;
    return data ? { card: data.card, color: data.color } : null;
  }, [selectedId, nodes]);

  const neighbors = useMemo(() => {
    if (!selectedId) return [];
    const ids = new Set<string>();
    for (const [s, t] of CARD_EDGES) {
      if (s === selectedId) ids.add(t);
      if (t === selectedId) ids.add(s);
    }
    return [...ids].map((id) => CARD_DEF_BY_ID.get(id)?.label ?? id);
  }, [selectedId]);

  if (!hasProject) {
    return (
      <div className="ea-placeholder">
        <p>Analyze a project to run the Enterprise Audit.</p>
      </div>
    );
  }

  return (
    <div className="ea-flow-root">
      {!hasApiKey && (
        <div className="ea-apikey-banner">
          <span>⚡ Connect an API key to run Agent Team and get AI-backed analysis for critical gaps.</span>
          <button className="ea-apikey-btn" onClick={() => onAddApiKey?.()}>Add API Key</button>
        </div>
      )}

      <div className="ea-flow-canvas">
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={NODE_TYPES}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.2}
            maxZoom={1.5}
            proOptions={{ hideAttribution: true }}
            nodesConnectable={false}
            onNodeClick={(_e, node) => {
              if (node.type === 'auditCard') setSelectedId(node.id);
            }}
            onPaneClick={closePanel}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="rgba(255,255,255,0.05)" />
            <Controls showInteractive={false} />
          </ReactFlow>
        </ReactFlowProvider>

        {selected ? (
          <DetailPanel
            card={selected.card}
            color={selected.color}
            neighbors={neighbors}
            showAgentNudge={showNudgeFor(selected.card.state)}
            onClose={closePanel}
            onRunAgentTeam={runAgentTeam}
          />
        ) : (
          <aside className="ea-detail-panel" style={{ ['--glow' as string]: '#6366f1' }}>
            <div className="ea-detail-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="ea-mini-ring" style={{ ['--ring-color' as string]: verificationColor(), opacity: aiEnhanced ? 1 : 0.7, margin: 0, width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 56 56" width="38" height="38" style={{ display: 'block', transform: 'rotate(-90deg)' }}>
                    <circle cx="28" cy="28" r={SMALL_RING_R} className="ea-ring-track" />
                    <circle
                      cx="28"
                      cy="28"
                      r={SMALL_RING_R}
                      className="ea-ring-progress"
                      stroke={verificationColor()}
                      strokeDasharray={SMALL_RING_C}
                      strokeDashoffset={SMALL_RING_C * (1 - result.score / 100)}
                    />
                  </svg>
                  <span className="ea-mini-ring-score" style={{ color: verificationColor(), fontSize: '8px', fontWeight: 'bold' }}>{result.verifiedCount}/{result.applicableCount}</span>
                </div>
                <div>
                  <span className="ea-detail-title" style={{ display: 'block', fontSize: '13px', lineHeight: '1.2', marginBottom: '2px' }}>Verified Controls</span>
                  <span className="ea-detail-state" style={{ background: verificationColor(), color: '#09090b', fontWeight: 'bold', fontSize: '8px', padding: '1px 5px', borderRadius: '4px' }}>
                    {result.verdict}
                  </span>
                  <span
                    title={`Of the ${evaluableCount} controls evaluable right now (${result.verifiedCount} verified + ${result.inferredCount} inferred), ${productionReady}% are verified. Excludes ${result.unknownCount} that need runtime/deployment evidence.`}
                    style={{ display: 'block', fontSize: '9px', color: '#94a3b8', marginTop: '3px', whiteSpace: 'nowrap' }}
                  >
                    Production ready:{' '}
                    <strong style={{ color: productionReady >= 70 ? '#34d399' : productionReady >= 40 ? '#fbbf24' : '#f87171' }}>
                      {productionReady}%
                    </strong>{' '}
                    of evaluable
                  </span>
                  {aiEnhanced && lastAgentRunAt && (
                    <div style={{ fontSize: '8px', color: '#64748b', marginTop: '2px', whiteSpace: 'nowrap' }}>
                      AI Run: {formatRunTimestamp(lastAgentRunAt)}
                    </div>
                  )}
                </div>
              </div>
              <button className="ea-export-btn ea-export-compact" style={{ margin: 0, padding: '4px 8px', fontSize: '10px', height: '24px' }} onClick={() => exportReport(result)}>📥 Export</button>
            </div>
            <div className="ea-detail-body" style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
              {infra.projectContext?.fromReadme && (
                <div style={{ background: '#09090b', border: '1px solid #1a1a2e', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px', fontSize: '11px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 'bold', color: '#f8fafc' }}>{infra.projectContext.name}</span>
                    <span style={{ fontSize: '9px', color: '#64748b' }}>📖 Read from README</span>
                  </div>
                  {infra.projectContext.purpose && (
                    <p style={{ margin: 0, color: '#94a3b8', lineHeight: '1.4' }}>{infra.projectContext.purpose}</p>
                  )}
                </div>
              )}
              <MasterActionPlan result={result} purpose={infra.projectContext?.purpose ?? ''} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Master Action Plan
// ---------------------------------------------------------------------------

interface PlanCard {
  card: EnterpriseCard;
  section: { id: string; title: string; color: string };
}

function MasterActionPlan({ result, purpose }: { result: EnterpriseAuditResult; purpose: string }) {
  const allCards: PlanCard[] = useMemo(
    () =>
      result.sections.flatMap((s) =>
        s.cards.map((card) => ({ card, section: { id: s.id, title: s.title, color: s.color } })),
      ),
    [result],
  );

  const criticalGaps = useMemo(
    () =>
      allCards
        .filter((c) => c.card.state === 'critical-gap')
        .sort((a, b) => sectionRank(a.section.id) - sectionRank(b.section.id)),
    [allCards],
  );

  const top5 = useMemo(
    () => [...criticalGaps, ...allCards.filter((c) => c.card.state === 'gap')].slice(0, 5),
    [allCards, criticalGaps],
  );

  const quickWins = useMemo(
    () =>
      allCards
        .filter(
          (c) =>
            c.card.state === 'gap' &&
            (c.section.id === 'deployment-scale' || c.section.id === 'observability') &&
            npmPackageFor(c.card.id),
        )
        .slice(0, 6),
    [allCards],
  );

  const names = (state: EnterpriseCardState) =>
    allCards.filter((c) => c.card.state === state).map((c) => c.card.label);

  const evidenceList = (state: EnterpriseCardState) => {
    const cards = allCards.filter((c) => c.card.state === state);
    if (cards.length === 0) return 'none';
    return cards
      .map(({ card }) => `${card.label} [${card.evidence.join('; ') || 'no source reference'}]`)
      .join(', ');
  };

  const verdict = useMemo(() => {
    const confirmed = result.verifiedCount;
    const crit = result.criticalGapCount;
    const top3 = criticalGaps.slice(0, 3).map((c) => c.card.label);
    const risks = top3.length > 0 ? top3.join(', ') : 'no critical risks were evidenced';
    return `${confirmed} of ${result.applicableCount} applicable capabilities are directly verified. ${result.inferredCount} are inferred, ${result.unknownCount} require runtime or deployment evidence, and ${crit} ${crit === 1 ? 'critical risk is' : 'critical risks are'} evidenced. Highest-priority risks: ${risks}.`;
  }, [result, criticalGaps]);

  const aiPrompt = useMemo(() => {
    const list = (arr: string[]) => (arr.length ? arr.join(', ') : 'none');
    return [
      'You are a senior software architect. I have run an enterprise audit on my project and got these results:',
      `Directly verified controls: ${result.verifiedCount} of ${result.applicableCount} applicable controls. ${result.inferredCount} controls are inferred and ${result.unknownCount} are unknown.`,
      `Evidence-backed critical risks: ${evidenceList('critical-gap')}.`,
      `Evidence-backed gaps: ${evidenceList('gap')}.`,
      `Unknown capabilities requiring runtime, deployment, or process evidence: ${list(names('unknown'))}.`,
      `Verified capabilities with source evidence: ${evidenceList('verified')}.`,
      `Project context: ${purpose || 'not provided'}.`,
      'Give me a prioritized action plan only for evidence-backed critical risks and gaps. Do not recommend controls marked not applicable or unknown without stating what evidence is needed first.',
    ].join(' ');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, purpose]);

  return (
    <div className="ea-plan">
      <section className="ea-plan-section">
        <h4 className="ea-plan-label">Evidence Summary</h4>
        <p className="ea-plan-verdict">{verdict}</p>
      </section>

      <section className="ea-plan-section">
        <h4 className="ea-plan-label">Top Evidence-Backed Actions</h4>
        {top5.length === 0 ? (
          <p className="ea-plan-empty">No evidence-backed gaps yet. Run the relevant runtime, deployment, or security checks to increase confidence.</p>
        ) : (
          <ul className="ea-plan-actions">
            {top5.map(({ card, section }) => (
              <li key={card.id} className="ea-plan-action">
                <div className="ea-plan-action-head">
                  <span className="ea-plan-action-name">{card.label}</span>
                  <span className="ea-plan-action-badge" style={{ color: section.color, borderColor: section.color }}>
                    {section.title}
                  </span>
                </div>
                <p className="ea-plan-action-why">{card.why}</p>
                <CopyPromptButton compact prompt={card.fixPrompt} label="Copy Fix Prompt" />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="ea-plan-section">
        <h4 className="ea-plan-label">Quick Wins</h4>
        {quickWins.length === 0 ? (
          <p className="ea-plan-empty">No one-install quick wins detected.</p>
        ) : (
          <ul className="ea-plan-wins">
            {quickWins.map(({ card }) => {
              const pkg = npmPackageFor(card.id)!;
              return (
                <li key={card.id} className="ea-plan-win">
                  <span className="ea-plan-win-check">☐</span>
                  <span className="ea-plan-win-name">{card.label}</span>
                  <code className="ea-plan-win-pkg">npm install {pkg}</code>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="ea-plan-section">
        <div className="ea-plan-ai-head">
          <h4 className="ea-plan-label">AI Boost Prompt</h4>
          <CopyPromptButton compact prompt={aiPrompt} label="Copy" />
        </div>
        <textarea className="ea-plan-ai-text" readOnly value={aiPrompt} rows={8} />
      </section>
    </div>
  );
}
