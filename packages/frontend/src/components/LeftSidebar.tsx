/** Left sidebar: node-kind legend (palette) and the project file tree. */

import { motion } from 'framer-motion';
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
    <aside className="ls">
      <div className="ls-scroll">
        <section className="ls-section">
          <div className="ls-label">Legend</div>
          <ul className="ls-legend">
            {kinds.map((k) => (
              <li key={k} className="ls-legend-item">
                <span className={`ls-dot kind-${k}`} />
                <span className="ls-legend-name">{KIND_LABELS[k]}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="ls-section ls-grow">
          <div className="ls-label">
            Project Files <span className="ls-count">{graph.nodes.length}</span>
          </div>
          <ul className="ls-files">
            {graph.nodes.map((n, i) => (
              <motion.li
                key={n.id}
                className="ls-file"
                onClick={() => onSelectNode(n.id)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.6), type: 'spring', stiffness: 400, damping: 30 }}
              >
                <span className={`ls-file-dot kind-${n.kind}`} />
                <span className="ls-file-path">{n.filePath ?? n.label}</span>
              </motion.li>
            ))}
            {graph.nodes.length === 0 && <li className="ls-empty">No project analyzed yet.</li>}
          </ul>
        </section>
      </div>

      <button className="ls-collapse" onClick={onCollapse} title="Hide left sidebar (B)">
        <motion.span className="ls-chevron" initial={false} animate={{ rotate: 0 }}>
          ◀
        </motion.span>
      </button>
    </aside>
  );
}
