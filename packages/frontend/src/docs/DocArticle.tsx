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
import type { CodeExample, DocArticle as DocArticleType, DocDifficulty } from './docsTypes.js';
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

export function DocArticle({ article, titleFor, onNavigate, hasApiKey, onAskClaude }: DocArticleProps) {
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
        {hasApiKey && onAskClaude && (
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

/** Code block with VS Code dark styling, language label, copy button, and line numbers. */
function CodeBlock({ example }: { example: CodeExample }) {
  const [copied, setCopied] = useState(false);
  const lines = useMemo(() => example.code.split('\n'), [example.code]);

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
        <code>
          {lines.map((line, i) => (
            <span key={i} className="doc-code-line">
              <span className="doc-code-ln">{i + 1}</span>
              <span className="doc-code-text">{line || ' '}</span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
