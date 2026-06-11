/**
 * A small reusable button that copies a fully-formed AI prompt to the clipboard.
 * Used everywhere a finding, diagnostic, suggestion, or insight is shown so the
 * user can paste it straight into an AI tool and action it immediately.
 */

import { useState } from 'react';

interface CopyPromptButtonProps {
  /** Either the prompt string, or a function that builds it lazily on click. */
  prompt: string | (() => string);
  /** Optional compact mode for tight rows (icon-sized). */
  compact?: boolean;
  label?: string;
}

export function CopyPromptButton({ prompt, compact, label = 'Copy Prompt' }: CopyPromptButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = typeof prompt === 'function' ? prompt() : prompt;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked; nothing else to do */
    }
  };

  return (
    <button
      className={`copy-prompt-btn ${compact ? 'compact' : ''}`}
      onClick={handleCopy}
      title="Copy a paste-ready AI prompt for this item"
    >
      {copied ? '✓ Copied' : compact ? '⧉' : `⧉ ${label}`}
    </button>
  );
}
