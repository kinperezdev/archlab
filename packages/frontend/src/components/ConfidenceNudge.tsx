/**
 * Honest confidence indicators.
 *
 * Small, never-blocking nudges that tell the user whether what they see is
 * statically proven or AI-enhanced. Amber = needs AI, green = AI complete,
 * muted gray/slate = static label. All text is 11px and never bold.
 */

import type { ReactNode } from 'react';

export type NudgeTone = 'amber' | 'green' | 'muted';

const TONE_COLOR: Record<NudgeTone, string> = {
  amber: '#F59E0B',
  green: '#22C55E',
  muted: '#64748B',
};

/** Inline confidence text. When `onClick` is set it renders as a clickable cue. */
export function NudgeText({
  tone,
  onClick,
  children,
  title,
}: {
  tone: NudgeTone;
  onClick?: () => void;
  children: ReactNode;
  title?: string;
}) {
  const clickable = Boolean(onClick);
  return (
    <span
      className={`confidence-nudge${clickable ? ' nudge-clickable' : ''}`}
      style={{ color: TONE_COLOR[tone] }}
      title={title}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      {children}
    </span>
  );
}

/** A slim informational card with an amber (needs-AI) or green (complete) accent. */
export function NudgeCard({
  tone,
  children,
}: {
  tone: NudgeTone;
  children: ReactNode;
}) {
  return (
    <div className={`confidence-nudge-card nudge-card-${tone}`} style={{ ['--nudge-accent' as string]: TONE_COLOR[tone] }}>
      {children}
    </div>
  );
}

/** Small confidence badge (STATIC / AI + STATIC / AI). */
export function ConfidenceBadge({
  tone,
  children,
}: {
  tone: 'static-blue' | 'green' | 'indigo' | 'gray';
  children: ReactNode;
}) {
  return <span className={`confidence-badge cb-${tone}`}>{children}</span>;
}
