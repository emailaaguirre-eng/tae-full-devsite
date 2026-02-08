/**
 * Seed ShopProducts
 * Run: node scripts/seed-products.js
 *
 * NOTE: Gelato references (gelatoProductUid, gelatoBasePrice) in this script are deprecated.
 * Print fulfillment is now via Printful.
 */

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');

const dbPath = path.join(__dirname, '../prisma/dev.db');

async function main() {
  // Initialize sql.js
  const SQL = await initSqlJs();

  // Load or create database
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

  // Build category lookup
  const catBySlug = {};
  categories.forEach(c => catBySlug[c.slug] = c.id);

  // Define products by category
  const products = [
    // GREETING CARDS (category slug is 'cards')
    { categorySlug: 'cards', taeId: 'TAE-CARD-5X7-F', slug: 'greeting-card-5x7-folded', name: '5x7 Folded Greeting Card', sizeLabel: '5x7', gelatoProductUid: 'cards_pf_5x7_pt_350-gsm-uncoated_cl_4-4_ot_folded-horizontal_ct_matte', gelatoBasePrice: 1.50, taeAddOnFee: 0.50 },
    { categorySlug: 'cards', taeId: 'TAE-CARD-4X6-F', slug: 'greeting-card-4x6-folded', name: '4x6 Folded Greeting Card', sizeLabel: '4x6', gelatoProductUid: 'cards_pf_4x6_pt_350-gsm-uncoated_cl_4-4_ot_folded-horizontal_ct_matte', gelatoBasePrice: 1.25, taeAddOnFee: 0.50 },
    { categorySlug: 'cards', taeId: 'TAE-CARD-A7-F', slug: 'greeting-card-a7-folded', name: 'A7 Folded Greeting Card', sizeLabel: 'A7 (5x7)', gelatoProductUid: 'cards_pf_a7_pt_350-gsm-uncoated_cl_4-4_ot_folded-horizontal_ct_matte', gelatoBasePrice: 1.50, taeAddOnFee: 0.50 },

    // INVITATIONS
    { categorySlug: 'invitations', taeId: 'TAE-INV-5X7-F', slug: 'invitation-5x7-folded', name: '5x7 Folded Invitation', sizeLabel: '5x7', gelatoProductUid: 'cards_pf_5x7_pt_350-gsm-uncoated_cl_4-4_ot_folded-horizontal_ct_matte', gelatoBasePrice: 1.75, taeAddOnFee: 1.00 },
    { categorySlug: 'invitations', taeId: 'TAE-INV-5X7-FL', slug: 'invitation-5x7-flat', name: '5x7 Flat Invitation', sizeLabel: '5x7', gelatoProductUid: 'cards_pf_5x7_pt_350-gsm-uncoated_cl_4-4_ot_flat_ct_matte', gelatoBasePrice: 1.50, taeAddOnFee: 1.00 },
    { categorySlug: 'invitations', taeId: 'TAE-INV-4X9-FL', slug: 'invitation-4x9-flat', name: '4x9 Flat Invitation (Slim)', sizeLabel: '4x9', gelatoProductUid: 'cards_pf_4x9_pt_350-gsm-uncoated_cl_4-4_ot_flat_ct_matte', gelatoBasePrice: 1.50, taeAddOnFee: 1.00 },

    // ANNOUNCEMENTS
    { categorySlug: 'announcements', taeId: 'TAE-ANN-5X7-FL', slug: 'announcement-5x7-flat', name: '5x7 Flat Announcement', sizeLabel: '5x7', gelatoProductUid: 'cards_pf_5x7_pt_350-gsm-uncoated_cl_4-4_ot_flat_ct_matte', gelatoBasePrice: 1.50, taeAddOnFee: 0.75 },
    { categorySlug: 'announcements', taeId: 'TAE-ANN-4X6-FL', slug: 'announcement-4x6-flat', name: '4x6 Flat Announcement', sizeLabel: '4x6', gelatoProductUid: 'cards_pf_4x6_pt_350-gsm-uncoated_cl_4-4_ot_flat_ct_matte', gelatoBasePrice: 1.25, taeAddOnFee: 0.75 },

    // POSTCARDS
    { categorySlug: 'postcards', taeId: 'TAE-POST-6X4', slug: 'postcard-6x4', name: '6x4 Postcard', sizeLabel: '6x4', gelatoProductUid: 'postcards_pf_6x4_pt_350-gsm-coated-silk_cl_4-4', gelatoBasePrice: 0.85, taeAddOnFee: 0.40 },
    { categorySlug: 'postcards', taeId: 'TAE-POST-6X9', slug: 'postcard-6x9', name: '6x9 Postcard (Large)', sizeLabel: '6x9', gelatoProductUid: 'postcards_pf_6x9_pt_350-gsm-coated-silk_cl_4-4', gelatoBasePrice: 1.10, taeAddOnFee: 0.50 },

    // WALL ART (Posters)
    { categorySlug: 'wall-art', taeId: 'TAE-WALL-12X18', slug: 'poster-12x18', name: '12x18 Art Print', sizeLabel: '12x18', gelatoProductUid: 'posters_pf_12x18_pt_170-gsm-coated-silk', gelatoBasePrice: 4.50, taeAddOnFee: 2.00 },
    { categorySlug: 'wall-art', taeId: 'TAE-WALL-18X24', slug: 'poster-18x24', name: '18x24 Art Print', sizeLabel: '18x24', gelatoProductUid: 'posters_pf_18x24_pt_170-gsm-coated-silk', gelatoBasePrice: 6.50, taeAddOnFee: 3.00 },
    { categorySlug: 'wall-art', taeId: 'TAE-WALL-24X36', slug: 'poster-24x36', name: '24x36 Art Print', sizeLabel: '24x36', gelatoProductUid: 'posters_pf_24x36_pt_170-gsm-coated-silk', gelatoBasePrice: 9.00, taeAddOnFee: 4.00 },

    // CANVAS PRINTS
    { categorySlug: 'canvas-prints', taeId: 'TAE-CANVAS-12X12', slug: 'canvas-12x12', name: '12x12 Canvas Print', sizeLabel: '12x12', gelatoProductUid: 'canvas_pf_12x12_pt_canvas-matte_wr_1.5in', gelatoBasePrice: 18.00, taeAddOnFee: 8.00 },
    { categorySlug: 'canvas-prints', taeId: 'TAE-CANVAS-16X20', slug: 'canvas-16x20', name: '16x20 Canvas Print', sizeLabel: '16x20', gelatoProductUid: 'canvas_pf_16x20_pt_canvas-matte_wr_1.5in', gelatoBasePrice: 25.00, taeAddOnFee: 10.00 },
    { categorySlug: 'canvas-prints', taeId: 'TAE-CANVAS-24X36', slug: 'canvas-24x36', name: '24x36 Canvas Print', sizeLabel: '24x36', gelatoProductUid: 'canvas_pf_24x36_pt_canvas-matte_wr_1.5in', gelatoBasePrice: 45.00, taeAddOnFee: 15.00 },

    // FRAMED PRINTS
    { categorySlug: 'framed-prints', taeId: 'TAE-FRAME-8X10-BK', slug: 'framed-8x10-black', name: '8x10 Framed Print (Black)', sizeLabel: '8x10', paperType: 'Matte', finishType: 'Black Frame', gelatoProductUid: 'framedposters_pf_8x10_pt_170-gsm-coated-silk_fr_black-wood', gelatoBasePrice: 22.00, taeAddOnFee: 8.00 },
    { categorySlug: 'framed-prints', taeId: 'TAE-FRAME-11X14-BK', slug: 'framed-11x14-black', name: '11x14 Framed Print (Black)', sizeLabel: '11x14', paperType: 'Matte', finishType: 'Black Frame', gelatoProductUid: 'framedposters_pf_11x14_pt_170-gsm-coated-silk_fr_black-wood', gelatoBasePrice: 32.00, taeAddOnFee: 12.00 },
    { categorySlug: 'framed-prints', taeId: 'TAE-FRAME-16X20-BK', slug: 'framed-16x20-black', name: '16x20 Framed Print (Black)', sizeLabel: '16x20', paperType: 'Matte', finishType: 'Black Frame', gelatoProductUid: 'framedposters_pf_16x20_pt_170-gsm-coated-silk_fr_black-wood', gelatoBasePrice: 45.00, taeAddOnFee: 15.00 },
    { categorySlug: 'framed-prints', taeId: 'TAE-FRAME-8X10-WH', slug: 'framed-8x10-white', name: '8x10 Framed Print (White)', sizeLabel: '8x10', paperType: 'Matte', finishType: 'White Frame', gelatoProductUid: 'framedposters_pf_8x10_pt_170-gsm-coated-silk_fr_white-wood', gelatoBasePrice: 22.00, taeAddOnFee: 8.00 },
    { categorySlug: 'framed-prints', taeId: 'TAE-FRAME-11X14-WH', slug: 'framed-11x14-white', name: '11x14 Framed Print (White)', sizeLabel: '11x14', paperType: 'Matte', finishType: 'White Frame', gelatoProductUid: 'framedposters_pf_11x14_pt_170-gsm-coated-silk_fr_white-wood', gelatoBasePrice: 32.00, taeAddOnFee: 12.00 },
  ];

  console.log(`\nSeeding ${products.length} products...`);

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
    const gelatoProductUid = p.gelatoProductUid || null;
    const gelatoBasePrice = p.gelatoBasePrice || 0;
    const taeAddOnFee = p.taeAddOnFee || 0;

    db.run(`
      INSERT INTO ShopProduct (
        id, taeId, categoryId, slug, name, sizeLabel, paperType, finishType,
        gelatoProductUid, gelatoBasePrice, taeAddOnFee, active, sortOrder, createdAt, updatedAt
      ) VALUES (
        '${id}', '${p.taeId}', '${categoryId}', '${p.slug}', '${p.name}',
        ${sizeLabel ? `'${sizeLabel}'` : 'NULL'},
        ${paperType ? `'${paperType}'` : 'NULL'},
        ${finishType ? `'${finishType}'` : 'NULL'},
        ${gelatoProductUid ? `'${gelatoProductUid}'` : 'NULL'},
        ${gelatoBasePrice}, ${taeAddOnFee}, 1, ${created}, ${now}, ${now}
      )
    `);
    console.log(`  Created: ${p.taeId} - ${p.name}`);
    created++;
  }

  console.log(`\nDone! Created: ${created}, Skipped: ${skipped}`);

  // Show final counts
  const finalResult = db.exec('SELECT COUNT(*) as count FROM ShopProduct');
  const finalCount = finalResult.length > 0 ? finalResult[0].values[0][0] : 0;
  console.log(`Total products in database: ${finalCount}`);

  // Save database to disk
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
  console.log('Database saved.');

  db.close();
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
