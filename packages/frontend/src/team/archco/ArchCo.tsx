/**
 * ArchCo — the virtual company inside ArchLab.
 *
 * 25+ pixel-art employees across five floors with a real-time day/night cycle,
 * a token monitor (Fran), clickable employee profiles, and an institutional
 * Company Wiki on the executive floor. Replaces the old VirtualOffice.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import './archcoAnimations.css';
import type { Employee, Floor } from './companyData.js';
import { FLOOR_CONFIGS, FLOOR_ORDER } from './floorLayouts.js';
import { getCurrentTimeState, getPresentEmployees, formatClock } from './timeSystem.js';
import { EMPLOYEES } from './companyData.js';
import { calculateTokenState, pushBurnSample, type TokenState } from './tokenMonitor.js';
import { FloorScene, type ThreatLevel } from './FloorScene.js';
import { TokenDisplay } from './TokenDisplay.js';
import { EmployeeProfile } from './EmployeeProfile.js';
import { CompanyWiki } from './CompanyWiki.js';

interface TaskBadge {
  label: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

interface ArchCoProps {
  /** Token budget for the current session (drives Fran). */
  tokenBudget?: number;
  /** Tokens used so far. */
  tokensUsed?: number;
  /** When the session started (ms epoch) — used for burn-rate. */
  sessionStartTime?: number;
  /** Per-employee current task badges, keyed by employee id. */
  taskBadges?: Record<string, TaskBadge>;
  /** Current security threat level (drives Floor 4). */
  threatLevel?: ThreatLevel;
  /** Recent tasks per employee for the profile card. */
  recentTasksByEmployee?: Record<string, string[]>;
}

export function ArchCo({
  tokenBudget = 100_000,
  tokensUsed = 0,
  sessionStartTime,
  taskBadges = {},
  threatLevel = 'green',
  recentTasksByEmployee = {},
}: ArchCoProps) {
  const [activeFloor, setActiveFloor] = useState<Floor>(2);
  const [timeState, setTimeState] = useState(getCurrentTimeState);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [burnHistory, setBurnHistory] = useState<number[]>([]);
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('right');
  const startRef = useRef(sessionStartTime ?? Date.now());

  // Real-time clock + day/night refresh.
  useEffect(() => {
    const id = window.setInterval(() => setTimeState(getCurrentTimeState()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const tokenState: TokenState = useMemo(
    () => calculateTokenState(tokenBudget, tokensUsed, startRef.current),
    [tokenBudget, tokensUsed],
  );

  // Sample burn rate for Fran's sparkline.
  useEffect(() => {
    setBurnHistory((h) => pushBurnSample(h, tokenState.burnRate));
  }, [tokenState.burnRate]);

  const presentIds = useMemo(
    () => new Set(getPresentEmployees(timeState, EMPLOYEES)),
    [timeState],
  );

  const config = FLOOR_CONFIGS[activeFloor];

  const changeFloor = (floor: Floor) => {
    if (floor === activeFloor) return;
    setSlideDir(floor > activeFloor ? 'left' : 'right');
    setActiveFloor(floor);
  };

  return (
    <div className="archco-root" style={{ ['--archco-accent' as string]: config.accentColor }}>
      <header className="archco-topbar">
        <div className="archco-floor-pills">
          {FLOOR_ORDER.map((f) => (
            <button
              key={f}
              className={`archco-floor-pill${f === activeFloor ? ' active' : ''}`}
              onClick={() => changeFloor(f)}
              style={f === activeFloor ? { background: FLOOR_CONFIGS[f].accentColor } : undefined}
            >
              {f === 1 ? 'G' : f}
            </button>
          ))}
        </div>

        <div className="archco-clock">
          <span className="archco-daynight" aria-hidden="true">
            {timeState.timeOfDay === 'day' || timeState.timeOfDay === 'dawn' ? '☀️' : '🌙'}
          </span>
          <span className="archco-time">{formatClock(timeState)}</span>
          <span className="archco-day">{timeState.dayOfWeek.slice(0, 3)}</span>
        </div>
      </header>

      <div className="archco-floor-meta">
        <h2 className="archco-floor-name">{config.name}</h2>
        <p className="archco-floor-desc">{config.description}</p>
      </div>

      <div className="archco-stage">
        <div key={activeFloor} className={`archco-slide slide-${slideDir}`}>
          <FloorScene
            floor={activeFloor}
            timeState={timeState}
            presentIds={presentIds}
            taskBadges={taskBadges}
            threatLevel={threatLevel}
            onSelect={setSelected}
          />
        </div>

        {activeFloor === 5 && (
          <div className="archco-wiki-panel">
            <CompanyWiki />
          </div>
        )}

        <TokenDisplay tokenState={tokenState} history={burnHistory} />
      </div>

      {selected && (
        <EmployeeProfile
          employee={selected}
          recentTasks={recentTasksByEmployee[selected.id]}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
