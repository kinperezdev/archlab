/**
 * Smart contextual empty state for the canvas.
 *
 * Instead of a blank canvas, this explains what is missing for the current tab
 * (no backend, no database, no auth, …) using the analyzer's detected
 * `missingInfraPatterns`, and offers a ready-to-use, project-specific
 * implementation prompt. Falls back to an "open a folder" prompt with no
 * project, and a positive "no issues" state for an empty Security tab.
 */

import { useState } from 'react';
import {
  Server,
  Database,
  ShieldAlert,
  Network,
  FlaskConical,
  Settings,
  LayoutTemplate,
  ShieldCheck,
  FolderOpen,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { MissingInfraPattern, MissingInfraType } from '@archlab/shared';

type CanvasFilter = 'all' | 'frontend' | 'backend' | 'api' | 'security';

interface SmartEmptyStateProps {
  tab: CanvasFilter;
  missingPatterns: MissingInfraPattern[];
  projectName: string | null;
  techStack: string[];
  hasProject: boolean;
  /** Optional: send the generated prompt to the active terminal. */
  onRunPrompt?: (prompt: string) => void;
}

const ICON_FOR: Record<MissingInfraType, LucideIcon> = {
  'no-backend': Server,
  'backend-only': Server,
  'no-frontend': LayoutTemplate,
  'frontend-only': LayoutTemplate,
  'no-database': Database,
  'no-auth': ShieldAlert,
  'no-api': Network,
  'no-tests': FlaskConical,
  'no-config': Settings,
};

/** Which missing-infra type is most relevant to each canvas tab. */
function patternForTab(tab: CanvasFilter, patterns: MissingInfraPattern[]): MissingInfraPattern | null {
  const pick = (...types: MissingInfraType[]) =>
    patterns.find((p) => types.includes(p.type)) ?? null;
  switch (tab) {
    case 'backend':
      return pick('no-backend', 'frontend-only');
    case 'frontend':
      return pick('no-frontend', 'backend-only');
    case 'api':
      return pick('no-api', 'no-backend');
    case 'all': {
      // Most severe pattern first.
      const order = { critical: 0, warning: 1, info: 2 } as const;
      return [...patterns].sort((a, b) => order[a.severity] - order[b.severity])[0] ?? null;
    }
    default:
      return null;
  }
}

/** Two or three concrete things adding this capability would enable. */
function enablesFor(type: MissingInfraType): string[] {
  switch (type) {
    case 'no-backend':
    case 'frontend-only':
      return ['Persist data beyond the browser', 'Keep secrets and API keys off the client', 'Authenticate users and gate access'];
    case 'no-frontend':
    case 'backend-only':
      return ['Give users a real interface', 'Consume your existing API', 'Ship a product, not just a service'];
    case 'no-database':
      return ['Store and query application data durably', 'Run transactions and migrations safely', 'Back data up and restore it'];
    case 'no-auth':
      return ['Stop unauthenticated access to your endpoints', 'Identify users and enforce permissions', 'Pass a basic security review'];
    case 'no-api':
      return ['Load and save dynamic data', 'Integrate third-party services securely', 'Move logic off the client'];
    case 'no-tests':
      return ['Change code without fear of regressions', 'Catch bugs before users do', 'Ship with confidence in CI'];
    case 'no-config':
      return ['Keep secrets out of source control', 'Behave correctly per environment', 'Fail fast on missing configuration'];
  }
}

export function SmartEmptyState({
  tab,
  missingPatterns,
  projectName,
  techStack,
  hasProject,
  onRunPrompt,
}: SmartEmptyStateProps) {
  const [modalPrompt, setModalPrompt] = useState<string | null>(null);

  // 1. No project loaded.
  if (!hasProject) {
    return (
      <div className="empty-state empty-state-welcome">
        <div className="empty-logo-pulse" aria-hidden="true">◑</div>
        <h2 className="empty-title">Open a project folder to get started</h2>
        <p className="empty-subtitle">cd into any project folder in the terminal below</p>
        <code className="empty-code">cd ~/your-project</code>
      </div>
    );
  }

  // 2. Security tab with nothing flagged is a good outcome.
  if (tab === 'security') {
    return (
      <div className="empty-state">
        <div className="empty-icon empty-icon-good">
          <ShieldCheck size={40} strokeWidth={1.5} />
        </div>
        <h2 className="empty-title">No security issues detected</h2>
        <p className="empty-subtitle">
          Nothing was flagged on the security pipeline for this project. Run the Agent Team for a deeper, AI-backed review.
        </p>
      </div>
    );
  }

  const pattern = patternForTab(tab, missingPatterns);

  // 3. A relevant missing-infra pattern for this tab.
  if (pattern) {
    const Icon = ICON_FOR[pattern.type] ?? Server;
    return (
      <>
        <div className="empty-state">
          <div className={`empty-icon empty-icon-${pattern.severity}`}>
            <Icon size={40} strokeWidth={1.5} />
          </div>
          <h2 className="empty-title">{pattern.title}</h2>
          <p className="empty-subtitle">{pattern.description}</p>

          <div className="empty-stack-badges">
            <span className="empty-stack-pill">Detected: {pattern.detectedStack}</span>
          </div>

          <div className="empty-enables">
            <span className="empty-enables-label">What adding this enables</span>
            <ul>
              {enablesFor(pattern.type).map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>

          <button className="empty-generate-btn" onClick={() => setModalPrompt(pattern.generatedPrompt)}>
            Generate Implementation Prompt
          </button>
        </div>

        {modalPrompt && (
          <PromptModal prompt={modalPrompt} onClose={() => setModalPrompt(null)} onRunPrompt={onRunPrompt} />
        )}
      </>
    );
  }

  // 4. Project loaded but nothing matched this view.
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <FolderOpen size={40} strokeWidth={1.5} />
      </div>
      <h2 className="empty-title">Nothing to show in this view</h2>
      <p className="empty-subtitle">
        {projectName ? `"${projectName}"` : 'This project'}
        {techStack.length > 0 ? ` (${techStack.join(', ')})` : ''} has no nodes for the{' '}
        <strong>{tab}</strong> tab. Try the Full Flow tab or re-analyze the project.
      </p>
    </div>
  );
}

/** Modal showing the full generated prompt with copy + optional run-in-terminal. */
function PromptModal({
  prompt,
  onClose,
  onRunPrompt,
}: {
  prompt: string;
  onClose: () => void;
  onRunPrompt?: (prompt: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked; the prompt text is still selectable below */
    }
  };
  return (
    <div className="empty-modal-overlay" onClick={onClose}>
      <div className="empty-modal" onClick={(e) => e.stopPropagation()}>
        <div className="empty-modal-head">
          <h3>Implementation prompt</h3>
          <button className="empty-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <p className="empty-modal-sub">Tailored to your detected stack. Paste it into your AI coding agent.</p>
        <textarea className="empty-modal-text" readOnly value={prompt} rows={16} />
        <div className="empty-modal-actions">
          {onRunPrompt && (
            <button className="empty-modal-btn" onClick={() => onRunPrompt(prompt)}>
              Run in Terminal
            </button>
          )}
          <button className="empty-modal-btn primary" onClick={copy}>
            {copied ? 'Copied ✓' : 'Copy Prompt'}
          </button>
        </div>
      </div>
    </div>
  );
}
