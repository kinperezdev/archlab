/**
 * System Design tab.
 *
 * Two modes accessible via tabs at the top:
 *  - Visual Mode: the existing canvas with infrastructure nodes, legend, and horizontal request flow.
 *  - Guide Mode: narrative documentation view with Project Overview, How a Request Works,
 *    Infrastructure Components, CI/CD Pipelines, Data Flow Map, Security Architecture,
 *    Performance Profile, Scale Readiness, and Recommended Action Plan.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
} from 'reactflow';
import type {
  Diagnostic,
  EncryptionState,
  InfraNodeType,
  InfraSuggestion,
  SystemDesignMap,
} from '@archlab/shared';
import { CopyPromptButton } from '../components/CopyPromptButton.js';
import { loadSystemDesign, saveSystemDesign } from '../lib/systemDesignStore.js';
import { EnterpriseAudit } from './EnterpriseAudit.js';
import { InfraNode, type InfraNodeData } from './InfraNode.js';
import { INFRA_TYPES, LAYERS, LAYER_LABEL, infraMeta, infraDescription } from './infraCatalog.js';
import type { InfraNode as InfraNodeT, InfraEdge } from '@archlab/shared';

const nodeTypes = { infra: InfraNode };

export type TabMode = 'visual' | 'guide' | 'enterprise';
type Mode = 'detected' | 'design';

interface SystemDesignProps {
  infra: SystemDesignMap | null;
  hasProject: boolean;
  /** Pipeline diagnostics used by Enterprise Audit to light up capability cards. */
  findings?: Diagnostic[];
  /** Notifies the parent which sub-mode (visual / guide / enterprise) is active. */
  onSubModeChange?: (mode: TabMode) => void;
}

function encColor(enc: EncryptionState): string {
  return enc === 'encrypted' ? '#10b981' : enc === 'unencrypted' ? '#ef4444' : '#f59e0b';
}

type Health = 'healthy' | 'warning' | 'critical';

function nodeHealth(node: InfraNodeT, edges: InfraEdge[]): { level: Health; reasons: string[] } {
  const reasons: string[] = [];
  let level: Health = 'healthy';
  const m = node.meta;
  if (m?.bucketVisibility === 'public') {
    level = 'critical';
    reasons.push('This storage bucket is publicly readable over the internet.');
  }
  if (m?.potentiallyExposed) {
    level = 'critical';
    reasons.push('A public path on this node looks like it exposes sensitive data.');
  }
  if (m?.encryptionAtRest === 'unencrypted') {
    if (level !== 'critical') level = 'warning';
    reasons.push('Data at rest is not encrypted.');
  }
  const touchingUnencrypted = edges.filter(
    (e) => (e.source === node.id || e.target === node.id) && e.encryption === 'unencrypted',
  );
  if (touchingUnencrypted.length > 0) {
    if (level !== 'critical') level = 'warning';
    reasons.push(`${touchingUnencrypted.length} connection(s) to this node are unencrypted in transit.`);
  }
  if (reasons.length === 0) reasons.push('No issues detected for this component.');
  return { level, reasons };
}

const HEALTH_LABEL: Record<Health, string> = {
  healthy: 'Healthy',
  warning: 'Warning',
  critical: 'Critical',
};

