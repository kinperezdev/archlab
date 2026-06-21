/**
 * Per-floor visual configuration for the ArchCo office scenes.
 */

import type { Floor } from './companyData.js';

export type FloorZone = string;

export interface FloorConfig {
  floor: Floor;
  name: string;
  description: string;
  backgroundColor: string;
  accentColor: string;
  wallColor: string;
  zones: FloorZone[];
  specialFeatures: string[];
}

export const FLOOR_CONFIGS: Record<Floor, FloorConfig> = {
  1: {
    floor: 1,
    name: 'Ground Floor',
    description: 'Reception, Leadership & Operations',
    backgroundColor: '#8F5E36', // Cozy oak wooden floor
    accentColor: '#F59E0B',
    wallColor: '#5A3E25', // Warm mahogany trim wall
    zones: ['reception', 'executive-offices', 'finops-desk', 'main-lobby', 'meeting-room-a'],
    specialFeatures: ['reception-bot', 'company-kanban-wall', 'token-counter-display', 'visitor-area'],
  },
  2: {
    floor: 2,
    name: 'Engineering Floor',
    description: 'Backend, Frontend & SRE',
    backgroundColor: '#1E2D3D', // Saturated steel slate blue floor
    accentColor: '#38BDF8',
    wallColor: '#121B24', // Iron dark lab wall
    zones: ['backend-wing', 'frontend-wing', 'sre-corner', 'engineering-meeting-room', 'code-review-station'],
    specialFeatures: ['multiple-monitors', 'build-status-board', 'deployment-pipeline-display', 'coffee-station'],
  },
  3: {
    floor: 3,
    name: 'Product & Design Floor',
    description: 'Product Management, Design & UX Research',
    backgroundColor: '#6D28D9', // Deep royal purple floor
    accentColor: '#F472B6',
    wallColor: '#4C1D95', // Rich dark violet wall
    zones: ['product-wing', 'design-studio', 'ux-research-lab', 'user-testing-room'],
    specialFeatures: ['design-wall', 'user-journey-maps', 'prototype-displays', 'mood-board'],
  },
  4: {
    floor: 4,
    name: 'Security & QA Floor',
    description: 'Security War Room & Quality Assurance',
    backgroundColor: '#7F1D1D', // Deep blood crimson floor
    accentColor: '#F87171',
    wallColor: '#4C0519', // Dark burgundy war-room wall
    zones: ['security-war-room', 'qa-testing-lab', 'penetration-testing-station', 'compliance-desk'],
    specialFeatures: ['threat-monitor-wall', 'vulnerability-scanner', 'red-alert-system', 'secure-terminal'],
  },
  5: {
    floor: 5,
    name: 'Executive Suite',
    description: 'CTO Office & Company Overview',
    backgroundColor: '#D97706', // Polished amber/gold cedar floor
    accentColor: '#FBBF24',
    wallColor: '#78350F', // Warm dark chestnut wall
    zones: ['cto-office', 'board-room', 'company-dashboard', 'roof-terrace'],
    specialFeatures: ['panoramic-view', 'company-metrics-wall', 'all-hands-room', 'trophy-case'],
  },
  6: {
    floor: 6,
    name: 'Founder Penthouse',
    description: 'Kin\'s Command Center & Global AI Brain',
    backgroundColor: '#065F46', // Deep zen forest moss green floor
    accentColor: '#34D399',
    wallColor: '#064E3B', // Dark evergreen panels
    zones: ['founders-desk', 'ai-command-station', 'coffee-bar', 'zen-balcony'],
    specialFeatures: ['retro-screens', 'brain-projection', 'interactive-console'],
  },
};

export const FLOOR_ORDER: Floor[] = [1, 2, 3, 4, 5, 6];
