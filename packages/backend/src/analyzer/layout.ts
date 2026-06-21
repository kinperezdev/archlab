/**
 * Layout pass — a left-to-right "mind map" tree.
 *
 * The root(s) sit on the left and the graph branches rightward by depth, with
 * each node's children stacked vertically and the parent centered against them
 * (a tidy Reingold-Tilford-style layout). Large projects therefore grow to the
 * RIGHT as a readable tree instead of a dense grid you scroll through.
 */

import type { CanvasNode, CanvasEdge } from '@archlab/shared';

const COL_WIDTH = 340; // horizontal gap between depth levels
const ROW_GAP = 96; // vertical gap between sibling leaves
const LEFT = 80;
const TOP = 80;

/** Mutate-free layout: returns new nodes positioned as a left-to-right tree. */
export function layout(nodes: CanvasNode[], edges: CanvasEdge[] = []): CanvasNode[] {
  if (nodes.length === 0) return nodes;

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const childrenOf = new Map<string, string[]>();
  const indegree = new Map<string, number>();
  for (const n of nodes) {
    childrenOf.set(n.id, []);
    indegree.set(n.id, 0);
  }
  for (const e of edges) {
    if (e.source === e.target) continue;
    if (!byId.has(e.source) || !byId.has(e.target)) continue;
    childrenOf.get(e.source)!.push(e.target);
    indegree.set(e.target, (indegree.get(e.target) ?? 0) + 1);
  }

  // Roots = nodes nothing points to. (Cyclic graph with no source falls back to
  // the first node so we always have at least one tree to lay out.)
  const roots = nodes.filter((n) => (indegree.get(n.id) ?? 0) === 0).map((n) => n.id);
  if (roots.length === 0) roots.push(nodes[0].id);

  // Build a spanning tree via BFS so each node has a single parent (graphs can
  // have multiple parents and cycles; this keeps the tree well-formed).
  const visited = new Set<string>();
  const depth = new Map<string, number>();
  const treeChildren = new Map<string, string[]>();
  for (const n of nodes) treeChildren.set(n.id, []);
  const queue: string[] = [];
  const seedRoot = (id: string) => {
    if (visited.has(id)) return;
    visited.add(id);
    depth.set(id, 0);
    queue.push(id);
  };
  roots.forEach(seedRoot);
  // Any node not reached from a real root becomes its own root (disconnected).
  for (const n of nodes) if (!visited.has(n.id)) { roots.push(n.id); seedRoot(n.id); }

  let head = 0;
  while (head < queue.length) {
    const id = queue[head++];
    for (const c of childrenOf.get(id) ?? []) {
      if (visited.has(c)) continue;
      visited.add(c);
      depth.set(c, (depth.get(id) ?? 0) + 1);
      treeChildren.get(id)!.push(c);
      queue.push(c);
    }
  }

  // Assign vertical slots: leaves get sequential rows; a parent centers on its
  // children. Iterative post-order so deep trees can't overflow the stack.
  const yPos = new Map<string, number>();
  let leafCursor = 0;
  for (const rootId of roots) {
    const stack: Array<{ id: string; phase: 0 | 1 }> = [{ id: rootId, phase: 0 }];
    while (stack.length) {
      const frame = stack[stack.length - 1];
      const kids = treeChildren.get(frame.id) ?? [];
      if (frame.phase === 0) {
        frame.phase = 1;
        if (kids.length === 0) {
          yPos.set(frame.id, leafCursor * ROW_GAP);
          leafCursor++;
          stack.pop();
        } else {
          for (let i = kids.length - 1; i >= 0; i--) stack.push({ id: kids[i], phase: 0 });
        }
      } else {
        const first = yPos.get(kids[0])!;
        const last = yPos.get(kids[kids.length - 1])!;
        yPos.set(frame.id, (first + last) / 2);
        stack.pop();
      }
    }
    leafCursor++; // a blank row between separate root trees
  }

  return nodes.map((n) => ({
    ...n,
    position: {
      x: LEFT + (depth.get(n.id) ?? 0) * COL_WIDTH,
      y: TOP + (yPos.get(n.id) ?? 0),
    },
  }));
}
