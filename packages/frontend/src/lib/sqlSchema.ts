/**
 * Browser-side SQL schema model.
 *
 * Parses CREATE TABLE statements into a table/column model (ported from the
 * backend dbParser) and serializes a model back into SQL, so the Database
 * Designer can sync both directions: SQL editor -> canvas, and canvas -> SQL.
 */

export interface DbColumn {
  name: string;
  type: string;
  isPk: boolean;
  isFk: boolean;
  fkRelation?: { parentTable: string; parentColumn: string };
  isNotNull?: boolean;
  isUnique?: boolean;
  isInferred?: boolean;
  /** Display-only: the referenced column was missing and snapped to the PK. */
  fkAutoCorrected?: boolean;
  /** Display-only: the reference could not be resolved (no matching col / PK). */
  fkUnresolved?: boolean;
}

export interface DbTable {
  name: string;
  columns: DbColumn[];
  isInferred?: boolean;
}

/** Parse standard SQL `CREATE TABLE` statements into tables. */
export function parseSqlSchema(content: string): DbTable[] {
  const tables: DbTable[] = [];
  const createTableRegex = /create\s+table\s+(?:if\s+not\s+exists\s+)?["'`]?(\w+)["'`]?\s*\(([\s\S]*?)\);/gi;

  let match: RegExpExecArray | null;
  while ((match = createTableRegex.exec(content)) !== null) {
    const tableName = match[1];
    const body = match[2];
    
    // Check if the table header itself was inferred
    const headerPart = match[0].split('(')[0];
    const isTableInferred = headerPart.includes('@inferred');
    
    const columns: DbColumn[] = [];
    const fkConstraints: { local: string; parentTable: string; parentColumn: string }[] = [];

    for (const rawLine of body.split(',')) {
      const isColInferred = rawLine.includes('@inferred');
      const cleanLine = rawLine.replace(/--.*$/, '').trim();
      const trimmed = cleanLine.replace(/\s+/g, ' ');
      if (!trimmed || trimmed.startsWith('/*')) continue;
      const upper = trimmed.toUpperCase();

      if (upper.startsWith('FOREIGN KEY')) {
        const localMatch = trimmed.match(/foreign\s+key\s*\(([^)]+)\)/i);
        const refMatch = trimmed.match(/references\s+["'`]?(\w+)["'`]?\s*\(([^)]+)\)/i);
        if (localMatch && refMatch) {
          fkConstraints.push({
            local: localMatch[1].replace(/[`"']/g, '').trim(),
            parentTable: refMatch[1].trim(),
            parentColumn: refMatch[2].replace(/[`"']/g, '').trim(),
          });
        }
        continue;
      }

      if (upper.startsWith('PRIMARY KEY')) {
        const pkMatch = trimmed.match(/primary\s+key\s*\(([^)]+)\)/i);
        if (pkMatch) {
          const pkFields = pkMatch[1].split(',').map((s) => s.replace(/[`"']/g, '').trim());
          columns.forEach((col) => {
            if (pkFields.includes(col.name)) col.isPk = true;
          });
        }
        continue;
      }

      // Skip other table-level constraints.
      if (/^(CONSTRAINT|UNIQUE|CHECK|INDEX|KEY)\b/.test(upper)) continue;

      const parts = trimmed.split(' ');
      if (parts.length < 2) continue;
      const colName = parts[0].replace(/[`"']/g, '');
      const colType = parts[1].replace(/,$/, '');
      const isPk = upper.includes('PRIMARY KEY');
      const isNotNull = upper.includes('NOT NULL');
      const isUnique = upper.includes('UNIQUE') && !isPk;

      let isFk = false;
      let fkRelation: DbColumn['fkRelation'];
      const refMatch = trimmed.match(/references\s+["'`]?(\w+)["'`]?\s*\(([^)]+)\)/i);
      if (refMatch) {
        isFk = true;
        fkRelation = {
          parentTable: refMatch[1].trim(),
          parentColumn: refMatch[2].replace(/[`"']/g, '').trim(),
        };
      }

      columns.push({
        name: colName,
        type: colType,
        isPk,
        isFk,
        fkRelation,
        isNotNull,
        isUnique,
        isInferred: isColInferred
      });
    }

    for (const fk of fkConstraints) {
      const col = columns.find((c) => c.name === fk.local);
      if (col) {
        col.isFk = true;
        col.fkRelation = { parentTable: fk.parentTable, parentColumn: fk.parentColumn };
      }
    }

    tables.push({ name: tableName, columns, isInferred: isTableInferred });
  }

  return tables;
}

/** Serialize a table model back into clean PostgreSQL CREATE TABLE statements. */
export function serializeSqlSchema(tables: DbTable[]): string {
  return tables
    .map((table) => {
      const lines = table.columns.map((col) => {
        let line = `  ${col.name} ${col.type}`;
        if (col.isPk) line += ' PRIMARY KEY';
        if (col.isNotNull && !col.isPk) line += ' NOT NULL';
        if (col.isUnique && !col.isPk) line += ' UNIQUE';
        if (col.isFk && col.fkRelation) {
          line += ` REFERENCES ${col.fkRelation.parentTable}(${col.fkRelation.parentColumn})`;
        }
        if (col.isInferred) {
          line += ' -- @inferred';
        }
        return line;
      });
      const tableHeader = `CREATE TABLE ${table.name} (${table.isInferred ? ' -- @inferred' : ''}`;
      return `${tableHeader}\n${lines.join(',\n')}\n);`;
    })
    .join('\n\n');
}
