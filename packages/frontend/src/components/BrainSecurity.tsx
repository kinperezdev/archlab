/**
 * Brain security controls — the bouncer's control panel.
 *
 * Renders two things depending on state:
 *   - lockedView: the unlock gate (Layer 1). While the brain is locked this is
 *     all the panel shows; a correct password opens the door.
 *   - otherwise: set/change the local password, lock now, and manage Layer-2
 *     permissions (which categories the MCP server may read, plus per-project
 *     locks).
 */

import { useEffect, useState } from 'react';
import type { BrainAccessStatus, BrainState } from '@archlab/shared';
import {
  fetchBrain,
  lockBrain,
  setBrainPassword,
  unlockBrain,
  updateBrainPermissions,
} from '../lib/brainAccess.js';

interface BrainSecurityProps {
  access: BrainAccessStatus;
  onChange: (status: BrainAccessStatus) => void;
  /** When true, render only the unlock gate (brain is locked). */
  lockedView?: boolean;
}

export function BrainSecurity({ access, onChange, lockedView }: BrainSecurityProps) {
  if (lockedView) return <UnlockGate onChange={onChange} />;
  return <SecuritySettings access={access} onChange={onChange} />;
}

/** Layer 1 unlock gate shown when the brain is locked. */
function UnlockGate({ onChange }: { onChange: (s: BrainAccessStatus) => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      onChange(await unlockBrain(password));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incorrect password.');
    } finally {
      setBusy(false);
      setPassword('');
    }
  };

  return (
    <section className="brain-lock">
      <div className="brain-lock-icon" aria-hidden="true">🔒</div>
      <h3>Brain locked</h3>
      <p className="file-empty">
        Enter your local password to access the brain. Nothing is served — to the
        panel or to any AI tool over MCP — until you unlock.
      </p>
      <div className="brain-lock-row">
        <input
          type="password"
          className="path-input"
          autoFocus
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && password) void submit();
          }}
        />
        <button className="btn btn-primary" disabled={!password || busy} onClick={submit}>
          {busy ? 'Unlocking…' : 'Unlock'}
        </button>
      </div>
      {error && <p className="brain-lock-error">{error}</p>}
    </section>
  );
}

/** Layer 1 password management + Layer 2 permissions (shown when unlocked). */
function SecuritySettings({
  access,
  onChange,
}: {
  access: BrainAccessStatus;
  onChange: (s: BrainAccessStatus) => void;
}) {
  const [newPassword, setNewPassword] = useState('');
  const [pwStatus, setPwStatus] = useState<string | null>(null);
  const [projects, setProjects] = useState<BrainState['projects']>([]);

  useEffect(() => {
    fetchBrain().then((b) => setProjects(b.projects)).catch(() => setProjects([]));
  }, [access]);

  const savePassword = async () => {
    try {
      const status = await setBrainPassword(newPassword);
      onChange(status);
      setNewPassword('');
      setPwStatus('Password saved. The brain is now locked again — unlock to continue.');
    } catch (err) {
      setPwStatus(err instanceof Error ? err.message : 'Could not set password.');
    }
  };

  const togglePermission = async (key: 'patterns' | 'insights' | 'projectFindings') => {
    try {
      onChange(await updateBrainPermissions({ [key]: !access.permissions[key] }));
    } catch {
      /* keep prior state */
    }
  };

  const toggleProjectLock = async (projectId: string) => {
    const locked = access.permissions.lockedProjects;
    const next = locked.includes(projectId)
      ? locked.filter((id) => id !== projectId)
      : [...locked, projectId];
    try {
      onChange(await updateBrainPermissions({ lockedProjects: next }));
    } catch {
      /* keep prior state */
    }
  };

  return (
    <section
      className="brain-section"
      style={{ borderTop: '1px dashed var(--color-border)', paddingTop: 'var(--space-6)', marginTop: 'var(--space-6)' }}
    >
      <h3>Brain Security</h3>
      <p className="intel-summary" style={{ marginBottom: 'var(--space-3)' }}>
        Access-layer protection. The files stay unencrypted for fast reads and
        writes — nothing gets past the door without permission.
      </p>

      {/* Layer 1 */}
      <h4 className="brain-sec-sub">Local password (Layer 1)</h4>
      <div className="brain-lock-row" style={{ marginBottom: 'var(--space-2)' }}>
        <input
          type="password"
          className="path-input"
          placeholder={access.hasPassword ? 'New password (min 4 chars)' : 'Set a password'}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button className="btn" disabled={newPassword.length < 4} onClick={savePassword}>
          {access.hasPassword ? 'Change' : 'Set password'}
        </button>
        {access.hasPassword && (
          <button className="btn" onClick={async () => onChange(await lockBrain())}>
            Lock now
          </button>
        )}
      </div>
      {pwStatus && <p className="intel-summary brain-sec-note">{pwStatus}</p>}

      {/* Layer 2 */}
      <h4 className="brain-sec-sub">MCP permissions (Layer 2)</h4>
      <ul className="brain-perm-list">
        <PermissionToggle
          label="Architecture / cross-project patterns"
          on={access.permissions.patterns}
          onToggle={() => togglePermission('patterns')}
        />
        <PermissionToggle
          label="Proactive insights"
          on={access.permissions.insights}
          onToggle={() => togglePermission('insights')}
        />
        <PermissionToggle
          label="Per-project findings"
          on={access.permissions.projectFindings}
          onToggle={() => togglePermission('projectFindings')}
        />
      </ul>

      <h4 className="brain-sec-sub">Locked projects</h4>
      <p className="intel-summary" style={{ marginBottom: 'var(--space-2)' }}>
        A locked project is invisible to every AI tool over MCP, even while the
        brain is unlocked.
      </p>
      {projects.length === 0 ? (
        <p className="file-empty">No projects in the brain yet.</p>
      ) : (
        <ul className="brain-perm-list">
          {projects.map((p) => {
            const locked = access.permissions.lockedProjects.includes(p.projectId);
            return (
              <li key={p.projectId} className="brain-perm-row">
                <span className="brain-perm-label">{p.name}</span>
                <button
                  className={`brain-perm-toggle ${locked ? 'is-locked' : 'is-open'}`}
                  onClick={() => toggleProjectLock(p.projectId)}
                >
                  {locked ? '🔒 Locked' : '🔓 Allowed'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function PermissionToggle({
  label,
  on,
  onToggle,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="brain-perm-row">
      <span className="brain-perm-label">{label}</span>
      <button className={`brain-perm-toggle ${on ? 'is-open' : 'is-locked'}`} onClick={onToggle}>
        {on ? '🔓 Allowed' : '🚫 Blocked'}
      </button>
    </li>
  );
}
