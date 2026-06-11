/**
 * Brain store — reads, updates, and persists the global brain.
 *
 * Storage format: one JSON file (canonical state) plus per-project Markdown
 * living documents. The brain self-improves after every scan: new projects,
 * new patterns, and new cross-project insights are folded in here.
 */

import fs from 'node:fs';
import path from 'node:path';
import type {
  BrainInsight,
  BrainPattern,
  BrainProjectRecord,
  BrainState,
} from '@archlab/shared';
import { BRAIN_DIR, BRAIN_PROJECTS_DIR, BRAIN_STATE_FILE } from './paths.js';

/** Create a fresh, empty brain. */
function emptyBrain(): BrainState {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    projects: [],
    patterns: [],
    insights: [],
  };
}

/** Make sure the brain directories exist before any read/write. */
function ensureDirs(): void {
  fs.mkdirSync(BRAIN_DIR, { recursive: true });
  fs.mkdirSync(BRAIN_PROJECTS_DIR, { recursive: true });
}

/** Load the brain from disk, creating an empty one on first run. */
export function loadBrain(): BrainState {
  ensureDirs();
  if (!fs.existsSync(BRAIN_STATE_FILE)) {
    const fresh = emptyBrain();
    fs.writeFileSync(BRAIN_STATE_FILE, JSON.stringify(fresh, null, 2), 'utf8');
    return fresh;
  }
  try {
    return JSON.parse(fs.readFileSync(BRAIN_STATE_FILE, 'utf8')) as BrainState;
  } catch {
    // Corrupt brain file: never crash, fall back to empty and let it rebuild.
    return emptyBrain();
  }
}

/** Persist the brain state atomically (write temp, then rename). */
function saveBrain(state: BrainState): void {
  ensureDirs();
  state.updatedAt = new Date().toISOString();
  const tmp = `${BRAIN_STATE_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf8');
  fs.renameSync(tmp, BRAIN_STATE_FILE);
}

/**
 * Fold a freshly analyzed project into the brain. Returns the updated state.
 * This is where the brain "learns": it records the project, distills patterns
 * from the diagnostics, and surfaces cross-project insights.
 */
export function learnFromProject(record: BrainProjectRecord): BrainState {
  const state = loadBrain();

  // Replace any prior record for the same project (re-scans overwrite cleanly).
  const projects = state.projects.filter((p) => p.projectId !== record.projectId);
  projects.push(record);

  const patterns = distillPatterns(state.patterns, record);
  const insights = buildInsights(patterns);

  const next: BrainState = { ...state, projects, patterns, insights };
  saveBrain(next);
  writeLivingDocument(record);
  return next;
}

/** Turn this project's diagnostics into reusable cross-project patterns. */
function distillPatterns(
  existing: BrainPattern[],
  record: BrainProjectRecord,
): BrainPattern[] {
  // Clone so we never mutate the incoming array (immutability rule).
  const byId = new Map(existing.map((p) => [p.id, { ...p, occurrences: [...p.occurrences] }]));

  for (const diag of record.report.diagnostics) {
    // Bottlenecks merge by their TYPE (so "UNBOUNDED QUERY" aggregates across
    // projects regardless of which node it hit); everything else by step+title.
    const isBottleneck = diag.severity === 'bottleneck' && diag.bottleneckType;
    const id = isBottleneck
      ? `bottleneck:${slug(diag.bottleneckType!)}`
      : `${diag.step}:${slug(diag.title)}`;
    const prior = byId.get(id);
    if (prior) {
      if (!prior.occurrences.includes(record.projectId)) {
        prior.occurrences.push(record.projectId);
        prior.count += 1;
      }
      if (!prior.resolution && diag.howToFix) prior.resolution = diag.howToFix;
    } else {
      byId.set(id, {
        id,
        category: isBottleneck ? 'bottleneck' : diag.step,
        description: isBottleneck ? diag.bottleneckType! : diag.what,
        resolution: diag.howToFix,
        occurrences: [record.projectId],
        count: 1,
      });
    }
  }

  return [...byId.values()];
}

/** Surface a proactive insight for any pattern seen across multiple projects. */
function buildInsights(patterns: BrainPattern[]): BrainInsight[] {
  const insights: BrainInsight[] = [];
  for (const p of patterns) {
    const isBottleneck = p.category === 'bottleneck';
    // Bottleneck patterns surface once seen in 3+ projects; others at 2+.
    const threshold = isBottleneck ? 3 : 2;
    if (p.count < threshold) continue;
    insights.push({
      id: `insight:${p.id}`,
      patternId: p.id,
      severity: 'info',
      message: isBottleneck
        ? `${p.description} detected across ${p.count} projects — this is a recurring pattern in your architecture.`
        : `${p.description} — observed across ${p.count} projects.`,
    });
  }
  return insights;
}

/** Write/refresh the per-project living architecture document (Markdown). */
function writeLivingDocument(record: BrainProjectRecord): void {
  const file = path.join(BRAIN_PROJECTS_DIR, `${slug(record.name)}.md`);
  const lines: string[] = [];
  lines.push(`# ${record.name}`);
  lines.push('');
  lines.push(`_Last analyzed: ${record.analyzedAt}_`);
  lines.push('');
  lines.push('## Summary');
  lines.push(record.intelligence.summary);
  lines.push('');
  lines.push('## Tech Stack');
  lines.push(record.intelligence.techStack.map((t) => `- ${t}`).join('\n') || '- (none detected)');
  lines.push('');
  lines.push('## Current Features');
  lines.push(record.intelligence.currentFeatures.map((f) => `- ${f}`).join('\n') || '- (none)');
  lines.push('');
  lines.push('## Recommended Next Steps');
  lines.push(
    record.intelligence.suggestedFeatures.map((f) => `- ${f}`).join('\n') || '- (none)',
  );
  lines.push('');
  lines.push('## Open Diagnostics');
  for (const d of record.report.diagnostics) {
    lines.push(`- **[${d.severity.toUpperCase()}] ${d.title}** — ${d.what}`);
  }
  lines.push('');
  fs.writeFileSync(file, lines.join('\n'), 'utf8');
}

/** Lowercase kebab slug helper. */
function slug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
