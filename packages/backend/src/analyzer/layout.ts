/**
 * Layout pass — positions nodes as two horizontal swim lanes:
 *
 *   Frontend lane  -> left half of the canvas
 *   Backend lane   -> right half of the canvas
 *   External lane  -> far right (databases, services, configs, MCP)
 *
 * Within each lane, nodes spread horizontally across several columns and wrap
 * to a new row, so a project never collapses into a single vertical stack.
 */

import type { CanvasNode, Lane } from '@archlab/shared';

const COL_WIDTH = 400; // generous horizontal gap so edges have room to breathe
const ROW_HEIGHT = 250; // generous vertical gap between rows
const TOP = 120;

/** Horizontal start (x0) and column count for each lane region. */
const LANE_REGIONS: Record<Lane, { x0: number; cols: number }> = {
  frontend: { x0: 80, cols: 3 }, // left half
  backend: { x0: 1480, cols: 3 }, // right half, clear of the frontend lane
  external: { x0: 2880, cols: 1 }, // far right column
};

/** Mutate-free layout: returns new nodes with computed positions. */
export function layout(nodes: CanvasNode[]): CanvasNode[] {
  // Per-lane running index drives the grid placement within that lane.
  const laneIndex: Record<Lane, number> = { frontend: 0, backend: 0, external: 0 };

  return nodes.map((node) => {
    const region = LANE_REGIONS[node.lane] ?? LANE_REGIONS.external;
    const i = laneIndex[node.lane]++;
    const col = i % region.cols;
    const row = Math.floor(i / region.cols);

    return {
      ...node,
      position: {
        x: region.x0 + col * COL_WIDTH,
        y: TOP + row * ROW_HEIGHT,
      },
    };
  });
}
