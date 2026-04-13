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
  // Default to dedicated Drizzle runtime DB relative to project root
  return path.join(process.cwd(), 'db', 'drizzle-runtime.db');
};

const dbPath = getDatabasePath();

// Singleton for sql.js database instance
let sqliteDb: SqlJsDatabase | null = null;
let drizzleDb: ReturnType<typeof drizzle> | null = null;

function ensureShopProductColumns(db: SqlJsDatabase) {
  const result = db.exec("PRAGMA table_info('ShopProduct')");
  const rows = result[0]?.values || [];
  const columns = new Set(rows.map((row) => String(row[1])));

  if (!columns.has('artworkSourceUrl')) {
    db.run("ALTER TABLE ShopProduct ADD COLUMN artworkSourceUrl TEXT");
  }
  if (!columns.has('artistId')) {
    db.run("ALTER TABLE ShopProduct ADD COLUMN artistId TEXT");
  }
  if (!columns.has('coCreatorId')) {
    db.run("ALTER TABLE ShopProduct ADD COLUMN coCreatorId TEXT");
  }
}

function ensureGuestbookShareEmailColumn(db: SqlJsDatabase) {
  const result = db.exec("PRAGMA table_info('GuestbookEntry')");
  const rows = result[0]?.values || [];
  const columns = new Set(rows.map((row) => String(row[1])));
  if (!columns.has("shareEmailWithHost")) {
    db.run('ALTER TABLE "GuestbookEntry" ADD COLUMN shareEmailWithHost INTEGER DEFAULT 0');
  }
}

function ensureShopProductImagesTable(db: SqlJsDatabase) {
  db.run(`
    CREATE TABLE IF NOT EXISTS "ShopProductImage" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "productId" TEXT NOT NULL,
      "imageUrl" TEXT NOT NULL,
      "title" TEXT,
      "description" TEXT,
      "sortOrder" INTEGER DEFAULT 0,
      "isHero" INTEGER DEFAULT 0,
      "isActive" INTEGER DEFAULT 1,
      "sourceType" TEXT DEFAULT 'general',
      "variantKey" TEXT,
      "variantId" TEXT,
      "size" TEXT,
      "frame" TEXT,
      "frameColor" TEXT,
      "material" TEXT,
      "orientation" TEXT,
      "format" TEXT,
      "createdAt" TEXT,
      "updatedAt" TEXT,
      FOREIGN KEY ("productId") REFERENCES "ShopProduct"("id")
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS "ix_shop_product_image_product" ON "ShopProductImage" ("productId")`);
}

function ensureCheckoutProofSnapshotsTable(db: SqlJsDatabase) {
  db.run(`
    CREATE TABLE IF NOT EXISTS "CheckoutProofSnapshot" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "cartItemId" TEXT NOT NULL,
      "artKeyId" TEXT,
      "publicToken" TEXT,
      "customerEmail" TEXT,
      "displayProofFilesJson" TEXT NOT NULL,
      "productionFilesJson" TEXT NOT NULL,
      "metaJson" TEXT NOT NULL,
      "createdAt" TEXT NOT NULL,
      "approvedAt" TEXT
    )
  `);
}

function ensureOrderPaypalColumns(db: SqlJsDatabase) {
  const result = db.exec("PRAGMA table_info('Order')");
  const rows = result[0]?.values || [];
  const columns = new Set(rows.map((row) => String(row[1])));

  if (!columns.has('paypalOrderId')) {
    db.run('ALTER TABLE "Order" ADD COLUMN paypalOrderId TEXT');
  }
  if (!columns.has('paypalTransactionId')) {
    db.run('ALTER TABLE "Order" ADD COLUMN paypalTransactionId TEXT');
  }
  if (!columns.has('paypalStatus')) {
    db.run('ALTER TABLE "Order" ADD COLUMN paypalStatus TEXT');
  }
  if (!columns.has('paypalPayerEmail')) {
    db.run('ALTER TABLE "Order" ADD COLUMN paypalPayerEmail TEXT');
  }
}

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

  ensureShopProductColumns(sqliteDb);
  ensureGuestbookShareEmailColumn(sqliteDb);
  ensureShopProductImagesTable(sqliteDb);
  ensureCheckoutProofSnapshotsTable(sqliteDb);
  ensureOrderPaypalColumns(sqliteDb);

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

export async function executeSql(query: string, params?: (string | number | null)[]) {
  const sqlite = await initDatabase();
  sqlite.run(query, params || []);
}

export async function querySql<T = Record<string, unknown>>(
  query: string,
  params?: (string | number | null)[]
): Promise<T[]> {
  const sqlite = await initDatabase();
  const result = sqlite.exec(query, params || []);
  if (!result[0]) return [];
  const first = result[0];
  return first.values.map((row) => {
    const out: Record<string, unknown> = {};
    for (let i = 0; i < first.columns.length; i++) {
      out[first.columns[i]] = row[i];
    }
    return out as T;
  });
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
