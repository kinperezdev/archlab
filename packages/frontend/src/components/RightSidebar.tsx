/**
 * Right sidebar: the Diagnostic Prompt (teaching panel for the latest issue,
 * including a copy-paste build prompt for architecture advisories), selected-
 * node details with a live "what's inside" file preview, project intelligence,
 * and the running findings list.
 */

import { useMemo, useState } from 'react';
import {
  type CanvasGraph,
  type CanvasNode,
  type Diagnostic,
  type PipelineStepId,
  type ProjectIntelligence,
  type Severity,
} from '@archlab/shared';
import { CopyPromptButton } from './CopyPromptButton.js';
import {
  promptForDiagnostic,
  promptForArchitectureSuggestion,
  promptForBottleneck,
} from '../lib/prompts.js';
import { inferOperation, OPERATION_COLORS, type Operation } from '../lib/operations.js';

interface NodeLink {
  node: CanvasNode;
  operation: Operation;
}

interface RightSidebarProps {
  projectId: string | null;
  projectName: string | null;
  projectPath: string | null;
  graph: CanvasGraph;
  diagnostics: Diagnostic[];
  selectedNode: CanvasNode | null;
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
}

const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'bottleneck', 'medium', 'low', 'info'];

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
  intelligence,
  onCollapse,
  width,
  onResizeStart,
  stepFilter,
  onClearStepFilter,
}: RightSidebarProps) {
  const latest = diagnostics[diagnostics.length - 1] ?? null;
  // When a Security step tag is active, show only that step's findings.
  const visibleDiagnostics = stepFilter
    ? diagnostics.filter((d) => d.step === stepFilter)
    : diagnostics;
  const sorted = [...visibleDiagnostics].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
  );

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
        className="sidebar-edge-toggle"
        onClick={onCollapse}
        title="Hide right sidebar"
      >
        ▶
      </button>
      <div className="sidebar-scroll">
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
        />
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

      <section className="panel-block panel-grow">
        <h3 className="panel-title">
          Findings ({sorted.length})
          {stepFilter && (
            <button className="finding-filter-clear" onClick={onClearStepFilter}>
              filtered · clear ✕
            </button>
          )}
        </h3>
        <ul className="finding-list">
          {sorted.map((d) => (
            <li key={d.id} className={`finding sev-border-${d.severity}`}>
              <span className={`sev-badge sev-${d.severity}`}>
                {d.severity === 'bottleneck' ? (d.bottleneckType ?? 'bottleneck') : d.severity}
              </span>
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
          ))}
          {sorted.length === 0 && (
            <li className="file-empty">
              {stepFilter ? 'No findings for this step.' : 'No findings yet. Run checks.'}
            </li>
          )}
        </ul>
      </section>
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

/** Node details plus a live preview of the file's contents (defaulting to a summary view). */
function NodeInspector({
  projectName,
  projectPath,
  node,
  graph,
  diagnostics,
}: {
  projectName: string | null;
  projectPath: string | null;
  node: CanvasNode;
  graph: CanvasGraph;
  diagnostics: Diagnostic[];
}) {
  // Derive connections and related findings from the in-memory analysis only.
  const { outgoing, incoming, relatedFindings, description } = useMemo(() => {
    const byId = new Map(graph.nodes.map((n) => [n.id, n]));
    const outLinks: NodeLink[] = [];
    const inLinks: NodeLink[] = [];

    for (const e of graph.edges) {
      if (e.source === node.id) {
        const target = byId.get(e.target);
        if (target) {
          outLinks.push({
            node: target,
            operation: inferOperation({
              otherKind: target.kind,
              edgeLabel: e.label,
              sourceHint: `${node.label} ${node.filePath ?? ''} ${target.label}`,
              direction: 'out',
            }),
          });
        }
      }
      if (e.target === node.id) {
        const source = byId.get(e.source);
        if (source) {
          inLinks.push({
            node: source,
            operation: inferOperation({
              otherKind: node.kind,
              edgeLabel: e.label,
              sourceHint: `${source.label} ${source.filePath ?? ''} ${node.label}`,
              direction: 'in',
            }),
          });
        }
      }
    }

    const findings = diagnostics.filter((d) => d.relatedNodeIds.includes(node.id));

    return {
      outgoing: outLinks,
      incoming: inLinks,
      relatedFindings: findings,
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

      <div className="node-connections">
        <div className="node-conn-group">
          <h4 className="node-conn-title">Connects to ({outgoing.length})</h4>
          {outgoing.length === 0 ? (
            <p className="file-empty">No outgoing connections.</p>
          ) : (
            <ul className="node-conn-list">
              {outgoing.map((l) => (
                <li key={`out-${l.node.id}`} className="node-conn-item">
                  <span className="conn-op" style={{ color: OPERATION_COLORS[l.operation] }}>
                    {l.operation}
                  </span>
                  <span className="conn-arrow out">→</span>
                  <span className="conn-label">{l.node.label}</span>
                  <span className="conn-kind">{KIND_LABEL[l.node.kind] ?? l.node.kind}</span>
                </li>
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
                <li key={`in-${l.node.id}`} className="node-conn-item">
                  <span className="conn-op" style={{ color: OPERATION_COLORS[l.operation] }}>
                    {l.operation}
                  </span>
                  <span className="conn-arrow in">←</span>
                  <span className="conn-label">{l.node.label}</span>
                  <span className="conn-kind">{KIND_LABEL[l.node.kind] ?? l.node.kind}</span>
                </li>
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
