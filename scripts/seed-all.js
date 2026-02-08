/**
 * Master Seed Script for The Artful Experience
 *
 * Seeds:
 * - Shop Categories (master product types)
 * - Artists (Deanna Lankin, Bryant Colman)
 * - Artist Artworks (from backup files)
 * - CoCreators (Kimber Cross, Lance Jones)
 * - Default artwork-to-product links
 *
 * Run: node scripts/seed-all.js
 *
 * NOTE: Gelato references (gelatoCatalogUid) in this script are deprecated.
 * Print fulfillment is now via Printful.
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const dbPath = path.join(__dirname, '../prisma/dev.db');

// =============================================================================
// SHOP CATEGORIES - Master product types
// =============================================================================
const SHOP_CATEGORIES = [
  {
    taeId: 'TAE-CARD',
    slug: 'cards',
    name: 'Greeting Cards',
    description: 'Beautiful folded greeting cards for any occasion.',
    icon: '💌',
    gelatoCatalogUid: 'folded-cards',
    taeBaseFee: 2.00,
    requiresQrCode: true,
    featured: true,
    sortOrder: 1,
  },
  {
    taeId: 'TAE-INV',
    slug: 'invitations',
    name: 'Invitations',
    description: 'Elegant invitations for weddings, parties, and special events.',
    icon: '🎉',
    gelatoCatalogUid: 'folded-cards',
    taeBaseFee: 2.50,
    requiresQrCode: true,
    featured: true,
    sortOrder: 2,
  },
  {
    taeId: 'TAE-ANN',
    slug: 'announcements',
    name: 'Announcements',
    description: 'Share your news beautifully - births, graduations, engagements.',
    icon: '📢',
    gelatoCatalogUid: 'folded-cards',
    taeBaseFee: 2.00,
    requiresQrCode: true,
    featured: false,
    sortOrder: 3,
  },
  {
    taeId: 'TAE-POST',
    slug: 'postcards',
    name: 'Postcards',
    description: 'Flat postcards perfect for quick notes or save-the-dates.',
    icon: '📮',
    gelatoCatalogUid: 'cards',
    taeBaseFee: 1.50,
    requiresQrCode: false,
    featured: false,
    sortOrder: 4,
  },
  {
    taeId: 'TAE-WALL',
    slug: 'wall-art',
    name: 'Wall Art',
    description: 'Premium prints for your walls in various sizes.',
    icon: '🖼️',
    gelatoCatalogUid: 'posters',
    taeBaseFee: 5.00,
    requiresQrCode: false,
    featured: true,
    sortOrder: 5,
  },
  {
    taeId: 'TAE-CANVAS',
    slug: 'canvas-prints',
    name: 'Canvas Prints',
    description: 'Museum-quality canvas prints stretched on wooden frames.',
    icon: '🎨',
    gelatoCatalogUid: 'canvas',
    taeBaseFee: 10.00,
    requiresQrCode: false,
    featured: true,
    sortOrder: 6,
  },
  {
    taeId: 'TAE-FRAME',
    slug: 'framed-prints',
    name: 'Framed Prints',
    description: 'Ready-to-hang framed prints in classic frame options.',
    icon: '🪟',
    gelatoCatalogUid: 'framed-posters',
    taeBaseFee: 15.00,
    requiresQrCode: false,
    featured: false,
    sortOrder: 7,
  },
];

// =============================================================================
// SEED FUNCTIONS
// =============================================================================

function seedShopCategories(db) {
  console.log('\n📦 Seeding Shop Categories...');

  for (const cat of SHOP_CATEGORIES) {
    const existing = db.exec(`SELECT id FROM ShopCategory WHERE taeId = '${cat.taeId}'`);
    if (existing.length > 0 && existing[0].values.length > 0) {
      console.log(`  ⏭️  ${cat.name} already exists`);
      continue;
    }

    const now = Date.now();
    db.run(`
      INSERT INTO ShopCategory (
        id, taeId, slug, name, description, icon, gelatoCatalogUid,
        taeBaseFee, requiresQrCode, heroImage, active, featured, sortOrder, createdAt, updatedAt
      ) VALUES (
        '${randomUUID()}', '${cat.taeId}', '${cat.slug}', '${cat.name}', '${cat.description}', '${cat.icon}', '${cat.gelatoCatalogUid}',
        ${cat.taeBaseFee}, ${cat.requiresQrCode ? 1 : 0}, NULL, 1, ${cat.featured ? 1 : 0}, ${cat.sortOrder}, ${now}, ${now}
      )
    `);
    console.log(`  ✅ Created: ${cat.name} (${cat.taeId})`);
  }
}

function seedArtists(db) {
  console.log('\n🎨 Seeding Artists...');

  // Read backup files
  const bryantBackupPath = path.join(__dirname, '../backup/bryant-colman-images.json');
  const deannaBackupPath = path.join(__dirname, '../backup/deanna-lankin-images.json');

  if (!fs.existsSync(bryantBackupPath) || !fs.existsSync(deannaBackupPath)) {
    console.log('  ❌ Backup files not found in backup/ directory');
    return;
  }

  const bryantBackup = JSON.parse(fs.readFileSync(bryantBackupPath));
  const deannaBackup = JSON.parse(fs.readFileSync(deannaBackupPath));

  const artists = [
    {
      slug: 'deanna-lankin',
      name: 'Deanna Lankin',
      title: 'ARTIST | ASTROLOGY | THETA GUIDE',
      bio: deannaBackup.bio,
      description: deannaBackup.description,
      thumbnailImage: deannaBackup.profileImages.thumbnail,
      bioImage: deannaBackup.profileImages.bioImage,
      royaltyFee: 5.00,
      featured: true,
      sortOrder: 1,
    },
    {
      slug: 'bryant-colman',
      name: 'Bryant Colman',
      title: 'PHOTOGRAPHER | EXPLORER | FOUNDER',
      bio: bryantBackup.bio,
      description: bryantBackup.description,
      thumbnailImage: bryantBackup.profileImages.thumbnail,
      bioImage: bryantBackup.profileImages.bioImage,
      royaltyFee: 5.00,
      featured: true,
      sortOrder: 2,
    },
  ];

  for (const artist of artists) {
    const existing = db.exec(`SELECT id FROM Artist WHERE slug = '${artist.slug}'`);
    if (existing.length > 0 && existing[0].values.length > 0) {
      console.log(`  ⏭️  ${artist.name} already exists`);
      continue;
    }

    const now = Date.now();
    const bio = artist.bio ? artist.bio.replace(/'/g, "''") : '';
    const desc = artist.description ? artist.description.replace(/'/g, "''") : '';
    db.run(`
      INSERT INTO Artist (
        id, slug, name, title, bio, description, thumbnailImage, bioImage,
        royaltyFee, featured, sortOrder, createdAt, updatedAt
      ) VALUES (
        '${randomUUID()}', '${artist.slug}', '${artist.name}', '${artist.title}', '${bio}', '${desc}', '${artist.thumbnailImage || ''}', '${artist.bioImage || ''}',
        ${artist.royaltyFee}, ${artist.featured ? 1 : 0}, ${artist.sortOrder}, ${now}, ${now}
      )
    `);
    console.log(`  ✅ Created: ${artist.name}`);
  }
}

function seedArtistArtworks(db) {
  console.log('\n🖼️  Seeding Artist Artworks...');

  // Get artists
  const deannaResult = db.exec(`SELECT id FROM Artist WHERE slug = 'deanna-lankin'`);
  const bryantResult = db.exec(`SELECT id FROM Artist WHERE slug = 'bryant-colman'`);

  const deanna = deannaResult.length > 0 && deannaResult[0].values.length > 0 ? { id: deannaResult[0].values[0][0] } : null;
  const bryant = bryantResult.length > 0 && bryantResult[0].values.length > 0 ? { id: bryantResult[0].values[0][0] } : null;

  if (!deanna || !bryant) {
    console.log('  ❌ Artists not found, run seedArtists first');
    return;
  }

  // Read backup files
  const bryantBackupPath = path.join(__dirname, '../backup/bryant-colman-images.json');
  const deannaBackupPath = path.join(__dirname, '../backup/deanna-lankin-images.json');

  if (!fs.existsSync(bryantBackupPath) || !fs.existsSync(deannaBackupPath)) {
    console.log('  ❌ Backup files not found');
    return;
  }

  const bryantBackup = JSON.parse(fs.readFileSync(bryantBackupPath));
  const deannaBackup = JSON.parse(fs.readFileSync(deannaBackupPath));

  // Seed Deanna's artwork
  for (let i = 0; i < deannaBackup.portfolio.length; i++) {
    const art = deannaBackup.portfolio[i];
    const taeId = `TAE-ART-DL-${String(i + 1).padStart(3, '0')}`;
    const slug = `deanna-lankin-${art.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}`;

    const existing = db.exec(`SELECT id FROM ArtistArtwork WHERE taeId = '${taeId}'`);
    if (existing.length > 0 && existing[0].values.length > 0) {
      console.log(`  ⏭️  ${art.title} (Deanna) already exists`);
      continue;
    }

    const now = Date.now();
    const title = art.title.replace(/'/g, "''");
    db.run(`
      INSERT INTO ArtistArtwork (
        id, artistId, taeId, slug, title, imageUrl, forSale, sortOrder, createdAt, updatedAt
      ) VALUES (
        '${randomUUID()}', '${deanna.id}', '${taeId}', '${slug}', '${title}', '${art.image}', ${art.forSale ? 1 : 0}, ${i + 1}, ${now}, ${now}
      )
    `);
    console.log(`  ✅ Created: ${art.title} (Deanna) - ${taeId}`);
  }

  // Seed Bryant's artwork
  for (let i = 0; i < bryantBackup.portfolio.length; i++) {
    const art = bryantBackup.portfolio[i];
    const taeId = `TAE-ART-BC-${String(i + 1).padStart(3, '0')}`;
    const slug = `bryant-colman-${String(i + 1).padStart(2, '0')}`;

    const existing = db.exec(`SELECT id FROM ArtistArtwork WHERE taeId = '${taeId}'`);
    if (existing.length > 0 && existing[0].values.length > 0) {
      console.log(`  ⏭️  ${art.title} (Bryant) already exists`);
      continue;
    }

    const now = Date.now();
    const title = art.title.replace(/'/g, "''");
    db.run(`
      INSERT INTO ArtistArtwork (
        id, artistId, taeId, slug, title, imageUrl, forSale, sortOrder, createdAt, updatedAt
      ) VALUES (
        '${randomUUID()}', '${bryant.id}', '${taeId}', '${slug}', '${title}', '${art.image}', ${art.forSale ? 1 : 0}, ${i + 1}, ${now}, ${now}
      )
    `);
    console.log(`  ✅ Created: ${art.title} (Bryant) - ${taeId}`);
  }
}

function seedCoCreators(db) {
  console.log('\n🤝 Seeding CoCreators...');

  // Read backup file
  const backupPath = path.join(__dirname, '../backup/cocreators-backup.json');
  if (!fs.existsSync(backupPath)) {
    console.log('  ❌ CoCreators backup file not found');
    return;
  }

  const backup = JSON.parse(fs.readFileSync(backupPath));

  for (let i = 0; i < backup.cocreators.length; i++) {
    const cc = backup.cocreators[i];

    const existing = db.exec(`SELECT id FROM CoCreator WHERE slug = '${cc.slug}'`);
    if (existing.length > 0 && existing[0].values.length > 0) {
      console.log(`  ⏭️  ${cc.name} already exists`);
      continue;
    }

    const now = Date.now();
    const bio = cc.bio ? cc.bio.replace(/'/g, "''") : '';
    const desc = cc.description ? cc.description.replace(/'/g, "''") : '';
    const title = cc.title ? cc.title.replace(/'/g, "''") : '';
    db.run(`
      INSERT INTO CoCreator (
        id, slug, name, title, bio, description, thumbnailImage, heroImage,
        royaltyFee, featured, sortOrder, createdAt, updatedAt
      ) VALUES (
        '${randomUUID()}', '${cc.slug}', '${cc.name}', '${title}', '${bio}', '${desc}', '${cc.image || ''}', '${cc.mountainImage || ''}',
        5.00, ${i === 0 ? 1 : 0}, ${i + 1}, ${now}, ${now}
      )
    `);
    console.log(`  ✅ Created: ${cc.name}`);
  }
}

function seedArtworkProductLinks(db) {
  console.log('\n🔗 Seeding Artwork-Product Links...');

  // Get all artworks
  const artworksResult = db.exec('SELECT id FROM ArtistArtwork');
  const artworks = artworksResult.length > 0 ? artworksResult[0].values.map(v => ({ id: v[0] })) : [];

  // Get categories that artwork can be purchased as (Wall Art, Canvas, Framed)
  const categoriesResult = db.exec(`SELECT id FROM ShopCategory WHERE slug IN ('wall-art', 'canvas-prints', 'framed-prints')`);
  const printCategories = categoriesResult.length > 0 ? categoriesResult[0].values.map(v => ({ id: v[0] })) : [];

  if (printCategories.length === 0) {
    console.log('  ❌ Print categories not found, run seedShopCategories first');
    return;
  }

  let created = 0;
  let skipped = 0;

  for (const artwork of artworks) {
    for (const category of printCategories) {
      const existing = db.exec(`SELECT id FROM ArtworkProductLink WHERE artworkId = '${artwork.id}' AND categoryId = '${category.id}'`);

      if (existing.length > 0 && existing[0].values.length > 0) {
        skipped++;
        continue;
      }

      db.run(`
        INSERT INTO ArtworkProductLink (id, artworkId, categoryId, createdAt)
        VALUES ('${randomUUID()}', '${artwork.id}', '${category.id}', ${Date.now()})
      `);
      created++;
    }
  }

  console.log(`  ✅ Created ${created} links, skipped ${skipped} existing`);
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('🌱 Starting seed process...\n');
  console.log('='.repeat(50));

  // Initialize sql.js
  const SQL = await initSqlJs();

  // Load existing database or create new one
  let db;
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
    // Ensure directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  try {
    seedShopCategories(db);
    seedArtists(db);
    seedArtistArtworks(db);
    seedCoCreators(db);
    seedArtworkProductLinks(db);

    console.log('\n' + '='.repeat(50));
    console.log('🎉 Seed complete!\n');

    // Print summary
    const categories = db.exec('SELECT COUNT(*) as count FROM ShopCategory')[0]?.values[0][0] || 0;
    const artists = db.exec('SELECT COUNT(*) as count FROM Artist')[0]?.values[0][0] || 0;
    const artworks = db.exec('SELECT COUNT(*) as count FROM ArtistArtwork')[0]?.values[0][0] || 0;
    const cocreators = db.exec('SELECT COUNT(*) as count FROM CoCreator')[0]?.values[0][0] || 0;
    const links = db.exec('SELECT COUNT(*) as count FROM ArtworkProductLink')[0]?.values[0][0] || 0;

    console.log('Summary:');
    console.log(`  - Shop Categories: ${categories}`);
    console.log(`  - Artists: ${artists}`);
    console.log(`  - Artist Artworks: ${artworks}`);
    console.log(`  - CoCreators: ${cocreators}`);
    console.log(`  - Artwork-Product Links: ${links}`);

    // Save the database
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
    console.log('\n💾 Database saved to', dbPath);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

main().catch(console.error);
