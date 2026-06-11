/**
 * Ideas canvas: a completely free, blank canvas for sketching architecture.
 *
 * - Drag a node type out of the LEFT palette and drop it anywhere — the node
 *   appears exactly at the drop position (onDrop/onDragOver on the wrapper +
 *   screenToFlowPosition).
 * - Double-click a node to rename it inline; drag from a node's edge handles to
 *   connect; double-click a connection to label it.
 * - Right-click for Add Node / Delete Selected / Duplicate Selected.
 * - Persists to brain/ideas.json and reloads when the tab opens.
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
const DRAG_MIME = 'text/plain';

interface ContextMenuState {
  x: number;
  y: number;
  flowX: number;
  flowY: number;
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
      const node: Node<IdeaNodeData> = {
        id: nextId(),
        type: 'idea',
        position: { x: flowX, y: flowY },
        data: { label: meta?.label ?? 'Node', ideaKind: kind },
      };
      setNodes((ns) => [...ns, node]);
    },
    [setNodes],
  );

  const onConnect = useCallback(
    (conn: Connection) =>
      setEdges((eds) =>
        addEdge({ ...conn, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } }, eds),
      ),
    [setEdges],
  );

  // --- Drag and drop from the palette ---
  const onPaletteDragStart = (e: React.DragEvent, kind: IdeaKind) => {
    e.dataTransfer.setData(DRAG_MIME, kind);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const kind = e.dataTransfer.getData(DRAG_MIME) as IdeaKind;
    if (!kind || !IDEA_KINDS.some(ik => ik.kind === kind)) return;
    // Exact drop position in flow coordinates.
    const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    addNode(kind, pos.x, pos.y);
  };

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

  const openMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    setMenu({ x: e.clientX, y: e.clientY, flowX: pos.x, flowY: pos.y });
  };

  return (
    <div className="ideas-layout">
      <aside className="ideas-palette">
        <h4 className="ideas-palette-title">Node Palette</h4>
        <p className="ideas-palette-hint">Drag onto the canvas</p>
        {IDEA_KINDS.map((k) => (
          <div
            key={k.kind}
            className={`ideas-palette-item idea-${k.kind}`}
            draggable
            onDragStart={(e) => onPaletteDragStart(e, k.kind)}
            onDoubleClick={() => {
              // Quick-add at canvas center on double-click.
              const rect = wrapRef.current?.getBoundingClientRect();
              const pos = screenToFlowPosition({
                x: (rect?.left ?? 0) + (rect?.width ?? 800) / 2,
                y: (rect?.top ?? 0) + (rect?.height ?? 600) / 2,
              });
              addNode(k.kind, pos.x, pos.y);
            }}
            title={`Drag to add ${k.label} (double-click to drop at center)`}
          >
            <span className="ideas-palette-glyph">{k.glyph}</span>
            {k.label}
          </div>
        ))}
      </aside>

      <div className="ideas-canvas-area" ref={wrapRef} onDrop={onDrop} onDragOver={onDragOver}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onEdgeDoubleClick={onEdgeDoubleClick}
          onPaneContextMenu={openMenu}
          onNodeContextMenu={openMenu}
          onNodeMouseEnter={(_e, n) => setHoveredNodeId(n.id)}
          onNodeMouseLeave={() => setHoveredNodeId(null)}
          onNodeClick={(_e, n) => setLockedNodeId(n.id)}
          onPaneClick={() => {
            setLockedNodeId(null);
            setMenu(null);
          }}
          defaultEdgeOptions={{ type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } }}
          deleteKeyCode={['Backspace', 'Delete']}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1.5} color="#cbd5e1" />
          <MiniMap pannable zoomable className="arch-minimap" />
          <Controls showInteractive={false} />
        </ReactFlow>

        {nodes.length === 0 && loaded && (
          <div className="ideas-hint">
            Drag a node type from the palette on the left, or right-click the canvas to add one.
          </div>
        )}

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
          </div>
        )}
      </div>
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
