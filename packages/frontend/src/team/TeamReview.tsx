/**
 * Team Review panel — hosts the ArchCo virtual company above the review queue.
 *
 * The queue is mapped onto specific employees (by specialization) so each
 * working employee shows the item they are handling, and the security threat
 * level on Floor 4 reflects the current diagnostics.
 */

import { useState, useEffect, useMemo } from 'react';
import type { Diagnostic, Severity } from '@archlab/shared';
import { ArchCo } from './archco/ArchCo.js';
import type { ThreatLevel } from './archco/FloorScene.js';
import { EMPLOYEES } from './archco/companyData.js';
import { detectAvailableProvider, completeWithProvider, type ProviderKeys } from './archco/multiProviderAI.js';
import { runItemDebate, runItemReviewFromKnowledge, type DebateMessage, type DebateSeverity } from './teamDebateRunner.js';

export interface ReviewQueueItem {
  id: string;
  /** Free-form item type, e.g. 'security', 'performance', 'frontend', 'api'. */
  type: string;
  severity: Severity;
  title: string;
}

export interface ReviewSession {
  tokenBudget?: number;
  tokensUsed?: number;
  queue?: ReviewQueueItem[];
}

interface TeamReviewProps {
  session?: ReviewSession;
  diagnostics?: Diagnostic[];
  onClose?: () => void;
  /** Render as a full-surface tab (no modal backdrop) instead of an overlay. */
  embedded?: boolean;
  /** Provider keys for the AI debate + AI Update. */
  apiKeys?: ProviderKeys;
  /** Short project description for AI prompts. */
  projectContext?: string;
  /** Cross-project brain insights passed to ArchCo's AI Update. */
  brainInsights?: string[];
}

type BadgeSeverity = 'critical' | 'high' | 'medium' | 'low';

/** Collapse the richer Severity union onto the four task-badge buckets. */
function toBadgeSeverity(s: Severity): BadgeSeverity {
  if (s === 'critical') return 'critical';
  if (s === 'high' || s === 'bottleneck') return 'high';
  if (s === 'medium') return 'medium';
  return 'low';
}

/** Keyword sets that connect a queue item type to an employee's specialization. */
function matchesSpecialization(itemType: string, specialization: string[]): boolean {
  const t = itemType.toLowerCase();
  return specialization.some((s) => {
    const spec = s.toLowerCase();
    return spec.includes(t) || t.includes(spec.split(' ')[0]);
  });
}

/**
 * Map queue items to employee task badges. Each item is assigned to the
 * best-matching employee by specialization; ties round-robin so the work
 * spreads across the relevant team instead of piling on one person.
 */
export function buildTaskBadges(
  queue: ReviewQueueItem[],
): Record<string, { label: string; severity: BadgeSeverity }> {
  const badges: Record<string, { label: string; severity: BadgeSeverity }> = {};
  const assignedCount: Record<string, number> = {};

  for (const item of queue) {
    const candidates = EMPLOYEES.filter((e) =>
      matchesSpecialization(item.type, e.specialization),
    );
    const pool = candidates.length > 0 ? candidates : EMPLOYEES;
    // Pick the candidate with the fewest current assignments (round-robin).
    const chosen = pool.reduce((best, e) =>
      (assignedCount[e.id] ?? 0) < (assignedCount[best.id] ?? 0) ? e : best,
    );
    assignedCount[chosen.id] = (assignedCount[chosen.id] ?? 0) + 1;
    // Keep the first (highest-priority) item shown if multiple land on one desk.
    if (!badges[chosen.id]) {
      badges[chosen.id] = {
        label: item.title.length > 18 ? `${item.title.slice(0, 17)}…` : item.title,
        severity: toBadgeSeverity(item.severity),
      };
    }
  }

  return badges;
}

/**
 * Derive the Floor-4 security threat level from the current diagnostics:
 *  - red when any CRITICAL security finding is present
 *  - yellow when any HIGH security finding is present
 *  - green otherwise
 */
