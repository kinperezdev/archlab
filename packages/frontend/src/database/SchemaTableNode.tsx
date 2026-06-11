import { useState, useEffect } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { DbColumn, DbTable } from '../lib/sqlSchema.js';
import { CopyPromptButton } from '../components/CopyPromptButton.js';
import { serializeSqlSchema } from '../lib/sqlSchema.js';

export interface SchemaNodeData {
  table: DbTable;
  allTables: DbTable[];
  onUpdateTable: (next: DbTable) => void;
}

const PG_TYPES = [
  'SERIAL',
  'INT',
  'BIGINT',
  'TEXT',
  'VARCHAR',
  'TIMESTAMP',
  'BOOLEAN',
  'JSONB',
  'NUMERIC',
  'UUID'
];

export function SchemaTableNode({ data, selected }: NodeProps<SchemaNodeData>) {
  const { table, allTables, onUpdateTable } = data;
  const [editingTableName, setEditingTableName] = useState(false);
  const [tableNameDraft, setTableNameDraft] = useState(table.name);

  // Sync state if table name changes externally
  useEffect(() => {
    setTableNameDraft(table.name);
  }, [table.name]);

  const updateColumn = (index: number, patch: Partial<DbColumn>) => {
    const columns = table.columns.map((c, i) => {
      if (i === index) {
        const merged = { ...c, ...patch };
        if (patch.isPk) {
          merged.isNotNull = false;
          merged.isUnique = false;
        }
        return merged;
      }
      return c;
    });
    onUpdateTable({ ...table, columns });
  };

  const addColumn = () => {
    onUpdateTable({
      ...table,
      columns: [
        ...table.columns,
        { name: `col_${table.columns.length + 1}`, type: 'TEXT', isPk: false, isFk: false }
      ],
    });
  };

  const removeColumn = (index: number) => {
    onUpdateTable({
      ...table,
      columns: table.columns.filter((_, i) => i !== index),
    });
  };

  // Get all columns from other tables to reference
  const getReferenceOptions = () => {
    const options: { value: string; label: string; table: string; col: string }[] = [];
    for (const t of allTables) {
      if (t.name === table.name) continue; // Don't self-reference in simple designer
      for (const col of t.columns) {
        options.push({
          value: `${t.name}.${col.name}`,
          label: `${t.name}.${col.name} ${col.isPk ? '(PK)' : ''}`,
          table: t.name,
          col: col.name,
        });
      }
    }
    return options;
  };

  const refOptions = getReferenceOptions();

  // Generate copy prompt context
  const getCopyPromptText = () => {
    const ddl = serializeSqlSchema([table]);
    return `Here is my current database schema for the ${table.name} table and its relationships:
\`\`\`sql
${ddl}
\`\`\`
Please review this and suggest optimizations for performance, indexing strategy, and relationship integrity.`;
  };

  return (
    <div className={`schema-node ${selected ? 'schema-node-expanded' : ''}`}>
      <Handle type="target" position={Position.Left} style={{ borderRadius: '50%', width: 8, height: 8 }} />
      
      {/* Header */}
      <div className="schema-node-header">
        <span className="schema-glyph">⛁</span>
        {editingTableName ? (
          <input
            autoFocus
            className="schema-table-name-input"
            value={tableNameDraft}
            onChange={(e) => setTableNameDraft(e.target.value)}
            onBlur={() => {
              if (tableNameDraft.trim()) {
                onUpdateTable({ ...table, name: tableNameDraft.trim() });
              }
              setEditingTableName(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
              if (e.key === 'Escape') {
                setTableNameDraft(table.name);
                setEditingTableName(false);
              }
            }}
          />
        ) : (
          <span 
            className="schema-table-name"
            onClick={(e) => {
              e.stopPropagation();
              setEditingTableName(true);
            }}
          >
            {table.name}
          </span>
        )}

        <div className="schema-node-header-actions" onClick={e => e.stopPropagation()}>
          <CopyPromptButton prompt={getCopyPromptText} label="Copy Prompt" />
        </div>
      </div>

      {/* Main Body */}
      <div className="schema-node-body">
        {table.columns.map((col, i) => {
          return (
            <div key={i} className="schema-row-wrapper">
              <div className={`schema-row ${col.isPk ? 'row-pk' : col.isFk ? 'row-fk' : ''}`}>
                <span className="schema-keys">
                  {col.isPk && <span className="key-badge pk" title="Primary Key">PK</span>}
                  {col.isFk && <span className="key-badge fk" title="Foreign Key">FK</span>}
                  {col.isNotNull && !col.isPk && <span className="key-badge nn" title="Not Null">NN</span>}
                  {col.isUnique && !col.isPk && <span className="key-badge uq" title="Unique">UQ</span>}
                </span>
                
                <span className="schema-col-name">{col.name}</span>
                <span className="schema-col-type">{col.type}</span>
              </div>

              {/* Expanded Edit Controls */}
              {selected && (
                <div className="schema-row-editor">
                  <div className="schema-editor-field">
                    <label>Column Name</label>
                    <input
                      value={col.name}
                      onChange={(e) => updateColumn(i, { name: e.target.value })}
                    />
                  </div>

                  <div className="schema-editor-field">
                    <label>Type</label>
                    <select
                      value={col.type.toUpperCase()}
                      onChange={(e) => updateColumn(i, { type: e.target.value })}
                    >
                      {PG_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="schema-editor-field">
                    <label>Constraints</label>
                    <select
                      value={
                        col.isPk
                          ? 'PK'
                          : col.isNotNull && col.isUnique
                          ? 'NN_UQ'
                          : col.isNotNull
                          ? 'NN'
                          : col.isUnique
                          ? 'UQ'
                          : 'NONE'
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'PK') {
                          updateColumn(i, { isPk: true, isNotNull: false, isUnique: false });
                        } else if (val === 'NN_UQ') {
                          updateColumn(i, { isPk: false, isNotNull: true, isUnique: true });
                        } else if (val === 'NN') {
                          updateColumn(i, { isPk: false, isNotNull: true, isUnique: false });
                        } else if (val === 'UQ') {
                          updateColumn(i, { isPk: false, isNotNull: false, isUnique: true });
                        } else {
                          updateColumn(i, { isPk: false, isNotNull: false, isUnique: false });
                        }
                      }}
                    >
                      <option value="NONE">NONE</option>
                      <option value="PK">PRIMARY KEY</option>
                      <option value="NN">NOT NULL</option>
                      <option value="UQ">UNIQUE</option>
                      <option value="NN_UQ">NOT NULL + UNIQUE</option>
                    </select>
                  </div>

                  <div className="schema-editor-field">
                    <label>References</label>
                    <select
                      value={col.isFk && col.fkRelation ? `${col.fkRelation.parentTable}.${col.fkRelation.parentColumn}` : 'NONE'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'NONE') {
                          updateColumn(i, { isFk: false, fkRelation: undefined });
                        } else {
                          const opt = refOptions.find((o) => o.value === val);
                          if (opt) {
                            updateColumn(i, {
                              isFk: true,
                              fkRelation: { parentTable: opt.table, parentColumn: opt.col }
                            });
                          }
                        }
                      }}
                    >
                      <option value="NONE">None</option>
                      {refOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button 
                    className="schema-col-remove-btn" 
                    title="Remove column" 
                    onClick={() => removeColumn(i)}
                  >
                    Remove Column
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="schema-node-footer">
          <button className="schema-add-col" onClick={addColumn}>
            + Add Column
          </button>
        </div>
      )}
      
      <Handle type="source" position={Position.Right} style={{ borderRadius: '50%', width: 8, height: 8 }} />
    </div>
  );
}
