/**
 * Generic node-highlight helper for any React Flow canvas.
 *
 * Given the active (hovered or locked) node id and the edge list, returns the
 * className for each node: bright for the active node and its direct neighbors,
 * dimmed for everything else. Works with any node type because it only sets a
 * class the CSS reacts to.
 */

import type { Edge } from 'reactflow';

/** The active node plus every node directly connected to it. */
export function neighborSet(activeId: string, edges: Edge[]): Set<string> {
  const set = new Set<string>([activeId]);
  for (const e of edges) {
    if (e.source === activeId) set.add(e.target);
    if (e.target === activeId) set.add(e.source);
  }
  return set;
}

/** Strip any previously applied highlight classes from a className string. */
export function stripHighlight(className?: string): string {
  return (className ?? '').replace(/\brf-(highlight|dim)\b/g, '').trim();
}

/** Compute the highlight className for a node id given the active node. */
export function highlightClass(
  nodeId: string,
  activeId: string | null,
  neighbors: Set<string> | null,
  base?: string,
): string {
  const cleaned = stripHighlight(base);
  if (!activeId || !neighbors) return cleaned;
  const cls = neighbors.has(nodeId) ? 'rf-highlight' : 'rf-dim';
  return `${cleaned} ${cls}`.trim();
}
