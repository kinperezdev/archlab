import { useState, useEffect } from 'react';
import { PORTS } from '@archlab/shared';

interface ApiKeysModalProps {
  onClose: () => void;
}

export function ApiKeysModal({ onClose }: ApiKeysModalProps) {
  const [keys, setKeys] = useState({ anthropic: '', openai: '', gemini: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`http://127.0.0.1:${PORTS.backend}/api/keys`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.keys) {
          setKeys(data.keys);
        }
      })
      .catch((err) => console.error('Failed to load keys:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`http://127.0.0.1:${PORTS.backend}/api/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage('API Keys saved successfully!');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setMessage(`Error: ${String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="brain-overlay" onClick={onClose}>
      <div className="brain-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <header className="brain-modal-head" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <h2>AI API Keys</h2>
          <span className="brain-count">Configure Local Environment</span>
          <button className="btn" onClick={onClose}>
            ✕
          </button>
        </header>

        {loading ? (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-dim)' }}>
            Loading configured keys...
          </div>
        ) : (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <label htmlFor="anthropic-key" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-dim)' }}>Anthropic API Key (Claude)</label>
              <input
                id="anthropic-key"
                type="password"
                value={keys.anthropic}
                onChange={(e) => setKeys({ ...keys, anthropic: e.target.value })}
                placeholder="sk-ant-..."
                className="input"
                style={{ width: '100%', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '8px 12px', color: 'var(--color-text)', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <label htmlFor="openai-key" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-dim)' }}>OpenAI API Key (ChatGPT)</label>
              <input
                id="openai-key"
                type="password"
                value={keys.openai}
                onChange={(e) => setKeys({ ...keys, openai: e.target.value })}
                placeholder="sk-proj-..."
                className="input"
                style={{ width: '100%', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '8px 12px', color: 'var(--color-text)', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <label htmlFor="gemini-key" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-dim)' }}>Gemini API Key (Google AI)</label>
              <input
                id="gemini-key"
                type="password"
                value={keys.gemini}
                onChange={(e) => setKeys({ ...keys, gemini: e.target.value })}
                placeholder="AIzaSy..."
                className="input"
                style={{ width: '100%', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '8px 12px', color: 'var(--color-text)', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: message.startsWith('Error') ? '#f87171' : '#34d399' }}>{message}</span>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button type="button" className="btn" onClick={onClose} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: 'var(--color-primary)', color: '#fff' }} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Keys'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
