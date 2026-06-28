/** Top bar: wordmark, project context, breadcrumb, and compact utility cluster. */

import { Bell, FolderOpen, Globe, RefreshCw, Stethoscope } from 'lucide-react';
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
  onOpenDoctor: () => void;
  onOpenFindings: () => void;
  /** Open the native folder picker to set the project (canvas + terminal). */
  onChooseFolder: () => void;
  choosingFolder?: boolean;
  enrichment?: any | null;
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
  onOpenDoctor,
  onOpenFindings,
  onChooseFolder,
  choosingFolder = false,
  enrichment,
}: TopBarProps) {
  const meta = TAB_META[tab];
  const enrichmentStatus = enrichment?.status ?? (enrichment ? 'ready' : 'idle');
  const enrichmentCount =
    (enrichment?.outdatedPackages?.length ?? 0) + (enrichment?.vulnerabilities?.length ?? 0);
  const hasVulnerabilities = (enrichment?.vulnerabilities?.length ?? 0) > 0;

  return (
    <header className="tb">
      {/* Left: folder picker + project context (brand lives in the sidebar) */}
      <div className="tb-left">
        <button
          className="tb-folder-btn"
          onClick={onChooseFolder}
          disabled={choosingFolder}
          title="Choose a project folder (updates canvas + terminal)"
        >
          {choosingFolder ? (
            <RefreshCw size={14} strokeWidth={1.75} aria-hidden="true" className="tb-folder-spin" />
          ) : (
            <FolderOpen size={14} strokeWidth={1.75} aria-hidden="true" />
          )}
          <span>{choosingFolder ? 'Opening...' : 'Open Folder'}</span>
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
        <button
          className="tb-conn"
          type="button"
          onClick={onOpenFindings}
          title={findingsCount > 0 ? `${findingsCount} findings` : 'No findings'}
          aria-label={`${findingsCount} findings`}
        >
          <Bell size={15} strokeWidth={1.75} aria-hidden="true" />
          {findingsCount > 0 && <span className="tb-bell-badge">{findingsCount}</span>}
        </button>

        {/* Live Data Enrichment Status */}
        {hasProject && enrichmentStatus === 'checking' && (
          <span
            className="tb-conn"
            style={{ fontSize: '11px', opacity: 0.7, display: 'flex', alignItems: 'center', gap: '4px' }}
            title="Checking live data registries..."
          >
            <RefreshCw
              size={12}
              style={{
                animation: 'spin 2s linear infinite',
              }}
            />
            <span style={{ fontSize: '10px' }}>checking...</span>
          </span>
        )}

        {enrichment && enrichmentStatus !== 'checking' && (
          <span
            className="tb-conn"
            onClick={() => {
              const el = document.getElementById('findings-live-data-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              cursor: 'pointer',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: enrichmentStatus === 'failed' ? '#94a3b8' : hasVulnerabilities ? '#ef4444' : '#10b981',
            }}
            title={
              enrichmentStatus === 'failed'
                ? 'Live registry check unavailable'
                : `${enrichmentCount} live registry findings. Click to view.`
            }
          >
            <Globe size={13} style={{ color: enrichmentStatus === 'failed' ? '#94a3b8' : hasVulnerabilities ? '#ef4444' : '#10b981' }} />
            <span>{enrichmentStatus === 'failed' ? 'off' : enrichmentCount}</span>
          </span>
        )}

        <span className="tb-divider" aria-hidden="true" />

        <button
          className="tb-conn"
          type="button"
          onClick={onOpenDoctor}
          title="Doctor — system health & security self-check"
          aria-label="Open Doctor: system health and security self-check"
        >
          <Stethoscope size={15} strokeWidth={1.75} aria-hidden="true" />
        </button>

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
