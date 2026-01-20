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
 * Run: DATABASE_URL="file:C:/Users/email/tae-full-devsite/prisma/dev.db" node scripts/seed-all.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

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

async function seedShopCategories() {
  console.log('\n📦 Seeding Shop Categories...');

  for (const cat of SHOP_CATEGORIES) {
    const existing = await prisma.shopCategory.findUnique({ where: { taeId: cat.taeId } });
    if (existing) {
      console.log(`  ⏭️  ${cat.name} already exists`);
      continue;
    }

    await prisma.shopCategory.create({ data: cat });
    console.log(`  ✅ Created: ${cat.name} (${cat.taeId})`);
  }
}

async function seedArtists() {
  console.log('\n🎨 Seeding Artists...');

  // Read backup files
  const bryantBackup = JSON.parse(fs.readFileSync(path.join(__dirname, '../backup/bryant-colman-images.json')));
  const deannaBackup = JSON.parse(fs.readFileSync(path.join(__dirname, '../backup/deanna-lankin-images.json')));

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
    const existing = await prisma.artist.findUnique({ where: { slug: artist.slug } });
    if (existing) {
      console.log(`  ⏭️  ${artist.name} already exists`);
      continue;
    }

    await prisma.artist.create({ data: artist });
    console.log(`  ✅ Created: ${artist.name}`);
  }
}

async function seedArtistArtworks() {
  console.log('\n🖼️  Seeding Artist Artworks...');

  // Get artists
  const deanna = await prisma.artist.findUnique({ where: { slug: 'deanna-lankin' } });
  const bryant = await prisma.artist.findUnique({ where: { slug: 'bryant-colman' } });

  if (!deanna || !bryant) {
    console.log('  ❌ Artists not found, run seedArtists first');
    return;
  }

  // Read backup files
  const bryantBackup = JSON.parse(fs.readFileSync(path.join(__dirname, '../backup/bryant-colman-images.json')));
  const deannaBackup = JSON.parse(fs.readFileSync(path.join(__dirname, '../backup/deanna-lankin-images.json')));

  // Seed Deanna's artwork
  for (let i = 0; i < deannaBackup.portfolio.length; i++) {
    const art = deannaBackup.portfolio[i];
    const taeId = `TAE-ART-DL-${String(i + 1).padStart(3, '0')}`;
    const slug = `deanna-lankin-${art.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}`;

    const existing = await prisma.artistArtwork.findUnique({ where: { taeId } });
    if (existing) {
      console.log(`  ⏭️  ${art.title} (Deanna) already exists`);
      continue;
    }

    await prisma.artistArtwork.create({
      data: {
        artistId: deanna.id,
        taeId,
        slug,
        title: art.title,
        imageUrl: art.image,
        forSale: art.forSale,
        sortOrder: i + 1,
      },
    });
    console.log(`  ✅ Created: ${art.title} (Deanna) - ${taeId}`);
  }

  // Seed Bryant's artwork (26 images)
  for (let i = 0; i < bryantBackup.portfolio.length; i++) {
    const art = bryantBackup.portfolio[i];
    const taeId = `TAE-ART-BC-${String(i + 1).padStart(3, '0')}`;
    const slug = `bryant-colman-${String(i + 1).padStart(2, '0')}`;

    const existing = await prisma.artistArtwork.findUnique({ where: { taeId } });
    if (existing) {
      console.log(`  ⏭️  ${art.title} (Bryant) already exists`);
      continue;
    }

    await prisma.artistArtwork.create({
      data: {
        artistId: bryant.id,
        taeId,
        slug,
        title: art.title,
        imageUrl: art.image,
        forSale: art.forSale,
        sortOrder: i + 1,
      },
    });
    console.log(`  ✅ Created: ${art.title} (Bryant) - ${taeId}`);
  }
}

async function seedCoCreators() {
  console.log('\n🤝 Seeding CoCreators...');

  // Read backup file
  const backup = JSON.parse(fs.readFileSync(path.join(__dirname, '../backup/cocreators-backup.json')));

  for (let i = 0; i < backup.cocreators.length; i++) {
    const cc = backup.cocreators[i];

    const existing = await prisma.coCreator.findUnique({ where: { slug: cc.slug } });
    if (existing) {
      console.log(`  ⏭️  ${cc.name} already exists`);
      continue;
    }

    await prisma.coCreator.create({
      data: {
        slug: cc.slug,
        name: cc.name,
        title: cc.title || null,
        bio: cc.bio || null,
        description: cc.description || null,
        thumbnailImage: cc.image,
        heroImage: cc.mountainImage || null,
        royaltyFee: 5.00,
        featured: i === 0, // First one is featured
        sortOrder: i + 1,
      },
    });
    console.log(`  ✅ Created: ${cc.name}`);
  }
}

async function seedArtworkProductLinks() {
  console.log('\n🔗 Seeding Artwork-Product Links...');

  // Get all artworks
  const artworks = await prisma.artistArtwork.findMany();

  // Get categories that artwork can be purchased as (Wall Art, Canvas, Framed)
  const printCategories = await prisma.shopCategory.findMany({
    where: {
      slug: {
        in: ['wall-art', 'canvas-prints', 'framed-prints'],
      },
    },
  });

  if (printCategories.length === 0) {
    console.log('  ❌ Print categories not found, run seedShopCategories first');
    return;
  }

  let created = 0;
  let skipped = 0;

  for (const artwork of artworks) {
    for (const category of printCategories) {
      const existing = await prisma.artworkProductLink.findUnique({
        where: {
          artworkId_categoryId: {
            artworkId: artwork.id,
            categoryId: category.id,
          },
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      await prisma.artworkProductLink.create({
        data: {
          artworkId: artwork.id,
          categoryId: category.id,
        },
      });
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

  await seedShopCategories();
  await seedArtists();
  await seedArtistArtworks();
  await seedCoCreators();
  await seedArtworkProductLinks();

  console.log('\n' + '='.repeat(50));
  console.log('🎉 Seed complete!\n');

  // Print summary
  const categories = await prisma.shopCategory.count();
  const artists = await prisma.artist.count();
  const artworks = await prisma.artistArtwork.count();
  const cocreators = await prisma.coCreator.count();
  const links = await prisma.artworkProductLink.count();

  console.log('Summary:');
  console.log(`  - Shop Categories: ${categories}`);
  console.log(`  - Artists: ${artists}`);
  console.log(`  - Artist Artworks: ${artworks}`);
  console.log(`  - CoCreators: ${cocreators}`);
  console.log(`  - Artwork-Product Links: ${links}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    prisma.$disconnect();
    process.exit(1);
  });
