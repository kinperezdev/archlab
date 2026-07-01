/**
 * ArchBench session gate (mock).
 *
 * The other end of the ArchBench bridge. A senior pastes the time-boxed session
 * code that ArchBench minted after both parties signed, and the collaborative
 * room opens here, inside ArchLab, where the live system already lives.
 *
 * Shown only when the URL carries `?session`, so normal app launch is untouched.
 * This is a visual mock: no real token validation or room yet.
 */

import { useState } from 'react';

const CODE_PATTERN = /^ARCH-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

// The session a valid code resolves to in this demo.
const DEMO_SESSION = {
  founder: 'Maya Chen',
  project: 'FleetPay, a payments dashboard',
  minutes: 60,
};

function LockGlyph({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 11V8a5 5 0 0 1 10 0v3" />
      <rect x="6" y="11" width="12" height="9" rx="1.5" />
      <path d="M12 15v2" />
    </svg>
  );
}

export function SessionGate() {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

  const submit = () => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return;
    if (!CODE_PATTERN.test(normalized)) {
      setError('Wrong format. Use ARCH-XXXX-XXXX.');
      return;
    }
    setError(null);
    setJoined(true);
  };

  if (joined) {
    return (
      <div className="session-gate-screen">
        <div className="session-gate-card">
          <div className="session-gate-eyebrow">
            <span className="sg-live" aria-hidden="true" />
            <span>Sealed Session</span>
            <span className="sg-dot" aria-hidden="true" />
            <span>Live</span>
          </div>
          <h1 className="session-gate-title">You're in the room</h1>
          <p className="session-gate-sub">
            You and {DEMO_SESSION.founder} work on the live system together.
            Time-boxed and under NDA.
          </p>
          <div className="session-gate-meta">
            <div className="session-gate-row">
              <span>Founder</span>
              <span>{DEMO_SESSION.founder}</span>
            </div>
            <div className="session-gate-row">
              <span>Project</span>
              <span>{DEMO_SESSION.project}</span>
            </div>
            <div className="session-gate-row">
              <span>Time-box</span>
              <span>{DEMO_SESSION.minutes} min</span>
            </div>
            <div className="session-gate-row">
              <span>Code</span>
              <span>{code.trim().toUpperCase()}</span>
            </div>
          </div>
          <p className="session-gate-demo">
            Demo only. The real workspace opens here.
          </p>
          <button
            className="session-gate-btn-ghost"
            onClick={() => {
              setJoined(false);
              setCode('');
            }}
          >
            Leave session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="session-gate-screen">
      <div className="session-gate-card">
        <div className="session-gate-eyebrow">
          <span className="sg-arrow">[ → ]</span>
          <span>Sealed Session</span>
          <span className="sg-dot" aria-hidden="true" />
          <span>ArchBench</span>
        </div>
        <div className="session-gate-lock" aria-hidden="true">
          <LockGlyph size={24} />
        </div>
        <h1 className="session-gate-title">Join a session</h1>
        <p className="session-gate-sub">
          Enter the code your founder shared. Access ends when the session does.
        </p>
        <input
          className="session-gate-input"
          autoFocus
          placeholder="ARCH-XXXX-XXXX"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
        />
        <button
          className="session-gate-btn"
          disabled={!code.trim()}
          onClick={submit}
        >
          Join session
        </button>
        {error && <p className="session-gate-error">{error}</p>}
        <div className="session-gate-foot">
          <LockGlyph size={11} />
          Time-boxed · NDA-bound
        </div>
      </div>
    </div>
  );
}
