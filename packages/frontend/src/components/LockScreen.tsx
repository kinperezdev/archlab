/**
 * Full-screen launch lock (Layer 1).
 *
 * When ArchLab starts with a password set, this covers the entire app until the
 * correct password is entered. Nothing behind it is accessible — the brain, the
 * canvas, the terminal — until you're past the door.
 */

import { useState } from 'react';
import type { BrainAccessStatus } from '@archlab/shared';
import { unlockBrain } from '../lib/brainAccess.js';

interface LockScreenProps {
  onUnlocked: (status: BrainAccessStatus) => void;
}

export function LockScreen({ onUnlocked }: LockScreenProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!password || busy) return;
    setBusy(true);
    setError(null);
    try {
      onUnlocked(await unlockBrain(password));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incorrect password.');
      setPassword('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="lock-screen">
      <div className="lock-screen-card">
        <div className="lock-screen-icon" aria-hidden="true">🔒</div>
        <h1 className="lock-screen-title">ArchLab is locked</h1>
        <p className="lock-screen-sub">
          Enter your local password to unlock the brain and open the workspace.
        </p>
        <input
          type="password"
          className="path-input lock-screen-input"
          autoFocus
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void submit();
          }}
        />
        <button className="btn btn-primary lock-screen-btn" disabled={!password || busy} onClick={submit}>
          {busy ? 'Unlocking…' : 'Unlock'}
        </button>
        {error && <p className="lock-screen-error">{error}</p>}
      </div>
    </div>
  );
}