export function deriveThreatLevel(diagnostics: Diagnostic[] = []): ThreatLevel {
  const security = diagnostics.filter(
    (d) => d.step === 'security-checks' || /security|auth|injection|xss|csrf/i.test(d.title),
  );
  if (security.some((d) => d.severity === 'critical')) return 'red';
  if (security.some((d) => d.severity === 'high')) return 'yellow';
  return 'green';
}

const QUEUE_SEVERITY_ORDER: Severity[] = ['critical', 'high', 'bottleneck', 'medium', 'low', 'info'];

/**
 * The company's consolidated fix plan: every queued item, sorted by priority and
 * stamped with the employee ArchCo assigned it to, framed as a single delegation
 * prompt a coding agent can execute on the company's behalf.
 */
function buildCompanyMasterPrompt(queue: ReviewQueueItem[]): string {
  // Re-derive which employee owns each item so the prompt names the assignee
  // (mirrors buildTaskBadges' round-robin assignment).
  const ownerById: Record<string, string> = {};
  const assignedCount: Record<string, number> = {};
  for (const item of queue) {
    const candidates = EMPLOYEES.filter((e) => matchesSpecialization(item.type, e.specialization));
    const pool = candidates.length > 0 ? candidates : EMPLOYEES;
    const chosen = pool.reduce((best, e) =>
      (assignedCount[e.id] ?? 0) < (assignedCount[best.id] ?? 0) ? e : best,
    );
    assignedCount[chosen.id] = (assignedCount[chosen.id] ?? 0) + 1;
    ownerById[item.id] = chosen.name;
  }

  const sorted = [...queue].sort(
    (a, b) => QUEUE_SEVERITY_ORDER.indexOf(a.severity) - QUEUE_SEVERITY_ORDER.indexOf(b.severity),
  );
  const lines: string[] = [];
  lines.push(
    'You are executing the fix plan delegated by ArchCo, the engineering company managing this project.',
    'Implement every item below with minimal, well-scoped changes, in priority order (critical first). Preserve existing behavior and follow the project conventions. Note any follow-up tests.',
    '',
    '## Fix plan',
  );
  sorted.forEach((item, i) => {
    lines.push(`${i + 1}. [${item.severity.toUpperCase()}] ${item.title}`);
    lines.push(`   - Area: ${item.type}`);
    if (ownerById[item.id]) lines.push(`   - Owner: ${ownerById[item.id]}`);
  });
  return lines.join('\n');
}

/** Render a debate message, lifting any ACTION:/PROMPT: lines into clean,
 *  labeled blocks instead of showing them as raw text. */
function DebateBody({ text }: { text: string }) {
  const action = text.match(/ACTION:\s*(.+)/i)?.[1]?.trim();
  const prompt = text.match(/PROMPT:\s*(.+)/i)?.[1]?.trim();
  const prose = text.replace(/\n?\s*ACTION:[\s\S]*/i, '').trim();
  if (!action && !prompt) return <p className="team-debate-text">{text}</p>;
  return (
    <>
      {prose && <p className="team-debate-text">{prose}</p>}
      {action && (
        <p className="team-debate-decision">
          <span className="team-debate-tag">Decision</span>
          {action}
        </p>
      )}
      {prompt && (
        <p className="team-debate-decision">
          <span className="team-debate-tag team-debate-tag-prompt">Fix prompt</span>
          {prompt}
        </p>
      )}
    </>
  );
}

