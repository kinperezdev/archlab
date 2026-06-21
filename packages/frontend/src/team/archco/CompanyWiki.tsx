/**
 * Company Wiki wall (Floor 5, Executive Suite).
 *
 * Institutional memory: every Team Review decision is appended to
 * `brain/archco-wiki.json` via the backend. Alex (CTO) references this before
 * every review. Entries are searchable by project, employee, or topic.
 */

import { useEffect, useMemo, useState } from 'react';
import { PORTS } from '@archlab/shared';
import { employeeById } from './companyData.js';

export interface WikiEntry {
  id: string;
  projectName: string;
  decision: string;
  madeBy: string[];
  rationale: string;
  outcome?: string;
  tags: string[];
  createdAt: number;
}

const WIKI_ENDPOINT = `http://127.0.0.1:${PORTS.backend}/brain/archco-wiki`;

export function CompanyWiki() {
  const [entries, setEntries] = useState<WikiEntry[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(WIKI_ENDPOINT);
        const data = res.ok ? ((await res.json()) as WikiEntry[]) : [];
        if (!cancelled) setEntries(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setEntries([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) =>
      [e.projectName, e.decision, e.rationale, e.outcome ?? '', ...e.tags]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [entries, query]);

  return (
    <div className="archco-wiki">
      <div className="archco-wiki-header">
        <h3>Company Wiki</h3>
        <span className="archco-wiki-bubble">Alex: “Checking the wiki first...”</span>
      </div>
      <input
        className="archco-wiki-search"
        placeholder="Search by project, decision, or topic..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {loading ? (
        <p className="archco-muted">Loading institutional memory...</p>
      ) : filtered.length === 0 ? (
        <p className="archco-muted">
          No wiki entries yet. They accrue with every Team Review session.
        </p>
      ) : (
        <ul className="archco-wiki-list">
          {filtered.map((e) => (
            <li key={e.id} className="archco-wiki-entry">
              <div className="archco-wiki-entry-head">
                <strong>{e.projectName}</strong>
                <span className="archco-wiki-date">
                  {new Date(e.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="archco-wiki-decision">{e.decision}</p>
              <p className="archco-wiki-rationale">{e.rationale}</p>
              {e.outcome && <p className="archco-wiki-outcome">Outcome: {e.outcome}</p>}
              <div className="archco-wiki-meta">
                {e.madeBy
                  .map((id) => employeeById(id)?.name ?? id)
                  .map((n) => (
                    <span key={n} className="archco-pill">
                      {n}
                    </span>
                  ))}
                {e.tags.map((t) => (
                  <span key={t} className="archco-pill archco-pill-tag">
                    #{t}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
