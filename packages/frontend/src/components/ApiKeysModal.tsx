/**
 * Settings → API Keys modal. Write-only by design: the backend reports which
 * providers are configured as booleans and never returns key values, so this
 * form can only save new keys, never display stored ones.
 */

import { useState, useEffect } from 'react';
import { PORTS } from '@archlab/shared';

interface ApiKeysModalProps {
  onClose: () => void;
}

export function ApiKeysModal({ onClose }: ApiKeysModalProps) {
  // `keys` holds only what the user types this session — secrets are never sent
  // back from the server, so the inputs always start empty. `present` tracks
  // which providers already have a key configured (booleans from the server).
  const [keys, setKeys] = useState({ anthropic: '', openai: '', gemini: '' });
  const [present, setPresent] = useState({ anthropic: false, openai: false, gemini: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`http://127.0.0.1:${PORTS.backend}/api/keys`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.keys) {
          setPresent({
            anthropic: Boolean(data.keys.anthropic),
            openai: Boolean(data.keys.openai),
            gemini: Boolean(data.keys.gemini),
          });
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
      // Only send fields the user actually typed. Empty fields are left
      // untouched server-side so editing one key never wipes the others.
      const changed: Record<string, string> = {};
      if (keys.anthropic) changed.anthropic = keys.anthropic;
      if (keys.openai) changed.openai = keys.openai;
      if (keys.gemini) changed.gemini = keys.gemini;
      const res = await fetch(`http://127.0.0.1:${PORTS.backend}/api/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: changed }),
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

  // Explicit `null` tells the backend to delete the stored key (empty string
  // means "untouched" in the merge, so this is the only removal path).
  const handleRemove = async (provider: 'anthropic' | 'openai' | 'gemini') => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`http://127.0.0.1:${PORTS.backend}/api/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: { [provider]: null } }),
      });
      const data = await res.json();
      if (data.ok) {
        setPresent((prev) => ({ ...prev, [provider]: false }));
        setKeys((prev) => ({ ...prev, [provider]: '' }));
        setMessage('Key removed.');
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setMessage(`Error: ${String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const removeButton = (provider: 'anthropic' | 'openai' | 'gemini') =>
    present[provider] ? (
      <button
        type="button"
        onClick={() => handleRemove(provider)}
        disabled={saving}
        style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '12px', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-dim)', cursor: 'pointer' }}
      >
        Remove
      </button>
    ) : null;

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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="anthropic-key" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-dim)' }}>Anthropic API Key (Claude)</label>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '12px', background: (present.anthropic || keys.anthropic) ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.12)', color: (present.anthropic || keys.anthropic) ? '#34d399' : '#f87171', fontWeight: 500 }}>
                    {(present.anthropic || keys.anthropic) ? 'Active' : 'Not Configured'}
                  </span>
                  {removeButton('anthropic')}
                </span>
              </div>
              <input
                id="anthropic-key"
                type="password"
                value={keys.anthropic}
                onChange={(e) => setKeys({ ...keys, anthropic: e.target.value })}
                placeholder={present.anthropic ? '•••••••• saved, type to replace' : 'sk-ant-...'}
                className="input"
                style={{ width: '100%', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '8px 12px', color: 'var(--color-text)', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="openai-key" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-dim)' }}>OpenAI API Key (ChatGPT)</label>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '12px', background: (present.openai || keys.openai) ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.12)', color: (present.openai || keys.openai) ? '#34d399' : '#f87171', fontWeight: 500 }}>
                    {(present.openai || keys.openai) ? 'Active' : 'Not Configured'}
                  </span>
                  {removeButton('openai')}
                </span>
              </div>
              <input
                id="openai-key"
                type="password"
                value={keys.openai}
                onChange={(e) => setKeys({ ...keys, openai: e.target.value })}
                placeholder={present.openai ? '•••••••• saved, type to replace' : 'sk-proj-...'}
                className="input"
                style={{ width: '100%', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '8px 12px', color: 'var(--color-text)', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="gemini-key" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-dim)' }}>Gemini API Key (Google AI)</label>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '12px', background: (present.gemini || keys.gemini) ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.12)', color: (present.gemini || keys.gemini) ? '#34d399' : '#f87171', fontWeight: 500 }}>
                    {(present.gemini || keys.gemini) ? 'Active' : 'Not Configured'}
                  </span>
                  {removeButton('gemini')}
                </span>
              </div>
              <input
                id="gemini-key"
                type="password"
                value={keys.gemini}
                onChange={(e) => setKeys({ ...keys, gemini: e.target.value })}
                placeholder={present.gemini ? '•••••••• saved, type to replace' : 'AIzaSy...'}
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
