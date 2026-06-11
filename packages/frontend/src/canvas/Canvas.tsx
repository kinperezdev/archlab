import { useCallback, useEffect, useMemo, useState } from 'react';
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
  selectedNodeId: string | null;
  filter: 'all' | 'frontend' | 'backend';
}

interface EdgeRef {
  id: string;
  source: string;
  target: string;
}

export function Canvas({ graph, diagnostics, onSelectNode, selectedNodeId, filter }: CanvasProps) {
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

  // Auto-center viewport ONLY when the node selection actually changes
  useEffect(() => {
    if (!selectedNodeId) return;
    const graphNode = graph.nodes.find((n) => n.id === selectedNodeId);
    if (graphNode) {
      // Smoothly pan to the node coordinates, placing it in the center. Zoom scale: 1.1.
      setCenter(graphNode.position.x + 80, graphNode.position.y + 40, {
        zoom: 1.1,
        duration: 400,
      });
    }
  }, [selectedNodeId, graph.nodes, setCenter]);

  // Which nodes belong on screen for the active lane filter.
  const matchesFilter = useCallback(
    (lane: string) => {
      if (filter === 'frontend') return lane === 'frontend';
      if (filter === 'backend') return lane === 'backend' || lane === 'external';
      return true;
    },
    [filter],
  );

  const filteredNodes = useMemo(
    () => graph.nodes.filter((n) => matchesFilter(n.lane)),
    [graph.nodes, matchesFilter],
  );

  // Structural signature: only the SET of visible nodes and their positions.
  // This intentionally excludes animation state, so the live pipeline (which
  // streams hundreds of node-animate updates) does NOT trigger a rebuild.
  const structureKey = useMemo(
    () =>
      filteredNodes.map((n) => `${n.id}@${n.position.x},${n.position.y}`).join('|') +
      // Edge signature so backend connector ports refresh when edges change.
      `#${graph.edges.length}`,
    [filteredNodes, graph.edges.length],
  );

  // Background swim-lane containers, sized to wrap each lane's nodes. Rendered
  // behind the real nodes (zIndex -1) so the Frontend/Backend split is obvious.
  // Memoized on structureKey so it does not recalculate on animation updates.
  const laneGroups = useMemo(() => {
    const groups: ReturnType<typeof buildLaneGroup>[] = [];
    const frontend = filteredNodes.filter((n) => n.lane === 'frontend');
    const backend = filteredNodes.filter((n) => n.lane === 'backend');
    if (frontend.length > 0) groups.push(buildLaneGroup('__lane_frontend', 'Frontend', 'frontend', frontend));
    if (backend.length > 0) groups.push(buildLaneGroup('__lane_backend', 'Backend', 'backend', backend));
    return groups;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structureKey]);

  // 1. Build the node set ONLY when the structure changes (new project, new
  //    nodes, filter switch). Never on a pipeline animation tick, so nodes are
  //    never cleared or rebuilt mid-run.
  useEffect(() => {
    const degree = degreeMap(graph);
    const realNodes = filteredNodes.map((n) => ({
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
        // Backend nodes get explicit operation-labeled connector ports.
        ports: n.lane === 'backend' ? portsFor(n.id, graph, degree) : undefined,
      },
    }));
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
          // everything.
          type: 'smoothstep',
          pathOptions: { borderRadius: 12 },
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
    const realNodes = filteredNodes.map((n) => ({
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
      },
    }));
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
            {/* Swim-lane backdrop and helpers. Grid lines just like FigJam paper. */}
            <Background variant={BackgroundVariant.Lines} gap={36} color="#e4e4e7" />
            <MiniMap pannable zoomable className="arch-minimap" />
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
