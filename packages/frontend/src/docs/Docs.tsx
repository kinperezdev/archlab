/**
 * Docs tab — a standalone, fully offline engineering documentation resource.
 *
 * Layout: a 260px left sidebar (search trigger + collapsible categories) and a
 * centered reading column (max 860px). Only the selected article is rendered;
 * every other article exists as data only, satisfying the performance budget.
 * The article library itself is offline; live version data (tech radar) and
 * project enrichment load from the local backend and hide when unavailable.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import '../styles/docs.css';
import { DOC_ARTICLES, DOC_ARTICLE_COUNT } from './docsContent.js';
import { DOC_CATEGORY_ORDER, type DocArticle as DocArticleType, type DocCategory } from './docsTypes.js';
import { DocArticle } from './DocArticle.js';
import { DocsSearch, buildSearchIndex } from './DocsSearch.js';
import { AskClaude } from './AskClaude.js';
import { DocsTechRadar } from './DocsTechRadar.js';
import type { ProviderKeys } from '../team/archco/multiProviderAI.js';

interface DocsProps {
  hasApiKey?: boolean;
  /** Provider keys (Anthropic/OpenAI/Gemini) for the Ask Claude modal. */
  apiKeys?: ProviderKeys;
  /** Fresh, source-linked results from the project's background enrichment. */
  enrichment?: LiveDocumentationData | null;
}

interface LiveDocumentationData {
  outdatedPackages?: Array<{
    name: string;
    installedVersion: string;
    latestVersion: string;
    changelog?: string;
  }>;
  vulnerabilities?: Array<{
    id: string;
    package: string;
    severity: string;
    referenceUrl: string;
  }>;
  stackBestPractices?: Array<{ tool: string; tip: string; url: string }>;
  enrichedAt?: number;
}

export function Docs({ hasApiKey, apiKeys = {}, enrichment = null }: DocsProps) {
  const [selectedId, setSelectedId] = useState<string>(DOC_ARTICLES[0]?.id ?? '');
  const [searchOpen, setSearchOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<DocCategory>>(new Set());
  const [progress, setProgress] = useState(0);
  const [askArticle, setAskArticle] = useState<DocArticleType | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Built once; the article set is static.
  const searchIndex = useMemo(() => buildSearchIndex(DOC_ARTICLES), []);
  const byCategory = useMemo(() => groupByCategory(DOC_ARTICLES), []);
  const titleFor = useMemo(() => {
    const map = new Map(DOC_ARTICLES.map((a) => [a.id, a.title]));
    return (id: string) => map.get(id) ?? null;
  }, []);

  const selected = useMemo(
    () => DOC_ARTICLES.find((a) => a.id === selectedId) ?? DOC_ARTICLES[0],
    [selectedId],
  );

  // Cmd+K / Ctrl+K opens search from anywhere in the Docs tab.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Reading progress bar tracks scroll within the article column.
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setProgress(max > 0 ? (el.scrollTop / max) * 100 : 0);
  };

  const navigate = (id: string) => {
    setSelectedId(id);
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleCategory = (c: DocCategory) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  };

  return (
    <div className="docs-root">
      <aside className="docs-sidebar">
        <div className="docs-sidebar-head">
          <h2 className="docs-logo">Docs</h2>
          <span className="docs-count">{DOC_ARTICLE_COUNT} articles</span>
        </div>
        <button className="docs-search-trigger" onClick={() => setSearchOpen(true)}>
          <span>Search…</span>
          <kbd>⌘K</kbd>
        </button>
        <nav className="docs-nav" aria-label="Documentation">
          {DOC_CATEGORY_ORDER.map((category) => {
            const items = byCategory.get(category);
            if (!items || items.length === 0) return null;
            const isCollapsed = collapsed.has(category);
            return (
              <div key={category} className="docs-nav-group">
                <button className="docs-nav-cat" onClick={() => toggleCategory(category)}>
                  <span className={`docs-nav-caret${isCollapsed ? ' collapsed' : ''}`}>▾</span>
                  <span className="docs-nav-cat-label">{category}</span>
                  <span className="docs-nav-cat-count">{items.length}</span>
                </button>
                {!isCollapsed && (
                  <ul className="docs-nav-items">
                    {items.map((a) => (
                      <li key={a.id}>
                        <button
                          className={`docs-nav-item${a.id === selectedId ? ' active' : ''}`}
                          onClick={() => navigate(a.id)}
                        >
                          {a.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      <div className="docs-main" ref={scrollRef} onScroll={onScroll}>
        <div className="docs-progress" style={{ width: `${progress}%` }} />
        <div className="docs-column">
          <DocsTechRadar />
          <LiveDocumentationUpdates enrichment={enrichment} />
          {selected && (
            <DocArticle
              article={selected}
              titleFor={titleFor}
              onNavigate={navigate}
              hasApiKey={hasApiKey}
              onAskClaude={setAskArticle}
            />
          )}
        </div>
      </div>

      <DocsSearch index={searchIndex} open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={navigate} />

      {askArticle && (
        <AskClaude article={askArticle} apiKeys={apiKeys} onClose={() => setAskArticle(null)} />
      )}
    </div>
  );
}

/**
 * The article library remains curated and offline. This separate block makes
 * current project-specific research visible with a source link, rather than
 * silently folding unverified web text into an authored article.
 */
function LiveDocumentationUpdates({ enrichment }: { enrichment: LiveDocumentationData | null }) {
  const updates = enrichment?.outdatedPackages ?? [];
  const vulnerabilities = enrichment?.vulnerabilities ?? [];
  const practices = enrichment?.stackBestPractices ?? [];
  if (updates.length === 0 && vulnerabilities.length === 0 && practices.length === 0) return null;

  const timestamp = enrichment?.enrichedAt
    ? new Date(enrichment.enrichedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  return (
    <section className="docs-live-updates" aria-label="Live project documentation updates">
      <div className="docs-live-heading">
        <div>
          <span className="docs-live-eyebrow">Live project research</span>
          <h2>Updates from verified sources</h2>
        </div>
        {timestamp && <span className="docs-live-time">Checked {timestamp}</span>}
      </div>
      <p>
        These updates are discovered automatically when ArchLab analyzes your project. Each item links back to its source.
      </p>
      <div className="docs-live-list">
        {updates.slice(0, 4).map((item) => (
          <a
            className="docs-live-item"
            href={item.changelog || `https://www.npmjs.com/package/${encodeURIComponent(item.name)}`}
            key={`package-${item.name}`}
            target="_blank"
            rel="noreferrer"
          >
            <strong>{item.name}</strong>
            <span>Update {item.installedVersion} to {item.latestVersion}</span>
          </a>
        ))}
        {vulnerabilities.slice(0, 3).map((item) => (
          <a className="docs-live-item is-security" href={item.referenceUrl} key={item.id} target="_blank" rel="noreferrer">
            <strong>{item.package}: {item.id}</strong>
            <span>{item.severity} security advisory</span>
          </a>
        ))}
        {practices.slice(0, 3).map((item, index) => (
          <a className="docs-live-item" href={item.url} key={`practice-${index}`} target="_blank" rel="noreferrer">
            <strong>{item.tool} guidance</strong>
            <span>{item.tip}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function groupByCategory(articles: DocArticleType[]): Map<DocCategory, DocArticleType[]> {
  const map = new Map<DocCategory, DocArticleType[]>();
  for (const a of articles) {
    const list = map.get(a.category) ?? [];
    list.push(a);
    map.set(a.category, list);
  }
  return map;
}
