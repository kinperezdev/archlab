/**
 * Cmd+K / Ctrl+K search overlay for the Docs tab.
 *
 * The search index is built once from the articles passed in (the parent
 * memoizes it) and queried with a 150ms debounce. Results match against title,
 * summary, section headings, and body text, can be filtered by category and
 * difficulty, and are navigable with the arrow keys and Enter.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { DocArticle, DocCategory, DocDifficulty } from './docsTypes.js';
import { DOC_CATEGORY_ORDER, DIFFICULTY_ORDER } from './docsTypes.js';

interface SearchIndexEntry {
  article: DocArticle;
  haystack: string;
}

export function buildSearchIndex(articles: DocArticle[]): SearchIndexEntry[] {
  return articles.map((article) => ({
    article,
    haystack: [
      article.title,
      article.summary,
      ...article.content.map((s) => `${s.heading} ${s.body}`),
    ]
      .join(' ')
      .toLowerCase(),
  }));
}

interface SearchResult {
  article: DocArticle;
  excerpt: string;
}

interface DocsSearchProps {
  index: SearchIndexEntry[];
  open: boolean;
  onClose: () => void;
  onSelect: (articleId: string) => void;
}

const DEBOUNCE_MS = 150;

export function DocsSearch({ index, open, onClose, onSelect }: DocsSearchProps) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [category, setCategory] = useState<DocCategory | 'all'>('all');
  const [difficulty, setDifficulty] = useState<DocDifficulty | 'all'>('all');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setDebounced('');
      setActive(0);
      // Focus after the overlay mounts.
      const id = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query.trim().toLowerCase()), DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [query]);

  const results = useMemo<SearchResult[]>(() => {
    const filtered = index.filter(
      (e) =>
        (category === 'all' || e.article.category === category) &&
        (difficulty === 'all' || e.article.difficulty === difficulty),
    );
    if (!debounced) {
      return filtered.slice(0, 12).map((e) => ({ article: e.article, excerpt: e.article.summary }));
    }
    return filtered
      .filter((e) => e.haystack.includes(debounced))
      .slice(0, 20)
      .map((e) => ({ article: e.article, excerpt: makeExcerpt(e.haystack, debounced, e.article.summary) }));
  }, [index, debounced, category, difficulty]);

  useEffect(() => setActive(0), [debounced, category, difficulty]);

  if (!open) return null;

  const choose = (id: string) => {
    onSelect(id);
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault();
      choose(results[active].article.id);
    }
  };

  return (
    <div className="docs-search-overlay" onClick={onClose}>
      <div className="docs-search-modal" onClick={(e) => e.stopPropagation()} onKeyDown={onKeyDown}>
        <input
          ref={inputRef}
          className="docs-search-input"
          placeholder="Search the engineering docs…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="docs-search-filters">
          <select value={category} onChange={(e) => setCategory(e.target.value as DocCategory | 'all')}>
            <option value="all">All categories</option>
            {DOC_CATEGORY_ORDER.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as DocDifficulty | 'all')}>
            <option value="all">All levels</option>
            {DIFFICULTY_ORDER.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <ul className="docs-search-results">
          {results.length === 0 && <li className="docs-search-empty">No matching articles.</li>}
          {results.map((r, i) => (
            <li key={r.article.id}>
              <button
                className={`docs-search-result${i === active ? ' active' : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(r.article.id)}
              >
                <div className="docs-search-result-top">
                  <span className="docs-search-result-title">{r.article.title}</span>
                  <span className="docs-search-result-badges">
                    <span className="doc-badge-mini">{r.article.category}</span>
                    <span className={`doc-badge-mini diff-${r.article.difficulty.toLowerCase()}`}>
                      {r.article.difficulty}
                    </span>
                  </span>
                </div>
                <span className="docs-search-result-excerpt">{r.excerpt}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="docs-search-hint">↑↓ navigate · ↵ open · esc close</div>
      </div>
    </div>
  );
}

/** Build a short excerpt centered on the first match of the query. */
function makeExcerpt(haystack: string, query: string, fallback: string): string {
  const idx = haystack.indexOf(query);
  if (idx === -1) return fallback;
  const start = Math.max(0, idx - 40);
  const end = Math.min(haystack.length, idx + query.length + 80);
  return `${start > 0 ? '…' : ''}${haystack.slice(start, end)}${end < haystack.length ? '…' : ''}`;
}
