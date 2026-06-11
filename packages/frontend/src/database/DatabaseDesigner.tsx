import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  type Edge,
  type Node,
} from 'reactflow';
import { appendToIdeas } from '../lib/ideasStore.js';
import { loadSchema, saveSchema } from '../lib/schemaStore.js';
import {
  parseSqlSchema,
  serializeSqlSchema,
  type DbTable,
} from '../lib/sqlSchema.js';
import { CopyPromptButton } from '../components/CopyPromptButton.js';
import { promptForSchema } from '../lib/prompts.js';
import { neighborSet, highlightClass } from '../lib/highlight.js';
import { SchemaTableNode, type SchemaNodeData } from './SchemaTableNode.js';

const nodeTypes = { schemaTable: SchemaTableNode };

const SAMPLE_SQL = `CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  author_id INT REFERENCES users(id)
);`;

/** Lay tables out in a simple grid. */
function tablePosition(index: number): { x: number; y: number } {
  const col = index % 3;
  const row = Math.floor(index / 3);
  return { x: 80 + col * 340, y: 80 + row * 400 };
}

/** 1. Circular dependency checking */
function checkCircularDependencies(tables: DbTable[]): string | null {
  const adj: Record<string, string[]> = {};
  for (const t of tables) {
    adj[t.name] = [];
    for (const col of t.columns) {
      if (col.isFk && col.fkRelation) {
        adj[t.name].push(col.fkRelation.parentTable);
      }
    }
  }

  const visited: Record<string, 'visiting' | 'visited'> = {};
  const path: string[] = [];

  function dfs(node: string): string[] | null {
    if (visited[node] === 'visiting') {
      const cycleStart = path.indexOf(node);
      return [...path.slice(cycleStart), node];
    }
    if (visited[node] === 'visited') return null;

    visited[node] = 'visiting';
    path.push(node);

    const neighbors = adj[node] || [];
    for (const next of neighbors) {
      const cycle = dfs(next);
      if (cycle) return cycle;
    }

    path.pop();
    visited[node] = 'visited';
    return null;
  }

  for (const t of tables) {
    const cycle = dfs(t.name);
    if (cycle) {
      return `Circular dependency detected: ${cycle.join(' → ')}`;
    }
  }
  return null;
}

/** 2. Check if referenced column is a primary key */
interface FkValidationError {
  table: string;
  column: string;
  message: string;
}

function checkFkValidity(tables: DbTable[]): FkValidationError[] {
  const errors: FkValidationError[] = [];
  for (const t of tables) {
    for (const col of t.columns) {
      if (col.isFk && col.fkRelation) {
        const parent = tables.find((p) => p.name === col.fkRelation!.parentTable);
        if (!parent) {
          errors.push({
            table: t.name,
            column: col.name,
            message: `Table "${t.name}" references non-existent table "${col.fkRelation.parentTable}".`,
          });
        } else {
          const parentCol = parent.columns.find((c) => c.name === col.fkRelation!.parentColumn);
          if (!parentCol) {
            errors.push({
              table: t.name,
              column: col.name,
              message: `Table "${t.name}" references non-existent column "${col.fkRelation.parentColumn}" in table "${parent.name}".`,
            });
          } else if (!parentCol.isPk) {
            errors.push({
              table: t.name,
              column: col.name,
              message: `Warning: Column "${col.name}" references "${parent.name}.${parentCol.name}" which is not a PRIMARY KEY.`,
            });
          }
        }
      }
    }
  }
  return errors;
}

/** 3. Check for type mismatch between FK and PK */
interface TypeMismatchError {
  table: string;
  column: string;
  parentTable: string;
  parentColumn: string;
  type: string;
  parentType: string;
  message: string;
}

