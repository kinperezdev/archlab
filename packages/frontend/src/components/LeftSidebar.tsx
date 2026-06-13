/** Left sidebar: node-kind legend (palette) and the project file tree. */

import type { CanvasGraph, NodeKind } from '@archlab/shared';

const KIND_LABELS: Record<NodeKind, string> = {
  component: 'Component',
  route: 'Route',
  endpoint: 'Endpoint',
  middleware: 'Middleware',
  auth: 'Auth',
  database: 'Database',
  'external-service': 'External service',
  config: 'Config',
  mcp: 'MCP Server',
  unknown: 'Unknown',
};

interface LeftSidebarProps {
  graph: CanvasGraph;
  onSelectNode: (nodeId: string) => void;
  /** Collapse the sidebar (slides it out to the left). */
  onCollapse: () => void;
}

export function LeftSidebar({ graph, onSelectNode, onCollapse }: LeftSidebarProps) {
  const kinds = Object.keys(KIND_LABELS) as NodeKind[];

  return (
    <aside className="left-sidebar">
      <button
        className="sidebar-edge-toggle"
        onClick={onCollapse}
        title="Hide left sidebar (B)"
      >
        ◀
      </button>
      <div className="sidebar-scroll">
        <section className="panel-block">
          <h3 className="panel-title">Legend</h3>
          <ul className="legend">
            {kinds.map((k) => (
              <li key={k} className="legend-item">
                <span className={`legend-swatch kind-${k}`} />
                {KIND_LABELS[k]}
              </li>
            ))}
          </ul>
        </section>

        <section className="panel-block panel-grow">
          <h3 className="panel-title">Project files ({graph.nodes.length})</h3>
          <ul className="file-tree">
            {graph.nodes.map((n) => (
              <li key={n.id} className="file-row" onClick={() => onSelectNode(n.id)}>
                <span className={`file-dot kind-${n.kind}`} />
                <span className="file-path">{n.filePath ?? n.label}</span>
              </li>
            ))}
            {graph.nodes.length === 0 && <li className="file-empty">No project analyzed yet.</li>}
          </ul>
        </section>
      </div>
    </aside>
  );
}
