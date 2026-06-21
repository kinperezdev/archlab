/**
 * Permanent left navigation — the command-center shell nav.
 *
 * Replaces the old collapsible legend/file-tree sidebar. It owns all primary
 * navigation (Canvas + Workspace tabs) plus the Tools and Settings actions
 * (Agent Team, ArchCo, Brain, Shortcuts, API Keys). Pure chrome: every click
 * delegates to the same handlers the app already wired up, so tab switching and
 * modal toggles behave exactly as before.
 */

import {
  Workflow,
  Monitor,
  Server,
  Network,
  Shield,
  Database,
  Boxes,
  LayoutTemplate,
  FileText,
  Users,
  Building2,
  Brain,
  Keyboard,
  KeyRound,
  type LucideIcon,
} from 'lucide-react';
import type { ArchTab } from '../App.js';

interface NavTabItem {
  id: ArchTab;
  label: string;
  Icon: LucideIcon;
}

interface NavGroup {
  label: string;
  items: NavTabItem[];
}

/** Tab-driven navigation, grouped to match the command-center layout. */
const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Canvas',
    items: [
      { id: 'all', label: 'Full Flow', Icon: Workflow },
      { id: 'frontend', label: 'Frontend', Icon: Monitor },
      { id: 'backend', label: 'Backend', Icon: Server },
      { id: 'api', label: 'API', Icon: Network },
      { id: 'security', label: 'Security', Icon: Shield },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { id: 'database', label: 'Database', Icon: Database },
      { id: 'systemdesign', label: 'System Design', Icon: Boxes },
      { id: 'blueprint', label: 'Blueprint', Icon: LayoutTemplate },
      { id: 'docs', label: 'Docs', Icon: FileText },
    ],
  },
];

interface SidebarProps {
  tab: ArchTab;
  onTabChange: (tab: ArchTab) => void;
  projectName: string;
  hasProject: boolean;
  analyzedAt: number | null;
  findingsCount: number;
  isolatedCount: number;
  onOpenAgentTeam: () => void;
  agentTeamActive: boolean;
  onOpenArchCo: () => void;
  archcoActive: boolean;
  onOpenBrain: () => void;
  onOpenShortcuts: () => void;
  onOpenKeys: () => void;
}

/** Compact local time stamp, e.g. "2:05 PM". */
function formatStamp(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function Sidebar({
  tab,
  onTabChange,
  projectName,
  hasProject,
  analyzedAt,
  findingsCount,
  isolatedCount,
  onOpenAgentTeam,
  agentTeamActive,
  onOpenArchCo,
  archcoActive,
  onOpenBrain,
  onOpenShortcuts,
  onOpenKeys,
}: SidebarProps) {
  return (
    <aside className="nav-sidebar">
      <div className="nav-header">
        <span className="nav-logo-mark" aria-hidden="true" />
        <div className="nav-logo-text">
          <span className="nav-logo-name">ArchLab</span>
          <span className="nav-logo-sub">Engineering Command Center</span>
        </div>
      </div>

      <nav className="nav-scroll" aria-label="Primary">
        {NAV_GROUPS.map((group) => (
          <div className="nav-group" key={group.label}>
            <div className="nav-group-label">{group.label}</div>
            {group.items.map(({ id, label, Icon }) => (
              <button
                key={id}
                className={`nav-item ${tab === id ? 'active' : ''}`}
                onClick={() => onTabChange(id)}
                aria-current={tab === id ? 'page' : undefined}
              >
                <Icon className="nav-item-icon" size={14} strokeWidth={1.5} aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        ))}

        <div className="nav-group">
          <div className="nav-group-label">Tools</div>
          <button
            className={`nav-item ${agentTeamActive ? 'active' : ''}`}
            onClick={onOpenAgentTeam}
          >
            <Users className="nav-item-icon" size={14} strokeWidth={1.5} aria-hidden="true" />
            <span>Agent Team</span>
          </button>
          <button className={`nav-item ${archcoActive ? 'active' : ''}`} onClick={onOpenArchCo}>
            <Building2 className="nav-item-icon" size={14} strokeWidth={1.5} aria-hidden="true" />
            <span>ArchCo</span>
          </button>
          <button className="nav-item" onClick={onOpenBrain}>
            <Brain className="nav-item-icon" size={14} strokeWidth={1.5} aria-hidden="true" />
            <span>Brain</span>
          </button>
        </div>

        <div className="nav-group">
          <div className="nav-group-label">Settings</div>
          <button className="nav-item" onClick={onOpenShortcuts}>
            <Keyboard className="nav-item-icon" size={14} strokeWidth={1.5} aria-hidden="true" />
            <span>Shortcuts</span>
          </button>
          <button className="nav-item" onClick={onOpenKeys}>
            <KeyRound className="nav-item-icon" size={14} strokeWidth={1.5} aria-hidden="true" />
            <span>API Keys</span>
          </button>
        </div>
      </nav>

      {hasProject && (
        <div className="nav-footer">
          <div className="nav-footer-stats">
            <span className="nav-stat" title="Diagnostics / architectural findings">
              ⚠ {findingsCount} findings
            </span>
            <span className="nav-stat" title="Nodes with no connections">
              ○ {isolatedCount} isolated
            </span>
          </div>
          <div className="nav-footer-meta">
            <span className="nav-footer-project" title={projectName}>
              {projectName}
            </span>
            {analyzedAt && <span className="nav-footer-time">{formatStamp(analyzedAt)}</span>}
          </div>
        </div>
      )}
    </aside>
  );
}
