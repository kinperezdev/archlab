/**
 * Catalog of every infrastructure node type: its label, glyph, layer, and the
 * color category it renders in. Shared by the Detected Mode renderer and the
 * Design Mode palette so both stay in sync.
 *
 * Color coding by layer: edge = teal, application = blue, data = purple.
 */

import type { InfraLayer, InfraNodeType } from '@archlab/shared';

export interface InfraTypeMeta {
  type: InfraNodeType;
  label: string;
  glyph: string;
  layer: InfraLayer;
}

export const INFRA_TYPES: InfraTypeMeta[] = [
  // Edge layer
  { type: 'cdn', label: 'CDN', glyph: '🌐', layer: 'edge' },
  { type: 'load-balancer', label: 'Load Balancer', glyph: '⚖', layer: 'edge' },
  { type: 'api-gateway', label: 'API Gateway', glyph: '🚪', layer: 'edge' },
  { type: 'waf', label: 'WAF', glyph: '🛡', layer: 'edge' },
  { type: 'ddos-protection', label: 'DDoS Protection', glyph: '🚧', layer: 'edge' },
  // Application layer
  { type: 'microservice', label: 'Microservice', glyph: '⬡', layer: 'application' },
  { type: 'auth-service', label: 'Auth Service', glyph: '🔑', layer: 'application' },
  { type: 'cache', label: 'Cache', glyph: '⚡', layer: 'application' },
  { type: 'message-queue', label: 'Message Queue', glyph: '✉', layer: 'application' },
  { type: 'pubsub-topic', label: 'Pub/Sub Topic', glyph: '📡', layer: 'application' },
  { type: 'dead-letter-queue', label: 'Dead Letter Queue', glyph: '☠', layer: 'application' },
  { type: 'worker', label: 'Worker', glyph: '⚙', layer: 'application' },
  { type: 'scheduler', label: 'Scheduler', glyph: '⏰', layer: 'application' },
  { type: 'websocket-server', label: 'WebSocket Server', glyph: '🔌', layer: 'application' },
  // Data layer
  { type: 'postgres', label: 'PostgreSQL', glyph: '🐘', layer: 'data' },
  { type: 'mysql', label: 'MySQL', glyph: '🐬', layer: 'data' },
  { type: 'mongodb', label: 'MongoDB', glyph: '🍃', layer: 'data' },
  { type: 'redis', label: 'Redis', glyph: '🔴', layer: 'data' },
  { type: 'private-bucket', label: 'Private Bucket', glyph: '🔒', layer: 'data' },
  { type: 'public-bucket', label: 'Public Bucket', glyph: '🪣', layer: 'data' },
  { type: 'kms', label: 'KMS', glyph: '🗝', layer: 'data' },
  { type: 'data-warehouse', label: 'Data Warehouse', glyph: '🏬', layer: 'data' },
  { type: 'search-index', label: 'Search Index', glyph: '🔍', layer: 'data' },
];

const BY_TYPE = new Map(INFRA_TYPES.map((m) => [m.type, m]));

export function infraMeta(type: InfraNodeType): InfraTypeMeta {
  return BY_TYPE.get(type) ?? { type, label: type, glyph: '⬡', layer: 'application' };
}

/** Plain-English description of what each infrastructure component does. */
const INFRA_DESCRIPTIONS: Record<InfraNodeType, string> = {
  cdn: 'A content delivery network caches and serves static assets from edge locations close to users, reducing latency and origin load.',
  'load-balancer': 'A load balancer spreads incoming traffic across multiple backend instances so no single server is overwhelmed and the system stays available.',
  'api-gateway': 'An API gateway is the single entry point for client requests. It handles routing, authentication, rate limiting, and request shaping before traffic reaches services.',
  waf: 'A web application firewall inspects incoming HTTP traffic and blocks common attacks (injection, XSS, bad bots) before they reach the application.',
  'ddos-protection': 'DDoS protection absorbs and filters volumetric attack traffic at the edge so legitimate users keep getting served.',
  microservice: 'A microservice is an independently deployable unit of business logic that owns a slice of the domain and communicates over the network.',
  'auth-service': 'An auth service verifies identity and issues/validates tokens, centralizing authentication and authorization for the rest of the system.',
  cache: 'A cache stores hot data in memory so repeated reads avoid hitting slower databases or recomputation.',
  'message-queue': 'A message queue buffers work between producers and consumers, decoupling services and smoothing traffic spikes.',
  'pubsub-topic': 'A pub/sub topic fans out events to many subscribers, letting services react to changes without direct coupling.',
  'dead-letter-queue': 'A dead letter queue captures messages that repeatedly fail processing so they can be inspected and replayed instead of lost.',
  worker: 'A worker processes background jobs off the request path, handling slow or scheduled work asynchronously.',
  scheduler: 'A scheduler triggers jobs on a time-based cadence (cron-like), driving recurring background tasks.',
  'websocket-server': 'A WebSocket server holds long-lived bidirectional connections for real-time updates pushed to clients.',
  postgres: 'PostgreSQL is a relational database storing the project’s structured, persistent data with transactional guarantees.',
  mysql: 'MySQL is a relational database storing the project’s structured, persistent data.',
  mongodb: 'MongoDB is a document database storing semi-structured JSON-like records.',
  redis: 'Redis is an in-memory data store used for caching, sessions, rate limiting, or lightweight queues.',
  'private-bucket': 'A private object storage bucket holds files (uploads, assets, backups) that are only reachable through authenticated or signed access.',
  'public-bucket': 'A public object storage bucket serves files directly over the internet without authentication.',
  kms: 'A key management service stores and controls cryptographic keys, gating which services can encrypt/decrypt sensitive data.',
  'data-warehouse': 'A data warehouse stores large analytical datasets optimized for reporting and aggregation queries.',
  'search-index': 'A search index powers fast full-text and faceted search over the project’s data.',
};

export function infraDescription(type: InfraNodeType): string {
  return INFRA_DESCRIPTIONS[type] ?? 'An infrastructure component in this architecture.';
}

export const LAYER_LABEL: Record<InfraLayer, string> = {
  edge: 'Edge Layer',
  application: 'Application Layer',
  data: 'Data Layer',
};

export const LAYERS: InfraLayer[] = ['edge', 'application', 'data'];
