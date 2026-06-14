/**
 * Supporting React Flow pieces for the Database Designer canvas:
 *   - GroupContainer: the tinted "Confirmed Schema" / "Inferred from App Flow"
 *     backdrop that visually separates real tables from suggestions.
 *   - RelationshipEdge: a foreign-key edge that shows the relationship type as a
 *     label and the exact joining columns as a hover tooltip.
 */

import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  Position,
  type EdgeProps,
  type NodeProps,
} from 'reactflow';

export interface GroupData {
  label: string;
  variant: 'confirmed' | 'inferred';
  width: number;
  height: number;
}

/** A non-interactive backdrop grouping a cluster of table nodes. */
export function GroupContainer({ data }: NodeProps<GroupData>) {
  return (
    <div
      className={`db-group db-group-${data.variant}`}
      style={{ width: data.width, height: data.height }}
    >
      <span className="db-group-label">
        {data.variant === 'inferred' && <span className="db-group-bulb">💡</span>}
        {data.label}
      </span>
    </div>
  );
}

export interface RelationshipEdgeData {
  /** "one-to-many" | "many-to-one" | "one-to-one". */
  relType: string;
  /** Exact columns that form the relationship, for the hover tooltip. */
  tooltip: string;
  /** Inferred / unverified relationships render amber + dashed. */
  inferred: boolean;
}

/** A foreign-key edge with a relationship-type label and column tooltip. */
export function RelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  data,
}: EdgeProps<RelationshipEdgeData>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition: sourcePosition ?? Position.Right,
    targetX,
    targetY,
    targetPosition: targetPosition ?? Position.Left,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      {/* Invisible wide path so the tooltip is easy to hover. */}
      <path d={edgePath} fill="none" stroke="transparent" strokeWidth={16}>
        <title>{data?.tooltip}</title>
      </path>
      <EdgeLabelRenderer>
        <div
          className={`rel-edge-label ${data?.inferred ? 'inferred' : 'confirmed'}`}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
          title={data?.tooltip}
        >
          {data?.relType}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
