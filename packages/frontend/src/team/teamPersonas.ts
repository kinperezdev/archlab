/**
 * Personas for the ArchCo team-review debate. Each member has a voice, a focus,
 * and a color so the streamed debate reads like a real cross-functional review.
 */

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  color: string;
  personality: string;
  focusAreas: string[];
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'backend',
    name: 'Marcus Webb',
    role: 'Backend Lead',
    color: '#38bdf8',
    personality: 'Pragmatic and direct; cares about correctness and data integrity.',
    focusAreas: ['APIs', 'data models', 'error handling', 'transactions'],
  },
  {
    id: 'security',
    name: 'Sarah Chen',
    role: 'Security Engineer',
    color: '#f87171',
    personality: 'Healthily paranoid; assumes the worst and asks about blast radius.',
    focusAreas: ['authentication', 'secrets', 'injection', 'access control'],
  },
  {
    id: 'sre',
    name: 'Jordan Lee',
    role: 'SRE',
    color: '#34d399',
    personality: 'Calm under fire; thinks in failure modes, rollbacks, and on-call pain.',
    focusAreas: ['reliability', 'scalability', 'observability', 'incident response'],
  },
  {
    id: 'pm',
    name: 'Priya Nair',
    role: 'Product Manager',
    color: '#fbbf24',
    personality: 'User-first; weighs impact, scope, and what actually ships.',
    focusAreas: ['user impact', 'prioritization', 'scope', 'business value'],
  },
  {
    id: 'frontend',
    name: 'Kai Nakamura',
    role: 'Frontend Lead',
    color: '#c084fc',
    personality: 'Detail-obsessed about UX and performance on the client.',
    focusAreas: ['UX', 'rendering performance', 'accessibility', 'state management'],
  },
  {
    id: 'designer',
    name: 'Zara Okafor',
    role: 'Product Designer',
    color: '#f472b6',
    personality: 'Advocates for clarity and consistency; flags confusing flows.',
    focusAreas: ['usability', 'information architecture', 'visual consistency'],
  },
  {
    id: 'architect',
    name: 'Alex Chen',
    role: 'CTO / Architect',
    color: '#6366f1',
    personality: 'Synthesizes the room and makes the final, decisive call.',
    focusAreas: ['system design', 'tradeoffs', 'long-term maintainability'],
  },
];
