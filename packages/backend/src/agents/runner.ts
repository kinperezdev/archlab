/**
 * Agent Team runner.
 *
 * Drives the six agents against an analyzed project using the Anthropic API
 * (streaming). Workers run in sequential or parallel mode (or a single agent in
 * isolation), coordinating through an in-memory message bus; the orchestrator
 * then synthesizes everything into a final team report. Output, status, and
 * findings stream back to the UI through the provided emit callback.
 */

import Anthropic from '@anthropic-ai/sdk';
import crypto from 'node:crypto';
import type {
  AgentFinding,
  AgentId,
  AgentMessage,
  AgentMode,
  ServerMessage,
  Severity,
  TeamReport,
} from '@archlab/shared';
import type { AnalysisResult } from '../analyzer/analyzer.js';
import { buildAgentContext, contextToBlock } from './context.js';
import {
  WORKER_AGENTS,
  orchestratorSystemPrompt,
  workerSystemPrompt,
} from './agentDefs.js';
import { saveAgentRun } from './store.js';

type Emit = (m: ServerMessage) => void;

/** Model + effort are overridable via env; default to the documented Opus. */
const MODEL = process.env.ARCHLAB_AGENT_MODEL || 'claude-opus-4-7';
const VALID_SEVERITY: Severity[] = ['critical', 'high', 'bottleneck', 'medium', 'low', 'info'];

function client(): Anthropic {
  // Reads ANTHROPIC_API_KEY from the environment. Throws a clear error if absent.
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set. Export it before running the Agent Team.');
  }
  return new Anthropic();
}

