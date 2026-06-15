import { Handle, Position, type NodeProps } from 'reactflow';
import type { NodeKind, NodeAnimationState } from '@archlab/shared';

/** A labeled connector port on a backend node. */
export interface PortInfo {
  /** Operation verb: CREATE, READ, AUTHENTICATE, EMIT, ... */
  operation: string;
  /** Operation color (CSS color string). */
  color: string;
  /** Where the connection goes/affects, e.g. "users table". */
  destination: string;
  direction: 'in' | 'out';
  /** File + label of the node the connection originates from. */
  sourceFile?: string;
  sourceLabel: string;
  /** How many other nodes are affected if this connection breaks. */
  impactCount: number;
}

export interface ArchNodeData {
  label: string;
  kind: NodeKind;
  animation: NodeAnimationState;
  filePath?: string;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  meta?: Record<string, string | number | boolean>;
  /** Backend nodes carry explicit, labeled connector ports. */
  ports?: { incoming: PortInfo[]; outgoing: PortInfo[] };
  /** Bottleneck flag (amber), set when a bottleneck diagnostic targets this node. */
  isBottleneck?: boolean;
  bottleneckType?: string;
  bottleneckHint?: string;
  /** Isolation flag (amber warning): node has no edges to anything else. */
  isIsolated?: boolean;
  /** Plain-English reason isolation might be a problem, e.g. "Unused component". */
  isolationReason?: string;
  /** Detected entry point of its lane — rendered larger with an ENTRY badge. */
  isEntry?: boolean;
  /** Depth from the nearest entry point (entry = 0). Undefined if unreachable. */
  depth?: number;
}

interface DbColumn {
  name: string;
  type: string;
  isPk: boolean;
  isFk: boolean;
  fkRelation?: {
    parentTable: string;
    parentColumn: string;
  };
}

interface DbTable {
  name: string;
  columns: DbColumn[];
}

export function ArchNode({ data }: NodeProps<ArchNodeData>) {
  const highlightClass = data.isHighlighted ? 'node-highlight' : '';
  const dimClass = data.isDimmed ? 'node-dimmed' : '';

  // Check if we have parsed database schema tables in this node
  const dbSchema: DbTable[] | null = data.meta?.dbSchema
    ? JSON.parse(String(data.meta.dbSchema))
    : null;

  if (data.kind === 'database' && dbSchema && dbSchema.length > 0) {
    return (
      <div
        className={`arch-node db-schema-node anim-${data.animation} ${highlightClass} ${dimClass}`}
        title={data.filePath ?? data.label}
        style={{ minWidth: '220px', padding: 0 }}
      >
        <Handle type="target" position={Position.Left} />
        
        {/* Node header */}
        <div className="db-node-header" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--node-color)' }}>
          <span className="arch-node-glyph" style={{ color: 'var(--node-color)' }}>⛁</span>
          <span className="arch-node-label" style={{ fontWeight: 700 }}>{data.label}</span>
        </div>

        {/* Node body showing parsed tables and fields */}
        <div className="db-node-body" style={{ maxHeight: '200px', overflowY: 'auto', padding: '4px' }}>
          {dbSchema.map((table) => (
            <div key={table.name} className="db-node-table-block" style={{ marginBottom: '8px' }}>
              <div className="db-node-table-title" style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', opacity: 0.8, fontFamily: 'var(--font-mono)' }}>
                {table.name}
              </div>
              <div className="db-node-columns-list" style={{ display: 'flex', flexDirection: 'column' }}>
                {table.columns.map((col) => (
                  <div
                    key={col.name}
                    className="db-node-column-row"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '2px 8px',
                      fontSize: '9px',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <span style={{ fontWeight: col.isPk || col.isFk ? 600 : 'normal' }}>
                      {col.isPk && '🔑 '}{col.name}
                    </span>
                    <span style={{ opacity: 0.6, fontSize: '8px' }}>
                      {col.type}{col.isFk && ` (→ ${col.fkRelation?.parentTable})`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Handle type="source" position={Position.Right} />
      </div>
    );
  }

  const ports = data.ports;
  const hasPorts = Boolean(ports && (ports.incoming.length > 0 || ports.outgoing.length > 0));

  return (
    <div
      className={`arch-node kind-${data.kind} anim-${data.animation} ${highlightClass} ${dimClass} ${
        hasPorts ? 'has-ports' : ''
      } ${data.isBottleneck ? 'is-bottleneck' : ''} ${data.isIsolated ? 'is-isolated' : ''} ${
        data.isEntry ? 'is-entry' : ''
      }`}
      title={data.isBottleneck ? data.bottleneckHint ?? data.bottleneckType : data.filePath ?? data.label}
    >
      <Handle type="target" position={Position.Left} />

      {data.isEntry && (
        <span className="entry-badge" title="Entry point of this lane">
          <span className="entry-icon">★</span>
          ENTRY
        </span>
      )}

      {data.depth !== undefined && (
        <span className="depth-badge" title={`Depth ${data.depth} from the entry point`}>
          L{data.depth}
        </span>
      )}

      {data.isBottleneck && (
        <span className="bottleneck-badge" title={data.bottleneckHint}>
          <span className="bottleneck-icon">⚠</span>
          {data.bottleneckType}
        </span>
      )}

      {data.isIsolated && data.isolationReason && (
        <span className="isolation-badge" title={`${data.isolationReason} — this node has no connections to the rest of the project.`}>
          <span className="isolation-icon">⚠</span>
          {data.isolationReason}
        </span>
      )}

      {ports && ports.incoming.length > 0 && (
        <div className="node-ports node-ports-in">
          {ports.incoming.map((p, i) => (
            <Port key={`in-${i}`} port={p} />
          ))}
        </div>
      )}

      <div className="node-header">
        <span className="node-dot" />
        <span className="node-name">{data.label}</span>
        <span className="node-type">{data.kind}</span>
      </div>

      {ports && ports.outgoing.length > 0 && (
        <div className="node-ports node-ports-out">
          {ports.outgoing.map((p, i) => (
            <Port key={`out-${i}`} port={p} />
          ))}
        </div>
      )}

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

/**
 * A single connector port: shows "OPERATION → destination", color-coded by
 * operation. On hover it expands to the full details (source file, destination,
 * and how many nodes break if the connection does).
 */
function Port({ port }: { port: PortInfo }) {
  const arrow = port.direction === 'in' ? '←' : '→';
  return (
    <span
      className={`node-port port-${port.direction}`}
      style={{ ['--op-color' as string]: port.color }}
    >
      <span className="port-op">{port.operation}</span>
      <span className="port-arrow">{arrow}</span>
      <span className="port-dest">{port.destination}</span>

      <span className="port-detail">
        <span className="port-detail-row">
          <strong style={{ color: port.color }}>{port.operation}</strong> {arrow} {port.destination}
        </span>
        <span className="port-detail-row">
          From: {port.sourceLabel}
          {port.sourceFile ? ` (${port.sourceFile})` : ''}
        </span>
        <span className="port-detail-row">
          Impact if broken: {port.impactCount} node{port.impactCount === 1 ? '' : 's'} affected
        </span>
      </span>
    </span>
  );
}
