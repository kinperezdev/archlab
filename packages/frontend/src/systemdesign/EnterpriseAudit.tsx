/**
 * Enterprise Audit mode — a ReactFlow capability map.
 *
 * Every capability is a card node, grouped into 8 horizontal section bands and
 * wired together by dependency edges. Each card reads the real detected infra
 * (`infra`), package.json dependencies, README-stated tech, and pipeline
 * findings and resolves to one of four states (detected / partial / missing /
 * critical-gap). A compact score header sits above the canvas, and a slide-in
 * detail panel opens on card click.
 *
 * Detection logic only reads the props passed in — it never touches the backend.
 */

import { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
  ReactFlowProvider,
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

const STATE_POINTS: Record<EnterpriseCardState, number> = {
  detected: 1,
  partial: 0.5,
  missing: 0,
  'critical-gap': -0.5,
};

const STATE_LABEL: Record<EnterpriseCardState, string> = {
  detected: 'Detected',
  partial: 'Partial',
  missing: 'Missing',
  'critical-gap': 'Critical Gap',
};

const BADGE: Record<EnterpriseCardState, string> = {
  detected: '✓',
  partial: '–',
  missing: '',
  'critical-gap': '✕',
};

const HIGH_SEVERITIES: Severity[] = ['critical', 'high'];
const MED_SEVERITIES: Severity[] = ['bottleneck', 'medium'];

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

interface DetectCtx {
  nodeTypes: Set<InfraNodeType>;
  /** Lowercased searchable text built from the detected infra (project evidence). */
  corpus: string;
  /** Lowercased package.json dependency names + CI/scan config markers. */
  deps: Set<string>;
  /** Lowercased technologies named explicitly in the README. */
  readme: Set<string>;
  findings: Diagnostic[];
}

/** Build the detection context once from infra + findings + dependencies. */
function buildContext(infra: SystemDesignMap, findings: Diagnostic[], dependencies: string[]): DetectCtx {
  const nodeTypes = new Set<InfraNodeType>(infra.nodes.map((n) => n.type));
  const parts: string[] = [];
  for (const n of infra.nodes) {
    parts.push(n.type, n.label);
    for (const ev of n.evidence) {
      parts.push(ev.pattern);
      if (ev.snippet) parts.push(ev.snippet);
      parts.push(ev.file);
    }
  }
  const deps = new Set(dependencies.map((d) => d.toLowerCase()));
  const readme = new Set((infra.projectContext?.technologies ?? []).map((t) => t.toLowerCase()));
  return { nodeTypes, corpus: parts.join(' \n ').toLowerCase(), deps, readme, findings };
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
  const hay = `${f.title} ${f.what} ${f.why} ${f.howToFix}`.toLowerCase();
  return keywords.some((k) => hay.includes(k));
}

/** Resolve one card's live state and the human-readable detail line. */
function evaluateCard(def: CardDef, ctx: DetectCtx): { state: EnterpriseCardState; detail: string } {
  // 1. Negative signal: its very presence is the risk (anti-pattern in code).
  if (def.negativeKeywords?.some((k) => wordHit(k, ctx.corpus))) {
    return {
      state: 'critical-gap',
      detail: 'A risky anti-pattern was found in the code — this must be remediated, not relied on.',
    };
  }

  // 2. Direct infrastructure detection — strongest signal.
  if (def.nodeTypes?.some((t) => ctx.nodeTypes.has(t))) {
    return { state: 'detected', detail: 'ArchLab detected this directly in the project infrastructure.' };
  }

  // 3. Confirmed dependency / config-file proof — high confidence.
  const dep = dependencyProof(def, ctx);
  if (dep) {
    return { state: 'detected', detail: `Confirmed by a project dependency/config: ${dep}.` };
  }

  // 3b. Explicit README mention — equal confidence to a dependency.
  const readme = readmeProof(def, ctx);
  if (readme) {
    return { state: 'detected', detail: `Named in the project README: ${readme}.` };
  }

  // Findings scan (scoped to security-checks step when requested).
  const pool = def.securityStep
    ? ctx.findings.filter((f) => f.step === 'security-checks')
    : ctx.findings;
  const matched = def.keywords ? pool.filter((f) => findingMatches(f, def.keywords!)) : [];
  const hasHigh = matched.some((f) => HIGH_SEVERITIES.includes(f.severity));
  const hasMed = matched.some((f) => MED_SEVERITIES.includes(f.severity));

  // 4a. Safety-critical capabilities: corpus keywords can never promote these.
  if (def.criticalIfMissing) {
    if (hasHigh) {
      const f = matched.find((m) => HIGH_SEVERITIES.includes(m.severity))!;
      return { state: 'critical-gap', detail: `A ${f.severity} finding flags this as a gap: ${f.title}.` };
    }
    return {
      state: 'critical-gap',
      detail: 'Not proven by infrastructure or a dependency. Its absence is a security/reliability risk.',
    };
  }

  // 4b. Operational/process capabilities: not verifiable from static code.
  if (def.requiresProof) {
    if (hasHigh) {
      const f = matched.find((m) => HIGH_SEVERITIES.includes(m.severity))!;
      return { state: 'critical-gap', detail: `A ${f.severity} finding flags this as a gap: ${f.title}.` };
    }
    if (def.partialTypes?.some((t) => ctx.nodeTypes.has(t))) {
      return { state: 'partial', detail: 'Related infrastructure exists, but this capability is unproven.' };
    }
    return { state: 'missing', detail: 'Not proven by infrastructure or a dependency; requires verification.' };
  }

  // 5. Normal cards: require 2+ whole-word corpus hits for Detected.
  const hits = corpusKeywordHits(def.keywords, ctx.corpus);
  if (hits >= 2 && !hasHigh) {
    return { state: 'detected', detail: 'Multiple corroborating signals were found in the scanned code.' };
  }
  if (def.partialTypes?.some((t) => ctx.nodeTypes.has(t))) {
    return { state: 'partial', detail: 'Related infrastructure exists, but this capability looks incomplete.' };
  }
  if (hits === 1 && !hasHigh) {
    return { state: 'partial', detail: 'A single weak signal was found — partial at best, not confirmed.' };
  }

  // 6. Findings indicate the gap explicitly.
  if (hasHigh) {
    const f = matched.find((m) => HIGH_SEVERITIES.includes(m.severity))!;
    return { state: 'critical-gap', detail: `A ${f.severity} finding flags this as a gap: ${f.title}.` };
  }
  if (hasMed) {
    const f = matched.find((m) => MED_SEVERITIES.includes(m.severity))!;
    return { state: 'missing', detail: `A finding notes room to improve here: ${f.title}.` };
  }
  return { state: 'missing', detail: 'Not detected in this project.' };
}

/** Average score (0-100) for a list of card states. */
function scoreOf(cards: EnterpriseCard[]): number {
  if (cards.length === 0) return 0;
  const sum = cards.reduce((acc, c) => acc + STATE_POINTS[c.state], 0);
  return Math.max(0, Math.round((sum / cards.length) * 100));
}

/** Compute the full audit result from infra + findings + dependencies. */
function computeAudit(infra: SystemDesignMap, findings: Diagnostic[], dependencies: string[]): EnterpriseAuditResult {
  const ctx = buildContext(infra, findings, dependencies);
  const sections: EnterpriseSection[] = ENTERPRISE_SECTIONS.map((section: SectionDef) => {
    const cards: EnterpriseCard[] = section.cards.map((def) => {
      const { state, detail } = evaluateCard(def, ctx);
      return { id: def.id, label: def.label, state, what: def.what, why: def.why, detail, fixPrompt: def.fix };
    });
    return { id: section.id, title: section.title, color: section.color, cards, score: scoreOf(cards) };
  });

  const allCards = sections.flatMap((s) => s.cards);
  const count = (state: EnterpriseCardState) => allCards.filter((c) => c.state === state).length;
  const score = scoreOf(allCards);
  const verdict =
    score >= 80 ? 'Production Ready' : score >= 50 ? 'Needs Hardening' : 'Not Production Ready';

  return {
    sections,
    score,
    verdict,
    totalCards: allCards.length,
    detectedCount: count('detected'),
    partialCount: count('partial'),
    missingCount: count('missing'),
    criticalGapCount: count('critical-gap'),
  };
}

/** Color band the overall/section score falls into. */
function scoreColor(score: number): string {
  return score >= 80 ? '#22C55E' : score >= 50 ? '#F59E0B' : '#EF4444';
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

function ScoreHeader({
  result,
  hasApiKey,
  onExport,
}: {
  result: EnterpriseAuditResult;
  hasApiKey: boolean;
  onExport: () => void;
}) {
  const color = scoreColor(result.score);
  const offset = SMALL_RING_C * (1 - result.score / 100);
  return (
    <div className="ea-score-header">
      <div className="ea-mini-ring" style={{ ['--ring-color' as string]: color }}>
        <svg viewBox="0 0 56 56" width="56" height="56">
          <circle cx="28" cy="28" r={SMALL_RING_R} className="ea-ring-track" />
          <circle
            cx="28"
            cy="28"
            r={SMALL_RING_R}
            className="ea-ring-progress"
            stroke={color}
            strokeDasharray={SMALL_RING_C}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="ea-mini-ring-score" style={{ color }}>{result.score}%</span>
      </div>
      <div className="ea-score-header-text">
        <div className="ea-score-header-verdict" style={{ color }}>
          {result.verdict}
          {!hasApiKey && (
            <span className="ea-score-header-note">Static analysis only · Add API key for AI insights</span>
          )}
        </div>
        <div className="ea-score-header-dots">
          {result.sections.map((s) => (
            <span key={s.id} className="ea-dot" style={{ background: s.color }} title={`${s.title}: ${s.score}%`} />
          ))}
        </div>
      </div>
      <button className="ea-export-btn ea-export-compact" onClick={onExport}>📥 Export</button>
    </div>
  );
}

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
                <div class="row-fix"><b>Fix:</b> ${c.fixPrompt}</div>
              </div>
            </li>`,
        )
        .join('');
      return `
        <section class="sec">
          <h2 style="color:${s.color}">${s.title} <span class="sec-score">${s.score}%</span></h2>
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
          .score { font-size:48px; font-weight:800; color:${scoreColor(result.score)}; }
          .verdict { font-size:18px; color:#c4c4d4; margin-bottom:28px; }
          .sec { break-inside:avoid; margin-bottom:28px; border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:20px; background:#10101c; }
          .sec h2 { font-size:18px; margin:0 0 14px; display:flex; justify-content:space-between; }
          .sec-score { color:#9aa; font-weight:600; }
          .rows { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:12px; }
          .row { display:flex; gap:10px; break-inside:avoid; }
          .dot { width:10px; height:10px; border-radius:50%; margin-top:5px; flex-shrink:0; }
          .row-head em { color:#8a8; font-style:normal; font-size:12px; }
          .state-critical-gap .row-head em { color:#f66; }
          .state-missing .row-head em { color:#caa; }
          .state-partial .row-head em { color:#fb3; }
          .row-body, .row-fix { font-size:13px; color:#bcbccc; margin-top:3px; }
          .row-fix { color:#9cf; }
        </style>
      </head>
      <body>
        <h1>ArchLab Enterprise Audit</h1>
        <div class="score">${result.score}% — ${result.verdict}</div>
        <div class="verdict">${result.detectedCount} detected · ${result.partialCount} partial · ${result.missingCount} missing · ${result.criticalGapCount} critical gaps across ${result.totalCards} capabilities.</div>
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

  const result = useMemo(
    () => computeAudit(infra, findings, dependencies),
    [infra, findings, dependencies],
  );

  // Agent-sourced findings carry an agentId; absence means no AI analysis yet.
  const hasAgentFindings = useMemo(() => findings.some((f) => Boolean(f.agentId)), [findings]);

  // Lookup: card id → { card, color }.
  const cardMap = useMemo(() => {
    const m = new Map<string, { card: EnterpriseCard; color: string }>();
    for (const s of result.sections) {
      for (const c of s.cards) m.set(c.id, { card: c, color: s.color });
    }
    return m;
  }, [result]);

  const closePanel = useCallback(() => setSelectedId(null), []);
  const runAgentTeam = useCallback(() => {
    setSelectedId(null);
    onRunAgentTeam?.();
  }, [onRunAgentTeam]);

  /** Whether a card should show the "Run Agent Team" nudge. */
  const showNudgeFor = useCallback(
    (state: EnterpriseCardState) =>
      state === 'critical-gap' && (!hasApiKey || !hasAgentFindings),
    [hasApiKey, hasAgentFindings],
  );

  const nodes: Node[] = useMemo(() => {
    const out: Node[] = [];
    result.sections.forEach((section, sIdx) => {
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
      section.cards.forEach((card, cIdx) => {
        out.push({
          id: card.id,
          type: 'auditCard',
          position: { x: cIdx * CARD_GAP_X, y: bandY + 46 },
          data: {
            card,
            color: section.color,
            icon: iconFor(card.id),
            showAgentNudge: showNudgeFor(card.state),
            onRunAgentTeam: runAgentTeam,
          } satisfies CardNodeData,
          draggable: false,
        });
      });
    });
    return out;
  }, [result, showNudgeFor, runAgentTeam]);

  const edges: Edge[] = useMemo(() => {
    return CARD_EDGES.filter(([s, t]) => cardMap.has(s) && cardMap.has(t)).map(([source, target]) => {
      const src = cardMap.get(source)!;
      const isCritical = src.card.state === 'critical-gap';
      return {
        id: `${source}->${target}`,
        source,
        target,
        type: 'smoothstep',
        animated: isCritical,
        style: { stroke: `${src.color}66`, strokeWidth: 2 },
        className: isCritical ? 'ea-edge-critical' : undefined,
      } satisfies Edge;
    });
  }, [cardMap]);

  const selected = selectedId ? cardMap.get(selectedId) ?? null : null;
  const neighbors = useMemo(() => {
    if (!selectedId) return [];
    const ids = new Set<string>();
    for (const [s, t] of CARD_EDGES) {
      if (s === selectedId) ids.add(t);
      if (t === selectedId) ids.add(s);
    }
    return [...ids].map((id) => cardMap.get(id)?.card.label ?? id);
  }, [selectedId, cardMap]);

  if (!hasProject) {
    return (
      <div className="ea-placeholder">
        <p>Analyze a project to run the Enterprise Audit.</p>
      </div>
    );
  }

  return (
    <div className="ea-flow-root">
      <ScoreHeader result={result} hasApiKey={hasApiKey} onExport={() => exportReport(result)} />

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

        {selected && (
          <DetailPanel
            card={selected.card}
            color={selected.color}
            neighbors={neighbors}
            showAgentNudge={showNudgeFor(selected.card.state)}
            onClose={closePanel}
            onRunAgentTeam={runAgentTeam}
          />
        )}
      </div>
    </div>
  );
}
