/**
 * Simulation report.
 *
 * Renders in the RightSidebar after a simulation runs: headline stats, the
 * cascade timeline by wave, recovery analysis, Enterprise Audit correlations,
 * and the generated remediation prompt. Read-only; the "Run again" affordance
 * lives in the panel/toolbar.
 */

import { useState } from 'react';
import type { CanvasNode } from '@archlab/shared';
import type { NodeSimState, SimulationResult } from './simulationEngine.js';

interface SimulationReportProps {
  result: SimulationResult;
  nodes: CanvasNode[];
  onReset: () => void;
}

const WAVE_PILL_CLASS: Record<NodeSimState, string> = {
  healthy: 'sim-pill-healthy',
  warning: 'sim-pill-warning',
  degraded: 'sim-pill-degraded',
  failed: 'sim-pill-failed',
  'cascade-failed': 'sim-pill-cascade',
  recovering: 'sim-pill-recovering',
};

export function SimulationReport({ result, nodes, onReset }: SimulationReportProps) {
  const [copied, setCopied] = useState(false);
  const labelFor = (id: string) => nodes.find((n) => n.id === id)?.label ?? id;
  const stateFor = (id: string): NodeSimState =>
    result.nodeStates.find((ns) => ns.nodeId === id)?.state ?? 'healthy';

  const failedCount = result.nodeStates.filter(
    (ns) => ns.state === 'failed' || ns.state === 'cascade-failed',
  ).length;
  const degradedCount = result.nodeStates.filter((ns) => ns.state === 'degraded').length;

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(result.generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked; the prompt is still visible below */
    }
  };

  return (
    <section className="sim-report">
      <header className="sim-report-head">
        <div>
          <span className="sim-panel-eyebrow">Simulation Complete</span>
          <h3 className="sim-panel-title">{result.scenario.nodeLabel}</h3>
          <span className="sim-report-scenario">
            {result.scenario.scenario} · {result.scenario.severity} · {result.scenario.trafficLevel}
          </span>
        </div>
        <button type="button" className="sim-reset-link" onClick={onReset}>
          Reset
        </button>
      </header>

      <div className="sim-stats">
        <div className="sim-stat sim-stat-failed">
          <span className="sim-stat-num">{failedCount}</span>
          <span className="sim-stat-label">Failed</span>
        </div>
        <div className="sim-stat sim-stat-degraded">
          <span className="sim-stat-num">{degradedCount}</span>
          <span className="sim-stat-label">Degraded</span>
        </div>
        <div className="sim-stat sim-stat-users">
          <span className="sim-stat-num">{result.estimatedUsersAffected.toLocaleString()}</span>
          <span className="sim-stat-label">Users Affected</span>
        </div>
        <div className="sim-stat sim-stat-recovery">
          <span className="sim-stat-num">{result.autoRecoveryNodes.length}</span>
          <span className="sim-stat-label">Auto-Recovery</span>
        </div>
      </div>

      <p className="sim-impact">{result.estimatedImpact}</p>

      <h4 className="sim-section-title">Cascade Timeline</h4>
      <div className="sim-waves">
        {result.cascadeChain.map((ids, i) => (
          <div key={i} className="sim-wave">
            <div className="sim-wave-head">
              <span className="sim-wave-num">Wave {i + 1}</span>
              <span className="sim-wave-ms">{i * 800}ms</span>
            </div>
            <div className="sim-wave-pills">
              {ids.length === 0 ? (
                <span className="sim-wave-empty">no nodes</span>
              ) : (
                ids.map((id) => (
                  <span key={id} className={`sim-node-pill ${WAVE_PILL_CLASS[stateFor(id)]}`}>
                    {labelFor(id)}
                  </span>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <h4 className="sim-section-title">Recovery Analysis</h4>
      <div className="sim-recovery">
        <div className="sim-recovery-col sim-recovery-auto">
          <span className="sim-recovery-label">✓ Auto-recovery</span>
          {result.autoRecoveryNodes.length === 0 ? (
            <span className="sim-recovery-empty">None detected. No node has a circuit breaker, retry, or fallback.</span>
          ) : (
            <ul>
              {result.autoRecoveryNodes.map((n, i) => (
                <li key={`${n}-${i}`}>{n}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="sim-recovery-col sim-recovery-manual">
          <span className="sim-recovery-label">⚠ Manual intervention</span>
          {result.manualInterventionNodes.length === 0 ? (
            <span className="sim-recovery-empty">None.</span>
          ) : (
            <ul>
              {result.manualInterventionNodes.map((n, i) => (
                <li key={`${n}-${i}`}>{n}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {result.enterpriseAuditCorrelations.length > 0 && (
        <>
          <h4 className="sim-section-title">Enterprise Audit Correlations</h4>
          <div className="sim-correlations">
            {result.enterpriseAuditCorrelations.map((c) => (
              <div key={c} className="sim-correlation-card">
                ⚠ {c}
              </div>
            ))}
          </div>
        </>
      )}

      <div className="sim-prompt">
        <div className="sim-prompt-head">
          <span>Remediation prompt</span>
          <button type="button" className="btn btn-sm" onClick={copyPrompt}>
            {copied ? 'Copied ✓' : 'Copy'}
          </button>
        </div>
        <textarea className="sim-prompt-text" readOnly value={result.generatedPrompt} rows={12} />
      </div>
    </section>
  );
}
