/**
 * Layout pass — a left-to-right "mind map" built from the project's folder tree.
 *
 * The project root sits on the left and each folder level steps one column to the
 * right (project -> folders -> files), with sibling files stacked vertically and
 * each branch centered against its children. Using the directory hierarchy (not
 * the dependency edges) guarantees a single, well-formed tree that reads cleanly
 * left-to-right, instead of dozens of entry files stacking into one tall column.
 */

import type { CanvasNode, CanvasEdge } from '@archlab/shared';

const COL_WIDTH = 340; // horizontal gap between folder depth levels
const ROW_GAP = 82; // vertical gap between sibling files
const GROUP_GAP = 22; // extra gap between distinct folders
const LEFT = 80;
const TOP = 40; // keep entry/top nodes near the top with a small padding
const MAX_ROWS_PER_COLUMN = 18;
const WRAP_COL_WIDTH = 330;

interface TrieNode {
  children: Map<string, TrieNode>;
  /** Set when an actual file node lives exactly at this path. */
  nodeId?: string;
  /** Computed vertical center. */
  y?: number;
}

/** Mutate-free layout: positions nodes as a left-to-right folder tree. */
export function layout(nodes: CanvasNode[], _edges: CanvasEdge[] = []): CanvasNode[] {
  if (nodes.length === 0) return nodes;

  // Build a trie keyed by path segments (folders), with files as leaves.
  const root: TrieNode = { children: new Map() };
  const depthOf = new Map<string, number>();
  for (const node of nodes) {
    const rel = (node.filePath ?? node.label ?? node.id).replace(/^\.?\//, '');
    const segments = rel.split('/').filter(Boolean);
    let cur = root;
    segments.forEach((seg, i) => {
      let next = cur.children.get(seg);
      if (!next) {
        next = { children: new Map() };
        cur.children.set(seg, next);
      }
      cur = next;
      if (i === segments.length - 1) cur.nodeId = node.id;
    });
    depthOf.set(node.id, Math.max(0, segments.length - 1));
  }

  // Tidy vertical layout: leaves get sequential rows; a folder centers on its
  // children. Iterative post-order so deep trees can't overflow the stack.
  const yById = new Map<string, number>();
  let cursor = 0;
  const place = (start: TrieNode) => {
    const stack: Array<{ node: TrieNode; phase: 0 | 1 }> = [{ node: start, phase: 0 }];
    while (stack.length) {
      const frame = stack[stack.length - 1];
      const kids = [...frame.node.children.values()];
      if (frame.phase === 0) {
        frame.phase = 1;
        // A file sitting directly at this path occupies its own row.
        if (frame.node.nodeId !== undefined && kids.length === 0) {
          frame.node.y = cursor * ROW_GAP;
          yById.set(frame.node.nodeId, frame.node.y);
          cursor++;
          stack.pop();
          continue;
        }
        for (let i = kids.length - 1; i >= 0; i--) stack.push({ node: kids[i], phase: 0 });
      } else {
        if (kids.length > 0) {
          const first = kids[0].y ?? cursor * ROW_GAP;
          const last = kids[kids.length - 1].y ?? first;
          frame.node.y = (first + last) / 2;
          // A folder that ALSO has a file node at its path shares that center.
          if (frame.node.nodeId !== undefined) yById.set(frame.node.nodeId, frame.node.y);
        }
        stack.pop();
      }
    }
  };

  // Lay out each top-level folder/file as its own group with a gap between them.
  for (const child of root.children.values()) {
    place(child);
    cursor += GROUP_GAP / ROW_GAP + 1; // blank space between top-level branches
  }

  return nodes.map((n) => ({
    ...n,
    position: compactPosition(depthOf.get(n.id) ?? 0, yById.get(n.id) ?? 0),
  }));
}

/**
 * Large repositories can have hundreds of files under one folder depth. A pure
 * vertical tree becomes a several-thousand-pixel column that opens as a hairline
 * when React Flow fits the full bounds. Wrap those long rows into readable
 * columns while preserving the folder-depth signal left to right.
 */
function compactPosition(depth: number, rawY: number): { x: number; y: number } {
  const row = Math.max(0, Math.round(rawY / ROW_GAP));
  const wrap = Math.floor(row / MAX_ROWS_PER_COLUMN);
  const wrappedRow = row % MAX_ROWS_PER_COLUMN;
  return {
    x: LEFT + depth * COL_WIDTH + wrap * WRAP_COL_WIDTH,
    y: TOP + wrappedRow * ROW_GAP,
  };
}
