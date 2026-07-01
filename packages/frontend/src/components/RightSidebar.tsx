/**
 * Right sidebar: the Diagnostic Prompt (teaching panel for the latest issue,
 * including a copy-paste build prompt for architecture advisories), selected-
 * node details with a live "what's inside" file preview, project intelligence,
 * and the running findings list.
 */

import { Fragment, useMemo, useState, type ReactNode } from 'react';
import {
  type CanvasGraph,
  type CanvasNode,
  type Diagnostic,
  type PipelineStepId,
  type ProjectIntelligence,
  type Severity,
  type SystemDesignMap,
} from '@archlab/shared';
import { CopyPromptButton } from './CopyPromptButton.js';
import {
  promptForDiagnostic,
  promptForArchitectureSuggestion,
  promptForBottleneck,
} from '../lib/prompts.js';
import { inferOperation, OPERATION_COLORS, type Operation } from '../lib/operations.js';
import { useApiKeyContext } from '../state/apiKeyContext.js';
import { ConfidenceBadge, NudgeCard, NudgeText } from './ConfidenceNudge.js';
import type { CapabilityDetail } from '../canvas/nodeRecommendations.js';

interface NodeLink {
  node: CanvasNode;
  operation: Operation;
  impactCount: number;
}

interface RightSidebarProps {
  projectId: string | null;
  projectName: string | null;
  projectPath: string | null;
  graph: CanvasGraph;
  diagnostics: Diagnostic[];
  selectedNode: CanvasNode | null;
  /** Capability chip detail to show in its own panel (null = hidden). */
  capability?: CapabilityDetail | null;
  /** Close the capability panel. */
  onClearCapability?: () => void;
  intelligence: ProjectIntelligence | null;
  /** Collapse the sidebar (slides it out to the right). */
  onCollapse: () => void;
  /** Current panel width in px. */
  width: number;
  /** Begin a drag-resize from the left-edge handle. */
  onResizeStart: (e: React.MouseEvent) => void;
  /** When set (Security tab), the findings list shows only this step's findings. */
  stepFilter?: PipelineStepId | null;
  /** Clear the active step filter. */
  onClearStepFilter?: () => void;
  /** Screen-specific controls rendered at the top of the sidebar. */
  headerContent?: ReactNode;
  /**
   * Simulation panel/report shown inline with the usual sidebar details.
   */
  simulationContent?: ReactNode;
  /** Open the Code Intelligence Panel for a node id (same as double-click). */
  onOpenCode?: (nodeId: string) => void;
  infra?: SystemDesignMap | null;
  enrichment?: unknown;
}

const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'bottleneck', 'medium', 'low', 'info'];

/** Short label for the agent that produced a finding (Agent Team bridge). */
function agentLabel(agentId: string): string {
  const map: Record<string, string> = {
    security: 'Security Agent',
    performance: 'Performance Agent',
    architecture: 'Architecture Agent',
    database: 'Database Agent',
    quality: 'Code Quality Agent',
    orchestrator: 'Orchestrator',
  };
  return map[agentId] ?? agentId;
}

/** First related node file path for a diagnostic, for prompt context. */
function filePathForDiagnostic(d: Diagnostic, graph: CanvasGraph): string | null {
  for (const id of d.relatedNodeIds) {
    const node = graph.nodes.find((n) => n.id === id);
    if (node?.filePath) return node.filePath;
  }
  return null;
}

/** Pick the right prompt for a finding: bottlenecks get the scale-aware prompt. */
function buildFindingPrompt(
  d: Diagnostic,
  ctx: { projectName: string | null; projectPath: string | null; filePath: string | null },
): string {
  if (d.severity === 'bottleneck') {
    return promptForBottleneck(d, { projectPath: ctx.projectPath, filePath: ctx.filePath });
  }
  return promptForDiagnostic(d, { projectName: ctx.projectName, filePath: ctx.filePath });
}

