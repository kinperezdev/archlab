/**
 * Schema inference — the "Inferred" (amber) layer of the Database tab.
 *
 * When a project has no schema files, this guesses probable tables from app
 * code: TS interfaces/types/classes, req.body field access in route handlers,
 * form inputs, and language-specific models (Rails migrations, etc.). Every
 * result is a HEURISTIC GUESS and must always be presented as inferred /
 * unverified in the UI — never mixed with confirmed schema (see dbParser.ts
 * for the confirmed layer parsed from real .prisma/.sql/ORM files).
 */

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

type AddColumn = (tableName: string, col: InferredColumn) => void;

/**
 * Language-specific model/struct/entity/migration field extractors. Each feeds
 * the same column-upsert used by the TS interface scanner, so inferred SQL works
 * across Go, Python, Java/Kotlin, C#, and Ruby projects.
 */
function extractLanguageModels(
  ext: string,
  content: string,
  relPath: string,
  add: AddColumn,
): void {
  const fk = (name: string) => name.endsWith('Id') || name.endsWith('_id') || name.toLowerCase().endsWith('id');

  // Go structs with optional `json:"name"` tags.
  if (ext === '.go') {
    const structRe = /type\s+(\w+)\s+struct\s*\{([\s\S]*?)\}/g;
    let sm: RegExpExecArray | null;
    while ((sm = structRe.exec(content)) !== null) {
      const model = sm[1].replace(/Model$/, '');
      const body = sm[2];
      const fieldRe = /^\s*([A-Z]\w*)\s+([\w.*[\]]+)(?:\s+`([^`]*)`)?/gm;
      let f: RegExpExecArray | null;
      while ((f = fieldRe.exec(body)) !== null) {
        const jsonTag = f[3]?.match(/json:"(\w+)/);
        const name = (jsonTag?.[1] ?? f[1]).toLowerCase();
        if (!name || name === 'id') continue;
        add(model, { name, type: inferType(name, f[2]), isPk: false, isFk: fk(name) });
      }
    }
    return;
  }

  // Python dataclasses / Pydantic / Django models (annotated or assigned fields).
  if (ext === '.py') {
    const classRe = /class\s+(\w+)\s*\(?[^):]*\)?\s*:/g;
    let cm: RegExpExecArray | null;
    while ((cm = classRe.exec(content)) !== null) {
      const model = cm[1];
      if (/(Config|Meta|Form|Serializer)$/.test(model)) continue;
      const start = classRe.lastIndex;
      const next = content.slice(start).search(/\nclass\s/);
      const body = next === -1 ? content.slice(start) : content.slice(start, start + next);
      const fieldRe = /^\s{2,}(\w+)\s*[:=]\s*([\w.]+)/gm;
      let f: RegExpExecArray | null;
      while ((f = fieldRe.exec(body)) !== null) {
        const name = f[1];
        if (name.startsWith('__') || name === 'id' || name === 'objects') continue;
        add(model, { name, type: inferType(name, f[2]), isPk: false, isFk: fk(name) });
      }
    }
    return;
  }

  // Java fields (`private Long id;`) and Kotlin properties (`val id: Long`).
  if (ext === '.java' || ext === '.kt') {
    const model = content.match(/(?:data\s+)?class\s+(\w+)/)?.[1];
    if (!model) return;
    const javaRe = /(?:private|protected|public)\s+([\w<>]+)\s+(\w+)\s*[;=]/g;
    const ktRe = /\b(?:val|var)\s+(\w+)\s*:\s*([\w<>?]+)/g;
    let f: RegExpExecArray | null;
    while ((f = javaRe.exec(content)) !== null) {
      const name = f[2];
      if (name === 'id') continue;
      add(model, { name, type: inferType(name, f[1]), isPk: false, isFk: fk(name) });
    }
    while ((f = ktRe.exec(content)) !== null) {
      const name = f[1];
      if (name === 'id') continue;
      add(model, { name, type: inferType(name, f[2]), isPk: false, isFk: fk(name) });
    }
    return;
  }

  // C# auto-properties (`public string Email { get; set; }`).
  if (ext === '.cs') {
    const model = content.match(/class\s+(\w+)/)?.[1];
    if (!model) return;
    const propRe = /public\s+([\w<>?[\]]+)\s+(\w+)\s*\{/g;
    let f: RegExpExecArray | null;
    while ((f = propRe.exec(content)) !== null) {
      const name = f[2];
      if (name === 'Id') continue;
      add(model, { name, type: inferType(name, f[1]), isPk: false, isFk: fk(name) });
    }
    return;
  }

  // Ruby migrations (`create_table :users do |t| t.string :email`).
  if (ext === '.rb' || relPath.endsWith('.rb')) {
    const ctRe = /create_table\s+:(\w+)/g;
    let tm: RegExpExecArray | null;
    while ((tm = ctRe.exec(content)) !== null) {
      const table = tm[1];
      const start = ctRe.lastIndex;
      const next = content.slice(start).search(/^\s*end\b/m);
      const body = next === -1 ? content.slice(start) : content.slice(start, start + next);
      const colRe = /t\.(\w+)\s+:(\w+)/g;
      let f: RegExpExecArray | null;
      while ((f = colRe.exec(body)) !== null) {
        const type = f[1];
        const name = f[2];
        if (type === 'index' || type === 'timestamps') continue;
        add(table, { name, type: inferType(name, type), isPk: false, isFk: fk(name) });
      }
    }
  }
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

    // D. Multi-language model / struct / entity / migration definitions.
    extractLanguageModels(file.ext, content, file.relPath, addInferredColumn);
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
