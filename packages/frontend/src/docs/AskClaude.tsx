/**
 * Ask Claude modal for the Docs tab.
 *
 * A working, article-aware chat: the active article (title, summary, and section
 * headings) is preloaded as system context, and each question is answered by the
 * configured AI provider via the shared backend proxy. When no provider key is
 * configured it shows how to enable the feature instead of a dead input.
 */

import { useMemo, useRef, useState } from 'react';
import type { DocArticle as DocArticleType } from './docsTypes.js';
import {
  completeWithProvider,
  detectAvailableProvider,
  PROVIDER_LABEL,
  type ProviderKeys,
} from '../team/archco/multiProviderAI.js';

interface AskClaudeProps {
  article: DocArticleType;
  apiKeys: ProviderKeys;
  onClose: () => void;
}

interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
  /** Marks an assistant turn that was an error, for styling. */
  isError?: boolean;
}

/** Build the article-aware system prompt that grounds every answer. */
function buildSystemPrompt(article: DocArticleType): string {
  const headings = article.content.map((s) => s.heading).join('; ');
  return [
    `You are an expert engineering tutor specializing in ${article.title}.`,
    `The user is reading this article (category: ${article.category}, level: ${article.difficulty}).`,
    `Article summary: ${article.summary}`,
    headings ? `Sections covered: ${headings}.` : '',
    'Answer their questions about this topic clearly and concisely. Prefer concrete, practical guidance and short code or config examples when useful. Stay on the topic of the article.',
  ]
    .filter(Boolean)
    .join('\n');
}

export function AskClaude({ article, apiKeys, onClose }: AskClaudeProps) {
  const provider = useMemo(() => detectAvailableProvider(apiKeys), [apiKeys]);
  const systemPrompt = useMemo(() => buildSystemPrompt(article), [article]);

  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  const send = async () => {
    const question = input.trim();
    if (!question || pending || !provider.available) return;

    // Include a compact history so follow-ups keep context across turns.
    const history = turns
      .map((t) => `${t.role === 'user' ? 'User' : 'Assistant'}: ${t.text}`)
      .join('\n\n');
    const userPrompt = history ? `${history}\n\nUser: ${question}` : question;

    setTurns((prev) => [...prev, { role: 'user', text: question }]);
    setInput('');
    setPending(true);

    const result = await completeWithProvider(provider, systemPrompt, userPrompt, 700);
    setTurns((prev) => [
      ...prev,
      { role: 'assistant', text: result.text || 'No response.', isError: Boolean(result.error) },
    ]);
    setPending(false);
    // Scroll the thread to the newest message.
    requestAnimationFrame(() => {
      threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter inserts a newline.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  return (
    <div className="docs-ask-overlay" onClick={onClose}>
      <div className="docs-ask-modal" onClick={(e) => e.stopPropagation()}>
        <div className="docs-ask-head">
          <h3>Ask about “{article.title}”</h3>
          <button className="btn btn-sm" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {!provider.available ? (
          <p className="docs-ask-context">
            Add an API key in Settings to use Ask Claude. Once a provider key (Anthropic, OpenAI, or Gemini) is
            configured, you can ask questions about this article and get answers grounded in its content.
          </p>
        ) : (
          <>
            <p className="docs-ask-context">
              Context preloaded: {article.category} · {article.difficulty}. Answering with{' '}
              {PROVIDER_LABEL[provider.provider]}.
            </p>

            <div className="docs-ask-thread" ref={threadRef}>
              {turns.length === 0 && (
                <p className="docs-ask-empty">
                  Ask anything about {article.title}. For example: “How would I apply this to my current project?”
                </p>
              )}
              {turns.map((t, i) => (
                <div key={i} className={`docs-ask-turn docs-ask-${t.role}${t.isError ? ' docs-ask-error' : ''}`}>
                  <span className="docs-ask-role">{t.role === 'user' ? 'You' : PROVIDER_LABEL[provider.provider]}</span>
                  <p className="docs-ask-text">{t.text}</p>
                </div>
              ))}
              {pending && (
                <div className="docs-ask-turn docs-ask-assistant">
                  <span className="docs-ask-role">{PROVIDER_LABEL[provider.provider]}</span>
                  <p className="docs-ask-typing" aria-label="Thinking">
                    <span />
                    <span />
                    <span />
                  </p>
                </div>
              )}
            </div>

            <div className="docs-ask-actions">
              <textarea
                className="docs-ask-input"
                placeholder={`Ask about ${article.title}…`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={pending}
                rows={2}
              />
              <button className="btn btn-sm btn-primary" onClick={() => void send()} disabled={pending || !input.trim()}>
                {pending ? 'Thinking…' : 'Send'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
