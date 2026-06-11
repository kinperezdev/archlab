/**
 * A visual database table node for the schema designer. The header is the table
 * name and each row is a column with its data type. Click any cell to edit it in
 * place; edits flow back up so the SQL editor stays in sync.
 */

import { useState } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { DbColumn, DbTable } from '../lib/sqlSchema.js';

export interface SchemaNodeData {
  table: DbTable;
  onUpdateTable: (next: DbTable) => void;
}

/** An inline-editable text cell. */
function EditableCell({
  value,
  onCommit,
  className,
}: {
  value: string;
  onCommit: (next: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <input
        autoFocus
        className={`schema-cell-input ${className ?? ''}`}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          onCommit(draft.trim() || value);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') setEditing(false);
        }}
      />
    );
  }
  return (
    <span
      className={`schema-cell ${className ?? ''}`}
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
    >
      {value}
    </span>
  );
}

export function SchemaTableNode({ data }: NodeProps<SchemaNodeData>) {
  const { table, onUpdateTable } = data;

  const updateColumn = (index: number, patch: Partial<DbColumn>) => {
    const columns = table.columns.map((c, i) => (i === index ? { ...c, ...patch } : c));
    onUpdateTable({ ...table, columns });
  };

  const addColumn = () => {
    onUpdateTable({
      ...table,
      columns: [...table.columns, { name: 'new_column', type: 'TEXT', isPk: false, isFk: false }],
    });
  };

  const removeColumn = (index: number) => {
    onUpdateTable({ ...table, columns: table.columns.filter((_, i) => i !== index) });
  };

  return (
    <div className="schema-node">
      <Handle type="target" position={Position.Left} />
      <div className="schema-node-header">
        <span className="schema-glyph">⛁</span>
        <EditableCell
          value={table.name}
          className="schema-table-name"
          onCommit={(name) => onUpdateTable({ ...table, name })}
        />
      </div>
      <div className="schema-node-body">
        {table.columns.map((col, i) => (
          <div key={i} className={`schema-row ${col.isPk ? 'row-pk' : col.isFk ? 'row-fk' : ''}`}>
            <span className="schema-keys">
              {col.isPk && <span className="key-badge pk">PK</span>}
              {col.isFk && <span className="key-badge fk">FK</span>}
            </span>
            <EditableCell
              value={col.name}
              className="schema-col-name"
              onCommit={(name) => updateColumn(i, { name })}
            />
            <EditableCell
              value={col.type}
              className="schema-col-type"
              onCommit={(type) => updateColumn(i, { type })}
            />
            <button className="schema-col-remove" title="Remove column" onClick={() => removeColumn(i)}>
              ✕
            </button>
          </div>
        ))}
      </div>
      <button className="schema-add-col" onClick={addColumn}>
        + column
      </button>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
