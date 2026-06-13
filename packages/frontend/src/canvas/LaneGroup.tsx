/**
 * A non-interactive background container rendered behind a swim-lane group of
 * nodes. It gives each architectural layer (Frontend, Backend) an immediately
 * visible tinted region so the separation reads at a glance without zooming.
 */

import type { NodeProps } from 'reactflow';

export type LaneVariant = 'frontend' | 'backend' | 'connected' | 'isolated';

export interface LaneGroupData {
  label: string;
  variant: LaneVariant;
  width: number;
  height: number;
}

export function LaneGroup({ data }: NodeProps<LaneGroupData>) {
  return (
    <div
      className={`lane-group lane-group-${data.variant}`}
      style={{ width: data.width, height: data.height }}
    >
      <span className="lane-group-label">{data.label}</span>
    </div>
  );
}
