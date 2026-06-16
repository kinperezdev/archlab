/**
 * System Design domain types.
 *
 * The System Design map describes infrastructure architecture: edge, application,
 * and data layers. It is produced two ways:
 *  - Detected Mode: the backend scans real code and auto-places infra nodes with
 *    the evidence (files + matched patterns) that triggered each detection.
 *  - Design Mode: the user freely places infra nodes to plan new architecture;
 *    that canvas persists to brain/system-design.json.
 */

/** The three horizontal layers infrastructure nodes are organized into. */
export type InfraLayer = 'edge' | 'application' | 'data';

/**
 * Every infrastructure node type ArchLab understands. Used both for auto-detected
 * nodes and for the Design Mode palette.
 */
export type InfraNodeType =
  // Edge layer
  | 'cdn'
  | 'load-balancer'
  | 'api-gateway'
  | 'waf'
  | 'ddos-protection'
  // Application layer
  | 'microservice'
  | 'auth-service'
  | 'cache'
  | 'message-queue'
  | 'pubsub-topic'
  | 'dead-letter-queue'
  | 'worker'
  | 'scheduler'
  | 'websocket-server'
  // Data layer
  | 'postgres'
  | 'mysql'
  | 'mongodb'
  | 'redis'
  | 'private-bucket'
  | 'public-bucket'
  | 'kms'
  | 'data-warehouse'
  | 'search-index';

/** Whether a connection is encrypted in transit. */
export type EncryptionState = 'encrypted' | 'unencrypted' | 'unknown';

/** Risk of applying a suggestion without breaking anything. */
export type SuggestionRisk = 'low' | 'medium' | 'high';

/** Storage bucket visibility, when the node is a bucket. */
export type BucketVisibility = 'public' | 'private' | 'unknown';

/** One piece of code evidence that triggered a detection. */
export interface InfraEvidence {
  /** Project-relative file path the pattern was found in. */
  file: string;
  /** Human-readable description of what matched (e.g. "import of 'ioredis'"). */
  pattern: string;
  /** The exact line / snippet that matched, when available. */
  snippet?: string;
}

/** Extra per-node detail, populated where relevant to the node type. */
export interface InfraNodeMeta {
  /** Bucket visibility, for *-bucket nodes. */
  bucketVisibility?: BucketVisibility;
  /** True when a public bucket path suggests sensitive data. */
  potentiallyExposed?: boolean;
  /** How the code touches a bucket: 'direct' | 'signed-url' | 'open'. */
  bucketAccess?: 'direct' | 'signed-url' | 'open';
  /** Whether data at rest is encrypted (data-layer nodes). */
  encryptionAtRest?: EncryptionState;
  /** Topics carried by a pub/sub node. */
  topics?: PubSubTopic[];
  /** For KMS nodes: ids of nodes that have key access. */
  keyAccess?: string[];
}

/** A pub/sub topic with its publishers and subscribers. */
export interface PubSubTopic {
  id: string;
  name: string;
  /** Node ids that publish to this topic. */
  publishers: string[];
  /** Node ids that subscribe to this topic. */
  subscribers: string[];
  /** Whether a dead letter queue is configured for this topic. */
  hasDLQ: boolean;
  /** Subscriber node ids that have no retry logic detected. */
  subscribersWithoutRetry: string[];
}

/** A single infrastructure node on the System Design canvas. */
export interface InfraNode {
  id: string;
  type: InfraNodeType;
  layer: InfraLayer;
  label: string;
  /** True if detected from real code; false if a suggestion placeholder. */
  detected: boolean;
  position: { x: number; y: number };
  /** Code evidence behind a detected node. Empty for design-mode nodes. */
  evidence: InfraEvidence[];
  meta?: InfraNodeMeta;
}

/** A connection between two infrastructure nodes. */
export interface InfraEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  /** Encryption-in-transit state, used by the Security Layer overlay. */
  encryption: EncryptionState;
}

/** A gap-analysis suggestion for infrastructure that is missing. */
export interface InfraSuggestion {
  id: string;
  type: InfraNodeType;
  layer: InfraLayer;
  /** Short label, e.g. "Add a CDN". */
  title: string;
  /** Why it would help this specific project. */
  why: string;
  /** Node id this suggestion would sit after (upstream), if any. */
  betweenSource?: string;
  /** Node id this suggestion would sit before (downstream), if any. */
  betweenTarget?: string;
  risk: SuggestionRisk;
  /** A precise, paste-ready prompt to implement this change. */
  prompt: string;
  /** Where to render the dashed placeholder node. */
  position: { x: number; y: number };
}

/** The complete detected infrastructure map for a project. */
export interface SystemDesignMap {
  nodes: InfraNode[];
  edges: InfraEdge[];
  suggestions: InfraSuggestion[];
}

/** The Design Mode free canvas document (persisted to brain/system-design.json). */
export interface SystemDesignDoc {
  nodes: unknown[];
  edges: unknown[];
}

// ---------------------------------------------------------------------------
// Enterprise Audit
// ---------------------------------------------------------------------------

/**
 * Live detection state for a single Enterprise Audit card.
 *  - detected:    clear evidence found in the project.
 *  - partial:     related-but-incomplete evidence found.
 *  - missing:     nothing detected (dim card).
 *  - critical-gap: absent and that absence is a security/reliability risk.
 */
export type EnterpriseCardState = 'detected' | 'partial' | 'missing' | 'critical-gap';

/** One evaluated capability card in the Enterprise Audit grid. */
export interface EnterpriseCard {
  id: string;
  label: string;
  /** Resolved detection state, computed from infra + findings. */
  state: EnterpriseCardState;
  /** Plain-English: what this capability is. */
  what: string;
  /** Why it matters for an enterprise-grade system. */
  why: string;
  /** What ArchLab detected (or did not detect) for this card. */
  detail: string;
  /** A one-line, paste-ready prompt to close the gap. */
  fixPrompt: string;
}

/** A colored Enterprise Audit category section with its evaluated cards. */
export interface EnterpriseSection {
  id: string;
  title: string;
  /** Glow / accent color, hex. */
  color: string;
  cards: EnterpriseCard[];
  /** Section score 0-100 (detected=1, partial=0.5, missing=0, critical-gap=-0.5). */
  score: number;
}

/** The full Enterprise Audit result for a project. */
export interface EnterpriseAuditResult {
  sections: EnterpriseSection[];
  /** Overall score 0-100. */
  score: number;
  /** One-line verdict derived from the score. */
  verdict: string;
  totalCards: number;
  detectedCount: number;
  partialCount: number;
  missingCount: number;
  criticalGapCount: number;
}
