/**
 * Infrastructure detection — the brain of the System Design "Detected Mode".
 *
 * Scans real project code for infrastructure patterns (CDN, load balancers, API
 * gateways, microservices, auth, cache, pub/sub, databases, buckets, KMS) and
 * lays them out into three horizontal layers: edge, application, data.
 *
 * Every detected node carries the exact files / patterns that triggered it, so
 * the UI can show "why is this here?". After mapping what exists, a gap analysis
 * produces dashed suggestion nodes with paste-ready prompts.
 *
 * Detection is heuristic and intentionally conservative: it favours surfacing a
 * node with clear evidence over guessing.
 */

import type {
  EncryptionState,
  InfraEdge,
  InfraEvidence,
  InfraLayer,
  InfraNode,
  InfraNodeType,
  InfraSuggestion,
  ProjectContext,
  PubSubTopic,
  SystemDesignMap,
} from '@archlab/shared';
import type { ScanResult, ScannedFile } from './scan.js';

/** Vertical band each layer is drawn in. */
const LAYER_Y: Record<InfraLayer, number> = { edge: 80, application: 380, data: 700 };
const COL_GAP = 240;
const COL_START = 120;

/** One pattern to look for, and how to describe it when matched. */
interface Probe {
  /** Regex tested against file content (or path when `path` is set). */
  re: RegExp;
  /** Human-readable description of the match. */
  describe: (m: RegExpExecArray, file: ScannedFile) => string;
  /** When true, test the regex against the file path instead of content. */
  path?: boolean;
}

/** Run a set of probes across all files, collecting evidence (capped). */
function gather(files: ScannedFile[], probes: Probe[], cap = 12): InfraEvidence[] {
  const out: InfraEvidence[] = [];
  for (const file of files) {
    for (const probe of probes) {
      const target = probe.path ? file.relPath : file.content;
      if (!target) continue;
      const re = new RegExp(probe.re.source, probe.re.flags.includes('g') ? probe.re.flags : probe.re.flags + 'g');
      let m: RegExpExecArray | null;
      while ((m = re.exec(target)) !== null) {
        out.push({
          file: file.relPath,
          pattern: probe.describe(m, file),
          snippet: probe.path ? undefined : lineAround(file.content, m.index),
        });
        if (out.length >= cap) return out;
        if (m.index === re.lastIndex) re.lastIndex++; // avoid zero-width loop
      }
    }
  }
  return out;
}

/** The full trimmed line containing the match position. */
function lineAround(content: string, index: number): string {
  const start = content.lastIndexOf('\n', index) + 1;
  const end = content.indexOf('\n', index);
  return content.slice(start, end === -1 ? undefined : end).trim().slice(0, 200);
}

let counter = 0;
const nid = (type: string) => `infra_${type}_${counter++}`;

