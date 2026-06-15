/**
 * System Design tab.
 *
 * Two modes, toggled top-left:
 *  - Detected Mode: auto-maps infrastructure detected from the analyzed project
 *    into three layers (edge / application / data), shows smart suggestions with
 *    Copy Prompt, a Security Layer overlay (encrypted vs unencrypted lines), and
 *    a detail panel showing the exact code that triggered each detection.
 *  - Design Mode: a free canvas to plan new architecture. Nodes are placed with a
 *    reliable mousedown-ghost drag (no HTML5 drag API), connected with labeled
 *    arrows, renamed inline, and persisted to brain/system-design.json.
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
  EncryptionState,
  InfraNodeType,
  InfraSuggestion,
  SystemDesignMap,
} from '@archlab/shared';
import { CopyPromptButton } from '../components/CopyPromptButton.js';
import { loadSystemDesign, saveSystemDesign } from '../lib/systemDesignStore.js';
import { InfraNode, type InfraNodeData } from './InfraNode.js';
import { INFRA_TYPES, LAYERS, LAYER_LABEL, infraMeta } from './infraCatalog.js';

const nodeTypes = { infra: InfraNode };

type Mode = 'detected' | 'design';

interface SystemDesignProps {
  infra: SystemDesignMap | null;
  hasProject: boolean;
}

/** Stroke color for a connection given its encryption state. */
function encColor(enc: EncryptionState): string {
  return enc === 'encrypted' ? '#10b981' : enc === 'unencrypted' ? '#ef4444' : '#f59e0b';
}

// ---------------------------------------------------------------------------
// Detected Mode
// ---------------------------------------------------------------------------

function DetectedMode({ infra }: { infra: SystemDesignMap }) {
  const [showSecurity, setShowSecurity] = useState(false);
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

  return (
    <div className="sd-detected">
      <div className="sd-toolbar">
        <label className="sd-security-toggle">
          <input type="checkbox" checked={showSecurity} onChange={(e) => setShowSecurity(e.target.checked)} />
          Show Security Layer
        </label>
        {showSecurity && (
          <div className="sd-legend">
            <span><i style={{ background: '#10b981' }} /> encrypted</span>
            <span><i style={{ background: '#ef4444' }} /> unencrypted</span>
            <span><i style={{ background: '#f59e0b' }} /> unknown</span>
          </div>
        )}
      </div>

      <div className="sd-canvas-wrap">
        <LayerBands />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={(_e, n) => {
            setSelectedId(n.id);
            // Pub/Sub nodes expand/collapse on click.
            setExpanded((prev) => {
              const next = new Set(prev);
              if (next.has(n.id)) next.delete(n.id);
              else next.add(n.id);
              return next;
            });
          }}
          onPaneClick={() => setSelectedId(null)}
          fitView
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1.5} color="#e2e8f0" />
          <MiniMap pannable zoomable className="arch-minimap" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      {/* Detail / suggestions side panel */}
      <aside className="sd-panel">
        {selectedNode ? (
          <div>
            <h4 className="sd-panel-title">
              {infraMeta(selectedNode.type).glyph} {selectedNode.label}
            </h4>
            <p className="sd-panel-sub">{LAYER_LABEL[selectedNode.layer]} · detected from code</p>
            <h5 className="sd-panel-heading">Detection source</h5>
            {selectedNode.evidence.length === 0 && <p className="sd-empty">No evidence captured.</p>}
            {selectedNode.evidence.map((ev, i) => (
              <div key={i} className="sd-evidence">
                <div className="sd-evidence-file">{ev.file}</div>
                <div className="sd-evidence-pattern">{ev.pattern}</div>
                {ev.snippet && <code className="sd-evidence-snippet">{ev.snippet}</code>}
              </div>
            ))}
          </div>
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
              <button key={s.id} className="sd-sugg-card" onClick={() => setSelectedId(s.id)}>
                <div className="sd-sugg-head">
                  <span className="sd-sugg-title">{s.title}</span>
                  <span className={`sd-risk sd-risk-${s.risk}`}>{s.risk} risk</span>
                </div>
                <p className="sd-sugg-why">{s.why}</p>
              </button>
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

/** The three labeled horizontal layer bands behind the canvas. */
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
// Design Mode — free canvas with mousedown-ghost drag (no HTML5 drag API)
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

  // Load saved design canvas once.
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

  // Persist on change after load.
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

  // --- mousedown-ghost drag ---
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

  // Palette grouped by layer.
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
          <Background variant={BackgroundVariant.Dots} gap={22} size={1.5} color="#cbd5e1" />
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

export function SystemDesign({ infra, hasProject }: SystemDesignProps) {
  const [mode, setMode] = useState<Mode>('detected');

  return (
    <div className="sd-root">
      <div className="sd-mode-switch">
        <button
          className={`sd-mode-btn ${mode === 'detected' ? 'active' : ''}`}
          onClick={() => setMode('detected')}
        >
          Detected Mode
        </button>
        <button
          className={`sd-mode-btn ${mode === 'design' ? 'active' : ''}`}
          onClick={() => setMode('design')}
        >
          Design Mode
        </button>
      </div>

      {mode === 'detected' ? (
        !hasProject || !infra ? (
          <div className="sd-placeholder">
            <p>Analyze a project to auto-map its infrastructure.</p>
            <p className="sd-placeholder-sub">Or switch to Design Mode to plan new architecture from scratch.</p>
          </div>
        ) : (
          <ReactFlowProvider>
            <DetectedMode infra={infra} />
          </ReactFlowProvider>
        )
      ) : (
        <ReactFlowProvider>
          <DesignModeInner />
        </ReactFlowProvider>
      )}
    </div>
  );
}
