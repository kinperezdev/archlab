/**
 * Infrastructure brain — tracks which infrastructure patterns appear across
 * every project ArchLab analyzes, and surfaces cross-project insights like
 * "you have used Redis in 3 projects but never added a dead letter queue".
 *
 * Stored alongside the rest of the brain in brain/infra-history.json. Never sent
 * anywhere; localhost only.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { BrainInsight, InfraNodeType, SystemDesignMap } from '@archlab/shared';
import { BRAIN_DIR } from './paths.js';

const INFRA_FILE = path.join(BRAIN_DIR, 'infra-history.json');

interface InfraRecord {
  projectId: string;
  name: string;
  /** Node types detected in this project. */
  types: InfraNodeType[];
  /** Suggestion types proposed (i.e. gaps) for this project. */
  gaps: InfraNodeType[];
}

interface InfraHistory {
  projects: InfraRecord[];
}

function load(): InfraHistory {
  try {
    if (fs.existsSync(INFRA_FILE)) return JSON.parse(fs.readFileSync(INFRA_FILE, 'utf8')) as InfraHistory;
  } catch {
    /* corrupt: rebuild */
  }
  return { projects: [] };
}

function save(history: InfraHistory): void {
  fs.mkdirSync(BRAIN_DIR, { recursive: true });
  fs.writeFileSync(INFRA_FILE, JSON.stringify(history, null, 2), 'utf8');
  console.log(`[Brain] wrote ${path.basename(INFRA_FILE)}`);
}

/** Fold one project's detected infrastructure into the cross-project history. */
export function recordInfra(projectId: string, name: string, map: SystemDesignMap): void {
  const history = load();
  const types = [...new Set(map.nodes.map((n) => n.type))];
  const gaps = [...new Set(map.suggestions.map((s) => s.type))];
  const next: InfraHistory = {
    projects: [...history.projects.filter((p) => p.projectId !== projectId), { projectId, name, types, gaps }],
  };
  save(next);
}

/** Cross-project infrastructure recommendations, surfaced in the brain panel. */
export function infraInsights(): BrainInsight[] {
  const history = load();
  const insights: BrainInsight[] = [];
  const count = (type: InfraNodeType, key: 'types' | 'gaps') =>
    history.projects.filter((p) => p[key].includes(type)).length;

  const redis = count('redis', 'types') + count('cache', 'types');
  if (redis >= 3 && count('dead-letter-queue', 'gaps') >= 1) {
    insights.push({
      id: 'infra:redis-no-dlq',
      severity: 'info',
      message: `You have used a cache/Redis layer in ${redis} projects but rarely add a dead letter queue — consider standardizing one in your queue setup.`,
    });
  }

  const noCdn = count('cdn', 'gaps');
  if (noCdn >= 3) {
    insights.push({
      id: 'infra:no-cdn',
      severity: 'info',
      message: `Your last ${noCdn} projects had no CDN layer — adding one is a recurring opportunity in your architecture.`,
    });
  }

  const publicBuckets = count('public-bucket', 'types');
  if (publicBuckets >= 2) {
    insights.push({
      id: 'infra:public-buckets',
      severity: 'medium',
      message: `Public storage buckets appeared in ${publicBuckets} projects — review whether they should be private with signed URLs.`,
    });
  }

  return insights;
}
