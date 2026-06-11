/** Top bar: project name, folder path input + Analyze, Run Checks, brain status. */

import { useState } from 'react';
import type { ArchTab } from '../App.js';

interface TopBarProps {
  connected: boolean;
  projectName: string | null;
  hasProject: boolean;
  brainProjectCount: number;
  findingsCount: number;
  bottleneckCount: number;
  analyzedAt: number | null;
  reanalyzing: boolean;
  onAnalyze: (path: string) => void;
  onReanalyze: () => void;
  onRunChecks: () => void;
  onOpenBrain: () => void;
  tab: ArchTab;
  onTabChange: (tab: ArchTab) => void;
}

const TABS: { id: ArchTab; label: string }[] = [
  { id: 'all', label: 'Full Flow' },
  { id: 'frontend', label: 'Frontend' },
  { id: 'backend', label: 'Backend' },
  { id: 'ideas', label: 'Ideas' },
  { id: 'database', label: 'Database' },
];

/** Compact local time stamp, e.g. "14:05:32". */
function formatTime(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function TopBar({
  connected,
  projectName,
  hasProject,
  brainProjectCount,
  findingsCount,
  bottleneckCount,
  analyzedAt,
  reanalyzing,
  onAnalyze,
  onReanalyze,
  onRunChecks,
  onOpenBrain,
  tab,
  onTabChange,
}: TopBarProps) {
  const [path, setPath] = useState('');

  return (
    <header className="top-bar">
      <div className="top-bar-brand">
        <span className="brand-mark">▟▙</span>
        <span className="brand-name">ArchLab</span>
        {projectName && <span className="brand-project">/ {projectName}</span>}
        {projectName && analyzedAt && (
          <span className="brand-timestamp" title="Time of the last analysis">
            analyzed {formatTime(analyzedAt)}
          </span>
        )}
      </div>

      <div className="canvas-filter-tabs-topbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`canvas-filter-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => onTabChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="top-bar-actions">
        <input
          className="path-input"
          placeholder="/absolute/path/to/project"
          value={path}
          spellCheck={false}
          onChange={(e) => setPath(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && path.trim()) onAnalyze(path.trim());
          }}
        />
        <button className="btn" disabled={!path.trim() || !connected} onClick={() => onAnalyze(path.trim())}>
          Analyze
        </button>
        <button
          className="btn"
          disabled={!hasProject || !connected || reanalyzing}
          onClick={onReanalyze}
          title="Force a fresh full scan of the current project"
        >
          {reanalyzing ? (
            <>
              <span className="btn-spinner" aria-hidden="true" /> Re-analyzing…
            </>
          ) : (
            'Re-analyze'
          )}
        </button>
        <button className="btn btn-primary" disabled={!hasProject || !connected} onClick={onRunChecks}>
          Run Checks
        </button>
      </div>

      <div className="top-bar-status">
        {hasProject && (
          <div className="count-badges">
            <span className="count-badge findings" title="Total findings">
              {findingsCount} findings
            </span>
            <span
              className={`count-badge bottlenecks ${bottleneckCount > 0 ? 'active' : ''}`}
              title="Bottlenecks detected"
            >
              ⚠ {bottleneckCount} bottlenecks
            </span>
          </div>
        )}
        <button className="brain-status" onClick={onOpenBrain} title="Open global brain">
          <span className={`dot ${connected ? 'dot-on' : 'dot-off'}`} />
          Brain · {brainProjectCount} projects
        </button>
      </div>
    </header>
  );
}