export function TeamReview({
  session,
  diagnostics = [],
  onClose,
  embedded = false,
  apiKeys = {},
  projectContext = '',
  brainInsights = [],
}: TeamReviewProps) {
  const [localQueue, setLocalQueue] = useState<ReviewQueueItem[]>(session?.queue ?? []);
  const [copiedMaster, setCopiedMaster] = useState(false);
  // Live AI debate state.
  const [debateMessages, setDebateMessages] = useState<DebateMessage[]>([]);
  const [debateTitle, setDebateTitle] = useState<string | null>(null);
  const [isDebating, setIsDebating] = useState(false);
  const [reviewMode, setReviewMode] = useState<'ai' | 'docs'>('ai');
  const [tokensUsed, setTokensUsed] = useState(0);
  const [tokenBudget, setTokenBudget] = useState(5000);

  useEffect(() => {
    if (session?.queue) {
      setLocalQueue(session.queue);
    }
  }, [session?.queue]);

  // Build the queue from the live diagnostics. `allowMocks` only applies to the
  // empty-state "Run Team Review" demo; Sync Diagnostics always mirrors reality,
  // so syncing with zero diagnostics clears the queue instead of injecting fakes.
  const computeQueueItems = (allowMocks: boolean): ReviewQueueItem[] => {
    if (diagnostics.length > 0) {
      return diagnostics.map((d) => ({
        id: d.id,
        type: d.step || 'General',
        severity: d.severity,
        title: d.title,
      }));
    }
    if (allowMocks) {
      return [
        { id: 'mock-1', type: 'security', severity: 'critical', title: 'Verify public S3 write permissions' },
        { id: 'mock-2', type: 'performance', severity: 'bottleneck', title: 'Optimize database connection pool' },
        { id: 'mock-3', type: 'api', severity: 'medium', title: 'Audit auth middleware token validation' },
        { id: 'mock-4', type: 'frontend', severity: 'low', title: 'Refactor layout bundle chunk size' },
      ];
    }
    return [];
  };

  const populateQueue = (allowMocks: boolean) => setLocalQueue(computeQueueItems(allowMocks));

  // Run Team Review: populate the queue, then (if a provider is configured)
  // stream a real AI debate for each item while tracking token spend.
  const handleRunReview = async () => {
    if (isDebating) return;
    const items = queue.length > 0 ? queue : computeQueueItems(true);
    setLocalQueue(items);

    const provider = detectAvailableProvider(apiKeys);
    setIsDebating(true);
    setTokensUsed(0);
    let runningTokens = 0;
    try {
      // Pre-flight: a key may exist but be over quota / unreachable. One tiny
      // call decides whether to run the live debate or the docs review.
      let useAI = provider.available;
      if (useAI) {
        const probe = await completeWithProvider(provider, 'ping', 'Reply ok', 1);
        if (probe.error) useAI = false;
      }
      setReviewMode(useAI ? 'ai' : 'docs');

      for (const item of items.slice(0, 5)) {
        const debateItem = {
          id: item.id,
          title: item.title,
          description: item.title,
          severity: toBadgeSeverity(item.severity) as DebateSeverity,
          type: item.type,
        };
        setDebateTitle(item.title);
        setDebateMessages([]);
        // With a key: live AI debate. Without: deterministic docs/knowledge review.
        const stream = useAI
          ? runItemDebate(debateItem, projectContext, provider, (tokens) => {
              runningTokens += tokens;
              setTokensUsed(runningTokens);
            })
          : runItemReviewFromKnowledge(debateItem);
        for await (const msg of stream) {
          setDebateMessages((prev) => [...prev, msg]);
        }
        if (useAI && runningTokens >= tokenBudget * 0.9) break; // respect Fran's budget
      }
    } finally {
      setIsDebating(false);
    }
  };

  const queue = localQueue;

  // Stable identities: buildTaskBadges / deriveThreatLevel run on every render
  // otherwise, and their churn re-created the `presentIds` set inside ArchCo,
  // resetting the floor each render. Memoizing keeps the office stable.
  const taskBadges = useMemo(() => buildTaskBadges(queue), [queue]);
  const threatLevel = useMemo(() => deriveThreatLevel(diagnostics), [diagnostics]);
  // Surface each assigned employee's current item as their recent-work history.
  const recentTasksByEmployee = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const [empId, badge] of Object.entries(taskBadges)) map[empId] = [badge.label];
    return map;
  }, [taskBadges]);

  const copyMasterPrompt = async () => {
    if (queue.length === 0) return;
    try {
      await navigator.clipboard.writeText(buildCompanyMasterPrompt(queue));
      setCopiedMaster(true);
      setTimeout(() => setCopiedMaster(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };

  const body = (
    <>
        <ArchCo
          tokenBudget={tokenBudget}
          tokensUsed={tokensUsed}
          taskBadges={taskBadges}
          threatLevel={threatLevel}
          recentTasksByEmployee={recentTasksByEmployee}
          apiKeys={apiKeys}
          brainInsights={brainInsights}
          projectContext={projectContext}
        />

        <section className="team-review-queue">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-3)' }}>
            <h3 className="team-review-queue-title" style={{ margin: 0 }}>Review Queue · {queue.length}</h3>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <label style={{ fontSize: '11px', color: 'var(--color-text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Budget
                <input
                  type="number"
                  value={tokenBudget}
                  min={500}
                  step={500}
                  onChange={(e) => setTokenBudget(Math.max(500, Number(e.target.value) || 0))}
                  style={{ width: '72px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: '4px', color: 'var(--color-text)', padding: '2px 6px', fontSize: '11px' }}
                />
              </label>
              <button
                className="btn btn-sm btn-primary"
                onClick={handleRunReview}
                disabled={isDebating}
                title="Run the team review and put the company to work"
              >
                {isDebating ? '… Debating' : '▶ Run Team Review'}
              </button>
              {queue.length > 0 && (
                <>
                  <button
                    className="btn btn-sm"
                    onClick={copyMasterPrompt}
                    title="Copy the company's consolidated fix plan as one prompt"
                    style={{ background: 'rgba(99,102,241,0.18)', border: '1px solid var(--border-accent)' }}
                  >
                    {copiedMaster ? 'Copied ✓' : '⚡ Master Fix Prompt'}
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() => populateQueue(false)}
                    title="Rebuild the queue from the current diagnostics"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--color-border)' }}
                  >
                    Sync Diagnostics
                  </button>
                </>
              )}
            </div>
          </div>
          {queue.length === 0 ? (
            <p className="archco-muted" style={{ padding: 'var(--space-2) 0' }}>
              No items queued. Click <strong>Run Team Review</strong> to put the company to work.
            </p>
          ) : (
            <ul className="team-review-queue-list">
              {queue.map((item) => (
                <li key={item.id} className="team-review-queue-item" data-sev={item.severity}>
                  <span className="team-review-queue-sev">{item.severity}</span>
                  <span className="team-review-queue-name">{item.title}</span>
                  <span className="team-review-queue-type">{item.type}</span>
                </li>
              ))}
            </ul>
          )}

          {(debateMessages.length > 0 || isDebating) && (
            <div className="team-debate-thread">
              <div className="team-debate-head">
                <span className="team-debate-title">
                  {debateTitle
                    ? `${reviewMode === 'docs' ? 'Reviewing' : 'Debating'}: ${debateTitle}${reviewMode === 'docs' ? ' · docs review' : ''}`
                    : 'Team review'}
                </span>
                <span className="team-debate-tokens">{tokensUsed.toLocaleString()} / {tokenBudget.toLocaleString()} tokens</span>
              </div>
              {debateMessages.map((m, i) => (
                <div key={i} className="team-debate-msg" style={{ borderLeftColor: m.color }}>
                  <div className="team-debate-msg-head">
                    <strong style={{ color: m.color }}>{m.memberName}</strong>
                    <span className="team-debate-role">{m.role}</span>
                  </div>
                  <DebateBody text={m.message} />
                </div>
              ))}
              {isDebating && <div className="team-debate-typing">…</div>}
            </div>
          )}
        </section>
    </>
  );

  if (embedded) {
    return <div className="team-review-embedded">{body}</div>;
  }

  return (
    <div className="team-review-overlay" onClick={onClose}>
      <div className="team-review-panel" onClick={(e) => e.stopPropagation()}>
        {body}
      </div>
    </div>
  );
}
