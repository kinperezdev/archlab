/**
 * Employee profile card overlay.
 *
 * Opens when an employee is clicked. Shows the sprite, level + XP bar, stats,
 * specializations, unlocked abilities, recent activity, and personality. All
 * derived from the static roster merged with any persisted growth state.
 */

import { useState, type ReactNode } from 'react';
import type { Employee } from './companyData.js';
import { getLivingData, type EmployeeMood } from './employeeLivingStore.js';
import {
  levelForXp,
  levelProgress,
  titleForLevel,
  UNLOCKABLE_ABILITIES,
  type Achievement,
} from './growthSystem.js';

const MOOD_EMOJI: Record<EmployeeMood, string> = {
  focused: '🎯',
  excited: '🤩',
  concerned: '😟',
  frustrated: '😤',
  satisfied: '😌',
  curious: '🤔',
};

type ProfileTab = 'overview' | 'knowledge' | 'history' | 'relationships' | 'growth';

interface EmployeeProfileProps {
  employee: Employee;
  recentTasks?: string[];
  recentAchievements?: Achievement[];
  currentStatus?: string;
  currentThought?: string;
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
  currentStatus,
  currentThought,
  onClose,
  onViewHistory,
}: EmployeeProfileProps) {
  const living = getLivingData(employee.id);
  const xp = living?.xp ?? employee.xp;
  const level = Math.max(living?.level ?? employee.level, levelForXp(xp));
  const title = titleForLevel(level);
  const progress = Math.round(levelProgress(xp) * 100);
  const abilities = abilitiesUpToLevel(level);
  const [tab, setTab] = useState<ProfileTab>('overview');
  const personality = living?.evolvedPersonality || employee.personality;
  const mood = living?.currentMood ?? 'focused';

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
            <div className="archco-profile-tabs">
              {(['overview', 'knowledge', 'history', 'relationships', 'growth'] as ProfileTab[]).map((t) => (
                <button
                  key={t}
                  className={`archco-profile-tab${tab === t ? ' active' : ''}`}
                  onClick={() => setTab(t)}
                >
                  {t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {tab === 'overview' && (
              <>
                <div className="archco-xp-row">
                  <span className="archco-xp-text">{xp.toLocaleString()} XP · Lv {level}</span>
                  <div className="archco-xp-bar">
                    <div className="archco-xp-fill" style={{ width: `${progress}%`, background: employee.color }} />
                  </div>
                </div>
                <div className="archco-profile-stats">
                  <Stat label="Mood" value={`${MOOD_EMOJI[mood]} ${mood}`} />
                  <Stat label="Level" value={String(level)} />
                  <Stat label="Status" value={currentStatus || employee.status} />
                </div>
                {(living?.moodReason || currentThought) && (
                  <Section title={living?.moodReason ? 'Mood' : 'Current Thought'}>
                    <p className="archco-profile-personality">"{living?.moodReason || currentThought}"</p>
                  </Section>
                )}
                <Section title="Personality">
                  <p className="archco-profile-personality">{personality}</p>
                  <div className="archco-catchphrases">
                    {(living?.evolvedCatchphrases ?? employee.catchphrases).map((c) => (
                      <span key={c} className="archco-catchphrase">“{c}”</span>
                    ))}
                  </div>
                </Section>
                <Section title="Specializations">
                  <div className="archco-pill-row">
                    {employee.specialization.map((s) => (
                      <span key={s} className="archco-pill">{s}</span>
                    ))}
                  </div>
                </Section>
              </>
            )}

            {tab === 'knowledge' && (
              <>
                <Section title={`Knowledge Level · ${living?.knowledgeLevel ?? 1}/10`}>
                  <div className="archco-xp-bar">
                    <div className="archco-xp-fill" style={{ width: `${((living?.knowledgeLevel ?? 1) / 10) * 100}%`, background: employee.color }} />
                  </div>
                </Section>
                <Section title="Current Opinions">
                  {(living?.currentOpinions?.length ?? 0) === 0 ? (
                    <span className="archco-muted">No opinions yet — run an AI Update.</span>
                  ) : (
                    living!.currentOpinions.map((o, i) => (
                      <div key={i} className="archco-catchphrase" style={{ display: 'block', marginBottom: '4px' }}>“{o}”</div>
                    ))
                  )}
                </Section>
                <Section title="Learned Patterns">
                  <div className="archco-pill-row">
                    {(living?.learnedPatterns ?? []).map((p, i) => <span key={i} className="archco-pill">{p}</span>)}
                    {(living?.learnedPatterns?.length ?? 0) === 0 && <span className="archco-muted">None yet.</span>}
                  </div>
                </Section>
                <Section title="Special Insights">
                  {(living?.specialInsights?.length ?? 0) === 0 ? (
                    <span className="archco-muted">None yet.</span>
                  ) : (
                    living!.specialInsights.map((s, i) => <p key={i} className="archco-profile-personality">• {s}</p>)
                  )}
                </Section>
              </>
            )}

            {tab === 'history' && (
              <>
                <Section title="AI Updates">
                  <p className="archco-profile-personality">
                    {living?.aiUpdateCount ?? 0} update{(living?.aiUpdateCount ?? 0) === 1 ? '' : 's'}
                    {living?.lastAIUpdate ? ` · last ${new Date(living.lastAIUpdate).toLocaleString()}` : ''}
                  </p>
                </Section>
                <Section title="Conversation History">
                  {(living?.conversationHistory?.length ?? 0) === 0 ? (
                    <span className="archco-muted">No conversations recorded yet.</span>
                  ) : (
                    <ul className="archco-activity">
                      {living!.conversationHistory.slice(0, 10).map((c, i) => (
                        <li key={i}>{c.topic} · with {c.withEmployeeId} · {new Date(c.occurredAt).toLocaleDateString()}</li>
                      ))}
                    </ul>
                  )}
                </Section>
              </>
            )}

            {tab === 'relationships' && (
              <>
                <Section title="Closest Colleagues">
                  <div className="archco-pill-row">
                    {(living?.closestColleagues?.length ?? 0) === 0 ? (
                      <span className="archco-muted">No close ties yet.</span>
                    ) : (
                      living!.closestColleagues.map((c) => <span key={c} className="archco-pill">{c}</span>)
                    )}
                  </div>
                </Section>
                <Section title="Recent Tasks">
                  {(living?.recentTasks?.length ?? 0) === 0 ? (
                    recentTasks.length === 0 ? (
                      <span className="archco-muted">No recent tasks.</span>
                    ) : (
                      <ul className="archco-activity">{recentTasks.slice(0, 5).map((t, i) => <li key={i}>{t}</li>)}</ul>
                    )
                  ) : (
                    <ul className="archco-activity">
                      {living!.recentTasks.slice(0, 8).map((t, i) => (
                        <li key={i}>{t.taskTitle} · +{t.xpEarned} XP</li>
                      ))}
                    </ul>
                  )}
                </Section>
              </>
            )}

            {tab === 'growth' && (
              <>
                <Section title="Unlocked Abilities">
                  <div className="archco-pill-row">
                    {abilities.length === 0 ? (
                      <span className="archco-muted">None yet — keep shipping.</span>
                    ) : (
                      abilities.map((a) => (
                        <span key={a} className="archco-pill archco-pill-ability">{a.replace(/-/g, ' ')}</span>
                      ))
                    )}
                  </div>
                </Section>
                {recentAchievements.length > 0 && (
                  <Section title="Achievements">
                    <div className="archco-pill-row">
                      {recentAchievements.map((a) => (
                        <span key={a.id} className="archco-pill archco-pill-achievement">{a.icon} {a.title}</span>
                      ))}
                    </div>
                  </Section>
                )}
                <Section title="AI Update History">
                  {(living?.aiUpdateHistory?.length ?? 0) === 0 ? (
                    <span className="archco-muted">No AI updates yet.</span>
                  ) : (
                    <ul className="archco-activity">
                      {living!.aiUpdateHistory.slice(-8).reverse().map((h, i) => (
                        <li key={i}>{new Date(h.updatedAt).toLocaleDateString()} · {h.provider} · {h.moodBefore}→{h.moodAfter} · {h.tokensUsed} tok</li>
                      ))}
                    </ul>
                  )}
                </Section>
              </>
            )}

            {onViewHistory && (
              <button className="archco-history-btn" onClick={() => onViewHistory(employee.id)}>
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
