/**
 * Binary split-tree model for a terminal tab.
 *
 * A tab's content is a tree: every node is either a `leaf` (one PTY session,
 * identified by its terminal id) or a `split` of two child nodes laid out in a
 * row (left/right) or col (top/bottom). This is the iTerm/tmux model — "Split →"
 * turns the focused leaf into a row, "Split ↓" turns it into a col.
 */

export type PaneNode =
  | { kind: 'leaf'; id: string }
  | { kind: 'split'; id: string; dir: 'row' | 'col'; ratio: number; a: PaneNode; b: PaneNode };

export const MAX_PANES = 4;

/** Monotonic id source for split nodes, so each split keeps a stable React key
 *  across reshapes (splitting/closing) and never forces a child to remount. */
let nextSplitSeq = 1;
const newSplitId = () => `split-${nextSplitSeq++}-${Date.now().toString(36)}`;

export function makeLeaf(id: string): PaneNode {
  return { kind: 'leaf', id };
}

/** Stable React key for a pane node's sibling position. Uses the subtree's first
 *  leaf id: it is unique across siblings and stays constant when a split collapses
 *  onto its surviving side, so the live Terminal underneath is never remounted. */
export function paneKey(node: PaneNode): string {
  return firstLeafId(node);
}

/** All terminal ids in the tree, in visual order. */
export function leafIds(node: PaneNode): string[] {
  if (node.kind === 'leaf') return [node.id];
  return [...leafIds(node.a), ...leafIds(node.b)];
}

export function leafCount(node: PaneNode): number {
  return node.kind === 'leaf' ? 1 : leafCount(node.a) + leafCount(node.b);
}

/** First leaf id (used as a fallback focus target). */
export function firstLeafId(node: PaneNode): string {
  return node.kind === 'leaf' ? node.id : firstLeafId(node.a);
}

/**
 * Split the leaf with `targetId` into a `dir` split: the existing leaf stays as
 * the first child, `newId` becomes the second. Returns a new tree (immutable).
 */
export function splitLeaf(
  node: PaneNode,
  targetId: string,
  dir: 'row' | 'col',
  newId: string,
): PaneNode {
  if (node.kind === 'leaf') {
    if (node.id !== targetId) return node;
    return { kind: 'split', id: newSplitId(), dir, ratio: 0.5, a: makeLeaf(targetId), b: makeLeaf(newId) };
  }
  return {
    ...node,
    a: splitLeaf(node.a, targetId, dir, newId),
    b: splitLeaf(node.b, targetId, dir, newId),
  };
}

/**
 * Remove the leaf with `targetId`. When a split loses one child, it collapses to
 * the surviving child. Returns the new tree, or null if the whole tree was that
 * single leaf (caller decides what that means).
 */
export function removeLeaf(node: PaneNode, targetId: string): PaneNode | null {
  if (node.kind === 'leaf') {
    return node.id === targetId ? null : node;
  }
  const a = removeLeaf(node.a, targetId);
  const b = removeLeaf(node.b, targetId);
  if (a === null) return b;
  if (b === null) return a;
  return { ...node, a, b };
}

/** Resize one split node by id. Ratio is the first child share, clamped by caller. */
export function resizeSplit(node: PaneNode, splitId: string, ratio: number): PaneNode {
  if (node.kind === 'leaf') return node;
  if (node.id === splitId) return { ...node, ratio };
  return {
    ...node,
    a: resizeSplit(node.a, splitId, ratio),
    b: resizeSplit(node.b, splitId, ratio),
  };
}

/** Ensure old saved split layouts receive a ratio after schema upgrades. */
export function hydratePaneLayout(node: PaneNode): PaneNode {
  if (node.kind === 'leaf') return node;
  return {
    ...node,
    ratio: typeof node.ratio === 'number' && Number.isFinite(node.ratio) ? node.ratio : 0.5,
    a: hydratePaneLayout(node.a),
    b: hydratePaneLayout(node.b),
  };
}