export function RightSidebar({
  projectName,
  projectPath,
  graph,
  diagnostics,
  selectedNode,
  capability,
  onClearCapability,
  intelligence,
  onCollapse,
  width,
  onResizeStart,
  stepFilter,
  onClearStepFilter,
  headerContent,
  simulationContent,
  onOpenCode,
  infra,
}: RightSidebarProps) {
  const { agentTeamHasRun, openAgentTeam } = useApiKeyContext();
  const latest = diagnostics[diagnostics.length - 1] ?? null;
  // When a Security step tag is active, show only that step's findings.
  const visibleDiagnostics = stepFilter
    ? diagnostics.filter((d) => d.step === stepFilter)
    : diagnostics;
  const sorted = [...visibleDiagnostics].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
  );

  // Confidence signal for the findings header: static-only vs. AI-enhanced.
  const hasAiFindings = sorted.some((d) => Boolean(d.agentId));
  // The last bottleneck card in sorted order — the performance nudge sits after it.
  const bottlenecks = sorted.filter((d) => d.severity === 'bottleneck');
  const lastBottleneckId = bottlenecks[bottlenecks.length - 1]?.id ?? null;
  const confirmedBottlenecks = bottlenecks.filter((d) => d.agentId).length;

  return (
    <aside className="right-sidebar" style={{ width }}>
      <div
        className="panel-resize-handle"
        onMouseDown={onResizeStart}
        title="Drag to resize"
        role="separator"
        aria-orientation="vertical"
      />
      <button
        className="sidebar-collapse-btn"
        onClick={onCollapse}
        title="Hide right sidebar (R)"
      >
        ▶
      </button>
      <div className="sidebar-scroll">
      <>
      {headerContent}

      {capability && (
        <section className="panel-block cap-panel">
          <div className="cap-panel-head">
            <span
              className="cap-panel-chip"
              style={{ ['--palette-color' as string]: capability.color }}
            >
              {capability.category.toUpperCase()}
            </span>
            <h3 className="panel-title cap-panel-title">{capability.toolName}</h3>
            <button
              type="button"
              className="cap-panel-close"
              title="Close"
              onClick={() => onClearCapability?.()}
            >
              ✕
            </button>
          </div>
          <p className="cap-panel-node">
            Used by <strong>{capability.nodeLabel}</strong>
          </p>
          {capability.recommend ? (
            <>
              <div className="cap-panel-row">
                <span className="cap-panel-key cap-add">Recommended</span>
                <p className="cap-panel-val">{capability.recommend}</p>
              </div>
              <div className="cap-panel-row">
                <span className="cap-panel-key cap-why">Why it's better</span>
                <p className="cap-panel-val cap-muted">{capability.why}</p>
              </div>
            </>
          ) : (
            <p className="cap-panel-val cap-muted">
              No specific recommendation for this capability yet. It looks healthy as detected.
            </p>
          )}
        </section>
      )}

      {infra?.projectContext?.fromReadme && (
        <section className="panel-block ea-sidebar-readme-section" style={{ background: '#09090b', borderBottom: '1px solid #1a1a2e', padding: '10px 14px', fontSize: '11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontWeight: 'bold', color: '#e2e8f0' }}>{infra.projectContext.name}</span>
            <span style={{ fontSize: '9px', color: '#64748b' }}>📖 Read from README</span>
          </div>
          {infra.projectContext.purpose && (
            <p style={{ margin: 0, color: '#94a3b8', lineHeight: '1.4' }}>{infra.projectContext.purpose}</p>
          )}
        </section>
      )}

      {latest && (
        <DiagnosticPrompt
          diagnostic={latest}
          projectName={projectName}
          projectPath={projectPath}
          filePath={filePathForDiagnostic(latest, graph)}
        />
      )}

      {selectedNode && (
        <NodeInspector
          projectName={projectName}
          projectPath={projectPath}
          node={selectedNode}
          graph={graph}
          diagnostics={diagnostics}
          onOpenCode={onOpenCode}
        />
      )}

      {simulationContent && (
        <section className="panel-block simulation-sidebar-block">
          {simulationContent}
        </section>
      )}

      {intelligence && (
        <section className="panel-block">
          <h3 className="panel-title">Intelligence</h3>
          <p className="intel-summary">{intelligence.summary}</p>
          {intelligence.suggestedFeatures.length > 0 && (
            <>
              <h4 className="intel-sub">Suggested next</h4>
              <ul className="intel-list">
                {intelligence.suggestedFeatures.map((s) => (
                  <li key={s} className="intel-suggestion">
                    <span>{s}</span>
                    <CopyPromptButton
                      compact
                      prompt={() =>
                        promptForArchitectureSuggestion(s, {
                          projectPath,
                          context: intelligence.summary,
                        })
                      }
                    />
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      <section className="panel-block panel-grow" id="findings-panel-section">
        <h3 className="panel-title">
          Findings ({sorted.length})
          {sorted.length > 0 &&
            (hasAiFindings ? (
              <ConfidenceBadge tone="green">AI + Static</ConfidenceBadge>
            ) : (
              <ConfidenceBadge tone="static-blue">Static</ConfidenceBadge>
            ))}
          {stepFilter && (
            <button className="finding-filter-clear" onClick={onClearStepFilter}>
              filtered · clear ✕
            </button>
          )}
        </h3>
        <ul className="finding-list">
          {sorted.map((d) => (
            <Fragment key={d.id}>
              <li className={`finding sev-border-${d.severity}`}>
                <span className={`sev-badge sev-${d.severity}`}>
                  {d.severity === 'bottleneck' ? (d.bottleneckType ?? 'bottleneck') : d.severity}
                </span>
                {d.agentId ? (
                  <ConfidenceBadge tone="indigo">AI</ConfidenceBadge>
                ) : (
                  <ConfidenceBadge tone="gray">Static</ConfidenceBadge>
                )}
                {d.agentId && <span className="agent-origin-badge">{agentLabel(d.agentId)}</span>}
                <span className="finding-title">{d.title}</span>
                <CopyPromptButton
                  compact
                  prompt={() =>
                    buildFindingPrompt(d, {
                      projectName,
                      projectPath,
                      filePath: filePathForDiagnostic(d, graph),
                    })
                  }
                />
              </li>
              {d.id === lastBottleneckId && (
                <li className="finding-nudge-li">
                  {agentTeamHasRun ? (
                    <NudgeCard tone="green">
                      <NudgeText tone="green">
                        ✓ AI performance review complete · {confirmedBottlenecks} bottleneck
                        {confirmedBottlenecks === 1 ? '' : 's'} confirmed
                      </NudgeText>
                    </NudgeCard>
                  ) : (
                    <NudgeCard tone="amber">
                      <NudgeText tone="muted">
                        These are structural estimates based on graph shape.{' '}
                      </NudgeText>
                      <NudgeText tone="amber" onClick={openAgentTeam}>
                        ⚡ Run Agent Team to profile real hot paths and get code-specific performance
                        recommendations.
                      </NudgeText>
                    </NudgeCard>
                  )}
                </li>
              )}
            </Fragment>
          ))}
          {sorted.length === 0 && (
            <li className="file-empty">
              {stepFilter ? 'No findings for this step.' : 'No findings yet. Run checks.'}
            </li>
          )}
        </ul>
      </section>
      </>
      </div>
    </aside>
  );
}

/** The teaching panel for a single diagnostic, with optional build prompt. */
function DiagnosticPrompt({
  diagnostic,
  projectName,
  projectPath,
  filePath,
}: {
  diagnostic: Diagnostic;
  projectName: string | null;
  projectPath: string | null;
  filePath: string | null;
}) {
  const [copied, setCopied] = useState(false);

  const copyPrompt = async () => {
    if (!diagnostic.suggestedPrompt) return;
    try {
      await navigator.clipboard.writeText(diagnostic.suggestedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked; the prompt text is still visible below */
    }
  };

  return (
    <section className={`diagnostic-prompt sev-${diagnostic.severity}`}>
      <header className="diagnostic-head">
        <span className={`sev-badge sev-${diagnostic.severity}`}>
          {diagnostic.severity === 'bottleneck' ? (diagnostic.bottleneckType ?? 'bottleneck') : diagnostic.severity}
        </span>
        <h3>{diagnostic.title}</h3>
        <CopyPromptButton
          compact
          prompt={() => buildFindingPrompt(diagnostic, { projectName, projectPath, filePath })}
        />
      </header>
      <dl className="diagnostic-body">
        <dt>What</dt>
        <dd>{diagnostic.what}</dd>
        <dt>Why</dt>
        <dd>{diagnostic.why}</dd>
        {diagnostic.userThreshold && (
          <>
            <dt>At scale</dt>
            <dd>{diagnostic.userThreshold}</dd>
          </>
        )}
        <dt>How to fix</dt>
        <dd>{diagnostic.howToFix}</dd>
        <dt>Optimize further</dt>
        <dd>{diagnostic.optimization}</dd>
      </dl>

      {diagnostic.suggestedPrompt && (
        <div className="suggested-prompt">
          <div className="suggested-prompt-head">
            <span>Build prompt</span>
            <button className="btn copy-btn" onClick={copyPrompt}>
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
          </div>
          <pre className="suggested-prompt-body">{diagnostic.suggestedPrompt}</pre>
        </div>
      )}
    </section>
  );
}

/** Human-friendly label for a node kind, used in the inspector header. */
const KIND_LABEL: Record<string, string> = {
  component: 'Component',
  route: 'Route',
  endpoint: 'Endpoint',
  middleware: 'Middleware',
  auth: 'Auth',
  database: 'Database',
  'external-service': 'External Service',
  config: 'Config',
  mcp: 'MCP Server',
  unknown: 'Module',
};

/**
 * Plain-English description of what a node does, derived entirely from its name,
 * kind, lane, and how it connects to the rest of the graph. No AI call.
 */
function describeNode(node: CanvasNode, outgoing: CanvasNode[], incoming: CanvasNode[]): string {
  const name = node.label;
  const out = outgoing.length;
  const inc = incoming.length;
  const linksOut = out > 0 ? ` It sends data to ${out} ${out === 1 ? 'node' : 'nodes'}` : '';
  const linksIn = inc > 0 ? `${out > 0 ? ', and' : ' It'} is called by ${inc} ${inc === 1 ? 'node' : 'nodes'}` : '';
  const tail = linksOut || linksIn ? `${linksOut}${linksIn}.` : ' It has no detected connections yet.';

  switch (node.kind) {
    case 'component':
      return `"${name}" is a frontend UI component. It renders part of the interface and may hold local state or receive props.${tail}`;
    case 'route':
      return `"${name}" is a frontend route or page. It maps a URL to a screen and wires it to the components and data it needs.${tail}`;
    case 'endpoint':
      return `"${name}" is a backend API endpoint. It receives requests, runs server-side logic, and returns a response.${tail}`;
    case 'middleware':
      return `"${name}" is backend middleware. It intercepts requests in the pipeline to transform, validate, or guard them before they reach a handler.${tail}`;
    case 'auth':
      return `"${name}" is an authentication or authorization layer. It verifies identity and gates access to protected resources.${tail}`;
    case 'database':
      return `"${name}" is a database surface (a model, schema, or connection). It defines or accesses persisted data.${tail}`;
    case 'external-service':
      return `"${name}" is an external service or third-party API the project talks to.${tail}`;
    case 'config':
      return `"${name}" is a configuration or environment surface. It holds settings the rest of the system reads at runtime.${tail}`;
    case 'mcp':
      return `"${name}" is a Model Context Protocol server. It exposes tools or resources to AI clients over a local connection.${tail}`;
    default:
      return `"${name}" is a ${node.lane} module.${tail}`;
  }
}

/**
 * One connection row. When the connected node has a source file, the whole row
 * becomes a button that opens the Code Intelligence Panel for it (the same as
 * double-clicking that node on the canvas); otherwise it renders as a plain row.
 */
function ConnRow({
  link,
  dir,
  onOpenCode,
}: {
  link: NodeLink;
  dir: 'in' | 'out';
  onOpenCode?: (nodeId: string) => void;
}) {
  const canOpen = Boolean(link.node.filePath) && Boolean(onOpenCode);
  const open = () => {
    // No file path -> nothing to open; do nothing rather than error.
    if (!link.node.filePath || !onOpenCode) return;
    onOpenCode(link.node.id);
  };
  return (
    <li
      className={`node-conn-item${canOpen ? ' conn-clickable' : ''}`}
      role={canOpen ? 'button' : undefined}
      tabIndex={canOpen ? 0 : undefined}
      title={canOpen ? `Open ${link.node.filePath} in Code Intelligence` : undefined}
      onClick={canOpen ? open : undefined}
      onKeyDown={
        canOpen
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                open();
              }
            }
          : undefined
      }
    >
      <span className="conn-row-main">
        <span className="conn-op" style={{ color: OPERATION_COLORS[link.operation] }}>
          {link.operation}
        </span>
        <span className={`conn-arrow ${dir}`}>{dir === 'out' ? '→' : '←'}</span>
        <span className="conn-impact">{link.impactCount} affected</span>
      </span>
      <span className="conn-row-meta">
        <span className="conn-label">{link.node.label}</span>
        <span className="conn-kind">{KIND_LABEL[link.node.kind] ?? link.node.kind}</span>
      </span>
      {canOpen && <span className="conn-open-icon" aria-hidden="true">&lt;/&gt;</span>}
    </li>
  );
}

/** Node details plus a live preview of the file's contents (defaulting to a summary view). */
function NodeInspector({
  projectName,
  projectPath,
  node,
  graph,
  diagnostics,
  onOpenCode,
}: {
  projectName: string | null;
  projectPath: string | null;
  node: CanvasNode;
  graph: CanvasGraph;
  diagnostics: Diagnostic[];
  onOpenCode?: (nodeId: string) => void;
}) {
  // Derive connections and related findings from the in-memory analysis only.
  const { outgoing, incoming, relatedFindings, description, downstreamCount, dependentCount, affectedKinds } = useMemo(() => {
    const byId = new Map(graph.nodes.map((n) => [n.id, n]));
    const outLinks: NodeLink[] = [];
    const inLinks: NodeLink[] = [];
    const outgoingById = new Map<string, string[]>();
    const incomingById = new Map<string, string[]>();

    for (const e of graph.edges) {
      const out = outgoingById.get(e.source);
      if (out) out.push(e.target);
      else outgoingById.set(e.source, [e.target]);

      const inc = incomingById.get(e.target);
      if (inc) inc.push(e.source);
      else incomingById.set(e.target, [e.source]);
    }

    const reachableFrom = (startId: string, adjacency: Map<string, string[]>): Set<string> => {
      const seen = new Set<string>();
      const queue = [...(adjacency.get(startId) ?? [])];
      for (let i = 0; i < queue.length; i++) {
        const id = queue[i];
        if (id === startId || seen.has(id)) continue;
        seen.add(id);
        queue.push(...(adjacency.get(id) ?? []));
      }
      return seen;
    };

    const downstream = reachableFrom(node.id, outgoingById);
    const dependents = reachableFrom(node.id, incomingById);
    const kinds = new Map<string, number>();
    for (const id of downstream) {
      const kind = byId.get(id)?.kind;
      if (kind) kinds.set(kind, (kinds.get(kind) ?? 0) + 1);
    }

    for (const e of graph.edges) {
      if (e.source === node.id) {
        const target = byId.get(e.target);
        if (target) {
          const targetImpact = reachableFrom(target.id, outgoingById).size;
          outLinks.push({
            node: target,
            operation: inferOperation({
              otherKind: target.kind,
              edgeLabel: e.label,
              sourceHint: `${node.label} ${node.filePath ?? ''} ${target.label}`,
              direction: 'out',
            }),
            impactCount: targetImpact,
          });
        }
      }
      if (e.target === node.id) {
        const source = byId.get(e.source);
        if (source) {
          const sourceImpact = reachableFrom(source.id, outgoingById).size;
          inLinks.push({
            node: source,
            operation: inferOperation({
              otherKind: node.kind,
              edgeLabel: e.label,
              sourceHint: `${source.label} ${source.filePath ?? ''} ${node.label}`,
              direction: 'in',
            }),
            impactCount: sourceImpact,
          });
        }
      }
    }

    const findings = diagnostics.filter((d) => d.relatedNodeIds.includes(node.id));

    return {
      outgoing: outLinks,
      incoming: inLinks,
      relatedFindings: findings,
      downstreamCount: downstream.size,
      dependentCount: dependents.size,
      affectedKinds: [...kinds.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4),
      description: describeNode(
        node,
        outLinks.map((l) => l.node),
        inLinks.map((l) => l.node),
      ),
    };
  }, [graph, node, diagnostics]);

  return (
    <section className="panel-block">
      <h3 className="panel-title">Node details</h3>
      <div className="node-detail">
        <div className="node-detail-row">
          <span>Label</span>
          <strong>{node.label}</strong>
        </div>
        <div className="node-detail-row">
          <span>Type</span>
          <strong>{KIND_LABEL[node.kind] ?? node.kind}</strong>
        </div>
        <div className="node-detail-row">
          <span>Lane</span>
          <strong>{node.lane}</strong>
        </div>
        {node.filePath && (
          <div className="node-detail-row">
            <span>File</span>
            <strong className="mono">{node.filePath}</strong>
          </div>
        )}
      </div>

      <p className="node-description">{description}</p>

      <div className="node-impact-summary">
        <div className="node-impact-card">
          <span>Directly affects</span>
          <strong>{outgoing.length}</strong>
        </div>
        <div className="node-impact-card">
          <span>Downstream reach</span>
          <strong>{downstreamCount}</strong>
        </div>
        <div className="node-impact-card">
          <span>Relied on by</span>
          <strong>{dependentCount}</strong>
        </div>
      </div>

      {affectedKinds.length > 0 && (
        <div className="node-impact-kinds" aria-label="Affected node types">
          {affectedKinds.map(([kind, count]) => (
            <span key={kind}>
              {count} {KIND_LABEL[kind] ?? kind}
            </span>
          ))}
        </div>
      )}

      <div className="node-connections">
        <div className="node-conn-group">
          <h4 className="node-conn-title">Connects to ({outgoing.length})</h4>
          {outgoing.length === 0 ? (
            <p className="file-empty">No outgoing connections.</p>
          ) : (
            <ul className="node-conn-list">
              {outgoing.map((l) => (
                <ConnRow key={`out-${l.node.id}`} link={l} dir="out" onOpenCode={onOpenCode} />
              ))}
            </ul>
          )}
        </div>

        <div className="node-conn-group">
          <h4 className="node-conn-title">Connected from ({incoming.length})</h4>
          {incoming.length === 0 ? (
            <p className="file-empty">No incoming connections.</p>
          ) : (
            <ul className="node-conn-list">
              {incoming.map((l) => (
                <ConnRow key={`in-${l.node.id}`} link={l} dir="in" onOpenCode={onOpenCode} />
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="node-conn-group">
        <h4 className="node-conn-title">Related findings ({relatedFindings.length})</h4>
        {relatedFindings.length === 0 ? (
          <p className="file-empty">No findings for this node.</p>
        ) : (
          <ul className="finding-list">
            {relatedFindings.map((d) => (
              <li key={d.id} className={`finding sev-border-${d.severity}`}>
                <span className={`sev-badge sev-${d.severity}`}>
                  {d.severity === 'bottleneck' ? (d.bottleneckType ?? 'bottleneck') : d.severity}
                </span>
                <span className="finding-title">
                  {d.title}
                  {d.userThreshold && <em className="finding-threshold"> · {d.userThreshold}</em>}
                </span>
                <CopyPromptButton
                  compact
                  prompt={() =>
                    buildFindingPrompt(d, {
                      projectName,
                      projectPath,
                      filePath: node.filePath ?? null,
                    })
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
