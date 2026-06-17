/**
 * Enterprise Audit mode.
 *
 * A full-screen dark canvas of glowing capability cards grouped into 8 colored
 * category sections. Every card is live: it reads the real detected infrastructure
 * map (`infra`) and the pipeline findings (`findings`) and resolves to one of four
 * states (detected / partial / missing / critical-gap), then renders with the
 * matching glow, badge, and a rich hover tooltip carrying a copy-paste fix prompt.
 *
 * A score card at the top aggregates every card into an overall Enterprise Score
 * with a circular ring and per-section breakdown bars, and an export button prints
 * the whole audit (including tooltip detail) to PDF.
 *
 * Detection logic only reads the props passed in — it never touches the backend.
 */

import { useMemo } from 'react';
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
import { CopyPromptButton } from '../components/CopyPromptButton.js';
import { ENTERPRISE_SECTIONS, type CardDef, type SectionDef } from './enterpriseCatalog.js';

interface EnterpriseAuditProps {
  infra: SystemDesignMap;
  findings: Diagnostic[];
  /** package.json dependency names + CI/scan config markers (lowercased). */
  dependencies?: string[];
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

const HIGH_SEVERITIES: Severity[] = ['critical', 'high'];
const MED_SEVERITIES: Severity[] = ['bottleneck', 'medium'];

interface DetectCtx {
  nodeTypes: Set<InfraNodeType>;
  /** Lowercased searchable text built from the detected infra (project evidence). */
  corpus: string;
  /** Lowercased package.json dependency names + CI/scan config markers. */
  deps: Set<string>;
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
  return { nodeTypes, corpus: parts.join(' \n ').toLowerCase(), deps, findings };
}

/** Escape a keyword so it can be embedded literally in a RegExp. */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Whole-word keyword test. Word boundaries stop "scale" matching "scalability",
 * "rest" matching "restore", or "sse" matching "classes" — the substring bugs
 * the old `corpus.includes` caused.
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
  const hit = def.packages?.find((p) => ctx.deps.has(p.toLowerCase()));
  return hit ?? null;
}

/** Does a finding mention any of the keywords in its title or body text? */
function findingMatches(f: Diagnostic, keywords: string[]): boolean {
  const hay = `${f.title} ${f.what} ${f.why} ${f.howToFix}`.toLowerCase();
  return keywords.some((k) => hay.includes(k));
}

/**
 * Resolve one card's live state and the human-readable detail line.
 *
 * Precedence (high → low confidence):
 *  1. Negative signal (e.g. dangerouslySetInnerHTML) → forced Critical Gap.
 *  2. Structural infra node type → Detected.
 *  3. Confirmed package.json dependency / config marker → Detected.
 *  4. criticalIfMissing / requiresProof cards: corpus can NEVER promote them —
 *     they fall to their hard default (Critical Gap / Missing) unless 2–3 proved
 *     them, with findings able to flag a gap explicitly.
 *  5. Normal cards: 2+ whole-word corpus hits → Detected; 1 hit or related infra
 *     → Partial; findings → Critical Gap / Missing; otherwise Missing.
 */
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
  const proof = dependencyProof(def, ctx);
  if (proof) {
    return { state: 'detected', detail: `Confirmed by a project dependency/config: ${proof}.` };
  }

  // Findings scan (scoped to security-checks step when requested).
  const pool = def.securityStep
    ? ctx.findings.filter((f) => f.step === 'security-checks')
    : ctx.findings;
  const matched = def.keywords ? pool.filter((f) => findingMatches(f, def.keywords!)) : [];
  const hasHigh = matched.some((f) => HIGH_SEVERITIES.includes(f.severity));
  const hasMed = matched.some((f) => MED_SEVERITIES.includes(f.severity));

  // 4a. Safety-critical capabilities: corpus keywords can never mark these
  //     Detected/Partial. Without structural or dependency proof their absence
  //     is itself a Critical Gap (a HIGH finding gives a concrete reason).
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

  // 4b. Operational/process capabilities: not verifiable from static code, so
  //     corpus keywords cannot promote them. Default Missing until an Agent Team
  //     run or a real dependency proves otherwise.
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

/** Compute the full audit result from infra + findings. */
function computeAudit(infra: SystemDesignMap, findings: Diagnostic[], dependencies: string[]): EnterpriseAuditResult {
  const ctx = buildContext(infra, findings, dependencies);
  const sections: EnterpriseSection[] = ENTERPRISE_SECTIONS.map((section: SectionDef) => {
    const cards: EnterpriseCard[] = section.cards.map((def) => {
      const { state, detail } = evaluateCard(def, ctx);
      return {
        id: def.id,
        label: def.label,
        state,
        what: def.what,
        why: def.why,
        detail,
        fixPrompt: def.fix,
      };
    });
    return { id: section.id, title: section.title, color: section.color, cards, score: scoreOf(cards) };
  });

  const allCards = sections.flatMap((s) => s.cards);
  const count = (state: EnterpriseCardState) => allCards.filter((c) => c.state === state).length;
  const detectedCount = count('detected');
  const partialCount = count('partial');
  const missingCount = count('missing');
  const criticalGapCount = count('critical-gap');
  const score = scoreOf(allCards);
  const verdict =
    score >= 80 ? 'Production Ready' : score >= 50 ? 'Needs Hardening' : 'Not Production Ready';

  return {
    sections,
    score,
    verdict,
    totalCards: allCards.length,
    detectedCount,
    partialCount,
    missingCount,
    criticalGapCount,
  };
}

