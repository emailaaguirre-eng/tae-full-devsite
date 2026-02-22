#!/usr/bin/env node
/**
 * Migration: Add galleryImages column to ShopProduct
 *             Create ProductMockup table
 *
 * Run: node scripts/migrate-add-images.js
 */
const path = require("path");
const fs = require("fs");
const initSqlJs = require("sql.js");

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, "..", "prisma", "dev.db");

async function migrate() {
  const wasmPath = path.join(__dirname, "..", "node_modules", "sql.js", "dist", "sql-wasm.wasm");
  const SQL = await initSqlJs({
    locateFile: (file) => (file === "sql-wasm.wasm" && fs.existsSync(wasmPath) ? wasmPath : file),
  });

  if (!fs.existsSync(DB_PATH)) {
    console.error("Database file not found:", DB_PATH);
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(fileBuffer);

  console.log("Running migration: add-images");
  console.log("DB path:", DB_PATH);

  // 1. Add galleryImages column to ShopProduct (if not exists)
  try {
    const cols = db.exec("PRAGMA table_info(ShopProduct)");
    const colNames = cols[0]?.values.map((r) => r[1]) || [];
    if (!colNames.includes("galleryImages")) {
      db.run("ALTER TABLE ShopProduct ADD COLUMN galleryImages TEXT");
      console.log("  + Added galleryImages column to ShopProduct");
    } else {
      console.log("  = galleryImages column already exists");
    }
  } catch (err) {
    console.error("  ! Error adding galleryImages:", err.message);
  }

  // 2. Create ProductMockup table (if not exists)
  try {
    db.run(`
      CREATE TABLE IF NOT EXISTS ProductMockup (
        id TEXT PRIMARY KEY,
        shopProductId TEXT REFERENCES ShopProduct(id),
        designDraftId TEXT,
        placement TEXT,
        mockupUrl TEXT NOT NULL,
        printfulTaskKey TEXT,
        status TEXT DEFAULT 'pending',
        extraMockups TEXT,
        createdAt TEXT
      )
    `);
    console.log("  + Created ProductMockup table (or already exists)");
  } catch (err) {
    console.error("  ! Error creating ProductMockup:", err.message);
  }

  // 3. Create PrintAreaSpec table (if not exists)
  try {
    db.run(`
      CREATE TABLE IF NOT EXISTS PrintAreaSpec (
        id TEXT PRIMARY KEY,
        printfulProductId INTEGER UNIQUE NOT NULL,
        availablePlacements TEXT NOT NULL,
        printfilesJson TEXT NOT NULL,
        variantPrintfilesJson TEXT NOT NULL,
        optionGroups TEXT,
        options TEXT,
        fetchedAt TEXT
      )
    `);
    console.log("  + Created PrintAreaSpec table (or already exists)");
  } catch (err) {
    console.error("  ! Error creating PrintAreaSpec:", err.message);
  }

  // 4. Create SiteMedia table (if not exists)
  try {
    db.run(`
      CREATE TABLE IF NOT EXISTS SiteMedia (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        url TEXT NOT NULL,
        alt TEXT,
        updatedAt TEXT
      )
    `);
    console.log("  + Created SiteMedia table (or already exists)");
  } catch (err) {
    console.error("  ! Error creating SiteMedia:", err.message);
  }

  // 5. Create SurfaceMap table (if not exists)
  try {
    db.run(`
      CREATE TABLE IF NOT EXISTS SurfaceMap (
        id TEXT PRIMARY KEY,
        printfulProductId INTEGER UNIQUE NOT NULL,
        uxSurfacesJson TEXT NOT NULL,
        exportRulesJson TEXT NOT NULL,
        version INTEGER DEFAULT 1,
        updatedAt TEXT
      )
    `);
    console.log("  + Created SurfaceMap table (or already exists)");
  } catch (err) {
    console.error("  ! Error creating SurfaceMap:", err.message);
  }

  // 6. Create Artist table (if not exists)
  try {
    db.run(`
      CREATE TABLE IF NOT EXISTS Artist (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        title TEXT,
        bio TEXT,
        description TEXT,
        thumbnailImage TEXT,
        bioImage TEXT,
        royaltyFee REAL DEFAULT 0,
        active INTEGER DEFAULT 1,
        featured INTEGER DEFAULT 0,
        sortOrder INTEGER DEFAULT 0,
        createdAt TEXT,
        updatedAt TEXT
      )
    `);
    console.log("  + Created Artist table (or already exists)");
  } catch (err) {
    console.error("  ! Error creating Artist:", err.message);
  }

  // 7. Create ArtistArtwork table (if not exists)
  try {
    db.run(`
      CREATE TABLE IF NOT EXISTS ArtistArtwork (
        id TEXT PRIMARY KEY,
        artistId TEXT NOT NULL REFERENCES Artist(id),
        taeId TEXT UNIQUE NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        imageUrl TEXT NOT NULL,
        thumbnailUrl TEXT,
        forSale INTEGER DEFAULT 1,
        active INTEGER DEFAULT 1,
        featured INTEGER DEFAULT 0,
        sortOrder INTEGER DEFAULT 0,
        createdAt TEXT,
        updatedAt TEXT
      )
    `);
    console.log("  + Created ArtistArtwork table (or already exists)");
  } catch (err) {
    console.error("  ! Error creating ArtistArtwork:", err.message);
  }

  // 8. Create CoCreator table (if not exists)
  try {
    db.run(`
      CREATE TABLE IF NOT EXISTS CoCreator (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        title TEXT,
        bio TEXT,
        description TEXT,
        thumbnailImage TEXT,
        heroImage TEXT,
        royaltyFee REAL DEFAULT 0,
        active INTEGER DEFAULT 1,
        featured INTEGER DEFAULT 0,
        sortOrder INTEGER DEFAULT 0,
        createdAt TEXT,
        updatedAt TEXT
      )
    `);
    console.log("  + Created CoCreator table (or already exists)");
  } catch (err) {
    console.error("  ! Error creating CoCreator:", err.message);
  }

  // 9. Create CoCreatorProduct table (if not exists)
  try {
    db.run(`
      CREATE TABLE IF NOT EXISTS CoCreatorProduct (
        id TEXT PRIMARY KEY,
        cocreatorId TEXT NOT NULL REFERENCES CoCreator(id),
        taeId TEXT UNIQUE NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        imageUrl TEXT NOT NULL,
        thumbnailUrl TEXT,
        forSale INTEGER DEFAULT 1,
        active INTEGER DEFAULT 1,
        sortOrder INTEGER DEFAULT 0,
        createdAt TEXT,
        updatedAt TEXT
      )
    `);
    console.log("  + Created CoCreatorProduct table (or already exists)");
  } catch (err) {
    console.error("  ! Error creating CoCreatorProduct:", err.message);
  }

  // Save
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
  console.log("Migration complete. Database saved.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
