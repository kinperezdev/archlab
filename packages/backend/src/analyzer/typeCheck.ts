/**
 * Full type-checking for the Code Intelligence Panel: syntax + semantic (compile)
 * + suggestion diagnostics, via a cached TypeScript LanguageService per project.
 * Reads the real filesystem and the project's tsconfig so module resolution,
 * path aliases, and compiler options match what the project actually uses.
 */

import path from 'node:path';
import ts from 'typescript';
import type { SquiggleMarker } from '@archlab/shared';
import {
  SCRIPT_KINDS,
  extname,
  markerFromDiagnostic,
  detectSyntaxSquiggles,
} from './syntaxCheck.js';

interface Project {
  service: ts.LanguageService;
  files: Map<string, { version: number; text?: string }>;
  options: ts.CompilerOptions;
}

const cache = new Map<string, Project>();

function loadOptions(root: string): ts.CompilerOptions {
  const configPath = ts.findConfigFile(root, ts.sys.fileExists, 'tsconfig.json');
  if (configPath) {
    const read = ts.readConfigFile(configPath, ts.sys.readFile);
    const parsed = ts.parseJsonConfigFileContent(read.config ?? {}, ts.sys, path.dirname(configPath));
    return { ...parsed.options, noEmit: true, skipLibCheck: true };
  }
  return {
    allowJs: true,
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ESNext,
    esModuleInterop: true,
    skipLibCheck: true,
    noEmit: true,
  };
}

function getProject(root: string): Project {
  const cached = cache.get(root);
  if (cached) return cached;

  const files = new Map<string, { version: number; text?: string }>();
  const options = loadOptions(root);
  const host: ts.LanguageServiceHost = {
    getScriptFileNames: () => [...files.keys()],
    getScriptVersion: (f) => {
      const rec = files.get(f);
      if (rec) return String(rec.version);
      const m = ts.sys.getModifiedTime?.(f);
      return m ? String(m.getTime()) : '0';
    },
    getScriptSnapshot: (f) => {
      const rec = files.get(f);
      if (rec?.text !== undefined) return ts.ScriptSnapshot.fromString(rec.text);
      const disk = ts.sys.readFile(f);
      return disk !== undefined ? ts.ScriptSnapshot.fromString(disk) : undefined;
    },
    getCurrentDirectory: () => root,
    getCompilationSettings: () => options,
    getDefaultLibFileName: (o) => ts.getDefaultLibFilePath(o),
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
    directoryExists: ts.sys.directoryExists,
    getDirectories: ts.sys.getDirectories,
    realpath: ts.sys.realpath,
  };

  const project: Project = {
    service: ts.createLanguageService(host, ts.createDocumentRegistry()),
    files,
    options,
  };
  cache.set(root, project);
  return project;
}

/**
 * All diagnostics for one file (syntax + compile + suggestions). Pass
 * overrideContent to check an unsaved buffer. Falls back to the fast parser on
 * any failure so the panel never loses its syntax squiggles.
 */
export function getProjectDiagnostics(
  root: string,
  relPath: string,
  overrideContent?: string,
): SquiggleMarker[] {
  const abs = path.isAbsolute(relPath) ? relPath : path.join(root, relPath);
  if (SCRIPT_KINDS[extname(abs)] === undefined) return [];

  try {
    const project = getProject(root);
    const existing = project.files.get(abs);
    if (overrideContent !== undefined) {
      project.files.set(abs, { version: (existing?.version ?? 0) + 1, text: overrideContent });
    } else if (!existing) {
      project.files.set(abs, { version: 1 });
    } else if (existing.text !== undefined) {
      project.files.set(abs, { version: existing.version + 1 });
    }

    const svc = project.service;
    const diags = [
      ...svc.getSyntacticDiagnostics(abs),
      ...svc.getSemanticDiagnostics(abs),
      ...svc.getSuggestionDiagnostics(abs),
    ];
    return diags.map(markerFromDiagnostic).filter((m): m is SquiggleMarker => m !== null);
  } catch {
    return detectSyntaxSquiggles(relPath, overrideContent ?? ts.sys.readFile(abs) ?? '');
  }
}

/** Diagnostics for a file: deep syntax + compile check for JS/TS, [] otherwise. */
export async function computeSquiggles(
  root: string,
  relPath: string,
  content?: string,
): Promise<SquiggleMarker[]> {
  if (SCRIPT_KINDS[extname(relPath)] !== undefined) {
    return getProjectDiagnostics(root, relPath, content);
  }
  return [];
}
