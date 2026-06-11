import type { ScanResult } from './scan.js';

export interface InferredColumn {
  name: string;
  type: string;
  isPk: boolean;
  isFk: boolean;
  fkRelation?: { parentTable: string; parentColumn: string };
  isNotNull?: boolean;
  isUnique?: boolean;
}

export interface InferredTable {
  name: string;
  columns: InferredColumn[];
}

function pluralize(name: string): string {
  const lower = name.toLowerCase().trim();
  if (!lower) return '';
  if (lower.endsWith('y')) return lower.slice(0, -1) + 'ies';
  if (lower.endsWith('s')) return lower;
  return lower + 's';
}

/** Guess PG data type from JS/TS type or field names. */
function inferType(fieldName: string, tsType: string): string {
  const upperField = fieldName.toUpperCase();
  const upperType = tsType.toUpperCase();

  if (upperField === 'ID') return 'SERIAL';
  if (upperField.endsWith('_ID') || upperField.endsWith('ID')) return 'INT';
  if (upperField.includes('PRICE') || upperField.includes('AMOUNT') || upperField.includes('BALANCE')) return 'NUMERIC';
  if (upperField.includes('IS_') || upperField.includes('HAS_') || upperType === 'BOOLEAN') return 'BOOLEAN';
  if (upperField.includes('DATE') || upperField.includes('TIME') || upperField.includes('AT') || upperType === 'DATE') return 'TIMESTAMP';
  if (upperType === 'NUMBER') return 'INT';
  return 'TEXT';
}

