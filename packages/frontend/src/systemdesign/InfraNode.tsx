/**
 * A single infrastructure node on the System Design canvas.
 *
 * Renders in both modes:
 *  - Detected nodes are solid, colored by layer (edge=teal, app=blue, data=purple).
 *  - Suggestion nodes are dashed with a plus icon.
 *
 * Data-layer nodes show data-at-rest encryption (when the Security Layer overlay
 * is on); bucket nodes show PUBLIC/PRIVATE and a "Potentially Exposed" warning;
 * pub/sub nodes expand to show their topics with publisher/subscriber counts and
 * dead-letter / retry warnings; KMS nodes show how many nodes have key access.
 */

import { Handle, Position, type NodeProps } from 'reactflow';
import type { InfraNodeMeta, InfraNodeType } from '@archlab/shared';
import { infraMeta } from './infraCatalog.js';

export interface InfraNodeData {
  type: InfraNodeType;
  label: string;
  detected: boolean;
  /** True for dashed suggestion placeholders. */
  suggestion?: boolean;
  meta?: InfraNodeMeta;
  /** Whether the Security Layer overlay is active. */
  showSecurity?: boolean;
  /** Whether a pub/sub node is expanded to show topics. */
  expanded?: boolean;
}

const HANDLE_STYLE = { borderRadius: '50%', width: 8, height: 8 } as const;

export function InfraNode({ data, selected }: NodeProps<InfraNodeData>) {
  const meta = infraMeta(data.type);
  const { meta: m } = data;
  const isBucket = data.type === 'public-bucket' || data.type === 'private-bucket';
  const isPubSub = data.type === 'pubsub-topic' || data.type === 'message-queue';
  const isKms = data.type === 'kms';

  const className = [
    'infra-node',
    `infra-layer-${meta.layer}`,
    data.suggestion ? 'infra-suggestion' : 'infra-detected',
    selected ? 'infra-selected' : '',
  ].join(' ');

  return (
    <div className={className}>
      <Handle type="target" position={Position.Top} id="t" style={HANDLE_STYLE} />
      <Handle type="source" position={Position.Bottom} id="b" style={HANDLE_STYLE} />
      <Handle type="target" position={Position.Left} id="l" style={HANDLE_STYLE} />
      <Handle type="source" position={Position.Right} id="r" style={HANDLE_STYLE} />

      <div className="infra-node-head">
        <span className="infra-node-glyph">{meta.glyph}</span>
        <span className="infra-node-label">{data.label}</span>
        {data.suggestion && <span className="infra-node-plus" title="Suggested — not yet present">＋</span>}
      </div>
      <div className="infra-node-type">{meta.label}</div>

      {/* Bucket visibility */}
      {isBucket && m?.bucketVisibility && (
        <div className="infra-badges">
          <span className={`infra-badge ${m.bucketVisibility === 'public' ? 'bad' : 'good'}`}>
            {m.bucketVisibility === 'public' ? 'PUBLIC' : 'PRIVATE'}
          </span>
          {m.bucketAccess && <span className="infra-badge muted">{m.bucketAccess}</span>}
          {m.potentiallyExposed && (
            <span className="infra-badge danger" title="Public path suggests sensitive data">
              ⚠ Potentially Exposed Data
            </span>
          )}
        </div>
      )}

      {/* Data-at-rest encryption (security overlay) */}
      {data.showSecurity && m?.encryptionAtRest && (
        <div className="infra-badges">
          <span
            className={`infra-badge ${m.encryptionAtRest === 'encrypted' ? 'good' : m.encryptionAtRest === 'unencrypted' ? 'bad' : 'warn'}`}
          >
            at rest: {m.encryptionAtRest}
          </span>
        </div>
      )}

      {/* KMS key access */}
      {isKms && m?.keyAccess && (
        <div className="infra-kms-access">{m.keyAccess.length} node(s) have key access</div>
      )}

      {/* Pub/Sub topics */}
      {isPubSub && data.expanded && m?.topics && m.topics.length > 0 && (
        <div className="infra-topics">
          {m.topics.map((t) => (
            <div key={t.id} className="infra-topic">
              <span className="infra-topic-name">{t.name}</span>
              <span className="infra-topic-flow" title="publishers → subscribers">
                {t.publishers.length}↑ {t.subscribers.length}↓
              </span>
              {!t.hasDLQ && <span className="infra-badge warn" title="No dead letter queue">no DLQ</span>}
              {t.subscribersWithoutRetry.length > 0 && (
                <span className="infra-badge warn" title="Subscriber has no retry logic">no retry</span>
              )}
            </div>
          ))}
        </div>
      )}
      {isPubSub && m?.topics && m.topics.length > 0 && (
        <div className="infra-topic-hint">{data.expanded ? 'click to collapse' : `${m.topics.length} topic(s) — click to expand`}</div>
      )}
    </div>
  );
}
