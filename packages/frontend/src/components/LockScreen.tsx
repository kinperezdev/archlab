/**
 * Full-screen launch lock (Layer 1).
 *
 * When ArchLab starts with a password set, this covers the entire app until the
 * correct password is entered. Nothing behind it is accessible — the brain, the
 * canvas, the terminal — until you're past the door.
 */

import { useEffect, useState } from 'react';
import type { BrainAccessStatus } from '@archlab/shared';
import { unlockBrain } from '../lib/brainAccess.js';

interface LockScreenProps {
  onUnlocked: (status: BrainAccessStatus) => void;
}

/** Failed attempts before a cooldown kicks in, and how long it lasts. */
const MAX_ATTEMPTS = 3;
const COOLDOWN_SECONDS = 30;

export function LockScreen({ onUnlocked }: LockScreenProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  // Tick the cooldown down to zero, then clear attempts.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);
  useEffect(() => {
    if (cooldown === 0 && attempts >= MAX_ATTEMPTS) setAttempts(0);
  }, [cooldown, attempts]);

  const submit = async () => {
    if (!password || busy || cooldown > 0) return;
    setBusy(true);
    setError(null);
    try {
      onUnlocked(await unlockBrain(password));
    } catch (err) {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      setPassword('');
      if (nextAttempts >= MAX_ATTEMPTS) {
        setCooldown(COOLDOWN_SECONDS);
        setError(`Too many attempts. Try again in ${COOLDOWN_SECONDS}s.`);
      } else {
        setError(err instanceof Error ? err.message : 'Incorrect password.');
      }
    } finally {
      setBusy(false);
    }
  };

  const locked = cooldown > 0;

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
          disabled={locked}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void submit();
          }}
        />
        <button
          className="btn btn-primary lock-screen-btn"
          disabled={!password || busy || locked}
          onClick={submit}
        >
          {busy ? 'Unlocking…' : locked ? `Locked (${cooldown}s)` : 'Unlock'}
        </button>
        {error && <p className="lock-screen-error">{error}</p>}
      </div>
    </div>
  );
}
