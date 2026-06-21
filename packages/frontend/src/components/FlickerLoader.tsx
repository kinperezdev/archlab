/**
 * Flicker-style pixel loader (flicker.laurie.fyi).
 *
 * A 5x5 pixel grid whose 16 perimeter cells flicker on/off in sequence, so a
 * short comet of lit pixels chases around the ring. Driven by the same CSS
 * variables Flicker exports — `--on`, `--off`, `--dur` — so colours and speed
 * stay themeable. Pure SVG + CSS; no JS animation loop.
 */

import type { CSSProperties } from 'react';

// Perimeter cells of a 5x5 grid, clockwise from the top-left corner.
const RING: ReadonlyArray<readonly [number, number]> = [
  [0, 0], [1, 0], [2, 0], [3, 0], [4, 0],
  [4, 1], [4, 2], [4, 3], [4, 4],
  [3, 4], [2, 4], [1, 4], [0, 4],
  [0, 3], [0, 2], [0, 1],
];

interface FlickerLoaderProps {
  /** Rendered size in px (square). */
  size?: number;
  /** Lit pixel colour. Defaults to the accent token. */
  on?: string;
  /** Unlit pixel colour. */
  off?: string;
  /** Full cycle duration, e.g. "0.9s". */
  dur?: string;
  className?: string;
}

export function FlickerLoader({
  size = 16,
  on = 'var(--accent, #6366f1)',
  off = 'color-mix(in srgb, var(--accent, #6366f1) 18%, transparent)',
  dur = '0.9s',
  className = '',
}: FlickerLoaderProps) {
  const style = {
    '--flicker-on': on,
    '--flicker-off': off,
    '--flicker-dur': dur,
  } as CSSProperties;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 5 5"
      className={`flicker ${className}`}
      style={style}
      role="status"
      aria-label="Loading"
      shapeRendering="crispEdges"
    >
      {RING.map(([x, y], i) => (
        <rect
          key={`${x}-${y}`}
          x={x + 0.1}
          y={y + 0.1}
          width={0.8}
          height={0.8}
          rx={0.15}
          className="flicker-cell"
          style={{ animationDelay: `calc(var(--flicker-dur) * ${-i / RING.length})` }}
        />
      ))}
    </svg>
  );
}
