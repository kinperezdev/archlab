/**
 * Renders one {@link DocArticle} as a long-form reading surface.
 *
 * Layout order mirrors how a strong engineering article reads: header and
 * "why it matters", prose sections, diagrams, code, real-world examples, the
 * honest warnings (mistakes / when-not-to-use), interview tips, and related
 * topics. Nothing here fetches; the optional "Ask Claude" affordance only
 * appears when a key is configured and simply surfaces article context.
 */

import { useMemo, useState } from 'react';
import hljs from 'highlight.js/lib/common';
import 'highlight.js/styles/github-dark.css';
import type { CodeExample, CodeLanguage, DocArticle as DocArticleType, DocDifficulty } from './docsTypes.js';
import { DocDiagram } from './DocDiagram.js';

const DIFFICULTY_CLASS: Record<DocDifficulty, string> = {
  Beginner: 'beginner',
  Intermediate: 'intermediate',
  Senior: 'senior',
  Principal: 'principal',
};

interface DocArticleProps {
  article: DocArticleType;
  /** Look up a related article title by id for the related-topics pills. */
  titleFor: (id: string) => string | null;
  onNavigate: (articleId: string) => void;
  hasApiKey?: boolean;
  onAskClaude?: (article: DocArticleType) => void;
}

export function DocArticle({ article, titleFor, onNavigate, onAskClaude }: DocArticleProps) {
  return (
    <article className="doc-article">
      <header className="doc-article-head">
        <nav className="doc-breadcrumb" aria-label="Breadcrumb">
          <span>{article.category}</span>
        </nav>
        <h1 className="doc-article-title">{article.title}</h1>
        <div className="doc-article-meta">
          <span className={`doc-badge diff-${DIFFICULTY_CLASS[article.difficulty]}`}>
            {article.difficulty}
          </span>
          <span className="doc-readtime">{article.readTime} min read</span>
          <span className="doc-standard-pill" title="Industry standard">
            {article.industryStandard}
          </span>
        </div>
        <p className="doc-summary">{article.summary}</p>
        {/* Always shown: the modal itself handles the no-API-key case so users
            discover the feature and learn how to enable it. */}
        {onAskClaude && (
          <button className="doc-ask-claude" onClick={() => onAskClaude(article)}>
            ✦ Ask Claude about this
          </button>
        )}
      </header>

      <section className="doc-why">
        <span className="doc-why-label">Why it matters</span>
        <p>{article.whyItMatters}</p>
      </section>

      {article.content.map((section, i) => (
        <section key={i} className="doc-section">
          <h2 className="doc-section-heading">{section.heading}</h2>
          <p className="doc-section-body">{section.body}</p>
        </section>
      ))}

      {article.diagrams.length > 0 && (
        <section className="doc-diagrams">
          {article.diagrams.map((d, i) => (
            <DocDiagram key={i} diagram={d} />
          ))}
        </section>
      )}

      {article.codeExamples.length > 0 && (
        <section className="doc-code-block-group">
          <h2 className="doc-section-heading">Code examples</h2>
          {article.codeExamples.map((ex, i) => (
            <CodeBlock key={i} example={ex} />
          ))}
        </section>
      )}

      {article.realWorldExamples.length > 0 && (
        <section className="doc-rwe-group">
          <h2 className="doc-section-heading">Real-world examples</h2>
          {article.realWorldExamples.map((rwe, i) => (
            <div key={i} className="doc-rwe-card">
              <div className="doc-rwe-head">
                <span className="doc-rwe-avatar">{rwe.company.charAt(0)}</span>
                <span className="doc-rwe-company">{rwe.company}</span>
              </div>
              <p><strong>Problem.</strong> {rwe.problem}</p>
              <p><strong>Solution.</strong> {rwe.solution}</p>
              <p><strong>Outcome.</strong> {rwe.outcome}</p>
            </div>
          ))}
        </section>
      )}

      {article.commonMistakes.length > 0 && (
        <section className="doc-warn-card amber">
          <h3>⚠ Common mistakes</h3>
          <ul>
            {article.commonMistakes.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="doc-warn-card red">
        <h3>⛔ When not to use this</h3>
        <p>{article.whenNotToUse}</p>
      </section>

      <section className="doc-interview-card">
        <h3>🎓 Interview tips</h3>
        <p>{article.interviewTips}</p>
      </section>

      {article.relatedTopics.length > 0 && (
        <section className="doc-related">
          <h3>Related topics</h3>
          <div className="doc-related-pills">
            {article.relatedTopics.map((id) => {
              const title = titleFor(id);
              if (!title) return null;
              return (
                <button key={id} className="doc-related-pill" onClick={() => onNavigate(id)}>
                  {title}
                </button>
              );
            })}
          </div>
        </section>
      )}
    </article>
  );
}

/** highlight.js language id per DocArticle CodeLanguage (all in the common bundle). */
const HLJS_LANGUAGE: Record<CodeLanguage, string> = {
  typescript: 'typescript',
  python: 'python',
  go: 'go',
  java: 'java',
  rust: 'rust',
  kotlin: 'kotlin',
  swift: 'swift',
};

/** Code block with real syntax highlighting (highlight.js, github-dark theme). */
function CodeBlock({ example }: { example: CodeExample }) {
  const [copied, setCopied] = useState(false);

  // Highlight once per example. Falls back to plain (escaped) text if the
  // language is unknown or highlighting throws, so a block never renders raw.
  const highlighted = useMemo(() => {
    const language = HLJS_LANGUAGE[example.language];
    try {
      if (language && hljs.getLanguage(language)) {
        return hljs.highlight(example.code, { language }).value;
      }
      return hljs.highlightAuto(example.code).value;
    } catch {
      return escapeHtml(example.code);
    }
  }, [example.code, example.language]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(example.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable; ignore */
    }
  };

  return (
    <div className="doc-code">
      <div className="doc-code-head">
        <div className="doc-code-labels">
          <span className="doc-code-lang">{example.language}</span>
          <span className="doc-code-title">{example.label}</span>
        </div>
        <button className="doc-code-copy" onClick={copy}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="doc-code-desc">{example.description}</p>
      <pre className="doc-code-pre">
        <code className="hljs" dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
}

/** Escape HTML for the plain-text fallback path (never inject raw user code). */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
