/**
 * Simulation control panel.
 *
 * Renders in the RightSidebar when simulation mode is active and a node is
 * selected. Lets the user pick what goes wrong, how bad, under what traffic,
 * and for how long, then runs the failure simulation for that node.
 */

import { useMemo, useState } from 'react';
import type { CanvasNode } from '@archlab/shared';
import {
  presetsForNode,
  normalizeSimType,
  type SimulationDuration,
  type SimulationScenario,
  type SimulationSeverity,
  type TrafficLevel,
} from './simulationEngine.js';

interface SimulationPanelProps {
  node: CanvasNode;
  onRun: (scenario: SimulationScenario) => void;
}

const SEVERITIES: SimulationSeverity[] = ['low', 'medium', 'high', 'critical'];
const TRAFFIC: { id: TrafficLevel; label: string }[] = [
  { id: 'off-peak', label: 'Off-Peak' },
  { id: 'normal', label: 'Normal' },
  { id: 'peak', label: 'Peak' },
  { id: 'black-friday', label: 'Black Friday' },
];
const DURATIONS: SimulationDuration[] = ['30s', '5m', '1h', 'permanent'];
const DURATION_LABEL: Record<SimulationDuration, string> = {
  '30s': '30s',
  '5m': '5m',
  '1h': '1h',
  permanent: 'Permanent',
};

export function SimulationPanel({ node, onRun }: SimulationPanelProps) {
  const presets = useMemo(() => presetsForNode(node), [node]);
  const simType = useMemo(() => normalizeSimType(node), [node]);

  const [scenario, setScenario] = useState(presets[0] ?? '');
  const [severity, setSeverity] = useState<SimulationSeverity>('high');
  const [traffic, setTraffic] = useState<TrafficLevel>('normal');
  const [duration, setDuration] = useState<SimulationDuration>('5m');

  const run = () => {
    const text = scenario.trim() || presets[0] || 'Service unavailable';
    onRun({
      nodeId: node.id,
      nodeLabel: node.label,
      nodeType: simType,
      scenario: text,
      severity,
      trafficLevel: traffic,
      duration,
    });
  };

  return (
    <section className="sim-panel">
      <header className="sim-panel-head">
        <span className="sim-panel-eyebrow">Failure Simulation</span>
        <h3 className="sim-panel-title">{node.label}</h3>
        <span className="sim-panel-type">{node.kind} · {simType}</span>
      </header>

      <label className="sim-field-label" htmlFor="sim-scenario">What goes wrong?</label>
      <input
        id="sim-scenario"
        className="sim-input"
        value={scenario}
        placeholder="e.g. Connection timeout under load"
        onChange={(e) => setScenario(e.target.value)}
      />

      <div className="sim-presets">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            className={`sim-preset${scenario === p ? ' active' : ''}`}
            onClick={() => setScenario(p)}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="sim-field">
        <span className="sim-field-label">Severity</span>
        <div className="sim-pill-row">
          {SEVERITIES.map((s) => (
            <button
              key={s}
              type="button"
              className={`sim-pill sim-sev-${s}${severity === s ? ' active' : ''}`}
              onClick={() => setSeverity(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="sim-field">
        <span className="sim-field-label">Traffic level</span>
        <div className="sim-pill-row">
          {TRAFFIC.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`sim-pill${traffic === t.id ? ' active' : ''}`}
              onClick={() => setTraffic(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="sim-field">
        <span className="sim-field-label">Duration</span>
        <div className="sim-pill-row">
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              className={`sim-pill${duration === d ? ' active' : ''}`}
              onClick={() => setDuration(d)}
            >
              {DURATION_LABEL[d]}
            </button>
          ))}
        </div>
      </div>

      <button type="button" className="sim-run-btn" onClick={run}>
        ▶ Run Simulation
      </button>
    </section>
  );
}