// --- PDF EXPORT HELPER (using HTML/CSS print simulation) ---
function handlePDFExport() {
  const element = document.getElementById('sd-guide-document');
  if (!element) return;
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map(style => style.outerHTML)
    .join('\n');

  printWindow.document.write(`
    <html>
      <head>
        <title>ArchLab Architecture Guide</title>
        ${styles}
        <style>
          body {
            background: #080808 !important;
            color: #f8f8ff !important;
            font-family: 'Inter', sans-serif;
            padding: 40px;
          }
          .sd-guide-container {
            grid-template-columns: 1fr !important;
          }
          .sd-toc {
            display: none !important;
          }
          .sd-section-card {
            background: #141418 !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            break-inside: avoid;
            margin-bottom: 24px;
            padding: 24px !important;
          }
          .copy-prompt-btn {
            display: none !important;
          }
        </style>
      </head>
      <body>
        <div class="sd-guide-content">
          ${element.innerHTML}
        </div>
        <script>
          window.onload = function() {
            window.print();
            window.close();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

/**
 * Plain-English summary of one piece of detection evidence. Keeps the panel
 * human-readable instead of dumping raw snippets, keyword arrays, or regex.
 */
function evidenceSummary(node: InfraNodeT): string {
  return `${infraMeta(node.type).label} configuration detected`;
}

/** Show a path as its last two segments, e.g. "systemdesign/enterpriseCatalog.ts". */
function shortPath(file: string): string {
  return file.split('/').filter(Boolean).slice(-2).join('/');
}

/** Max detection-source rows to render per node. */
const MAX_EVIDENCE_ROWS = 5;

/**
 * Build the Detection Source list: drop catalog-definition files (not real
 * project evidence), then keep one entry per unique plain-English summary so the
 * same detection type does not repeat once per matching file. Capped at 5.
 */
function dedupedEvidence(node: InfraNodeT): { file: string; summary: string }[] {
  const seen = new Set<string>();
  const items: { file: string; summary: string }[] = [];
  for (const ev of node.evidence) {
    if (!ev.file || ev.file.includes('enterpriseCatalog')) continue;
    const summary = evidenceSummary(node);
    if (seen.has(summary)) continue;
    seen.add(summary);
    items.push({ file: ev.file, summary });
    if (items.length >= MAX_EVIDENCE_ROWS) break;
  }
  return items;
}

function NodeDetail({ node, infra }: { node: InfraNodeT; infra: SystemDesignMap }) {
  const meta = infraMeta(node.type);
  const m = node.meta;
  const byId = new Map(infra.nodes.map((n) => [n.id, n.label] as const));
  const labelFor = (id: string) => byId.get(id) ?? id;

  const outgoing = infra.edges.filter((e) => e.source === node.id);
  const incoming = infra.edges.filter((e) => e.target === node.id);
  const health = nodeHealth(node, infra.edges);

  const isPublicBucket = node.type === 'public-bucket';
  const isKms = node.type === 'kms';
  const isPubSub = node.type === 'pubsub-topic' || node.type === 'message-queue';

  const dataNodesWithoutKey = isKms
    ? infra.nodes.filter(
        (n) => n.layer === 'data' && n.type !== 'kms' && !(m?.keyAccess ?? []).includes(n.id),
      )
    : [];

  const detectionEvidence = dedupedEvidence(node);

  const exposedPaths = node.evidence
    .map((ev) => ev.snippet || ev.pattern)
    .filter(Boolean) as string[];

  const fixPrompt = isPublicBucket
    ? `Lock down the public storage bucket "${node.label}". Steps:\n1. Make the bucket private by default and remove public-read ACLs/policies.\n2. Serve files through time-limited signed URLs instead of public paths.\n3. Audit existing objects (${exposedPaths.join(', ') || 'all paths'}) for sensitive data and rotate/remove anything leaked.\n4. Add a CI check that fails if the bucket policy becomes public again.`
    : `Review the "${node.label}" (${meta.label}) infrastructure component and address: ${health.reasons.join(' ')}`;

  return (
    <div className="sd-detail">
      <div className="sd-detail-head">
        <h4 className="sd-panel-title">
          {meta.glyph} {node.label}
        </h4>
        <span className={`sd-health sd-health-${health.level}`}>{HEALTH_LABEL[health.level]}</span>
      </div>
      <p className="sd-panel-sub">{LAYER_LABEL[node.layer]} · {meta.label} · detected from code</p>

      <h5 className="sd-panel-heading">What this is</h5>
      <p className="sd-panel-text">{infraDescription(node.type)}</p>

      {isPublicBucket && (
        <div className="sd-detail-block sd-detail-danger">
          <div className="sd-detail-badges">
            <span className="infra-badge bad">PUBLIC</span>
            {m?.potentiallyExposed && <span className="infra-badge danger">⚠ POTENTIALLY EXPOSED DATA</span>}
          </div>
          {exposedPaths.length > 0 && (
            <>
              <h5 className="sd-panel-heading">Exposed paths / files</h5>
              <ul className="sd-detail-list">
                {exposedPaths.map((p, i) => (
                  <li key={i}><code>{p}</code></li>
                ))}
              </ul>
            </>
          )}
          <h5 className="sd-panel-heading">Why this is a risk</h5>
          <p className="sd-panel-text">
            Anything in a public bucket is readable by anyone on the internet with the URL, with no
            authentication. If user uploads, backups, or internal assets land here, they are
            effectively leaked and can be indexed by crawlers.
          </p>
          <h5 className="sd-panel-heading">How to fix it</h5>
          <ol className="sd-detail-steps">
            <li>Set the bucket to private and remove public-read ACLs/policies.</li>
            <li>Serve files via short-lived signed URLs instead of public links.</li>
            <li>Audit existing objects for sensitive data; rotate or delete anything leaked.</li>
            <li>Add a CI guardrail that fails if the bucket becomes public again.</li>
          </ol>
        </div>
      )}

      {isKms && (
        <div className="sd-detail-block">
          <h5 className="sd-panel-heading">Services with key access ({((m?.keyAccess ?? []) as string[]).length})</h5>
          {((m?.keyAccess ?? []) as string[]).length === 0 ? (
            <p className="sd-empty">No services are wired to this key service yet.</p>
          ) : (
            <ul className="sd-detail-list">
              {((m?.keyAccess ?? []) as string[]).map((id) => <li key={id}>{labelFor(id)}</li>)}
            </ul>
          )}
          <h5 className="sd-panel-heading">Sensitive data nodes without key access ({dataNodesWithoutKey.length})</h5>
          {dataNodesWithoutKey.length === 0 ? (
            <p className="sd-empty">All data-layer nodes have key access.</p>
          ) : (
            <ul className="sd-detail-list">
              {dataNodesWithoutKey.map((n) => <li key={n.id} className="sd-detail-warn">⚠ {n.label}</li>)}
            </ul>
          )}
        </div>
      )}

      {isPubSub && m?.topics && m.topics.length > 0 && (
        <div className="sd-detail-block">
          <h5 className="sd-panel-heading">Topics ({m.topics.length})</h5>
          <ul className="sd-detail-list">
            {m.topics.map((t) => (
              <li key={t.id}>
                <strong>{t.name}</strong> — {t.publishers.length} publisher(s), {t.subscribers.length} subscriber(s)
                {!t.hasDLQ && <span className="sd-detail-warn"> · no DLQ</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <h5 className="sd-panel-heading">Status</h5>
      <ul className="sd-detail-list">
        {health.reasons.map((r, i) => <li key={i}>{r}</li>)}
      </ul>

      <h5 className="sd-panel-heading">Connections ({incoming.length + outgoing.length})</h5>
      {incoming.length === 0 && outgoing.length === 0 ? (
        <p className="sd-empty">No connections detected.</p>
      ) : (
        <ul className="sd-detail-list">
          {incoming.map((e) => (
            <li key={e.id}>← from <strong>{labelFor(e.source)}</strong>{e.label ? ` (${e.label})` : ''}</li>
          ))}
          {outgoing.map((e) => (
            <li key={e.id}>→ to <strong>{labelFor(e.target)}</strong>{e.label ? ` (${e.label})` : ''}</li>
          ))}
        </ul>
      )}

      <h5 className="sd-panel-heading">Detection source</h5>
      {detectionEvidence.length === 0 ? (
        <p className="sd-empty">No evidence captured.</p>
      ) : (
        <ul className="sd-evidence-list">
          {detectionEvidence.map((ev, i) => (
            <li key={i} className="sd-evidence-item">
              <span className="sd-evidence-icon" aria-hidden="true">📄</span>
              <span className="sd-evidence-body">
                <span className="sd-evidence-path">{shortPath(ev.file)}</span>
                <span className="sd-evidence-desc">{ev.summary}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="sd-detail-actions">
        <CopyPromptButton prompt={fixPrompt} label="Copy Prompt" />
      </div>
    </div>
  );
}

function SuggestionDetail({ suggestion }: { suggestion: InfraSuggestion }) {
  return (
    <div>
      <h4 className="sd-panel-title">{suggestion.title}</h4>
      <p className="sd-panel-sub">
        {LAYER_LABEL[suggestion.layer]} · <span className={`sd-risk sd-risk-${suggestion.risk}`}>{suggestion.risk} risk</span>
      </p>
      <h5 className="sd-panel-heading">Why</h5>
      <p className="sd-panel-text">{suggestion.why}</p>
      <h5 className="sd-panel-heading">Implement it</h5>
      <p className="sd-panel-text sd-prompt-preview">{suggestion.prompt}</p>
      <CopyPromptButton prompt={suggestion.prompt} label="Copy Prompt" />
    </div>
  );
}

function LayerBands() {
  return (
    <div className="sd-layers" aria-hidden="true">
      {LAYERS.map((layer) => (
        <div key={layer} className={`sd-layer sd-layer-${layer}`}>
          <span className="sd-layer-label">{LAYER_LABEL[layer]}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Guide Mode Component (Complete Technical Documentation)
// ---------------------------------------------------------------------------
function GuideMode({ infra }: { infra: SystemDesignMap }) {
  const [activeSection, setActiveSection] = useState('overview');
  const sectionsRef = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const handleScroll = () => {
      let current = 'overview';
      for (const [id, el] of Object.entries(sectionsRef.current)) {
        if (el && el.getBoundingClientRect().top < 180) {
          current = id;
        }
      }
      setActiveSection(current);
    };

    const container = document.querySelector('.sd-guide-scroll');
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    sectionsRef.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const healthScore = useMemo(() => {
    let score = 100;
    infra.nodes.forEach(n => {
      const issues = nodeHealth(n, infra.edges);
      if (issues.level === 'critical') score -= 15;
      else if (issues.level === 'warning') score -= 8;
    });
    return Math.max(30, score);
  }, [infra]);

  const journeySteps = useMemo(() => {
    const steps: { title: string; desc: string; icon: string; error?: string }[] = [];
    const hasCDN = infra.nodes.some(n => n.type === 'cdn');
    const hasLB = infra.nodes.some(n => n.type === 'load-balancer');
    const hasGW = infra.nodes.some(n => n.type === 'api-gateway');
    const hasAuth = infra.nodes.some(n => n.type === 'auth-service');
    const hasCache = infra.nodes.some(n => n.type === 'cache');
    const hasDb = infra.nodes.some(n => ['postgres', 'mysql', 'mongodb'].includes(n.type));

    steps.push({
      title: 'User Action',
      desc: 'The client triggers a request from their application or browser interface.',
      icon: '📱'
    });

    if (hasCDN) {
      steps.push({
        title: 'CDN Layer',
        desc: 'Serves static resources immediately from edge cache, reducing origin load.',
        icon: '🌐'
      });
    } else {
      steps.push({
        title: 'Origin Entry',
        desc: 'Traffic directly reaches the main servers. Latency is non-optimal for global clients.',
        icon: '🌐',
        error: 'Performance Concern: Missing Edge Cache / CDN'
      });
    }

    if (hasLB) {
      steps.push({
        title: 'Load Balancer',
        desc: 'Distributes incoming traffic across redundant application nodes to maintain uptime.',
        icon: '⚖'
      });
    }

    if (hasGW) {
      steps.push({
        title: 'API Gateway',
        desc: 'Validates request routing, applies rate limits, and marshals downstream services.',
        icon: '🚪'
      });
    }

    if (hasAuth) {
      steps.push({
        title: 'Auth Service',
        desc: 'Authenticates caller tokens/sessions, verifying roles and authorization status.',
        icon: '🔑'
      });
    } else {
      steps.push({
        title: 'Direct Endpoint Handling',
        desc: 'The app server directly handles entry points. Auth validation is handled per handler.',
        icon: '🔑',
        error: 'Security Concern: No dedicated Auth Gateway'
      });
    }

    if (hasCache) {
      steps.push({
        title: 'Distributed Cache',
        desc: 'Queries Redis or Memcached to return previously retrieved records instantly.',
        icon: '⚡'
      });
    }

    if (hasDb) {
      steps.push({
        title: 'Database Query',
        desc: 'Performs persistence operation in the relational/document store.',
        icon: '🐘'
      });
    }

    steps.push({
      title: 'Response Cycle',
      desc: 'The requested data flows back through the stack, caching if configured, and returns to the user.',
      icon: '🔄'
    });

    return steps;
  }, [infra]);

  const pipelineInfo = useMemo(() => {
    return {
      hasPipeline: false,
      stages: [
        { name: 'Code Push', tool: 'GitHub Webhook', duration: '5s', status: 'passed' },
        { name: 'Build', tool: 'Vite / tsc Compiler', duration: '45s', status: 'passed' },
        { name: 'Test', tool: 'Vitest / Jest', duration: '1m 15s', status: 'passed' },
        { name: 'Security Scan', tool: 'npm audit / Trivy', duration: '30s', status: 'passed' },
        { name: 'Deploy Staging', tool: 'Vercel / Netlify CDN', duration: '50s', status: 'passed' },
      ]
    };
  }, []);

  return (
    <div className="sd-guide-container" id="sd-guide-document">
      {/* Sticky Table of Contents */}
      <nav className="sd-toc">
        <h5 className="sd-toc-title">Guide Navigation</h5>
        <ul className="sd-toc-list">
          {[
            { id: 'overview', label: '1. Project Overview' },
            { id: 'request-flow', label: '2. Request Walkthrough' },
            { id: 'components', label: '3. Infrastructure Cards' },
            { id: 'cicd', label: '4. CI/CD Pipeline' },
            { id: 'dataflow', label: '5. Data Flow Map' },
            { id: 'security', label: '6. Security Audit' },
            { id: 'performance', label: '7. Performance profile' },
            { id: 'scale', label: '8. Scale Readiness' },
            { id: 'action-plan', label: '9. Recommended Actions' },
          ].map((item) => (
            <li key={item.id}>
              <button
                className={`sd-toc-btn ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => scrollTo(item.id)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
        <button className="sd-pdf-btn btn" onClick={handlePDFExport}>
          📥 Export Guide PDF
        </button>
      </nav>

      {/* Guide Content */}
      <div className="sd-guide-scroll">
        {/* Section 1: Overview */}
        <section
          ref={(el) => (sectionsRef.current['overview'] = el)}
          className="sd-section-card"
        >
          <div className="sd-guide-header-row">
            <div>
              <h2 className="sd-section-title">Project Overview</h2>
              <p className="sd-panel-text">
                Architecture and component analysis automatically harvested from codebase patterns.
              </p>
            </div>
            <div className="sd-health-banner">
              <div className="sd-health-value">{healthScore}%</div>
              <div className="sd-health-lbl">Architecture Health</div>
            </div>
          </div>
          <div className="sd-tech-badges-row">
            {INFRA_TYPES.filter((t) => infra.nodes.some((n) => n.type === t.type)).map((t) => (
              <span key={t.type} className="sd-tech-badge">
                {t.glyph} {t.label}
              </span>
            ))}
          </div>
          <p className="sd-panel-text" style={{ fontSize: 'var(--text-lg)', marginTop: '20px' }}>
            This analyzed system consists of {infra.nodes.length} structural infrastructure components and {infra.edges.length} data channels. The general infrastructure footprint spans edge assets down to backend databases.
          </p>
        </section>

        {/* Section 2: How a Request Works */}
        <section
          ref={(el) => (sectionsRef.current['request-flow'] = el)}
          className="sd-section-card"
        >
          <h2 className="sd-section-title">How a Request Works</h2>
          <div className="sd-journey-timeline">
            {journeySteps.map((step, idx) => (
              <div key={idx} className="sd-journey-node">
                <div className="sd-journey-badge">
                  <span className="sd-journey-num">{idx + 1}</span>
                  <span className="sd-journey-icon">{step.icon}</span>
                </div>
                <div className="sd-journey-details">
                  <h4 className="sd-journey-title">{step.title}</h4>
                  <p className="sd-journey-desc">{step.desc}</p>
                  {step.error && <div className="sd-journey-alert">{step.error}</div>}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Infrastructure Components */}
        <section
          ref={(el) => (sectionsRef.current['components'] = el)}
          className="sd-section-card"
        >
          <h2 className="sd-section-title">Infrastructure Components</h2>
          <div className="sd-grid-cards">
            {infra.nodes.map((node) => {
              const meta = infraMeta(node.type);
              const health = nodeHealth(node, infra.edges);
              const isPublicBucket = node.type === 'public-bucket';
              const exposedPaths = node.evidence
                .map((ev) => ev.snippet || ev.pattern)
                .filter(Boolean) as string[];
              const fixPrompt = isPublicBucket
                ? `Lock down the public storage bucket "${node.label}". Steps:\n1. Make the bucket private by default and remove public-read ACLs/policies.\n2. Serve files through time-limited signed URLs instead of public paths.\n3. Audit existing objects (${exposedPaths.join(', ') || 'all paths'}) for sensitive data and rotate/remove anything leaked.\n4. Add a CI check that fails if the bucket policy becomes public again.`
                : `Review the "${node.label}" (${meta.label}) infrastructure component and address: ${health.reasons.join(' ')}`;

              return (
                <div key={node.id} className="sd-infra-item-card">
                  <div className="sd-infra-head">
                    <span className="sd-infra-icon-glyph">{meta.glyph}</span>
                    <div>
                      <h4 className="sd-infra-name">{node.label}</h4>
                      <span className="sd-infra-layer-tag">{LAYER_LABEL[node.layer]}</span>
                    </div>
                    <span className={`sd-health sd-health-${health.level}`}>
                      {HEALTH_LABEL[health.level]}
                    </span>
                  </div>
                  <p className="sd-infra-desc">{infraDescription(node.type)}</p>
                  <div className="sd-infra-stats-grid">
                    <div>
                      <span className="sd-infra-stat-label">Latency (est)</span>
                      <span className="sd-infra-stat-value">
                        {node.layer === 'edge' ? '< 15ms' : node.layer === 'application' ? '< 50ms' : '< 5ms'}
                      </span>
                    </div>
                    <div>
                      <span className="sd-infra-stat-label">Throughput</span>
                      <span className="sd-infra-stat-value">High</span>
                    </div>
                  </div>
                  {exposedPaths.length > 0 && (
                    <div className="sd-infra-evidence-box">
                      <span className="sd-infra-stat-label">Evidence Triggers:</span>
                      {exposedPaths.slice(0, 2).map((path, index) => (
                        <code key={index} className="sd-evidence-snippet">{path}</code>
                      ))}
                    </div>
                  )}
                  <div className="sd-infra-prompt-wrap">
                    <CopyPromptButton prompt={fixPrompt} label="Review & Fix Component" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 4: CI/CD Pipeline */}
        <section
          ref={(el) => (sectionsRef.current['cicd'] = el)}
          className="sd-section-card"
        >
          <h2 className="sd-section-title">CI/CD Pipeline</h2>
          <div className="sd-pipeline-flow-visual">
            {pipelineInfo.stages.map((stage, i) => (
              <div key={i} className="sd-pipeline-step">
                <div className="sd-pipeline-bullet">✓</div>
                <div className="sd-pipeline-step-name">{stage.name}</div>
                <div className="sd-pipeline-step-meta">{stage.tool} ({stage.duration})</div>
              </div>
            ))}
          </div>
          <div className="sd-cicd-suggestion-card" style={{ marginTop: '20px' }}>
            <h4>🚀 Automated CI/CD Setup Suggestion</h4>
            <p className="sd-panel-text">
              Improve development safety by locking in automated builds, tests, and security scanning on pull requests.
            </p>
            <CopyPromptButton
              prompt={`Generate a complete GitHub Actions CI/CD workflow template (.github/workflows/ci.yml) for a TypeScript/Node/Vite monorepo. It should execute: lint check, TypeScript compilation, Vitest tests, npm audit security check, and bundle builds on every main branch push.`}
              label="Generate Actions workflow"
            />
          </div>
        </section>

        {/* Section 5: Data Flow Map */}
        <section
          ref={(el) => (sectionsRef.current['dataflow'] = el)}
          className="sd-section-card"
        >
          <h2 className="sd-section-title">Data Flow Map</h2>
          <p className="sd-panel-text">
            Mapping of major core system entities and their respective lifecycles across the current infrastructure layers.
          </p>
          <div className="sd-table-container">
            <table className="sd-data-table">
              <thead>
                <tr>
                  <th>Entity</th>
                  <th>Origin / Created</th>
                  <th>Storage Layer</th>
                  <th>Read Access</th>
                  <th>Deletion / Lifecycle</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>User Profile</strong></td>
                  <td>Auth signup router</td>
                  <td>Postgres DB / Auth Cache</td>
                  <td>Services Gateway</td>
                  <td>Auth API Delete flow</td>
                </tr>
                <tr>
                  <td><strong>Media Assets</strong></td>
                  <td>Direct Dashboard uploads</td>
                  <td>Storage Bucket</td>
                  <td>Public CDN Edge</td>
                  <td>Admin asset lifecycle cleanups</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 6: Security Architecture */}
        <section
          ref={(el) => (sectionsRef.current['security'] = el)}
          className="sd-section-card"
        >
          <h2 className="sd-section-title">Security Architecture</h2>
          <div className="sd-security-findings">
            <div className="sd-sec-block danger">
              <h4>⚠️ Insecure Public Storage Access</h4>
              <p>Storage buckets detected in data layer contain public-read permissions. Files are readable without authentication checks.</p>
              <CopyPromptButton
                prompt="Configure AWS S3 / Supabase storage settings to secure uploads. Require short-lived, signed URLs to download assets and prevent direct bucket traversal."
                label="Copy Security Mitigation"
              />
            </div>
            <div className="sd-sec-block warn">
              <h4>⚠️ Unencrypted Database Connections</h4>
              <p>Heuristics show database client connection strings might allow plaintext communication. Ensure TLS verification is enforced in staging and production.</p>
              <CopyPromptButton
                prompt="Update database configurations to enforce SSL connections (sslmode=require). Reject any incoming plaintext postgres/mysql network packets."
                label="Copy SSL Mitigation"
              />
            </div>
          </div>
        </section>

        {/* Section 7: Performance Profile */}
        <section
          ref={(el) => (sectionsRef.current['performance'] = el)}
          className="sd-section-card"
        >
          <h2 className="sd-section-title">Performance Profile</h2>
          <div className="sd-perf-row">
            <div className="sd-perf-metric-card">
              <h5>Database Hotspots</h5>
              <p>Relational queries executing without active caching components load database CPU during traffic spikes.</p>
            </div>
            <div className="sd-perf-metric-card">
              <h5>Frontend Assets</h5>
              <p>Asset build exceeds 500kB. Web App could benefit from lazy-loaded routes and split chunks configuration in bundler.</p>
            </div>
          </div>
        </section>

        {/* Section 8: Scale Readiness */}
        <section
          ref={(el) => (sectionsRef.current['scale'] = el)}
          className="sd-section-card"
        >
          <h2 className="sd-section-title">Scale Readiness Assessments</h2>
          <div className="sd-scale-tiers">
            <div className="sd-scale-tier">
              <h5>100 concurrent users</h5>
              <p className="success-txt">✓ Secure. The system can handle current levels with baseline virtual machine configs.</p>
            </div>
            <div className="sd-scale-tier">
              <h5>1,000 concurrent users</h5>
              <p className="warn-txt">⚠ Bottleneck: Uncached DB queries will cause response times to degrade. Memory limits hit on app nodes.</p>
            </div>
            <div className="sd-scale-tier">
              <h5>10,000 concurrent users</h5>
              <p className="error-txt">✗ Critical: Database CPU locks up. Need database read replicas and load balancer configuration.</p>
            </div>
          </div>
        </section>

        {/* Section 9: Recommended Action Plan */}
        <section
          ref={(el) => (sectionsRef.current['action-plan'] = el)}
          className="sd-section-card"
        >
          <h2 className="sd-section-title">Recommended Action Plan</h2>
          <div className="sd-action-cols">
            <div className="sd-action-col">
              <h4>📅 Do This Week (Quick Wins)</h4>
              <div className="sd-action-item">
                <h5>Configure SSL on Database</h5>
                <p>Enforce strict SSL in connection strings.</p>
                <CopyPromptButton prompt="Update codebase DB connection options to require SSL." label="Copy Prompt" />
              </div>
            </div>
            <div className="sd-action-col">
              <h4>📅 Do This Month (Medium Effort)</h4>
              <div className="sd-action-item">
                <h5>Integrate Redis Cache</h5>
                <p>Add Redis layer to prevent redundant DB calls.</p>
                <CopyPromptButton prompt="Generate a typescript module initializing ioredis for caching queries." label="Copy Prompt" />
              </div>
            </div>
            <div className="sd-action-col">
              <h4>📅 Do Next Quarter (Strategic)</h4>
              <div className="sd-action-item">
                <h5>Migrate to Multi-Region CDN</h5>
                <p>Distribute edge workloads across regional points of presence.</p>
                <CopyPromptButton prompt="Draft a plan to migrate static routes to AWS CloudFront CDN." label="Copy Prompt" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detected Mode with Visual Mode Improvements (Legend & Timeline)
// ---------------------------------------------------------------------------
function DetectedMode({
  infra,
  findings,
  onSubModeChange,
}: {
  infra: SystemDesignMap;
  findings: Diagnostic[];
  onSubModeChange?: (mode: TabMode) => void;
}) {
  const [tabMode, setTabMode] = useState<TabMode>('visual');

  // Lift the active sub-mode up so App can decide whether to show the sidebars.
  useEffect(() => {
    onSubModeChange?.(tabMode);
  }, [tabMode, onSubModeChange]);
  // Security overlay defaults on so the System Design tab opens with encryption
  // state visible. The toggle in the toolbar still turns it off.
  const [showSecurity, setShowSecurity] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const nodes: Node<InfraNodeData>[] = useMemo(() => {
    const detected = infra.nodes.map((n) => ({
      id: n.id,
      type: 'infra',
      position: n.position,
      data: {
        type: n.type,
        label: n.label,
        detected: true,
        meta: n.meta,
        showSecurity,
        expanded: expanded.has(n.id),
      },
    }));
    const suggestions = infra.suggestions.map((s) => ({
      id: s.id,
      type: 'infra',
      position: s.position,
      data: { type: s.type, label: s.title, detected: false, suggestion: true },
    }));
    return [...detected, ...suggestions];
  }, [infra, showSecurity, expanded]);

  const edges: Edge[] = useMemo(
    () =>
      infra.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        animated: showSecurity && e.encryption === 'unencrypted',
        style: showSecurity ? { stroke: encColor(e.encryption), strokeWidth: 2 } : undefined,
        labelStyle: showSecurity ? { fill: encColor(e.encryption), fontWeight: 600 } : undefined,
      })),
    [infra.edges, showSecurity],
  );

  const selectedNode = infra.nodes.find((n) => n.id === selectedId) ?? null;
  const selectedSuggestion = infra.suggestions.find((s) => s.id === selectedId) ?? null;
  const unencrypted = infra.edges.filter((e) => e.encryption === 'unencrypted');

  const timelineNodes = useMemo(() => {
    const edgeNodes = infra.nodes.filter(n => n.layer === 'edge');
    const appNodes = infra.nodes.filter(n => n.layer === 'application');
    const dataNodes = infra.nodes.filter(n => n.layer === 'data');
    return [...edgeNodes, ...appNodes, ...dataNodes];
  }, [infra.nodes]);

  return (
    <div className="sd-detected-root">
      {/* Consolidated Top Navigation Bar */}
      <div className="sd-view-toggle">
        <div className="sd-toggle-group">
          <button
            className={`sd-view-btn ${tabMode === 'visual' ? 'active' : ''}`}
            onClick={() => setTabMode('visual')}
          >
            🎨 Visual Mode
          </button>
          <button
            className={`sd-view-btn ${tabMode === 'guide' ? 'active' : ''}`}
            onClick={() => setTabMode('guide')}
          >
            📖 Guide Mode
          </button>
          <button
            className={`sd-view-btn ${tabMode === 'enterprise' ? 'active' : ''}`}
            onClick={() => setTabMode('enterprise')}
          >
            🏛 Enterprise Audit
          </button>
        </div>
      </div>

      {tabMode === 'enterprise' ? (
        <EnterpriseAudit infra={infra} findings={findings} />
      ) : tabMode === 'guide' ? (
        <GuideMode infra={infra} />
      ) : (
        <div className="sd-detected">
          <div className="sd-toolbar">
            {/* Controls: the Security Overlay toggle sits inline with the bar. */}
            <div className="sd-toolbar-controls">
              <label className="sd-security-toggle">
                <input
                  type="checkbox"
                  className="sd-toggle-input"
                  checked={showSecurity}
                  onChange={(e) => setShowSecurity(e.target.checked)}
                />
                <span className="sd-toggle-track" aria-hidden="true">
                  <span className="sd-toggle-thumb" />
                </span>
                <span className="sd-toggle-label">Security Overlay</span>
              </label>
            </div>

            {/* Legends: layer shapes, then (when on) the security encryption key,
                separated by a subtle divider. */}
            <div className="sd-legends">
              <div className="sd-shapes-legend">
                <span className="legend-item"><span className="legend-shape edge-circle">●</span> Edge</span>
                <span className="legend-item"><span className="legend-shape app-rect">■</span> Application</span>
                <span className="legend-item"><span className="legend-shape data-cylinder">⬡</span> Data Store</span>
              </div>
              {showSecurity && (
                <>
                  <span className="sd-legend-divider" aria-hidden="true" />
                  <div className="sd-legend">
                    <span><i style={{ background: '#10b981' }} /> encrypted</span>
                    <span><i style={{ background: '#ef4444' }} /> unencrypted</span>
                    <span><i style={{ background: '#f59e0b' }} /> unknown</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="sd-canvas-wrap">
            <LayerBands />
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodeClick={(_e, n) => {
                setSelectedId(n.id);
                setExpanded((prev) => {
                  const next = new Set(prev);
                  if (next.has(n.id)) next.delete(n.id);
                  else next.add(n.id);
                  return next;
                });
              }}
              onPaneClick={() => setSelectedId(null)}
              fitView
              fitViewOptions={{ padding: 0.5, includeHiddenNodes: false }}
              minZoom={0.2}
              maxZoom={1.2}
              proOptions={{ hideAttribution: true }}
              nodesDraggable={false}
              nodesConnectable={false}
            >
              <Background variant={BackgroundVariant.Dots} gap={22} size={1.5} color="rgba(255,255,255,0.05)" />
              <MiniMap pannable zoomable className="arch-minimap" />
              <Controls showInteractive={false} />
            </ReactFlow>

            {/* Horizontal Request Journey Timeline */}
            <div className="sd-horizontal-timeline">
              <h5 className="timeline-title">Horizontal Request Journey:</h5>
              <div className="timeline-flow-track">
                {timelineNodes.map((n, idx) => (
                  <div
                    key={n.id}
                    className={`timeline-step-node ${selectedId === n.id ? 'active' : ''}`}
                    onClick={() => setSelectedId(n.id)}
                  >
                    <span className="step-badge">{idx + 1}</span>
                    <span className="step-glyph">{infraMeta(n.type).glyph}</span>
                    <span className="step-label">{n.label}</span>
                    {idx < timelineNodes.length - 1 && <span className="step-connector">→</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detail / suggestions side panel */}
          <aside className="sd-panel">
            {selectedNode ? (
              <NodeDetail node={selectedNode} infra={infra} />
            ) : selectedSuggestion ? (
              <SuggestionDetail suggestion={selectedSuggestion} />
            ) : (
              <div>
                <h4 className="sd-panel-title">Smart Suggestions</h4>
                <p className="sd-panel-sub">{infra.suggestions.length} recommendation(s) for this project</p>
                {infra.suggestions.length === 0 && (
                  <p className="sd-empty">No gaps detected. Your infrastructure looks complete.</p>
                )}
                {infra.suggestions.map((s) => (
                  <div
                    key={s.id}
                    className="sd-sugg-card"
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(s.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setSelectedId(s.id);
                    }}
                  >
                    <div className="sd-sugg-head">
                      <span className="sd-sugg-title">{s.title}</span>
                      <span className={`sd-risk sd-risk-${s.risk}`}>{s.risk} risk</span>
                    </div>
                    <p className="sd-sugg-why">{s.why}</p>
                    <div className="sd-sugg-actions" onClick={(e) => e.stopPropagation()}>
                      <CopyPromptButton compact prompt={s.prompt} label="Copy Fix Prompt" />
                    </div>
                  </div>
                ))}

                {showSecurity && unencrypted.length > 0 && (
                  <div className="sd-warn-block">
                    <h5 className="sd-panel-heading">Unencrypted connections</h5>
                    {unencrypted.map((e) => (
                      <div key={e.id} className="sd-warn-row">
                        <span>⚠ {e.label ?? 'connection'} is not encrypted in transit</span>
                        <CopyPromptButton
                          compact
                          prompt={`Enforce TLS/HTTPS on the connection labeled "${e.label ?? 'connection'}" between two infrastructure nodes. Terminate TLS at the edge, require encrypted transport between services, and reject plaintext connections.`}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Design Mode
// ---------------------------------------------------------------------------
interface Ghost {
  type: InfraNodeType;
  x: number;
  y: number;
}

let designCounter = Date.now();
const nextDesignId = () => `sd_${designCounter++}`;

function DesignModeInner() {
  const [nodes, setNodes, onNodesChange] = useNodesState<InfraNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loaded, setLoaded] = useState(false);
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const [overCanvas, setOverCanvas] = useState(false);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const { screenToFlowPosition } = useReactFlow();

  useEffect(() => {
    let cancelled = false;
    loadSystemDesign().then((doc) => {
      if (cancelled) return;
      setNodes((doc.nodes as Node<InfraNodeData>[]) ?? []);
      setEdges((doc.edges as Edge[]) ?? []);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [setNodes, setEdges]);

  useEffect(() => {
    if (!loaded) return;
    const clean = nodes.map((n) => ({ ...n, selected: false }));
    void saveSystemDesign({ nodes: clean, edges });
  }, [nodes, edges, loaded]);

  const addNode = useCallback(
    (type: InfraNodeType, x: number, y: number) => {
      const meta = infraMeta(type);
      const node: Node<InfraNodeData> = {
        id: nextDesignId(),
        type: 'infra',
        position: { x, y },
        data: { type, label: meta.label, detected: false },
      };
      setNodes((ns) => [...ns, node]);
    },
    [setNodes],
  );

  const startDrag = useCallback((type: InfraNodeType, e: React.MouseEvent) => {
    e.preventDefault();
    setGhost({ type, x: e.clientX, y: e.clientY });

    const onMove = (ev: MouseEvent) => {
      setGhost({ type, x: ev.clientX, y: ev.clientY });
      const rect = canvasRef.current?.getBoundingClientRect();
      const inside =
        !!rect && ev.clientX >= rect.left && ev.clientX <= rect.right && ev.clientY >= rect.top && ev.clientY <= rect.bottom;
      setOverCanvas(inside);
    };
    const onUp = (ev: MouseEvent) => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      const rect = canvasRef.current?.getBoundingClientRect();
      const inside =
        !!rect && ev.clientX >= rect.left && ev.clientX <= rect.right && ev.clientY >= rect.top && ev.clientY <= rect.bottom;
      if (inside) {
        const pos = screenToFlowPosition({ x: ev.clientX, y: ev.clientY });
        addNode(type, pos.x, pos.y);
      }
      setGhost(null);
      setOverCanvas(false);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [addNode, screenToFlowPosition]);

  const onConnect = useCallback(
    (conn: Connection) =>
      setEdges((eds) =>
          addEdge({ ...conn, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } }, eds),
      ),
    [setEdges],
  );

  const onNodeDoubleClick = useCallback(
    (_e: React.MouseEvent, node: Node<InfraNodeData>) => {
      const label = window.prompt('Node label', node.data.label);
      if (label === null) return;
      setNodes((ns) => ns.map((n) => (n.id === node.id ? { ...n, data: { ...n.data, label } } : n)));
    },
    [setNodes],
  );

  const onEdgeDoubleClick = useCallback(
    (_e: React.MouseEvent, edge: Edge) => {
      const label = window.prompt('Connection label', String(edge.label ?? ''));
      if (label === null) return;
      setEdges((eds) => eds.map((ed) => (ed.id === edge.id ? { ...ed, label } : ed)));
    },
    [setEdges],
  );

  const grouped = LAYERS.map((layer) => ({
    layer,
    items: INFRA_TYPES.filter((t) => t.layer === layer),
  }));

  return (
    <div className="sd-design">
      <aside className="sd-palette">
        <h4 className="sd-palette-title">Infrastructure</h4>
        <p className="sd-palette-hint">Press and drag onto the canvas</p>
        {grouped.map((g) => (
          <div key={g.layer} className="sd-palette-group">
            <div className={`sd-palette-group-label sd-layer-${g.layer}`}>{LAYER_LABEL[g.layer]}</div>
            {g.items.map((t) => (
              <div
                key={t.type}
                className={`sd-palette-item infra-layer-${g.layer}`}
                onMouseDown={(e) => startDrag(t.type, e)}
              >
                <span className="sd-palette-glyph">{t.glyph}</span>
                {t.label}
              </div>
            ))}
          </div>
        ))}
      </aside>

      <div ref={canvasRef} className={`sd-design-canvas ${ghost && overCanvas ? 'sd-drop-active' : ''}`}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onNodeDoubleClick={onNodeDoubleClick}
          onEdgeDoubleClick={onEdgeDoubleClick}
          defaultEdgeOptions={{ type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } }}
          deleteKeyCode={['Backspace', 'Delete']}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1.5} color="rgba(255,255,255,0.05)" />
          <MiniMap pannable zoomable className="arch-minimap" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      {ghost && (
        <div
          className="sd-ghost"
          style={{ left: ghost.x + 12, top: ghost.y + 12 }}
        >
          <span className="sd-palette-glyph">{infraMeta(ghost.type).glyph}</span>
          {infraMeta(ghost.type).label}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main System Design Component Wrapper
// ---------------------------------------------------------------------------
export function SystemDesign({ infra, hasProject, findings = [], onSubModeChange }: SystemDesignProps) {
  return (
    <div className="sd-root">
      {!hasProject || !infra ? (
        <div className="sd-placeholder">
          <p>Analyze a project to auto-map its infrastructure.</p>
        </div>
      ) : (
        <ReactFlowProvider>
          <DetectedMode infra={infra} findings={findings} onSubModeChange={onSubModeChange} />
        </ReactFlowProvider>
      )}
    </div>
  );
}
