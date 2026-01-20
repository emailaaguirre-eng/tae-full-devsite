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
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const db = new Database(path.join(__dirname, '../prisma/dev.db'));

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

function seedShopCategories() {
  console.log('\n📦 Seeding Shop Categories...');

  const checkStmt = db.prepare('SELECT id FROM ShopCategory WHERE taeId = ?');
  const insertStmt = db.prepare(`
    INSERT INTO ShopCategory (
      id, taeId, slug, name, description, icon, gelatoCatalogUid,
      taeBaseFee, requiresQrCode, heroImage, active, featured, sortOrder, createdAt, updatedAt
    ) VALUES (
      @id, @taeId, @slug, @name, @description, @icon, @gelatoCatalogUid,
      @taeBaseFee, @requiresQrCode, @heroImage, @active, @featured, @sortOrder, @createdAt, @updatedAt
    )
  `);

  for (const cat of SHOP_CATEGORIES) {
    const existing = checkStmt.get(cat.taeId);
    if (existing) {
      console.log(`  ⏭️  ${cat.name} already exists`);
      continue;
    }

    const now = Date.now();
    insertStmt.run({
      id: randomUUID(),
      taeId: cat.taeId,
      slug: cat.slug,
      name: cat.name,
      description: cat.description,
      icon: cat.icon,
      gelatoCatalogUid: cat.gelatoCatalogUid,
      taeBaseFee: cat.taeBaseFee,
      requiresQrCode: cat.requiresQrCode ? 1 : 0,
      heroImage: null,
      active: 1,
      featured: cat.featured ? 1 : 0,
      sortOrder: cat.sortOrder,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`  ✅ Created: ${cat.name} (${cat.taeId})`);
  }
}

function seedArtists() {
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

  const checkStmt = db.prepare('SELECT id FROM Artist WHERE slug = ?');
  const insertStmt = db.prepare(`
    INSERT INTO Artist (
      id, slug, name, title, bio, description, thumbnailImage, bioImage,
      royaltyFee, featured, sortOrder, createdAt, updatedAt
    ) VALUES (
      @id, @slug, @name, @title, @bio, @description, @thumbnailImage, @bioImage,
      @royaltyFee, @featured, @sortOrder, @createdAt, @updatedAt
    )
  `);

  for (const artist of artists) {
    const existing = checkStmt.get(artist.slug);
    if (existing) {
      console.log(`  ⏭️  ${artist.name} already exists`);
      continue;
    }

    const now = Date.now();
    insertStmt.run({
      id: randomUUID(),
      slug: artist.slug,
      name: artist.name,
      title: artist.title,
      bio: artist.bio,
      description: artist.description,
      thumbnailImage: artist.thumbnailImage,
      bioImage: artist.bioImage,
      royaltyFee: artist.royaltyFee,
      featured: artist.featured ? 1 : 0,
      sortOrder: artist.sortOrder,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`  ✅ Created: ${artist.name}`);
  }
}

function seedArtistArtworks() {
  console.log('\n🖼️  Seeding Artist Artworks...');

  // Get artists
  const deanna = db.prepare('SELECT id FROM Artist WHERE slug = ?').get('deanna-lankin');
  const bryant = db.prepare('SELECT id FROM Artist WHERE slug = ?').get('bryant-colman');

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

  const checkStmt = db.prepare('SELECT id FROM ArtistArtwork WHERE taeId = ?');
  const insertStmt = db.prepare(`
    INSERT INTO ArtistArtwork (
      id, artistId, taeId, slug, title, imageUrl, forSale, sortOrder, createdAt, updatedAt
    ) VALUES (
      @id, @artistId, @taeId, @slug, @title, @imageUrl, @forSale, @sortOrder, @createdAt, @updatedAt
    )
  `);

  // Seed Deanna's artwork
  for (let i = 0; i < deannaBackup.portfolio.length; i++) {
    const art = deannaBackup.portfolio[i];
    const taeId = `TAE-ART-DL-${String(i + 1).padStart(3, '0')}`;
    const slug = `deanna-lankin-${art.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}`;

    const existing = checkStmt.get(taeId);
    if (existing) {
      console.log(`  ⏭️  ${art.title} (Deanna) already exists`);
      continue;
    }

    const now = Date.now();
    insertStmt.run({
      id: randomUUID(),
      artistId: deanna.id,
      taeId,
      slug,
      title: art.title,
      imageUrl: art.image,
      forSale: art.forSale ? 1 : 0,
      sortOrder: i + 1,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`  ✅ Created: ${art.title} (Deanna) - ${taeId}`);
  }

  // Seed Bryant's artwork
  for (let i = 0; i < bryantBackup.portfolio.length; i++) {
    const art = bryantBackup.portfolio[i];
    const taeId = `TAE-ART-BC-${String(i + 1).padStart(3, '0')}`;
    const slug = `bryant-colman-${String(i + 1).padStart(2, '0')}`;

    const existing = checkStmt.get(taeId);
    if (existing) {
      console.log(`  ⏭️  ${art.title} (Bryant) already exists`);
      continue;
    }

    const now = Date.now();
    insertStmt.run({
      id: randomUUID(),
      artistId: bryant.id,
      taeId,
      slug,
      title: art.title,
      imageUrl: art.image,
      forSale: art.forSale ? 1 : 0,
      sortOrder: i + 1,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`  ✅ Created: ${art.title} (Bryant) - ${taeId}`);
  }
}

function seedCoCreators() {
  console.log('\n🤝 Seeding CoCreators...');

  // Read backup file
  const backupPath = path.join(__dirname, '../backup/cocreators-backup.json');
  if (!fs.existsSync(backupPath)) {
    console.log('  ❌ CoCreators backup file not found');
    return;
  }

  const backup = JSON.parse(fs.readFileSync(backupPath));

  const checkStmt = db.prepare('SELECT id FROM CoCreator WHERE slug = ?');
  const insertStmt = db.prepare(`
    INSERT INTO CoCreator (
      id, slug, name, title, bio, description, thumbnailImage, heroImage,
      royaltyFee, featured, sortOrder, createdAt, updatedAt
    ) VALUES (
      @id, @slug, @name, @title, @bio, @description, @thumbnailImage, @heroImage,
      @royaltyFee, @featured, @sortOrder, @createdAt, @updatedAt
    )
  `);

  for (let i = 0; i < backup.cocreators.length; i++) {
    const cc = backup.cocreators[i];

    const existing = checkStmt.get(cc.slug);
    if (existing) {
      console.log(`  ⏭️  ${cc.name} already exists`);
      continue;
    }

    const now = Date.now();
    insertStmt.run({
      id: randomUUID(),
      slug: cc.slug,
      name: cc.name,
      title: cc.title || null,
      bio: cc.bio || null,
      description: cc.description || null,
      thumbnailImage: cc.image,
      heroImage: cc.mountainImage || null,
      royaltyFee: 5.00,
      featured: i === 0 ? 1 : 0,
      sortOrder: i + 1,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`  ✅ Created: ${cc.name}`);
  }
}

function seedArtworkProductLinks() {
  console.log('\n🔗 Seeding Artwork-Product Links...');

  // Get all artworks
  const artworks = db.prepare('SELECT id FROM ArtistArtwork').all();

  // Get categories that artwork can be purchased as (Wall Art, Canvas, Framed)
  const printCategories = db.prepare(`
    SELECT id FROM ShopCategory WHERE slug IN ('wall-art', 'canvas-prints', 'framed-prints')
  `).all();

  if (printCategories.length === 0) {
    console.log('  ❌ Print categories not found, run seedShopCategories first');
    return;
  }

  const checkStmt = db.prepare('SELECT id FROM ArtworkProductLink WHERE artworkId = ? AND categoryId = ?');
  const insertStmt = db.prepare(`
    INSERT INTO ArtworkProductLink (id, artworkId, categoryId, createdAt)
    VALUES (@id, @artworkId, @categoryId, @createdAt)
  `);

  let created = 0;
  let skipped = 0;

  for (const artwork of artworks) {
    for (const category of printCategories) {
      const existing = checkStmt.get(artwork.id, category.id);

      if (existing) {
        skipped++;
        continue;
      }

      insertStmt.run({
        id: randomUUID(),
        artworkId: artwork.id,
        categoryId: category.id,
        createdAt: Date.now(),
      });
      created++;
    }
  }

  console.log(`  ✅ Created ${created} links, skipped ${skipped} existing`);
}

// =============================================================================
// MAIN
// =============================================================================

function main() {
  console.log('🌱 Starting seed process...\n');
  console.log('='.repeat(50));

  seedShopCategories();
  seedArtists();
  seedArtistArtworks();
  seedCoCreators();
  seedArtworkProductLinks();

  console.log('\n' + '='.repeat(50));
  console.log('🎉 Seed complete!\n');

  // Print summary
  const categories = db.prepare('SELECT COUNT(*) as count FROM ShopCategory').get().count;
  const artists = db.prepare('SELECT COUNT(*) as count FROM Artist').get().count;
  const artworks = db.prepare('SELECT COUNT(*) as count FROM ArtistArtwork').get().count;
  const cocreators = db.prepare('SELECT COUNT(*) as count FROM CoCreator').get().count;
  const links = db.prepare('SELECT COUNT(*) as count FROM ArtworkProductLink').get().count;

  console.log('Summary:');
  console.log(`  - Shop Categories: ${categories}`);
  console.log(`  - Artists: ${artists}`);
  console.log(`  - Artist Artworks: ${artworks}`);
  console.log(`  - CoCreators: ${cocreators}`);
  console.log(`  - Artwork-Product Links: ${links}`);
}

try {
  main();
} catch (error) {
  console.error('❌ Seed failed:', error);
  process.exit(1);
} finally {
  db.close();
}