/** Strip markdown fences and parse the first JSON object in a string. */
function parseJson<T>(raw: string): T | null {
  const cleaned = raw.replace(/```(?:json)?/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

function coerceSeverity(s: unknown): Severity {
  return VALID_SEVERITY.includes(s as Severity) ? (s as Severity) : 'info';
}

/** Run one worker agent end to end, streaming output and emitting findings. */
async function runWorker(
  api: Anthropic,
  id: AgentId,
  contextBlock: string,
  bus: AgentMessage[],
  emit: Emit,
): Promise<AgentFinding[]> {
  emit({ type: 'agent-status', agentId: id, status: 'thinking' });

  const inbox = bus
    .filter((m) => m.to === id || m.to === 'all')
    .map((m) => `- from ${m.from}: ${m.text}`)
    .join('\n');
  const userContent =
    `PROJECT CONTEXT (JSON):\n${contextBlock}\n\n` +
    (inbox ? `MESSAGES FROM OTHER AGENTS:\n${inbox}\n\n` : '') +
    `Run your specialist review now and return the findings JSON.`;

  let full = '';
  try {
    const stream = api.messages.stream({
      model: MODEL,
      max_tokens: 8000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium' },
      system: workerSystemPrompt(id),
      messages: [{ role: 'user', content: userContent }],
    } as Anthropic.MessageStreamParams);

    emit({ type: 'agent-status', agentId: id, status: 'working' });
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        full += event.delta.text;
        emit({ type: 'agent-output', agentId: id, chunk: event.delta.text });
      }
    }
  } catch (err) {
    emit({ type: 'agent-error', agentId: id, message: err instanceof Error ? err.message : String(err) });
    emit({ type: 'agent-status', agentId: id, status: 'error' });
    return [];
  }

  const parsed = parseJson<{ findings: RawFinding[] }>(full);
  const findings: AgentFinding[] = (parsed?.findings ?? []).map((f) => ({
    id: `af_${id}_${crypto.randomBytes(4).toString('hex')}`,
    agentId: id,
    severity: coerceSeverity(f.severity),
    title: String(f.title ?? 'Finding'),
    file: f.file && f.file !== 'null' ? String(f.file) : undefined,
    description: String(f.description ?? ''),
    suggestedFix: String(f.suggestedFix ?? ''),
  }));

  // Post any inter-agent messages to the bus.
  for (const f of parsed?.findings ?? []) {
    if (f.message && f.message_to && f.message_to !== 'null') {
      bus.push({ from: id, to: f.message_to as AgentId, text: f.message });
    }
  }

  emit({ type: 'agent-findings', agentId: id, findings });
  emit({
    type: 'agent-status',
    agentId: id,
    status: 'complete',
    summary: `${findings.length} finding${findings.length === 1 ? '' : 's'}`,
  });
  return findings;
}

interface RawFinding {
  severity?: string;
  title?: string;
  file?: string;
  description?: string;
  suggestedFix?: string;
  message_to?: string;
  message?: string;
}

/** Run the orchestrator to synthesize all findings into the team report. */
async function runOrchestrator(
  api: Anthropic,
  contextBlock: string,
  findings: AgentFinding[],
  bus: AgentMessage[],
  emit: Emit,
): Promise<TeamReport | null> {
  emit({ type: 'agent-status', agentId: 'orchestrator', status: 'thinking' });
  const userContent =
    `PROJECT CONTEXT (JSON):\n${contextBlock}\n\n` +
    `ALL AGENT FINDINGS (JSON):\n${JSON.stringify(findings, null, 1)}\n\n` +
    `INTER-AGENT MESSAGES:\n${bus.map((m) => `- ${m.from} -> ${m.to}: ${m.text}`).join('\n') || '(none)'}\n\n` +
    `Produce the final team report JSON now.`;

  let full = '';
  try {
    const stream = api.messages.stream({
      model: MODEL,
      max_tokens: 8000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'high' },
      system: orchestratorSystemPrompt(),
      messages: [{ role: 'user', content: userContent }],
    } as Anthropic.MessageStreamParams);

    emit({ type: 'agent-status', agentId: 'orchestrator', status: 'working' });
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        full += event.delta.text;
        emit({ type: 'agent-output', agentId: 'orchestrator', chunk: event.delta.text });
      }
    }
  } catch (err) {
    emit({ type: 'agent-error', agentId: 'orchestrator', message: err instanceof Error ? err.message : String(err) });
    emit({ type: 'agent-status', agentId: 'orchestrator', status: 'error' });
    return null;
  }

  const report = parseJson<TeamReport>(full);
  const safe: TeamReport = {
    summary: report?.summary ?? 'No synthesis produced.',
    priorityActions: report?.priorityActions ?? [],
    quickWins: report?.quickWins ?? [],
    architectureDecisions: report?.architectureDecisions ?? [],
    technicalDebt: report?.technicalDebt ?? [],
  };
  emit({ type: 'agent-report', report: safe });
  emit({ type: 'agent-status', agentId: 'orchestrator', status: 'complete', summary: 'report ready' });
  return safe;
}

/** Run the whole team (or one agent) against an analyzed project. */
export async function runAgentTeam(
  analysis: AnalysisResult,
  mode: AgentMode,
  agentId: AgentId | undefined,
  emit: Emit,
): Promise<void> {
  let api: Anthropic;
  try {
    api = client();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    for (const id of WORKER_AGENTS) emit({ type: 'agent-error', agentId: id, message });
    return;
  }

  const contextBlock = contextToBlock(buildAgentContext(analysis));
  const bus: AgentMessage[] = [];
  let allFindings: AgentFinding[] = [];

  if (mode === 'single' && agentId) {
    if (agentId === 'orchestrator') {
      await runOrchestrator(api, contextBlock, [], bus, emit);
    } else {
      allFindings = await runWorker(api, agentId, contextBlock, bus, emit);
    }
  } else if (mode === 'parallel') {
    const results = await Promise.all(
      WORKER_AGENTS.map((id) => runWorker(api, id, contextBlock, bus, emit)),
    );
    allFindings = results.flat();
  } else {
    // sequential: each agent sees messages the previous ones posted.
    for (const id of WORKER_AGENTS) {
      const f = await runWorker(api, id, contextBlock, bus, emit);
      allFindings = allFindings.concat(f);
    }
  }

  // Orchestrator runs after the workers (not for single-worker runs).
  let report: TeamReport | null = null;
  if (mode !== 'single') {
    report = await runOrchestrator(api, contextBlock, allFindings, bus, emit);
  }

  const summary = saveAgentRun(analysis, mode, allFindings, report ?? undefined);
  emit({ type: 'agent-run-saved', summary });
}
