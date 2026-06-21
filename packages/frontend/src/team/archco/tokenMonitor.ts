/**
 * Token budget monitor — Fran Torres's domain on Floor 1.
 *
 * Tracks burn rate against a session budget and maps the result to Fran's
 * emotional state and on-screen message. Pure functions only; the component
 * layer renders the graph and the panic walk.
 */

export type TokenAlertLevel = 'healthy' | 'warning' | 'critical' | 'depleted';

export type FranState = 'relaxed' | 'alert' | 'panicking' | 'fainted';

export interface TokenState {
  budget: number;
  used: number;
  remaining: number;
  burnRate: number; // tokens per minute
  estimatedMinutesLeft: number;
  alertLevel: TokenAlertLevel;
  franState: FranState;
  franMessage: string;
}

export function calculateTokenState(
  budget: number,
  used: number,
  sessionStartTime: number,
): TokenState {
  const remaining = budget - used;
  const percentageUsed = budget > 0 ? used / budget : 0;
  const elapsedMinutes = (Date.now() - sessionStartTime) / 60000;
  const burnRate = elapsedMinutes > 0 ? used / elapsedMinutes : 0;
  const estimatedMinutesLeft = burnRate > 0 ? remaining / burnRate : Infinity;

  let alertLevel: TokenAlertLevel;
  let franState: FranState;
  let franMessage: string;

  if (remaining <= 0) {
    alertLevel = 'depleted';
    franState = 'fainted';
    franMessage = '💀 Budget depleted! Session saved. Add more tokens to continue.';
  } else if (percentageUsed < 0.5) {
    alertLevel = 'healthy';
    franState = 'relaxed';
    franMessage = 'Budget looking good! ☕';
  } else if (percentageUsed < 0.75) {
    alertLevel = 'warning';
    franState = 'alert';
    franMessage = `⚠️ 50% budget used! ~${Math.round(estimatedMinutesLeft)}min left`;
  } else if (percentageUsed < 0.9) {
    alertLevel = 'critical';
    franState = 'panicking';
    franMessage = '🚨 MAYDAY! 75% tokens used! Wrapping up critical items only!';
  } else {
    alertLevel = 'critical';
    franState = 'panicking';
    franMessage = '🚨 90% tokens used! EMERGENCY STOP after current item!';
  }

  return {
    budget,
    used,
    remaining,
    burnRate,
    estimatedMinutesLeft,
    alertLevel,
    franState,
    franMessage,
  };
}

/** Append a sample to a rolling burn-rate history, capped to `max` points. */
export function pushBurnSample(
  history: ReadonlyArray<number>,
  sample: number,
  max = 60,
): number[] {
  const next = [...history, sample];
  return next.length > max ? next.slice(next.length - max) : next;
}

export const ALERT_COLORS: Record<TokenAlertLevel, string> = {
  healthy: '#34D399',
  warning: '#FBBF24',
  critical: '#F87171',
  depleted: '#7F1D1D',
};
