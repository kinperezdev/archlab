/**
 * Agent run persistence + cross-run learning.
 *
 * Every agent-team run is saved to brain/agent-runs/<timestamp>.json with its
 * findings and report. Across runs, a finding the Security Agent reports 3+ times
 * is flagged as a persistent unresolved issue with rising urgency.
 */

import fs from 'node:fs';
import path from 'node:path';
import type {
  AgentFinding,
  AgentId,
  AgentMode,
  AgentRunSummary,
  TeamReport,
} from '@archlab/shared';
import type { AnalysisResult } from '../analyzer/analyzer.js';
import { BRAIN_DIR } from '../brain/paths.js';

const RUNS_DIR = path.join(BRAIN_DIR, 'agent-runs');

interface StoredRun extends AgentRunSummary {
  findings: AgentFinding[];
}

/** Persist one run and return its summary. */
export function saveAgentRun(
  analysis: AnalysisResult,
  mode: AgentMode,
  findings: AgentFinding[],
  report?: TeamReport,
): AgentRunSummary {
  fs.mkdirSync(RUNS_DIR, { recursive: true });
  const id = new Date().toISOString().replace(/[:.]/g, '-');

  const findingCounts: Partial<Record<AgentId, number>> = {};
  for (const f of findings) findingCounts[f.agentId] = (findingCounts[f.agentId] ?? 0) + 1;

  const summary: AgentRunSummary = {
    id,
    at: new Date().toISOString(),
    mode,
    projectId: analysis.projectId,
    projectName: analysis.name,
    findingCounts,
    totalFindings: findings.length,
    report,
  };

  const stored: StoredRun = { ...summary, findings };
  fs.writeFileSync(path.join(RUNS_DIR, `${id}.json`), JSON.stringify(stored, null, 2), 'utf8');
  return summary;
}

/** List every saved run, newest first. */
export function listAgentRuns(): AgentRunSummary[] {
  if (!fs.existsSync(RUNS_DIR)) return [];
  const runs: AgentRunSummary[] = [];
  for (const file of fs.readdirSync(RUNS_DIR)) {
    if (!file.endsWith('.json')) continue;
    try {
      const data = JSON.parse(fs.readFileSync(path.join(RUNS_DIR, file), 'utf8')) as StoredRun;
      const { findings: _omit, ...rest } = data;
      runs.push(rest);
    } catch {
      /* skip corrupt run file */
    }
  }
  return runs.sort((a, b) => b.at.localeCompare(a.at));
}

/**
 * Persistent unresolved issues: a (agent, title) pair seen in 3+ runs of the
 * same project. Urgency rises with the occurrence count.
 */
export interface PersistentIssue {
  agentId: AgentId;
  title: string;
  count: number;
  projectId: string;
}

export function persistentIssues(projectId: string, minCount = 3): PersistentIssue[] {
  if (!fs.existsSync(RUNS_DIR)) return [];
  const tally = new Map<string, PersistentIssue>();
  for (const file of fs.readdirSync(RUNS_DIR)) {
    if (!file.endsWith('.json')) continue;
    try {
      const run = JSON.parse(fs.readFileSync(path.join(RUNS_DIR, file), 'utf8')) as StoredRun;
      if (run.projectId !== projectId) continue;
      for (const f of run.findings) {
        const key = `${f.agentId}:${f.title.toLowerCase()}`;
        const prior = tally.get(key);
        if (prior) prior.count += 1;
        else tally.set(key, { agentId: f.agentId, title: f.title, count: 1, projectId });
      }
    } catch {
      /* skip */
    }
  }
  return [...tally.values()].filter((i) => i.count >= minCount).sort((a, b) => b.count - a.count);
}
