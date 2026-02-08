/**
 * Initialize the SQLite database with all tables from the Drizzle schema.
 * Run with: node scripts/init-db.mjs
 *
 * This creates prisma/dev.db with all tables matching db/schema.ts.
 * Uses sql.js directly (same driver the app uses).
 *
 * Updated for Printful migration — includes printProvider, printfulProductId,
 * printfulVariantId, printfulBasePrice, printWidth, printHeight, printDpi,
 * fulfillmentStatus columns.
 */

import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'prisma', 'dev.db');
const WASM_PATH = path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');

const CREATE_TABLES = `
-- Artists
CREATE TABLE IF NOT EXISTS "Artist" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "title" TEXT,
  "bio" TEXT,
  "description" TEXT,
  "thumbnailImage" TEXT,
  "bioImage" TEXT,
  "royaltyFee" REAL DEFAULT 0,
  "active" INTEGER DEFAULT 1,
  "featured" INTEGER DEFAULT 0,
  "sortOrder" INTEGER DEFAULT 0,
  "createdAt" TEXT,
  "updatedAt" TEXT
);

-- Artist Artworks
CREATE TABLE IF NOT EXISTS "ArtistArtwork" (
  "id" TEXT PRIMARY KEY,
  "artistId" TEXT NOT NULL REFERENCES "Artist"("id"),
  "taeId" TEXT UNIQUE NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "imageUrl" TEXT NOT NULL,
  "thumbnailUrl" TEXT,
  "forSale" INTEGER DEFAULT 1,
  "active" INTEGER DEFAULT 1,
  "featured" INTEGER DEFAULT 0,
  "sortOrder" INTEGER DEFAULT 0,
  "createdAt" TEXT,
  "updatedAt" TEXT
);

-- Shop Categories (with Printful fields)
CREATE TABLE IF NOT EXISTS "ShopCategory" (
  "id" TEXT PRIMARY KEY,
  "taeId" TEXT UNIQUE NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "icon" TEXT,
  "printProvider" TEXT DEFAULT 'printful',
  "gelatoCatalogUid" TEXT,
  "printfulProductId" INTEGER,
  "taeBaseFee" REAL DEFAULT 0,
  "requiresQrCode" INTEGER DEFAULT 0,
  "heroImage" TEXT,
  "active" INTEGER DEFAULT 1,
  "featured" INTEGER DEFAULT 0,
  "sortOrder" INTEGER DEFAULT 0,
  "createdAt" TEXT,
  "updatedAt" TEXT
);

-- Shop Products (with Printful fields)
CREATE TABLE IF NOT EXISTS "ShopProduct" (
  "id" TEXT PRIMARY KEY,
  "taeId" TEXT UNIQUE NOT NULL,
  "categoryId" TEXT NOT NULL REFERENCES "ShopCategory"("id"),
  "slug" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "printProvider" TEXT DEFAULT 'printful',
  "gelatoProductUid" TEXT,
  "gelatoBasePrice" REAL DEFAULT 0,
  "gelatoDataJson" TEXT,
  "printfulProductId" INTEGER,
  "printfulVariantId" INTEGER,
  "printfulBasePrice" REAL DEFAULT 0,
  "printWidth" INTEGER,
  "printHeight" INTEGER,
  "printDpi" INTEGER,
  "taeAddOnFee" REAL DEFAULT 0,
  "sizeLabel" TEXT,
  "paperType" TEXT,
  "finishType" TEXT,
  "orientation" TEXT,
  "heroImage" TEXT,
  "active" INTEGER DEFAULT 1,
  "sortOrder" INTEGER DEFAULT 0,
  "lastSyncedAt" TEXT,
  "createdAt" TEXT,
  "updatedAt" TEXT
);

-- Artwork-Product Links
CREATE TABLE IF NOT EXISTS "ArtworkProductLink" (
  "id" TEXT PRIMARY KEY,
  "artworkId" TEXT NOT NULL REFERENCES "ArtistArtwork"("id"),
  "categoryId" TEXT NOT NULL REFERENCES "ShopCategory"("id"),
  "createdAt" TEXT
);

-- Legacy Gelato tables — kept for backward compatibility, not used by new code
-- Gelato Product Cache (legacy)
CREATE TABLE IF NOT EXISTS "GelatoProductCache" (
  "id" TEXT PRIMARY KEY,
  "categorySlug" TEXT NOT NULL,
  "gelatoCatalog" TEXT,
  "gelatoProductUid" TEXT UNIQUE NOT NULL,
  "productName" TEXT,
  "size" TEXT,
  "sizeLabel" TEXT,
  "paperType" TEXT,
  "frameColor" TEXT,
  "orientation" TEXT,
  "gelatoPrice" REAL DEFAULT 0,
  "shippingEstimate" REAL DEFAULT 0,
  "available" INTEGER DEFAULT 1,
  "supportedCountries" TEXT,
  "widthMm" REAL,
  "heightMm" REAL,
  "widthInches" REAL,
  "heightInches" REAL,
  "rawDataJson" TEXT,
  "lastSyncedAt" TEXT,
  "createdAt" TEXT,
  "updatedAt" TEXT
);

-- Gelato Sync Log (legacy)
CREATE TABLE IF NOT EXISTS "GelatoSyncLog" (
  "id" TEXT PRIMARY KEY,
  "syncType" TEXT,
  "status" TEXT,
  "itemsProcessed" INTEGER DEFAULT 0,
  "itemsUpdated" INTEGER DEFAULT 0,
  "itemsFailed" INTEGER DEFAULT 0,
  "errorMessage" TEXT,
  "errorDetails" TEXT,
  "startedAt" TEXT,
  "completedAt" TEXT
);

-- Customers
CREATE TABLE IF NOT EXISTS "Customer" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT UNIQUE NOT NULL,
  "name" TEXT,
  "phone" TEXT,
  "gelatoCustomerId" TEXT UNIQUE,
  "notes" TEXT,
  "createdAt" TEXT,
  "updatedAt" TEXT
);

-- Orders (with Printful fields)
CREATE TABLE IF NOT EXISTS "Order" (
  "id" TEXT PRIMARY KEY,
  "orderNumber" TEXT UNIQUE NOT NULL,
  "status" TEXT DEFAULT 'pending',
  "customerId" TEXT REFERENCES "Customer"("id"),
  "customerEmail" TEXT,
  "customerName" TEXT,
  "subtotal" REAL DEFAULT 0,
  "shippingCost" REAL DEFAULT 0,
  "totalRoyalties" REAL DEFAULT 0,
  "total" REAL DEFAULT 0,
  "printProvider" TEXT DEFAULT 'printful',
  "printfulOrderId" TEXT,
  "gelatoOrderId" TEXT UNIQUE,
  "fulfillmentStatus" TEXT,
  "gelatoStatus" TEXT,
  "trackingNumber" TEXT,
  "trackingUrl" TEXT,
  "carrier" TEXT,
  "createdAt" TEXT,
  "updatedAt" TEXT
);

-- Order Items
CREATE TABLE IF NOT EXISTS "OrderItem" (
  "id" TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL REFERENCES "Order"("id"),
  "shopProductId" TEXT REFERENCES "ShopProduct"("id"),
  "artworkId" TEXT REFERENCES "ArtistArtwork"("id"),
  "itemType" TEXT NOT NULL,
  "itemName" TEXT NOT NULL,
  "itemTaeId" TEXT NOT NULL,
  "quantity" INTEGER DEFAULT 1,
  "basePrice" REAL DEFAULT 0,
  "taeAddOnFee" REAL DEFAULT 0,
  "artistRoyalty" REAL DEFAULT 0,
  "unitPrice" REAL DEFAULT 0,
  "artKeyId" TEXT,
  "qrCodeUrl" TEXT,
  "designDraftId" TEXT,
  "createdAt" TEXT
);

-- ArtKey Portal
CREATE TABLE IF NOT EXISTS "ArtKey" (
  "id" TEXT PRIMARY KEY,
  "publicToken" TEXT UNIQUE NOT NULL,
  "ownerToken" TEXT UNIQUE NOT NULL,
  "ownerEmail" TEXT,
  "title" TEXT NOT NULL,
  "theme" TEXT NOT NULL,
  "features" TEXT NOT NULL,
  "links" TEXT NOT NULL,
  "spotify" TEXT NOT NULL,
  "featuredVideo" TEXT,
  "customizations" TEXT NOT NULL,
  "uploadedImages" TEXT NOT NULL,
  "uploadedVideos" TEXT NOT NULL,
  "createdAt" TEXT,
  "updatedAt" TEXT
);

-- Guestbook Entries
CREATE TABLE IF NOT EXISTS "GuestbookEntry" (
  "id" TEXT PRIMARY KEY,
  "artkeyId" TEXT NOT NULL REFERENCES "ArtKey"("id"),
  "parentId" TEXT,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "message" TEXT NOT NULL,
  "role" TEXT DEFAULT 'guest',
  "approved" INTEGER DEFAULT 0,
  "createdAt" TEXT
);

-- Media Items
CREATE TABLE IF NOT EXISTS "MediaItem" (
  "id" TEXT PRIMARY KEY,
  "artkeyId" TEXT NOT NULL REFERENCES "ArtKey"("id"),
  "guestbookEntryId" TEXT,
  "type" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "caption" TEXT,
  "approved" INTEGER DEFAULT 0,
  "createdAt" TEXT
);

-- CoCreators
CREATE TABLE IF NOT EXISTS "CoCreator" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "title" TEXT,
  "bio" TEXT,
  "description" TEXT,
  "thumbnailImage" TEXT,
  "heroImage" TEXT,
  "royaltyFee" REAL DEFAULT 0,
  "active" INTEGER DEFAULT 1,
  "featured" INTEGER DEFAULT 0,
  "sortOrder" INTEGER DEFAULT 0,
  "createdAt" TEXT,
  "updatedAt" TEXT
);

-- CoCreator Products
CREATE TABLE IF NOT EXISTS "CoCreatorProduct" (
  "id" TEXT PRIMARY KEY,
  "cocreatorId" TEXT NOT NULL REFERENCES "CoCreator"("id"),
  "taeId" TEXT UNIQUE NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "imageUrl" TEXT NOT NULL,
  "thumbnailUrl" TEXT,
  "forSale" INTEGER DEFAULT 1,
  "active" INTEGER DEFAULT 1,
  "sortOrder" INTEGER DEFAULT 0,
  "createdAt" TEXT,
  "updatedAt" TEXT
);

-- Design Drafts
CREATE TABLE IF NOT EXISTS "DesignDraft" (
  "id" TEXT PRIMARY KEY,
  "productId" TEXT,
  "variantId" TEXT,
  "printSpecId" TEXT NOT NULL,
  "dpi" INTEGER DEFAULT 300,
  "cornerStyle" TEXT DEFAULT 'square',
  "cornerRadiusMm" REAL DEFAULT 0,
  "designJsonFront" TEXT,
  "designJsonBack" TEXT,
  "previewPngFront" TEXT,
  "previewPngBack" TEXT,
  "artKeyData" TEXT,
  "usedAssetIds" TEXT,
  "premiumFees" REAL DEFAULT 0,
  "status" TEXT DEFAULT 'draft',
  "sessionId" TEXT,
  "userId" TEXT,
  "createdAt" TEXT,
  "updatedAt" TEXT
);
`;

