import { useState, useEffect } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { DbColumn, DbTable } from '../lib/sqlSchema.js';

export interface SchemaNodeData {
  table: DbTable;
  allTables: DbTable[];
  onUpdateTable: (next: DbTable) => void;
}

export function SchemaTableNode({ data, selected }: NodeProps<SchemaNodeData>) {
  const { table, allTables, onUpdateTable } = data;
  const [editingTableName, setEditingTableName] = useState(false);
  const [tableNameDraft, setTableNameDraft] = useState(table.name);
  // Which row's inline foreign-key picker is open (always-available, not just in
  // the expanded editor).
  const [fkPickerRow, setFkPickerRow] = useState<number | null>(null);

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

  // Reference options from other tables. Primary keys are listed first since
  // they are the natural foreign-key targets.
  const getReferenceOptions = () => {
    const options: { value: string; label: string; table: string; col: string; isPk: boolean }[] = [];
    for (const t of allTables) {
      if (t.name === table.name) continue; // Don't self-reference in simple designer
      for (const col of t.columns) {
        options.push({
          value: `${t.name}.${col.name}`,
          label: `${t.name}.${col.name} ${col.isPk ? '(PK)' : ''}`,
          table: t.name,
          col: col.name,
          isPk: Boolean(col.isPk),
        });
      }
    }
    return options.sort((a, b) => Number(b.isPk) - Number(a.isPk));
  };

  const refOptions = getReferenceOptions();

  /** Apply a reference selection (or clear) to a column by index. */
  const setReference = (index: number, value: string) => {
    if (value === 'NONE') {
      updateColumn(index, { isFk: false, fkRelation: undefined });
    } else {
      const opt = refOptions.find((o) => o.value === value);
      if (opt) {
        updateColumn(index, { isFk: true, fkRelation: { parentTable: opt.table, parentColumn: opt.col } });
      }
    }
    setFkPickerRow(null);
  };

  // The node is a compact, readable card: up to 6 columns, then "+N more".
  // All editing happens in the right detail panel, so the node never expands.
  const COLLAPSED_CAP = 6;
  const overCap = table.columns.length > COLLAPSED_CAP;
  const visibleColumns = overCap ? table.columns.slice(0, COLLAPSED_CAP) : table.columns;
  const moreCount = overCap ? table.columns.length - COLLAPSED_CAP : 0;

  return (
    <div className={`schema-node ${selected ? 'schema-node-selected' : ''}`}>
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
          <span className="schema-table-head">
            <span
              className="schema-table-name"
              onClick={(e) => {
                e.stopPropagation();
                setEditingTableName(true);
              }}
            >
              {table.name}
            </span>
            <span className="schema-table-count">
              {table.columns.length} column{table.columns.length === 1 ? '' : 's'}
            </span>
          </span>
        )}

        {table.isInferred && (
          <span className="inferred-badge" title="Inferred from app flow — needs verification">
            💡
          </span>
        )}

      </div>

      {/* Main Body — readable summary (collapsed) or full editor (selected). */}
      <div className="schema-node-body">
        {visibleColumns.map((col, i) => {
          const fkUnverified = col.isFk && (col.fkAutoCorrected || col.fkUnresolved);
          return (
            <div key={i} className="schema-row-wrapper">
              <div className={`schema-row ${col.isPk ? 'row-pk' : col.isFk ? 'row-fk' : ''}`}>
                <span className="schema-keys">
                  {col.isPk && <span className="col-icon pk" title="Primary Key">🔑</span>}
                  {col.isFk && (
                    <span
                      className={`col-icon fk ${fkUnverified ? 'fk-unverified' : ''}`}
                      title={
                        fkUnverified
                          ? `Foreign key → ${col.fkRelation?.parentTable}.${col.fkRelation?.parentColumn} (inferred — needs verification)`
                          : `Foreign key → ${col.fkRelation?.parentTable}.${col.fkRelation?.parentColumn}`
                      }
                    >
                      🔗
                    </span>
                  )}
                </span>

                <span className={`schema-col-name ${col.isNotNull ? 'col-nn' : ''}`}>
                  {col.name}
                  {col.isInferred && (
                    <span className="inferred-col-bullet" title="Inferred from app flow">💡</span>
                  )}
                </span>
                <span className="schema-col-type">{col.type}</span>
                <button
                  className={`schema-fk-btn ${col.isFk ? 'active' : ''}`}
                  title={col.isFk ? 'Change / clear foreign key reference' : 'Set foreign key reference'}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFkPickerRow(fkPickerRow === i ? null : i);
                  }}
                >
                  🔗▾
                </button>
              </div>

              {/* Inline foreign-key picker (available without expanding the node) */}
              {fkPickerRow === i && (
                <div className="schema-fk-picker" onClick={(e) => e.stopPropagation()}>
                  <label>References</label>
                  <select
                    autoFocus
                    value={col.isFk && col.fkRelation ? `${col.fkRelation.parentTable}.${col.fkRelation.parentColumn}` : 'NONE'}
                    onChange={(e) => setReference(i, e.target.value)}
                  >
                    <option value="NONE">No reference</option>
                    {refOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {refOptions.length === 0 && (
                    <span className="schema-fk-empty">Add another table to link to.</span>
                  )}
                </div>
              )}

            </div>
          );
        })}
        {moreCount > 0 && (
          <div className="schema-row schema-row-more" title="Click the table to see and edit all columns in the side panel">
            +{moreCount} more column{moreCount === 1 ? '' : 's'}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} style={{ borderRadius: '50%', width: 8, height: 8 }} />
    </div>
  );
}
