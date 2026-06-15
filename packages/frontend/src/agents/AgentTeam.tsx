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
import { AGENT_CATALOG, agentInfo } from './agentCatalog.js';

interface AgentTeamProps {
  team: AgentTeamState;
  projectName: string | null;
  hasProject: boolean;
  onRun: (mode: AgentMode, agentId?: AgentId) => void;
  onRequestRuns: () => void;
  onClose: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  idle: 'Idle',
  thinking: 'Thinking',
  working: 'Working',
  error: 'Error',
  complete: 'Complete',
};

export function AgentTeam({ team, projectName, hasProject, onRun, onRequestRuns, onClose }: AgentTeamProps) {
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
    <aside className="agent-panel">
      <header className="agent-panel-head">
        <div>
          <h3>Agent Team</h3>
          {projectName && <span className="agent-panel-project">{projectName}</span>}
        </div>
        <button className="code-icon-btn" onClick={onClose} title="Close">✕</button>
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
          <button className="btn btn-primary agent-run-btn" disabled={!hasProject || team.running} onClick={run}>
            {team.running ? 'Running…' : 'Run Agent Team'}
          </button>
          <button className="btn" onClick={() => setShowHistory((s) => !s)}>
            {showHistory ? 'Hide History' : 'History'}
          </button>
        </div>
        {!hasProject && <p className="agent-hint">Analyze a project first to give the agents context.</p>}
      </div>

      {showHistory ? (
        <RunHistory team={team} />
      ) : (
        <div className="agent-list">
          {AGENT_CATALOG.map((a) => {
            const st = team.agents[a.id];
            return (
              <div key={a.id} className="agent-card" style={{ borderLeftColor: a.color }}>
                <button className="agent-card-head" onClick={() => toggle(a.id)}>
                  <span className={`agent-status-dot status-${st.status}`} />
                  <span className="agent-card-glyph">{a.glyph}</span>
                  <span className="agent-card-name">{a.name}</span>
                  <span className="agent-card-status">
                    {st.summary ?? STATUS_LABEL[st.status]}
                  </span>
                </button>
                <p className="agent-card-role">{a.role}</p>

                {(st.status === 'thinking' || st.status === 'working' || expanded.has(a.id)) && st.output && (
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
