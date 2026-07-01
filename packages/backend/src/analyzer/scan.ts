/**
 * File-system scanner.
 *
 * Walks any project folder regardless of framework or language and returns a
 * flat list of source files with light metadata. Heavy/irrelevant directories
 * are skipped so large repos stay fast.
 */

import fs from 'node:fs';
import path from 'node:path';

/** Directories we never descend into. */
const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'brain', // ArchLab's generated local state, never source evidence for an analyzed project.
  'dist',
  'build',
  '.next',
  '.turbo',
  'coverage',
  '.cache',
  'vendor', // Go / PHP (Composer) dependencies
  '__pycache__',
  '.pytest_cache',
  '.venv',
  'venv',
  'Pods', // iOS CocoaPods
  '.symlinks',
  '.dart_tool',
  '.gradle',
  'gradle',
  '.idea',
  '.vscode',
  'target', // Rust / Maven build output
  '.build', // Swift Package Manager build output
  'DerivedData', // Xcode build output
]);

/** How many files we map onto the canvas. Capped so React Flow stays responsive
 *  and doesn't freeze/crash the tab; the scanner prioritizes the most meaningful
 *  source files when a project exceeds this. */
const MAX_FILES = 1500;
/** Upper bound on paths we'll enumerate before prioritizing (safety valve). */
const MAX_WALK = 80_000;
/** Only read content for files smaller than this (bytes) for heuristics. */
const MAX_READ_BYTES = 200_000;

export interface ScannedFile {
  /** Absolute path on disk. */
  absPath: string;
  /** Path relative to the project root, using forward slashes. */
  relPath: string;
  ext: string;
  /** File content, or '' if too large / unreadable. */
  content: string;
}

export interface ScanResult {
  root: string;
  name: string;
  files: ScannedFile[];
}

/**
 * Count the files a folder would contribute to an analysis, applying the same
 * directory-skipping rules as the scanner (node_modules, dotdirs, etc.). Stops
 * early once `cap` is exceeded so huge trees never block the UI; the returned
 * count is therefore "at least this many" when it reaches the cap.
 */
export function countProjectFiles(root: string, cap = 20_000): number {
  const absRoot = path.resolve(root);
  if (!fs.existsSync(absRoot) || !fs.statSync(absRoot).isDirectory()) return 0;

  let count = 0;
  const stack: string[] = [absRoot];
  while (stack.length > 0 && count <= cap) {
    const dir = stack.pop()!;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
          stack.push(path.join(dir, entry.name));
        }
      } else if (entry.isFile()) {
        count += 1;
      }
    }
  }
  return count;
}

/** Recursively scan a project folder into a flat file list. */
export function scanProject(root: string): ScanResult {
  const absRoot = path.resolve(root);
  if (!fs.existsSync(absRoot) || !fs.statSync(absRoot).isDirectory()) {
    throw new Error(`Not a directory: ${absRoot}`);
  }

  // Phase 1: enumerate candidate paths cheaply (no content reads), so a huge
  // monorepo doesn't blow up memory. Bounded by MAX_WALK as a safety valve.
  interface Candidate {
    absPath: string;
    relPath: string;
    name: string;
    ext: string;
  }
  const candidates: Candidate[] = [];
  const stack: string[] = [absRoot];
  while (stack.length > 0 && candidates.length < MAX_WALK) {
    const dir = stack.pop()!;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue; // Unreadable directory: skip rather than crash.
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
          stack.push(path.join(dir, entry.name));
        }
        continue;
      }
      if (!entry.isFile()) continue;
      const absPath = path.join(dir, entry.name);
      const relPath = path.relative(absRoot, absPath).split(path.sep).join('/');
      candidates.push({ absPath, relPath, name: entry.name, ext: path.extname(entry.name).toLowerCase() });
    }
  }

  // Phase 2: when over the canvas cap, prioritize the most meaningful files —
  // source code first, then known config/manifest files, then everything else;
  // within a tier prefer shallower paths so top-level structure wins.
  if (candidates.length > MAX_FILES) {
    const tier = (c: Candidate): number =>
      isTextExt(c.ext) ? 0 : isAlwaysReadFile(c.name) ? 1 : 2;
    const depth = (c: Candidate): number => c.relPath.split('/').length;
    candidates.sort((a, b) => tier(a) - tier(b) || depth(a) - depth(b) || a.relPath.localeCompare(b.relPath));
    candidates.length = MAX_FILES;
  }

  // Phase 3: read content only for the selected, reasonably-sized text files.
  const files: ScannedFile[] = candidates.map((c) => {
    let content = '';
    try {
      const stat = fs.statSync(c.absPath);
      if (stat.size <= MAX_READ_BYTES && (isTextExt(c.ext) || isAlwaysReadFile(c.name))) {
        content = fs.readFileSync(c.absPath, 'utf8');
      }
    } catch {
      // Ignore unreadable file content; keep the node, drop the text.
    }
    return { absPath: c.absPath, relPath: c.relPath, ext: c.ext, content };
  });

  return { root: absRoot, name: path.basename(absRoot), files };
}

/** Whether we should attempt to read this extension as text for heuristics. */
function isTextExt(ext: string): boolean {
  return [
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.mjs',
    '.cjs',
    '.py',
    '.go',
    '.rb',
    '.php',
    '.java',
    '.rs',
    '.json',
    '.env',
    '.yml',
    '.yaml',
    '.sql',
    '.prisma',
    '.vue',
    '.svelte',
    '.html',
    '.css',
    '.dart',
    '.swift',
    '.kt',
    '.cs',
    '.cpp',
    '.cc',
    '.c',
    '.h',
    '.hpp',
    '.m',
    '.scala',
    // Build / dependency manifests and templates across ecosystems.
    '.toml', // Rust Cargo.toml, Python pyproject.toml
    '.mod', // Go go.mod
    '.sum', // Go go.sum
    '.gradle', // Java/Kotlin Gradle build files
    '.groovy', // Gradle / Jenkins pipelines
    '.erb', // Ruby ERB templates
    '.blade', // Laravel Blade templates
    '.proto', // Protocol Buffers / gRPC
    '.rake', // Ruby Rake tasks
    '.podspec', // CocoaPods spec
    '.xcconfig', // Xcode build config
  ].includes(ext);
}

/** Extensionless config/build files we always read as text, matched by name. */
const ALWAYS_READ_FILES = new Set([
  'Dockerfile',
  'Makefile',
  'Gemfile',
  'Procfile',
  'Cartfile',
  'Podfile',
  'Fastfile',
  'Dangerfile',
]);

/** Whether a file (by basename) should always be read regardless of extension. */
function isAlwaysReadFile(name: string): boolean {
  return ALWAYS_READ_FILES.has(name);
}
