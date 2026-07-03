/**
 * Architecture advisories — proactive, gap-finding guidance raised during the
 * Architecture Mapping step.
 *
 * Instead of only reporting bugs, ArchLab looks at the SHAPE of the project and
 * tells you what is structurally missing: "this app has screens but no backend",
 * "these screens call APIs that don't exist yet", "no database", "auth screens
 * with no auth layer". Each advisory includes a ready-to-paste build prompt so
 * you (or an AI agent) can close the gap immediately.
 */

import crypto from 'node:crypto';
import type { CanvasNode, Diagnostic, Severity } from '@archlab/shared';
import type { AnalysisResult } from '../analyzer/analyzer.js';
import { detectFrameworks, type TechProfile } from '../analyzer/frameworks.js';

/** Regex matching frontend API calls, to see which screens expect a backend. */
const FETCH_RE = /(?:fetch|axios(?:\.\w+)?)\(\s*[`'"]([^`'"]+)[`'"]/g;

/** LLM / generative-AI usage: the project talks to a language model. */
const AI_RE =
  /@anthropic-ai\/sdk|from ['"]openai|require\(['"]openai|@google\/generative-ai|GoogleGenerativeAI|langchain|@ai-sdk\/|generateText|streamText|ChatCompletion|replicate/i;

/** Existing retrieval / vector-store usage: the project already does RAG. */
const RAG_RE =
  /pinecone|pgvector|chromadb|@chroma|weaviate|qdrant|faiss|text-embedding|feature-extraction|embeddings|vector_cosine_ops|hnsw|@huggingface\/transformers|<=>/i;

/**
 * Does the project have a knowledge source worth grounding an LLM against?
 * Docs/markdown, a database, or a file-upload/storage surface all qualify.
 */
function hasGroundableKnowledge(analysis: AnalysisResult, hasDb: boolean): boolean {
  if (hasDb) return true;
  const hasStorage = analysis.canvas.nodes.some(
    (n) =>
      (n.kind === 'external-service' && /storage|bucket|s3|blob/i.test(n.label)) ||
      /upload|document|knowledge|pdf|file/i.test(n.label),
  );
  if (hasStorage) return true;
  const docCount = analysis.scan.files.filter((f) =>
    /\.(md|mdx|txt|pdf|docx)$/i.test(f.relPath),
  ).length;
  return docCount >= 3;
}

/** True if any scanned file matches a pattern (skips empty/oversized content). */
function scanMatches(analysis: AnalysisResult, re: RegExp): boolean {
  return analysis.scan.files.some((f) => f.content && re.test(f.content));
}

function advisory(
  severity: Severity,
  title: string,
  what: string,
  why: string,
  howToFix: string,
  optimization: string,
  suggestedPrompt: string,
  relatedNodeIds: string[] = [],
): Diagnostic {
  return {
    id: crypto.randomUUID(),
    step: 'architecture-mapping',
    severity,
    title,
    what,
    why,
    howToFix,
    optimization,
    suggestedPrompt,
    relatedNodeIds,
  };
}

/** Frontend nodes that represent user-facing screens. */
function screens(nodes: CanvasNode[]): CanvasNode[] {
  return nodes.filter((n) => n.lane === 'frontend' && (n.kind === 'route' || n.kind === 'component'));
}

/** Collect the API paths the frontend tries to call. */
function intendedApiCalls(analysis: AnalysisResult): string[] {
  const calls = new Set<string>();
  for (const f of analysis.scan.files) {
    if (!f.content) continue;
    const node = analysis.canvas.nodes.find((n) => n.filePath === f.relPath);
    if (!node || node.lane !== 'frontend') continue;
    for (const m of f.content.matchAll(FETCH_RE)) {
      const url = m[1];
      if (url.startsWith('/') || url.includes('/api') || url.startsWith('http')) calls.add(url);
    }
  }
  return [...calls];
}

/** Produce architecture advisories for the analyzed project. */
export function architectureAdvisories(analysis: AnalysisResult): Diagnostic[] {
  const out: Diagnostic[] = [];
  const nodes = analysis.canvas.nodes;
  const hasFrontend = nodes.some((n) => n.lane === 'frontend');
  const hasBackend = nodes.some((n) => n.lane === 'backend');
  const hasDb = nodes.some((n) => n.kind === 'database');
  const hasAuth = nodes.some((n) => n.kind === 'auth');
  const frontScreens = screens(nodes);
  const apiCalls = intendedApiCalls(analysis);

  // 1. App/web with a UI but no backend at all.
  if (hasFrontend && !hasBackend) {
    const screenList = frontScreens.map((s) => `  - ${s.label}`).join('\n') || '  - (your screens)';
    const callList = apiCalls.length
      ? `\nThese screens already try to call APIs that have nowhere to go:\n${apiCalls
          .map((c) => `  - ${c}`)
          .join('\n')}`
      : '';

    out.push(
      advisory(
        'high',
        'No backend detected — add a backend first',
        `This project has a frontend (${frontScreens.length} screen(s)) but no backend was found. The app can render, but it has nothing to store data, authenticate users, or serve dynamic content.${callList}`,
        'A frontend alone cannot persist data, keep secrets, or enforce access control. Any feature beyond static display needs a backend to connect to.',
        `Add a backend service first, then connect each screen to it. Start with:\n` +
          `1. A server (Express/Fastify/Next API routes) exposing JSON endpoints.\n` +
          `2. One endpoint per screen that needs data.\n` +
          `3. A data layer (database) the endpoints read/write.\n` +
          `4. Wire each screen's fetch call to its endpoint.\n\nScreens to connect:\n${screenList}`,
        'Once the backend exists, add auth and a database so the screens can show real, per-user data.',
        buildBackendPrompt(analysis, frontScreens, apiCalls, detectFrameworks(analysis.scan)),
        frontScreens.map((s) => s.id),
      ),
    );
  }

  // 2. Frontend calls APIs but no endpoint nodes resolve (broken/absent wiring).
  if (hasBackend && apiCalls.length > 0) {
    const endpointLabels = nodes
      .filter((n) => n.kind === 'endpoint')
      .map((n) => n.label.toLowerCase());
    const unmatched = apiCalls.filter((c) => {
      const seg = c.split('?')[0].split('/').filter(Boolean).pop() ?? '';
      return seg && !endpointLabels.some((l) => l.includes(seg.toLowerCase()));
    });
    if (unmatched.length > 0) {
      out.push(
        advisory(
          'medium',
          'Screens call APIs that have no matching endpoint',
          `The frontend calls ${unmatched.length} API path(s) that don't map to any detected backend endpoint:\n${unmatched
            .map((u) => `  - ${u}`)
            .join('\n')}`,
          'A screen calling a missing endpoint will fail at runtime with a 404 or network error.',
          'Create a backend endpoint for each listed path, or fix the frontend URL to match an existing endpoint.',
          'Generate a typed API client so the frontend and backend share one contract and drift like this is caught at build time.',
          `In the backend, add handlers for these routes and return JSON:\n${unmatched.join('\n')}`,
        ),
      );
    }
  }

  // 3. Backend with no persistence.
  if (hasBackend && !hasDb) {
    out.push(
      advisory(
        'medium',
        'No database / persistence layer',
        'A backend exists but no database or data model was detected.',
        'Without persistence the backend cannot remember anything between requests or restarts.',
        'Add a database (Postgres/SQLite) and a data layer (Prisma/Drizzle), then have endpoints read/write through it.',
        'Add migrations and seed data so the schema is reproducible across environments.',
        'Add a database to this project: set up Prisma (or Drizzle) with a Postgres schema, generate the client, and connect the existing endpoints to read and write through it.',
      ),
    );
  }

  // 4. Auth-looking screens but no auth layer.
  const looksLikeAuthUi = frontScreens.some((s) => /(login|signup|sign-in|auth|account|register)/i.test(s.label));
  if (looksLikeAuthUi && !hasAuth) {
    out.push(
      advisory(
        'high',
        'Auth screens with no authentication layer',
        'There are login/signup style screens, but no authentication layer was detected on the backend.',
        'Login UI without a real auth backend is non-functional and dangerously misleading.',
        'Add an auth layer: session or JWT issuance, password hashing, protected-route middleware, then connect the auth screens to it.',
        'Consider a managed auth provider (Clerk/Auth.js) to avoid hand-rolling credential security.',
        'Add authentication: create signup/login endpoints with hashed passwords and JWT or session cookies, add middleware to protect routes, and wire the existing login/signup screens to these endpoints.',
        frontScreens.filter((s) => /(login|signup|auth|account|register)/i.test(s.label)).map((s) => s.id),
      ),
    );
  }

  // 5. LLM feature with a knowledge source but no retrieval grounding (RAG gap).
  const usesAi = scanMatches(analysis, AI_RE);
  const usesRag = scanMatches(analysis, RAG_RE);
  if (usesAi && !usesRag && hasGroundableKnowledge(analysis, hasDb)) {
    out.push(
      advisory(
        'low',
        'AI feature with no retrieval (RAG) layer',
        'This project calls a language model and has a knowledge source (docs, a database, or uploaded files), but no vector store or retrieval step was detected. The model answers from its training data alone, not from your data.',
        'Without retrieval, an LLM cannot cite your documents, stays frozen at its training cutoff, and hallucinates specifics it was never given. Grounding it with RAG (Retrieval-Augmented Generation) makes answers accurate, current, and traceable to a source.',
        'Add a RAG pipeline:\n' +
          '1. Chunk your knowledge source (docs / DB rows / uploads) into passages.\n' +
          '2. Embed each chunk with an embedding model and store the vectors.\n' +
          '3. On each query, embed the question, retrieve the top-k nearest chunks.\n' +
          '4. Pass those chunks to the model as grounding context before it answers.',
        'Start local and simple: a small embedding model plus brute-force cosine search is enough at low volume. Move to pgvector or a dedicated vector DB only when scale or latency demands it. Add hybrid keyword+vector search and a reranker if precision matters.',
        'Add a Retrieval-Augmented Generation pipeline to this project: chunk the existing knowledge source, generate embeddings, store them in a vector index, and retrieve the top-k relevant chunks to inject into the model prompt before each answer. Keep it local (in-process embeddings + cosine search) unless scale requires pgvector or a dedicated vector database.',
      ),
    );
  }

  return out;
}

/** Server scaffolding recipe per primary language, used to keep advice on-stack. */
function backendRecipe(fw: TechProfile): { server: string; db: string; validation: string } {
  switch (fw.primaryLanguage) {
    case 'python':
      return {
        server: 'a FastAPI (or Django REST Framework) service',
        db: 'SQLAlchemy + Alembic migrations (or the Django ORM) on Postgres/SQLite',
        validation: 'Pydantic models for request/response validation',
      };
    case 'go':
      return {
        server: 'a Go HTTP service using chi or gin',
        db: 'GORM or sqlx against Postgres/SQLite',
        validation: 'struct validation (go-playground/validator) and context timeouts',
      };
    case 'java':
    case 'kotlin':
      return {
        server: 'a Spring Boot service with @RestController endpoints',
        db: 'Spring Data JPA entities + repositories on Postgres',
        validation: 'Bean Validation (jakarta.validation) annotations',
      };
    case 'rust':
      return {
        server: 'an Axum (or Actix-web) service',
        db: 'sqlx or Diesel against Postgres/SQLite',
        validation: 'the validator crate and typed extractors',
      };
    case 'php':
      return {
        server: 'a Laravel API (routes/api.php with controllers)',
        db: 'Eloquent models + migrations on Postgres/MySQL',
        validation: 'Form Request validation',
      };
    case 'ruby':
      return {
        server: 'a Rails API (or Sinatra) service',
        db: 'ActiveRecord models + migrations on Postgres',
        validation: 'strong params and model validations',
      };
    case 'csharp':
      return {
        server: 'an ASP.NET Core minimal API (or controllers)',
        db: 'Entity Framework Core (DbContext) on Postgres/SQL Server',
        validation: 'DataAnnotations or FluentValidation',
      };
    default:
      return {
        server: 'a Node + TypeScript server (Express or Fastify)',
        db: 'Prisma (or Drizzle) on Postgres/SQLite',
        validation: 'Zod schema validation',
      };
  }
}

/** Build a concrete, copy-paste prompt for scaffolding the missing backend. */
function buildBackendPrompt(
  analysis: AnalysisResult,
  frontScreens: CanvasNode[],
  apiCalls: string[],
  fw: TechProfile,
): string {
  const stack = fw.label || analysis.techStack.join(', ') || 'the existing frontend stack';
  const screensTxt = frontScreens.map((s) => s.label).join(', ') || 'all screens';
  const endpoints = apiCalls.length
    ? apiCalls.join(', ')
    : 'one endpoint per screen that needs data';
  const recipe = backendRecipe(fw);

  return [
    `Add a backend to this ${stack} project.`,
    ``,
    `1. Scaffold ${recipe.server} that runs on localhost.`,
    `2. Create JSON REST endpoints for: ${endpoints}.`,
    `3. Add a database layer (${recipe.db}) with models for the data these screens show.`,
    `4. Add input validation (${recipe.validation}) and centralized error handling on every endpoint.`,
    `5. Connect these frontend screens to the new endpoints: ${screensTxt}.`,
    `6. Add CORS for the frontend origin and an auth layer if any screen is user-specific.`,
    ``,
    `Keep the contract consistent and return a predictable { success, data, error } envelope.`,
  ].join('\n');
}
