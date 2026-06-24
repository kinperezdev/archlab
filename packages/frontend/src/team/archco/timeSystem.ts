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

/** Leadership who stay through the evening regardless of stay-late odds. */
const ALWAYS_EVENING_PRESENT = ['alex-chen', 'jamie-park', 'fran-torres'];

/** Which employee ids are physically present given the current time. */
export function getPresentEmployees(timeState: TimeState, allEmployees: Employee[]): string[] {
  if (timeState.isWeekend) {
    if (timeState.lightLevel > 0.5) {
      return allEmployees.map((e) => e.id); // All present during weekend day shifts
    }
    return []; // Weekend nights: everyone has gone home
  }
  if (timeState.timeOfDay === 'night') {
    return ['jordan-lee', 'sam-rivera']; // weekday late night: SREs on-call only
  }
  if (timeState.timeOfDay === 'evening') {
    // Leadership stays through the evening (they do not leave at 6pm), on top of
    // the engineers/SREs/security who are typically still in.
    const eveningPresent = new Set<string>([
      ...ALWAYS_EVENING_PRESENT,
      'marcus-webb',
      'kai-nakamura',
      'sarah-chen',
      'jordan-lee',
      'sam-rivera',
    ]);
    return allEmployees.filter((e) => eveningPresent.has(e.id)).map((e) => e.id);
  }
  if (timeState.timeOfDay === 'dawn') {
    return ['alex-chen', 'marcus-webb', 'jordan-lee']; // early birds
  }
  return allEmployees.map((e) => e.id); // full office during day
}

export type Weather = 'clear' | 'cloudy' | 'rain';

/**
 * Time-tied weather for the outside scene: deterministic from the clock so it
 * reads as a believable day rather than flickering randomly.
 */
export function getWeather(t: TimeState): { kind: Weather; label: string; icon: string } {
  // Purely hour-based (local clock) so it's correct on weekends/nights too.
  const h = t.hour;
  if (h < 5 || h >= 19) return { kind: 'clear', label: 'Clear night', icon: '🌙' };
  if (h < 8) return { kind: 'cloudy', label: 'Morning mist', icon: '🌥️' };
  if (h < 12) return { kind: 'clear', label: 'Sunny', icon: '☀️' };
  if (h < 15) return { kind: 'cloudy', label: 'Partly cloudy', icon: '⛅' };
  if (h < 18) return { kind: 'rain', label: 'Light rain', icon: '🌧️' };
  return { kind: 'cloudy', label: 'Overcast evening', icon: '☁️' };
}

/** Small stable string hash for deterministic per-employee scheduling. */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** A stable seed for "today" so lateness is consistent within a day. */
function daySeed(t: TimeState): number {
  const now = new Date();
  return now.getFullYear() * 1000 + (now.getMonth() + 1) * 50 + now.getDate() + (t.isWeekend ? 7 : 0);
}

/**
 * Employees whose normal arrival hour is the current hour — they walk in from
 * the elevator this hour. (Anyone whose arrivalTime already passed is treated as
 * already at their desk.)
 */
export function generateMorningArrival(timeState: TimeState, employees: Employee[]): string[] {
  if (timeState.isWeekend) return [];
  return employees.filter((e) => (e.arrivalTime ?? 9) === timeState.hour).map((e) => e.id);
}

export type Lateness = 'mild' | 'moderate' | 'severe';

export interface LateEmployee {
  id: string;
  lateMinutes: number;
  severity: Lateness;
}

/**
 * Deterministically decide who is running late this morning and by how much.
 * Stable within a day. Only returns people whose late window overlaps "now", so
 * the panic arrival fires around the right time rather than all day.
 */
export function detectLateEmployees(timeState: TimeState, employees: Employee[]): LateEmployee[] {
  if (timeState.isWeekend) return [];
  const nowMin = timeState.hour * 60 + timeState.minute;
  const seed = daySeed(timeState);
  const out: LateEmployee[] = [];
  for (const e of employees) {
    const arrival = (e.arrivalTime ?? 9) * 60;
    // Disciplined / on-call people are rarely late; Tyler is the exception.
    const lateProb = e.id === 'tyler-brooks' ? 60 : Math.round((1 - (e.stayLateChance ?? 0.3)) * 22);
    if ((hashString(e.id) + seed) % 100 >= lateProb) continue;
    const lateMinutes = 5 + ((hashString(`${e.id}:late`) + seed) % 86);
    // Only "currently" late within the arrival → arrival+late window (+grace).
    if (nowMin < arrival || nowMin > arrival + lateMinutes + 10) continue;
    const severity: Lateness = lateMinutes < 30 ? 'mild' : lateMinutes < 60 ? 'moderate' : 'severe';
    out.push({ id: e.id, lateMinutes, severity });
  }
  return out;
}

/** Format the clock as HH:MM for the office display. */
export function formatClock(t: TimeState): string {
  const displayHour = t.hour % 12 || 12;
  const ampm = t.hour >= 12 ? 'PM' : 'AM';
  return `${String(displayHour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')} ${ampm}`;
}
