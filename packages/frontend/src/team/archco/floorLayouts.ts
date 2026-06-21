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
    backgroundColor: '#0D0D1A',
    accentColor: '#6366F1',
    wallColor: '#1E1E2E',
    zones: ['reception', 'executive-offices', 'finops-desk', 'main-lobby', 'meeting-room-a'],
    specialFeatures: ['reception-bot', 'company-kanban-wall', 'token-counter-display', 'visitor-area'],
  },
  2: {
    floor: 2,
    name: 'Engineering Floor',
    description: 'Backend, Frontend & SRE',
    backgroundColor: '#0A0A0F',
    accentColor: '#06B6D4',
    wallColor: '#1A1A2E',
    zones: ['backend-wing', 'frontend-wing', 'sre-corner', 'engineering-meeting-room', 'code-review-station'],
    specialFeatures: ['multiple-monitors', 'build-status-board', 'deployment-pipeline-display', 'coffee-station'],
  },
  3: {
    floor: 3,
    name: 'Product & Design Floor',
    description: 'Product Management, Design & UX Research',
    backgroundColor: '#0A0A0F',
    accentColor: '#A855F7',
    wallColor: '#1A1A2E',
    zones: ['product-wing', 'design-studio', 'ux-research-lab', 'user-testing-room'],
    specialFeatures: ['design-wall', 'user-journey-maps', 'prototype-displays', 'mood-board'],
  },
  4: {
    floor: 4,
    name: 'Security & QA Floor',
    description: 'Security War Room & Quality Assurance',
    backgroundColor: '#0F0A0A',
    accentColor: '#EF4444',
    wallColor: '#2E1A1A',
    zones: ['security-war-room', 'qa-testing-lab', 'penetration-testing-station', 'compliance-desk'],
    specialFeatures: ['threat-monitor-wall', 'vulnerability-scanner', 'red-alert-system', 'secure-terminal'],
  },
  5: {
    floor: 5,
    name: 'Executive Suite',
    description: 'CTO Office & Company Overview',
    backgroundColor: '#0D0D1A',
    accentColor: '#6366F1',
    wallColor: '#1E1E2E',
    zones: ['cto-office', 'board-room', 'company-dashboard', 'roof-terrace'],
    specialFeatures: ['panoramic-view', 'company-metrics-wall', 'all-hands-room', 'trophy-case'],
  },
};

export const FLOOR_ORDER: Floor[] = [1, 2, 3, 4, 5];
