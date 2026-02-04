/**
 * Migration: Add Printful fields to ShopProduct table
 * ====================================================
 * Run this ONCE on the live database to add Printful support
 * without losing existing Gelato data.
 *
 * Usage: node scripts/migrate-add-printful-fields.js
 *
 * @copyright B&D Servicing LLC 2026
 */

const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'prisma', 'dev.db');

async function main() {
  console.log('=== Migration: Add Printful Fields to ShopProduct ===\n');

  if (!fs.existsSync(DB_PATH)) {
    console.error('❌ Database not found at:', DB_PATH);
    process.exit(1);
  }

  const SQL = require('sql.js');
  const S = await SQL();
  const db = new S.Database(fs.readFileSync(DB_PATH));

  // Check which columns already exist
  const existing = db.exec('PRAGMA table_info(ShopProduct)');
  const existingCols = new Set();
  if (existing.length > 0) {
    existing[0].values.forEach(v => existingCols.add(v[1]));
  }

  console.log(`Current ShopProduct columns: ${existingCols.size}`);

  const newColumns = [
    { name: 'printProvider',       sql: "ALTER TABLE ShopProduct ADD COLUMN printProvider TEXT" },
    { name: 'printfulProductId',   sql: "ALTER TABLE ShopProduct ADD COLUMN printfulProductId INTEGER" },
    { name: 'printfulVariantId',   sql: "ALTER TABLE ShopProduct ADD COLUMN printfulVariantId INTEGER" },
    { name: 'printfulPrintfileId', sql: "ALTER TABLE ShopProduct ADD COLUMN printfulPrintfileId INTEGER" },
    { name: 'printfulBasePrice',   sql: "ALTER TABLE ShopProduct ADD COLUMN printfulBasePrice REAL DEFAULT 0" },
    { name: 'printWidth',          sql: "ALTER TABLE ShopProduct ADD COLUMN printWidth INTEGER" },
    { name: 'printHeight',         sql: "ALTER TABLE ShopProduct ADD COLUMN printHeight INTEGER" },
    { name: 'printDpi',            sql: "ALTER TABLE ShopProduct ADD COLUMN printDpi INTEGER DEFAULT 300" },
    { name: 'printFillMode',       sql: "ALTER TABLE ShopProduct ADD COLUMN printFillMode TEXT" },
    { name: 'requiredPlacements',  sql: "ALTER TABLE ShopProduct ADD COLUMN requiredPlacements TEXT" },
    { name: 'qrDefaultPosition',   sql: "ALTER TABLE ShopProduct ADD COLUMN qrDefaultPosition TEXT" },
    { name: 'printfulDataJson',    sql: "ALTER TABLE ShopProduct ADD COLUMN printfulDataJson TEXT" },
  ];

  let added = 0;
  let skipped = 0;

  for (const col of newColumns) {
    if (existingCols.has(col.name)) {
      console.log(`  SKIP: ${col.name} (already exists)`);
      skipped++;
    } else {
      try {
        db.run(col.sql);
        console.log(`  ADD:  ${col.name} ✅`);
        added++;
      } catch (err) {
        console.log(`  ERR:  ${col.name} — ${err.message}`);
      }
    }
  }

  // Save
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));

  console.log(`\n=== Done ===`);
  console.log(`Added: ${added} columns`);
  console.log(`Skipped: ${skipped} columns (already existed)`);

  // Verify
  const verify = db.exec('PRAGMA table_info(ShopProduct)');
  console.log(`\nShopProduct now has ${verify[0].values.length} columns`);

  db.close();
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
