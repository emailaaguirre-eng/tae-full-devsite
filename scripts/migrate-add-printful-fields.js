/**
 * Migration: Add Printful fields to existing database
 * Run: node scripts/migrate-add-printful-fields.js
 *
 * This adds the new Printful columns to ShopCategory, ShopProduct, and Order tables
 * without losing any existing data. Safe to run multiple times.
 */

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../prisma/dev.db');

async function main() {
  const SQL = await initSqlJs();

  if (!fs.existsSync(dbPath)) {
    console.error('Database file not found at:', dbPath);
    console.error('Run seed-all.js first to create the database.');
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(fileBuffer);

  console.log('=== Printful Migration ===\n');

  // Helper: check if column exists
  function columnExists(table, column) {
    const result = db.exec(`PRAGMA table_info(${table})`);
    if (result.length === 0) return false;
    return result[0].values.some(row => row[1] === column);
  }

  // Helper: add column if it doesn't exist
  function addColumn(table, column, type, defaultVal) {
    if (columnExists(table, column)) {
      console.log(`  SKIP: ${table}.${column} already exists`);
      return;
    }
    const defaultClause = defaultVal !== undefined ? ` DEFAULT ${defaultVal}` : '';
    db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}${defaultClause}`);
    console.log(`  ADDED: ${table}.${column} (${type}${defaultClause})`);
  }

  // =========================================================================
  // ShopCategory - Add Printful fields
  // =========================================================================
  console.log('ShopCategory:');
  addColumn('ShopCategory', 'printProvider', 'TEXT', "'printful'");
  addColumn('ShopCategory', 'printfulProductId', 'INTEGER', null);

  // =========================================================================
  // ShopProduct - Add Printful fields
  // =========================================================================
  console.log('\nShopProduct:');
  addColumn('ShopProduct', 'printProvider', 'TEXT', "'printful'");
  addColumn('ShopProduct', 'printfulProductId', 'INTEGER', null);
  addColumn('ShopProduct', 'printfulVariantId', 'INTEGER', null);
  addColumn('ShopProduct', 'printfulBasePrice', 'REAL', '0');
  addColumn('ShopProduct', 'printWidth', 'INTEGER', null);
  addColumn('ShopProduct', 'printHeight', 'INTEGER', null);
  addColumn('ShopProduct', 'printDpi', 'INTEGER', null);

  // =========================================================================
  // Order - Add Printful fields
  // =========================================================================
  console.log('\nOrder (table name "Order"):');
  addColumn('"Order"', 'printProvider', 'TEXT', "'printful'");
  addColumn('"Order"', 'printfulOrderId', 'TEXT', null);
  addColumn('"Order"', 'fulfillmentStatus', 'TEXT', null);

  // =========================================================================
  // Now update existing products with Printful IDs
  // =========================================================================
  console.log('\n=== Updating existing products with Printful IDs ===\n');

  // Map category slugs to Printful product IDs
  const categoryPrintfulMap = {
    'cards':          568,   // Greeting Card
    'invitations':    568,   // Uses Greeting Card (folded) / Postcard (flat)
    'announcements':  433,   // Standard Postcard
    'postcards':      433,   // Standard Postcard
    'wall-art':       1,     // Enhanced Matte Poster
    'canvas-prints':  3,     // Canvas
    'framed-prints':  2,     // Enhanced Matte Framed Poster
  };

  // Update categories
  for (const [slug, pfId] of Object.entries(categoryPrintfulMap)) {
    const result = db.exec(`SELECT id FROM ShopCategory WHERE slug = '${slug}'`);
    if (result.length > 0 && result[0].values.length > 0) {
      db.run(`UPDATE ShopCategory SET printfulProductId = ${pfId}, printProvider = 'printful' WHERE slug = '${slug}'`);
      console.log(`  Category "${slug}" → Printful product ${pfId}`);
    }
  }

  // Map individual products to Printful variant IDs (confirmed from API tests)
  // Greeting Card 568: 14457 (4"×6" $2.50), 14458 (5"×7" $3.25), 14460 (5.83"×8.27" $3.75)
  // Postcard 433: 11513 (4"×6" $1.50)
  const productPrintfulMap = {
    // Cards
    'TAE-CARD-5X7-F':   { pfProductId: 568, pfVariantId: 14458, pfPrice: 3.25 },
    'TAE-CARD-4X6-F':   { pfProductId: 568, pfVariantId: 14457, pfPrice: 2.50 },
    'TAE-CARD-A7-F':    { pfProductId: 568, pfVariantId: 14460, pfPrice: 3.75 },

    // Invitations (folded = Greeting Card 568, flat = Postcard 433)
    'TAE-INV-5X7-F':    { pfProductId: 568, pfVariantId: 14458, pfPrice: 3.25 },
    'TAE-INV-5X7-FL':   { pfProductId: 433, pfVariantId: 11513, pfPrice: 1.50 },
    'TAE-INV-4X9-FL':   { pfProductId: 433, pfVariantId: 11513, pfPrice: 1.50 },

    // Announcements (flat = Postcard 433)
    'TAE-ANN-5X7-FL':   { pfProductId: 433, pfVariantId: 11513, pfPrice: 1.50 },
    'TAE-ANN-4X6-FL':   { pfProductId: 433, pfVariantId: 11513, pfPrice: 1.50 },

    // Postcards
    'TAE-POST-6X4':     { pfProductId: 433, pfVariantId: 11513, pfPrice: 1.50 },
    'TAE-POST-6X9':     { pfProductId: 433, pfVariantId: 11513, pfPrice: 1.50 },

    // Wall Art (Enhanced Matte Poster = 1) — variant IDs need lookup via test-printful route
    'TAE-WALL-12X18':   { pfProductId: 1,   pfVariantId: null, pfPrice: 8.44 },
    'TAE-WALL-18X24':   { pfProductId: 1,   pfVariantId: null, pfPrice: 11.72 },
    'TAE-WALL-24X36':   { pfProductId: 1,   pfVariantId: null, pfPrice: 17.89 },

    // Canvas (Canvas = 3) — variant IDs need lookup
    'TAE-CANVAS-12X12': { pfProductId: 3,   pfVariantId: null, pfPrice: 22.10 },
    'TAE-CANVAS-16X20': { pfProductId: 3,   pfVariantId: null, pfPrice: 32.45 },
    'TAE-CANVAS-24X36': { pfProductId: 3,   pfVariantId: null, pfPrice: 62.30 },

    // Framed Prints (Enhanced Matte Framed Poster = 2) — variant IDs need lookup
    'TAE-FRAME-8X10-BK':  { pfProductId: 2, pfVariantId: null, pfPrice: 20.35 },
    'TAE-FRAME-11X14-BK': { pfProductId: 2, pfVariantId: null, pfPrice: 35.50 },
    'TAE-FRAME-16X20-BK': { pfProductId: 2, pfVariantId: null, pfPrice: 52.78 },
    'TAE-FRAME-8X10-WH':  { pfProductId: 2, pfVariantId: null, pfPrice: 20.35 },
    'TAE-FRAME-11X14-WH': { pfProductId: 2, pfVariantId: null, pfPrice: 35.50 },
  };

  let updated = 0;
  for (const [taeId, pf] of Object.entries(productPrintfulMap)) {
    const result = db.exec(`SELECT id FROM ShopProduct WHERE taeId = '${taeId}'`);
    if (result.length > 0 && result[0].values.length > 0) {
      const variantClause = pf.pfVariantId !== null ? pf.pfVariantId : 'NULL';
      db.run(`
        UPDATE ShopProduct
        SET printProvider = 'printful',
            printfulProductId = ${pf.pfProductId},
            printfulVariantId = ${variantClause},
            printfulBasePrice = ${pf.pfPrice},
            printDpi = 300
        WHERE taeId = '${taeId}'
      `);
      const variantNote = pf.pfVariantId ? `variant ${pf.pfVariantId}` : 'variant TBD';
      console.log(`  ${taeId} → Printful ${pf.pfProductId} (${variantNote}, $${pf.pfPrice})`);
      updated++;
    }
  }

  console.log(`\nUpdated ${updated} products with Printful IDs.`);

  // Show products that still need variant IDs
  const needsVariants = db.exec(`
    SELECT taeId, name, printfulProductId
    FROM ShopProduct
    WHERE printfulVariantId IS NULL AND printfulProductId IS NOT NULL
  `);

  if (needsVariants.length > 0 && needsVariants[0].values.length > 0) {
    console.log('\n⚠️  These products need Printful variant IDs:');
    console.log('   Use: http://localhost:3001/api/admin/test-printful?action=product&productId=X');
    for (const row of needsVariants[0].values) {
      console.log(`   ${row[0]} (${row[1]}) → product ${row[2]}, needs variantId`);
    }
  }

  // Save
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
  console.log('\n✅ Database saved. Migration complete.');

  db.close();
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
