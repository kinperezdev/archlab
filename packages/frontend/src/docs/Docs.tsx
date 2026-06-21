/**
 * Docs tab — a standalone, fully offline engineering documentation resource.
 *
 * Layout: a 260px left sidebar (search trigger + collapsible categories) and a
 * centered reading column (max 860px). Only the selected article is rendered;
 * every other article exists as data only, satisfying the performance budget.
 * No network calls, no loading states.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import '../styles/docs.css';
import { DOC_ARTICLES, DOC_ARTICLE_COUNT } from './docsContent.js';
import { DOC_CATEGORY_ORDER, type DocArticle as DocArticleType, type DocCategory } from './docsTypes.js';
import { DocArticle } from './DocArticle.js';
import { DocsSearch, buildSearchIndex } from './DocsSearch.js';

interface DocsProps {
  hasApiKey?: boolean;
}

export function Docs({ hasApiKey }: DocsProps) {
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
        <div className="docs-ask-overlay" onClick={() => setAskArticle(null)}>
          <div className="docs-ask-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Ask Claude about “{askArticle.title}”</h3>
            <p className="docs-ask-context">
              Context preloaded: {askArticle.category} · {askArticle.difficulty}. {askArticle.summary}
            </p>
            <textarea
              className="docs-ask-input"
              placeholder={`e.g. "How would I apply ${askArticle.title} to my current project?"`}
              defaultValue={`About "${askArticle.title}": `}
            />
            <div className="docs-ask-actions">
              <button className="btn btn-sm" onClick={() => setAskArticle(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
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
