/**
 * A boolean React state that persists to localStorage, so layout choices like a
 * collapsed sidebar survive a page refresh. Falls back to the default if storage
 * is unavailable or holds a malformed value.
 */

import { useCallback, useEffect, useState } from 'react';

export function usePersistentBoolean(
  key: string,
  defaultValue: boolean,
): [boolean, (next: boolean | ((p: boolean) => boolean)) => void, () => void] {
  const [value, setValue] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? defaultValue : raw === 'true';
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, String(value));
    } catch {
      /* storage blocked — keep the in-memory value */
    }
  }, [key, value]);

  const toggle = useCallback(() => setValue((p) => !p), []);

  return [value, setValue, toggle];
}
