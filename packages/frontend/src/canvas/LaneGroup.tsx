/**
 * A non-interactive background container rendered behind a swim-lane group of
 * nodes. It gives each architectural layer (Frontend, Backend) an immediately
 * visible tinted region so the separation reads at a glance without zooming.
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { NodeProps } from 'reactflow';
import type { MouseEvent } from 'react';

export type LaneVariant = 'frontend' | 'backend' | 'connected' | 'isolated';

export interface LaneGroupData {
  label: string;
  variant: LaneVariant;
  width: number;
  height: number;
}

export function LaneGroup({ data }: NodeProps<LaneGroupData>) {
  const [showModal, setShowModal] = useState(false);
  const showInfo = data.variant === 'connected' || data.variant === 'isolated';

  const handleInfoClick = (e: MouseEvent) => {
    e.stopPropagation();
    setShowModal(true);
  };

  return (
    <div
      className={`lane-group lane-group-${data.variant}`}
      style={{ width: data.width, height: data.height }}
    >
      <span className="lane-group-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', pointerEvents: 'auto' }}>
        {data.label}
        {showInfo && (
          <span
            className="nodrag nopan"
            style={{ cursor: 'pointer', opacity: 0.7, transition: 'opacity 0.2s' }}
            onClick={handleInfoClick}
            title={`Click for info about ${data.label} components`}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.7'; }}
          >
            ⓘ
          </span>
        )}
      </span>

      {showModal && createPortal(
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#0a0a14',
            border: '1px solid #22223b',
            borderRadius: '8px',
            padding: '14px',
            width: '260px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
            zIndex: 99999,
            color: '#f8fafc',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            pointerEvents: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1f1f33', paddingBottom: '6px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#a5b4fc', letterSpacing: '0.02em' }}>
              {data.label} Swimlane
            </span>
            <button
              onClick={() => setShowModal(false)}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '12px', padding: '2px' }}
            >
              ✕
            </button>
          </div>
          <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1', lineHeight: '1.5' }}>
            {data.variant === 'connected'
              ? "These modules are actively integrated, having direct connections, imports, or dependencies linking them to other parts of the system."
              : "These components are detached from the rest of the dependency graph. They currently have no active connections, imports, or exports linking them to the other parts of the codebase."}
          </p>
        </div>,
        document.body
      )}
    </div>
  );
}
