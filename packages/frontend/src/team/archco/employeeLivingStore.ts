/**
 * Per-employee "living data" store for ArchCo.
 *
 * Holds everything about an employee that evolves over time (personality, mood,
 * knowledge, opinions, conversations, growth). Backed by the Brain backend
 * (`/brain/archco/employees`) with an in-memory cache; falls back to defaults
 * (and localStorage on save) when the backend is unavailable.
 */

import { PORTS } from '@archlab/shared';
import { EMPLOYEES, type Employee } from './companyData.js';

export interface ConversationTopic {
  withEmployeeId: string;
  topic: string;
  messages: { speakerId: string; text: string }[];
  priority: 'urgent' | 'normal' | 'casual';
  generatedAt: number;
}

export interface ConversationRecord {
  withEmployeeId: string;
  messages: { speakerId: string; text: string }[];
  occurredAt: number;
  topic: string;
}

export interface TaskRecord {
  taskTitle: string;
  taskType: string;
  severity: string;
  completedAt: number;
  xpEarned: number;
}

export interface AIUpdateRecord {
  updatedAt: number;
  provider: string;
  previousPersonality: string;
  newPersonality: string;
  moodBefore: string;
  moodAfter: string;
  tokensUsed: number;
}

export type EmployeeMood =
  | 'focused'
  | 'excited'
  | 'concerned'
  | 'frustrated'
  | 'satisfied'
  | 'curious';

export interface EmployeeLivingData {
  employeeId: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  tasksCompleted: number;
  levelTitle: string;
  unlockedAbilities: string[];
  basePersonality: string;
  evolvedPersonality: string;
  currentMood: EmployeeMood;
  moodReason: string;
  knowledgeLevel: number;
  currentOpinions: string[];
  learnedPatterns: string[];
  specialInsights: string[];
  projectsAnalyzed: string[];
  evolvedCatchphrases: string[];
  conversationTopics: ConversationTopic[];
  conversationHistory: ConversationRecord[];
  closestColleagues: string[];
  recentTasks: TaskRecord[];
  currentTask: string;
  aiUpdateCount: number;
  lastAIUpdate: number;
  aiUpdateHistory: AIUpdateRecord[];
  hiredAt: number;
  lastActiveAt: number;
}

const BACKEND = `http://127.0.0.1:${PORTS.backend}`;
let store: Record<string, EmployeeLivingData> = {};

export function createDefaultLivingData(employee: Employee): EmployeeLivingData {
  return {
    employeeId: employee.id,
    level: employee.level ?? 1,
    xp: employee.xp ?? 0,
    xpToNextLevel: employee.xpToNextLevel ?? 500,
    tasksCompleted: employee.tasksCompleted ?? 0,
    levelTitle: 'Junior',
    unlockedAbilities: [],
    basePersonality: employee.personality,
    evolvedPersonality: employee.personality,
    currentMood: 'focused',
    moodReason: 'Ready to start the day',
    knowledgeLevel: 1,
    currentOpinions: [],
    learnedPatterns: [],
    specialInsights: [],
    projectsAnalyzed: [],
    evolvedCatchphrases: employee.catchphrases ?? [],
    conversationTopics: [],
    conversationHistory: [],
    closestColleagues: [],
    recentTasks: [],
    currentTask: '',
    aiUpdateCount: 0,
    lastAIUpdate: 0,
    aiUpdateHistory: [],
    hiredAt: Date.now(),
    lastActiveAt: Date.now(),
  };
}

/** Load all employees from the backend; seed defaults for any that are missing. */
export async function initializeLivingData(): Promise<void> {
  try {
    const res = await fetch(`${BACKEND}/brain/archco/employees`);
    if (res.ok) {
      const data = (await res.json()) as Record<string, EmployeeLivingData>;
      if (data && typeof data === 'object') store = data;
    }
  } catch {
    /* backend unavailable — use defaults */
  }
  for (const emp of EMPLOYEES) {
    if (!store[emp.id]) {
      store[emp.id] = createDefaultLivingData(emp);
      await saveLivingData(emp.id, store[emp.id]);
    }
  }
}

export function getLivingData(employeeId: string): EmployeeLivingData | null {
  return store[employeeId] ?? null;
}

export function getAllLivingData(): Record<string, EmployeeLivingData> {
  return store;
}

export async function saveLivingData(employeeId: string, data: EmployeeLivingData): Promise<void> {
  store[employeeId] = { ...data, lastActiveAt: Date.now() };
  try {
    await fetch(`${BACKEND}/brain/archco/employees/${employeeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(store[employeeId]),
    });
  } catch {
    try {
      localStorage.setItem(`archco-employee-${employeeId}`, JSON.stringify(store[employeeId]));
    } catch {
      /* storage full/unavailable */
    }
  }
}

export async function updateLivingData(
  employeeId: string,
  updates: Partial<EmployeeLivingData>,
): Promise<void> {
  const existing = store[employeeId];
  if (existing) await saveLivingData(employeeId, { ...existing, ...updates });
}

/** Record a finished conversation and promote frequent partners to "closest". */
export function addConversationRecord(
  employeeId: string,
  withEmployeeId: string,
  messages: { speakerId: string; text: string }[],
  topic: string,
): void {
  const data = store[employeeId];
  if (!data) return;
  data.conversationHistory.unshift({ withEmployeeId, messages, occurredAt: Date.now(), topic });
  if (data.conversationHistory.length > 50) {
    data.conversationHistory = data.conversationHistory.slice(0, 50);
  }
  const count = data.conversationHistory.filter((c) => c.withEmployeeId === withEmployeeId).length;
  if (count >= 3 && !data.closestColleagues.includes(withEmployeeId)) {
    data.closestColleagues.push(withEmployeeId);
  }
  void saveLivingData(employeeId, data);
}
