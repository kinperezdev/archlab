/**
 * Database tab — the two-way schema designer.
 *
 * Renders every table (confirmed from real schema files + inferred from app
 * code, visually distinct) as an ERD on a React Flow canvas with FK edges.
 * Editing SQL regenerates the diagram; editing a table card regenerates the
 * SQL. Search, confirmed/inferred filters, and pagination live in the toolbar.
 */

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
  useReactFlow,
  type Edge,
  type Node,
} from 'reactflow';
import { loadSchema, saveSchema } from '../lib/schemaStore.js';
import {
  parseSqlSchema,
  serializeSqlSchema,
  type DbColumn,
  type DbTable,
} from '../lib/sqlSchema.js';
import { CopyPromptButton } from '../components/CopyPromptButton.js';
import { promptForSchema } from '../lib/prompts.js';
import { neighborSet, highlightClass } from '../lib/highlight.js';
import { SchemaTableNode, type SchemaNodeData } from './SchemaTableNode.js';
import { DbTableDetail } from './DbTableDetail.js';
import {
  GroupContainer,
  RelationshipEdge,
  type RelationshipEdgeData,
} from './SchemaGraphParts.js';

const nodeTypes = { schemaTable: SchemaTableNode, dbGroup: GroupContainer };
const edgeTypes = { relationship: RelationshipEdge };

// Group-aware layout constants.
const NODE_W = 240;
const NODE_H_EST = 250;
const COL_PITCH = 420;
const ROW_PITCH = 420;
const GROUP_PAD = 60;
const GROUP_LABEL_H = 40;
const GROUP_GAP = 240;

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

/** Is a table confirmed (from a real schema file) vs inferred from app flow? */
function isInferredTable(t: DbTable): boolean {
  return Boolean(t.isInferred);
}

/**
 * Resolve every foreign-key reference against the columns that actually exist in
 * the referenced table. When the referenced column is missing, snap it to the
 * parent's primary key (auto-correct) or flag it unresolved. Display-only: this
 * never rewrites the user's SQL, it only informs the canvas + validation so we
 * never draw a broken connection.
 */
function resolveReferences(tables: DbTable[]): DbTable[] {
  const byName = new Map(tables.map((t) => [t.name.toLowerCase(), t]));
  return tables.map((t) => ({
    ...t,
    columns: t.columns.map((col) => {
      if (!col.isFk || !col.fkRelation) return col;
      const parent = byName.get(col.fkRelation.parentTable.toLowerCase());
      if (!parent) return { ...col, fkAutoCorrected: false, fkUnresolved: true };

      const exact = parent.columns.find(
        (c) => c.name.toLowerCase() === col.fkRelation!.parentColumn.toLowerCase(),
      );
      if (exact) {
        return {
          ...col,
          fkRelation: { parentTable: parent.name, parentColumn: exact.name },
          fkAutoCorrected: false,
          fkUnresolved: false,
        };
      }

      const pk = parent.columns.find((c) => c.isPk);
      if (pk) {
        return {
          ...col,
          fkRelation: { parentTable: parent.name, parentColumn: pk.name },
          fkAutoCorrected: true,
          fkUnresolved: false,
        };
      }
      return { ...col, fkAutoCorrected: false, fkUnresolved: true };
    }),
  }));
}

/** Whether a FK is an inferred / unverified relationship (amber) vs confirmed. */
function isInferredRelation(child: DbTable, col: DbColumn, parent: DbTable | undefined): boolean {
  return Boolean(
    col.isInferred ||
      col.fkAutoCorrected ||
      col.fkUnresolved ||
      child.isInferred ||
      parent?.isInferred,
  );
}

