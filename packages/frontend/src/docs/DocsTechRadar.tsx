/**
 * Docs tech radar — live version and end-of-life data for the technologies the
 * docs articles teach, served by the backend from endoflife.date and cached in
 * the brain. Auto-refreshes daily on the backend; manual refresh here.
 */

import { useEffect, useState } from 'react';
import { PORTS } from '@archlab/shared';

const BACKEND = `http://127.0.0.1:${PORTS.backend}`;

interface TechItem {
  id: string;
  label: string;
  latestVersion: string;
  latestReleaseDate: string;
  cycle: string;
  isEol: boolean;
  eolDate: string | null;
  lts: boolean;
  url: string;
}

interface RadarData {
  items: TechItem[];
  fetchedAt: number;
}

export function DocsTechRadar() {
  const [data, setData] = useState<RadarData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`${BACKEND}/docs/live`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d?.ok) setData({ items: d.items ?? [], fetchedAt: d.fetchedAt ?? 0 });
      })
      .catch(() => {
        /* backend offline: the radar simply stays hidden */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const r = await fetch(`${BACKEND}/docs/live/refresh`, { method: 'POST' });
      const d = await r.json();
      if (d?.ok) setData({ items: d.items ?? [], fetchedAt: d.fetchedAt ?? 0 });
    } catch {
      /* keep whatever we had */
    } finally {
      setRefreshing(false);
    }
  };

  if (!data || data.items.length === 0) return null;

  const checked = data.fetchedAt
    ? new Date(data.fetchedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  return (
    <section className="docs-live-updates" aria-label="Live technology versions">
      <div className="docs-live-heading">
        <div>
          <span className="docs-live-eyebrow">Live tech radar</span>
          <h2>Current versions of what these docs teach</h2>
        </div>
        <div className="docs-radar-actions">
          {checked && <span className="docs-live-time">Checked {checked}</span>}
          <button className="docs-radar-refresh" onClick={refresh} disabled={refreshing}>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>
      <p>
        Version and end-of-life data pulled from endoflife.date, refreshed daily. Each item links to
        the full release timeline.
      </p>
      <div className="docs-radar-grid">
        {data.items.map((t) => (
          <a className="docs-live-item docs-radar-item" href={t.url} key={t.id} target="_blank" rel="noreferrer">
            <strong>{t.label}</strong>
            <span>
              v{t.latestVersion}
              {t.lts ? ' · LTS' : ''}
              {t.isEol ? ' · EOL' : ''}
            </span>
            {t.latestReleaseDate && <span className="docs-radar-date">released {t.latestReleaseDate}</span>}
          </a>
        ))}
      </div>
    </section>
  );
}
