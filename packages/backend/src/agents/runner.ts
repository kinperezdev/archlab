/**
 * Agent Team runner.
 *
 * Drives the six agents against an analyzed project using Anthropic, OpenAI, or Gemini APIs.
 * Workers run in sequential or parallel mode (or a single agent in isolation), coordinating
 * through an in-memory message bus; the orchestrator then synthesizes everything into a final
 * team report. Output, status, and findings stream back to the UI through the provided emit callback.
 */

import Anthropic from '@anthropic-ai/sdk';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { BRAIN_DIR } from '../brain/paths.js';
import type {
  AgentFinding,
  AgentId,
  AgentMessage,
  AgentMode,
  Severity,
  TeamReport,
} from '@archlab/shared';
import type { Emit } from '../pipeline/pipeline.js';
import type { AnalysisResult } from '../analyzer/analyzer.js';
import { buildAgentContext, contextToBlock, retrieveBrainForTask } from './context.js';
import {
  WORKER_AGENTS,
  orchestratorSystemPrompt,
  workerSystemPrompt,
} from './agentDefs.js';

const VALID_SEVERITY: Severity[] = ['critical', 'high', 'bottleneck', 'medium', 'low', 'info'];
import { saveAgentRun, writeReportToProjectRoot, persistentIssues } from './store.js';
import { absorbAgentTeamFindings } from '../brain/brainStore.js';

// Global controller to abort active Agent Team runs.
let activeAbortController: AbortController | null = null;

export function abortAgentTeam(): void {
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
  }
}

function getProvider(): 'anthropic' | 'openai' | 'gemini' {
  // 1. Prioritize keys from api_keys.json configured in the UI
  const keysFile = path.join(BRAIN_DIR, 'api_keys.json');
  if (fs.existsSync(keysFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(keysFile, 'utf8'));
      if (data.anthropic && data.anthropic.trim()) return 'anthropic';
      if (data.openai && data.openai.trim()) return 'openai';
      if (data.gemini && data.gemini.trim()) return 'gemini';
    } catch {
      // ignore parsing error, fallback to env vars
    }
  }

  // 2. Fallback to system environment variables
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim()) return 'anthropic';
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim()) return 'openai';
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) return 'gemini';
  throw new Error('No AI API key found. Click the 🔑 API Keys button in the top bar to configure one.');
}

/** Helper for OpenAI-compatible completions streaming */
async function runOpenAiCompatibleStream(
  url: string,
  headers: Record<string, string>,
  body: any,
  onChunk: (text: string) => void
): Promise<string> {
  const signal = activeAbortController?.signal;
  const response = await fetch(url, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (${response.status}): ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('Response body is not readable');

  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    if (signal?.aborted) {
      throw new Error('Agent run stopped by user.');
    }
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') continue;
      if (trimmed.startsWith('data: ')) {
        try {
          const json = JSON.parse(trimmed.slice(6));
          const content = json.choices?.[0]?.delta?.content || '';
          if (content) {
            fullText += content;
            onChunk(content);
          }
        } catch {
          // ignore parsing error for partial lines
        }
      }
    }
  }
  return fullText;
}

