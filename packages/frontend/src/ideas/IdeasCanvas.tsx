/**
 * Ideas (Scratch) canvas: a completely free, blank canvas for sketching.
 *
 * Drag-and-drop uses a reliable mousedown-ghost approach (no HTML5 drag API):
 *  - Each palette item has an onMouseDown handler. Pressing it spawns a fixed
 *    ghost div that follows the cursor via document mousemove listeners.
 *  - The canvas highlights with a blue border while the ghost is over it.
 *  - On mouseup over the canvas, the drop position is computed from the canvas
 *    bounding rect + React Flow's screenToFlowPosition, and a real node is
 *    created there. The ghost disappears on mouseup everywhere.
 *  - Placed nodes are immediately draggable (React Flow built-in), double-click
 *    to rename, drag edge handles to connect, double-click an edge to label it.
 *  - Right-click: Add Node / Delete / Duplicate / Clear All.
 *  - Persists to brain/ideas.json on every change.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  MarkerType,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
} from 'reactflow';
import { loadIdeas, saveIdeas } from '../lib/ideasStore.js';
import { neighborSet, highlightClass, stripHighlight } from '../lib/highlight.js';
import { IdeaNode, IDEA_KINDS, type IdeaKind, type IdeaNodeData } from './IdeaNode.js';

const nodeTypes = { idea: IdeaNode };

interface ContextMenuState {
  x: number;
  y: number;
  flowX: number;
  flowY: number;
}

interface Ghost {
  kind: IdeaKind;
  x: number;
  y: number;
}

let idCounter = Date.now();
const nextId = () => `idea_${idCounter++}`;

function IdeasCanvasInner() {
  const [nodes, setNodes, onNodesChange] = useNodesState<IdeaNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [menu, setMenu] = useState<ContextMenuState | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [lockedNodeId, setLockedNodeId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const [overCanvas, setOverCanvas] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const { screenToFlowPosition } = useReactFlow();

  const activeNodeId = hoveredNodeId ?? lockedNodeId;

  // Load saved canvas once when the tab opens.
  useEffect(() => {
    let cancelled = false;
    loadIdeas().then((doc) => {
      if (cancelled) return;
      setNodes((doc.nodes as Node<IdeaNodeData>[]) ?? []);
      setEdges((doc.edges as Edge[]) ?? []);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [setNodes, setEdges]);

  // Persist to brain/ideas.json on change (after the initial load).
  useEffect(() => {
    if (!loaded) return;
    const clean = nodes.map((n) => ({ ...n, selected: false, className: stripHighlight(n.className) }));
    void saveIdeas({ nodes: clean, edges });
  }, [nodes, edges, loaded]);

  // Hover/lock highlight classes.
  useEffect(() => {
    const neighbors = activeNodeId ? neighborSet(activeNodeId, edges) : null;
    setNodes((ns) =>
      ns.map((n) => {
        const cls = highlightClass(n.id, activeNodeId, neighbors, n.className);
        return cls === (n.className ?? '') ? n : { ...n, className: cls };
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNodeId]);

  // Escape releases the lock / closes the menu.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLockedNodeId(null);
        setMenu(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const addNode = useCallback(
    (kind: IdeaKind, flowX: number, flowY: number) => {
      const meta = IDEA_KINDS.find((k) => k.kind === kind);
      const id = nextId();
      const node: Node<IdeaNodeData> = {
        id,
        type: 'idea',
        position: { x: flowX, y: flowY },
        data: { label: meta?.label ?? 'Node', ideaKind: kind },
        selected: true,
      };
      // New node is placed selected; everything else deselects.
      setNodes((ns) => [...ns.map((n) => ({ ...n, selected: false })), node]);
    },
    [setNodes],
  );

  // --- Reliable mousedown-ghost drag (replaces the HTML5 drag API) ---
  const startDrag = useCallback(
    (kind: IdeaKind, e: React.MouseEvent) => {
      e.preventDefault();
      setMenu(null);
      setGhost({ kind, x: e.clientX, y: e.clientY });

      const isInside = (cx: number, cy: number) => {
        const rect = wrapRef.current?.getBoundingClientRect();
        return (
          !!rect && cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom
        );
      };

      const onMove = (ev: MouseEvent) => {
        setGhost({ kind, x: ev.clientX, y: ev.clientY });
        setOverCanvas(isInside(ev.clientX, ev.clientY));
      };
      const onUp = (ev: MouseEvent) => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        if (isInside(ev.clientX, ev.clientY)) {
          const pos = screenToFlowPosition({ x: ev.clientX, y: ev.clientY });
          addNode(kind, pos.x, pos.y);
        }
        setGhost(null);
        setOverCanvas(false);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [addNode, screenToFlowPosition],
  );

  const onConnect = useCallback(
    (conn: Connection) =>
      setEdges((eds) =>
        addEdge({ ...conn, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } }, eds),
      ),
    [setEdges],
  );

  // Double-click an edge to (re)label it.
  const onEdgeDoubleClick = (_e: React.MouseEvent, edge: Edge) => {
    const label = window.prompt('Connection label', String(edge.label ?? ''));
    if (label === null) return;
    setEdges((eds) => eds.map((ed) => (ed.id === edge.id ? { ...ed, label } : ed)));
  };

  const deleteSelected = useCallback(() => {
    setNodes((ns) => ns.filter((n) => !n.selected));
    setEdges((eds) => eds.filter((e) => !e.selected));
    setMenu(null);
  }, [setNodes, setEdges]);

  const duplicateSelected = useCallback(() => {
    setNodes((ns) => {
      const copies = ns
        .filter((n) => n.selected)
        .map((n) => ({
          ...n,
          id: nextId(),
          position: { x: n.position.x + 40, y: n.position.y + 40 },
          selected: false,
          className: stripHighlight(n.className),
          data: { ...n.data },
        }));
      return [...ns.map((n) => ({ ...n, selected: false })), ...copies];
    });
    setMenu(null);
  }, [setNodes]);

  const clearAll = useCallback(() => {
    if (!window.confirm('Clear the entire scratch canvas?')) return;
    setNodes([]);
    setEdges([]);
    setMenu(null);
  }, [setNodes, setEdges]);

  return (
    <div className="ideas-layout">
      <aside className="ideas-palette">
        <h4 className="ideas-palette-title">Node Palette</h4>
        <p className="ideas-palette-hint">Press and drag onto the canvas</p>
        {IDEA_KINDS.map((k) => (
          <div
            key={k.kind}
            className={`ideas-palette-item idea-${k.kind}`}
            onMouseDown={(e) => startDrag(k.kind, e)}
            title="Press and drag onto the canvas"
          >
            <span className="ideas-palette-glyph">{k.glyph}</span>
            {k.label}
          </div>
        ))}
      </aside>

      <div
        className={`ideas-canvas-area ${ghost && overCanvas ? 'ideas-drop-active' : ''}`}
        ref={wrapRef}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onEdgeDoubleClick={onEdgeDoubleClick}
          onPaneContextMenu={(e: React.MouseEvent) => {
            e.preventDefault();
            const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
            setMenu({ x: e.clientX, y: e.clientY, flowX: pos.x, flowY: pos.y });
          }}
          onNodeContextMenu={(e: React.MouseEvent) => {
            e.preventDefault();
            const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
            setMenu({ x: e.clientX, y: e.clientY, flowX: pos.x, flowY: pos.y });
          }}
          onNodeMouseEnter={(_e, n) => setHoveredNodeId(n.id)}
          onNodeMouseLeave={() => setHoveredNodeId(null)}
          onNodeClick={(_e, n) => setLockedNodeId(n.id)}
          onPaneClick={() => {
            setLockedNodeId(null);
            setMenu(null);
          }}
          defaultEdgeOptions={{ type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } }}
          deleteKeyCode={['Backspace', 'Delete']}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1.5} color="rgba(255,255,255,0.05)" />
          <MiniMap pannable zoomable className="arch-minimap" />
          <Controls showInteractive={false} />
        </ReactFlow>

        {menu && (
          <div className="ideas-context-menu" style={{ left: menu.x, top: menu.y }}>
            <div className="ideas-menu-section">Add node</div>
            {IDEA_KINDS.map((k) => (
              <button
                key={k.kind}
                className="ideas-menu-item"
                onClick={() => {
                  addNode(k.kind, menu.flowX, menu.flowY);
                  setMenu(null);
                }}
              >
                <span className="ideas-palette-glyph">{k.glyph}</span> {k.label}
              </button>
            ))}
            <div className="ideas-menu-divider" />
            <button className="ideas-menu-item" onClick={duplicateSelected}>
              ⧉ Duplicate selected
            </button>
            <button className="ideas-menu-item danger" onClick={deleteSelected}>
              ✕ Delete selected
            </button>
            <button className="ideas-menu-item danger" onClick={clearAll}>
              🗑 Clear all
            </button>
          </div>
        )}
      </div>

      {ghost && (
        <div
          className={`ideas-ghost idea-${ghost.kind}`}
          style={{ left: ghost.x + 12, top: ghost.y + 12 }}
        >
          <span className="ideas-palette-glyph">
            {IDEA_KINDS.find((k) => k.kind === ghost.kind)?.glyph}
          </span>
          {IDEA_KINDS.find((k) => k.kind === ghost.kind)?.label}
        </div>
      )}
    </div>
  );
}

export function IdeasCanvas() {
  return (
    <ReactFlowProvider>
      <IdeasCanvasInner />
    </ReactFlowProvider>
  );
}