/** Analyze all files in the project to infer database tables and columns. */
export function inferSchemaFromAppFlow(scan: ScanResult): string {
  const tables: Map<string, Map<string, InferredColumn>> = new Map();

  // Helper to upsert a column
  const addInferredColumn = (tableName: string, col: InferredColumn) => {
    const pTable = pluralize(tableName);
    if (!pTable) return;
    if (!tables.has(pTable)) {
      tables.set(pTable, new Map());
    }
    const cols = tables.get(pTable)!;
    if (!cols.has(col.name)) {
      cols.set(col.name, col);
    } else {
      // Merge: preserve PK, FK status
      const existing = cols.get(col.name)!;
      if (col.isPk) existing.isPk = true;
      if (col.isFk) {
        existing.isFk = true;
        existing.fkRelation = col.fkRelation || existing.fkRelation;
      }
      if (col.isNotNull) existing.isNotNull = true;
      if (col.isUnique) existing.isUnique = true;
      if (col.type !== 'TEXT' && existing.type === 'TEXT') {
        existing.type = col.type; // Upgrade type from generic TEXT
      }
    }
  };

  // 1. Scan Model / Interface / Type Definitions
  // e.g. interface User { id: number; email: string; }
  const interfaceRegex = /(?:interface|type|class)\s+(\w+)\s*(?:extends\s+\w+)?\s*=?\s*\{([\s\S]*?)\}/g;
  const fieldRegex = /^\s*(\w+)\s*(\??)\s*:\s*([\w\[\]|<>]+)/;

  // 2. Scan API Route / Request body references
  // e.g. req.body.username, payload.userId
  const reqBodyRegex = /(?:req\.body|payload|data|input)\.(\w+)/g;

  // 3. Scan HTML/Form Inputs
  // e.g. <input name="email"
  const formInputRegex = /<input[^>]+name=["'](\w+)["']/g;

  for (const file of scan.files) {
    const content = file.content;
    if (!content) continue;

    // A. Run Interface/Model definitions parser
    let match: RegExpExecArray | null;
    interfaceRegex.lastIndex = 0;
    while ((match = interfaceRegex.exec(content)) !== null) {
      const modelName = match[1];
      // Skip generic utility/React helper names
      if (['Props', 'State', 'Config', 'Params', 'Payload', 'Response', 'Request'].some(s => modelName.endsWith(s))) {
        continue;
      }
      const body = match[2];
      const lines = body.split('\n');
      
      const tableName = pluralize(modelName);

      // Add a primary key by default for mapped interfaces
      addInferredColumn(tableName, {
        name: 'id',
        type: 'SERIAL',
        isPk: true,
        isFk: false,
        isNotNull: true,
      });

      for (const line of lines) {
        const fieldMatch = line.match(fieldRegex);
        if (fieldMatch) {
          const fieldName = fieldMatch[1];
          const isOptional = fieldMatch[2] === '?';
          const fieldType = fieldMatch[3];
          
          if (fieldName === 'id') continue; // PK already added

          // Check if it's a foreign key relation field, e.g. authorId or author_id
          const isFk = fieldName.endsWith('Id') || fieldName.endsWith('_id');
          let fkRelation: InferredColumn['fkRelation'] = undefined;
          if (isFk) {
            const relBase = fieldName.replace(/(Id|_id)$/, '');
            const parentTable = pluralize(relBase === 'author' ? 'user' : relBase); // default author -> users
            fkRelation = { parentTable, parentColumn: 'id' };
          }

          const isUnique = fieldName.toLowerCase() === 'email' || fieldName.toLowerCase() === 'username';

          addInferredColumn(tableName, {
            name: fieldName,
            type: inferType(fieldName, fieldType),
            isPk: false,
            isFk,
            fkRelation,
            isNotNull: !isOptional,
            isUnique,
          });
        }
      }
    }

    // B. Parse Request Body references to guess endpoint payloads
    // If a file is a route handler (e.g. includes router.post or router.put), we infer a table from the resource path
    const routeMatch = file.relPath.match(/(?:routes|controllers|endpoints)\/(\w+)/);
    if (routeMatch) {
      const resourceName = pluralize(routeMatch[1]);
      // Search for req.body.xyz in the route controller
      let bodyMatch: RegExpExecArray | null;
      reqBodyRegex.lastIndex = 0;
      while ((bodyMatch = reqBodyRegex.exec(content)) !== null) {
        const fieldName = bodyMatch[1];
        if (fieldName === 'id') continue;

        const isFk = fieldName.endsWith('Id') || fieldName.endsWith('_id');
        let fkRelation: InferredColumn['fkRelation'] = undefined;
        if (isFk) {
          const relBase = fieldName.replace(/(Id|_id)$/, '');
          const parentTable = pluralize(relBase === 'author' ? 'user' : relBase);
          fkRelation = { parentTable, parentColumn: 'id' };
        }

        addInferredColumn(resourceName, {
          name: fieldName,
          type: inferType(fieldName, 'string'),
          isPk: false,
          isFk,
          fkRelation,
        });
      }
    }

    // C. Scan frontend form inputs
    let formMatch: RegExpExecArray | null;
    formInputRegex.lastIndex = 0;
    while ((formMatch = formInputRegex.exec(content)) !== null) {
      const fieldName = formMatch[1];
      // Infer table name from file name if it looks like a component/page, e.g. PostForm.tsx -> posts
      const componentMatch = file.relPath.match(/\/(\w+)(?:Form|Create|Edit|Page)\.[jt]sx?$/);
      if (componentMatch) {
        const resourceName = pluralize(componentMatch[1]);
        addInferredColumn(resourceName, {
          name: fieldName,
          type: inferType(fieldName, 'string'),
          isPk: false,
          isFk: fieldName.endsWith('Id') || fieldName.endsWith('_id'),
        });
      }
    }
  }

  // 4. Build standard tables if we detected some FKs referencing missing tables
  // E.g. if we have orders referencing users, but we didn't scan users model, make sure users table exists!
  for (const [, cols] of tables.entries()) {
    for (const col of cols.values()) {
      if (col.isFk && col.fkRelation) {
        const parent = col.fkRelation.parentTable;
        if (!tables.has(parent)) {
          // Auto-generate parent table skeleton
          const parentCols = new Map<string, InferredColumn>();
          parentCols.set('id', {
            name: 'id',
            type: 'SERIAL',
            isPk: true,
            isFk: false,
            isNotNull: true,
          });
          // Add basic timestamp columns to parent
          parentCols.set('created_at', {
            name: 'created_at',
            type: 'TIMESTAMP',
            isPk: false,
            isFk: false,
          });
          tables.set(parent, parentCols);
        }
      }
    }
  }

  // 5. Serialize inferred tables to SQL DDL CREATE TABLE statements with comment tags
  const ddlBlocks: string[] = [];
  for (const [tName, cols] of tables.entries()) {
    const columnLines = Array.from(cols.values()).map((col) => {
      let line = `  ${col.name} ${col.type}`;
      if (col.isPk) line += ' PRIMARY KEY';
      if (col.isNotNull && !col.isPk) line += ' NOT NULL';
      if (col.isUnique && !col.isPk) line += ' UNIQUE';
      if (col.isFk && col.fkRelation) {
        line += ` REFERENCES ${col.fkRelation.parentTable}(${col.fkRelation.parentColumn})`;
      }
      line += ' -- @inferred';
      return line;
    });

    const block = `-- @inferred\nCREATE TABLE ${tName} ( -- @inferred\n${columnLines.join(',\n')}\n);`;
    ddlBlocks.push(block);
  }

  return ddlBlocks.join('\n\n');
}
