/**
 * Analyzer entry point — orchestrates scan -> classify -> edges -> layout into
 * a finished CanvasGraph, and derives a first-pass ProjectIntelligence.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { CanvasGraph, ProjectIntelligence, SystemDesignMap } from '@archlab/shared';
import { scanProject, type ScanResult } from './scan.js';
import { classify } from './classify.js';
import { detectEdges } from './edges.js';
import { layout } from './layout.js';
import { detectInfrastructure } from './infra.js';

export interface AnalysisResult {
  projectId: string;
  name: string;
  rootPath: string;
  scan: ScanResult;
  canvas: CanvasGraph;
  intelligence: ProjectIntelligence;
  techStack: string[];
  /** Detected infrastructure map for the System Design tab. */
  infra: SystemDesignMap;
  /** Raw README contents read from the project root, or null if none. */
  projectReadme: string | null;
}

/** Common README filenames, in priority order. */
const README_NAMES = ['README.md', 'readme.md', 'README.markdown', 'README.txt', 'README'];

/** Read the project's README from its root, if one exists. */
export function readProjectReadme(root: string): string | null {
  for (const name of README_NAMES) {
    try {
      const p = path.join(root, name);
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        return fs.readFileSync(p, 'utf8');
      }
    } catch {
      /* keep trying other candidates */
    }
  }
  return null;
}

/** Analyze a project folder end to end. */
export function analyzeProject(rootPath: string): AnalysisResult {
  const scan = scanProject(rootPath);
  const { nodes: rawNodes, techStack, fileToNode } = classify(scan);
  // Detect edges first (it doesn't need positions) so the layout can use the
  // parent→child relationships to build a left-to-right tree.
  const edges = detectEdges(scan.files, fileToNode, rawNodes);
  const positioned = layout(rawNodes, edges);

  const projectId = crypto.createHash('sha1').update(scan.root).digest('hex').slice(0, 12);
  const canvas: CanvasGraph = { nodes: positioned, edges };
  const intelligence = deriveIntelligence(projectId, scan, positioned, techStack);
  // Read the README first so infrastructure detection can use the project's own
  // stated tech stack and architecture as high-confidence corroborating signals.
  const projectReadme = readProjectReadme(scan.root);
  const infra = detectInfrastructure(scan, techStack, projectReadme);

  return {
    projectId,
    name: scan.name,
    rootPath: scan.root,
    scan,
    canvas,
    intelligence,
    techStack,
    infra,
    projectReadme,
  };
}

/** First-pass intelligence derived purely from structure (step 1 deepens it). */
function deriveIntelligence(
  projectId: string,
  scan: ScanResult,
  nodes: CanvasGraph['nodes'],
  techStack: string[],
): ProjectIntelligence {
  const count = (kind: string) => nodes.filter((n) => n.kind === kind).length;
  const hasFrontend = nodes.some((n) => n.lane === 'frontend');
  const hasBackend = nodes.some((n) => n.lane === 'backend');
  const hasAuth = count('auth') > 0;
  const hasDb = count('database') > 0;

  const currentFeatures: string[] = [];
  if (count('route') > 0) currentFeatures.push(`${count('route')} routed page(s)`);
  if (count('component') > 0) currentFeatures.push(`${count('component')} UI component(s)`);
  if (count('endpoint') > 0) currentFeatures.push(`${count('endpoint')} API endpoint(s)`);
  if (hasAuth) currentFeatures.push('Authentication layer');
  if (hasDb) currentFeatures.push('Data persistence layer');

  const suggestedFeatures: string[] = [];
  if (!hasAuth && hasBackend) suggestedFeatures.push('Add an authentication/authorization layer');
  if (!hasDb && hasBackend) suggestedFeatures.push('Introduce a persistence/database layer');
  if (count('middleware') === 0 && hasBackend) {
    suggestedFeatures.push('Add middleware for validation, logging, and rate limiting');
  }
  
  // Suggest TypeScript migration only if they are running a Javascript project
  const isJavascriptStack = techStack.some(t => ['React', 'Express', 'Fastify', 'Next.js', 'Vue', 'Svelte'].includes(t));
  if (isJavascriptStack && !techStack.includes('TypeScript')) {
    suggestedFeatures.push('Consider migrating JavaScript to TypeScript');
  }

  const arch =
    hasFrontend && hasBackend
      ? 'a full-stack application with a separate frontend and backend'
      : hasFrontend
        ? 'a frontend-focused application'
        : 'a backend / service-focused project';

  return {
    projectId,
    summary: `${scan.name} appears to be ${arch} built with ${
      techStack.join(', ') || 'an undetected stack'
    }. It contains ${scan.files.length} scanned files and ${nodes.length} architecturally significant nodes.`,
    techStack,
    goals: [
      'Deliver the core product flows reflected in the routes and endpoints',
      hasDb ? 'Persist and serve application data reliably' : 'Establish a data layer',
    ],
    currentFeatures,
    suggestedFeatures,
    howItConnects: hasFrontend && hasBackend
      ? 'The frontend renders components and routes, which call backend endpoints. Endpoints pass through middleware and auth, then read or write the data layer and external services.'
      : 'Modules connect through direct imports; see the canvas edges for the concrete data-flow paths detected in the code.',
  };
}
