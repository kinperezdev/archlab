/**
 * Agent Team panel.
 *
 * Slides in from the right (replacing the findings panel). Shows the six agents
 * with live status, a mode selector (Sequential / Parallel / Single), a Run
 * button, streaming per-agent output, findings cards (with Copy Prompt), the
 * orchestrator's team report (exportable to Markdown), and a run history.
 */

import { useEffect, useState } from 'react';
import type { AgentFinding, AgentId, AgentMode, ReportItem, TeamReport } from '@archlab/shared';
import type { AgentTeamState } from '../state/useArchLab.js';
import { CopyPromptButton } from '../components/CopyPromptButton.js';
import { FlickerLoader } from '../components/FlickerLoader.js';
import { AGENT_CATALOG, agentInfo } from './agentCatalog.js';

interface AgentTeamProps {
  team: AgentTeamState;
  projectName: string | null;
  hasProject: boolean;
  onRun: (mode: AgentMode, agentId?: AgentId) => void;
  onStop: () => void;
  onRequestRuns: () => void;
  onClose: () => void;
  /** Render as a full-surface tab (fills the content area) instead of a side panel. */
  embedded?: boolean;
}

const STATUS_LABEL: Record<string, string> = {
  idle: 'Idle',
  thinking: 'Thinking',
  working: 'Working',
  error: 'Error',
  complete: 'Complete',
};

