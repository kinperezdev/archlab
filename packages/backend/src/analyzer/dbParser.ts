/**
 * Database Schema Parser.
 * Parses SQL and Prisma schema files to extract tables, columns,
 * primary keys, foreign keys, and relationships.
 */

export interface DbColumn {
  name: string;
  type: string;
  isPk: boolean;
  isFk: boolean;
  fkRelation?: {
    parentTable: string;
    parentColumn: string;
  };
}

export interface DbTable {
  name: string;
  columns: DbColumn[];
}

/** Parses Prisma schema file content. */
export function parsePrismaSchema(content: string): DbTable[] {
  const tables: DbTable[] = [];
  const modelRegex = /model\s+(\w+)\s*\{([\s\S]*?)\}/g;
  
  let match;
  while ((match = modelRegex.exec(content)) !== null) {
    const tableName = match[1];
    const body = match[2];
    const columns: DbColumn[] = [];
    
    // Split body into lines
    const lines = body.split('\n');
    
    // Temporary maps to resolve relations
    const relationLines: { field: string; type: string; details: string }[] = [];
    const fieldsMap = new Map<string, { name: string; type: string; isPk: boolean; isFk: boolean }>();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//')) continue;
      
      // Parse field name, type, attributes
      // e.g. id Int @id @default(autoincrement())
      // e.g. author User @relation(fields: [authorId], references: [id])
      const parts = trimmed.split(/\s+/);
      if (parts.length < 2) continue;
      
      const fieldName = parts[0];
      const fieldType = parts[1];
      const rest = parts.slice(2).join(' ');
      
      const isPk = trimmed.includes('@id');
      
      if (trimmed.includes('@relation')) {
        relationLines.push({ field: fieldName, type: fieldType, details: rest });
        continue;
      }
      
      fieldsMap.set(fieldName, {
        name: fieldName,
        type: fieldType,
        isPk,
        isFk: false
      });
    }

    // Process relations to mark foreign keys
    for (const rel of relationLines) {
      // Find relation details: fields: [authorId], references: [id]
      const fieldsMatch = rel.details.match(/fields:\s*\[([^\]]+)\]/);
      const referencesMatch = rel.details.match(/references:\s*\[([^\]]+)\]/);
      
      if (fieldsMatch && referencesMatch) {
        const localFields = fieldsMatch[1].split(',').map(s => s.trim());
        const parentFields = referencesMatch[1].split(',').map(s => s.trim());
        
        localFields.forEach((localField, idx) => {
          const fieldObj = fieldsMap.get(localField);
          if (fieldObj) {
            fieldObj.isFk = true;
            (fieldObj as any).fkRelation = {
              parentTable: rel.type,
              parentColumn: parentFields[idx] || 'id'
            };
          }
        });
      }
    }

    // Build the final columns list
    for (const f of fieldsMap.values()) {
      columns.push({
        name: f.name,
        type: f.type,
        isPk: f.isPk,
        isFk: f.isFk,
        fkRelation: (f as any).fkRelation
      });
    }

    tables.push({ name: tableName, columns });
  }

  return tables;
}

/** Parses standard SQL schema files (CREATE TABLE statements). */
export function parseSqlSchema(content: string): DbTable[] {
  const tables: DbTable[] = [];
  // Matches: CREATE TABLE name ( body );
  const createTableRegex = /create\s+table\s+(\w+)\s*\(([\s\S]*?)\);/gi;
  
  let match;
  while ((match = createTableRegex.exec(content)) !== null) {
    const tableName = match[1];
    const body = match[2];
    const columns: DbColumn[] = [];
    
    const lines = body.split(',');
    const fkConstraints: { local: string; parentTable: string; parentColumn: string }[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim().replace(/\s+/g, ' ');
      if (!trimmed || trimmed.startsWith('--') || trimmed.startsWith('/*')) continue;
      
      const upperLine = trimmed.toUpperCase();
      
      // Look for inline foreign key constraints like: FOREIGN KEY (author_id) REFERENCES users(id)
      if (upperLine.startsWith('FOREIGN KEY')) {
        const localMatch = trimmed.match(/foreign\s+key\s*\(([^)]+)\)/i);
        const refMatch = trimmed.match(/references\s+(\w+)\s*\(([^)]+)\)/i);
        if (localMatch && refMatch) {
          fkConstraints.push({
            local: localMatch[1].trim(),
            parentTable: refMatch[1].trim(),
            parentColumn: refMatch[2].trim()
          });
        }
        continue;
      }
      
      // Look for primary key constraint: PRIMARY KEY (id)
      if (upperLine.startsWith('PRIMARY KEY')) {
        const pkMatch = trimmed.match(/primary\s+key\s*\(([^)]+)\)/i);
        if (pkMatch) {
          const pkFields = pkMatch[1].split(',').map(s => s.trim());
          columns.forEach(col => {
            if (pkFields.includes(col.name)) {
              col.isPk = true;
            }
          });
        }
        continue;
      }
      
      // Normal column definition: id INT PRIMARY KEY
      const parts = trimmed.split(' ');
      if (parts.length < 2) continue;
      
      const colName = parts[0].replace(/[`"']/g, '');
      const colType = parts[1];
      const isPk = upperLine.includes('PRIMARY KEY');
      
      // Check for inline reference: id INT REFERENCES users(id)
      let isFk = false;
      let fkRelation;
      const refMatch = trimmed.match(/references\s+(\w+)\s*\(([^)]+)\)/i);
      if (refMatch) {
        isFk = true;
        fkRelation = {
          parentTable: refMatch[1].trim(),
          parentColumn: refMatch[2].trim()
        };
      }
      
      columns.push({
        name: colName,
        type: colType,
        isPk,
        isFk,
        fkRelation
      });
    }
    
    // Apply parsed table-level foreign key constraints
    for (const fk of fkConstraints) {
      const col = columns.find(c => c.name === fk.local);
      if (col) {
        col.isFk = true;
        col.fkRelation = {
          parentTable: fk.parentTable,
          parentColumn: fk.parentColumn
        };
      }
    }
    
    tables.push({ name: tableName, columns });
  }
  
  return tables;
}
