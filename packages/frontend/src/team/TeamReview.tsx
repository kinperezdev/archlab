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

export function TeamReview({ session, diagnostics = [], onClose, embedded = false }: TeamReviewProps) {
  const [localQueue, setLocalQueue] = useState<ReviewQueueItem[]>(session?.queue ?? []);
  const [copiedMaster, setCopiedMaster] = useState(false);

  useEffect(() => {
    if (session?.queue) {
      setLocalQueue(session.queue);
    }
  }, [session?.queue]);

  // Build the queue from the live diagnostics. `allowMocks` only applies to the
  // empty-state "Run Team Review" demo; Sync Diagnostics always mirrors reality,
  // so syncing with zero diagnostics clears the queue instead of injecting fakes.
  const populateQueue = (allowMocks: boolean) => {
    if (diagnostics.length > 0) {
      const mapped = diagnostics.map((d) => ({
        id: d.id,
        type: d.step || 'General',
        severity: d.severity,
        title: d.title,
      }));
      setLocalQueue(mapped);
    } else if (allowMocks) {
      setLocalQueue([
        { id: 'mock-1', type: 'security', severity: 'critical', title: 'Verify public S3 write permissions' },
        { id: 'mock-2', type: 'performance', severity: 'bottleneck', title: 'Optimize database connection pool' },
        { id: 'mock-3', type: 'api', severity: 'medium', title: 'Audit auth middleware token validation' },
        { id: 'mock-4', type: 'frontend', severity: 'low', title: 'Refactor layout bundle chunk size' },
      ]);
    } else {
      setLocalQueue([]);
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
          tokenBudget={session?.tokenBudget ?? 5000}
          tokensUsed={session?.tokensUsed ?? 0}
          taskBadges={taskBadges}
          threatLevel={threatLevel}
          recentTasksByEmployee={recentTasksByEmployee}
        />

        <section className="team-review-queue">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <h3 className="team-review-queue-title" style={{ margin: 0 }}>Review Queue · {queue.length}</h3>
            {queue.length > 0 && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={copyMasterPrompt}
                  title="Copy the company's consolidated fix plan as one prompt"
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
              </div>
            )}
          </div>
          {queue.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4) 0' }}>
              <p className="archco-muted">
                No items queued. Run a Team Review to populate the company.
              </p>
              <button
                className="btn"
                onClick={() => populateQueue(true)}
                style={{ background: '#4f46e5', color: '#ffffff', padding: '6px 16px', borderRadius: '4px' }}
              >
                ▶ Run Team Review
              </button>
            </div>
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
