/**
 * A number React state that persists to localStorage and is clamped to a range.
 * Used for resizable panel widths so a user's preferred size survives refreshes.
 */

import { useCallback, useState } from 'react';

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function usePersistentNumber(
  key: string,
  defaultValue: number,
  min: number,
  max: number,
): [number, (next: number) => void] {
  const [value, setValue] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw === null ? defaultValue : Number(raw);
      return Number.isFinite(parsed) ? clamp(parsed, min, max) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const set = useCallback(
    (next: number) => {
      const clamped = clamp(next, min, max);
      setValue(clamped);
      try {
        localStorage.setItem(key, String(clamped));
      } catch {
        /* storage blocked — keep the in-memory value */
      }
    },
    [key, min, max],
  );

  return [value, set];
}
