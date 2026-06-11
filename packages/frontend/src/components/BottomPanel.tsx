/**
 * Bottom panel: the 7-step pipeline (always visible on the left) and a tabbed
 * right side that switches between the live Terminal and the log stream.
 */

import { useEffect, useRef, useState } from 'react';
import type { PipelineStep, StepStatus } from '@archlab/shared';
import type { LogLine, TerminalState } from '../state/useArchLab.js';
import { Terminal } from './Terminal.js';

const STATUS_GLYPH: Record<StepStatus, string> = {
  pending: '○',
  running: '◐',
  passed: '●',
  failed: '✕',
  skipped: '–',
};

interface BottomPanelProps {
  steps: PipelineStep[];
  logs: LogLine[];
  terminal: TerminalState;
  onCommand: (line: string) => void;
  height: number;
  onResize: (height: number) => void;
}

export function BottomPanel({ steps, logs, terminal, onCommand, height, onResize }: BottomPanelProps) {
  const [tab, setTab] = useState<'terminal' | 'logs'>('terminal');
  const logEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (tab === 'logs') logEndRef.current?.scrollIntoView({ block: 'end' });
  }, [logs, tab]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.max(100, Math.min(600, startHeight - deltaY));
      onResize(newHeight);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const isRunning = steps.some((s) => s.status === 'running');
  const hasFinished = steps.length > 0 && steps.every((s) => s.status === 'passed' || s.status === 'failed' || s.status === 'skipped');
  const [elapsed, setElapsed] = useState(0);

  // Track elapsed pipeline time when running
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning) {
      setElapsed(0);
      const startTime = Date.now();
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 100) / 10);
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  return (
    <footer className="bottom-panel">
      <div className="bottom-panel-resizer" onMouseDown={handleMouseDown} />
      <div className="pipeline-track">
        <div className="pipeline-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 4px' }}>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-dim)', fontWeight: 600 }}>Checks Pipeline</span>
          {isRunning && (
            <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', fontWeight: 600 }}>
              ELAPSED: {elapsed.toFixed(1)}s
            </span>
          )}
          {hasFinished && !isRunning && (
            <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--state-green)', fontWeight: 600 }}>
              DONE ({elapsed.toFixed(1)}s)
            </span>
          )}
        </div>
        {steps.length === 0 ? (
          <span className="file-empty">Pipeline idle — run checks to begin.</span>
        ) : (
          <div className="pipeline-steps-list" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {steps.map((s, i) => (
              <div key={s.id} className={`pipeline-step status-${s.status}`} title={s.summary}>
                <span className="step-glyph">{STATUS_GLYPH[s.status]}</span>
                <span className="step-index">{i + 1}</span>
                <span className="step-title">{s.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bottom-right">
        <div className="tab-bar">
          <button
            className={`tab ${tab === 'terminal' ? 'tab-active' : ''}`}
            onClick={() => setTab('terminal')}
          >
            Terminal
          </button>
          <button
            className={`tab ${tab === 'logs' ? 'tab-active' : ''}`}
            onClick={() => setTab('logs')}
          >
            Logs
          </button>
        </div>

        {tab === 'terminal' ? (
          <Terminal terminal={terminal} onCommand={onCommand} />
        ) : (
          <div className="log-stream">
            {logs.map((l, i) => (
              <div key={i} className={`log-line log-${l.level}`}>
                <span className="log-time">{l.at.slice(11, 19)}</span>
                <span className="log-msg">{l.message}</span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        )}
      </div>
    </footer>
  );
}
