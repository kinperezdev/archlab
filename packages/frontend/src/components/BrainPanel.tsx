/** Brain panel: a modal overlay showing global brain contents and insights. */

import { useEffect, useState } from 'react';
import { PORTS, type BrainAccessStatus, type PersistentIssue } from '@archlab/shared';
import type { BrainSummary } from '../state/useArchLab.js';
import { CopyPromptButton } from './CopyPromptButton.js';
import { promptForInsight } from '../lib/prompts.js';
import { fetchAccessStatus } from '../lib/brainAccess.js';
import { BrainSecurity } from './BrainSecurity.js';

interface BrainPanelProps {
  brain: BrainSummary;
  persistentIssues?: PersistentIssue[];
  onClose: () => void;
}

const AGENT_LABEL: Record<string, string> = {
  security: 'Security Agent',
  performance: 'Performance Agent',
  architecture: 'Architecture Agent',
  database: 'Database Agent',
  quality: 'Code Quality Agent',
  orchestrator: 'Orchestrator',
};

export function BrainPanel({ brain, persistentIssues = [], onClose }: BrainPanelProps) {
  const patterns = [...brain.patterns].sort((a, b) => b.count - a.count);
  const [copied, setCopied] = useState(false);
  const [pasteConfig, setPasteConfig] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [access, setAccess] = useState<BrainAccessStatus | null>(null);
  const [addMode, setAddMode] = useState<'form' | 'json'>('form');
  const [newMcp, setNewMcp] = useState({ name: '', command: '', args: '' });

  useEffect(() => {
    fetchAccessStatus().then(setAccess).catch(() => setAccess(null));
  }, []);

  const mcpConfig = {
    mcpServers: {
      "archlab-mcp": {
        "command": "node",
        "args": [
          "/Users/kinclarkperez/Desktop/React/ArchLab/packages/mcp-server/dist/index.js"
        ]
      }
    }
  };

  const copyMcpConfig = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(mcpConfig, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* blocked */
    }
  };

  const handleImportMcp = async () => {
    if (!pasteConfig.trim()) return;
    try {
      let parsed;
      try {
        parsed = JSON.parse(pasteConfig);
      } catch {
        setImportStatus('Invalid JSON format.');
        return;
      }

      // Handle raw mcpServers object or a full wrapper config
      const mcpServers = parsed.mcpServers || parsed;
      if (typeof mcpServers !== 'object') {
        setImportStatus('JSON must contain a list of mcpServers.');
        return;
      }

      const response = await fetch(`http://127.0.0.1:${PORTS.backend}/mcp/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mcpServers }),
      });

      const resData = await response.json();
      if (resData.ok) {
        setImportStatus('Success! MCP config loaded and canvas updated.');
        setPasteConfig('');
        setTimeout(() => setImportStatus(null), 3000);
      } else {
        setImportStatus(resData.error || 'Failed to import configuration.');
      }
    } catch {
      setImportStatus('Connection error to backend.');
    }
  };

  const handleAddMcp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMcp.name.trim() || !newMcp.command.trim()) return;
    try {
      setImportStatus('Adding MCP server...');
      const response = await fetch(`http://127.0.0.1:${PORTS.backend}/mcp/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMcp),
      });
      const resData = await response.json();
      if (resData.ok) {
        setImportStatus(`Success! Registered "${newMcp.name}" on the canvas.`);
        setNewMcp({ name: '', command: '', args: '' });
        setTimeout(() => setImportStatus(null), 3000);
      } else {
        setImportStatus(resData.error || 'Failed to add MCP server.');
      }
    } catch {
      setImportStatus('Connection error to backend.');
    }
  };

  return (
    <div className="brain-overlay" onClick={onClose}>
      <div className="brain-modal" onClick={(e) => e.stopPropagation()}>
        <header className="brain-modal-head">
          <span className="brain-logo-mark" aria-hidden="true" />
          <h2>Global Brain</h2>
          <span className="brain-count-badge">{brain.projectCount} projects</span>
          <button className="btn" onClick={onClose} style={{ marginLeft: 'auto' }}>
            Close
          </button>
        </header>

        {/* Layer 1: while locked, the panel shows nothing but the unlock gate. */}
        {access?.locked ? (
          <BrainSecurity access={access} onChange={setAccess} lockedView />
        ) : (
          <>
        <section className="brain-section">
          <h3>Proactive insights</h3>
          {brain.insights.length === 0 ? (
            <p className="file-empty">No cross-project insights yet. Analyze more projects.</p>
          ) : (
            <ul className="insight-list">
              {brain.insights.map((i) => {
                const pat = i.patternId ? brain.patterns.find((p) => p.id === i.patternId) : undefined;
                const projects = pat?.occurrences.length ?? 0;
                return (
                  <li key={i.id} className="insight insight-card">
                    <span className="insight-bulb" aria-hidden="true">💡</span>
                    <span className="insight-text">{i.message}</span>
                    {projects > 0 && (
                      <span className="insight-projects" title="Projects that triggered this insight">
                        {projects} project{projects === 1 ? '' : 's'}
                      </span>
                    )}
                    <CopyPromptButton compact prompt={() => promptForInsight(i.message)} />
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {persistentIssues.length > 0 && (
          <section className="brain-section">
            <h3>Persistent Issues</h3>
            <p className="intel-summary" style={{ marginBottom: 'var(--space-2)' }}>
              Findings the Agent Team has surfaced across multiple runs without resolution.
            </p>
            <ul className="persistent-list">
              {persistentIssues.map((it) => (
                <li key={`${it.agentId}:${it.title}`} className="persistent-issue">
                  <div className="persistent-issue-head">
                    <span className={`persistent-badge ${it.count >= 5 ? 'critical' : ''}`}>
                      {it.count >= 5 ? `CRITICAL UNRESOLVED · ${it.count} runs` : `${it.count} runs`}
                    </span>
                    <CopyPromptButton
                      compact
                      prompt={`Resolve this recurring issue found by the ${AGENT_LABEL[it.agentId] ?? it.agentId} across ${it.count} ArchLab agent runs: ${it.title}`}
                    />
                  </div>
                  <div className="persistent-issue-title">{it.title}</div>
                  <div className="persistent-issue-meta">
                    {AGENT_LABEL[it.agentId] ?? it.agentId} · first seen {new Date(it.firstSeen).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="brain-section">
          <h3>Cross-project patterns</h3>
          {patterns.length === 0 ? (
            <p className="file-empty">No patterns learned yet.</p>
          ) : (
            <ul className="pattern-list">
              {patterns.map((p) => (
                <li key={p.id} className="pattern pattern-card">
                  <span className={`pattern-cat cat-${p.category.toLowerCase().split(/[-\s]/)[0]}`}>
                    {p.category}
                  </span>
                  <span className="pattern-desc">{p.description}</span>
                  <span className="pattern-count">×{p.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="brain-section" style={{ borderTop: '1px dashed var(--color-border)', paddingTop: 'var(--space-6)', marginTop: 'var(--space-6)' }}>
          <h3>Claude Desktop Connection & Import</h3>
          
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <p className="intel-summary" style={{ marginBottom: '12px' }}>
              Copy this configuration block and insert it into your <code>claude_desktop_config.json</code> to connect Claude to ArchLab's project intelligence.
            </p>
            <div className="suggested-prompt">
              <div className="suggested-prompt-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span>MCP Config Block</span>
                <button className="btn copy-btn" onClick={copyMcpConfig}>
                  {copied ? 'Copied ✓' : 'Copy Config'}
                </button>
              </div>
              <pre className="suggested-prompt-body" style={{ overflowX: 'auto', whiteSpace: 'pre' }}>
                {JSON.stringify(mcpConfig, null, 2)}
              </pre>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
                Configure Custom MCP Servers
              </h4>
              <div className="agent-mode-row" style={{ margin: 0, padding: '2px', display: 'flex', gap: '2px' }}>
                <button
                  type="button"
                  className={`agent-mode-btn ${addMode === 'form' ? 'active' : ''}`}
                  onClick={() => { setAddMode('form'); setImportStatus(null); }}
                  style={{ padding: '3px 8px', fontSize: '10px' }}
                >
                  Form Creator
                </button>
                <button
                  type="button"
                  className={`agent-mode-btn ${addMode === 'json' ? 'active' : ''}`}
                  onClick={() => { setAddMode('json'); setImportStatus(null); }}
                  style={{ padding: '3px 8px', fontSize: '10px' }}
                >
                  Paste JSON
                </button>
              </div>
            </div>

            {addMode === 'form' ? (
              <form onSubmit={handleAddMcp} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>Server Name</label>
                    <input
                      type="text"
                      className="path-input"
                      style={{ width: '100%', maxWidth: 'none', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '6px var(--space-2)', color: 'var(--color-text)', fontSize: 'var(--text-xs)', outline: 'none' }}
                      placeholder="sqlite"
                      value={newMcp.name}
                      onChange={(e) => setNewMcp({ ...newMcp, name: e.target.value })}
                      required
                    />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>Command</label>
                    <input
                      type="text"
                      className="path-input"
                      style={{ width: '100%', maxWidth: 'none', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '6px var(--space-2)', color: 'var(--color-text)', fontSize: 'var(--text-xs)', outline: 'none' }}
                      placeholder="node or uvx"
                      value={newMcp.command}
                      onChange={(e) => setNewMcp({ ...newMcp, command: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>Arguments (space separated)</label>
                  <input
                    type="text"
                    className="path-input"
                    style={{ width: '100%', maxWidth: 'none', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '6px var(--space-2)', color: 'var(--color-text)', fontSize: 'var(--text-xs)', outline: 'none' }}
                    placeholder="mcp-server-sqlite --db /path/to/db.sqlite"
                    value={newMcp.args}
                    onChange={(e) => setNewMcp({ ...newMcp, args: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {importStatus && (
                    <span className="intel-summary" style={{ color: importStatus.startsWith('Success') ? 'var(--state-green)' : (importStatus.startsWith('Adding') ? 'var(--color-accent)' : 'var(--state-red)'), fontWeight: 'bold' }}>
                      {importStatus}
                    </span>
                  )}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!newMcp.name.trim() || !newMcp.command.trim()}
                    style={{ marginLeft: 'auto' }}
                  >
                    Add MCP Server
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <p className="intel-summary" style={{ marginBottom: '12px' }}>
                  Paste configuration JSON from any Claude Desktop MCP server to run and register it directly on the canvas.
                </p>
                <textarea
                  className="path-input"
                  style={{
                    width: '100%',
                    maxWidth: 'none',
                    height: '140px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    padding: 'var(--space-3)',
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    resize: 'vertical',
                    color: 'var(--color-text)',
                    marginBottom: 'var(--space-2)'
                  }}
                  placeholder='{ "mcpServers": { "my-server": { "command": "node", "args": [...] } } }'
                  value={pasteConfig}
                  onChange={(e) => setPasteConfig(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {importStatus && (
                    <span className="intel-summary" style={{ color: importStatus.startsWith('Success') ? 'var(--state-green)' : 'var(--state-red)', fontWeight: 'bold' }}>
                      {importStatus}
                    </span>
                  )}
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!pasteConfig.trim()}
                    onClick={handleImportMcp}
                    style={{ marginLeft: 'auto' }}
                  >
                    Import JSON Configuration
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {access && <BrainSecurity access={access} onChange={setAccess} />}
          </>
        )}
      </div>
    </div>
  );
}
