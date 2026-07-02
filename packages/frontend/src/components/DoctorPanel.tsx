/**
 * Doctor panel — ArchLab checking its own health. Renders the backend's
 * self-diagnostic report (service status, brain integrity, security posture)
 * with pass/warn/fail rows and a re-run button.
 */

import { useCallback, useEffect, useState } from 'react';
import { Stethoscope, ShieldCheck, RefreshCw } from 'lucide-react';
import { PORTS, type DoctorReport, type DoctorCheck, type CheckStatus } from '@archlab/shared';

interface DoctorPanelProps {
  onClose: () => void;
}

const STATUS_COLOR: Record<CheckStatus, string> = {
  ok: '#34d399',
  warn: '#fbbf24',
  fail: '#f87171',
};

const STATUS_LABEL: Record<CheckStatus, string> = {
  ok: 'Pass',
  warn: 'Check',
  fail: 'Fail',
};

/** One status row: colored dot, label + detail, optional real/deterrence tag. */
function CheckRow({ check }: { check: DoctorCheck }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--space-3)',
        padding: 'var(--space-2) 0',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: STATUS_COLOR[check.status],
          marginTop: 6,
          flexShrink: 0,
          boxShadow: `0 0 8px ${STATUS_COLOR[check.status]}`,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', fontWeight: 500 }}>{check.label}</span>
          {check.kind && (
            <span
              style={{
                fontSize: '9px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                padding: '1px 6px',
                borderRadius: '10px',
                fontWeight: 600,
                background: check.kind === 'real' ? 'rgba(52, 211, 153, 0.12)' : 'rgba(148, 163, 184, 0.14)',
                color: check.kind === 'real' ? '#34d399' : '#94a3b8',
              }}
              title={
                check.kind === 'real'
                  ? 'Server-side protection — a real boundary'
                  : 'Deterrence — raises the bar but not a hard boundary'
              }
            >
              {check.kind}
            </span>
          )}
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-dim)', marginTop: 2 }}>{check.detail}</div>
      </div>
      <span style={{ fontSize: '10px', color: STATUS_COLOR[check.status], fontWeight: 600, flexShrink: 0 }}>
        {STATUS_LABEL[check.status]}
      </span>
    </div>
  );
}

export function DoctorPanel({ onClose }: DoctorPanelProps) {
  const [health, setHealth] = useState<DoctorReport | null>(null);
  const [security, setSecurity] = useState<DoctorReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null);

  const run = useCallback(() => {
    setLoading(true);
    setError('');
    const base = `http://127.0.0.1:${PORTS.backend}`;
    const bust = Date.now();
    const requestInit: RequestInit = { cache: 'no-store' };
    void Promise.all([
      fetch(`${base}/doctor?refresh=${bust}`, requestInit).then((r) => r.json()),
      fetch(`${base}/security/selfcheck?refresh=${bust}`, requestInit).then((r) => r.json()),
    ])
      .then(([h, s]) => {
        if (!h?.ok || !s?.ok) throw new Error(h?.error ?? s?.error ?? 'Doctor check failed');
        setHealth(h.report);
        setSecurity(s.report);
        setLastCheckedAt(Date.now());
      })
      .catch((err) => setError(`Could not reach the backend: ${String(err)}`))
      .finally(() => setLoading(false));
  }, []);

  useEffect(run, []);

  return (
    <div className="brain-overlay" onClick={onClose}>
      <div className="brain-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        <header
          className="brain-modal-head"
          style={{
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: 'var(--space-3)',
            marginBottom: 'var(--space-4)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <Stethoscope size={18} strokeWidth={1.75} aria-hidden="true" />
          <h2 style={{ flex: 1 }}>Doctor</h2>
          <button className="btn" onClick={run} disabled={loading} title="Check again">
            <RefreshCw size={13} strokeWidth={1.75} className={loading ? 'tb-folder-spin' : ''} />
          </button>
          <button className="btn" onClick={onClose}>
            ✕
          </button>
        </header>

        {error && (
          <div style={{ color: '#f87171', fontSize: 'var(--text-sm)', padding: 'var(--space-3) 0' }}>{error}</div>
        )}

        <div style={{ color: 'var(--color-text-dim)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-3)' }}>
          {loading
            ? 'Checking now...'
            : lastCheckedAt
              ? `Last checked ${new Date(lastCheckedAt).toLocaleTimeString()}`
              : 'Ready to check'}
        </div>

        {loading && !health && !security ? (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-dim)' }}>
            Running checks...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                <Stethoscope size={14} aria-hidden="true" />
                <h3 style={{ fontSize: 'var(--text-sm)', margin: 0 }}>System Health</h3>
                {health && <StatusPill status={health.status} />}
              </div>
              {health?.checks.map((c) => <CheckRow key={c.id} check={c} />)}
            </section>

            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                <ShieldCheck size={14} aria-hidden="true" />
                <h3 style={{ fontSize: 'var(--text-sm)', margin: 0 }}>Security self-check</h3>
                {security && <StatusPill status={security.status} />}
              </div>
              {security?.checks.map((c) => <CheckRow key={c.id} check={c} />)}
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-dim)', marginTop: 'var(--space-3)' }}>
                <strong style={{ color: '#34d399' }}>real</strong> = server-side protection.{' '}
                <strong style={{ color: '#94a3b8' }}>deterrence</strong> = raises the bar, not a hard boundary.
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

/** Small roll-up pill for a section header. */
function StatusPill({ status }: { status: CheckStatus }) {
  return (
    <span
      style={{
        fontSize: '10px',
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: '10px',
        background: `${STATUS_COLOR[status]}22`,
        color: STATUS_COLOR[status],
      }}
    >
      {status === 'ok' ? 'All clear' : status === 'warn' ? 'Needs attention' : 'Action needed'}
    </span>
  );
}
