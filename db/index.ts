import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';

// Get database path from environment or use default
const getDatabasePath = () => {
  if (process.env.DATABASE_PATH) {
    return process.env.DATABASE_PATH;
  }
  // Default to prisma/dev.db relative to project root
  return path.join(process.cwd(), 'prisma', 'dev.db');
};

const dbPath = getDatabasePath();
const sqlite = new Database(dbPath);

export const db = drizzle(sqlite, { schema });

// Re-export schema for convenience
export * from './schema';
