/**
 * Token status bar + Fran's live burn-rate graph (Floor 1 special feature).
 *
 * Sits at the bottom of the office scene. Shows remaining budget in big pixel
 * numbers, an alert light that blinks with severity, and an SVG line chart of
 * the recent burn-rate history.
 */

import { ALERT_COLORS, type TokenState } from './tokenMonitor.js';

interface TokenDisplayProps {
  tokenState: TokenState;
  history: ReadonlyArray<number>;
}

function buildSparkline(history: ReadonlyArray<number>, w: number, h: number): string {
  if (history.length < 2) return '';
  const max = Math.max(...history, 1);
  const step = w / (history.length - 1);
  return history
    .map((v, i) => {
      const x = i * step;
      const y = h - (v / max) * h;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export function TokenDisplay({ tokenState, history }: TokenDisplayProps) {
  const color = ALERT_COLORS[tokenState.alertLevel];
  const pct = tokenState.budget > 0 ? (tokenState.remaining / tokenState.budget) * 100 : 0;
  const lightClass =
    tokenState.alertLevel === 'healthy'
      ? 'archco-alert-light off'
      : tokenState.alertLevel === 'warning'
        ? 'archco-alert-light slow'
        : tokenState.alertLevel === 'critical'
          ? 'archco-alert-light fast'
          : 'archco-alert-light dead';

  const W = 120;
  const H = 28;
  const path = buildSparkline(history, W, H);

  return (
    <div className="archco-token-bar" data-alert={tokenState.alertLevel}>
      <div className="archco-token-fran">
        <span className={lightClass} style={{ background: color }} />
        <span className="archco-token-label">FRAN · FinOps</span>
      </div>

      <div className="archco-token-numbers">
        <span className="archco-token-remaining" style={{ color }}>
          {Math.max(0, Math.round(tokenState.remaining)).toLocaleString()}
        </span>
        <span className="archco-token-unit">tokens left · {pct.toFixed(0)}%</span>
      </div>

      <svg
        className="archco-token-graph"
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        aria-hidden="true"
      >
        <rect x="0" y="0" width={W} height={H} fill="#0B0B14" rx="3" />
        {path && <path d={path} fill="none" stroke={color} strokeWidth="1.4" />}
      </svg>

      <div className="archco-token-message" style={{ color }}>
        {tokenState.franMessage}
      </div>
    </div>
  );
}
