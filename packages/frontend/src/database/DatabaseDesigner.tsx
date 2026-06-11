/**
 * Database Schema Designer: a SQL editor on the left and a live table-node canvas
 * on the right. Typing SQL regenerates the canvas; editing tables on the canvas
 * regenerates the SQL. Foreign keys draw connection lines between tables. The
 * schema persists locally, and tables can be pushed into the Ideas canvas to
 * build a full database -> backend -> frontend diagram.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlowProvider,
  type Edge,
  type Node,
} from 'reactflow';
import { loadJSON, saveJSON } from '../lib/storage.js';
import { appendToIdeas } from '../lib/ideasStore.js';
import {
  parseSqlSchema,
  serializeSqlSchema,
  type DbTable,
} from '../lib/sqlSchema.js';
import { CopyPromptButton } from '../components/CopyPromptButton.js';
import { promptForSchema } from '../lib/prompts.js';
import { neighborSet, highlightClass } from '../lib/highlight.js';
import { SchemaTableNode, type SchemaNodeData } from './SchemaTableNode.js';

const SQL_KEY = 'archlab.database.sql.v1';
const nodeTypes = { schemaTable: SchemaTableNode };

const SAMPLE_SQL = `CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMP
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title TEXT,
  author_id INT REFERENCES users(id)
);`;

/** Lay tables out in a simple grid. */
function tablePosition(index: number): { x: number; y: number } {
  const col = index % 3;
  const row = Math.floor(index / 3);
  return { x: 80 + col * 340, y: 80 + row * 320 };
}

/** Build the FK relationship edges between table nodes. */
function buildEdges(tables: DbTable[]): Edge[] {
  const names = new Set(tables.map((t) => t.name));
  const edges: Edge[] = [];
  for (const table of tables) {
    for (const col of table.columns) {
      if (col.isFk && col.fkRelation && names.has(col.fkRelation.parentTable)) {
        edges.push({
          id: `fk_${table.name}_${col.name}`,
          source: table.name,
          target: col.fkRelation.parentTable,
          type: 'smoothstep',
          label: `${col.name} → ${col.fkRelation.parentColumn}`,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: '#60a5fa', strokeWidth: 2 },
        });
      }
    }
  }
  return edges;
}

function DatabaseDesignerInner() {
  const [sql, setSql] = useState<string>(() => loadJSON<string>(SQL_KEY, SAMPLE_SQL));
  const [tables, setTables] = useState<DbTable[]>(() => parseSqlSchema(loadJSON<string>(SQL_KEY, SAMPLE_SQL)));
  const [sentToIdeas, setSentToIdeas] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [lockedNodeId, setLockedNodeId] = useState<string | null>(null);
  const activeNodeId = hoveredNodeId ?? lockedNodeId;

  // Escape releases the locked highlight.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLockedNodeId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // SQL editor -> canvas.
  const onSqlChange = (value: string) => {
    setSql(value);
    setTables(parseSqlSchema(value));
    saveJSON(SQL_KEY, value);
  };

  // Canvas -> SQL.
  const applyTables = useCallback((next: DbTable[]) => {
    setTables(next);
    const nextSql = serializeSqlSchema(next);
    setSql(nextSql);
    saveJSON(SQL_KEY, nextSql);
  }, []);

  const updateTable = useCallback(
    (name: string, updated: DbTable) => {
      applyTables(tables.map((t) => (t.name === name ? updated : t)));
    },
    [tables, applyTables],
  );

  const edges = useMemo(() => buildEdges(tables), [tables]);

  const nodes: Node<SchemaNodeData>[] = useMemo(() => {
    const neighbors = activeNodeId ? neighborSet(activeNodeId, edges) : null;
    return tables.map((table, i) => ({
      id: table.name,
      type: 'schemaTable',
      position: tablePosition(i),
      className: highlightClass(table.name, activeNodeId, neighbors),
      data: {
        table,
        onUpdateTable: (next: DbTable) => updateTable(table.name, next),
      },
    }));
  }, [tables, updateTable, edges, activeNodeId]);

  const sendToIdeas = async () => {
    const base = Date.now();
    const newNodes: Node[] = tables.map((t, i) => ({
      id: `idea_db_${base + i}`,
      type: 'idea',
      position: { x: 120 + (i % 3) * 220, y: 120 + Math.floor(i / 3) * 160 },
      data: { label: t.name, ideaKind: 'database-table' },
    }));
    await appendToIdeas(newNodes);
    setSentToIdeas(true);
    setTimeout(() => setSentToIdeas(false), 1800);
  };

  return (
    <div className="db-designer">
      <div className="db-editor-panel">
        <div className="db-editor-head">
          <h3>SQL Schema</h3>
          <div className="db-editor-actions">
            <CopyPromptButton
              prompt={() =>
                promptForSchema(sql, 'review this schema and suggest improvements (indexes, missing relations, normalization, data types)')
              }
              label="Copy Prompt"
            />
            <button className="btn" onClick={sendToIdeas}>
              {sentToIdeas ? 'Added ✓' : 'Add to Ideas'}
            </button>
          </div>
        </div>
        <textarea
          className="db-sql-editor"
          spellCheck={false}
          value={sql}
          onChange={(e) => onSqlChange(e.target.value)}
          placeholder="Paste or write CREATE TABLE statements here…"
        />
        <p className="db-editor-hint">
          {tables.length} table(s) parsed. Edit cells on the right to update this SQL.
        </p>
      </div>

      <div className="db-canvas-panel">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.2}
          onNodeMouseEnter={(_e, n) => setHoveredNodeId(n.id)}
          onNodeMouseLeave={() => setHoveredNodeId(null)}
          onNodeClick={(_e, n) => setLockedNodeId(n.id)}
          onPaneClick={() => setLockedNodeId(null)}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Lines} gap={36} color="#e4e4e7" />
          <MiniMap pannable zoomable className="arch-minimap" />
          <Controls showInteractive={false} />
        </ReactFlow>
        {tables.length === 0 && (
          <div className="db-canvas-empty">
            <p>Write a CREATE TABLE statement on the left to generate tables here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function DatabaseDesigner() {
  return (
    <ReactFlowProvider>
      <DatabaseDesignerInner />
    </ReactFlowProvider>
  );
}
