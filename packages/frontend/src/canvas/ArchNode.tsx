/**
 * One node on the architecture canvas: kind-colored card with label, badges,
 * side ports, and the live pipeline animation states (processing / scanning /
 * error / stress / success). Memoized — it renders hundreds of times per
 * project, so props must stay referentially stable.
 */

import { memo, type CSSProperties } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { NodeKind, NodeAnimationState } from '@archlab/shared';
import { getNodeRecommendation } from './nodeRecommendations.js';
import { capabilityBus } from './capabilityBus.js';

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
  isFocused?: boolean;
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
  /** Detected entry point of its lane, rendered larger with an ENTRY badge. */
  isEntry?: boolean;
  /** Depth from the nearest entry point (entry = 0). Undefined if unreachable. */
  depth?: number;
  /** Mind-map branch color shared by the whole subtree (overrides kind color). */
  branchColor?: string;
  /** Failure-simulation state (set only while a simulation is playing). */
  simState?: 'healthy' | 'warning' | 'degraded' | 'failed' | 'cascade-failed' | 'recovering';
  /** Detected third-party tools/services. */
  detectedTools?: {
    id: string;
    name: string;
    color: string;
    icon: string;
    isInternetConnected: boolean;
    connectionType: string;
    category: string;
  }[];
  /** Large graphs use a lighter node body to keep panning and zooming smooth. */
  isLite?: boolean;
}

interface NodePaletteBadge {
  id: string;
  label: string;
  color: string;
  title: string;
  /** Full tool name shown in the hover card ("Uses: …"). */
  toolName: string;
  /** Tool category (database, auth, ...) used by the detail panel. */
  category: string;
  /** Suggested improvement + why, when one applies for this tool. */
  recommend?: string;
  why?: string;
}

/** Short badge label per simulation state (none for healthy). */
const SIM_STATE_LABEL: Record<string, string> = {
  warning: 'WARNING',
  degraded: 'DEGRADED',
  failed: 'FAILED',
  'cascade-failed': 'CASCADE',
  recovering: 'RECOVERING',
};

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

