/**
 * The architecture canvas — ArchLab's main surface.
 *
 * Renders the analyzed project as a React Flow graph: nodes in Connected /
 * Isolated containers, kind-colored edges with flow animation on hover or
 * selection, the Frontend/Backend/External swim lanes, simulation cascade
 * waves, and the layout normalizers (readability re-grid + decoration
 * spacing) that keep dense graphs legible. Structural props are memoized;
 * live animation state arrives separately so streaming pipeline ticks never
 * invalidate the graph memo.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  BaseEdge,
  Controls,
  MiniMap,
  MarkerType,
  getSmoothStepPath,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from 'reactflow';
import type { EdgeProps } from 'reactflow';
import type { CanvasEdge, CanvasGraph, CanvasNode, Diagnostic, MissingInfraPattern, NodeAnimationState } from '@archlab/shared';
import { isEntryFile } from '@archlab/shared';
import { ArchNode, type ArchNodeData, type PortInfo } from './ArchNode.js';
import { LaneGroup, type LaneVariant, type LaneGroupData } from './LaneGroup.js';
import { inferOperation, destinationLabel, OPERATION_COLORS } from '../lib/operations.js';
import type { SimulationResult } from '../simulation/simulationEngine.js';
import { SmartEmptyState } from './SmartEmptyState.js';

function BundledWireEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  data,
}: EdgeProps<{ color?: string; tie?: boolean; offset?: number }>) {
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 18,
    offset: data?.offset ?? 18,
  });
  const color = data?.color ?? String(style?.stroke ?? '#60a5fa');

  return (
    <g className="wire-edge">
      <path className="wire-edge-shadow" d={path} />
      <BaseEdge path={path} markerEnd={markerEnd} style={{ ...style, stroke: color }} />
      {data?.tie && (
        <g className="wire-edge-tie" transform={`translate(${labelX} ${labelY}) rotate(-8)`}>
          <rect x="-7" y="-3" width="14" height="6" rx="2" />
          <line x1="-5" y1="0" x2="5" y2="0" />
        </g>
      )}
    </g>
  );
}

function TiedBundleEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
  data,
}: EdgeProps<{ color?: string; bundleCount?: number }>) {
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const bend = Math.min(18, Math.max(6, Math.abs(dx) / 12));
  const trunkX = Math.round((sourceX + dx * 0.5) / 48) * 48;
  const dirX1 = trunkX >= sourceX ? 1 : -1;
  const dirX2 = targetX >= trunkX ? 1 : -1;
  const dirY = targetY >= sourceY ? 1 : -1;
  const canRound = Math.abs(dx) > bend * 3 && Math.abs(dy) > bend * 3;
  const path = canRound
    ? [
        `M ${sourceX},${sourceY}`,
        `H ${trunkX - dirX1 * bend}`,
        `Q ${trunkX},${sourceY} ${trunkX},${sourceY + dirY * bend}`,
        `V ${targetY - dirY * bend}`,
        `Q ${trunkX},${targetY} ${trunkX + dirX2 * bend},${targetY}`,
        `H ${targetX}`,
      ].join(' ')
    : `M ${sourceX},${sourceY} H ${trunkX} V ${targetY} H ${targetX}`;
  const color = data?.color ?? String(style?.stroke ?? '#60a5fa');
  const count = data?.bundleCount ?? 1;
  const tieCount = Math.min(3, Math.max(1, Math.floor(count / 4)));
  const ties = Array.from({ length: tieCount }, (_, index) => {
    const t = (index + 1) / (tieCount + 1);
    const onSourceRun = index % 2 === 0 || Math.abs(targetX - trunkX) < 80;
    const x1 = onSourceRun ? sourceX : trunkX;
    const x2 = onSourceRun ? trunkX : targetX;
    const y = onSourceRun ? sourceY : targetY;
    return {
      x: x1 + (x2 - x1) * t,
      y,
    };
  });

  return (
    <g className="tied-bundle-edge">
      <BaseEdge path={path} style={{ ...style, stroke: color }} />
      {ties.map((tie, index) => (
        <g
          key={`${tie.x}:${tie.y}:${index}`}
          className="bundle-wire-tie"
          transform={`translate(${tie.x} ${tie.y})`}
        >
          <rect x="-6" y="-3" width="12" height="6" rx="2" />
          <line x1="-4" y1="0" x2="4" y2="0" />
        </g>
      ))}
    </g>
  );
}

const nodeTypes = { arch: ArchNode, laneGroup: LaneGroup };
const edgeTypes = { wire: BundledWireEdge, tiedBundle: TiedBundleEdge };

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
const READABLE_COL_W = 360;
const READABLE_ROW_H = 128;
const READABLE_MAX_ROWS = 20;
const DECORATED_COL_W = 340;
const DECORATED_ROW_H = 86;
const LARGE_GRAPH_NODE_THRESHOLD = 90;
const LARGE_GRAPH_EDGE_THRESHOLD = 130;
// Above this edge count, a selected node culls non-incident edges while it is
// highlighted, instead of dimming every edge (which thrashes paint on dense
// graphs like Flutter projects, causing flicker on click).
const EDGE_CULL_THRESHOLD = 120;
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

/** Keep imported or older analyzer layouts from opening as a thin far-away line. */
function normalizeForViewport(nodes: CanvasNode[]): CanvasNode[] {
  if (nodes.length === 0) return nodes;

  const xs = nodes.map((n) => n.position.x);
  const ys = nodes.map((n) => n.position.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const isHairlineColumn = height / width > 5 && nodes.length > 20;
  const isExtremeBounds = height > 2600 || width > 5200;
  if (!isHairlineColumn && !isExtremeBounds) return nodes;

  const laneOrder: Record<string, number> = { frontend: 0, backend: 1, external: 2 };
  const sorted = [...nodes].sort((a, b) => {
    const laneDiff = (laneOrder[a.lane] ?? 9) - (laneOrder[b.lane] ?? 9);
    if (laneDiff !== 0) return laneDiff;
    return (a.filePath ?? a.label).localeCompare(b.filePath ?? b.label);
  });
  const positionById = new Map<string, { x: number; y: number }>();
  sorted.forEach((node, index) => {
    const row = index % READABLE_MAX_ROWS;
    const col = Math.floor(index / READABLE_MAX_ROWS);
    positionById.set(node.id, {
      x: 120 + col * READABLE_COL_W,
      y: 80 + row * READABLE_ROW_H,
    });
  });

  return nodes.map((node) => ({ ...node, position: positionById.get(node.id) ?? node.position }));
}

/** Give node badges and side chips enough visual room without changing order. */
function spaceForNodeDecorations(nodes: CanvasNode[]): CanvasNode[] {
  if (nodes.length < 12) return nodes;

  const uniqueX: number[] = [];
  for (const x of [...new Set(nodes.map((node) => Math.round(node.position.x)))].sort((a, b) => a - b)) {
    uniqueX.push(x);
  }

  const spacedX = new Map<number, number>();
  let lastX: number | null = null;
  for (const x of uniqueX) {
    const nextX: number = lastX === null ? x : Math.max(x, lastX + DECORATED_COL_W);
    spacedX.set(x, nextX);
    lastX = nextX;
  }

  const byColumn = new Map<number, CanvasNode[]>();
  for (const node of nodes) {
    const originalX = Math.round(node.position.x);
    const column = spacedX.get(originalX) ?? node.position.x;
    const list = byColumn.get(column);
    if (list) list.push(node);
    else byColumn.set(column, [node]);
  }

  const spacedY = new Map<string, number>();
  for (const columnNodes of byColumn.values()) {
    const sorted = [...columnNodes].sort((a, b) => a.position.y - b.position.y);
    let lastY: number | null = null;
    for (const node of sorted) {
      const nextY: number = lastY === null ? node.position.y : Math.max(node.position.y, lastY + DECORATED_ROW_H);
      spacedY.set(node.id, nextY);
      lastY = nextY;
    }
  }

  return nodes.map((node) => {
    const originalX = Math.round(node.position.x);
    return {
      ...node,
      position: {
        x: spacedX.get(originalX) ?? node.position.x,
        y: spacedY.get(node.id) ?? node.position.y,
      },
    };
  });
}

interface CanvasProps {
  graph: CanvasGraph;
  /** Live per-node animation state (kept out of `graph` so structural memos stay
   *  stable while the pipeline streams animation ticks). */
  nodeAnimations: Record<string, NodeAnimationState>;
  /** Live per-edge "flowing" flags. */
  edgeAnimations: Record<string, boolean>;
  diagnostics: Diagnostic[];
  onSelectNode: (nodeId: string | null) => void;
  /** Double-click a node: open the Code Intelligence Panel for it. */
  onOpenCode: (nodeId: string) => void;
  selectedNodeId: string | null;
  filter: 'all' | 'frontend' | 'backend' | 'api' | 'security';
  /** Whether failure-simulation mode is active (shows the click-a-node banner). */
  simulationMode?: boolean;
  /** The current simulation result, or null. Drives the cascade wave animation. */
  simulationResult?: SimulationResult | null;
  /** Clear the active simulation. */
  onResetSimulation?: () => void;
  /** Nodes to paint red because an unsaved edit in the code panel broke syntax. */
  liveErrorNodeIds?: Set<string>;
  /** Whether a project is loaded (drives the smart empty state). */
  hasProject?: boolean;
  /** Project name + detected stack, shown in the empty state. */
  projectName?: string | null;
  techStack?: string[];
  /** Missing-infrastructure patterns from the analyzer. */
  missingPatterns?: MissingInfraPattern[];
  /** Optional: run a generated prompt in the terminal. */
  onRunPrompt?: (prompt: string) => void;
}

interface EdgeRef {
  id: string;
  source: string;
  target: string;
}

interface GraphIndexes {
  byId: Map<string, CanvasNode>;
  degree: Map<string, number>;
  incoming: Map<string, CanvasEdge[]>;
  outgoing: Map<string, CanvasEdge[]>;
}

/** One graph pass builds all edge lookups used by render-time helpers. */
function buildGraphIndexes(graph: CanvasGraph): GraphIndexes {
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const degree = new Map<string, number>();
  const incoming = new Map<string, CanvasEdge[]>();
  const outgoing = new Map<string, CanvasEdge[]>();

  for (const edge of graph.edges) {
    degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
    degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);

    const out = outgoing.get(edge.source);
    if (out) out.push(edge);
    else outgoing.set(edge.source, [edge]);

    const inc = incoming.get(edge.target);
    if (inc) inc.push(edge);
    else incoming.set(edge.target, [edge]);
  }

  return { byId, degree, incoming, outgoing };
}