/** Color band the overall/section score falls into. */
function scoreColor(score: number): string {
  return score >= 80 ? '#22C55E' : score >= 50 ? '#F59E0B' : '#EF4444';
}

const RING_RADIUS = 70;
const RING_CIRC = 2 * Math.PI * RING_RADIUS;

const BADGE: Record<EnterpriseCardState, string> = {
  detected: '✓',
  partial: '–',
  missing: '',
  'critical-gap': '✕',
};

/** Look up the Lucide icon for a card from the catalog. */
function iconFor(sectionId: string, cardId: string) {
  const section = ENTERPRISE_SECTIONS.find((s) => s.id === sectionId);
  return section?.cards.find((c) => c.id === cardId)?.icon ?? null;
}

function ScoreRing({ score }: { score: number }) {
  const color = scoreColor(score);
  const offset = RING_CIRC * (1 - score / 100);
  return (
    <div className="ea-ring" style={{ ['--ring-color' as string]: color }}>
      <svg viewBox="0 0 160 160" width="160" height="160">
        <circle cx="80" cy="80" r={RING_RADIUS} className="ea-ring-track" />
        <circle
          cx="80"
          cy="80"
          r={RING_RADIUS}
          className="ea-ring-progress"
          stroke={color}
          strokeDasharray={RING_CIRC}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="ea-ring-center">
        <span className="ea-ring-score" style={{ color }}>{score}%</span>
        <span className="ea-ring-lbl">Enterprise Score</span>
      </div>
    </div>
  );
}

function Card({ sectionId, color, card }: { sectionId: string; color: string; card: EnterpriseCard }) {
  const Icon = iconFor(sectionId, card.id);
  return (
    <div
      className={`ea-card ea-state-${card.state}`}
      style={{ ['--glow' as string]: color }}
      tabIndex={0}
    >
      <div className="ea-card-icon">{Icon && <Icon size={26} strokeWidth={1.75} />}</div>
      <div className="ea-card-label">{card.label}</div>
      {BADGE[card.state] && (
        <span className={`ea-card-badge ea-badge-${card.state}`}>{BADGE[card.state]}</span>
      )}

      <div className="ea-tooltip" role="tooltip">
        <div className="ea-tt-head">
          <span className="ea-tt-title">{card.label}</span>
          <span className={`ea-tt-state ea-badge-${card.state}`}>{STATE_LABEL[card.state]}</span>
        </div>
        <p className="ea-tt-line"><strong>What:</strong> {card.what}</p>
        <p className="ea-tt-line"><strong>Why it matters:</strong> {card.why}</p>
        <p className="ea-tt-line"><strong>ArchLab found:</strong> {card.detail}</p>
        <div className="ea-tt-fix">
          <CopyPromptButton compact prompt={card.fixPrompt} label="Copy fix prompt" />
        </div>
      </div>
    </div>
  );
}

/** Decorative connector line shown under each section header. */
function Connector({ color }: { color: string }) {
  return (
    <svg className="ea-connector" height="14" aria-hidden="true" preserveAspectRatio="none">
      <line x1="0" y1="7" x2="100%" y2="7" stroke={color} strokeWidth="2" strokeDasharray="2 8" />
    </svg>
  );
}

/** Build a standalone HTML document of the audit and print it to PDF. */
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

export function EnterpriseAudit({ infra, findings, dependencies = [] }: EnterpriseAuditProps) {
  const result = useMemo(
    () => computeAudit(infra, findings, dependencies),
    [infra, findings, dependencies],
  );
  const overallColor = scoreColor(result.score);

  return (
    <div className="ea-root" id="ea-document">
      {/* Score header */}
      <div className="ea-score-card">
        <ScoreRing score={result.score} />
        <div className="ea-score-body">
          <div className="ea-verdict" style={{ color: overallColor }}>{result.verdict}</div>
          <p className="ea-score-summary">
            {result.detectedCount} detected · {result.partialCount} partial · {result.missingCount} missing ·{' '}
            <strong style={{ color: '#EF4444' }}>{result.criticalGapCount} critical gaps</strong> across{' '}
            {result.totalCards} capabilities.
          </p>
          <div className="ea-breakdown">
            {result.sections.map((s) => (
              <div key={s.id} className="ea-breakdown-row">
                <span className="ea-breakdown-label">{s.title}</span>
                <div className="ea-breakdown-track">
                  <div
                    className="ea-breakdown-fill"
                    style={{ width: `${s.score}%`, background: s.color }}
                  />
                </div>
                <span className="ea-breakdown-score">{s.score}%</span>
              </div>
            ))}
          </div>
          <button className="ea-export-btn" onClick={() => exportReport(result)}>
            📥 Export Enterprise Report
          </button>
        </div>
      </div>

      {/* Sections */}
      {result.sections.map((section) => (
        <section key={section.id} className="ea-section">
          <div className="ea-section-header">
            <h3 className="ea-section-title" style={{ color: section.color }}>
              {section.title}
            </h3>
            <span className="ea-section-score" style={{ color: section.color }}>{section.score}%</span>
          </div>
          <Connector color={section.color} />
          <div className="ea-grid">
            {section.cards.map((card) => (
              <Card key={card.id} sectionId={section.id} color={section.color} card={card} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
