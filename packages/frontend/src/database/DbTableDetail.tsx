/**
 * Right-panel detail + editor for one selected table.
 *
 * Mirrors the full-flow Canvas pattern: click a table node, its detail opens in
 * a right panel. Editing flows back through the parent's `onCommit` (which is
 * `updateTable`, so FK cascades and rename confirmation are reused, not
 * reinvented). Renames commit on blur/Enter so the confirmation dialog fires
 * once you finish typing, not on every keystroke.
 */

import { useEffect, useState } from 'react';
import { Plus, Trash2, KeyRound, Link2, X, ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';
import { serializeSqlSchema, type DbColumn, type DbTable } from '../lib/sqlSchema.js';
import { CopyPromptButton } from '../components/CopyPromptButton.js';

interface DbTableDetailProps {
  table: DbTable;
  onCommit: (originalName: string, updated: DbTable) => void;
  onClose: () => void;
}

const DEFAULT_TYPE = 'TEXT';

export function DbTableDetail({ table, onCommit, onClose }: DbTableDetailProps) {
  // Local draft of the table name so renaming only commits on blur.
  const [nameDraft, setNameDraft] = useState(table.name);
  useEffect(() => setNameDraft(table.name), [table.name]);

  const commit = (updated: DbTable) => onCommit(table.name, updated);

  // Paste-ready AI prompt for just this table (moved here from the node header
  // so every node stays a clean card and the action sits next to the table).
  const copyPromptText = () =>
    `Here is my current database schema for the ${table.name} table and its relationships:
\`\`\`sql
${serializeSqlSchema([table])}
\`\`\`
Please review this and suggest optimizations for performance, indexing strategy, and relationship integrity.`;

  const commitColumns = (columns: DbColumn[]) => commit({ ...table, columns });

  const updateColumn = (index: number, patch: Partial<DbColumn>) => {
    commitColumns(table.columns.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };

  const addColumn = () => {
    const base = 'new_column';
    let name = base;
    let n = 1;
    while (table.columns.some((c) => c.name === name)) name = `${base}_${n++}`;
    commitColumns([...table.columns, { name, type: DEFAULT_TYPE, isPk: false, isFk: false }]);
  };

  const removeColumn = (index: number) => {
    commitColumns(table.columns.filter((_, i) => i !== index));
  };

  const commitTableName = () => {
    const next = nameDraft.trim();
    if (next && next !== table.name) commit({ ...table, name: next });
    else setNameDraft(table.name);
  };

  return (
    <aside className="db-detail-panel">
      <header className="db-detail-head">
        <div className="db-detail-title">
          <input
            className="db-detail-name-input"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitTableName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            spellCheck={false}
            aria-label="Table name"
          />
          {table.isInferred && <span className="db-detail-inferred">inferred</span>}
        </div>
        <button className="btn db-detail-close" onClick={onClose} title="Close detail" aria-label="Close detail">
          <X size={14} strokeWidth={1.75} />
        </button>
      </header>

      <div className="db-detail-meta">
        <span>
          {table.columns.length} column{table.columns.length === 1 ? '' : 's'}
        </span>
        <CopyPromptButton prompt={copyPromptText} label="Copy Prompt" />
      </div>

      <RlsRow table={table} />

      <ul className="db-detail-cols">
        {table.columns.map((col, i) => (
          <li key={i} className="db-detail-col">
            <div className="db-detail-col-row">
              <input
                className="db-detail-col-name"
                defaultValue={col.name}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== col.name) updateColumn(i, { name: v });
                  else e.target.value = col.name;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                }}
                spellCheck={false}
                aria-label={`Column ${i + 1} name`}
              />
              <input
                className="db-detail-col-type"
                defaultValue={col.type}
                onBlur={(e) => {
                  const v = e.target.value.trim() || DEFAULT_TYPE;
                  if (v !== col.type) updateColumn(i, { type: v });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                }}
                spellCheck={false}
                aria-label={`Column ${i + 1} type`}
              />
              <button
                className="db-detail-col-del"
                onClick={() => removeColumn(i)}
                title="Remove column"
                aria-label={`Remove column ${col.name}`}
              >
                <Trash2 size={13} strokeWidth={1.75} />
              </button>
            </div>

            <div className="db-detail-col-flags">
              <FlagChip active={col.isPk} onClick={() => updateColumn(i, { isPk: !col.isPk })} title="Primary key">
                <KeyRound size={11} strokeWidth={2} /> PK
              </FlagChip>
              <FlagChip active={Boolean(col.isNotNull)} onClick={() => updateColumn(i, { isNotNull: !col.isNotNull })} title="Not null">
                NN
              </FlagChip>
              <FlagChip active={Boolean(col.isUnique)} onClick={() => updateColumn(i, { isUnique: !col.isUnique })} title="Unique">
                UQ
              </FlagChip>
              {col.isFk && col.fkRelation && (
                <span className="db-detail-fk" title="Foreign key reference">
                  <Link2 size={11} strokeWidth={2} /> {col.fkRelation.parentTable}.{col.fkRelation.parentColumn}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>

      <button className="db-detail-add" onClick={addColumn}>
        <Plus size={13} strokeWidth={2} /> Add column
      </button>
    </aside>
  );
}

/**
 * Row Level Security status for the table. Honest by design: an inferred schema
 * has no policy info, so it reports "unknown" rather than falsely "insecure".
 */
function RlsRow({ table }: { table: DbTable }) {
  const policies = table.rls?.policies.length ?? 0;
  const enabled = Boolean(table.rls?.enabled);

  let tone: 'ok' | 'warn' | 'unknown';
  let Icon = ShieldQuestion;
  let label: string;
  let detail: string;

  if (table.isInferred) {
    tone = 'unknown';
    Icon = ShieldQuestion;
    label = 'RLS unknown';
    detail = 'Inferred schema — open the real migration to confirm row-level security.';
  } else if (enabled && policies > 0) {
    tone = 'ok';
    Icon = ShieldCheck;
    label = `Protected — ${policies} ${policies === 1 ? 'policy' : 'policies'}`;
    detail = 'Row Level Security is on and scoped by policies.';
  } else if (enabled) {
    tone = 'ok';
    Icon = ShieldCheck;
    label = 'RLS on — 0 policies';
    detail = 'RLS enabled with no policies denies all access by default.';
  } else if (policies > 0) {
    tone = 'warn';
    Icon = ShieldAlert;
    label = `${policies} ${policies === 1 ? 'policy' : 'policies'}, RLS not enabled`;
    detail = 'Policies exist but RLS is not enabled, so they are not enforced.';
  } else {
    tone = 'warn';
    Icon = ShieldAlert;
    label = 'No RLS';
    detail = 'No row-level security — the public/anon key can read every row.';
  }

  return (
    <div className={`db-detail-rls tone-${tone}`} title={detail}>
      <Icon size={14} strokeWidth={1.9} aria-hidden="true" />
      <div className="db-detail-rls-text">
        <span className="db-detail-rls-label">{label}</span>
        <span className="db-detail-rls-detail">{detail}</span>
      </div>
    </div>
  );
}

interface FlagChipProps {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}

function FlagChip({ active, onClick, title, children }: FlagChipProps) {
  return (
    <button
      type="button"
      className={`db-detail-chip ${active ? 'on' : ''}`}
      onClick={onClick}
      title={title}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}