export function AgentTeam({ team, projectName, hasProject, onRun, onStop, onRequestRuns, onClose, embedded = false }: AgentTeamProps) {
  const [mode, setMode] = useState<AgentMode>('sequential');
  const [single, setSingle] = useState<AgentId>('security');
  const [showHistory, setShowHistory] = useState(false);
  const [expanded, setExpanded] = useState<Set<AgentId>>(new Set());

  useEffect(() => {
    if (showHistory) onRequestRuns();
  }, [showHistory, onRequestRuns]);

  const toggle = (id: AgentId) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const run = () => {
    if (mode === 'single') onRun('single', single);
    else onRun(mode);
  };

  return (
    <aside className={`agent-panel${embedded ? ' agent-panel--embedded' : ''}`}>
      <header className="agent-panel-head">
        <div>
          <h3>Agent Team</h3>
          {projectName && <span className="agent-panel-project">{projectName}</span>}
        </div>
        <div className="agent-head-actions">
          <button
            className={`btn-ghost ${showHistory ? 'active' : ''}`}
            onClick={() => setShowHistory((s) => !s)}
          >
            {showHistory ? 'Agents' : 'History'}
          </button>
          <button className="code-icon-btn" onClick={onClose} title="Close">✕</button>
        </div>
      </header>

      <div className="agent-controls">
        <div className="agent-mode-row">
          {(['sequential', 'parallel', 'single'] as AgentMode[]).map((m) => (
            <button
              key={m}
              className={`agent-mode-btn ${mode === m ? 'active' : ''}`}
              onClick={() => setMode(m)}
            >
              {m[0].toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
        {mode === 'single' && (
          <select className="agent-single-select" value={single} onChange={(e) => setSingle(e.target.value as AgentId)}>
            {AGENT_CATALOG.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        )}
        <div className="agent-run-row">
          {team.running ? (
            <>
              <button
                className="btn btn-primary agent-run-btn"
                disabled
                style={{ opacity: 0.6, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <FlickerLoader size={13} on="#ffffff" off="rgba(255,255,255,0.25)" /> Running…
              </button>
              <button className="btn agent-stop-btn" onClick={onStop}>
                Stop
              </button>
            </>
          ) : (
            <button className="btn btn-primary agent-run-btn" disabled={!hasProject} onClick={run}>
              Run Agent Team
            </button>
          )}
        </div>
        {!hasProject && <p className="agent-hint">Analyze a project first to give the agents context.</p>}
      </div>

      {showHistory ? (
        <RunHistory team={team} />
      ) : (
        <div className="agent-list">
          {!team.running &&
            (() => {
              const allFindings = AGENT_CATALOG.flatMap((a) => team.agents[a.id].findings);
              if (allFindings.length === 0 && !team.report) return null;
              return (
                <MasterPrompt
                  findings={allFindings}
                  report={team.report ?? null}
                  projectName={projectName}
                />
              );
            })()}

          {AGENT_CATALOG.map((a) => {
            const st = team.agents[a.id];
            const lastRunAt = team.runs[0]?.at ?? null;
            return (
              <div key={a.id} className="agent-card" style={{ borderLeftColor: a.color }}>
                <button className="agent-card-head" onClick={() => toggle(a.id)}>
                  <span className="agent-card-glyph">{a.glyph}</span>
                  <span className="agent-card-name">{a.name}</span>
                  <span className="agent-card-status">
                    {st.summary ?? STATUS_LABEL[st.status]}
                  </span>
                  <span className={`agent-status-dot status-${st.status}`} />
                </button>
                <p className="agent-card-role">{a.role}</p>
                <p className="agent-card-meta">
                  {st.findings.length} finding{st.findings.length === 1 ? '' : 's'}
                  {lastRunAt && (
                    <> · last run {new Date(lastRunAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                  )}
                </p>

                {(st.status === 'thinking' || st.status === 'working' || st.status === 'error' || expanded.has(a.id)) && st.output && (
                  <pre className="agent-output">{st.output.slice(-4000)}</pre>
                )}

                {st.findings.length > 0 && (
                  <div className="agent-findings">
                    {st.findings.map((f) => (
                      <FindingCard key={f.id} finding={f} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {team.report && <TeamReportView report={team.report} projectName={projectName} />}
        </div>
      )}
    </aside>
  );
}

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info'];

/**
 * Compile every agent finding plus the orchestrator report into one
 * comprehensive, copy-paste prompt for a coding agent to execute the fixes.
 */
function buildMasterPrompt(
  findings: AgentFinding[],
  report: TeamReport | null,
  projectName: string | null,
): string {
  const sorted = [...findings].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
  );
  const lines: string[] = [];

  lines.push(
    `You are a senior engineer fixing the project${projectName ? ` "${projectName}"` : ''}.`,
  );
  lines.push(
    'ArchLab\'s Agent Team analyzed the codebase and produced the findings below. Implement all of the fixes with minimal, well-scoped changes. Preserve existing behavior, follow the project\'s conventions, and work in priority order (critical → high → medium → low). If a finding is a false positive, say why and skip it.',
  );

  if (report?.summary) {
    lines.push('', '## Summary', report.summary);
  }

  if (sorted.length > 0) {
    lines.push('', '## Findings to fix');
    sorted.forEach((f, i) => {
      lines.push(`${i + 1}. [${f.severity.toUpperCase()}] ${f.title}`);
      if (f.file) lines.push(`   - File: ${f.file}`);
      if (f.description) lines.push(`   - Problem: ${f.description}`);
      if (f.suggestedFix) lines.push(`   - Suggested fix: ${f.suggestedFix}`);
      lines.push(`   - Found by: ${agentInfo(f.agentId).name}`);
    });
  }

  const section = (title: string, items?: ReportItem[]) => {
    if (!items || items.length === 0) return;
    lines.push('', `## ${title}`);
    items.forEach((it) =>
      lines.push(`- ${it.title}${it.effort ? ` (${it.effort})` : ''}: ${it.detail}`),
    );
  };
  if (report) {
    section('Priority Actions', report.priorityActions);
    section('Quick Wins', report.quickWins);
  }

  lines.push(
    '',
    '## Deliverable',
    'For each fix: briefly explain the change, apply it, and note any follow-up tests to add. Group related edits and keep diffs reviewable.',
  );

  return lines.join('\n');
}

/** The consolidated "master fix prompt" card shown after a run completes. */
function MasterPrompt({
  findings,
  report,
  projectName,
}: {
  findings: AgentFinding[];
  report: TeamReport | null;
  projectName: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const prompt = buildMasterPrompt(findings, report, projectName);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked; the text is still visible below */
    }
  };

  return (
    <div className="master-prompt">
      <div className="master-prompt-head">
        <span className="master-prompt-title">⚡ Master Fix Prompt</span>
        <span className="master-prompt-sub">{findings.length} findings · ready to paste</span>
        <button className="btn btn-primary master-prompt-copy" onClick={copy}>
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
      <pre className="master-prompt-body">{prompt}</pre>
    </div>
  );
}

function FindingCard({ finding }: { finding: AgentFinding }) {
  const prompt = () =>
    `In file ${finding.file ?? '(project-wide)'}, address this ${finding.severity} issue found by the ${agentInfo(finding.agentId).name}:\n\n${finding.title}\n${finding.description}\n\nSuggested fix: ${finding.suggestedFix}`;
  return (
    <div className={`agent-finding sev-${finding.severity}`}>
      <div className="agent-finding-head">
        <span className="agent-finding-badge" style={{ background: agentInfo(finding.agentId).color }}>
          {agentInfo(finding.agentId).name}
        </span>
        <span className={`agent-sev sev-${finding.severity}`}>{finding.severity}</span>
        <CopyPromptButton compact prompt={prompt} />
      </div>
      <div className="agent-finding-title">{finding.title}</div>
      {finding.file && <div className="agent-finding-file">{finding.file}</div>}
      <p className="agent-finding-desc">{finding.description}</p>
      {finding.suggestedFix && <p className="agent-finding-fix">Fix: {finding.suggestedFix}</p>}
    </div>
  );
}

function ReportSection({ title, items }: { title: string; items: ReportItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="report-section">
      <h5>{title}</h5>
      {items.map((it, i) => (
        <div key={i} className="report-item">
          <div className="report-item-head">
            <span className="report-item-title">{it.title}</span>
            {it.effort && <span className="report-effort">{it.effort}</span>}
            <CopyPromptButton compact prompt={`${it.title}\n\n${it.detail}`} />
          </div>
          <p className="report-item-detail">{it.detail}</p>
        </div>
      ))}
    </div>
  );
}

function TeamReportView({ report, projectName }: { report: TeamReport; projectName: string | null }) {
  const exportMd = () => {
    const md = reportToMarkdown(report, projectName);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-team-report-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="team-report">
      <div className="team-report-head">
        <h4>Team Report</h4>
        <button className="btn" onClick={exportMd} title="Save a copy to your Downloads folder">Download</button>
      </div>
      <p className="team-report-summary">{report.summary}</p>
      <ReportSection title="Priority Actions" items={report.priorityActions} />
      <ReportSection title="Quick Wins" items={report.quickWins} />
      <ReportSection title="Architecture Decisions" items={report.architectureDecisions} />
      <ReportSection title="Technical Debt Map" items={report.technicalDebt} />
    </div>
  );
}

function RunHistory({ team }: { team: AgentTeamState }) {
  if (team.runs.length === 0) return <p className="agent-hint">No agent runs saved yet.</p>;
  return (
    <div className="agent-history">
      {team.runs.map((r) => (
        <div key={r.id} className="agent-history-row">
          <div className="agent-history-top">
            <span className="agent-history-mode">{r.mode}</span>
            <span className="agent-history-time">{new Date(r.at).toLocaleString()}</span>
          </div>
          <div className="agent-history-meta">
            {r.projectName} · {r.totalFindings} finding{r.totalFindings === 1 ? '' : 's'}
          </div>
        </div>
      ))}
    </div>
  );
}

function reportToMarkdown(report: TeamReport, projectName: string | null): string {
  const section = (title: string, items: ReportItem[]) =>
    items.length
      ? `\n## ${title}\n\n${items.map((i) => `- **${i.title}**${i.effort ? ` (${i.effort})` : ''}: ${i.detail}`).join('\n')}\n`
      : '';
  return (
    `# Agent Team Report${projectName ? ` — ${projectName}` : ''}\n\n${report.summary}\n` +
    section('Priority Actions', report.priorityActions) +
    section('Quick Wins', report.quickWins) +
    section('Architecture Decisions', report.architectureDecisions) +
    section('Technical Debt Map', report.technicalDebt)
  );
}
