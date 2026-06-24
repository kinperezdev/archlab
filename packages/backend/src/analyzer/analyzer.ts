/**
 * Analyzer entry point — orchestrates scan -> classify -> edges -> layout into
 * a finished CanvasGraph, and derives a first-pass ProjectIntelligence.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type {
  CanvasGraph,
  CanvasNode,
  MissingInfraPattern,
  ProjectIntelligence,
  SystemDesignMap,
} from '@archlab/shared';
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
  /** Major infrastructure the project is missing, with ready-to-use prompts. */
  missingInfraPatterns: MissingInfraPattern[];
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
  const missingInfraPatterns = detectMissingInfra(scan, positioned, techStack);

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
    missingInfraPatterns,
  };
}

// ---------------------------------------------------------------------------
// Missing-infrastructure detection
// ---------------------------------------------------------------------------

const DB_LIBS = ['pg', 'mysql', 'mysql2', 'mongoose', 'mongodb', 'sequelize', 'typeorm', 'prisma', '@prisma/client', 'drizzle-orm', 'redis', 'ioredis', 'sqlite3', 'better-sqlite3', 'knex'];
const AUTH_LIBS = ['passport', 'jsonwebtoken', 'next-auth', '@clerk/clerk-sdk-node', '@clerk/nextjs', '@auth/core', 'bcrypt', 'bcryptjs', 'argon2', 'express-session', 'lucia'];
const TEST_LIBS = ['jest', 'vitest', 'mocha', '@playwright/test', 'cypress', 'pytest', 'testing-library', '@testing-library/react'];
const SERVER_FRAMEWORKS = ['Express', 'Fastify', 'NestJS', 'Django', 'Flask', 'Spring', 'Laravel', 'Rails', 'Next.js'];

/** Read lowercased dependency names from package.json (deps + devDeps). */
function readPackageDeps(root: string): Set<string> {
  try {
    const p = path.join(root, 'package.json');
    if (!fs.existsSync(p)) return new Set();
    const pkg = JSON.parse(fs.readFileSync(p, 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const names = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})];
    return new Set(names.map((n) => n.toLowerCase()));
  } catch {
    return new Set();
  }
}

/**
 * Detect which major pieces of infrastructure are absent, and generate a
 * project-specific implementation prompt for each. Pure derivation from the
 * already-computed nodes + techStack + the project's package.json.
 */
