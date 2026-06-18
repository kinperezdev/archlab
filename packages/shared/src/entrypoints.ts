/**
 * Multi-language entry-point detection.
 *
 * Conventional "this is where the app boots" filenames per language. Shared so
 * the backend classifier can flag entry nodes and the frontend canvas can draw
 * the ENTRY badge from the exact same source of truth.
 */

export const ENTRY_PATTERNS: Record<string, RegExp> = {
  // JS/TS web + node entry files.
  web: /(^|\/)(main|index|app|server)\.(tsx|jsx|ts|js|mjs|cjs)$/i,
  python: /(^|\/)(__main__|manage|wsgi|asgi|app|main)\.py$/i,
  go: /(^|\/)main\.go$/i,
  rust: /(^|\/)main\.rs$/i,
  java: /(^|\/)Application\.java$/i,
  kotlin: /(^|\/)MainActivity\.kt$|(^|\/)Application\.kt$/i,
  swift: /(^|\/)AppDelegate\.swift$|(^|\/)App\.swift$/i,
  dart: /(^|\/)main\.dart$/i,
  php: /(^|\/)(index|artisan)\.php$/i,
  ruby: /(^|\/)(config\/application|config\.ru|Rakefile)$/,
  csharp: /(^|\/)Program\.cs$/i,
};

/** Whether a project-relative file path is a conventional entry point. */
export function isEntryFile(filePath: string | null | undefined): boolean {
  if (!filePath) return false;
  for (const re of Object.values(ENTRY_PATTERNS)) {
    if (re.test(filePath)) return true;
  }
  return false;
}
