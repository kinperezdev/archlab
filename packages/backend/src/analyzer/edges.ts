/**
 * Edge detection — derives real data-flow connections from the code.
 *
 * Two sources of edges:
 *  1. Import statements that resolve to another node's file (structural flow).
 *  2. Frontend `fetch`/axios calls to backend endpoints (request flow), matched
 *     loosely by path so we still draw a believable request lifecycle.
 */

import path from 'node:path';
import type { CanvasEdge, CanvasNode } from '@archlab/shared';
import type { ScannedFile } from './scan.js';

const IMPORT_RE = /(?:import\s+[\s\S]*?\s+from\s+|require\(\s*)['"]([^'"]+)['"]/g;
const FETCH_RE = /(?:fetch|axios(?:\.\w+)?)\(\s*[`'"]([^`'"]+)[`'"]/g;

/** Build edges connecting the classified nodes. */
export function detectEdges(
  files: ScannedFile[],
  fileToNode: Map<string, string>,
  nodes: CanvasNode[],
): CanvasEdge[] {
  const edges: CanvasEdge[] = [];
  const seen = new Set<string>();
  const byPath = new Map(files.map((f) => [f.relPath, f]));

  const push = (source: string, target: string, label?: string) => {
    if (source === target) return;
    const key = `${source}->${target}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ id: `e_${edges.length}`, source, target, label, animated: false });
  };

  // 1. Structural edges from imports.
  const importedDbNodes = new Map<string, Set<string>>();
  for (const file of files) {
    const sourceId = fileToNode.get(file.relPath);
    if (!sourceId || !file.content) continue;

    const specs: string[] = [];

    // Language-specific import extractors
    switch (file.ext) {
      case '.ts':
      case '.tsx':
      case '.js':
      case '.jsx':
      case '.vue':
      case '.svelte': {
        for (const match of file.content.matchAll(IMPORT_RE)) {
          const spec = match[1];
          if (spec.startsWith('.') || spec.startsWith('@/')) {
            specs.push(spec);
          }
        }
        break;
      }
      case '.dart': {
        for (const match of file.content.matchAll(/import\s+['"]([^'"]+)['"]/g)) {
          const spec = match[1];
          if (spec.startsWith('.') || spec.startsWith('package:')) {
            if (!spec.startsWith('package:flutter/') && !spec.startsWith('package:path/') && !spec.startsWith('package:meta/')) {
              specs.push(spec);
            }
          }
        }
        break;
      }
      case '.py': {
        // Both relative (`from .pkg import x`) and absolute (`from app.models import x`).
        for (const match of file.content.matchAll(/(?:from\s+([\w.]+)\s+import|^import\s+([\w.]+))/gm)) {
          const spec = match[1] || match[2];
          if (spec) specs.push(spec);
        }
        break;
      }
      case '.go': {
        // import "package/path" and import alias "package/path"
        for (const match of file.content.matchAll(/import\s+(?:\w+\s+)?"([\w\/.\-]+)"/g)) {
          specs.push(match[1]);
        }
        break;
      }
      case '.rb': {
        // require 'file' and require_relative 'file'
        for (const match of file.content.matchAll(/require(?:_relative)?\s+['"]([^'"]+)['"]/g)) {
          specs.push(match[1]);
        }
        break;
      }
      case '.php': {
        // use Namespace\Class and require/include 'file'
        for (const match of file.content.matchAll(/(?:use|require|include)(?:_once)?\s+['"]?([\\/\w]+)['"]?/g)) {
          specs.push(match[1]);
        }
        break;
      }
      case '.swift': {
        // import Framework / import Module
        for (const match of file.content.matchAll(/^import\s+(\w+)/gm)) {
          specs.push(match[1]);
        }
        break;
      }
      case '.rs': {
        for (const match of file.content.matchAll(/use\s+(?:crate|super|self)::([\w:]+)/g)) {
          specs.push(match[1]);
        }
        break;
      }
      case '.cpp':
      case '.cc':
      case '.cxx':
      case '.c':
      case '.h':
      case '.hpp': {
        for (const match of file.content.matchAll(/#include\s+['"]([^'"]+)['"]/g)) {
          specs.push(match[1]);
        }
        break;
      }
      case '.cs': {
        for (const match of file.content.matchAll(/using\s+([\w.]+);/g)) {
          specs.push(match[1]);
        }
        break;
      }
      case '.kt':
      case '.java':
      case '.scala': {
        for (const match of file.content.matchAll(/import\s+([\w.]+);?/g)) {
          specs.push(match[1]);
        }
        break;
      }
    }

    for (const spec of specs) {
      const targetRel = resolveImport(file.relPath, spec, byPath);
      if (!targetRel) continue;
      const targetId = fileToNode.get(targetRel);
      if (targetId) {
        const targetNode = nodes.find((n) => n.id === targetId);
        if (targetNode?.kind === 'database') {
          if (!importedDbNodes.has(sourceId)) {
            importedDbNodes.set(sourceId, new Set());
          }
          importedDbNodes.get(sourceId)!.add(targetId);
        } else {
          push(sourceId, targetId, 'imports');
        }
      }
    }
  }

  // 2. Request-flow edges: frontend fetch -> matching backend endpoint node.
  const endpoints = nodes.filter((n) => n.lane === 'backend' && n.kind === 'endpoint');
  for (const file of files) {
    const sourceId = fileToNode.get(file.relPath);
    if (!sourceId || !file.content) continue;
    for (const match of file.content.matchAll(FETCH_RE)) {
      const url = match[1];
      const segment = lastPathSegment(url);
      if (!segment) continue;
      const target = endpoints.find((n) =>
        n.label.toLowerCase().includes(segment.toLowerCase()),
      );
      if (target) push(sourceId, target.id, url);
    }
  }

  // 3. Navigation-flow edges: page-to-page transition paths (e.g. React Router Link/navigate, Flutter go_router)
  const routeNodes = nodes.filter((n) => n.kind === 'route');
  const NAV_RE = /(?:go|push|navigate|history\.push|to|href|pushNamed)\(\s*[`'"]([^`'"]+)[`'"]|to=[`'"]([^`'"]+)[`'"]/g;
  for (const file of files) {
    const sourceId = fileToNode.get(file.relPath);
    if (!sourceId || !file.content) continue;
    for (const match of file.content.matchAll(NAV_RE)) {
      const url = match[1] || match[2];
      if (!url || !url.startsWith('/')) continue;
      const segment = lastPathSegment(url);
      if (!segment) continue;
      const target = routeNodes.find((n) => {
        const cleanLabel = n.label.toLowerCase().replace(/(_screen|_page|\.tsx|\.ts|\.dart|\.jsx)$/, '');
        return cleanLabel && (segment.toLowerCase().includes(cleanLabel) || cleanLabel.includes(segment.toLowerCase()));
      });
      if (target) push(sourceId, target.id, `nav: ${url}`);
    }
  }

  // 4. Database CRUD / Operation mapping (Fix 1)
  const dbNodes = nodes.filter((n) => n.kind === 'database');
  for (const file of files) {
    const sourceId = fileToNode.get(file.relPath);
    if (!sourceId || !file.content) continue;
    const sourceNode = nodes.find((n) => n.id === sourceId);
    if (!sourceNode || sourceNode.kind === 'database') continue;

    for (const dbNode of dbNodes) {
      const dbModelName = dbNode.label
        .replace(/\.[jt]sx?$/, '')
        .replace(/\.dart$/, '')
        .replace(/Screen|Page|Form|Controller|Route/i, '')
        .replace(/\.(model|schema|entity|repository)$/i, '')
        .replace(/(model|schema|entity|repository)$/i, '');

      let isTouched = false;

      // Check if it imports the db node
      if (importedDbNodes.get(sourceId)?.has(dbNode.id)) {
        isTouched = true;
      }

      // Or if the content mentions the db model name
      if (!isTouched && dbModelName.length >= 3) {
        const baseName = dbModelName.toLowerCase();
        const namesToTry = [baseName];
        if (baseName.endsWith('s') && baseName.length > 3) {
          namesToTry.push(baseName.slice(0, -1));
        } else {
          namesToTry.push(baseName + 's');
        }

        for (const name of namesToTry) {
          const modelRegex = new RegExp(`\\b${name}\\b`, 'i');
          if (modelRegex.test(file.content)) {
            isTouched = true;
            break;
          }
        }
      }

      if (isTouched) {
        // Find operation type
        let op = 'QUERY';
        const lower = file.content.toLowerCase();
        
        const createPattern = new RegExp(`\\b${dbModelName.toLowerCase()}\\b.*\\b(create|insert|save|add|new)\\b`, 'i');
        const updatePattern = new RegExp(`\\b${dbModelName.toLowerCase()}\\b.*\\b(update|save|edit|set|patch)\\b`, 'i');
        const deletePattern = new RegExp(`\\b${dbModelName.toLowerCase()}\\b.*\\b(delete|destroy|remove|drop)\\b`, 'i');
        const readPattern = new RegExp(`\\b${dbModelName.toLowerCase()}\\b.*\\b(find|get|select|query|fetch|retrieve|where)\\b`, 'i');

        if (createPattern.test(file.content)) op = 'CREATE';
        else if (updatePattern.test(file.content)) op = 'UPDATE';
        else if (deletePattern.test(file.content)) op = 'DELETE';
        else if (readPattern.test(file.content)) op = 'READ';
        else if (/\b(create|insert|add)\b/i.test(lower)) op = 'CREATE';
        else if (/\b(update|set|patch|edit)\b/i.test(lower)) op = 'UPDATE';
        else if (/\b(delete|destroy|remove)\b/i.test(lower)) op = 'DELETE';
        else if (/\b(find|select|query|get)\b/i.test(lower)) op = 'READ';

        push(sourceId, dbNode.id, op);
      }
    }
  }

  return edges;
}

/** Resolve a relative or aliased import specifier to an actual scanned file path. */
function resolveImport(
  fromRel: string,
  spec: string,
  byPath: Map<string, ScannedFile>,
): string | null {
  let joined = '';
  if (spec.startsWith('@/')) {
    const srcIndex = fromRel.indexOf('/src/');
    if (srcIndex !== -1) {
      // Monorepo package context: packages/frontend/src/
      const packageRoot = fromRel.slice(0, srcIndex + 5);
      joined = path.posix.normalize(path.posix.join(packageRoot, spec.slice(2)));
    } else if (fromRel.startsWith('src/')) {
      joined = path.posix.normalize(path.posix.join('src', spec.slice(2)));
    } else {
      joined = path.posix.normalize(spec.slice(2));
    }
  } else if (spec.startsWith('package:')) {
    // Resolve package:app_name/features/home/home_screen.dart to lib/features/home/home_screen.dart
    const parts = spec.slice(8).split('/');
    if (parts.length > 1) {
      const libIndex = fromRel.indexOf('/lib/');
      if (libIndex !== -1) {
        const packageRoot = fromRel.slice(0, libIndex + 5); // packages/app/lib/
        joined = path.posix.normalize(path.posix.join(packageRoot, ...parts.slice(1)));
      } else if (fromRel.startsWith('lib/')) {
        joined = path.posix.normalize(path.posix.join('lib', ...parts.slice(1)));
      } else {
        joined = path.posix.normalize(path.posix.join('lib', ...parts.slice(1)));
      }
    }
  } else if (spec.startsWith('.')) {
    const baseDir = path.posix.dirname(fromRel);
    if (fromRel.endsWith('.py')) {
      // Python specific dotted relative package imports
      const cleanSpec = spec.replace(/^\.+/, (dots) => '../'.repeat(dots.length - 1)).replace(/\./g, '/');
      joined = path.posix.normalize(path.posix.join(baseDir, cleanSpec || spec));
    } else {
      joined = path.posix.normalize(path.posix.join(baseDir, spec));
    }
  } else {
    const baseDir = path.posix.dirname(fromRel);
    joined = path.posix.normalize(path.posix.join(baseDir, spec));
  }

  // If the import specifier has a ESM extension like .js/.jsx, get a version without it to resolve ts/tsx
  let stripped = joined;
  if (joined.endsWith('.js')) {
    stripped = joined.slice(0, -3);
  } else if (joined.endsWith('.jsx')) {
    stripped = joined.slice(0, -4);
  }

  const candidates = [
    joined,
    `${joined}.ts`,
    `${joined}.tsx`,
    `${joined}.js`,
    `${joined}.jsx`,
    `${joined}.dart`,
    `${joined}.swift`,
    `${joined}.kt`,
    `${joined}.cs`,
    `${joined}.cpp`,
    `${joined}.cc`,
    `${joined}.c`,
    `${joined}.h`,
    `${joined}.hpp`,
    `${joined}.m`,
    `${joined}.scala`,
    `${joined}/index.ts`,
    `${joined}/index.tsx`,
    `${joined}/index.js`,
    stripped,
    `${stripped}.ts`,
    `${stripped}.tsx`,
    `${stripped}.js`,
    `${stripped}.jsx`,
    `${stripped}.dart`,
    `${stripped}.swift`,
    `${stripped}.kt`,
    `${stripped}.cs`,
    `${stripped}.cpp`,
    `${stripped}.cc`,
    `${stripped}.c`,
    `${stripped}.h`,
    `${stripped}.hpp`,
    `${stripped}.m`,
    `${stripped}.scala`,
    `${stripped}/index.ts`,
    `${stripped}/index.tsx`,
    `${stripped}/index.js`,
  ];
  
  const found = candidates.find((c) => byPath.has(c));
  if (found) return found;

  // Smart fuzzy fallback for native/class package style imports (e.g. C#, Kotlin, Swift, Scala)
  const specLower = spec.toLowerCase().replace(/[\W_]+/g, '');
  if (specLower.length > 2) {
    for (const [relPath] of byPath) {
      const fileBase = path.basename(relPath, path.extname(relPath)).toLowerCase().replace(/[\W_]+/g, '');
      if (fileBase && fileBase.length > 2 && (specLower.endsWith(fileBase) || fileBase.endsWith(specLower))) {
        return relPath;
      }
    }
  }

  return null;
}

/** Extract the most meaningful trailing segment of a URL/path for matching. */
function lastPathSegment(url: string): string | null {
  const clean = url.split('?')[0].replace(/\/+$/, '');
  const parts = clean.split('/').filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : null;
}
