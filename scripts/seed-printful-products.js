/**
 * Seed ShopProducts (Printful Edition)
 * Run: node scripts/seed-products.js
 *
 * Printful Product IDs (confirmed via API):
 *   568 = Greeting Card       | 433 = Standard Postcard
 *     1 = Enhanced Matte Poster | 2 = Enhanced Matte Framed Poster
 *     3 = Canvas              | 171 = Premium Luster Poster
 *   172 = Premium Luster Framed Poster | 614 = Framed Canvas
 *
 * Confirmed Variant IDs:
 *   Greeting Card 568: 14457 (4"×6" $2.50), 14458 (5"×7" $3.25), 14460 (5.83"×8.27" $3.75)
 *   Postcard 433: 11513 (4"×6" $1.50)
 *   Poster/Canvas/Frame variants: use test-printful route to look up specific sizes
 */

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');

const dbPath = path.join(__dirname, '../prisma/dev.db');

async function main() {
  const SQL = await initSqlJs();

  let db;
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    console.error('Database file not found. Run seed-all.js first.');
    process.exit(1);
  }

  console.log('Fetching categories...');
  const categoriesResult = db.exec('SELECT * FROM ShopCategory');

  const categories = [];
  if (categoriesResult.length > 0) {
    const cols = categoriesResult[0].columns;
    const rows = categoriesResult[0].values;
    for (const row of rows) {
      const cat = {};
      cols.forEach((col, i) => cat[col] = row[i]);
      categories.push(cat);
    }
  }

  console.log('Found categories:');
  categories.forEach(c => console.log(`  ${c.slug}: ${c.name} (fee: $${c.taeBaseFee})`));

  const catBySlug = {};
  categories.forEach(c => catBySlug[c.slug] = c.id);

  // =========================================================================
  // Product definitions with Printful mapping
  // =========================================================================
  const products = [
    // GREETING CARDS — Printful Product 568
    { categorySlug: 'cards', taeId: 'TAE-CARD-4X6-F', slug: 'greeting-card-4x6-folded', name: '4×6 Folded Greeting Card',
      sizeLabel: '4×6', printfulProductId: 568, printfulVariantId: 14457, printfulBasePrice: 2.50, taeAddOnFee: 0.50 },
    { categorySlug: 'cards', taeId: 'TAE-CARD-5X7-F', slug: 'greeting-card-5x7-folded', name: '5×7 Folded Greeting Card',
      sizeLabel: '5×7', printfulProductId: 568, printfulVariantId: 14458, printfulBasePrice: 3.25, taeAddOnFee: 0.75 },
    { categorySlug: 'cards', taeId: 'TAE-CARD-A5-F', slug: 'greeting-card-a5-folded', name: 'A5 Folded Greeting Card',
      sizeLabel: 'A5 (5.83×8.27)', printfulProductId: 568, printfulVariantId: 14460, printfulBasePrice: 3.75, taeAddOnFee: 1.00 },

    // INVITATIONS — Folded uses Greeting Card 568, Flat uses Postcard 433
    { categorySlug: 'invitations', taeId: 'TAE-INV-5X7-F', slug: 'invitation-5x7-folded', name: '5×7 Folded Invitation',
      sizeLabel: '5×7', printfulProductId: 568, printfulVariantId: 14458, printfulBasePrice: 3.25, taeAddOnFee: 1.00 },
    { categorySlug: 'invitations', taeId: 'TAE-INV-4X6-FL', slug: 'invitation-4x6-flat', name: '4×6 Flat Invitation',
      sizeLabel: '4×6', printfulProductId: 433, printfulVariantId: 11513, printfulBasePrice: 1.50, taeAddOnFee: 1.00 },

    // ANNOUNCEMENTS — Postcard 433
    { categorySlug: 'announcements', taeId: 'TAE-ANN-4X6-FL', slug: 'announcement-4x6-flat', name: '4×6 Flat Announcement',
      sizeLabel: '4×6', printfulProductId: 433, printfulVariantId: 11513, printfulBasePrice: 1.50, taeAddOnFee: 0.75 },

    // POSTCARDS — Postcard 433
    { categorySlug: 'postcards', taeId: 'TAE-POST-4X6', slug: 'postcard-4x6', name: '4×6 Postcard',
      sizeLabel: '4×6', printfulProductId: 433, printfulVariantId: 11513, printfulBasePrice: 1.50, taeAddOnFee: 0.40 },

    // WALL ART — Enhanced Matte Poster (1)
    // Variant IDs: look up via test-printful?action=product&productId=1
    { categorySlug: 'wall-art', taeId: 'TAE-WALL-12X16', slug: 'poster-12x16', name: '12×16 Enhanced Matte Art Print',
      sizeLabel: '12×16', printfulProductId: 1, printfulVariantId: null, printfulBasePrice: 8.44, taeAddOnFee: 3.00 },
    { categorySlug: 'wall-art', taeId: 'TAE-WALL-18X24', slug: 'poster-18x24', name: '18×24 Enhanced Matte Art Print',
      sizeLabel: '18×24', printfulProductId: 1, printfulVariantId: null, printfulBasePrice: 11.72, taeAddOnFee: 4.00 },
    { categorySlug: 'wall-art', taeId: 'TAE-WALL-24X36', slug: 'poster-24x36', name: '24×36 Enhanced Matte Art Print',
      sizeLabel: '24×36', printfulProductId: 1, printfulVariantId: null, printfulBasePrice: 17.89, taeAddOnFee: 5.00 },

    // CANVAS PRINTS — Canvas (3)
    // Variant IDs: look up via test-printful?action=product&productId=3
    { categorySlug: 'canvas-prints', taeId: 'TAE-CANVAS-12X12', slug: 'canvas-12x12', name: '12×12 Canvas Print',
      sizeLabel: '12×12', printfulProductId: 3, printfulVariantId: null, printfulBasePrice: 22.10, taeAddOnFee: 8.00 },
    { categorySlug: 'canvas-prints', taeId: 'TAE-CANVAS-16X20', slug: 'canvas-16x20', name: '16×20 Canvas Print',
      sizeLabel: '16×20', printfulProductId: 3, printfulVariantId: null, printfulBasePrice: 32.45, taeAddOnFee: 10.00 },
    { categorySlug: 'canvas-prints', taeId: 'TAE-CANVAS-24X36', slug: 'canvas-24x36', name: '24×36 Canvas Print',
      sizeLabel: '24×36', printfulProductId: 3, printfulVariantId: null, printfulBasePrice: 62.30, taeAddOnFee: 15.00 },

    // FRAMED PRINTS — Enhanced Matte Framed Poster (2) — Black & White frames
    // Variant IDs: look up via test-printful?action=product&productId=2
    { categorySlug: 'framed-prints', taeId: 'TAE-FRAME-8X10-BK', slug: 'framed-8x10-black', name: '8×10 Framed Print (Black)',
      sizeLabel: '8×10', finishType: 'Black Frame', printfulProductId: 2, printfulVariantId: null, printfulBasePrice: 20.35, taeAddOnFee: 8.00 },
    { categorySlug: 'framed-prints', taeId: 'TAE-FRAME-11X14-BK', slug: 'framed-11x14-black', name: '11×14 Framed Print (Black)',
      sizeLabel: '11×14', finishType: 'Black Frame', printfulProductId: 2, printfulVariantId: null, printfulBasePrice: 35.50, taeAddOnFee: 12.00 },
    { categorySlug: 'framed-prints', taeId: 'TAE-FRAME-16X20-BK', slug: 'framed-16x20-black', name: '16×20 Framed Print (Black)',
      sizeLabel: '16×20', finishType: 'Black Frame', printfulProductId: 2, printfulVariantId: null, printfulBasePrice: 52.78, taeAddOnFee: 15.00 },
    { categorySlug: 'framed-prints', taeId: 'TAE-FRAME-8X10-WH', slug: 'framed-8x10-white', name: '8×10 Framed Print (White)',
      sizeLabel: '8×10', finishType: 'White Frame', printfulProductId: 2, printfulVariantId: null, printfulBasePrice: 20.35, taeAddOnFee: 8.00 },
    { categorySlug: 'framed-prints', taeId: 'TAE-FRAME-11X14-WH', slug: 'framed-11x14-white', name: '11×14 Framed Print (White)',
      sizeLabel: '11×14', finishType: 'White Frame', printfulProductId: 2, printfulVariantId: null, printfulBasePrice: 35.50, taeAddOnFee: 12.00 },
  ];

  console.log(`\nSeeding ${products.length} products...`);

  // Check if printfulProductId column exists (migration must run first)
  const tableInfo = db.exec('PRAGMA table_info(ShopProduct)');
  const columns = tableInfo[0].values.map(row => row[1]);
  const hasPrintfulCols = columns.includes('printfulProductId');

  if (!hasPrintfulCols) {
    console.error('\n❌ Printful columns not found! Run the migration first:');
    console.error('   node scripts/migrate-add-printful-fields.js');
    db.close();
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;

  for (const p of products) {
    const categoryId = catBySlug[p.categorySlug];
    if (!categoryId) {
      console.log(`  SKIP: Category not found: ${p.categorySlug}`);
      skipped++;
      continue;
    }

    // Check if already exists
    const existing = db.exec(`SELECT id FROM ShopProduct WHERE taeId = '${p.taeId}'`);
    if (existing.length > 0 && existing[0].values.length > 0) {
      console.log(`  SKIP: ${p.taeId} already exists`);
      skipped++;
      continue;
    }

    const now = Date.now();
    const id = randomUUID();
    const sizeLabel = p.sizeLabel || null;
    const paperType = p.paperType || null;
    const finishType = p.finishType || null;
    const pfVariant = p.printfulVariantId !== null ? p.printfulVariantId : null;

    db.run(`
      INSERT INTO ShopProduct (
        id, taeId, categoryId, slug, name, sizeLabel, paperType, finishType,
        printProvider, printfulProductId, printfulVariantId, printfulBasePrice,
        taeAddOnFee, printDpi, active, sortOrder, createdAt, updatedAt
      ) VALUES (
        '${id}', '${p.taeId}', '${categoryId}', '${p.slug}', '${p.name}',
        ${sizeLabel ? `'${sizeLabel}'` : 'NULL'},
        ${paperType ? `'${paperType}'` : 'NULL'},
        ${finishType ? `'${finishType}'` : 'NULL'},
        'printful',
        ${p.printfulProductId},
        ${pfVariant !== null ? pfVariant : 'NULL'},
        ${p.printfulBasePrice},
        ${p.taeAddOnFee}, 300, 1, ${created}, ${now}, ${now}
      )
    `);
    const variantNote = pfVariant ? `variant ${pfVariant}` : 'variant TBD';
    console.log(`  Created: ${p.taeId} — ${p.name} (Printful ${p.printfulProductId}, ${variantNote})`);
    created++;
  }

  console.log(`\nDone! Created: ${created}, Skipped: ${skipped}`);

  const finalResult = db.exec('SELECT COUNT(*) as count FROM ShopProduct');
  const finalCount = finalResult.length > 0 ? finalResult[0].values[0][0] : 0;
  console.log(`Total products in database: ${finalCount}`);

  // Show what still needs variant IDs
  const needsVariants = db.exec(`
    SELECT taeId, name, printfulProductId
    FROM ShopProduct
    WHERE printfulVariantId IS NULL AND printfulProductId IS NOT NULL
  `);
  if (needsVariants.length > 0 && needsVariants[0].values.length > 0) {
    console.log('\n⚠️  Products needing variant IDs (look up via test-printful route):');
    for (const row of needsVariants[0].values) {
      console.log(`   ${row[0]} → Printful product ${row[2]}`);
    }
  }

  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
  console.log('\nDatabase saved.');

  db.close();
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
