/**
 * A node on the free-form Ideas canvas. Double-click to edit its label inline;
 * drag from the edge handles to connect it to another node.
 */

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

/** Display metadata for each idea node kind (toolbar + node rendering). */
export const IDEA_KINDS: { kind: IdeaKind; label: string; glyph: string }[] = [
  { kind: 'page', label: 'Page', glyph: '▭' },
  { kind: 'component', label: 'Component', glyph: '◆' },
  { kind: 'api-route', label: 'API Route', glyph: '⇄' },
  { kind: 'database-table', label: 'Database Table', glyph: '⛁' },
  { kind: 'external-service', label: 'External Service', glyph: '☁' },
  { kind: 'auth-layer', label: 'Auth Layer', glyph: '🔒' },
  { kind: 'note', label: 'Note', glyph: '🗒' },
];

const GLYPH: Record<IdeaKind, string> = Object.fromEntries(
  IDEA_KINDS.map((k) => [k.kind, k.glyph]),
) as Record<IdeaKind, string>;

export function IdeaNode({ id, data, selected }: NodeProps<IdeaNodeData>) {
  const { setNodes } = useReactFlow();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.label);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    const label = draft.trim() || data.label;
    setNodes((nodes) =>
      nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, label } } : n)),
    );
    setEditing(false);
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
      <Handle type="target" position={Position.Left} />
      <span className="idea-node-glyph">{GLYPH[data.ideaKind]}</span>
      {editing ? (
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
      ) : (
        <span className="idea-node-label">{data.label}</span>
      )}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