/** Unified stream runner for Anthropic, OpenAI, and Gemini */
async function runProviderStream(
  systemPrompt: string,
  userContent: string,
  onChunk: (text: string) => void,
  isOrchestrator: boolean = false
): Promise<string> {
  const provider = getProvider();
  const signal = activeAbortController?.signal;

  if (provider === 'anthropic') {
    const api = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const params: any = {
      model: process.env.ARCHLAB_AGENT_MODEL || 'claude-3-7-sonnet-20250219',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    };
    if (params.model.includes('3-7-sonnet')) {
      params.max_tokens = 8000;
      params.thinking = { type: 'enabled', budget_tokens: isOrchestrator ? 4096 : 2048 };
    }
    const stream = api.messages.stream(params, signal ? { signal } : {});
    let fullText = '';
    for await (const event of stream) {
      if (signal?.aborted) {
        throw new Error('Agent run stopped by user.');
      }
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        fullText += event.delta.text;
        onChunk(event.delta.text);
      }
    }
    return fullText;
  }

  let url = '';
  let headers: Record<string, string> = {};
  let modelName = '';

  if (provider === 'gemini') {
    url = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
    headers = { 'Authorization': `Bearer ${process.env.GEMINI_API_KEY}` };
    modelName = process.env.ARCHLAB_AGENT_MODEL || 'gemini-2.5-flash';
  } else {
    url = 'https://api.openai.com/v1/chat/completions';
    headers = { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` };
    modelName = process.env.ARCHLAB_AGENT_MODEL || 'gpt-4o';
  }

  const body = {
    model: modelName,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ],
    stream: true
  };

  return runOpenAiCompatibleStream(url, headers, body, onChunk);
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
    emit({ type: 'agent-status', agentId: id, status: 'working' });
    full = await runProviderStream(
      workerSystemPrompt(id),
      userContent,
      (chunk) => emit({ type: 'agent-output', agentId: id, chunk }),
      false
    );
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
    emit({ type: 'agent-status', agentId: 'orchestrator', status: 'working' });
    full = await runProviderStream(
      orchestratorSystemPrompt(),
      userContent,
      (chunk) => emit({ type: 'agent-output', agentId: 'orchestrator', chunk }),
      true
    );
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
  // Abort any existing run first
  abortAgentTeam();
  activeAbortController = new AbortController();
  const signal = activeAbortController.signal;

  try {
    getProvider();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const affectedAgents = mode === 'single' && agentId ? [agentId] : WORKER_AGENTS;
    for (const id of affectedAgents) emit({ type: 'agent-error', agentId: id, message });
    activeAbortController = null;
    return;
  }

  let contextBlock = contextToBlock(buildAgentContext(analysis));

  // Retrieval-augment the prompt: pull only the brain chunks most relevant to
  // this project instead of relying solely on the full dump. Best-effort — a
  // retrieval failure must never block the agent run.
  try {
    const brainQuery = [analysis.name, analysis.techStack.join(' ')]
      .filter(Boolean)
      .join(' — ');
    const chunks = await retrieveBrainForTask(brainQuery, 6);
    if (chunks.length > 0) {
      const rag = chunks
        .map((c) => `- [${c.kind} · ${c.score}] ${c.text.replace(/\n/g, ' ')}`)
        .join('\n');
      contextBlock += `\n\nRELEVANT BRAIN (retrieved for this project):\n${rag}`;
    }
  } catch (err) {
    console.error('[RAG] brain retrieval for agent run failed', err);
  }

  const bus: AgentMessage[] = [];
  let allFindings: AgentFinding[] = [];

  try {
    if (mode === 'single' && agentId) {
      if (agentId === 'orchestrator') {
        await runOrchestrator(contextBlock, [], bus, emit);
      } else {
        allFindings = await runWorker(agentId, contextBlock, bus, emit);
      }
    } else if (mode === 'parallel') {
      const results = await Promise.all(
        WORKER_AGENTS.map(async (id) => {
          if (signal.aborted) return [];
          try {
            return await runWorker(id, contextBlock, bus, emit);
          } catch (err) {
            return [];
          }
        }),
      );
      allFindings = results.flat();
    } else {
      // sequential: each agent sees messages the previous ones posted.
      for (const id of WORKER_AGENTS) {
        if (signal.aborted) break;
        try {
          const f = await runWorker(id, contextBlock, bus, emit);
          allFindings = allFindings.concat(f);
        } catch (err) {
          // ignore individual worker error to keep sequential going unless aborted
        }
      }
    }

    if (signal.aborted) {
      const affectedAgents = mode === 'single' && agentId ? [agentId] : [...WORKER_AGENTS, 'orchestrator' as AgentId];
      for (const id of affectedAgents) {
        emit({ type: 'agent-error', agentId: id, message: 'Agent run stopped by user.' });
        emit({ type: 'agent-status', agentId: id, status: 'error' });
      }
      return;
    }

    // Orchestrator runs after the workers (not for single-worker runs).
    let report: TeamReport | null = null;
    if (mode !== 'single') {
      report = await runOrchestrator(contextBlock, allFindings, bus, emit);
    }

    if (signal.aborted) {
      const affectedAgents = mode === 'single' && agentId ? [agentId] : [...WORKER_AGENTS, 'orchestrator' as AgentId];
      for (const id of affectedAgents) {
        emit({ type: 'agent-error', agentId: id, message: 'Agent run stopped by user.' });
        emit({ type: 'agent-status', agentId: id, status: 'error' });
      }
      return;
    }

    // Auto-write the report to the project root when the orchestrator produced one.
    if (report) {
      try {
        const reportPath = writeReportToProjectRoot(analysis, report);
        emit({ type: 'agent-report-saved', path: reportPath });
      } catch {
        /* non-fatal: the user can still download it from the panel */
      }
    }

    const summary = saveAgentRun(analysis, mode, allFindings, report ?? undefined);
    try {
      absorbAgentTeamFindings(analysis.projectId, analysis.name, allFindings, report ?? undefined);
    } catch {
      /* non-fatal */
    }
    emit({ type: 'agent-run-saved', summary });
    emit({ type: 'agent-persistent-issues', issues: persistentIssues(analysis.projectId) });
  } finally {
    if (activeAbortController === activeAbortController) {
      activeAbortController = null;
    }
  }
}
