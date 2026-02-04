/**
 * TAE Complete Product Seeder
 * ===========================
 * Pulls ALL variants from Printful API for all 8 products.
 * Seeds every variant into the database with real prices.
 * YOU decide what to activate from the admin panel.
 *
 * Run: node scripts/seed-products.js
 */

const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');

const DB_PATH = path.join(__dirname, '..', 'prisma', 'dev.db');

// ---------------------------------------------------------------------------
// Load Printful token from .env.local or .env
// ---------------------------------------------------------------------------
function loadPrintfulToken() {
  const envFiles = [
    path.join(__dirname, '..', '.env.local'),
    path.join(__dirname, '..', '.env'),
  ];
  for (const f of envFiles) {
    if (fs.existsSync(f)) {
      const lines = fs.readFileSync(f, 'utf-8').split('\n');
      for (const line of lines) {
        const match = line.match(/^\s*PRINTFUL_TOKEN\s*=\s*(.+)\s*$/);
        if (match) return match[1].trim().replace(/^["']|["']$/g, '');
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Fetch product info + variants from Printful API
// ---------------------------------------------------------------------------
async function fetchPrintfulProduct(productId, token) {
  const url = `https://api.printful.com/products/${productId}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    console.error(`  ⚠️  Printful API error for product ${productId}: ${res.status}`);
    return { product: null, variants: [] };
  }
  const data = await res.json();
  return {
    product: data.result?.product || null,
    variants: data.result?.variants || [],
  };
}

// ---------------------------------------------------------------------------
// Slugify helper
// ---------------------------------------------------------------------------
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[″"]/g, '')
    .replace(/[×x]/g, 'x')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('=== TAE Product Seeder ===');
  console.log('Pulls ALL variants from Printful. You choose what to offer.\n');

  if (!fs.existsSync(DB_PATH)) {
    console.error('❌ Database file not found at:', DB_PATH);
    process.exit(1);
  }

  const token = loadPrintfulToken();
  if (!token) {
    console.error('❌ PRINTFUL_TOKEN not found in .env.local or .env');
    process.exit(1);
  }
  console.log('✅ Printful token loaded\n');

  const SQL = require('sql.js');
  const S = await SQL();
  const db = new S.Database(fs.readFileSync(DB_PATH));
  const now = Date.now().toString();

  // ========================================================================
  // STEP 1: Create / ensure all 7 categories
  // ========================================================================
  console.log('--- Step 1: Categories ---');
  const categories = [
    { slug: 'greeting-cards',  name: 'Greeting Cards',  icon: '💌', fee: 1.00, qr: 1, sort: 1 },
    { slug: 'invitations',     name: 'Invitations',     icon: '✉️',  fee: 1.00, qr: 1, sort: 2 },
    { slug: 'announcements',   name: 'Announcements',   icon: '📜', fee: 0.75, qr: 0, sort: 3 },
    { slug: 'postcards',       name: 'Postcards',       icon: '🃏', fee: 0.40, qr: 0, sort: 4 },
    { slug: 'wall-art',        name: 'Wall Art',        icon: '🖼️',  fee: 3.00, qr: 0, sort: 5 },
    { slug: 'canvas-prints',   name: 'Canvas Prints',   icon: '🎨', fee: 8.00, qr: 0, sort: 6 },
    { slug: 'framed-prints',   name: 'Framed Prints',   icon: '📷', fee: 8.00, qr: 0, sort: 7 },
  ];

  const catIdMap = {}; // slug → id

  for (const c of categories) {
    const existing = db.exec(`SELECT id FROM ShopCategory WHERE slug='${c.slug}'`);
    if (existing.length > 0 && existing[0].values.length > 0) {
      catIdMap[c.slug] = existing[0].values[0][0];
      console.log(`  EXISTS: ${c.slug}`);
    } else {
      const id = randomUUID();
      const taeId = 'TAE-CAT-' + c.slug.toUpperCase();
      db.run(
        `INSERT INTO ShopCategory(id, taeId, slug, name, icon, taeBaseFee, requiresQrCode, active, featured, sortOrder, createdAt, updatedAt)
         VALUES(?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?)`,
        [id, taeId, c.slug, c.name, c.icon, c.fee, c.qr, c.sort, now, now]
      );
      catIdMap[c.slug] = id;
      console.log(`  CREATED: ${c.slug}`);
    }
  }
  console.log('');

  // ========================================================================
  // STEP 2: Define which Printful products go into which categories
  // ========================================================================
  // Each entry: { printfulProductId, category slug, placements }
  const productMappings = [
    { printfulProductId: 568, category: 'greeting-cards',  placements: 'front,back,inside1,inside2' },
    { printfulProductId: 433, category: 'postcards',       placements: 'front,back' },
    { printfulProductId: 433, category: 'invitations',     placements: 'front,back' },
    { printfulProductId: 433, category: 'announcements',   placements: 'front,back' },
    { printfulProductId: 1,   category: 'wall-art',        placements: 'front' },  // Enhanced Matte Poster
    { printfulProductId: 171, category: 'wall-art',        placements: 'front' },  // Premium Luster Poster
    { printfulProductId: 3,   category: 'canvas-prints',   placements: 'front' },  // Canvas
    { printfulProductId: 614, category: 'canvas-prints',   placements: 'front' },  // Framed Canvas
    { printfulProductId: 2,   category: 'framed-prints',   placements: 'front' },  // Enhanced Matte Framed Poster
    { printfulProductId: 172, category: 'framed-prints',   placements: 'front' },  // Premium Luster Framed Poster
  ];

  // ========================================================================
  // STEP 3: Fetch ALL variants from Printful and seed them
  // ========================================================================
  // Avoid duplicate API calls for same product ID
  const fetchedProducts = {};
  const uniqueProductIds = [...new Set(productMappings.map(m => m.printfulProductId))];

  console.log('--- Step 2: Fetching ALL variants from Printful ---');
  for (const pid of uniqueProductIds) {
    console.log(`  Fetching product ${pid}...`);
    fetchedProducts[pid] = await fetchPrintfulProduct(pid, token);
    const count = fetchedProducts[pid].variants.length;
    const name = fetchedProducts[pid].product?.title || 'Unknown';
    console.log(`    → "${name}" — ${count} variants`);
  }
  console.log('');

  // ========================================================================
  // STEP 4: Seed every variant into the database
  // ========================================================================
  console.log('--- Step 3: Seeding products ---');
  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const mapping of productMappings) {
    const { printfulProductId, category, placements } = mapping;
    const catId = catIdMap[category];
    const { product: pfProduct, variants } = fetchedProducts[printfulProductId];
    const pfName = pfProduct?.title || `Product ${printfulProductId}`;

    console.log(`\n  [${category}] ${pfName} (Printful #${printfulProductId}) — ${variants.length} variants`);

    for (const v of variants) {
      const variantName = v.name || `Variant ${v.id}`;
      const price = parseFloat(v.price) || 0;
      const size = v.size || variantName;

      // Build unique taeId and slug per category+variant combo
      const taeId = `TAE-${category.toUpperCase()}-PF${printfulProductId}-V${v.id}`;
      const slug = slugify(`${category}-${pfName}-${variantName}`);

      // Build display name
      const displayName = `${pfName} — ${variantName}`;

      // Check if already exists by taeId
      const existing = db.exec(`SELECT id FROM ShopProduct WHERE taeId='${taeId}'`);
      if (existing.length > 0 && existing[0].values.length > 0) {
        // Update with latest price from Printful
        db.run(
          `UPDATE ShopProduct SET
            printfulBasePrice=?, name=?, sizeLabel=?, updatedAt=?
           WHERE taeId=?`,
          [price, displayName, size, now, taeId]
        );
        updated++;
        continue;
      }

      // Insert new — active=0 by default, YOU activate what you want
      const id = randomUUID();
      try {
        db.run(
          `INSERT INTO ShopProduct(
            id, taeId, categoryId, slug, name, description,
            printProvider, printfulProductId, printfulVariantId, printfulBasePrice,
            taeAddOnFee, sizeLabel, active, sortOrder, printDpi,
            createdAt, updatedAt
          ) VALUES(?, ?, ?, ?, ?, ?, 'printful', ?, ?, ?, 0, ?, 0, 0, 300, ?, ?)`,
          [
            id, taeId, catId, slug, displayName,
            `${displayName} — printed by Printful`,
            printfulProductId, v.id, price,
            size, now, now,
          ]
        );
        created++;
      } catch (err) {
        console.log(`    ❌ ERROR: ${displayName}: ${err.message}`);
        errors++;
      }
    }
  }

  // ========================================================================
  // STEP 5: Save and report
  // ========================================================================
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));

  console.log('\n\n=== RESULTS ===');
  console.log(`New products created: ${created}`);
  console.log(`Existing updated:     ${updated}`);
  console.log(`Errors:               ${errors}`);

  // Final counts
  const catCount = db.exec('SELECT COUNT(*) FROM ShopCategory');
  const prodCount = db.exec('SELECT COUNT(*) FROM ShopProduct');
  const activeCount = db.exec("SELECT COUNT(*) FROM ShopProduct WHERE active=1");
  console.log(`\nTotal categories: ${catCount[0].values[0][0]}`);
  console.log(`Total products:   ${prodCount[0].values[0][0]}`);
  console.log(`Active products:  ${activeCount[0].values[0][0]}`);
  console.log('\n💡 New products are INACTIVE by default.');
  console.log('   Go to your admin panel to activate the ones you want to offer.');

  // Summary by category
  console.log('\n--- By Category ---');
  const byCat = db.exec(`
    SELECT c.name, COUNT(p.id) as total,
           SUM(CASE WHEN p.active=1 THEN 1 ELSE 0 END) as active
    FROM ShopCategory c
    LEFT JOIN ShopProduct p ON p.categoryId = c.id
    GROUP BY c.id
    ORDER BY c.sortOrder
  `);
  if (byCat.length > 0) {
    for (const row of byCat[0].values) {
      console.log(`  ${row[0]}: ${row[1]} total, ${row[2]} active`);
    }
  }

  db.close();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
