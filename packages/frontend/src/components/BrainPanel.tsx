/** Brain panel: a modal overlay showing global brain contents and insights. */

import { useState } from 'react';
import { PORTS } from '@archlab/shared';
import type { BrainSummary } from '../state/useArchLab.js';
import { CopyPromptButton } from './CopyPromptButton.js';
import { promptForInsight } from '../lib/prompts.js';

interface BrainPanelProps {
  brain: BrainSummary;
  onClose: () => void;
}

export function BrainPanel({ brain, onClose }: BrainPanelProps) {
  const patterns = [...brain.patterns].sort((a, b) => b.count - a.count);
  const [copied, setCopied] = useState(false);
  const [pasteConfig, setPasteConfig] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

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

  return (
    <div className="brain-overlay" onClick={onClose}>
      <div className="brain-modal" onClick={(e) => e.stopPropagation()}>
        <header className="brain-modal-head">
          <h2>Global Brain</h2>
          <span className="brain-count">{brain.projectCount} projects learned</span>
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </header>

        <section className="brain-section">
          <h3>Proactive insights</h3>
          {brain.insights.length === 0 ? (
            <p className="file-empty">No cross-project insights yet. Analyze more projects.</p>
          ) : (
            <ul className="insight-list">
              {brain.insights.map((i) => (
                <li key={i.id} className="insight">
                  <span>{i.message}</span>
                  <CopyPromptButton compact prompt={() => promptForInsight(i.message)} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="brain-section">
          <h3>Cross-project patterns</h3>
          {patterns.length === 0 ? (
            <p className="file-empty">No patterns learned yet.</p>
          ) : (
            <ul className="pattern-list">
              {patterns.map((p) => (
                <li key={p.id} className="pattern">
                  <span className="pattern-cat">{p.category}</span>
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
              <div className="suggested-prompt-head">
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
            <h4 style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
              Import Claude MCPs to ArchLab
            </h4>
            <p className="intel-summary" style={{ marginBottom: '12px' }}>
              Paste configuration JSON from any Claude Desktop MCP server to run and register it directly on the canvas.
            </p>
            <textarea
              className="path-input"
              style={{
                width: '100%',
                maxWidth: 'none',
                height: '220px',
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
                className="btn btn-primary"
                disabled={!pasteConfig.trim()}
                onClick={handleImportMcp}
                style={{ marginLeft: 'auto' }}
              >
                Import Configuration
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