function detectMissingInfra(
  scan: ScanResult,
  nodes: CanvasNode[],
  techStack: string[],
): MissingInfraPattern[] {
  const deps = readPackageDeps(scan.root);
  const has = (libs: string[]) => libs.some((l) => deps.has(l));
  const rel = (f: { relPath: string }) => f.relPath.toLowerCase();

  const hasFrontend = nodes.some((n) => n.lane === 'frontend');
  const hasBackend = nodes.some((n) => n.lane === 'backend');
  const hasDb = nodes.some((n) => n.kind === 'database') || has(DB_LIBS);
  const hasAuth = nodes.some((n) => n.kind === 'auth') || has(AUTH_LIBS);
  const hasEndpoints = nodes.some((n) => n.kind === 'endpoint');
  const hasServerFramework = hasBackend || techStack.some((t) => SERVER_FRAMEWORKS.includes(t));
  const isFlutter = scan.files.some((f) => rel(f).endsWith('.dart')) || techStack.includes('Flutter');
  const isReactNative = deps.has('react-native') || deps.has('expo');
  const isMobile = isFlutter || isReactNative;

  const hasTests =
    scan.files.some((f) => /\.(test|spec)\.[jt]sx?$|_test\.go$|(^|\/)test_[^/]*\.py$|\.test\.dart$/.test(rel(f))) ||
    has(TEST_LIBS);
  const hasConfig = scan.files.some((f) =>
    /(^|\/)\.env|(^|\/)[^/]*\.config\.[jt]s$|(^|\/)config\/|settings\.py$|application\.ya?ml$|(^|\/)config\.[jt]s$/.test(rel(f)),
  );

  const componentCount = nodes.filter((n) => n.kind === 'component').length;
  const routeCount = nodes.filter((n) => n.kind === 'route').length;
  const endpointCount = nodes.filter((n) => n.kind === 'endpoint').length;
  const stack = techStack.join(' + ') || (isFlutter ? 'Flutter / Dart' : 'an undetected stack');
  const topDeps = [...deps].slice(0, 12).join(', ') || 'none detected';

  const ctx = { name: scan.name, stack, topDeps, componentCount, routeCount, endpointCount };
  const out: MissingInfraPattern[] = [];

  // Mobile apps legitimately have no backend in-repo — frame it as info.
  if (isMobile && !hasBackend) {
    out.push({
      type: 'frontend-only',
      title: `This is a ${isFlutter ? 'Flutter' : 'React Native'} mobile app`,
      description: 'Mobile apps typically do not ship a backend in the same repository. ArchLab analyzed the client; the API it talks to usually lives elsewhere.',
      severity: 'info',
      detectedStack: stack,
      suggestedImplementation: 'Add a backend API service or connect to an existing one.',
      generatedPrompt: backendPrompt(ctx, true),
    });
  } else if (hasFrontend && !hasBackend) {
    out.push({
      type: 'frontend-only',
      title: 'Frontend-only project',
      description: `This looks like a pure client-side ${stack} app: ${componentCount} components and ${routeCount} routes, with no backend or database detected.`,
      severity: 'info',
      detectedStack: stack,
      suggestedImplementation: 'Add a backend API and a persistence layer when you need server state.',
      generatedPrompt: backendPrompt(ctx, false),
    });
    if (!hasServerFramework) {
      out.push({
        type: 'no-backend',
        title: 'No backend detected',
        description: 'No server framework or backend lane was found. A backend lets you persist data, authenticate users, and keep secrets off the client.',
        severity: 'warning',
        detectedStack: stack,
        suggestedImplementation: 'Add a Node.js + Express (or FastAPI) backend with a REST API.',
        generatedPrompt: backendPrompt(ctx, false),
      });
    }
  }

  if (hasBackend && !hasFrontend) {
    out.push({
      type: 'backend-only',
      title: 'Backend-only project',
      description: `A ${stack} service with ${endpointCount} endpoints and no frontend detected. This is normal for an API or worker service.`,
      severity: 'info',
      detectedStack: stack,
      suggestedImplementation: 'Add a frontend client if this service needs a UI.',
      generatedPrompt: frontendPrompt(ctx),
    });
    out.push({
      type: 'no-frontend',
      title: 'No frontend detected',
      description: 'No frontend lane was found. If end users need a UI, add a client application.',
      severity: 'info',
      detectedStack: stack,
      suggestedImplementation: 'Add a React or Vue frontend that consumes this API.',
      generatedPrompt: frontendPrompt(ctx),
    });
  }

  if (hasBackend && !hasDb) {
    out.push({
      type: 'no-database',
      title: 'No database detected',
      description: 'The backend has no detected database connection or ORM dependency, so application data has nowhere durable to live.',
      severity: 'warning',
      detectedStack: stack,
      suggestedImplementation: 'Add PostgreSQL with an ORM (Prisma) and migrations.',
      generatedPrompt: databasePrompt(ctx),
    });
  }

  if (hasBackend && hasEndpoints && !hasAuth) {
    out.push({
      type: 'no-auth',
      title: 'No authentication detected',
      description: `${endpointCount} API endpoints exist but no auth layer or auth library was found. Unauthenticated endpoints are the most common serious vulnerability.`,
      severity: 'critical',
      detectedStack: stack,
      suggestedImplementation: 'Add token-based auth (JWT) enforced in middleware before protected handlers.',
      generatedPrompt: authPrompt(ctx),
    });
  }

  if (hasFrontend && !hasEndpoints && !hasBackend && !isMobile) {
    out.push({
      type: 'no-api',
      title: 'No API routes detected',
      description: 'This is a pure client-side app with no API calls or endpoints detected. Dynamic data needs an API to talk to.',
      severity: 'info',
      detectedStack: stack,
      suggestedImplementation: 'Add a REST API and wire the frontend data layer to it.',
      generatedPrompt: backendPrompt(ctx, false),
    });
  }

  if (!hasTests && nodes.length > 0) {
    out.push({
      type: 'no-tests',
      title: 'No tests detected',
      description: 'No test files or test runner dependency were found. Tests are what let you change this code safely as it grows.',
      severity: 'warning',
      detectedStack: stack,
      suggestedImplementation: 'Add a test runner and a starter unit + integration suite.',
      generatedPrompt: testsPrompt(ctx),
    });
  }

  if (!hasConfig && nodes.length > 0) {
    out.push({
      type: 'no-config',
      title: 'No environment config detected',
      description: 'No .env or configuration files were found. Externalizing config keeps secrets out of code and lets the app behave differently per environment.',
      severity: 'info',
      detectedStack: stack,
      suggestedImplementation: 'Add a .env + typed config loader and a committed .env.example.',
      generatedPrompt: configPrompt(ctx),
    });
  }

  return out;
}

interface PromptCtx {
  name: string;
  stack: string;
  topDeps: string;
  componentCount: number;
  routeCount: number;
  endpointCount: number;
}