/** Detect the full infrastructure map for a scanned project. */
export function detectInfrastructure(
  scan: ScanResult,
  _techStack: string[],
  readme?: string | null,
): SystemDesignMap {
  counter = 0;
  const files = scan.files;
  const nodes: InfraNode[] = [];

  // Track placement per layer so columns never overlap.
  const colIndex: Record<InfraLayer, number> = { edge: 0, application: 0, data: 0 };
  const place = (layer: InfraLayer) => ({
    x: COL_START + colIndex[layer]++ * COL_GAP,
    y: LAYER_Y[layer],
  });
  const add = (
    type: InfraNodeType,
    layer: InfraLayer,
    label: string,
    evidence: InfraEvidence[],
    meta?: InfraNode['meta'],
  ): InfraNode => {
    const node: InfraNode = {
      id: nid(type),
      type,
      layer,
      label,
      detected: true,
      position: place(layer),
      evidence,
      meta,
    };
    nodes.push(node);
    return node;
  };

  // ---- Edge layer ------------------------------------------------------
  const cdn = gather(files, [
    { re: /cloudfront/i, describe: () => 'CloudFront (AWS CDN) reference' },
    { re: /cloudflare/i, describe: () => 'Cloudflare reference' },
    { re: /fastly/i, describe: () => 'Fastly reference' },
    { re: /@aws-sdk\/client-cloudfront/i, describe: () => "import of '@aws-sdk/client-cloudfront'" },
  ]);
  if (cdn.length) add('cdn', 'edge', 'CDN', cdn);

  const lb = gather(files, [
    { re: /nginx\.conf$/i, path: true, describe: () => 'nginx config file' },
    { re: /proxy_pass\s+http/i, describe: () => 'nginx reverse-proxy (proxy_pass)' },
    { re: /http-proxy|http-proxy-middleware/i, describe: () => 'reverse-proxy middleware' },
    { re: /elasticloadbalancing|client-elastic-load-balancing/i, describe: () => 'AWS ELB reference' },
  ]);
  if (lb.length) add('load-balancer', 'edge', 'Load Balancer', lb);

  const gw = gather(files, [
    { re: /express\(\)|express\.Router\(\)/i, describe: () => 'Express router / app' },
    { re: /\bfastify\b/i, describe: () => 'Fastify server' },
    { re: /\bkong\b/i, describe: () => 'Kong gateway reference' },
    { re: /apigateway|client-api-gateway/i, describe: () => 'AWS API Gateway reference' },
  ]);
  if (gw.length) add('api-gateway', 'edge', 'API Gateway', gw);

  // ---- Application layer ------------------------------------------------
  // Microservices: each file that boots a server is a deployable unit.
  const serviceFiles = files.filter(
    (f) => /\.listen\s*\(|createServer\s*\(|app\.listen|fastify\(/.test(f.content),
  );
  const serviceDirs = new Map<string, ScannedFile[]>();
  for (const f of serviceFiles) {
    const dir = f.relPath.includes('/') ? f.relPath.slice(0, f.relPath.indexOf('/')) || '.' : '.';
    const arr = serviceDirs.get(dir) ?? [];
    arr.push(f);
    serviceDirs.set(dir, arr);
  }
  const serviceNodes: InfraNode[] = [];
  for (const [dir, fs2] of serviceDirs) {
    const label = dir === '.' ? `${scan.name} service` : dir;
    serviceNodes.push(
      add('microservice', 'application', label, [
        { file: fs2[0].relPath, pattern: 'server entry point (.listen / createServer)', snippet: lineAround(fs2[0].content, Math.max(0, fs2[0].content.search(/\.listen|createServer/))) },
      ]),
    );
  }

  const auth = gather(files, [
    { re: /jsonwebtoken|\bjwt\b/i, describe: () => 'JWT (jsonwebtoken)' },
    { re: /passport/i, describe: () => 'Passport auth' },
    { re: /next-auth|@auth\/core/i, describe: () => 'NextAuth' },
    { re: /@clerk\//i, describe: () => 'Clerk auth' },
    { re: /oauth/i, describe: () => 'OAuth flow' },
    { re: /requireAuth|isAuthenticated|authMiddleware|verifyToken/i, describe: () => 'auth middleware pattern' },
  ]);
  const authNode = auth.length ? add('auth-service', 'application', 'Auth Service', auth) : null;

  const cache = gather(files, [
    { re: /\bioredis\b|require\(['"]redis['"]\)|from ['"]redis['"]/i, describe: () => 'Redis client' },
    { re: /memcached/i, describe: () => 'Memcached client' },
    { re: /node-cache|lru-cache/i, describe: () => 'in-process cache library' },
  ]);
  const cacheNode = cache.length ? add('cache', 'application', 'Cache Layer', cache) : null;

  const pubsubEvidence = gather(files, [
    { re: /\bbull\b|bullmq/i, describe: () => 'Bull / BullMQ queue' },
    { re: /amqplib|rabbitmq/i, describe: () => 'RabbitMQ (amqplib)' },
    { re: /kafkajs|\bkafka\b/i, describe: () => 'Kafka' },
    { re: /new EventEmitter|extends EventEmitter/i, describe: () => 'EventEmitter pub/sub' },
    { re: /\.broadcast|io\.emit|socket\.emit/i, describe: () => 'WebSocket broadcast' },
  ]);
  let pubsubNode: InfraNode | null = null;
  if (pubsubEvidence.length) {
    const topics = detectTopics(files, serviceNodes.map((s) => s.id));
    pubsubNode = add('pubsub-topic', 'application', 'Pub/Sub', pubsubEvidence, { topics });
  }

  // ---- Data layer ------------------------------------------------------
  const dbNode = detectDatabase(files, add);

  const bucketNode = detectBucket(files, add);

  const kms = gather(files, [
    { re: /client-kms|aws-sdk.*kms/i, describe: () => 'AWS KMS' },
    { re: /@google-cloud\/kms/i, describe: () => 'Google Cloud KMS' },
    { re: /\bvault\b|hashicorp\/vault/i, describe: () => 'HashiCorp Vault' },
    { re: /createCipheriv|createDecipheriv/i, describe: () => 'Node crypto cipher usage' },
  ]);
  let kmsNode: InfraNode | null = null;
  if (kms.length) {
    const keyAccess = [dbNode?.id, bucketNode?.id, authNode?.id].filter(Boolean) as string[];
    kmsNode = add('kms', 'data', 'KMS', kms, { keyAccess });
  }

  // ---- Edges between layers (with encryption heuristics) ---------------
  const edges = buildEdges({
    gateway: nodes.find((n) => n.type === 'api-gateway') ?? null,
    lb: nodes.find((n) => n.type === 'load-balancer') ?? null,
    cdn: nodes.find((n) => n.type === 'cdn') ?? null,
    services: serviceNodes,
    auth: authNode,
    cache: cacheNode,
    pubsub: pubsubNode,
    db: dbNode,
    bucket: bucketNode,
    kms: kmsNode,
    files,
  });

  // ---- Smart suggestions (gap analysis) --------------------------------
  const suggestions = buildSuggestions(serviceNodes, {
    gateway: nodes.find((n) => n.type === 'api-gateway') ?? null,
    lb: nodes.find((n) => n.type === 'load-balancer') ?? null,
    db: dbNode,
    bucket: bucketNode,
    pubsub: pubsubNode,
    auth: authNode,
    cache: cacheNode,
    cdn: nodes.find((n) => n.type === 'cdn') ?? null,
  });

  const projectContext = buildProjectContext(scan, readme ?? null);

  return { nodes, edges, suggestions, projectContext };
}

/**
 * Vocabulary of technologies/infrastructure ArchLab recognises in a README.
 * Each entry is matched as a whole word (case-insensitive); the canonical form
 * is what gets surfaced and used as corroborating evidence in the audit.
 */
const README_TECH_VOCAB: string[] = [
  // data stores
  'redis', 'postgres', 'postgresql', 'mysql', 'mongodb', 'mongo', 'sqlite', 'dynamodb',
  'cassandra', 'elasticsearch', 'clickhouse', 'supabase', 'prisma', 'drizzle', 'sequelize', 'typeorm',
  // infra / orchestration
  'kubernetes', 'k8s', 'docker', 'docker-compose', 'helm', 'terraform', 'pulumi', 'ansible',
  'nomad', 'istio', 'linkerd', 'envoy', 'consul', 'vault', 'nginx', 'haproxy',
  // cloud + edge
  'aws', 'gcp', 'azure', 'cloudflare', 'cloudfront', 'fastly', 'vercel', 'netlify', 'fly.io', 'railway',
  's3', 'lambda', 'ecs', 'eks', 'cloud run',
  // messaging / streaming
  'kafka', 'rabbitmq', 'sqs', 'pubsub', 'bullmq', 'nats',
  // observability
  'sentry', 'datadog', 'prometheus', 'grafana', 'opentelemetry', 'jaeger', 'newrelic', 'pino', 'winston',
  // ci/cd
  'github actions', 'gitlab ci', 'circleci', 'jenkins', 'argocd', 'argo rollouts',
  // auth / security
  'jwt', 'oauth', 'clerk', 'auth0', 'nextauth', 'passport', 'helmet', 'snyk', 'dependabot',
  // app frameworks
  'react', 'next.js', 'nextjs', 'vue', 'svelte', 'angular', 'express', 'fastify', 'nestjs',
  'graphql', 'grpc', 'trpc', 'rest', 'zod', 'stripe',
];

/** Phrases that signal an architecture decision worth surfacing. */
const ARCH_PHRASES: string[] = [
  'monorepo', 'microservice', 'microservices', 'serverless', 'event-driven', 'event driven',
  'monolith', 'modular monolith', 'domain-driven', 'cqrs', 'hexagonal', 'clean architecture',
  'multi-tenant', 'multi-region', 'edge', 'ssr', 'server-side rendering', 'static site',
];

/** Strip markdown noise from a line for a clean one-liner. */
function cleanLine(line: string): string {
  return line
    .replace(/!?\[[^\]]*\]\([^)]*\)/g, '') // images / links
    .replace(/[#>*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Build the README-derived project understanding. */
function buildProjectContext(scan: ScanResult, readme: string | null): ProjectContext {
  if (!readme) {
    return {
      name: scan.name,
      purpose: '',
      technologies: [],
      architectureDecisions: [],
      fromReadme: false,
    };
  }

  const lines = readme.split(/\r?\n/);

  // Name: first H1 heading, else the folder name.
  let name = scan.name;
  const h1 = lines.find((l) => /^#\s+\S/.test(l));
  if (h1) name = cleanLine(h1) || scan.name;

  // Purpose: first non-empty, non-heading, non-badge line.
  let purpose = '';
  for (const raw of lines) {
    const l = cleanLine(raw);
    if (!l) continue;
    if (/^#/.test(raw.trim())) continue; // headings
    if (/^\W*(https?:\/\/|badge|build|coverage)/i.test(l)) continue; // badge rows
    purpose = l.length > 200 ? `${l.slice(0, 197)}...` : l;
    break;
  }

  const haystack = readme.toLowerCase();
  const wordHit = (term: string) =>
    new RegExp('\\b' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(haystack);

  const technologies = README_TECH_VOCAB.filter(wordHit);

  const architectureDecisions: string[] = [];
  for (const phrase of ARCH_PHRASES) {
    if (wordHit(phrase) && !architectureDecisions.includes(phrase)) {
      architectureDecisions.push(phrase);
    }
  }

  return { name, purpose, technologies, architectureDecisions, fromReadme: true };
}

/** Detect the database and return its node (or null). */
function detectDatabase(
  files: ScannedFile[],
  add: (t: InfraNodeType, l: InfraLayer, label: string, ev: InfraEvidence[], meta?: InfraNode['meta']) => InfraNode,
): InfraNode | null {
  const map: { type: InfraNodeType; label: string; probes: Probe[] }[] = [
    { type: 'postgres', label: 'PostgreSQL', probes: [{ re: /\bpg\b|postgres|postgresql/i, describe: () => 'PostgreSQL driver' }] },
    { type: 'mysql', label: 'MySQL', probes: [{ re: /mysql2?|mariadb/i, describe: () => 'MySQL driver' }] },
    { type: 'mongodb', label: 'MongoDB', probes: [{ re: /mongoose|mongodb/i, describe: () => 'MongoDB / Mongoose' }] },
    { type: 'redis', label: 'Redis (store)', probes: [{ re: /upstash|redis-om/i, describe: () => 'Redis data store' }] },
  ];
  // Generic ORM markers attach to the first matching engine, else postgres.
  for (const entry of map) {
    const ev = gather(files, entry.probes);
    if (ev.length) {
      const atRest = encryptionAtRest(files);
      return add(entry.type, 'data', entry.label, ev, { encryptionAtRest: atRest });
    }
  }
  const orm = gather(files, [
    { re: /@prisma\/client|schema\.prisma/i, describe: () => 'Prisma ORM' },
    { re: /sequelize/i, describe: () => 'Sequelize ORM' },
    { re: /typeorm/i, describe: () => 'TypeORM' },
    { re: /drizzle-orm/i, describe: () => 'Drizzle ORM' },
    { re: /@supabase\/supabase-js/i, describe: () => 'Supabase client' },
  ]);
  if (orm.length) return add('postgres', 'data', 'Database', orm, { encryptionAtRest: encryptionAtRest(files) });
  return null;
}

/** Heuristic: is data-at-rest encryption configured anywhere? */
function encryptionAtRest(files: ScannedFile[]): EncryptionState {
  for (const f of files) {
    if (/encryptionAtRest|StorageEncrypted|sse\s*[:=]|ServerSideEncryption|pgcrypto/i.test(f.content)) {
      return 'encrypted';
    }
  }
  return 'unknown';
}

/** Detect a storage bucket and classify its visibility / access pattern. */
function detectBucket(
  files: ScannedFile[],
  add: (t: InfraNodeType, l: InfraLayer, label: string, ev: InfraEvidence[], meta?: InfraNode['meta']) => InfraNode,
): InfraNode | null {
  const ev = gather(files, [
    { re: /@aws-sdk\/client-s3|aws-sdk.*S3|new S3\(/i, describe: () => 'AWS S3 SDK' },
    { re: /@google-cloud\/storage/i, describe: () => 'Google Cloud Storage' },
    { re: /supabase.*storage|\.storage\.from\(/i, describe: () => 'Supabase Storage' },
    { re: /@azure\/storage-blob/i, describe: () => 'Azure Blob Storage' },
  ]);
  if (!ev.length) return null;

  // Public vs private classification.
  let isPublic = false;
  let access: 'direct' | 'signed-url' | 'open' = 'direct';
  let sensitive = false;
  for (const f of files) {
    if (/public-read|publicRead|makePublic|getPublicUrl|ACL:\s*['"]public/i.test(f.content)) {
      isPublic = true;
      access = 'open';
    }
    if (/getSignedUrl|createSignedUrl|presigned/i.test(f.content)) access = 'signed-url';
    if (/(user|private|secure|upload|document)s?\//i.test(f.content) && isPublic) sensitive = true;
  }
  const visibility = isPublic ? 'public' : 'private';
  return add(isPublic ? 'public-bucket' : 'private-bucket', 'data', isPublic ? 'Public Bucket' : 'Private Bucket', ev, {
    bucketVisibility: visibility,
    potentiallyExposed: sensitive,
    bucketAccess: access,
    encryptionAtRest: encryptionAtRest(files),
  });
}

/** Build pub/sub topics from emit/on/queue patterns. */
function detectTopics(files: ScannedFile[], serviceIds: string[]): PubSubTopic[] {
  const names = new Set<string>();
  const emitRe = /(?:emit|publish|add)\(['"`]([\w.:-]+)['"`]/g;
  const onRe = /(?:on|subscribe|process)\(['"`]([\w.:-]+)['"`]/g;
  const queueRe = /new\s+Queue\(['"`]([\w.:-]+)['"`]/g;
  for (const f of files) {
    for (const re of [emitRe, onRe, queueRe]) {
      let m: RegExpExecArray | null;
      const r = new RegExp(re.source, 'g');
      while ((m = r.exec(f.content)) !== null) names.add(m[1]);
    }
  }
  const hasDLQ = files.some((f) => /dead-?letter|deadLetter|dlq|failedQueue/i.test(f.content));
  const hasRetry = files.some((f) => /attempts\s*:|retr(y|ies)|backoff/i.test(f.content));
  const owner = serviceIds[0] ? [serviceIds[0]] : [];
  return [...names].slice(0, 8).map((name, i) => ({
    id: `topic_${i}`,
    name,
    publishers: owner,
    subscribers: owner,
    hasDLQ,
    subscribersWithoutRetry: hasRetry ? [] : owner,
  }));
}

interface Wiring {
  gateway: InfraNode | null;
  lb: InfraNode | null;
  cdn: InfraNode | null;
  services: InfraNode[];
  auth: InfraNode | null;
  cache: InfraNode | null;
  pubsub: InfraNode | null;
  db: InfraNode | null;
  bucket: InfraNode | null;
  kms: InfraNode | null;
  files: ScannedFile[];
}

/** Wire detected nodes top-to-bottom and tag each edge's encryption state. */
function buildEdges(w: Wiring): InfraEdge[] {
  const edges: InfraEdge[] = [];
  let e = 0;
  const transit = transitEncryption(w.files);
  const dbTransit = dbConnectionEncryption(w.files);
  const link = (
    a: InfraNode | null,
    b: InfraNode | null,
    label: string,
    enc: EncryptionState,
  ) => {
    if (!a || !b) return;
    edges.push({ id: `iedge_${e++}`, source: a.id, target: b.id, label, encryption: enc });
  };

  link(w.cdn, w.lb, 'static assets', transit);
  link(w.lb, w.gateway, 'forwards', transit);
  const upstream = w.gateway ?? w.lb ?? w.cdn;
  for (const svc of w.services) {
    link(upstream, svc, 'routes', transit);
    link(svc, w.auth, 'verifies', transit);
    link(svc, w.cache, 'reads/writes', transit);
    link(svc, w.pubsub, 'publishes', transit);
    link(svc, w.db, 'queries', dbTransit);
    link(svc, w.bucket, 'stores', transit);
  }
  link(w.kms, w.db, 'encrypts', 'encrypted');
  link(w.kms, w.bucket, 'encrypts', 'encrypted');
  return edges;
}

/** Heuristic transit encryption: HTTPS/TLS in code => encrypted, plain http => unencrypted. */
function transitEncryption(files: ScannedFile[]): EncryptionState {
  let sawHttps = false;
  let sawPlainHttp = false;
  for (const f of files) {
    if (/https:\/\/|createServer.*https|tls\.|\.pfx|ssl:\s*true/i.test(f.content)) sawHttps = true;
    if (/http:\/\/(?!127\.0\.0\.1|localhost)/i.test(f.content)) sawPlainHttp = true;
  }
  if (sawHttps && !sawPlainHttp) return 'encrypted';
  if (sawPlainHttp && !sawHttps) return 'unencrypted';
  return 'unknown';
}

/** DB connection encryption from sslmode / ssl flags in connection strings. */
function dbConnectionEncryption(files: ScannedFile[]): EncryptionState {
  for (const f of files) {
    if (/sslmode=require|ssl:\s*true|ssl:\s*\{/i.test(f.content)) return 'encrypted';
    if (/sslmode=disable|ssl:\s*false/i.test(f.content)) return 'unencrypted';
  }
  return 'unknown';
}

interface SuggestionCtx {
  gateway: InfraNode | null;
  lb: InfraNode | null;
  db: InfraNode | null;
  bucket: InfraNode | null;
  pubsub: InfraNode | null;
  auth: InfraNode | null;
  cache: InfraNode | null;
  cdn: InfraNode | null;
}

/** Gap analysis: what infrastructure is missing and would help this project. */
function buildSuggestions(
  services: InfraNode[],
  ctx: SuggestionCtx,
): InfraSuggestion[] {
  const out: InfraSuggestion[] = [];
  let col = 0;
  const slot = (layer: InfraLayer) => ({ x: COL_START + col++ * COL_GAP, y: LAYER_Y[layer] + 150 });
  const push = (s: Omit<InfraSuggestion, 'id' | 'position'> & { position?: InfraSuggestion['position'] }) =>
    out.push({ id: `sugg_${out.length}`, position: s.position ?? slot(s.layer), ...s });

  const firstService = services[0]?.id;

  if (!ctx.cdn && (ctx.lb || ctx.gateway)) {
    push({
      type: 'cdn',
      layer: 'edge',
      title: 'Add a CDN',
      why: 'No CDN detected. Putting one in front of your edge would cache and serve static assets closer to users, cutting latency and origin load.',
      betweenSource: ctx.lb?.id,
      betweenTarget: ctx.gateway?.id,
      risk: 'low',
      prompt:
        'Add a CDN in front of the application edge. Configure CloudFront (or Cloudflare) to cache static assets and proxy dynamic requests to the existing load balancer / API gateway. Set sensible cache-control headers for static vs dynamic routes and add cache invalidation on deploy.',
    });
  }

  if (!ctx.cache && ctx.db && firstService) {
    push({
      type: 'cache',
      layer: 'application',
      title: 'Add a Redis cache',
      why: 'No cache layer detected. Adding Redis between your API and the database would absorb repeated reads and reduce query load at scale.',
      betweenSource: firstService,
      betweenTarget: ctx.db.id,
      risk: 'low',
      prompt:
        'Introduce a Redis cache between the API layer and the database. Add a small cache wrapper with read-through and write-through helpers, cache the hottest read queries with a sensible TTL, and invalidate on the corresponding writes.',
    });
  }

  if (ctx.pubsub) {
    const noDLQ = (ctx.pubsub.meta?.topics ?? []).some((t) => !t.hasDLQ);
    if (noDLQ) {
      push({
        type: 'dead-letter-queue',
        layer: 'application',
        title: 'Add a dead letter queue',
        why: 'Your message queue has no dead letter queue. Adding one captures messages that fail all retries instead of losing them silently.',
        betweenSource: ctx.pubsub.id,
        risk: 'low',
        prompt:
          'Add a dead letter queue to the existing message queue. Route messages that exhaust their retry attempts to the DLQ, add basic alerting when the DLQ depth grows, and document a replay procedure.',
      });
    }
  }

  if (ctx.bucket?.meta?.bucketVisibility === 'public') {
    push({
      type: 'private-bucket',
      layer: 'data',
      title: 'Make the bucket private',
      why: 'Your storage bucket appears public. Making it private and serving files through signed URLs would secure your assets while keeping them accessible.',
      betweenSource: ctx.bucket.id,
      risk: ctx.bucket.meta?.potentiallyExposed ? 'high' : 'medium',
      prompt:
        'Make the storage bucket private: remove public-read ACLs and block public access at the bucket level. Replace direct public URLs with short-lived signed URLs generated server-side, and audit existing objects for anything sensitive that was publicly readable.',
    });
  }

  if (!ctx.auth && services.length > 0) {
    push({
      type: 'auth-service',
      layer: 'application',
      title: 'Add an auth layer',
      why: 'Backend services were detected but no authentication layer. Adding auth protects your endpoints from unauthenticated access.',
      betweenSource: ctx.gateway?.id,
      betweenTarget: firstService,
      risk: 'medium',
      prompt:
        'Add an authentication and authorization layer in front of the API. Verify a signed token (JWT or session) in middleware before protected handlers run, attach the authenticated principal to the request, and return 401/403 consistently.',
    });
  }

  return out;
}