function ArchNodeImpl({ data, selected }: NodeProps<ArchNodeData>) {
  const highlightClass = data.isHighlighted ? 'node-highlight' : '';
  const dimClass = data.isDimmed ? 'node-dimmed' : '';
  const focusClass = selected || data.isFocused ? 'node-focus-rgb' : '';
  const paletteBadges = buildNodePaletteBadges(data);

  // Check if we have parsed database schema tables in this node
  const dbSchema: DbTable[] | null = data.kind === 'database' && data.meta?.dbSchema
    ? parseDbSchema(String(data.meta.dbSchema))
    : null;

  if (data.kind === 'database' && dbSchema && dbSchema.length > 0) {
    return (
      <div
        className={`arch-node db-schema-node anim-${data.animation} ${highlightClass} ${dimClass} ${focusClass}`}
        title={data.filePath ?? data.label}
        style={{ minWidth: '220px', padding: 0 }}
      >
        <Handle type="target" position={Position.Left} />
        {paletteBadges.length > 0 && (
          <div className="node-palette-rail db-schema-palette" aria-label="Detected node capabilities">
            {paletteBadges.map((badge) => (
              <PaletteBadge key={badge.id} badge={badge} nodeLabel={data.label} />
            ))}
          </div>
        )}
        
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

  const ports = data.isLite ? undefined : data.ports;
  const hasPorts = Boolean(ports && (ports.incoming.length > 0 || ports.outgoing.length > 0));

  const internetTools = data.isLite ? [] : (data.detectedTools ?? []).filter((t) => t.isInternetConnected);
  const isLive = internetTools.length > 0;
  const primaryToolColor = internetTools[0]?.color;

  const glowStyle = isLive && primaryToolColor ? {
    borderColor: primaryToolColor,
    boxShadow: `0 0 12px ${primaryToolColor}40`,
  } : {};

  return (
    <div
      className={`arch-node kind-${data.kind} anim-${data.animation} ${highlightClass} ${dimClass} ${focusClass} ${
        hasPorts ? 'has-ports' : ''
      } ${data.isBottleneck ? 'is-bottleneck' : ''} ${data.isIsolated ? 'is-isolated' : ''} ${
        data.isEntry ? 'is-entry' : ''
      } ${data.simState && data.simState !== 'healthy' ? `sim-state-${data.simState}` : ''}`}
      style={{
        ...glowStyle,
        ...(data.branchColor ? ({ ['--node-color']: data.branchColor } as CSSProperties) : {}),
      }}
      title={data.isBottleneck ? data.bottleneckHint ?? data.bottleneckType : data.filePath ?? data.label}
    >
      <Handle type="target" position={Position.Left} />

      {isLive && (
        <span
          className="live-pulsing-dot"
          title={`This file connects to: ${internetTools.map((t) => t.name).join(', ')}`}
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            boxShadow: '0 0 8px #10b981',
            zIndex: 10,
          }}
        />
      )}

      {paletteBadges.length > 0 && (
        <div className={`node-palette-rail${data.isLite ? ' is-lite' : ''}`} aria-label="Detected node capabilities">
          {paletteBadges.map((badge) => (
            <PaletteBadge key={badge.id} badge={badge} nodeLabel={data.label} />
          ))}
        </div>
      )}

      {!data.isLite && data.isEntry && (
        <span className="entry-badge" title="Entry point of this lane">
          <span className="entry-icon">★</span>
          ENTRY
        </span>
      )}

      {!data.isLite && data.depth !== undefined && (
        <span className="depth-badge" title={`Depth ${data.depth} from the entry point`}>
          L{data.depth}
        </span>
      )}

      {!data.isLite && data.isBottleneck && (
        <span className="bottleneck-badge" title={data.bottleneckHint}>
          <span className="bottleneck-icon">⚠</span>
          {data.bottleneckType}
        </span>
      )}

      {!data.isLite && data.isIsolated && data.isolationReason && (
        <span className="isolation-badge" title={`${data.isolationReason} - this node has no connections to the rest of the project.`}>
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
        {data.kind === 'database' && <span className="node-kind-glyph" aria-hidden="true">DB</span>}
        <span className="node-header-text">
          <span className="node-name" title={data.label}>{data.label}</span>
          <span className="node-type">{data.kind}</span>
        </span>
      </div>

      {ports && ports.outgoing.length > 0 && (
        <div className="node-ports node-ports-out">
          {ports.outgoing.map((p, i) => (
            <Port key={`out-${i}`} port={p} />
          ))}
        </div>
      )}

      {data.simState && data.simState !== 'healthy' && (
        <span className={`sim-node-label lbl-${data.simState}`}>
          {SIM_STATE_LABEL[data.simState]}
        </span>
      )}

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function parseDbSchema(raw: string): DbTable[] | null {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function buildNodePaletteBadges(data: ArchNodeData): NodePaletteBadge[] {
  const badges = new Map<string, NodePaletteBadge>();
  // Everything already on this node, so a tip the node already satisfies is hidden.
  const present = new Set<string>();
  for (const tool of data.detectedTools ?? []) {
    present.add(tool.name.toLowerCase());
    present.add(tool.category.toLowerCase());
  }

  if (data.kind === 'database') {
    const rec = getNodeRecommendation('Database', 'database', present);
    badges.set('database-kind', {
      id: 'database-kind',
      label: 'DB',
      color: '#60a5fa',
      title: 'Detected database model, schema, client, or query surface',
      toolName: 'Database',
      category: 'database',
      recommend: rec?.recommend,
      why: rec?.why,
    });
  }

  for (const tool of data.detectedTools ?? []) {
    if (!['database', 'auth', 'storage', 'realtime', 'api-client', 'ai', 'payment'].includes(tool.category)) continue;
    const label = compactToolLabel(tool.name, tool.category);
    const rec = getNodeRecommendation(tool.name, tool.category, present);
    badges.set(tool.id, {
      id: tool.id,
      label,
      color: tool.color,
      title: `${tool.name} ${tool.category}`,
      toolName: tool.name,
      category: tool.category,
      recommend: rec?.recommend,
      why: rec?.why,
    });
  }

  return [...badges.values()];
}

/** A capability chip with a hover card: what the node uses + a recommended
 *  improvement and why it's better. Click opens the full detail panel. */
function PaletteBadge({ badge, nodeLabel }: { badge: NodePaletteBadge; nodeLabel: string }) {
  return (
    <span
      className="node-palette-badge has-card nodrag nopan"
      style={{ ['--palette-color' as string]: badge.color }}
      role="button"
      tabIndex={0}
      title="Click for details"
      onClick={(e) => {
        e.stopPropagation();
        capabilityBus.open({
          nodeLabel,
          toolName: badge.toolName,
          category: badge.category,
          color: badge.color,
          recommend: badge.recommend,
          why: badge.why,
        });
      }}
    >
      <span className="node-badge-label">{badge.label}</span>
      <span className="node-badge-card">
        <span className="node-badge-row">
          <span className="node-badge-key">Uses</span>
          <span className="node-badge-val">{badge.toolName}</span>
        </span>
        {badge.recommend ? (
          <>
            <span className="node-badge-row">
              <span className="node-badge-key node-badge-add">Add</span>
              <span className="node-badge-val">{badge.recommend}</span>
            </span>
            <span className="node-badge-row">
              <span className="node-badge-key node-badge-why">Why</span>
              <span className="node-badge-val node-badge-why-text">{badge.why}</span>
            </span>
          </>
        ) : (
          <span className="node-badge-row node-badge-muted">{badge.title}</span>
        )}
      </span>
    </span>
  );
}

function compactToolLabel(name: string, category: string): string {
  const special: Record<string, string> = {
    'Supabase Auth': 'AUTH',
    NextAuth: 'AUTH',
    Auth0: 'AUTH',
    Clerk: 'AUTH',
    Firebase: 'FIRE',
    MongoDB: 'MONGO',
    PlanetScale: 'PSCALE',
    'Google Gemini': 'GEM',
    'Vercel AI SDK': 'AI',
    GraphQL: 'GQL',
  };
  if (special[name]) return special[name];
  if (category === 'auth') return 'AUTH';
  if (category === 'database') return name.replace(/\s+/g, '').slice(0, 6).toUpperCase();
  return name.replace(/\s+/g, '').slice(0, 5).toUpperCase();
}

/** Memoized so unaffected nodes don't re-render on hover/selection in large graphs. */
export const ArchNode = memo(ArchNodeImpl);

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
