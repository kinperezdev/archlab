/** Top bar: gradient logo, project context, animated tab bar, status badges. */

import { motion } from 'framer-motion';
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
  onOpenKeys: () => void;
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
];

const SPRING = { type: 'spring', stiffness: 400, damping: 30 } as const;

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
  onOpenKeys,
  onOpenAgentTeam,
  agentTeamActive,
  tab,
  onTabChange,
}: TopBarProps) {
  return (
    <header className="tb">
      {/* Left: logo + project context */}
      <div className="tb-left">
        <span className="tb-logo-mark" aria-hidden="true" />
        <span className="tb-logo-text">ArchLab</span>
        {projectName && (
          <>
            <span className="tb-slash">/</span>
            <span className="tb-project">{projectName}</span>
            {analyzedAt && (
              <>
                <span className="tb-dot" />
                <span className="tb-timestamp" title="Time of the last analysis">
                  {formatTime(analyzedAt)}
                </span>
              </>
            )}
          </>
        )}
      </div>

      {/* Center: animated tab bar */}
      <nav className="tb-tabs">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <motion.button
              key={t.id}
              className={`tb-tab ${active ? 'active' : ''}`}
              onClick={() => onTabChange(t.id)}
              whileTap={{ scale: 0.97 }}
            >
              {active && (
                <motion.span className="tb-tab-bg" layoutId="tb-tab-indicator" transition={SPRING} />
              )}
              <span className="tb-tab-content">
                <TabIcon tab={t.id} />
                <span>{t.label}</span>
              </span>
            </motion.button>
          );
        })}
      </nav>

      {/* Right: badges + actions */}
      <div className="tb-right">
        {hasProject && (
          <>
            <span className="tb-badge badge-error" title="Total findings">
              {findingsCount} findings
            </span>
            {bottleneckCount > 0 && (
              <span className="tb-badge badge-warning" title="Bottlenecks detected">
                {bottleneckCount} bottlenecks
              </span>
            )}
            {isolatedCount > 0 && (
              <span className="tb-badge badge-info" title="Nodes with no connections">
                {isolatedCount} isolated
              </span>
            )}
          </>
        )}
        <motion.button
          className={`tb-btn tb-btn-accent ${agentTeamActive ? 'active' : ''}`}
          onClick={onOpenAgentTeam}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          title="Open the Agent Team panel"
        >
          ⬡ Agent Team
        </motion.button>
        <motion.button
          className="tb-btn"
          onClick={onOpenBrain}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          title="Open global brain"
        >
          <span className={`tb-dot-status ${connected ? 'on' : 'off'}`} />
          Brain · {brainProjectCount}
        </motion.button>
        <motion.button
          className="tb-btn"
          onClick={onOpenShortcuts}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          title="Keyboard Shortcuts Guide"
        >
          ⌨ Shortcuts
        </motion.button>
        <motion.button
          className="tb-btn"
          onClick={onOpenKeys}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          title="Configure AI API Keys"
        >
          🔑 API Keys
        </motion.button>
      </div>
    </header>
  );
}