function checkFkTypeMismatches(tables: DbTable[]): TypeMismatchError[] {
  const mismatches: TypeMismatchError[] = [];
  for (const t of tables) {
    for (const col of t.columns) {
      if (col.isFk && col.fkRelation) {
        const parent = tables.find((p) => p.name === col.fkRelation!.parentTable);
        if (parent) {
          const parentCol = parent.columns.find((c) => c.name === col.fkRelation!.parentColumn);
          if (parentCol) {
            const t1 = col.type.toUpperCase().trim();
            const t2 = parentCol.type.toUpperCase().trim();
            
            const isInt1 = ['INT', 'INTEGER', 'SERIAL', 'BIGINT', 'BIGSERIAL'].includes(t1);
            const isInt2 = ['INT', 'INTEGER', 'SERIAL', 'BIGINT', 'BIGSERIAL'].includes(t2);
            const isString1 = ['TEXT', 'VARCHAR', 'CHAR', 'CHARACTER VARYING'].includes(t1);
            const isString2 = ['TEXT', 'VARCHAR', 'CHAR', 'CHARACTER VARYING'].includes(t2);

            const isCompatible = (isInt1 && isInt2) || (isString1 && isString2) || (t1 === t2);
            if (!isCompatible) {
              mismatches.push({
                table: t.name,
                column: col.name,
                parentTable: parent.name,
                parentColumn: parentCol.name,
                type: col.type,
                parentType: parentCol.type,
                message: `Type mismatch on "${t.name}.${col.name}" (${col.type}) referencing "${parent.name}.${parentCol.name}" (${parentCol.type}). Recommend matching the types (e.g. both INT/SERIAL or both TEXT).`,
              });
            }
          }
        }
      }
    }
  }
  return mismatches;
}

/** Build the FK relationship edges between table nodes. */
function buildEdges(
  tables: DbTable[],
  mismatches: TypeMismatchError[],
  validationErrors: FkValidationError[]
): Edge[] {
  const names = new Set(tables.map((t) => t.name));
  const edges: Edge[] = [];
  for (const table of tables) {
    for (const col of table.columns) {
      if (col.isFk && col.fkRelation && names.has(col.fkRelation.parentTable)) {
        const hasMismatch = mismatches.some(
          (m) => m.table === table.name && m.column === col.name
        );
        const hasInvalid = validationErrors.some(
          (e) => e.table === table.name && e.column === col.name && e.message.includes('not a PRIMARY KEY')
        );

        const isCriticalError = validationErrors.some(
          (e) => e.table === table.name && e.column === col.name && !e.message.includes('not a PRIMARY KEY')
        );

        let strokeColor = '#60a5fa'; 
        let strokeDash = undefined;

        if (hasMismatch || isCriticalError) {
          strokeColor = '#ef4444'; 
        } else if (hasInvalid) {
          strokeColor = '#f59e0b'; 
          strokeDash = '5 5';
        }

        edges.push({
          id: `fk_${table.name}_${col.name}`,
          source: table.name,
          target: col.fkRelation.parentTable,
          type: 'smoothstep',
          label: `${col.name} → ${col.fkRelation.parentColumn}`,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: strokeColor, strokeWidth: 2, strokeDasharray: strokeDash },
        });
      }
    }
  }
  return edges;
}

/** Merge explicit schema tables with inferred tables. */
function mergeSchemas(explicit: DbTable[], inferred: DbTable[]): DbTable[] {
  const merged: DbTable[] = explicit.map((t) => ({
    ...t,
    columns: t.columns.map((c) => ({ ...c })),
  }));

  for (const infTable of inferred) {
    const expTable = merged.find((t) => t.name.toLowerCase() === infTable.name.toLowerCase());
    if (!expTable) {
      merged.push({
        ...infTable,
        isInferred: true,
        columns: infTable.columns.map((c) => ({ ...c, isInferred: true })),
      });
    } else {
      for (const infCol of infTable.columns) {
        const expCol = expTable.columns.find((c) => c.name.toLowerCase() === infCol.name.toLowerCase());
        if (!expCol) {
          expTable.columns.push({
            ...infCol,
            isInferred: true,
          });
        }
      }
    }
  }
  return merged;
}

