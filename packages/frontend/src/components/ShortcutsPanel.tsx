/** Shortcuts panel: a modal overlay showing the keyboard shortcuts list. */

interface ShortcutsPanelProps {
  onClose: () => void;
}

export function ShortcutsPanel({ onClose }: ShortcutsPanelProps) {
  const tabsList = [
    'Full Flow',
    'Frontend Filter',
    'Backend Filter',
    'API Filter',
    'Security Controls',
    'Database Designer',
    'System Design',
  ];

  return (
    <div className="brain-overlay" onClick={onClose}>
      <div className="brain-modal" onClick={(e) => e.stopPropagation()}>
        <header className="brain-modal-head" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <h2>Keyboard Shortcuts</h2>
          <span className="brain-count">Quick Navigation Guide</span>
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </header>

        <section className="brain-section">
          <h3 style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>Panels &amp; Sidebars</h3>
          <table className="shortcuts-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 'var(--space-6)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-dim)', fontSize: 'var(--text-xs)' }}>
                <th style={{ padding: '8px 0' }}>Action</th>
                <th style={{ padding: '8px 0', textAlign: 'right' }}>Keys</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--color-border-dim)' }}>
                <td style={{ padding: '10px 0', fontSize: 'var(--text-sm)' }}>Toggle Left Sidebar</td>
                <td style={{ padding: '10px 0', textAlign: 'right' }}>
                  <kbd className="shortcut-kbd">L</kbd>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border-dim)' }}>
                <td style={{ padding: '10px 0', fontSize: 'var(--text-sm)' }}>Toggle Right Sidebar</td>
                <td style={{ padding: '10px 0', textAlign: 'right' }}>
                  <kbd className="shortcut-kbd">R</kbd>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border-dim)' }}>
                <td style={{ padding: '10px 0', fontSize: 'var(--text-sm)' }}>Toggle Bottom Panel / Terminal</td>
                <td style={{ padding: '10px 0', textAlign: 'right' }}>
                  <kbd className="shortcut-kbd">⌘ J</kbd> or <kbd className="shortcut-kbd">Ctrl J</kbd> or <kbd className="shortcut-kbd">B</kbd>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border-dim)' }}>
                <td style={{ padding: '10px 0', fontSize: 'var(--text-sm)' }}>Create Terminal Tab</td>
                <td style={{ padding: '10px 0', textAlign: 'right' }}>
                  <kbd className="shortcut-kbd">⌘ ⌥ T</kbd> or <kbd className="shortcut-kbd">Ctrl Alt T</kbd>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border-dim)' }}>
                <td style={{ padding: '10px 0', fontSize: 'var(--text-sm)' }}>Close Active Terminal Tab</td>
                <td style={{ padding: '10px 0', textAlign: 'right' }}>
                  <kbd className="shortcut-kbd">⌘ ⌥ W</kbd> or <kbd className="shortcut-kbd">Ctrl Alt W</kbd>
                </td>
              </tr>
            </tbody>
          </table>

          <h3 style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>Canvas Tab Switching</h3>
          <table className="shortcuts-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-dim)', fontSize: 'var(--text-xs)' }}>
                <th style={{ padding: '8px 0' }}>Tab View</th>
                <th style={{ padding: '8px 0', textAlign: 'right' }}>Keys</th>
              </tr>
            </thead>
            <tbody>
              {tabsList.map((label, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--color-border-dim)' }}>
                  <td style={{ padding: '8px 0', fontSize: 'var(--text-sm)' }}>Switch to {label}</td>
                  <td style={{ padding: '8px 0', textAlign: 'right' }}>
                    <kbd className="shortcut-kbd">{idx + 1}</kbd>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
