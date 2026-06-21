/**
 * Real-time day/night cycle for ArchCo. Derived from the user's local clock so
 * the office lighting and who is present track the actual time of day.
 */

import type { Employee } from './companyData.js';

export type TimeOfDay = 'dawn' | 'day' | 'evening' | 'night' | 'weekend';
export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface TimeState {
  hour: number;
  minute: number;
  dayOfWeek: DayOfWeek;
  timeOfDay: TimeOfDay;
  isWeekend: boolean;
  lightLevel: number; // 0-1
  officeOccupancy: number; // 0-1
}

export function getCurrentTimeState(): TimeState {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const day = now.getDay();
  const isWeekend = day === 0 || day === 6;

  const dayNames: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayOfWeek = dayNames[day];

  let timeOfDay: TimeOfDay;
  let lightLevel: number;
  let officeOccupancy: number;

  if (isWeekend) {
    timeOfDay = 'weekend';
    lightLevel = (hour >= 8 && hour < 18) ? 0.95 : 0.3;
    officeOccupancy = 0.05; // only on-call
  } else if (hour >= 5 && hour < 8) {
    timeOfDay = 'dawn';
    lightLevel = 0.4;
    officeOccupancy = 0.1; // early birds
  } else if (hour >= 8 && hour < 18) {
    timeOfDay = 'day';
    lightLevel = 1.0;
    officeOccupancy = 1.0; // full office
  } else if (hour >= 18 && hour < 22) {
    timeOfDay = 'evening';
    lightLevel = 0.6;
    officeOccupancy = 0.3; // some people staying late
  } else {
    timeOfDay = 'night';
    lightLevel = 0.2;
    officeOccupancy = 0.05; // only SREs on-call
  }

  return { hour, minute, dayOfWeek, timeOfDay, isWeekend, lightLevel, officeOccupancy };
}

/** Which employee ids are physically present given the current time. */
export function getPresentEmployees(timeState: TimeState, allEmployees: Employee[]): string[] {
  if (timeState.isWeekend) {
    if (timeState.lightLevel > 0.5) {
      return allEmployees.map((e) => e.id); // All present during weekend day shifts
    }
    return ['jordan-lee', 'sam-rivera']; // SREs always on-call at night
  }
  if (timeState.timeOfDay === 'night') {
    return ['jordan-lee', 'sam-rivera', 'sarah-chen']; // SRE + security on-call
  }
  if (timeState.timeOfDay === 'evening') {
    return allEmployees
      .filter((e) => ['marcus-webb', 'kai-nakamura', 'sarah-chen', 'jordan-lee', 'alex-chen', 'sam-rivera'].includes(e.id))
      .map((e) => e.id);
  }
  if (timeState.timeOfDay === 'dawn') {
    return ['alex-chen', 'marcus-webb', 'jordan-lee']; // early birds
  }
  return allEmployees.map((e) => e.id); // full office during day
}

/** Format the clock as HH:MM for the office display. */
export function formatClock(t: TimeState): string {
  return `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`;
}