/** Build connector ports from indexed edges instead of scanning all edges per node. */
function portsForIndexed(nodeId: string, indexes: GraphIndexes): { incoming: PortInfo[]; outgoing: PortInfo[] } {
  const self = indexes.byId.get(nodeId);
  const incoming: PortInfo[] = [];
  const outgoing: PortInfo[] = [];

  for (const e of indexes.outgoing.get(nodeId) ?? []) {
    const other = indexes.byId.get(e.target);
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
      impactCount: Math.max(0, (indexes.degree.get(e.target) ?? 1) - 1),
    });
  }

  for (const e of indexes.incoming.get(nodeId) ?? []) {
    const other = indexes.byId.get(e.source);
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
      impactCount: Math.max(0, (indexes.degree.get(nodeId) ?? 1) - 1),
    });
  }

  return { incoming, outgoing };
}

export function Canvas({
  graph,
  nodeAnimations,
  edgeAnimations,
  diagnostics,
  onSelectNode,
  onOpenCode,
  selectedNodeId,
  filter,
  simulationMode = false,
  simulationResult = null,
  onResetSimulation,
  liveErrorNodeIds,
  hasProject = false,
  projectName = null,
  techStack = [],
  missingPatterns = [],
  onRunPrompt,
}: CanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<ArchNodeData | LaneGroupData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<{ source: string; target: string } | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  // Canvas search: typing highlights matching nodes and dims the rest.
  const [canvasSearch, setCanvasSearch] = useState('');
  // A clicked node locks its highlight on until the user clicks the canvas
  // background or presses Escape. Only one node can be locked at a time.
  const [lockedNodeId, setLockedNodeId] = useState<string | null>(null);

  // Hovering any node overrides the displayed highlight; otherwise the locked
  // node (if any) keeps its connections lit.
  const activeNodeId = hoveredNodeId ?? selectedNodeId ?? lockedNodeId;
  const [selectedEdges, setSelectedEdges] = useState<Record<string, EdgeRef>>({});
  const [isViewportMoving, setIsViewportMoving] = useState(false);
  const viewportMovingRef = useRef(false);
  const { setCenter, fitView } = useReactFlow();

  // Perf plumbing for the highlight system:
  //  - rAF refs batch the node/edge highlight patches with the paint cycle.
  //  - hoverTimerRef debounces hover so a fast mouse sweep doesn't recompute.
  //  - edgeCull reports how many edges are shown when large graphs are culled.
  const nodeRafRef = useRef<number | null>(null);
  const edgeRafRef = useRef<number | null>(null);
  const hoverTimerRef = useRef<number | null>(null);
  const viewportIdleTimerRef = useRef<number | null>(null);
  const [edgeCull, setEdgeCull] = useState<{ shown: number; total: number } | null>(null);
  const graphIndexes = useMemo(() => buildGraphIndexes(graph), [graph]);

  // Auto-fit the view when the graph goes from empty to populated, after a short
  // delay so React Flow has finished measuring/rendering the nodes.
  const hasNodes = nodes.length > 0;
  useEffect(() => {
    if (hasNodes) {
      const id = setTimeout(() => fitView({ padding: 0.16, duration: 350 }), 140);
      return () => clearTimeout(id);
    }
  }, [hasNodes, fitView]);

  // Switching tabs (all / frontend / backend / api / security) changes the
  // visible node set while hasNodes stays true, so the effect above won't fire.
  // Re-fit the view to the newly filtered nodes once they have been laid out.
  useEffect(() => {
    if (nodes.length === 0) return;
    const id = setTimeout(() => fitView({ padding: 0.16, duration: 400 }), 140);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, graph.nodes.length, graph.edges.length]);

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

    return spaceForNodeDecorations(normalizeForViewport(graph.nodes.filter((n) => base.has(n.id))));
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

    // Compact isolated grid: 10 per row, tight cells, wrapping downward.
    const COLS = 10;
    const CELL_W = 140;
    const CELL_H = 50;
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

  const isLargeGraph =
    layoutNodes.length > LARGE_GRAPH_NODE_THRESHOLD || graph.edges.length > LARGE_GRAPH_EDGE_THRESHOLD;
  const detailNodeId = selectedNodeId ?? lockedNodeId;

  const findFirstCanvasSearchMatch = useCallback(() => {
    const q = canvasSearch.trim().toLowerCase();
    if (!q) return null;
    return (
      layoutNodes.find((n) => {
        const hay = `${n.label ?? ''} ${n.filePath ?? ''} ${n.kind ?? ''}`.toLowerCase();
        return hay.includes(q);
      }) ?? null
    );
  }, [canvasSearch, layoutNodes]);

  const focusCanvasNode = useCallback(
    (node: CanvasNode) => {
      onSelectNode(node.id);
      setSelectedEdges({});
      setLockedNodeId(node.id);
      setHoveredNodeId(null);
      setHoveredEdgeId(null);
      setHoveredEdge(null);
      setCenter(node.position.x + NODE_W / 2, node.position.y + NODE_H / 2, {
        zoom: isLargeGraph ? 1.25 : 1.1,
        duration: 420,
      });
    },
    [isLargeGraph, onSelectNode, setCenter],
  );

  // Mind-map branch coloring: every node in the same top-level folder shares one
  // color, so each folder branch reads as a single colored limb, matching the
  // folder-based left-to-right layout (like the reference mental-model diagram).
  const branchColorById = useMemo(() => {
    const PALETTE = [
      '#34d399', '#60a5fa', '#fbbf24', '#c084fc', '#fb923c',
      '#2dd4bf', '#f472b6', '#f87171', '#a3e635', '#818cf8',
    ];
    // The folder segments of a node, with the filename dropped.
    const foldersOf = (n: { filePath?: string; label?: string; id: string }): string[] => {
      const rel = ((n.filePath ?? n.label ?? n.id) || '').replace(/^\.?\//, '');
      return rel.split('/').filter(Boolean).slice(0, -1);
    };
    // Strip the path prefix shared by ALL nodes (e.g. "packages" in a monorepo,
    // where every file would otherwise share one color). Color keys off the first
    // segment that actually differs — frontend/backend/shared, src/pages, etc. —
    // so the rainbow shows consistently regardless of project layout.
    const allFolders = graph.nodes.map(foldersOf);
    let prefix = 0;
    if (allFolders.length > 0) {
      const first = allFolders[0];
      for (; prefix < first.length; prefix++) {
        const seg = first[prefix];
        if (!allFolders.every((f) => f[prefix] === seg)) break;
      }
    }
    const groupKey = (n: { filePath?: string; label?: string; id: string }): string => {
      const folders = foldersOf(n);
      // First distinguishing folder; root-level files fall back to their own key
      // so they still spread across the palette instead of collapsing to one.
      return folders[prefix] ?? `·${n.filePath ?? n.label ?? n.id}`;
    };
    const colorOfGroup = new Map<string, string>();
    const color = new Map<string, string>();
    let idx = 0;
    for (const n of graph.nodes) {
      const g = groupKey(n);
      if (!colorOfGroup.has(g)) colorOfGroup.set(g, PALETTE[idx++ % PALETTE.length]);
      color.set(n.id, colorOfGroup.get(g)!);
    }
    return color;
  }, [graph.nodes]);

  // Detect each lane's entry point and every node's depth from it. Entry points
  // are matched by conventional filename first (main/index/app/server), with a
  // fallback to the node that imports the most and is imported the least.
  const { entryIds, depthByNode } = useMemo(() => {
    const outDeg = new Map<string, number>();
    const inDeg = new Map<string, number>();
    for (const e of graph.edges) {
      outDeg.set(e.source, (outDeg.get(e.source) ?? 0) + 1);
      inDeg.set(e.target, (inDeg.get(e.target) ?? 0) + 1);
    }

    const entries = new Set<string>();
    // A node is an entry point if its file matches any language's entry-file
    // convention (see ENTRY_PATTERNS in @archlab/shared).
    const detectFor = (lane: string) => {
      const laneNodes = graph.nodes.filter((n) => n.lane === lane);
      const named = laneNodes.filter((n) => isEntryFile(n.filePath));
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
    detectFor('frontend');
    detectFor('backend');

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
        .map((n) => {
          const toolSig = (n.detectedTools ?? []).map((t) => t.id).sort().join(',');
          return `${n.id}@${n.position.x},${n.position.y}${isolatedIds.has(n.id) ? '!' : ''}[${n.kind}:${toolSig}]`;
        })
        .join('|') +
      // Edge signature so backend connector ports refresh when edges change.
      `#${graph.edges.length}` +
      // Entry/depth signature so the hierarchy badges refresh on re-analysis.
      `~${[...entryIds].sort().join(',')}~${depthByNode.size}`,
    [layoutNodes, isolatedIds, graph.edges.length, entryIds, depthByNode],
  );
  const lastStructureKeyRef = useRef<string | null>(null);

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
    if (isLargeGraph) return [];
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
  }, [structureKey, isLargeGraph]);

  // 1. Build the node set ONLY when the structure changes (new project, new
  //    nodes, filter switch). Never on a pipeline animation tick, so nodes are
  //    never cleared or rebuilt mid-run.
  useEffect(() => {
    const preservePositions = lastStructureKeyRef.current === structureKey;
    setNodes((prevNodes) => {
      const previousPositions = preservePositions
        ? new Map(prevNodes.filter((node) => node.type === 'arch').map((node) => [node.id, node.position]))
        : new Map<string, { x: number; y: number }>();

      const realNodes = layoutNodes.map((n) => {
        const isIsolated = isolatedIds.has(n.id);
        const shouldShowDetails = !isLargeGraph || n.id === detailNodeId;
        return {
          id: n.id,
          type: 'arch',
          position: previousPositions.get(n.id) ?? n.position,
          data: {
            label: n.label,
            kind: n.kind,
            animation: nodeAnimations[n.id] ?? n.animation,
            filePath: n.filePath,
            meta: n.meta,
            detectedTools: n.detectedTools,
            isHighlighted: false,
            isDimmed: false,
            isFocused: false,
            isIsolated,
            isolationReason: isIsolated ? isolationReasonFor(n.kind) : undefined,
            isEntry: entryIds.has(n.id),
            depth: depthByNode.get(n.id),
            branchColor: branchColorById.get(n.id),
            isLite: !shouldShowDetails,
            // Backend nodes get explicit operation-labeled connector ports.
            ports: shouldShowDetails && n.lane === 'backend' && !isIsolated ? portsForIndexed(n.id, graphIndexes) : undefined,
          },
        };
      });
      // Lane backgrounds first so they paint behind the real nodes.
      return [...laneGroups, ...realNodes];
    });
    lastStructureKeyRef.current = structureKey;
    // filteredNodes is captured via structureKey and stable laneGroups to avoid
    // rebuilds on every animation frame; positions/ids are what actually matter here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structureKey, branchColorById, graphIndexes, isLargeGraph, detailNodeId, setNodes]);

  // 1b. Patch live animation state onto the EXISTING nodes in place. This is
  //     what the pipeline drives: color/glow updates only, nodes stay mounted.
  useEffect(() => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        // Lane-group backgrounds carry no animation; skip them.
        if (!('animation' in node.data)) return node;
        const animation = nodeAnimations[node.id] ?? 'idle';
        if (animation === node.data.animation) return node;
        return { ...node, data: { ...node.data, animation } };
      }),
    );
  }, [nodeAnimations, setNodes]);

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

  // 1d. Failure simulation: play the cascade as timed waves. Each node flips to
  //     its failure state at affectedAtMs (hop * 800ms); resilient nodes then
  //     transition to "recovering". Clears all sim state when the result clears.
  useEffect(() => {
    const clearSim = () =>
      setNodes((prev) =>
        prev.map((node) =>
          'kind' in node.data && node.data.simState
            ? { ...node, data: { ...node.data, simState: undefined } }
            : node,
        ),
      );

    clearSim();
    if (!simulationResult) return;

    const waves = new Map<number, Map<string, NonNullable<ArchNodeData['simState']>>>();
    const addWave = (atMs: number, nodeId: string, state: NonNullable<ArchNodeData['simState']>) => {
      const wave = waves.get(atMs);
      if (wave) wave.set(nodeId, state);
      else waves.set(atMs, new Map([[nodeId, state]]));
    };

    for (const ns of simulationResult.nodeStates) {
      addWave(ns.affectedAtMs, ns.nodeId, ns.state);
      if (ns.recovers && ns.state !== 'healthy' && ns.state !== 'warning') {
        addWave(ns.affectedAtMs + 1600, ns.nodeId, 'recovering');
      }
    }

    const timers: number[] = [];
    for (const [atMs, wave] of waves) {
      timers.push(
        window.setTimeout(() => {
          setNodes((prev) =>
            prev.map((node) => {
              const state = wave.get(node.id);
              return state && 'kind' in node.data
                ? { ...node, data: { ...node.data, simState: state } }
                : node;
            }),
          );
        }, atMs),
      );
    }

    return () => timers.forEach((t) => clearTimeout(t));
  }, [simulationResult, setNodes]);

  // Paint the nodes an unsaved syntax error affects red (and only revert the ones
  // we ourselves marked, so simulation states are never clobbered).
  const liveErrorRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const next = liveErrorNodeIds ?? new Set<string>();
    const prev = liveErrorRef.current;
    if (next.size === 0 && prev.size === 0) return;
    liveErrorRef.current = next;
    setNodes((cur) =>
      cur.map((node) => {
        if (!('kind' in node.data)) return node;
        const shouldError = next.has(node.id);
        const wasError = prev.has(node.id);
        if (shouldError && node.data.simState !== 'failed') {
          return { ...node, data: { ...node.data, simState: 'failed' } };
        }
        if (!shouldError && wasError) {
          return { ...node, data: { ...node.data, simState: undefined } };
        }
        return node;
      }),
    );
  }, [liveErrorNodeIds, setNodes]);

  // Fix 1: the highlight node set is memoized so the BFS over edges only runs
  // when the active node / hovered edge / selection actually changes, not on
  // every render. Priority: active node (hover or click-lock) beats hovered edge
  // beats click-selected edges.
  const { highlightNodeIds, hasActiveHighlight } = useMemo(() => {
    const set = new Set<string>();
    // Search takes precedence: highlight every node whose label/file/type matches
    // the query, and dim the rest so matches stand out on a busy canvas.
    const q = canvasSearch.trim().toLowerCase();
    if (q) {
      for (const n of layoutNodes) {
        const hay = `${n.label ?? ''} ${n.filePath ?? ''} ${n.kind ?? ''}`.toLowerCase();
        if (hay.includes(q)) set.add(n.id);
      }
      return { highlightNodeIds: set, hasActiveHighlight: true };
    }
    const hasSelection = Object.keys(selectedEdges).length > 0;
    if (activeNodeId) {
      set.add(activeNodeId);
      for (const e of graph.edges) {
        if (e.source === activeNodeId) set.add(e.target);
        if (e.target === activeNodeId) set.add(e.source);
      }
    } else if (hoveredEdge) {
      set.add(hoveredEdge.source);
      set.add(hoveredEdge.target);
    } else if (hasSelection) {
      for (const edge of Object.values(selectedEdges)) {
        set.add(edge.source);
        set.add(edge.target);
      }
    }
    return {
      highlightNodeIds: set,
      hasActiveHighlight: activeNodeId !== null || hoveredEdge !== null || hasSelection,
    };
  }, [canvasSearch, layoutNodes, activeNodeId, hoveredEdge, selectedEdges, graph.edges]);

  // Fix 2: set of "active" edge ids (touching the active node, hovered, or
  // selected). Membership lookups replace the per-click full edge rebuild.
  const activeEdgeIds = useMemo(() => {
    const set = new Set<string>();
    for (const e of graph.edges) {
      const touchesActive =
        activeNodeId !== null && (e.source === activeNodeId || e.target === activeNodeId);
      if (e.id === hoveredEdgeId || selectedEdges[e.id] || touchesActive) set.add(e.id);
    }
    return set;
  }, [graph.edges, hoveredEdgeId, selectedEdges, activeNodeId]);

  // Fix 2: the STATIC edge structure (color, marker, offset, branch color) is
  // computed once per graph/filter. This is where the expensive `inferOperation`
  // per edge runs, so it is kept off the hover/click hot path entirely.
  const baseEdges = useMemo(() => {
    const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
    const byId = new Map(graph.nodes.map((n) => [n.id, n]));
    const sourceSeen = new Map<string, number>();
    return graph.edges
      .filter((e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target))
      .map((e) => {
        const source = byId.get(e.source);
        const target = byId.get(e.target);
        const operation = inferOperation({
          otherKind: target?.kind,
          edgeLabel: e.label,
          sourceHint: `${source?.label ?? ''} ${source?.filePath ?? ''} ${target?.label ?? ''}`,
          direction: 'out',
        });
        const opColor = OPERATION_COLORS[operation];
        const branchColor =
          branchColorById.get(e.target) ?? KIND_COLORS[target?.kind ?? 'unknown'] ?? opColor;
        const n = sourceSeen.get(e.source) ?? 0;
        sourceSeen.set(e.source, n + 1);
        const offset = 12 + (n % 5) * 8;
        const markerEnd = isLargeGraph
          ? undefined
          : { type: MarkerType.ArrowClosed, width: 16, height: 16, color: branchColor };
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          label: isLargeGraph ? undefined : e.label,
          branchColor,
          offset,
          tie: !isLargeGraph && n % 3 === 0,
          markerEnd,
          bundleCount: 1,
        };
      });
  }, [graph.edges, graph.nodes, filteredNodes, branchColorById, isLargeGraph]);

  const displayedBaseEdges = useMemo(() => {
    if (!isLargeGraph || hasActiveHighlight) return baseEdges;

    const posById = new Map(layoutNodes.map((node) => [node.id, node.position]));
    const bundles = new Map<string, (typeof baseEdges)[number] & { bundleCount: number }>();

    for (const edge of baseEdges) {
      const source = posById.get(edge.source);
      const target = posById.get(edge.target);
      if (!source || !target) continue;

      const sourceCol = Math.round(source.x / 360);
      const targetCol = Math.round(target.x / 360);
      const key = `${sourceCol}->${targetCol}`;
      const existing = bundles.get(key);
      if (existing) {
        existing.bundleCount += 1;
        continue;
      }

      bundles.set(key, {
        ...edge,
        id: `bundle:${key}`,
        label: undefined,
        bundleCount: 1,
      });
    }

    return [...bundles.values()]
      .filter((edge) => edge.bundleCount > 1)
      .sort((a, b) => b.bundleCount - a.bundleCount)
      .slice(0, 120);
  }, [baseEdges, hasActiveHighlight, isLargeGraph, layoutNodes]);

  // 2. Patch highlight/dim onto existing nodes. Fix 1 (memoized set) + Fix 3
  //    (rAF-batched) + identity short-circuit so only nodes whose state actually
  //    changed get a new object (and therefore re-render).
  useEffect(() => {
    if (nodeRafRef.current !== null) cancelAnimationFrame(nodeRafRef.current);
    nodeRafRef.current = requestAnimationFrame(() => {
      setNodes((prevNodes) => {
        let changed = false;
        const next = prevNodes.map((node) => {
          if (!('kind' in node.data)) return node; // leave lane backgrounds alone
          const isHighlighted = hasActiveHighlight ? highlightNodeIds.has(node.id) : false;
          const isDimmed = hasActiveHighlight ? !highlightNodeIds.has(node.id) : false;
          const isFocused = activeNodeId === node.id;
          if (
            node.data.isHighlighted === isHighlighted &&
            node.data.isDimmed === isDimmed &&
            node.data.isFocused === isFocused
          ) {
            return node;
          }
          changed = true;
          return { ...node, data: { ...node.data, isHighlighted, isDimmed, isFocused } };
        });
        return changed ? next : prevNodes;
      });
    });
    return () => {
      if (nodeRafRef.current !== null) cancelAnimationFrame(nodeRafRef.current);
    };
  }, [highlightNodeIds, hasActiveHighlight, setNodes]);

  // 3. Patch the dynamic edge styling (animated / width / opacity) from the
  //    static baseEdges. Fix 3 (rAF), Fix 4 (only active edges animate during a
  //    highlight), Fix 5 (cull non-incident edges on very large graphs), plus an
  //    identity short-circuit so unchanged edges are not re-rendered.
  useEffect(() => {
    if (edgeRafRef.current !== null) cancelAnimationFrame(edgeRafRef.current);
    edgeRafRef.current = requestAnimationFrame(() => {
      // Fix 5: while a node is highlighted on a large graph, render only the
      // edges incident to the highlighted region instead of dimming all of them.
      const culling = activeNodeId !== null && displayedBaseEdges.length > EDGE_CULL_THRESHOLD;
      const visibleBase = culling
        ? displayedBaseEdges.filter((b) => highlightNodeIds.has(b.source) && highlightNodeIds.has(b.target))
        : displayedBaseEdges;

      setEdges((prevEdges) => {
        const prevById = new Map(prevEdges.map((e) => [e.id, e]));
        return visibleBase.map((b) => {
          const isActive = activeEdgeIds.has(b.id);
          // Fix 4: during a highlight only the active edges animate; everything
          // else stops flowing. At rest, restore each edge's live flow state
          // (driven by the pipeline via the edgeAnimations side map).
          const animated = hasActiveHighlight ? isActive : (edgeAnimations[b.id] ?? false);
          const finalAnimated = isLargeGraph ? false : animated;
          const opacity = hasActiveHighlight ? (isActive ? 1 : 0.18) : (isLargeGraph ? 0.48 : 0.5);
          const bundledWidth = 1 + Math.min(1.7, Math.log2(Math.max(1, b.bundleCount)) * 0.22);
          const strokeWidth = isActive ? 3 : (isLargeGraph ? bundledWidth : 1.5);
          const className = [
            finalAnimated ? 'edge-flowing' : null,
            isLargeGraph && b.bundleCount > 1 ? 'edge-bundle' : null,
          ].filter(Boolean).join(' ') || undefined;
          const edgeType = isLargeGraph && !hasActiveHighlight ? 'tiedBundle' : isLargeGraph ? 'straight' : 'wire';
          const vectorEffect = isLargeGraph ? 'non-scaling-stroke' : undefined;

          // Reuse the previous edge object when its visible state is unchanged so
          // React Flow can skip re-rendering it.
          const prev = prevById.get(b.id);
          if (
            prev &&
            prev.type === edgeType &&
            prev.label === b.label &&
            prev.animated === finalAnimated &&
            prev.className === className &&
            prev.style?.strokeWidth === strokeWidth &&
            prev.style?.opacity === opacity &&
            prev.style?.vectorEffect === vectorEffect
          ) {
            return prev;
          }
          return {
            id: b.id,
            source: b.source,
            target: b.target,
            label: b.label,
            type: edgeType,
            data: { color: b.branchColor, tie: b.tie, offset: b.offset, bundleCount: b.bundleCount },
            zIndex: 0,
            animated: finalAnimated,
            className,
            interactionWidth: 0,
            markerEnd: b.markerEnd,
            style: {
              strokeWidth,
              stroke: b.branchColor,
              opacity,
              vectorEffect,
              transition: isLargeGraph ? undefined : 'stroke-width 0.15s ease, opacity 0.15s ease',
            },
          };
        });
      });

      // Update the cull indicator only when its value actually changes.
      setEdgeCull((prev) => {
        const nextVal = culling ? { shown: visibleBase.length, total: displayedBaseEdges.length } : null;
        if (!prev && !nextVal) return prev;
        if (prev && nextVal && prev.shown === nextVal.shown && prev.total === nextVal.total) return prev;
        return nextVal;
      });
    });
    return () => {
      if (edgeRafRef.current !== null) cancelAnimationFrame(edgeRafRef.current);
    };
  }, [displayedBaseEdges, activeEdgeIds, highlightNodeIds, hasActiveHighlight, activeNodeId, isLargeGraph, edgeAnimations, setEdges]);

  // Clean up the debounce timer and any pending rAF when the canvas unmounts.
  useEffect(
    () => () => {
      if (hoverTimerRef.current !== null) clearTimeout(hoverTimerRef.current);
      if (viewportIdleTimerRef.current !== null) clearTimeout(viewportIdleTimerRef.current);
      if (nodeRafRef.current !== null) cancelAnimationFrame(nodeRafRef.current);
      if (edgeRafRef.current !== null) cancelAnimationFrame(edgeRafRef.current);
    },
    [],
  );

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
          branchColor: branchColorById.get(n.id),
          isLite: isLargeGraph,
        },
      };
    });
    setNodes([...laneGroups, ...realNodes]);
  };

  const renderedNodes = useMemo(
    () => (isLargeGraph && isViewportMoving ? nodes.filter((node) => node.type !== 'laneGroup') : nodes),
    [isLargeGraph, isViewportMoving, nodes],
  );

  const beginViewportMove = useCallback(() => {
    if (!isLargeGraph) return;
    if (!viewportMovingRef.current) {
      viewportMovingRef.current = true;
      setIsViewportMoving(true);
    }
    if (viewportIdleTimerRef.current !== null) clearTimeout(viewportIdleTimerRef.current);
    viewportIdleTimerRef.current = window.setTimeout(() => {
      viewportMovingRef.current = false;
      setIsViewportMoving(false);
      viewportIdleTimerRef.current = null;
    }, 180);
  }, [isLargeGraph]);

  const endViewportMove = useCallback(() => {
    if (!isLargeGraph) return;
    if (viewportIdleTimerRef.current !== null) {
      clearTimeout(viewportIdleTimerRef.current);
      viewportIdleTimerRef.current = null;
    }
    viewportMovingRef.current = false;
    setIsViewportMoving(false);
  }, [isLargeGraph]);

  const markWheelViewportMove = useCallback(() => {
    beginViewportMove();
  }, [beginViewportMove]);

  return (
    <div className="canvas-wrap">
      {filteredNodes.length === 0 ? (
        <SmartEmptyState
          tab={filter}
          missingPatterns={missingPatterns}
          projectName={projectName}
          techStack={techStack}
          hasProject={hasProject}
          onRunPrompt={onRunPrompt}
        />
      ) : (
        <>
          <ReactFlow
            className={`arch-flow${isLargeGraph ? ' is-compact-graph' : ''}${
              isLargeGraph && isViewportMoving ? ' is-viewport-moving' : ''
            }`}
            nodes={renderedNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            /* Tight padding so nodes fill the viewport; wide zoom range so large
               projects fit and you can still zoom in to read. */
            fitViewOptions={{ padding: 0.16 }}
            defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
            minZoom={0.14}
            maxZoom={2}
            /* Drop per-node focus/elevation overhead so panning large graphs
               stays smooth. Keep all nodes mounted so React Flow can measure
               edges correctly even when a connection leaves the viewport. */
            elevateNodesOnSelect={false}
            nodesFocusable={false}
            edgesFocusable={false}
            elementsSelectable={false}
            selectNodesOnDrag={false}
            selectionOnDrag={false}
            /* On large graphs, only mount the nodes/edges inside the viewport so
               zooming in unmounts the off-screen majority instead of repainting
               every node each frame. Small graphs keep everything mounted so
               edges that leave the viewport still measure correctly. */
            onlyRenderVisibleElements={isLargeGraph}
            onMoveStart={beginViewportMove}
            onMove={beginViewportMove}
            onMoveEnd={endViewportMove}
            onWheelCapture={markWheelViewportMove}
            onNodeClick={(_e, node) => {
              if (node.type === 'laneGroup') {
                onSelectNode(null);
                setSelectedEdges({});
                setLockedNodeId(null);
                return;
              }
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
              if (isLargeGraph) return;
              // Fix 6: debounce hover by 80ms so a fast mouse sweep across many
              // nodes does not fire a highlight recompute for each one.
              if (hoverTimerRef.current !== null) clearTimeout(hoverTimerRef.current);
              const id = node.id;
              hoverTimerRef.current = window.setTimeout(() => setHoveredNodeId(id), 80);
            }}
            onNodeMouseLeave={() => {
              if (hoverTimerRef.current !== null) {
                clearTimeout(hoverTimerRef.current);
                hoverTimerRef.current = null;
              }
              setHoveredNodeId(null);
            }}
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
              if (isLargeGraph) return;
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
            {/* The MiniMap renders every node, so it's a bottleneck on huge
                graphs, only show it below a threshold. */}
            {nodes.length <= LARGE_GRAPH_NODE_THRESHOLD && (
              <MiniMap
                pannable
                zoomable
                className="arch-minimap"
                maskColor="rgba(0,0,0,0.55)"
                nodeColor={minimapNodeColor}
                nodeStrokeColor={minimapNodeColor}
                nodeStrokeWidth={3}
              />
            )}
            <Controls showInteractive={false} />
          </ReactFlow>
          {simulationMode && !simulationResult && (
            <div className="sim-canvas-banner">
              ⚡ Simulation Mode: click any node to simulate a failure
            </div>
          )}
          {edgeCull && (
            <div className="canvas-cull-indicator">
              Showing {edgeCull.shown} of {edgeCull.total} connections
            </div>
          )}
          <div className="canvas-floating-controls">
            <div className="canvas-search">
              <input
                className="canvas-search-input"
                placeholder="Search nodes…"
                value={canvasSearch}
                onChange={(e) => setCanvasSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setCanvasSearch('');
                    return;
                  }
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const match = findFirstCanvasSearchMatch();
                    if (match) focusCanvasNode(match);
                  }
                }}
              />
              {canvasSearch && (
                <button
                  className="canvas-search-clear"
                  title="Clear search"
                  onClick={() => setCanvasSearch('')}
                >
                  ✕
                </button>
              )}
            </div>
            <button className="btn btn-auto-arrange" onClick={handleAutoArrange}>
              Arrange Nodes
            </button>
            {simulationResult && onResetSimulation && (
              <button className="btn btn-sim-reset" onClick={onResetSimulation}>
                Reset Simulation
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
