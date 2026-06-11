import { useEffect, useRef, useState } from 'react';
import { Handle, Position, useReactFlow, type NodeProps } from 'reactflow';

export type IdeaKind =
  | 'page'
  | 'component'
  | 'api-route'
  | 'database-table'
  | 'external-service'
  | 'auth-layer'
  | 'note';

export interface IdeaNodeData {
  label: string;
  ideaKind: IdeaKind;
}

export const IDEA_KINDS: { kind: IdeaKind; label: string; glyph: string }[] = [
  { kind: 'page', label: 'Page', glyph: '▭' },
  { kind: 'component', label: 'Component', glyph: '◆' },
  { kind: 'api-route', label: 'API Route', glyph: '⇄' },
  { kind: 'database-table', label: 'Database Table', glyph: '⛁' },
  { kind: 'external-service', label: 'External Service', glyph: '☁' },
  { kind: 'auth-layer', label: 'Auth Layer', glyph: '🔒' },
  { kind: 'note', label: 'Note', glyph: '🗒' },
];

export function IdeaNode({ id, data, selected }: NodeProps<IdeaNodeData>) {
  const { setNodes } = useReactFlow();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.label);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    const label = draft.trim() || data.label;
    setNodes((nodes) =>
      nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, label } } : n)),
    );
    setEditing(false);
  };

  const getGlyph = () => {
    switch (data.ideaKind) {
      case 'page':
        return (
          <svg className="idea-svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
            <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
          </svg>
        );
      case 'component':
        return (
          <svg className="idea-svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
            <polygon points="12,2 22,12 12,22 2,12" strokeWidth="2" />
          </svg>
        );
      case 'api-route':
        return (
          <svg className="idea-svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
            <path d="M8 7h12m0 0l-4-4m4 4l-4 4m-4 6H4m0 0l4-4m-4 4l4 4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'database-table':
        return (
          <svg className="idea-svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
            <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
            <path d="M3 9h18M9 3v18" strokeWidth="2" />
          </svg>
        );
      case 'external-service':
        return (
          <svg className="idea-svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
            <path d="M3 15a4 4 0 0 1 4-4 7 7 0 0 1 13.95-1.94 4 4 0 0 1-.95 7.94H7a4 4 0 0 1-4-4z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'auth-layer':
        return (
          <svg className="idea-svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
            <rect x="5" y="11" width="14" height="11" rx="2" strokeWidth="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth="2" />
          </svg>
        );
      case 'note':
        return (
          <svg className="idea-svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
            <path d="M9 2H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8l-6-6z" strokeWidth="2" />
            <path d="M14 2v6h6" strokeWidth="2" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Render node contents based on type
  const renderContent = () => {
    if (editing) {
      return (
        <input
          ref={inputRef}
          className="idea-node-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') setEditing(false);
          }}
        />
      );
    }

    if (data.ideaKind === 'database-table') {
      return (
        <div className="idea-db-table-wrapper">
          <div className="idea-db-table-header">
            {getGlyph()}
            <span>Table</span>
          </div>
          <div className="idea-db-table-body">
            <span className="idea-node-label">{data.label}</span>
          </div>
        </div>
      );
    }

    return (
      <>
        {getGlyph()}
        <span className="idea-node-label">{data.label}</span>
        {data.ideaKind === 'api-route' && (
          <span className="idea-api-arrows">⇄</span>
        )}
      </>
    );
  };

  return (
    <div
      className={`idea-node idea-${data.ideaKind} ${selected ? 'idea-selected' : ''}`}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setDraft(data.label);
        setEditing(true);
      }}
    >
      {/* Target & Source handles on all four sides */}
      <Handle type="target" position={Position.Left} id="left-tgt" style={{ top: '40%', borderRadius: '50%', width: 8, height: 8 }} />
      <Handle type="source" position={Position.Left} id="left-src" style={{ top: '60%', borderRadius: '50%', width: 8, height: 8 }} />

      <Handle type="target" position={Position.Right} id="right-tgt" style={{ top: '40%', borderRadius: '50%', width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} id="right-src" style={{ top: '60%', borderRadius: '50%', width: 8, height: 8 }} />

      <Handle type="target" position={Position.Top} id="top-tgt" style={{ left: '40%', borderRadius: '50%', width: 8, height: 8 }} />
      <Handle type="source" position={Position.Top} id="top-src" style={{ left: '60%', borderRadius: '50%', width: 8, height: 8 }} />

      <Handle type="target" position={Position.Bottom} id="bottom-tgt" style={{ left: '40%', borderRadius: '50%', width: 8, height: 8 }} />
      <Handle type="source" position={Position.Bottom} id="bottom-src" style={{ left: '60%', borderRadius: '50%', width: 8, height: 8 }} />

      {renderContent()}
    </div>
  );
}
