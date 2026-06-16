import { useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  MarkerType,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from 'reactflow';
import type { CanvasGraph, CanvasNode, Diagnostic } from '@archlab/shared';
import { ArchNode, type ArchNodeData, type PortInfo } from './ArchNode.js';
import { LaneGroup, type LaneVariant, type LaneGroupData } from './LaneGroup.js';
import { inferOperation, destinationLabel, OPERATION_COLORS } from '../lib/operations.js';

const nodeTypes = { arch: ArchNode, laneGroup: LaneGroup };

/** Hex colors per node kind, mirroring the --kind-* tokens, for the minimap. */
const KIND_COLORS: Record<string, string> = {
  component: '#2dd4bf',
  route: '#c084fc',
  endpoint: '#34d399',
  middleware: '#fbbf24',
  auth: '#f87171',
  database: '#60a5fa',
  'external-service': '#fb7185',
  config: '#a1a1aa',
  mcp: '#ec4899',
  unknown: '#52525b',
};

/** Color a node dot on the minimap by its kind; lane backdrops stay transparent. */
function minimapNodeColor(node: { type?: string; data?: { kind?: string } }): string {
  if (node.type === 'laneGroup') return 'transparent';
  return KIND_COLORS[node.data?.kind ?? 'unknown'] ?? KIND_COLORS.unknown;
}

/** Build operation-labeled incoming/outgoing connector ports for a backend node. */
function portsFor(
  nodeId: string,
  graph: CanvasGraph,
  degree: Map<string, number>,
): { incoming: PortInfo[]; outgoing: PortInfo[] } {
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const self = byId.get(nodeId);
  const incoming: PortInfo[] = [];
  const outgoing: PortInfo[] = [];

  for (const e of graph.edges) {
    // Outgoing: this node -> other. Operation reflects what this node does.
    if (e.source === nodeId) {
      const other = byId.get(e.target);
      const operation = inferOperation({
        otherKind: other?.kind,
        edgeLabel: e.label,
        sourceHint: `${self?.label ?? ''} ${self?.filePath ?? ''} ${other?.label ?? ''}`,
        direction: 'out',
      });
      outgoing.push({
        operation,
        color: OPERATION_COLORS[operation],
        destination: destinationLabel(other),
        direction: 'out',
        sourceFile: self?.filePath,
        sourceLabel: self?.label ?? nodeId,
        impactCount: Math.max(0, (degree.get(e.target) ?? 1) - 1),
      });
    }
    // Incoming: other -> this node. Source is the other node.
    if (e.target === nodeId) {
      const other = byId.get(e.source);
      const operation = inferOperation({
        otherKind: self?.kind,
        edgeLabel: e.label,
        sourceHint: `${other?.label ?? ''} ${other?.filePath ?? ''} ${self?.label ?? ''}`,
        direction: 'in',
      });
      incoming.push({
        operation,
        color: OPERATION_COLORS[operation],
        destination: destinationLabel(self),
        direction: 'in',
        sourceFile: other?.filePath,
        sourceLabel: other?.label ?? e.source,
        impactCount: Math.max(0, (degree.get(nodeId) ?? 1) - 1),
      });
    }
  }
  return { incoming, outgoing };
}

/** Connection degree per node id, for impact estimation. */
function degreeMap(graph: CanvasGraph): Map<string, number> {
  const d = new Map<string, number>();
  for (const e of graph.edges) {
    d.set(e.source, (d.get(e.source) ?? 0) + 1);
    d.set(e.target, (d.get(e.target) ?? 0) + 1);
  }
  return d;
}

/** Why an isolated (edge-less) node of a given kind might be a problem. */
function isolationReasonFor(kind: string): string {
  switch (kind) {
    case 'component': return 'Unused component';
    case 'route': return 'Unreachable route';
    case 'endpoint': return 'Unreachable endpoint';
    case 'middleware': return 'Unused middleware';
    case 'auth': return 'Detached auth layer';
    case 'database': return 'Orphaned model';
    case 'external-service': return 'Disconnected service';
    case 'mcp': return 'Disconnected service';
    case 'config': return 'Unreferenced config';
    default: return 'Orphaned node';
  }
}

// Estimated node footprint, used only to size the swim-lane background boxes.
const NODE_W = 240;
const NODE_H = 110;
const LANE_PAD = 70; // breathing room around the group
const LANE_PAD_TOP = 96; // extra room at the top for the lane label

/** Build a tinted background container node that wraps a lane's nodes. */
function buildLaneGroup(
  id: string,
  label: string,
  variant: LaneVariant,
  laneNodes: CanvasNode[],
) {
  const minX = Math.min(...laneNodes.map((n) => n.position.x));
  const minY = Math.min(...laneNodes.map((n) => n.position.y));
  const maxX = Math.max(...laneNodes.map((n) => n.position.x)) + NODE_W;
  const maxY = Math.max(...laneNodes.map((n) => n.position.y)) + NODE_H;

  const width = maxX - minX + LANE_PAD * 2;
  const height = maxY - minY + LANE_PAD + LANE_PAD_TOP;

  return {
    id,
    type: 'laneGroup',
    position: { x: minX - LANE_PAD, y: minY - LANE_PAD_TOP },
    data: { label, variant, width, height },
    draggable: false,
    selectable: false,
    zIndex: -1,
  };
}

interface CanvasProps {
  graph: CanvasGraph;
  diagnostics: Diagnostic[];
  onSelectNode: (nodeId: string | null) => void;
  /** Double-click a node: open the Code Intelligence Panel for it. */
  onOpenCode: (nodeId: string) => void;
  selectedNodeId: string | null;
  filter: 'all' | 'frontend' | 'backend' | 'api' | 'security';
}

interface EdgeRef {
  id: string;
  source: string;
  target: string;
}

export function Canvas({ graph, diagnostics, onSelectNode, onOpenCode, selectedNodeId, filter }: CanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<ArchNodeData | LaneGroupData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<{ source: string; target: string } | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  // A clicked node locks its highlight on until the user clicks the canvas
  // background or presses Escape. Only one node can be locked at a time.
  const [lockedNodeId, setLockedNodeId] = useState<string | null>(null);

  // Hovering any node overrides the displayed highlight; otherwise the locked
  // node (if any) keeps its connections lit.
  const activeNodeId = hoveredNodeId ?? lockedNodeId;
  const [selectedEdges, setSelectedEdges] = useState<Record<string, EdgeRef>>({});
  const { setCenter } = useReactFlow();

  // Escape releases the locked node highlight.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLockedNodeId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Node ids flagged by security: anything the security-checks step raised, or
  // any critical/high finding, drives the Security tab's node selection.
  const securityNodeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const d of diagnostics) {
      if (d.step === 'security-checks' || d.severity === 'critical' || d.severity === 'high') {
        for (const id of d.relatedNodeIds) ids.add(id);
      }
    }
    return ids;
  }, [diagnostics]);

  // Which nodes belong on screen for the active filter. Lane tabs filter by
  // lane; API shows route/endpoint nodes; Security shows auth, middleware, and
  // security-flagged nodes. API and Security also pull in directly connected
  // neighbors so the matched nodes are shown with their connections.
  const filteredNodes = useMemo(() => {
    const isMatch = (n: CanvasNode): boolean => {
      switch (filter) {
        case 'frontend':
          return n.lane === 'frontend';
        case 'backend':
          return n.lane === 'backend' || n.lane === 'external';
        case 'api':
          return n.kind === 'route' || n.kind === 'endpoint';
        case 'security':
          return n.kind === 'auth' || n.kind === 'middleware' || securityNodeIds.has(n.id);
        default:
          return true;
      }
    };

    const base = new Set<string>();
    for (const n of graph.nodes) if (isMatch(n)) base.add(n.id);

    if (filter === 'api' || filter === 'security') {
      const seed = new Set(base);
      for (const e of graph.edges) {
        if (seed.has(e.source)) base.add(e.target);
        if (seed.has(e.target)) base.add(e.source);
      }
    }

    return graph.nodes.filter((n) => base.has(n.id));
  }, [graph.nodes, graph.edges, filter, securityNodeIds]);

  // Split the visible nodes into Connected (≥1 edge) and Isolated (no edges).
  // Isolated nodes are relocated into a dedicated grid below the connected
  // graph so the two regions read as clearly separate containers.
  const { layoutNodes, isolatedIds } = useMemo(() => {
    const visibleIds = new Set(filteredNodes.map((n) => n.id));
    const degree = new Map<string, number>();
    for (const e of graph.edges) {
      if (visibleIds.has(e.source) && visibleIds.has(e.target)) {
        degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
        degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
      }
    }
    const connected = filteredNodes.filter((n) => (degree.get(n.id) ?? 0) > 0);
    const isolated = filteredNodes.filter((n) => (degree.get(n.id) ?? 0) === 0);

    const baseX = connected.length ? Math.min(...connected.map((n) => n.position.x)) : 120;
    const maxY = connected.length ? Math.max(...connected.map((n) => n.position.y)) + NODE_H : 120;
    // Drop the Isolated zone well below the Connected graph, with room for its label.
    const zoneTop = maxY + 280;

    const COLS = 4;
    const CELL_W = 320;
    const CELL_H = 200;
    const isoPos = new Map<string, { x: number; y: number }>();
    isolated.forEach((n, i) => {
      isoPos.set(n.id, {
        x: baseX + (i % COLS) * CELL_W,
        y: zoneTop + Math.floor(i / COLS) * CELL_H,
      });
    });

    const laid = filteredNodes.map((n) =>
      isoPos.has(n.id) ? { ...n, position: isoPos.get(n.id)! } : n,
    );
    return { layoutNodes: laid, isolatedIds: new Set(isolated.map((n) => n.id)) };
  }, [filteredNodes, graph.edges]);

  // Detect each lane's entry point and every node's depth from it. Entry points
  // are matched by conventional filename first (main/index/app/server), with a
  // fallback to the node that imports the most and is imported the least.
  const { entryIds, depthByNode } = useMemo(() => {
    const FRONTEND_ENTRY = /(^|\/)(main|index|app)\.(tsx|jsx|ts|js)$/i;
    const BACKEND_ENTRY = /(^|\/)(index|app|server|main)\.(ts|js|mjs|cjs)$/i;

    const outDeg = new Map<string, number>();
    const inDeg = new Map<string, number>();
    for (const e of graph.edges) {
      outDeg.set(e.source, (outDeg.get(e.source) ?? 0) + 1);
      inDeg.set(e.target, (inDeg.get(e.target) ?? 0) + 1);
    }

    const entries = new Set<string>();
    const detectFor = (lane: string, re: RegExp) => {
      const laneNodes = graph.nodes.filter((n) => n.lane === lane);
      const named = laneNodes.filter((n) => n.filePath && re.test(n.filePath));
      if (named.length > 0) {
        named.forEach((n) => entries.add(n.id));
        return;
      }
      // Fallback: the file that imports everything but is imported by nothing.
      let best: string | null = null;
      let bestScore = -Infinity;
      for (const n of laneNodes) {
        const score = (outDeg.get(n.id) ?? 0) - (inDeg.get(n.id) ?? 0);
        if (score > bestScore) {
          bestScore = score;
          best = n.id;
        }
      }
      if (best && (outDeg.get(best) ?? 0) > 0) entries.add(best);
    };
    detectFor('frontend', FRONTEND_ENTRY);
    detectFor('backend', BACKEND_ENTRY);

    // Multi-source BFS over undirected edges to assign a depth to every node.
    const adj = new Map<string, string[]>();
    const link = (a: string, b: string) => {
      const list = adj.get(a);
      if (list) list.push(b);
      else adj.set(a, [b]);
    };
    for (const e of graph.edges) {
      link(e.source, e.target);
      link(e.target, e.source);
    }

    const depth = new Map<string, number>();
    const queue: string[] = [];
    for (const id of entries) {
      depth.set(id, 0);
      queue.push(id);
    }
    for (let head = 0; head < queue.length; head++) {
      const cur = queue[head];
      const d = depth.get(cur)!;
      for (const nb of adj.get(cur) ?? []) {
        if (!depth.has(nb)) {
          depth.set(nb, d + 1);
          queue.push(nb);
        }
      }
    }

    return { entryIds: entries, depthByNode: depth };
  }, [graph.nodes, graph.edges]);

  // Structural signature: only the SET of visible nodes and their (laid-out)
  // positions. This intentionally excludes animation state, so the live
  // pipeline (which streams hundreds of node-animate updates) does NOT rebuild.
  const structureKey = useMemo(
    () =>
      layoutNodes
        .map((n) => `${n.id}@${n.position.x},${n.position.y}${isolatedIds.has(n.id) ? '!' : ''}`)
        .join('|') +
      // Edge signature so backend connector ports refresh when edges change.
      `#${graph.edges.length}` +
      // Entry/depth signature so the hierarchy badges refresh on re-analysis.
      `~${[...entryIds].sort().join(',')}~${depthByNode.size}`,
    [layoutNodes, isolatedIds, graph.edges.length, entryIds, depthByNode],
  );

  // Auto-center viewport ONLY when the node selection actually changes. Uses the
  // laid-out positions so selecting an isolated node pans to its relocated spot.
  useEffect(() => {
    if (!selectedNodeId) return;
    const graphNode = layoutNodes.find((n) => n.id === selectedNodeId);
    if (graphNode) {
      // Smoothly pan to the node coordinates, placing it in the center. Zoom scale: 1.1.
      setCenter(graphNode.position.x + 80, graphNode.position.y + 40, {
        zoom: 1.1,
        duration: 400,
      });
    }
  }, [selectedNodeId, layoutNodes, setCenter]);

  // Background swim-lane containers, sized to wrap each lane's nodes. Rendered
  // behind the real nodes (zIndex -1) so the Frontend/Backend split is obvious.
  // Memoized on structureKey so it does not recalculate on animation updates.
  const laneGroups = useMemo(() => {
    const groups: ReturnType<typeof buildLaneGroup>[] = [];
    const connected = layoutNodes.filter((n) => !isolatedIds.has(n.id));
    const isolated = layoutNodes.filter((n) => isolatedIds.has(n.id));
    if (connected.length > 0) {
      groups.push(buildLaneGroup('__lane_connected', 'Connected', 'connected', connected));
    }
    if (isolated.length > 0) {
      groups.push(buildLaneGroup('__lane_isolated', 'Isolated', 'isolated', isolated));
    }
    return groups;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structureKey]);

  // 1. Build the node set ONLY when the structure changes (new project, new
  //    nodes, filter switch). Never on a pipeline animation tick, so nodes are
  //    never cleared or rebuilt mid-run.
  useEffect(() => {
    const degree = degreeMap(graph);
    const realNodes = layoutNodes.map((n) => {
      const isIsolated = isolatedIds.has(n.id);
      return {
        id: n.id,
        type: 'arch',
        position: n.position,
        data: {
          label: n.label,
          kind: n.kind,
          animation: n.animation,
          filePath: n.filePath,
          meta: n.meta,
          isHighlighted: false,
          isDimmed: false,
          isIsolated,
          isolationReason: isIsolated ? isolationReasonFor(n.kind) : undefined,
          isEntry: entryIds.has(n.id),
          depth: depthByNode.get(n.id),
          // Backend nodes get explicit operation-labeled connector ports.
          ports: n.lane === 'backend' && !isIsolated ? portsFor(n.id, graph, degree) : undefined,
        },
      };
    });
    // Lane backgrounds first so they paint behind the real nodes.
    setNodes([...laneGroups, ...realNodes]);
    // filteredNodes is captured via structureKey and stable laneGroups to avoid
    // rebuilds on every animation frame; positions/ids are what actually matter here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structureKey, setNodes]);

  // 1b. Patch live animation state onto the EXISTING nodes in place. This is
  //     what the pipeline drives: color/glow updates only, nodes stay mounted.
  useEffect(() => {
    const animById = new Map(graph.nodes.map((n) => [n.id, n.animation]));
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        // Lane-group backgrounds carry no animation; skip them.
        if (!('animation' in node.data)) return node;
        const animation = animById.get(node.id);
        if (animation === undefined || animation === node.data.animation) return node;
        return { ...node, data: { ...node.data, animation } };
      }),
    );
  }, [graph.nodes, setNodes]);

  // 1c. Patch bottleneck flags (amber) onto nodes from bottleneck diagnostics.
  const bottleneckById = useMemo(() => {
    const map = new Map<string, Diagnostic>();
    for (const d of diagnostics) {
      if (d.severity !== 'bottleneck') continue;
      for (const id of d.relatedNodeIds) if (!map.has(id)) map.set(id, d);
    }
    return map;
  }, [diagnostics]);

  useEffect(() => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (!('kind' in node.data)) return node;
        const d = bottleneckById.get(node.id);
        const isBottleneck = Boolean(d);
        if (Boolean(node.data.isBottleneck) === isBottleneck && node.data.bottleneckType === d?.bottleneckType) {
          return node;
        }
        return {
          ...node,
          data: {
            ...node.data,
            isBottleneck,
            bottleneckType: d?.bottleneckType,
            bottleneckHint: d ? d.what : undefined,
          },
        };
      }),
    );
  }, [bottleneckById, setNodes]);

  // 2. Update hover/click highlight/dim states on existing nodes without changing positions
  useEffect(() => {
    const hasSelection = Object.keys(selectedEdges).length > 0;
    const activeHighlightNodes = new Set<string>();

    // Priority: an active node (hovered, or locked by a click) beats a hovered
    // edge beats a click-selected edge.
    if (activeNodeId) {
      // The active node plus every node directly connected to it by an edge.
      activeHighlightNodes.add(activeNodeId);
      for (const e of graph.edges) {
        if (e.source === activeNodeId) activeHighlightNodes.add(e.target);
        if (e.target === activeNodeId) activeHighlightNodes.add(e.source);
      }
    } else if (hoveredEdge) {
      activeHighlightNodes.add(hoveredEdge.source);
      activeHighlightNodes.add(hoveredEdge.target);
    } else if (hasSelection) {
      // Otherwise highlight all endpoints of all selected edges
      Object.values(selectedEdges).forEach((edge) => {
        activeHighlightNodes.add(edge.source);
        activeHighlightNodes.add(edge.target);
      });
    }

    const hasActiveHighlight = activeNodeId !== null || hoveredEdge !== null || hasSelection;

    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        // Leave background lane containers untouched.
        if (!('kind' in node.data)) return node;
        const isHighlighted = hasActiveHighlight ? activeHighlightNodes.has(node.id) : false;
        const isDimmed = hasActiveHighlight ? !activeHighlightNodes.has(node.id) : false;
        return {
          ...node,
          data: {
            ...node.data,
            isHighlighted,
            isDimmed,
          },
        };
      })
    );
  }, [activeNodeId, hoveredEdge, selectedEdges, graph.edges, setNodes]);

  // 3. Sync edges when graph, filter, hover, or selection states change
  useEffect(() => {
    const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
    const hasSelection = Object.keys(selectedEdges).length > 0;
    const hasActiveHighlight = activeNodeId !== null || hoveredEdgeId !== null || hasSelection;

    const nextEdges = graph.edges
      .filter((e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target))
      .map((e) => {
        const isSelected = Boolean(selectedEdges[e.id]);
        const isHovered = e.id === hoveredEdgeId;
        // Edges touching the active (hovered or locked) node trace its data flow.
        const isConnectedToActiveNode =
          activeNodeId !== null && (e.source === activeNodeId || e.target === activeNodeId);
        const isActive = isHovered || isSelected || isConnectedToActiveNode;
        const isDimmed = hasActiveHighlight ? !isActive : false;

        return {
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
          // Clean right-angled routing instead of diagonal lines crossing over
          // everything. Higher curvature so edges arc around nodes, and a low
          // zIndex so edges always paint behind the nodes (never on top).
          type: 'smoothstep',
          pathOptions: { borderRadius: 28 },
          zIndex: 0,
          animated: e.animated || isActive,
          className: (e.animated || isActive) ? 'edge-flowing' : undefined,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 16,
            height: 16,
            color: isActive ? '#0d99ff' : '#a1a1aa',
          },
          style: {
            strokeWidth: isActive ? 3 : 2,
            stroke: isActive ? '#0d99ff' : '#a1a1aa',
            opacity: isDimmed ? 0.25 : 1,
            transition: 'stroke 0.15s ease, stroke-width 0.15s ease, opacity 0.15s ease',
          },
        };
      });

    setEdges(nextEdges);
  }, [graph.edges, filteredNodes, activeNodeId, hoveredEdgeId, selectedEdges, setEdges]);

  // 4. Auto Arrange nodes back to their default layout positions
  const handleAutoArrange = () => {
    const realNodes = layoutNodes.map((n) => {
      const isIsolated = isolatedIds.has(n.id);
      return {
        id: n.id,
        type: 'arch',
        position: { ...n.position },
        data: {
          label: n.label,
          kind: n.kind,
          animation: n.animation,
          filePath: n.filePath,
          meta: n.meta,
          isHighlighted: false,
          isDimmed: false,
          isIsolated,
          isolationReason: isIsolated ? isolationReasonFor(n.kind) : undefined,
          isEntry: entryIds.has(n.id),
          depth: depthByNode.get(n.id),
        },
      };
    });
    setNodes([...laneGroups, ...realNodes]);
  };

  return (
    <div className="canvas-wrap">
      {graph.nodes.length === 0 ? (
        <div className="canvas-empty">
          <h2>No project loaded</h2>
          <p>Enter a project folder path in the top bar and click Analyze to generate the canvas.</p>
        </div>
      ) : (
        <>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.1}
            onNodeClick={(_e, node) => {
              if (node.type === 'laneGroup') return;
              onSelectNode(node.id);
              setSelectedEdges({});
              // Lock this node's highlight (switching the lock off any prior one).
              setLockedNodeId(node.id);
            }}
            onNodeDoubleClick={(_e, node) => {
              if (node.type === 'laneGroup') return;
              // Double-click opens the Code Intelligence Panel for this node.
              onSelectNode(node.id);
              setLockedNodeId(node.id);
              onOpenCode(node.id);
            }}
            onNodeMouseEnter={(_e, node) => {
              // Lane backgrounds are not interactive targets.
              if (node.type === 'laneGroup') return;
              setHoveredNodeId(node.id);
            }}
            onNodeMouseLeave={() => setHoveredNodeId(null)}
            onPaneClick={() => {
              onSelectNode(null);
              setSelectedEdges({});
              // Clicking the canvas background releases the locked node.
              setLockedNodeId(null);
            }}
            onEdgeClick={(_e, edge) => {
              setSelectedEdges((prev) => {
                const next = { ...prev };
                if (next[edge.id]) {
                  delete next[edge.id];
                } else {
                  next[edge.id] = { id: edge.id, source: edge.source, target: edge.target };
                }
                return next;
              });
              onSelectNode(null);
            }}
            onEdgeMouseEnter={(_e, edge) => {
              setHoveredEdgeId(edge.id);
              setHoveredEdge({ source: edge.source, target: edge.target });
            }}
            onEdgeMouseLeave={() => {
              setHoveredEdgeId(null);
              setHoveredEdge(null);
            }}
            proOptions={{ hideAttribution: true }}
          >
            {/* Subtle dot grid on the dark canvas (24px, very low opacity). */}
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.03)" />
            <MiniMap
              pannable
              zoomable
              className="arch-minimap"
              maskColor="rgba(0,0,0,0.55)"
              nodeColor={minimapNodeColor}
              nodeStrokeColor={minimapNodeColor}
              nodeStrokeWidth={3}
            />
            <Controls showInteractive={false} />
          </ReactFlow>
          <div className="canvas-floating-controls">
            <button className="btn btn-auto-arrange" onClick={handleAutoArrange}>
              Arrange Nodes
            </button>
          </div>
        </>
      )}
    </div>
  );
}
