/**
 * Employee profile card overlay.
 *
 * Opens when an employee is clicked. Shows the sprite, level + XP bar, stats,
 * specializations, unlocked abilities, recent activity, and personality. All
 * derived from the static roster merged with any persisted growth state.
 */

import type { ReactNode } from 'react';
import type { Employee } from './companyData.js';
import {
  levelForXp,
  levelProgress,
  titleForLevel,
  UNLOCKABLE_ABILITIES,
  type Achievement,
} from './growthSystem.js';

interface EmployeeProfileProps {
  employee: Employee;
  recentTasks?: string[];
  recentAchievements?: Achievement[];
  onClose: () => void;
  onViewHistory?: (employeeId: string) => void;
}

function abilitiesUpToLevel(level: number): string[] {
  const out: string[] = [];
  for (let l = 0; l <= level; l++) {
    if (UNLOCKABLE_ABILITIES[l]) out.push(...UNLOCKABLE_ABILITIES[l]);
  }
  return out;
}

export function EmployeeProfile({
  employee,
  recentTasks = [],
  recentAchievements = [],
  onClose,
  onViewHistory,
}: EmployeeProfileProps) {
  const level = Math.max(employee.level, levelForXp(employee.xp));
  const title = titleForLevel(level);
  const progress = Math.round(levelProgress(employee.xp) * 100);
  const abilities = abilitiesUpToLevel(level);

  return (
    <div className="archco-profile-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className="archco-profile-card"
        style={{ borderColor: employee.color }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="archco-profile-close" onClick={onClose} aria-label="Close profile">
          ×
        </button>

        <div className="archco-profile-grid">
          <aside className="archco-profile-side">
            <div className="archco-profile-sprite" style={{ background: `${employee.color}22` }}>
              <SpritePreview employee={employee} />
            </div>
            <h3 className="archco-profile-name">{employee.name}</h3>
            <p className="archco-profile-role">{employee.role}</p>
            <span className="archco-profile-badge" style={{ background: employee.color }}>
              Lv {level} · {title}
            </span>
            <p className="archco-profile-dept">{employee.department.replace(/-/g, ' ')}</p>
          </aside>

          <div className="archco-profile-main">
            <div className="archco-xp-row">
              <span className="archco-xp-text">
                {employee.xp.toLocaleString()} XP · next: {employee.xpToNextLevel.toLocaleString()}
              </span>
              <div className="archco-xp-bar">
                <div
                  className="archco-xp-fill"
                  style={{ width: `${progress}%`, background: employee.color }}
                />
              </div>
            </div>

            <div className="archco-profile-stats">
              <Stat label="Tasks" value={employee.tasksCompleted.toLocaleString()} />
              <Stat label="Level" value={String(level)} />
              <Stat label="Status" value={employee.status} />
            </div>

            <Section title="Specializations">
              <div className="archco-pill-row">
                {employee.specialization.map((s) => (
                  <span key={s} className="archco-pill">
                    {s}
                  </span>
                ))}
              </div>
            </Section>

            <Section title="Unlocked Abilities">
              <div className="archco-pill-row">
                {abilities.length === 0 ? (
                  <span className="archco-muted">None yet — keep shipping.</span>
                ) : (
                  abilities.map((a) => (
                    <span key={a} className="archco-pill archco-pill-ability">
                      {a.replace(/-/g, ' ')}
                    </span>
                  ))
                )}
              </div>
            </Section>

            <Section title="Recent Activity">
              {recentTasks.length === 0 ? (
                <span className="archco-muted">No recent tasks recorded.</span>
              ) : (
                <ul className="archco-activity">
                  {recentTasks.slice(0, 5).map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              )}
            </Section>

            {recentAchievements.length > 0 && (
              <Section title="Achievements">
                <div className="archco-pill-row">
                  {recentAchievements.map((a) => (
                    <span key={a.id} className="archco-pill archco-pill-achievement">
                      {a.icon} {a.title}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            <Section title="Personality">
              <p className="archco-profile-personality">{employee.personality}</p>
              <div className="archco-catchphrases">
                {employee.catchphrases.map((c) => (
                  <span key={c} className="archco-catchphrase">
                    “{c}”
                  </span>
                ))}
              </div>
            </Section>

            {onViewHistory && (
              <button
                className="archco-history-btn"
                onClick={() => onViewHistory(employee.id)}
              >
                View History
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SpritePreview({ employee }: { employee: Employee }) {
  // Lightweight inline avatar so the profile does not depend on the scene grid.
  return (
    <svg width={72} height={90} viewBox="0 0 16 20" shapeRendering="crispEdges" aria-hidden="true">
      <rect x="4" y="11" width="8" height="7" rx="1.5" fill={employee.color} />
      <rect x="7" y="9.5" width="2" height="2" fill={employee.skinTone} />
      <rect x="5" y="4" width="6" height="6" rx="1.5" fill={employee.skinTone} />
      <rect x="4" y="1" width="8" height="3" fill={employee.hairColor} />
      <rect x="6.4" y="6.4" width="0.9" height="1" fill="#0F172A" />
      <rect x="8.7" y="6.4" width="0.9" height="1" fill="#0F172A" />
    </svg>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="archco-stat">
      <span className="archco-stat-value">{value}</span>
      <span className="archco-stat-label">{label}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="archco-section">
      <h4 className="archco-section-title">{title}</h4>
      {children}
    </div>
  );
}
