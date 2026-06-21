/** Top bar: wordmark, project context, breadcrumb, and compact utility cluster. */

import { Bell, FolderOpen } from 'lucide-react';
import type { ArchTab } from '../App.js';
import PlugConnectedIcon from './ui/plug-connected-icon.js';

interface TopBarProps {
  connected: boolean;
  projectName: string;
  hasProject: boolean;
  tab: ArchTab;
  findingsCount: number;
  hasApiKey: boolean;
  onOpenKeys: () => void;
  /** Open the native folder picker to set the project (canvas + terminal). */
  onChooseFolder: () => void;
}

/** Breadcrumb metadata per tab: which section it lives in and its display name. */
const TAB_META: Record<ArchTab, { section: string; label: string }> = {
  all: { section: 'Canvas', label: 'Full Flow' },
  frontend: { section: 'Canvas', label: 'Frontend' },
  backend: { section: 'Canvas', label: 'Backend' },
  api: { section: 'Canvas', label: 'API' },
  security: { section: 'Canvas', label: 'Security' },
  database: { section: 'Workspace', label: 'Database' },
  systemdesign: { section: 'Workspace', label: 'System Design' },
  blueprint: { section: 'Workspace', label: 'Blueprint' },
  docs: { section: 'Workspace', label: 'Docs' },
  archco: { section: 'Tools', label: 'ArchCo' },
  agentteam: { section: 'Tools', label: 'Agent Team' },
};

export function TopBar({
  connected,
  projectName,
  hasProject,
  tab,
  findingsCount,
  hasApiKey,
  onOpenKeys,
  onChooseFolder,
}: TopBarProps) {
  const meta = TAB_META[tab];

  return (
    <header className="tb">
      {/* Left: folder picker + project context (brand lives in the sidebar) */}
      <div className="tb-left">
        <button className="tb-folder-btn" onClick={onChooseFolder} title="Choose a project folder (updates canvas + terminal)">
          <FolderOpen size={14} strokeWidth={1.75} aria-hidden="true" />
          <span>Open Folder</span>
        </button>
        {hasProject && (
          <>
            <span className="tb-divider" aria-hidden="true" />
            <span className="tb-project" title={projectName}>
              {projectName}
            </span>
          </>
        )}
      </div>

      {/* Center: breadcrumb for the active tab */}
      <div className="tb-breadcrumb">
        <span className="tb-crumb-section">{meta.section}</span>
        <span className="tb-crumb-slash">/</span>
        <span className="tb-crumb-current">{meta.label}</span>
      </div>

      {/* Right: connection, findings count, key status */}
      <div className="tb-right">
        <span
          className={`tb-conn ${connected ? 'on' : 'off'}`}
          title={connected ? 'Connected to backend' : 'Disconnected'}
          aria-label={connected ? 'Connected to backend' : 'Disconnected'}
          role="img"
        >
          <PlugConnectedIcon
            size={16}
            strokeWidth={1.75}
            color={connected ? 'var(--success)' : '#64748b'}
          />
        </span>
        <span
          className="tb-conn"
          title={findingsCount > 0 ? `${findingsCount} findings` : 'No findings'}
          aria-label={`${findingsCount} findings`}
          role="img"
        >
          <Bell size={15} strokeWidth={1.75} aria-hidden="true" />
          {findingsCount > 0 && <span className="tb-bell-badge">{findingsCount}</span>}
        </span>

        <span className="tb-divider" aria-hidden="true" />

        <button
          className="tb-key-status"
          onClick={onOpenKeys}
          title={
            hasApiKey
              ? 'API key configured'
              : `No API key configured${connected ? '' : ' · disconnected'}`
          }
          aria-label="API key status"
        >
          <span className={`tb-key-dot ${hasApiKey ? 'on' : 'off'}`} />
        </button>
      </div>
    </header>
  );
}
