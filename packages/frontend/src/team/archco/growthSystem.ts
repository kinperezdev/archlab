/**
 * XP and growth system for ArchCo employees.
 *
 * Each Team Review awards XP for the work an employee does. Crossing a level
 * threshold unlocks abilities and earns a title. State is persisted to the brain
 * via the backend (`/brain/archco-growth`).
 */

import { PORTS } from '@archlab/shared';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  earnedAt: number;
  icon: string;
}

export interface EmployeeGrowth {
  employeeId: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  tasksCompleted: number;
  specializations: string[];
  unlockedAbilities: string[];
  recentAchievements: Achievement[];
}

export const XP_REWARDS = {
  'critical-finding-reviewed': 150,
  'high-finding-reviewed': 80,
  'medium-finding-reviewed': 40,
  'low-finding-reviewed': 20,
  'brainstorm-item-added': 30,
  'fix-applied': 200,
  'simulation-run': 50,
  'debate-contribution': 25,
  'cross-project-insight': 100,
} as const;

export type XpRewardKey = keyof typeof XP_REWARDS;

export const LEVEL_THRESHOLDS = [
  0, 500, 1200, 2100, 3200, 4500, 6000, 7700, 9600, 11700, 14000,
];

export const LEVEL_TITLES = [
  'Intern',
  'Junior',
  'Mid-Level',
  'Senior',
  'Staff',
  'Principal',
  'Distinguished',
  'Fellow',
  'VP Engineering',
  'CTO',
  'Legend',
];

export const UNLOCKABLE_ABILITIES: Record<number, string[]> = {
  3: ['faster-review', 'pattern-recognition'],
  5: ['cross-project-memory', 'advanced-suggestions'],
  7: ['predictive-analysis', 'mentor-junior-team'],
  9: ['architectural-insights', 'company-wide-patterns'],
  10: ['legendary-wisdom', 'time-travel-debugging'],
};

/** Resolve the level index (0-based into LEVEL_THRESHOLDS) for a given XP total. */
export function levelForXp(xp: number): number {
  let level = 0;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i;
  }
  return level;
}

/** The title that corresponds to a level index, clamped to the title table. */
export function titleForLevel(level: number): string {
  return LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length - 1)];
}

/** Progress (0-1) toward the next level for a given XP total. */
export function levelProgress(xp: number): number {
  const level = levelForXp(xp);
  if (level >= LEVEL_THRESHOLDS.length - 1) return 1;
  const floor = LEVEL_THRESHOLDS[level];
  const ceil = LEVEL_THRESHOLDS[level + 1];
  return Math.max(0, Math.min(1, (xp - floor) / (ceil - floor)));
}

export interface LevelUpResult {
  newXP: number;
  newLevel: number;
  leveledUp: boolean;
  newAbilities: string[];
}

export function calculateLevelUp(currentXP: number, gainedXP: number): LevelUpResult {
  const newXP = currentXP + gainedXP;
  const currentLevel = levelForXp(currentXP);
  const newLevel = levelForXp(newXP);
  const leveledUp = newLevel > currentLevel;
  const newAbilities = leveledUp ? UNLOCKABLE_ABILITIES[newLevel] ?? [] : [];
  return { newXP, newLevel, leveledUp, newAbilities };
}

const GROWTH_ENDPOINT = `http://127.0.0.1:${PORTS.backend}/brain/archco-growth`;

export async function saveGrowthState(
  growth: Record<string, EmployeeGrowth>,
): Promise<void> {
  try {
    await fetch(GROWTH_ENDPOINT, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(growth),
    });
  } catch {
    // Growth state is best-effort; a failed persist must never break a review.
  }
}

export async function loadGrowthState(): Promise<Record<string, EmployeeGrowth>> {
  try {
    const res = await fetch(GROWTH_ENDPOINT);
    if (!res.ok) return {};
    const data = (await res.json()) as Record<string, EmployeeGrowth>;
    return data ?? {};
  } catch {
    return {};
  }
}
