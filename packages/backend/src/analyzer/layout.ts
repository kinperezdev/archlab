/**
 * Layout pass — positions nodes as stacked horizontal lanes:
 *
 *   Frontend lane  -> top band
 *   Backend lane   -> middle band
 *   External lane  -> bottom band (databases, services, configs, MCP)
 *
 * Within each lane, nodes fill a small fixed number of rows and then extend to
 * the RIGHT, so a large project grows horizontally (you slide right) instead of
 * stacking into an ever-deeper vertical column you have to scroll down.
 */

import type { CanvasNode, Lane } from '@archlab/shared';

const COL_WIDTH = 360; // horizontal gap between columns
const ROW_HEIGHT = 200; // vertical gap between the few rows in a lane
const ROWS_PER_LANE = 3; // each lane is this many rows tall, then grows rightward
const LANE_GAP = 220; // vertical gap between lane bands
const LEFT = 120;
const TOP = 120;

const LANE_HEIGHT = ROWS_PER_LANE * ROW_HEIGHT + LANE_GAP;

/** Vertical start (y0) for each lane band; all lanes share the same left edge. */
const LANE_Y0: Record<Lane, number> = {
  frontend: TOP,
  backend: TOP + LANE_HEIGHT,
  external: TOP + LANE_HEIGHT * 2,
};

/** Mutate-free layout: returns new nodes with computed positions. */
export function layout(nodes: CanvasNode[]): CanvasNode[] {
  // Per-lane running index drives the grid placement within that lane.
  const laneIndex: Record<Lane, number> = { frontend: 0, backend: 0, external: 0 };

  return nodes.map((node) => {
    const y0 = LANE_Y0[node.lane] ?? LANE_Y0.external;
    const i = laneIndex[node.lane]++;
    // Fill rows top-to-bottom first, then move to the next column on the right.
    const row = i % ROWS_PER_LANE;
    const col = Math.floor(i / ROWS_PER_LANE);

    return {
      ...node,
      position: {
        x: LEFT + col * COL_WIDTH,
        y: y0 + row * ROW_HEIGHT,
      },
    };
  });
}