/** Relationship cardinality from the FK shape: unique/pk FK is one-to-one. */
function relationshipType(col: DbColumn): string {
  return col.isPk || col.isUnique ? 'one-to-one' : 'many-to-one';
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

/** 2. Validate FK references against the columns that actually exist. */
interface FkValidationError {
  table: string;
  column: string;
  message: string;
  /** "amber" for inferred / auto-corrected / unverified, "critical" otherwise. */
  severity: 'amber' | 'critical';
}

/**
 * Run on already-resolved tables: auto-corrected references resolve cleanly, so
 * the only things surfaced are genuine confirmed-schema problems (critical) and
 * inferred / unverified relationships (amber). No inferred reference is ever
 * flagged critical.
 */
function checkFkValidity(tables: DbTable[]): FkValidationError[] {
  const errors: FkValidationError[] = [];
  for (const t of tables) {
    for (const col of t.columns) {
      if (!col.isFk || !col.fkRelation) continue;
      const parent = tables.find((p) => p.name === col.fkRelation!.parentTable);
      const inferred = isInferredRelation(t, col, parent);

      if (!parent) {
        errors.push({
          table: t.name,
          column: col.name,
          severity: inferred ? 'amber' : 'critical',
          message: inferred
            ? `Inferred relationship: "${t.name}.${col.name}" → "${col.fkRelation.parentTable}" needs verification (table not in schema yet).`
            : `Table "${t.name}" references non-existent table "${col.fkRelation.parentTable}".`,
        });
        continue;
      }

      if (col.fkUnresolved) {
        errors.push({
          table: t.name,
          column: col.name,
          severity: 'amber',
          message: `Inferred relationship: "${t.name}.${col.name}" → "${parent.name}" could not be matched to a column or primary key. Needs verification.`,
        });
        continue;
      }

      if (col.fkAutoCorrected) {
        errors.push({
          table: t.name,
          column: col.name,
          severity: 'amber',
          message: `Inferred relationship: "${t.name}.${col.name}" was auto-corrected to "${parent.name}.${col.fkRelation.parentColumn}" (primary key). Verify this is correct.`,
        });
        continue;
      }

      const parentCol = parent.columns.find((c) => c.name === col.fkRelation!.parentColumn);
      if (parentCol && !parentCol.isPk) {
        errors.push({
          table: t.name,
          column: col.name,
          severity: 'amber',
          message: `Column "${col.name}" references "${parent.name}.${parentCol.name}" which is not a PRIMARY KEY.`,
        });
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

/** One foreign-key reference that a rename would auto-update. */
interface CascadedRef {
  table: string;
  column: string;
  from: string;
  to: string;
}

/** A staged rename awaiting user confirmation. */
interface PendingRename {
  nextTables: DbTable[];
  cascaded: CascadedRef[];
}

const EDGE_BLUE = '#2563eb';
const EDGE_AMBER = '#f59e0b';

/**
 * Build FK relationship edges. Confirmed references render as solid blue lines;
 * inferred / auto-corrected / unverified references render as dashed amber.
 * Each edge carries a relationship-type label and a column tooltip. No edge is
 * ever drawn unless the reference resolves to a real column (after auto-correct).
 */
function buildEdges(tables: DbTable[]): Edge<RelationshipEdgeData>[] {
  const byName = new Map(tables.map((t) => [t.name, t]));
  const edges: Edge<RelationshipEdgeData>[] = [];
  for (const table of tables) {
    for (const col of table.columns) {
      if (!col.isFk || !col.fkRelation) continue;
      const parent = byName.get(col.fkRelation.parentTable);
      if (!parent) continue; // unresolved table: surfaced as a warning, not a line

      const inferred = isInferredRelation(table, col, parent);
      const color = inferred ? EDGE_AMBER : EDGE_BLUE;
      const relType = relationshipType(col);

      let note = '';
      if (col.fkAutoCorrected) note = ' (auto-corrected to primary key — verify)';
      else if (col.fkUnresolved) note = ' (unresolved — inferred, needs verification)';
      else if (inferred) note = ' (inferred relationship — needs verification)';

      edges.push({
        id: `fk_${table.name}_${col.name}`,
        source: table.name,
        target: parent.name,
        type: 'relationship',
        markerEnd: { type: MarkerType.ArrowClosed, color, width: 18, height: 18 },
        style: { stroke: color, strokeWidth: 2, strokeDasharray: inferred ? '6 4' : undefined },
        data: {
          relType,
          inferred,
          tooltip: `${table.name}.${col.name} → ${parent.name}.${col.fkRelation.parentColumn} · ${relType}${note}`,
        },
      });
    }
  }
  return edges;
}

/** Bounding box that wraps a set of node positions, with group padding + label. */
function groupBox(positions: { x: number; y: number }[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const xs = positions.map((p) => p.x);
  const ys = positions.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs) + NODE_W;
  const maxY = Math.max(...ys) + NODE_H_EST;
  return {
    x: minX - GROUP_PAD,
    y: minY - GROUP_PAD - GROUP_LABEL_H,
    width: maxX - minX + GROUP_PAD * 2,
    height: maxY - minY + GROUP_PAD * 2 + GROUP_LABEL_H,
  };
}

/**
 * Columns for a group's grid. Scales with table count (roughly square, capped)
 * so a big group lays out wide-and-short instead of one very tall strip.
 */
function gridCols(count: number): number {
  if (count <= 3) return 1;
  return Math.min(6, Math.ceil(Math.sqrt(count)));
}

/** Default grid position for a table within its group column. */
function defaultPos(originX: number, index: number, count: number): { x: number; y: number } {
  const cols = gridCols(count);
  const c = index % cols;
  const r = Math.floor(index / cols);
  return {
    x: originX + GROUP_PAD + c * COL_PITCH,
    y: GROUP_PAD + GROUP_LABEL_H + r * ROW_PITCH,
  };
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
  // Last persisted SQL. Edits stay live on the canvas but only this snapshot is
  // saved; Save updates it, Discard rolls back to it. `sql !== savedSql` = dirty.
  const [savedSql, setSavedSql] = useState<string>('');
  const [nodes, setNodes, onNodesChange] = useNodesState<SchemaNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [lockedNodeId, setLockedNodeId] = useState<string | null>(null);
  const [pendingRename, setPendingRename] = useState<PendingRename | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);
  // Large-schema controls (only active when >50 tables are detected).
  const [search, setSearch] = useState('');
  const [dbFilter, setDbFilter] = useState<'all' | 'confirmed' | 'inferred' | 'related'>('all');
  const [showAll, setShowAll] = useState(false);
  const activeNodeId = hoveredNodeId ?? lockedNodeId;
  const { fitView } = useReactFlow();

  // Use a ref to keep track of current nodes to preserve positions without causing loops
  const nodesRef = useRef<Node<SchemaNodeData>[]>([]);
  nodesRef.current = nodes;

  // Debounce hover so a fast mouse sweep across tables doesn't fire a highlight
  // update for every node it crosses.
  const hoverTimerRef = useRef<number | null>(null);
  const hoverTable = useCallback((id: string | null) => {
    if (hoverTimerRef.current !== null) clearTimeout(hoverTimerRef.current);
    if (id === null) {
      setHoveredNodeId(null);
      return;
    }
    hoverTimerRef.current = window.setTimeout(() => setHoveredNodeId(id), 60);
  }, []);
  useEffect(
    () => () => {
      if (hoverTimerRef.current !== null) clearTimeout(hoverTimerRef.current);
    },
    [],
  );

  // Load saved SQL schema and merge with inferredSql
  useEffect(() => {
    loadSchema(SAMPLE_SQL).then((savedSql) => {
      const explicit = parseSqlSchema(savedSql);
      const inferred = parseSqlSchema(inferredSql || '');
      const merged = mergeSchemas(explicit, inferred);
      const mergedSql = serializeSqlSchema(merged);
      
      setSql(mergedSql);
      setTables(merged);
      setSavedSql(mergedSql); // baseline: a freshly loaded schema is not "dirty"
    });
  }, [inferredSql]);

  // Resolve FK references (auto-correct to PK / flag unresolved) for display.
  const resolvedTables = useMemo(() => resolveReferences(tables), [tables]);

  // Compute errors & validation warnings against the resolved schema.
  const circularWarning = useMemo(() => checkCircularDependencies(resolvedTables), [resolvedTables]);
  const validationErrors = useMemo(() => checkFkValidity(resolvedTables), [resolvedTables]);
  const typeMismatches = useMemo(() => checkFkTypeMismatches(resolvedTables), [resolvedTables]);
  const totalIssues = useMemo(() => {
    return (circularWarning ? 1 : 0) + validationErrors.length + typeMismatches.length;
  }, [circularWarning, validationErrors, typeMismatches]);

  // Large-schema handling: above this many tables, the canvas filters/searches
  // instead of rendering everything at once.
  const LARGE_SCHEMA = resolvedTables.length > 50;
  const DEFAULT_LIMIT = 20;

  // Tables that participate in at least one foreign-key relationship (either
  // side). These are always worth showing even in the capped default view.
  const tablesWithRelationships = useMemo(() => {
    const set = new Set<string>();
    for (const t of resolvedTables) {
      for (const c of t.columns) {
        if (c.isFk && c.fkRelation) {
          set.add(t.name);
          set.add(c.fkRelation.parentTable);
        }
      }
    }
    return set;
  }, [resolvedTables]);

  // The subset of tables actually rendered on the canvas, after search/filter and
  // the default "first 20 + related" cap. Only engaged for large schemas.
  const visibleTables = useMemo(() => {
    if (!LARGE_SCHEMA) return resolvedTables;
    const q = search.trim().toLowerCase();
    let list = resolvedTables;
    if (q) list = list.filter((t) => t.name.toLowerCase().includes(q));
    if (dbFilter === 'confirmed') list = list.filter((t) => !isInferredTable(t));
    else if (dbFilter === 'inferred') list = list.filter((t) => isInferredTable(t));
    else if (dbFilter === 'related') list = list.filter((t) => tablesWithRelationships.has(t.name));

    // Default capped view: first 20 plus every related table. Search or an
    // explicit filter bypasses the cap so results are never hidden.
    if (!q && dbFilter === 'all' && !showAll) {
      const merged = new Map<string, DbTable>();
      for (const t of list.slice(0, DEFAULT_LIMIT)) merged.set(t.name, t);
      for (const t of list) if (tablesWithRelationships.has(t.name)) merged.set(t.name, t);
      return [...merged.values()];
    }
    return list;
  }, [LARGE_SCHEMA, resolvedTables, search, dbFilter, showAll, tablesWithRelationships]);

  const canLoadMore =
    LARGE_SCHEMA && !showAll && dbFilter === 'all' && !search.trim() && visibleTables.length < resolvedTables.length;

  // Build the React Flow nodes/edges ONLY when the schema structure changes.
  // Highlight state (hover/lock) is intentionally NOT a dependency here — it is
  // patched onto the existing nodes by the effect below — so hovering a table
  // never rebuilds the whole graph (which is what made it flicker).
  useEffect(() => {
    const computedEdges = buildEdges(visibleTables);

    const confirmed = visibleTables.filter((t) => !isInferredTable(t));
    const inferred = visibleTables.filter((t) => isInferredTable(t));

    // Confirmed group sits on the left; inferred to its right.
    const confCols = gridCols(confirmed.length);
    const confWidth = GROUP_PAD * 2 + (confCols - 1) * COL_PITCH + NODE_W;
    const inferredOriginX = confirmed.length > 0 ? confWidth + GROUP_GAP : 0;

    const positionFor = (table: DbTable, list: DbTable[], idx: number, originX: number) => {
      const existing = nodesRef.current.find((n) => n.id === table.name);
      return existing?.position || defaultPos(originX, idx, list.length);
    };
    const confPositions = confirmed.map((t, i) => positionFor(t, confirmed, i, 0));
    const infPositions = inferred.map((t, i) => positionFor(t, inferred, i, inferredOriginX));

    // Tinted group backdrops behind the table nodes.
    const groupNodes: Node[] = [];
    if (confirmed.length > 0) {
      const box = groupBox(confPositions);
      groupNodes.push({
        id: '__group_confirmed',
        type: 'dbGroup',
        position: { x: box.x, y: box.y },
        data: { label: 'Confirmed Schema', variant: 'confirmed', width: box.width, height: box.height },
        draggable: false,
        selectable: false,
        connectable: false,
        zIndex: 0,
        style: { width: box.width, height: box.height },
      });
    }
    if (inferred.length > 0) {
      const box = groupBox(infPositions);
      groupNodes.push({
        id: '__group_inferred',
        type: 'dbGroup',
        position: { x: box.x, y: box.y },
        data: {
          label: 'Inferred from App Flow',
          variant: 'inferred',
          width: box.width,
          height: box.height,
        },
        draggable: false,
        selectable: false,
        connectable: false,
        zIndex: 0,
        style: { width: box.width, height: box.height },
      });
    }

    const tableNode = (table: DbTable, position: { x: number; y: number }): Node<SchemaNodeData> => ({
      id: table.name,
      type: 'schemaTable',
      position,
      zIndex: 1,
      data: {
        table,
        allTables: resolvedTables,
        onUpdateTable: (next: DbTable) => updateTable(table.name, next),
      },
    });

    const tableNodes: Node<SchemaNodeData>[] = [
      ...confirmed.map((t, i) => tableNode(t, confPositions[i])),
      ...inferred.map((t, i) => tableNode(t, infPositions[i])),
    ];

    // Group backdrops first so they render behind the table nodes.
    setNodes([...groupNodes, ...tableNodes] as Node<SchemaNodeData>[]);
    setEdges(computedEdges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleTables, resolvedTables, setNodes, setEdges]);

  // Raise the selected node above its neighbors (patched in place, no rebuild) so
  // an expanded/taller node is never covered by adjacent ones.
  useEffect(() => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.type === 'dbGroup') return n; // backdrops stay behind everything
        const z = n.id === lockedNodeId ? 1000 : 1;
        return n.zIndex === z ? n : { ...n, zIndex: z };
      }),
    );
  }, [lockedNodeId, setNodes]);

  // Patch the hover/lock highlight onto the EXISTING nodes in place. Only the
  // className changes, and only for nodes whose state actually flips, so a hover
  // re-renders a couple of nodes instead of rebuilding the entire canvas.
  useEffect(() => {
    const neighbors = activeNodeId ? neighborSet(activeNodeId, edges) : null;
    setNodes((prev) => {
      let changed = false;
      const next = prev.map((node) => {
        // Group backdrops are never highlighted.
        if (node.type === 'dbGroup') return node;
        const cls = highlightClass(node.id, activeNodeId, neighbors);
        const normalized = cls || undefined;
        if ((node.className ?? undefined) === normalized) return node;
        changed = true;
        return { ...node, className: normalized };
      });
      return changed ? next : prev;
    });
  }, [activeNodeId, edges, setNodes]);

  // Escape releases the locked highlight.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLockedNodeId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // SQL editor -> canvas.
  // Edits update live state only — persistence happens on Save (see savedSql).
  const onSqlChange = (value: string) => {
    setSql(value);
    const parsed = parseSqlSchema(value);
    setTables(parsed);
  };

  // Canvas -> SQL.
  const applyTables = useCallback((next: DbTable[]) => {
    setTables(next);
    const nextSql = serializeSqlSchema(next);
    setSql(nextSql);
  }, []);

  const updateTable = useCallback(
    (tableName: string, updated: DbTable) => {
      const oldTable = tables.find((t) => t.name === tableName);
      if (!oldTable) return;

      let nextTables = tables.map((t) => (t.name === tableName ? updated : t));
      // Track every FK reference that a rename would auto-update, so we can ask
      // the user to confirm before silently changing other tables.
      const cascaded: CascadedRef[] = [];

      // 1. Cascade rename: If table name changed, update all FKs referencing it
      if (oldTable.name !== updated.name) {
        nextTables = nextTables.map((t) => {
          const columns = t.columns.map((col) => {
            if (col.isFk && col.fkRelation && col.fkRelation.parentTable === oldTable.name) {
              cascaded.push({
                table: t.name,
                column: col.name,
                from: `${oldTable.name}.${col.fkRelation.parentColumn}`,
                to: `${updated.name}.${col.fkRelation.parentColumn}`,
              });
              return { ...col, fkRelation: { ...col.fkRelation, parentTable: updated.name } };
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
                cascaded.push({
                  table: t.name,
                  column: col.name,
                  from: `${updated.name}.${oldCol.name}`,
                  to: `${updated.name}.${newCol.name}`,
                });
                return { ...col, fkRelation: { ...col.fkRelation, parentColumn: newCol.name } };
              }
              return col;
            });
            return { ...t, columns };
          });
        }
      });

      // When a rename ripples into other tables, confirm before applying so the
      // user sees exactly which references will be auto-updated.
      if (cascaded.length > 0) {
        setPendingRename({ nextTables, cascaded });
      } else {
        applyTables(nextTables);
      }
    },
    [tables, applyTables]
  );

  const hasInferred = useMemo(() => {
    return tables.some((t) => t.isInferred || t.columns.some((c) => c.isInferred));
  }, [tables]);

  // The table whose node is selected — its detail opens in the right panel,
  // matching the full-flow Canvas pattern. Group backdrops never match a table.
  const selectedTable = useMemo(
    () => (lockedNodeId ? tables.find((t) => t.name === lockedNodeId) ?? null : null),
    [lockedNodeId, tables],
  );

  const acceptSuggestions = () => {
    const cleanTables = tables.map((t) => ({
      ...t,
      isInferred: false,
      columns: t.columns.map((c) => ({ ...c, isInferred: false })),
    }));
    const cleanSql = serializeSqlSchema(cleanTables);
    setSql(cleanSql);
    setTables(cleanTables);
  };

  // Global dirty-state Save / Discard for the whole schema.
  const isDirty = sql !== savedSql;
  const saveAll = () => {
    saveSchema(sql);
    setSavedSql(sql);
  };
  const discardAll = () => {
    setSql(savedSql);
    setTables(parseSqlSchema(savedSql));
    setPendingRename(null);
  };

  return (
    <div
      className="db-designer"
      style={{
        gridTemplateColumns: [
          showEditor ? 'minmax(280px, 33%)' : null,
          '1fr',
          selectedTable ? 'minmax(300px, 340px)' : null,
        ]
          .filter(Boolean)
          .join(' '),
      }}
    >
      {/* 1/3 Width SQL Editor Panel */}
      {showEditor && (
        <div className="db-editor-panel">
          <div className="db-editor-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <h3>SQL Schema</h3>
              {totalIssues > 0 && (
                <button
                  className="warning-toggle-badge"
                  onClick={() => setShowWarnings(!showWarnings)}
                  title={`${totalIssues} schema issues detected. Click to toggle list.`}
                  style={{
                    background: showWarnings ? '#ef4444' : '#f59e0b',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '2px 8px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  ⚠️ {totalIssues} {showWarnings ? 'Hide' : 'Issues'}
                </button>
              )}
            </div>
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
            </div>
          </div>

          {/* Smart warnings overlay */}
          {showWarnings && (circularWarning || validationErrors.length > 0 || typeMismatches.length > 0) && (
            <div className="db-editor-warnings">
              {circularWarning && (
                <div className="warning-item critical">
                  <strong>⚠️ Cycle:</strong> {circularWarning}
                </div>
              )}
              {validationErrors.map((err, i) => (
                <div key={`val-${i}`} className={`warning-item ${err.severity}`}>
                  <strong>{err.severity === 'amber' ? '💡 Inferred:' : '⚠️ Validation:'}</strong>{' '}
                  {err.message}
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

          <button
            className="db-editor-collapse-btn"
            onClick={() => setShowEditor(false)}
            title="Hide SQL Editor"
          >
            ◀
          </button>
        </div>
      )}

      {/* 2/3 Width Canvas Panel */}
      <div className="db-canvas-panel">
        {!showEditor && (
          <button
            className="db-editor-reveal-tab"
            onClick={() => setShowEditor(true)}
            title="Show SQL Editor"
          >
            ▶
          </button>
        )}

        {/* Unsaved-changes bar: edits stay live, but only persist on Save. */}
        {isDirty && (
          <div className="db-dirty-bar">
            <span className="db-dirty-label">Unsaved schema changes</span>
            <button className="db-dirty-btn discard" onClick={discardAll}>
              Discard
            </button>
            <button className="db-dirty-btn save" onClick={saveAll}>
              Save
            </button>
          </div>
        )}

        {LARGE_SCHEMA && (
          <div className="db-canvas-toolbar">
            <input
              className="db-search-input"
              type="text"
              placeholder="Search tables…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="db-filter-group">
              {([
                ['all', 'All'],
                ['confirmed', 'Confirmed'],
                ['inferred', 'Inferred'],
                ['related', 'With relationships'],
              ] as const).map(([val, label]) => (
                <button
                  key={val}
                  className={`db-filter-btn ${dbFilter === val ? 'active' : ''}`}
                  onClick={() => setDbFilter(val)}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              className="db-filter-btn"
              onClick={() => fitView({ duration: 400, maxZoom: 1 })}
              title="Zoom to fit visible tables"
            >
              ⤢ Zoom to fit
            </button>
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          minZoom={0.2}
          /* Perf: don't elevate/focus nodes, and on large schemas only mount the
             tables inside the viewport so zoom/pan stays smooth. */
          elevateNodesOnSelect={false}
          nodesFocusable={false}
          edgesFocusable={false}
          onlyRenderVisibleElements={LARGE_SCHEMA}
          onNodeMouseEnter={(_e, n) => {
            if (n.type === 'dbGroup') return; // hovering the backdrop isn't a table
            hoverTable(n.id);
          }}
          onNodeMouseLeave={() => hoverTable(null)}
          onNodeClick={(_e, n) => {
            if (n.type === 'dbGroup') return;
            setLockedNodeId(n.id);
          }}
          onPaneClick={() => setLockedNodeId(null)}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} color="rgba(255,255,255,0.05)" />
          <MiniMap pannable zoomable className="arch-minimap" />
          <Controls showInteractive={false} />
        </ReactFlow>
        {tables.length === 0 && (
          <div className="db-canvas-empty">
            <p>Write a CREATE TABLE statement on the left to generate tables here.</p>
          </div>
        )}

        {LARGE_SCHEMA && (
          <div className="db-canvas-count">
            {canLoadMore && (
              <button className="db-filter-btn" onClick={() => setShowAll(true)}>
                Load More
              </button>
            )}
            <span className="db-canvas-count-label">
              Showing {visibleTables.length} of {resolvedTables.length} tables
            </span>
            {showAll && (
              <button
                className="db-filter-btn"
                onClick={() => {
                  setShowAll(false);
                  // Re-frame the now-smaller set (scroll the table view back to top).
                  fitView({ duration: 400, maxZoom: 1 });
                }}
              >
                Show Less
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right detail panel: edit the selected table's columns + keys. */}
      {selectedTable && (
        <DbTableDetail
          table={selectedTable}
          onCommit={updateTable}
          onClose={() => setLockedNodeId(null)}
        />
      )}

      {/* Rename confirmation: list every FK reference that will auto-update. */}
      {pendingRename && (
        <div className="db-rename-overlay" onClick={() => setPendingRename(null)}>
          <div className="db-rename-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Update foreign key references?</h3>
            <p className="db-rename-sub">
              This rename affects {pendingRename.cascaded.length} reference
              {pendingRename.cascaded.length === 1 ? '' : 's'} in other tables. They will be kept in
              sync automatically:
            </p>
            <ul className="db-rename-list">
              {pendingRename.cascaded.map((c, i) => (
                <li key={i}>
                  <code>{c.table}.{c.column}</code>: <span className="db-rename-from">{c.from}</span>{' '}
                  → <span className="db-rename-to">{c.to}</span>
                </li>
              ))}
            </ul>
            <div className="db-rename-actions">
              <button className="btn" onClick={() => setPendingRename(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  applyTables(pendingRename.nextTables);
                  setPendingRename(null);
                }}
              >
                Update all references
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface DatabaseDesignerProps {
  inferredSql: string | null;
  hasProject: boolean;
}

export function DatabaseDesigner({ inferredSql, hasProject }: DatabaseDesignerProps) {
  // Gate the empty state here so the inner component (with all its hooks) only
  // mounts once a project exists. Returning early from inside the inner
  // component would change its hook count when a project loads and crash it.
  if (!hasProject) {
    return (
      <div
        className="db-designer-empty-state"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 'var(--space-3)', color: 'var(--color-text-dim)', textAlign: 'center', background: 'var(--color-surface)', padding: 'var(--space-6)' }}
      >
        <span style={{ fontSize: '48px', marginBottom: '8px' }}>📂</span>
        <h3 style={{ margin: 0, color: 'var(--color-text)', fontSize: 'var(--text-lg)' }}>No Active Project</h3>
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', maxWidth: '400px' }}>
          Please load a project directory via the terminal below or run the <code>archlab</code> CLI in your terminal to start designing its database schema.
        </p>
      </div>
    );
  }
  return (
    <ReactFlowProvider>
      <DatabaseDesignerInner inferredSql={inferredSql} />
    </ReactFlowProvider>
  );
}
