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
import { FloorScene, type ThreatLevel } from './FloorScene.js';
import { OutsideScene } from './OutsideScene.js';
import { EmployeeProfile } from './EmployeeProfile.js';
import { CompanyWiki } from './CompanyWiki.js';
import { TokenDisplay } from './TokenDisplay.js';
import { calculateTokenState, pushBurnSample } from './tokenMonitor.js';
import { levelForXp, loadGrowthState, saveGrowthState } from './growthSystem.js';
import { PORTS } from '@archlab/shared';
import { runAIUpdate } from './aiUpdateRunner.js';
import { detectAvailableProvider, detectAvailableProviders, PROVIDER_LABEL, type ProviderKeys } from './multiProviderAI.js';
import { initializeLivingData, getAllLivingData } from './employeeLivingStore.js';

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
  /** Available provider API keys (Anthropic/OpenAI/Gemini) for AI Update. */
  apiKeys?: ProviderKeys;
  /** Cross-project brain insights fed into the AI Update prompts. */
  brainInsights?: string[];
  /** Short project description for AI Update context. */
  projectContext?: string;
}

export function ArchCo({
  tokenBudget = 5000,
  tokensUsed = 0,
  sessionStartTime,
  taskBadges = {},
  threatLevel = 'green',
  recentTasksByEmployee = {},
  apiKeys = {},
  brainInsights = [],
  projectContext = '',
}: ArchCoProps) {
  // 0 is the Outside / ground-level view; 1-6 are the office floors.
  const [activeFloor, setActiveFloor] = useState<Floor | 0>(2);
  const [timeState, setTimeState] = useState(getCurrentTimeState);
  const [isOffDuty, setIsOffDuty] = useState(false);
  const [payrollTrigger, setPayrollTrigger] = useState(0);
  const [aiUpgradeTrigger, setAiUpgradeTrigger] = useState(0);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedThought, setSelectedThought] = useState<string | null>(null);
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('right');
  const [burnHistory, setBurnHistory] = useState<number[]>([]);
  const startRef = useRef(sessionStartTime ?? Date.now());

  // AI Update lifecycle.
  const [aiUpdateStatus, setAiUpdateStatus] = useState<'idle' | 'updating' | 'complete' | 'error'>('idle');
  const [aiUpdateProgress, setAiUpdateProgress] = useState({ current: 0, total: EMPLOYEES.length });
  // Bump to force a re-read of living data after updates land.
  const [, setLivingTick] = useState(0);

  const providerConfig = useMemo(() => detectAvailableProvider(apiKeys), [apiKeys]);
  const providerChain = useMemo(() => detectAvailableProviders(apiKeys), [apiKeys]);

  // Real-time clock + day/night refresh.
  useEffect(() => {
    const id = window.setInterval(() => setTimeState(getCurrentTimeState()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  // Load persisted employee living data on mount + 5-min heartbeat save.
  useEffect(() => {
    void initializeLivingData().then(() => setLivingTick((t) => t + 1));
    const id = window.setInterval(() => {
      // Re-persisting the current cache acts as a backup heartbeat.
      const all = getAllLivingData();
      for (const emp of Object.values(all)) {
        void fetch(`http://127.0.0.1:${PORTS.backend}/brain/archco/employees/${emp.employeeId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emp),
        }).catch(() => {});
      }
    }, 5 * 60_000);
    return () => window.clearInterval(id);
  }, []);

  const handleAIUpdate = async () => {
    if (aiUpdateStatus === 'updating') return;
    if (!providerConfig.available) {
      alert('Add an API key in Settings to enable AI updates.');
      return;
    }
    setAiUpdateStatus('updating');
    setAiUpdateProgress({ current: 0, total: EMPLOYEES.length });
    try {
      await runAIUpdate(providerChain, brainInsights, projectContext || 'No project loaded', (_id, status) => {
        if (status === 'done') setAiUpdateProgress((p) => ({ ...p, current: p.current + 1 }));
      });
      setLivingTick((t) => t + 1);
      setAiUpgradeTrigger((prev) => prev + 1);
      setAiUpdateStatus('complete');
      setTimeout(() => setAiUpdateStatus('idle'), 3000);
    } catch (err) {
      setAiUpdateStatus('error');
      alert(`AI Update failed: ${err instanceof Error ? err.message : 'unknown error'}`);
      setTimeout(() => setAiUpdateStatus('idle'), 5000);
    }
  };

  const aiUpdateLabel =
    aiUpdateStatus === 'updating'
      ? `⚡ Updating… (${aiUpdateProgress.current}/${aiUpdateProgress.total})`
      : aiUpdateStatus === 'complete'
        ? '✅ Updated'
        : aiUpdateStatus === 'error'
          ? '❌ Failed — retry?'
          : providerConfig.available
            ? `⚡ AI Update`
            : '⚡ AI Update';

  // Fran's live token state, recomputed from the real budget/usage props.
  const tokenState = useMemo(
    () => calculateTokenState(tokenBudget, tokensUsed, startRef.current),
    [tokenBudget, tokensUsed],
  );
  // Sample the burn rate for Fran's sparkline whenever usage changes.
  useEffect(() => {
    setBurnHistory((h) => pushBurnSample(h, tokenState.burnRate));
  }, [tokenState.burnRate]);

  // Who is in today. Off-duty is handled inside FloorScene (they walk out the
  // exit door), so we keep the roster here and let the scene empty the office.
  const presentIds = useMemo(() => {
    const base = getPresentEmployees(timeState, EMPLOYEES);
    const assigned = Object.keys(taskBadges);
    return new Set([...base, ...assigned]);
  }, [timeState, taskBadges]);

  const config = activeFloor === 0 ? null : FLOOR_CONFIGS[activeFloor];
  const accent = config?.accentColor ?? '#38bdf8';
  // Outside (0) sits before the office floors in the pill row.
  const pills: (Floor | 0)[] = [0, ...FLOOR_ORDER];

  const changeFloor = (floor: Floor | 0) => {
    if (floor === activeFloor) return;
    setSlideDir(floor > activeFloor ? 'left' : 'right');
    setActiveFloor(floor);
  };

  return (
    <div className="archco-root" style={{ ['--archco-accent' as string]: accent }}>
      <header className="archco-topbar">
        <div className="archco-floor-pills">
          {pills.map((f) => (
            <button
              key={f}
              className={`archco-floor-pill${f === activeFloor ? ' active' : ''}`}
              onClick={() => changeFloor(f)}
              style={
                f === activeFloor
                  ? { background: f === 0 ? '#38bdf8' : FLOOR_CONFIGS[f].accentColor }
                  : undefined
              }
              title={f === 0 ? 'Outside' : FLOOR_CONFIGS[f].name}
            >
              {f === 0 ? 'G' : f === 6 ? 'F' : f}
            </button>
          ))}
        </div>

        {/* AI Update — evolves every employee via the active AI provider. */}
        <button
          className="archco-ai-update-btn"
          onClick={handleAIUpdate}
          disabled={!providerConfig.available || aiUpdateStatus === 'updating'}
          title={
            providerConfig.available
              ? `${aiUpdateLabel} (using ${PROVIDER_LABEL[providerConfig.provider]})`
              : 'Add an API key in Settings to enable'
          }
        >
          {aiUpdateLabel}
        </button>
        <span
          className={`archco-provider-badge provider-${providerConfig.available ? providerConfig.provider : 'none'}`}
          title={providerConfig.available ? `Active AI provider: ${PROVIDER_LABEL[providerConfig.provider]}` : 'No AI provider'}
        >
          {providerConfig.available ? PROVIDER_LABEL[providerConfig.provider] : 'No AI'}
        </span>

        <button
          className="archco-ai-update-btn"
          style={{
            marginLeft: '8px',
            background: isOffDuty 
              ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(245, 158, 11, 0.25) 100%)' 
              : 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(59, 130, 246, 0.25) 100%)',
            borderColor: isOffDuty ? 'rgba(239, 68, 68, 0.6)' : 'rgba(16, 185, 129, 0.6)',
            color: isOffDuty ? '#EF4444' : '#34D399',
            boxShadow: isOffDuty 
              ? '0 0 12px rgba(239, 68, 68, 0.2)' 
              : '0 0 12px rgba(16, 185, 129, 0.2)',
            textShadow: isOffDuty
              ? '0 0 8px rgba(239, 68, 68, 0.3)'
              : '0 0 8px rgba(16, 185, 129, 0.3)',
          }}
          onClick={() => {
            setIsOffDuty(!isOffDuty);
          }}
        >
          {isOffDuty ? '🏖️ On Time-Off' : '💼 Go Off-Duty'}
        </button>

        <button
          className="archco-ai-update-btn"
          style={{
            marginLeft: '8px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(16, 185, 129, 0.25) 100%)',
            borderColor: 'rgba(245, 158, 11, 0.6)',
            color: '#F59E0B',
            boxShadow: '0 0 12px rgba(245, 158, 11, 0.2)',
            textShadow: '0 0 8px rgba(245, 158, 11, 0.3)',
          }}
          onClick={() => {
            EMPLOYEES.forEach((emp) => {
              emp.xp += 50;
              const newLvl = levelForXp(emp.xp);
              if (newLvl > emp.level) {
                emp.level = newLvl;
              }
            });
            // Persist upgraded growth state
            loadGrowthState().then((current) => {
              const updated = { ...current };
              EMPLOYEES.forEach((emp) => {
                updated[emp.id] = {
                  employeeId: emp.id,
                  level: emp.level,
                  xp: emp.xp,
                  xpToNextLevel: emp.xpToNextLevel,
                  tasksCompleted: emp.tasksCompleted,
                  specializations: emp.specialization,
                  unlockedAbilities: [],
                  recentAchievements: [],
                };
              });
              saveGrowthState(updated);
            });
            alert('💸 Payroll Sent!\nDistributed salaries and weekend double-pay bonuses to all employees. Team satisfaction +100%! (+50 XP rewarded) 💰');
            setPayrollTrigger((prev) => prev + 1);
          }}
        >
          💵 Pay Payroll
        </button>

        <div className="archco-clock">
          <span className="archco-daynight" aria-hidden="true">
            {timeState.hour >= 6 && timeState.hour < 18 ? '☀️' : '🌙'}
          </span>
          <span className="archco-time">{formatClock(timeState)}</span>
          <span className="archco-day">{timeState.dayOfWeek.slice(0, 3)}</span>
        </div>
      </header>

      <div className="archco-floor-meta">
        <h2 className="archco-floor-name">{config ? config.name : 'Outside · ArchCo HQ'}</h2>
        <p className="archco-floor-desc">
          {config ? config.description : 'Front entrance, street & weather'}
        </p>
      </div>

      <div className="archco-stage">
        <div key={activeFloor} className={`archco-slide slide-${slideDir}`}>
          {activeFloor === 0 ? (
            <OutsideScene timeState={timeState} isOffDuty={isOffDuty} presentIds={presentIds} />
          ) : (
            <FloorScene
              floor={activeFloor}
              timeState={timeState}
              presentIds={presentIds}
              taskBadges={taskBadges}
              threatLevel={threatLevel}
              onSelect={(emp, status, thought) => {
                setSelected(emp);
                setSelectedStatus(status || null);
                setSelectedThought(thought || null);
              }}
              payrollTrigger={payrollTrigger}
              aiUpgradeTrigger={aiUpgradeTrigger}
              isOffDuty={isOffDuty}
              franState={tokenState.franState}
            />
          )}
        </div>

        {activeFloor === 5 && (
          <div className="archco-wiki-panel">
            <CompanyWiki />
          </div>
        )}

        {/* Fran's token monitor (Floor 1 FinOps) — shows real budget/usage. */}
        <TokenDisplay tokenState={tokenState} history={burnHistory} />
      </div>

      {selected && (
        <EmployeeProfile
          employee={selected}
          recentTasks={recentTasksByEmployee[selected.id]}
          currentStatus={selectedStatus || undefined}
          currentThought={selectedThought || undefined}
          onClose={() => {
            setSelected(null);
            setSelectedStatus(null);
            setSelectedThought(null);
          }}
        />
      )}
    </div>
  );
}