function backendPrompt(c: PromptCtx, mobile: boolean): string {
  return [
    'You are a senior full-stack engineer.',
    `I have a ${c.stack} ${mobile ? 'mobile app' : 'frontend project'} called "${c.name}" with no backend.`,
    '',
    'PROJECT CONTEXT:',
    `- Stack: ${c.stack}`,
    `- Detected surface: ${c.componentCount} UI components, ${c.routeCount} routes/pages`,
    `- Current dependencies: ${c.topDeps}`,
    '',
    'TASK:',
    'Add a production-ready Node.js + Express + TypeScript backend with:',
    "1. A RESTful API structure matching the frontend's data needs",
    '2. Authentication using JWT (login, token verification middleware)',
    '3. Database integration with PostgreSQL via Prisma (schema + migrations)',
    '4. Environment configuration (.env + typed loader) and CORS for the frontend',
    '5. Sensible error handling and a health-check endpoint',
    '',
    'Show me the complete folder structure, package.json changes, and starter files.',
  ].join('\n');
}

function frontendPrompt(c: PromptCtx): string {
  return [
    'You are a senior frontend engineer.',
    `I have a ${c.stack} backend called "${c.name}" with ${c.endpointCount} endpoints and no frontend.`,
    '',
    'PROJECT CONTEXT:',
    `- Backend stack: ${c.stack}`,
    `- Detected endpoints: ${c.endpointCount}`,
    `- Current dependencies: ${c.topDeps}`,
    '',
    'TASK:',
    'Add a React + TypeScript + Vite frontend that consumes this API with:',
    '1. A typed API client matching the existing endpoints',
    '2. Routing, a couple of real pages, and loading/error states',
    '3. Auth handling (store and send the token) if the API requires it',
    '4. A clean component structure and environment config for the API base URL',
    '',
    'Show me the folder structure, package.json, and starter files.',
  ].join('\n');
}

function databasePrompt(c: PromptCtx): string {
  return [
    'You are a senior backend engineer.',
    `My ${c.stack} backend "${c.name}" has no database layer.`,
    '',
    'PROJECT CONTEXT:',
    `- Stack: ${c.stack}`,
    `- Detected endpoints: ${c.endpointCount}`,
    `- Current dependencies: ${c.topDeps}`,
    '',
    'TASK:',
    'Add a PostgreSQL persistence layer with:',
    '1. Prisma (or an idiomatic ORM for this stack) with a schema for the core entities the endpoints imply',
    '2. Versioned migrations and a seed script',
    '3. A repository/data-access layer the handlers call (no raw queries in routes)',
    '4. Connection pooling and environment-based config',
    '',
    'Show me the schema, migration setup, and how to wire it into the existing handlers.',
  ].join('\n');
}

function authPrompt(c: PromptCtx): string {
  return [
    'You are a senior application security engineer.',
    `My ${c.stack} backend "${c.name}" exposes ${c.endpointCount} endpoints with no authentication.`,
    '',
    'PROJECT CONTEXT:',
    `- Stack: ${c.stack}`,
    `- Current dependencies: ${c.topDeps}`,
    '',
    'TASK:',
    'Add token-based authentication and authorization with:',
    '1. Login/refresh issuing signed JWTs (or sessions if more appropriate)',
    '2. Middleware that verifies the token and rejects expired/forged tokens with 401/403',
    '3. Role-based authorization checks on protected routes',
    '4. Secure secret handling via environment variables and a regression test for the unauthorized path',
    '',
    'Show me the middleware, how to protect existing routes, and the config changes.',
  ].join('\n');
}

function testsPrompt(c: PromptCtx): string {
  return [
    'You are a senior engineer who values testability.',
    `My ${c.stack} project "${c.name}" has no tests.`,
    '',
    'PROJECT CONTEXT:',
    `- Stack: ${c.stack}`,
    `- Detected surface: ${c.componentCount} components, ${c.routeCount} routes, ${c.endpointCount} endpoints`,
    `- Current dependencies: ${c.topDeps}`,
    '',
    'TASK:',
    'Set up a test suite appropriate for this stack with:',
    '1. A test runner configured (Vitest/Jest for JS, pytest for Python, go test for Go)',
    '2. Unit tests for core logic and a couple of integration tests for the main flow',
    '3. A test script in the project config and a CI step that runs it',
    '',
    'Show me the config, example tests, and how to run them.',
  ].join('\n');
}

function configPrompt(c: PromptCtx): string {
  return [
    'You are a senior engineer.',
    `My ${c.stack} project "${c.name}" has no environment configuration.`,
    '',
    'PROJECT CONTEXT:',
    `- Stack: ${c.stack}`,
    `- Current dependencies: ${c.topDeps}`,
    '',
    'TASK:',
    'Add environment configuration with:',
    '1. A typed config loader that validates required variables at startup (e.g. Zod)',
    '2. A committed .env.example documenting every variable',
    '3. .env added to .gitignore and clear separation of dev/prod values',
    '',
    'Show me the config module, the .env.example, and how to consume it.',
  ].join('\n');
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
