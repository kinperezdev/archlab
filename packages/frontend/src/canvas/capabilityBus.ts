/**
 * Tiny one-listener bus so a node's capability chip (rendered deep inside React
 * Flow) can open the dedicated capability panel in the app shell without
 * threading callbacks through Canvas + node data on every render.
 */

import type { CapabilityDetail } from './nodeRecommendations.js';

type Listener = (cap: CapabilityDetail) => void;

let listener: Listener | null = null;

export const capabilityBus = {
  /** Fired by a chip click. */
  open(cap: CapabilityDetail) {
    listener?.(cap);
  },
  /** The app shell subscribes once; returns an unsubscribe. */
  subscribe(next: Listener): () => void {
    listener = next;
    return () => {
      if (listener === next) listener = null;
    };
  },
};