function DatabaseDesignerInner({ inferredSql }: { inferredSql: string | null }) {
  const [sql, setSql] = useState<string>('');
  const [tables, setTables] = useState<DbTable[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState<SchemaNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [sentToIdeas, setSentToIdeas] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [lockedNodeId, setLockedNodeId] = useState<string | null>(null);
  const activeNodeId = hoveredNodeId ?? lockedNodeId;

  // Use a ref to keep track of current nodes to preserve positions without causing loops
  const nodesRef = useRef<Node<SchemaNodeData>[]>([]);
  nodesRef.current = nodes;

  // Load saved SQL schema and merge with inferredSql
  useEffect(() => {
    loadSchema(SAMPLE_SQL).then((savedSql) => {
      const explicit = parseSqlSchema(savedSql);
      const inferred = parseSqlSchema(inferredSql || '');
      const merged = mergeSchemas(explicit, inferred);
      const mergedSql = serializeSqlSchema(merged);
      
      setSql(mergedSql);
      setTables(merged);
      console.log('DatabaseDesigner: initial load & merge parsed tables:', merged);
    });
  }, [inferredSql]);

  // Compute errors & validation warnings
  const circularWarning = useMemo(() => checkCircularDependencies(tables), [tables]);
  const validationErrors = useMemo(() => checkFkValidity(tables), [tables]);
  const typeMismatches = useMemo(() => checkFkTypeMismatches(tables), [tables]);

  // Sync React Flow nodes/edges with tables whenever they or selection changes.
  useEffect(() => {
    const computedEdges = buildEdges(tables, typeMismatches, validationErrors);
    const neighbors = activeNodeId ? neighborSet(activeNodeId, computedEdges) : null;
    
    const nextNodes = tables.map((table, i) => {
      const existing = nodesRef.current.find((n) => n.id === table.name);
      return {
        id: table.name,
        type: 'schemaTable',
        position: existing?.position || tablePosition(i),
        className: highlightClass(table.name, activeNodeId, neighbors),
        data: {
          table,
          allTables: tables,
          onUpdateTable: (next: DbTable) => updateTable(table.name, next),
        },
      };
    });

    setNodes(nextNodes);
    setEdges(computedEdges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tables, activeNodeId, setNodes, setEdges]);

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
    const parsed = parseSqlSchema(value);
    console.log('DatabaseDesigner: input changed parsed tables:', parsed);
    setTables(parsed);
    saveSchema(value);
  };

  // Canvas -> SQL.
  const applyTables = useCallback((next: DbTable[]) => {
    console.log('DatabaseDesigner: canvas updated applying tables:', next);
    setTables(next);
    const nextSql = serializeSqlSchema(next);
    setSql(nextSql);
    saveSchema(nextSql);
  }, []);

  const updateTable = useCallback(
    (tableName: string, updated: DbTable) => {
      const oldTable = tables.find((t) => t.name === tableName);
      if (!oldTable) return;

      let nextTables = tables.map((t) => (t.name === tableName ? updated : t));

      // 1. Cascade rename: If table name changed, update all FKs referencing it
      if (oldTable.name !== updated.name) {
        nextTables = nextTables.map((t) => {
          const columns = t.columns.map((col) => {
            if (col.isFk && col.fkRelation && col.fkRelation.parentTable === oldTable.name) {
              return {
                ...col,
                fkRelation: { ...col.fkRelation, parentTable: updated.name },
              };
            }
            return col;
          });
          return { ...t, columns };
        });
      }

      // 2. Cascade rename: If column name changed, update all FKs referencing that column
      oldTable.columns.forEach((oldCol, idx) => {
        const newCol = updated.columns[idx];
        if (newCol && oldCol.name !== newCol.name) {
          nextTables = nextTables.map((t) => {
            const columns = t.columns.map((col) => {
              if (
                col.isFk &&
                col.fkRelation &&
                col.fkRelation.parentTable === updated.name &&
                col.fkRelation.parentColumn === oldCol.name
              ) {
                return {
                  ...col,
                  fkRelation: { ...col.fkRelation, parentColumn: newCol.name },
                };
              }
              return col;
            });
            return { ...t, columns };
          });
        }
      });

      applyTables(nextTables);
    },
    [tables, applyTables]
  );

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

  const hasInferred = useMemo(() => {
    return tables.some((t) => t.isInferred || t.columns.some((c) => c.isInferred));
  }, [tables]);

  const acceptSuggestions = () => {
    const cleanTables = tables.map((t) => ({
      ...t,
      isInferred: false,
      columns: t.columns.map((c) => ({ ...c, isInferred: false })),
    }));
    const cleanSql = serializeSqlSchema(cleanTables);
    setSql(cleanSql);
    setTables(cleanTables);
    saveSchema(cleanSql);
    console.log('DatabaseDesigner: Accepted and saved suggestions to backend schema.');
  };

  return (
    <div className="db-designer">
      {/* 1/3 Width SQL Editor Panel */}
      <div className="db-editor-panel">
        <div className="db-editor-head">
          <h3>SQL Schema</h3>
          <div className="db-editor-actions">
            {hasInferred && (
              <button 
                className="btn" 
                onClick={acceptSuggestions}
                style={{ background: '#0f766e', color: '#ffffff' }}
              >
                Accept Suggestions
              </button>
            )}
            <CopyPromptButton
              prompt={() =>
                promptForSchema(
                  sql,
                  'review this schema and suggest improvements (indexes, missing relations, normalization, data types)'
                )
              }
              label="Copy Prompt"
            />
            <button className="btn" onClick={sendToIdeas}>
              {sentToIdeas ? 'Added ✓' : 'Add to Ideas'}
            </button>
          </div>
        </div>

        {/* Smart warnings overlay */}
        {(circularWarning || validationErrors.length > 0 || typeMismatches.length > 0) && (
          <div className="db-editor-warnings">
            {circularWarning && (
              <div className="warning-item critical">
                <strong>⚠️ Cycle:</strong> {circularWarning}
              </div>
            )}
            {validationErrors.map((err, i) => (
              <div key={`val-${i}`} className={`warning-item ${err.message.startsWith('Warning') ? 'amber' : 'critical'}`}>
                <strong>⚠️ Validation:</strong> {err.message}
              </div>
            ))}
            {typeMismatches.map((err, i) => (
              <div key={`mismatch-${i}`} className="warning-item critical">
                <strong>⚠️ Type Mismatch:</strong> {err.message}
              </div>
            ))}
          </div>
        )}

        <textarea
          className="db-sql-editor"
          spellCheck={false}
          value={sql}
          onChange={(e) => onSqlChange(e.target.value)}
          placeholder="Paste or write CREATE TABLE statements here…"
        />
        <p className="db-editor-hint">
          {tables.length} table(s) parsed. Select any table node on the right to edit columns visually.
        </p>
      </div>

      {/* 2/3 Width Canvas Panel */}
      <div className="db-canvas-panel">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.2}
          onNodeMouseEnter={(_e, n) => setHoveredNodeId(n.id)}
          onNodeMouseLeave={() => setHoveredNodeId(null)}
          onNodeClick={(_e, n) => setLockedNodeId(n.id)}
          onPaneClick={() => setLockedNodeId(null)}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} color="#cbd5e1" />
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

interface DatabaseDesignerProps {
  inferredSql: string | null;
}

export function DatabaseDesigner({ inferredSql }: DatabaseDesignerProps) {
  return (
    <ReactFlowProvider>
      <DatabaseDesignerInner inferredSql={inferredSql} />
    </ReactFlowProvider>
  );
}
