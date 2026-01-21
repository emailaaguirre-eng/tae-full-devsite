import { drizzle } from 'drizzle-orm/sql-js';
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

// Get database path from environment or use default
const getDatabasePath = () => {
  if (process.env.DATABASE_PATH) {
    return process.env.DATABASE_PATH;
  }
  // Default to prisma/dev.db relative to project root
  return path.join(process.cwd(), 'prisma', 'dev.db');
};

const dbPath = getDatabasePath();

// Singleton for sql.js database instance
let sqliteDb: SqlJsDatabase | null = null;
let drizzleDb: ReturnType<typeof drizzle> | null = null;

// Initialize the database
async function initDatabase(): Promise<SqlJsDatabase> {
  if (sqliteDb) {
    return sqliteDb;
  }

  // Locate the WASM file in node_modules
  const wasmPath = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');

  const SQL = await initSqlJs({
    locateFile: (file: string) => {
      if (file === 'sql-wasm.wasm' && fs.existsSync(wasmPath)) {
        return wasmPath;
      }
      return file;
    }
  });

  // Load existing database file if it exists
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    sqliteDb = new SQL.Database(fileBuffer);
  } else {
    // Create new database
    sqliteDb = new SQL.Database();
    // Ensure directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  return sqliteDb;
}

// Get the Drizzle database instance
export async function getDb() {
  if (drizzleDb) {
    return drizzleDb;
  }

  const sqlite = await initDatabase();
  drizzleDb = drizzle(sqlite, { schema });
  return drizzleDb;
}

// Save database to disk
export async function saveDatabase() {
  if (sqliteDb) {
    const data = sqliteDb.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// Synchronous db export for compatibility (will throw if not initialized)
// Use getDb() for async initialization
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_, prop) {
    if (!drizzleDb) {
      throw new Error('Database not initialized. Call getDb() first or use getDb() directly.');
    }
    return (drizzleDb as any)[prop];
  }
});

// Re-export schema for convenience
export * from './schema';
