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

export const LAYER_LABEL: Record<InfraLayer, string> = {
  edge: 'Edge Layer',
  application: 'Application Layer',
  data: 'Data Layer',
};

export const LAYERS: InfraLayer[] = ['edge', 'application', 'data'];