// Migration: add Printful columns to existing tables (safe to re-run)
function runMigrations(db) {
  console.log('Running Printful migration (safe to re-run)...');

  function addColumnIfMissing(table, column, type, defaultVal) {
    try {
      const result = db.exec(`PRAGMA table_info(${table})`);
      if (result.length === 0) return;
      const exists = result[0].values.some(row => row[1] === column);
      if (!exists) {
        const defClause = defaultVal !== undefined ? ` DEFAULT ${defaultVal}` : '';
        db.run(`ALTER TABLE ${table} ADD COLUMN "${column}" ${type}${defClause}`);
        console.log(`  Added ${table}.${column}`);
      }
    } catch (e) {
      // Column may already exist; ignore
    }
  }

  // ShopCategory
  addColumnIfMissing('"ShopCategory"', 'printProvider', 'TEXT', "'printful'");
  addColumnIfMissing('"ShopCategory"', 'printfulProductId', 'INTEGER');

  // ShopProduct
  addColumnIfMissing('"ShopProduct"', 'printProvider', 'TEXT', "'printful'");
  addColumnIfMissing('"ShopProduct"', 'printfulProductId', 'INTEGER');
  addColumnIfMissing('"ShopProduct"', 'printfulVariantId', 'INTEGER');
  addColumnIfMissing('"ShopProduct"', 'printfulBasePrice', 'REAL', '0');
  addColumnIfMissing('"ShopProduct"', 'printWidth', 'INTEGER');
  addColumnIfMissing('"ShopProduct"', 'printHeight', 'INTEGER');
  addColumnIfMissing('"ShopProduct"', 'printDpi', 'INTEGER');

  // Order
  addColumnIfMissing('"Order"', 'printProvider', 'TEXT', "'printful'");
  addColumnIfMissing('"Order"', 'printfulOrderId', 'TEXT');
  addColumnIfMissing('"Order"', 'fulfillmentStatus', 'TEXT');
}

async function main() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const SQL = await initSqlJs({
    locateFile: (file) => {
      if (file === 'sql-wasm.wasm' && fs.existsSync(WASM_PATH)) {
        return WASM_PATH;
      }
      return file;
    },
  });

  let db;
  if (fs.existsSync(DB_PATH)) {
    console.log('Loading existing database...');
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    console.log('Creating new database...');
    db = new SQL.Database();
  }

  console.log('Creating tables...');
  db.run(CREATE_TABLES);

  // Run migrations for existing databases
  runMigrations(db);

  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  if (tables.length > 0) {
    console.log(`\nTables created (${tables[0].values.length}):`);
    for (const row of tables[0].values) {
      console.log(`  - ${row[0]}`);
    }
  }

  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
  console.log(`\nDatabase saved to ${DB_PATH} (${buffer.length} bytes)`);

  db.close();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
