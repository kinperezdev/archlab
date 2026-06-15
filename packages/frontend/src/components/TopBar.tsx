/** Top bar: logo, project path input, filter tabs, findings + brain status. */

import type { ArchTab } from '../App.js';
import { TabIcon } from './TabIcon.js';

interface TopBarProps {
  connected: boolean;
  projectName: string | null;
  hasProject: boolean;
  brainProjectCount: number;
  findingsCount: number;
  bottleneckCount: number;
  isolatedCount: number;
  analyzedAt: number | null;
  onOpenBrain: () => void;
  onOpenShortcuts: () => void;
  onOpenAgentTeam: () => void;
  agentTeamActive: boolean;
  tab: ArchTab;
  onTabChange: (tab: ArchTab) => void;
}

const TABS: { id: ArchTab; label: string }[] = [
  { id: 'all', label: 'Full Flow' },
  { id: 'frontend', label: 'Frontend' },
  { id: 'backend', label: 'Backend' },
  { id: 'database', label: 'Database' },
  { id: 'api', label: 'API' },
  { id: 'security', label: 'Security' },
  { id: 'systemdesign', label: 'System Design' },
  { id: 'scratch', label: 'Scratch' },
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
  isolatedCount,
  analyzedAt,
  onOpenBrain,
  onOpenShortcuts,
  onOpenAgentTeam,
  agentTeamActive,
  tab,
  onTabChange,
}: TopBarProps) {
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
            <TabIcon tab={t.id} />
            <span>{t.label}</span>
          </button>
        ))}
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
            <span
              className={`count-badge isolated ${isolatedCount > 0 ? 'active' : ''}`}
              title="Nodes with no connections to the rest of the project"
            >
              ⚠ {isolatedCount} isolated {isolatedCount === 1 ? 'node' : 'nodes'}
            </span>
          </div>
        )}
        <button
          className={`shortcuts-btn ${agentTeamActive ? 'active' : ''}`}
          onClick={onOpenAgentTeam}
          title="Open the Agent Team panel"
        >
          ⬡ Agent Team
        </button>
        <button className="shortcuts-btn" onClick={onOpenShortcuts} title="Keyboard Shortcuts Guide">
          ⌨ Shortcuts
        </button>
        <button className="brain-status" onClick={onOpenBrain} title="Open global brain">
          <span className={`dot ${connected ? 'dot-on' : 'dot-off'}`} />
          Brain · {brainProjectCount} projects
        </button>
      </div>
    </header>
  );
}
