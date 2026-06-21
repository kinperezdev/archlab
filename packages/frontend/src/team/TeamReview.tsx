/**
 * Team Review panel — hosts the ArchCo virtual company above the review queue.
 *
 * The queue is mapped onto specific employees (by specialization) so each
 * working employee shows the item they are handling, and the security threat
 * level on Floor 4 reflects the current diagnostics.
 */

import { useState, useEffect } from 'react';
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

export function TeamReview({ session, diagnostics = [], onClose }: TeamReviewProps) {
  const [localQueue, setLocalQueue] = useState<ReviewQueueItem[]>(session?.queue ?? []);

  useEffect(() => {
    if (session?.queue) {
      setLocalQueue(session.queue);
    }
  }, [session?.queue]);

  const handleRunTeamReview = () => {
    if (diagnostics.length > 0) {
      const mapped = diagnostics.map((d) => ({
        id: d.id,
        type: d.step || 'General',
        severity: d.severity,
        title: d.title,
      }));
      setLocalQueue(mapped);
    } else {
      const mocks: ReviewQueueItem[] = [
        { id: 'mock-1', type: 'security', severity: 'critical', title: 'Verify public S3 write permissions' },
        { id: 'mock-2', type: 'performance', severity: 'bottleneck', title: 'Optimize database connection pool' },
        { id: 'mock-3', type: 'api', severity: 'medium', title: 'Audit auth middleware token validation' },
        { id: 'mock-4', type: 'frontend', severity: 'low', title: 'Refactor layout bundle chunk size' },
      ];
      setLocalQueue(mocks);
    }
  };

  const queue = localQueue;

  return (
    <div className="team-review-overlay" onClick={onClose}>
      <div className="team-review-panel" onClick={(e) => e.stopPropagation()}>
        <ArchCo
          tokenBudget={session?.tokenBudget ?? 5000}
          tokensUsed={session?.tokensUsed ?? 0}
          taskBadges={buildTaskBadges(queue)}
          threatLevel={deriveThreatLevel(diagnostics)}
        />

        <section className="team-review-queue">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <h3 className="team-review-queue-title" style={{ margin: 0 }}>Review Queue · {queue.length}</h3>
            {queue.length > 0 && (
              <button 
                className="btn btn-sm" 
                onClick={handleRunTeamReview}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--color-border)' }}
              >
                Sync Diagnostics
              </button>
            )}
          </div>
          {queue.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4) 0' }}>
              <p className="archco-muted">
                No items queued. Run a Team Review to populate the company.
              </p>
              <button 
                className="btn" 
                onClick={handleRunTeamReview}
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
      </div>
    </div>
  );
}
