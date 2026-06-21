/**
 * Permanent left navigation — the command-center shell nav.
 *
 * Replaces the old collapsible legend/file-tree sidebar. It owns all primary
 * navigation (Canvas + Workspace tabs) plus the Tools and Settings actions
 * (Agent Team, ArchCo, Brain, Shortcuts, API Keys). Pure chrome: every click
 * delegates to the same handlers the app already wired up, so tab switching and
 * modal toggles behave exactly as before.
 *
 * Icons are animated (itshover.com). Each one exposes an imperative
 * start/stop handle; the whole nav row drives it on hover so the glyph animates
 * even when the cursor is over the label rather than the icon itself.
 */

import { forwardRef, useRef, type ForwardRefExoticComponent, type RefAttributes } from 'react';
import type { ArchTab } from '../App.js';
import type { AnimatedIconHandle, AnimatedIconProps } from './ui/types.js';
import LayoutDashboardIcon from './ui/layout-dashboard-icon.js';
import CodeXmlIcon from './ui/code-xml-icon.js';
import CpuIcon from './ui/cpu-icon.js';
import RouterIcon from './ui/router-icon.js';
import ShieldCheck from './ui/shield-check.js';
import Stack3Icon from './ui/stack-3-icon.js';
import LayersIcon from './ui/layers-icon.js';
import PenIcon from './ui/pen-icon.js';
import BookIcon from './ui/book-icon.js';
import UsersIcon from './ui/users-icon.js';
import HotelIcon from './ui/hotel-icon.js';
import BrainCircuitIcon from './ui/brain-circuit-icon.js';
import DialpadIcon from './ui/dialpad-icon.js';
import LockIcon from './ui/lock-icon.js';

type AnimatedIcon = ForwardRefExoticComponent<
  AnimatedIconProps & RefAttributes<AnimatedIconHandle>
>;

interface NavTabItem {
  id: ArchTab;
  label: string;
  Icon: AnimatedIcon;
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
      { id: 'all', label: 'Full Flow', Icon: LayoutDashboardIcon },
      { id: 'frontend', label: 'Frontend', Icon: CodeXmlIcon },
      { id: 'backend', label: 'Backend', Icon: CpuIcon },
      { id: 'api', label: 'API', Icon: RouterIcon },
      { id: 'security', label: 'Security', Icon: ShieldCheck },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { id: 'database', label: 'Database', Icon: Stack3Icon },
      { id: 'systemdesign', label: 'System Design', Icon: LayersIcon },
      { id: 'blueprint', label: 'Blueprint', Icon: PenIcon },
      { id: 'docs', label: 'Docs', Icon: BookIcon },
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

/** A nav row whose hover drives the animated icon's start/stop handle. */
const NavItem = forwardRef<
  HTMLButtonElement,
  { Icon: AnimatedIcon; label: string; active?: boolean; onClick: () => void }
>(function NavItem({ Icon, label, active, onClick }, _ref) {
  const iconRef = useRef<AnimatedIconHandle>(null);
  return (
    <button
      className={`nav-item ${active ? 'active' : ''}`}
      onClick={onClick}
      onMouseEnter={() => iconRef.current?.startAnimation()}
      onMouseLeave={() => iconRef.current?.stopAnimation()}
      aria-current={active ? 'page' : undefined}
    >
      <Icon ref={iconRef} className="nav-item-icon" size={16} strokeWidth={1.6} />
      <span>{label}</span>
    </button>
  );
});

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
              <NavItem
                key={id}
                Icon={Icon}
                label={label}
                active={tab === id}
                onClick={() => onTabChange(id)}
              />
            ))}
          </div>
        ))}

        <div className="nav-group">
          <div className="nav-group-label">Tools</div>
          <NavItem Icon={UsersIcon} label="Agent Team" active={agentTeamActive} onClick={onOpenAgentTeam} />
          <NavItem Icon={HotelIcon} label="ArchCo" active={archcoActive} onClick={onOpenArchCo} />
          <NavItem Icon={BrainCircuitIcon} label="Brain" onClick={onOpenBrain} />
        </div>

        <div className="nav-group">
          <div className="nav-group-label">Settings</div>
          <NavItem Icon={DialpadIcon} label="Shortcuts" onClick={onOpenShortcuts} />
          <NavItem Icon={LockIcon} label="API Keys" onClick={onOpenKeys} />
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
