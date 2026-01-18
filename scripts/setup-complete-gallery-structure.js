/**
 * Set Up Complete Gallery Structure
 * 
 * Creates:
 * 1. Artist records (Lane B) for Bryant Colman and Deanna Lankin
 * 2. Asset records for all gallery images
 * 3. Updates StoreProduct categories to hierarchical structure:
 *    - gallery.artists.bryant-colman
 *    - gallery.artists.deanna-lankin
 *    - gallery.cocreators.kimber-cross
 *    - gallery.cocreators.lance-jones
 * 4. Sets up proper artist associations
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('=== Setting Up Complete Gallery Structure ===\n');

  // 1. Load gallery data
  const galleryPath = path.join(__dirname, '..', 'content', 'gallery.json');
  const galleryData = JSON.parse(fs.readFileSync(galleryPath, 'utf8'));
  
  const bryant = galleryData.artists.find(a => a.slug === 'bryant-colman');
  const deanna = galleryData.artists.find(a => a.slug === 'deanna-lankin');

  // 2. Create/Update Artist Records (Lane B)
  console.log('1. Creating Artist Records (Lane B)...\n');

  let bryantArtist = await prisma.artist.findUnique({
    where: { slug: 'bryant-colman' }
  });

  if (!bryantArtist && bryant) {
    bryantArtist = await prisma.artist.create({
      data: {
        slug: 'bryant-colman',
        name: 'Bryant Colman',
        title: bryant.title || 'PHOTOGRAPHER | EXPLORER | FOUNDER',
        bio: (bryant.bio || bryant.description || ''),
        image: bryant.image || null,
        bioImage: bryant.bioImage || null,
        active: true,
        sortOrder: 0,
      }
    });
    console.log('   ✅ Created Artist: Bryant Colman');
  } else {
    console.log('   ℹ️  Artist Bryant Colman already exists');
  }

  let deannaArtist = await prisma.artist.findUnique({
    where: { slug: 'deanna-lankin' }
  });

  if (!deannaArtist && deanna) {
    deannaArtist = await prisma.artist.create({
      data: {
        slug: 'deanna-lankin',
        name: 'Deanna Lankin',
        title: deanna.title || 'ARTIST | ASTROLOGY | THETA GUIDE',
        bio: (deanna.bio || deanna.description || ''),
        image: deanna.image || null,
        bioImage: deanna.bioImage || null,
        active: true,
        sortOrder: 1,
      }
    });
    console.log('   ✅ Created Artist: Deanna Lankin');
  } else {
    console.log('   ℹ️  Artist Deanna Lankin already exists');
  }

  // 3. Create Asset Records for Bryant Colman
  if (bryant && bryant.portfolio && bryantArtist) {
    console.log('\n2. Creating Asset Records for Bryant Colman...\n');
    
    const bryantAssets = bryant.portfolio;
    let createdCount = 0;
    let skippedCount = 0;

    for (const item of bryantAssets) {
      const slug = `bryant-colman-${item.title.toLowerCase().replace(/\s+/g, '-').replace(/untitled-/g, '')}`;
      
      // Check if asset already exists
      const existing = await prisma.asset.findUnique({
        where: { slug }
      });

      if (!existing) {
        await prisma.asset.create({
          data: {
            artistId: bryantArtist.id,
            title: item.title || 'Untitled',
            image: item.image,
            slug: slug,
            description: null,
            isForSaleAsPrint: true, // Can be purchased as wall art/postcards
            isAllowedInPremiumLibrary: false, // Gallery images, not premium library
            active: true,
            sortOrder: createdCount,
          }
        });
        createdCount++;
      } else {
        skippedCount++;
      }
    }
    console.log(`   ✅ Created ${createdCount} assets for Bryant Colman`);
    if (skippedCount > 0) {
      console.log(`   ℹ️  Skipped ${skippedCount} existing assets`);
    }
  }

  // 4. Create Asset Records for Deanna Lankin
  if (deanna && deanna.portfolio && deannaArtist) {
    console.log('\n3. Creating Asset Records for Deanna Lankin...\n');
    
    const deannaAssets = deanna.portfolio;
    let createdCount = 0;
    let skippedCount = 0;

    for (const item of deannaAssets) {
      const slug = `deanna-lankin-${(item.title || 'first-light').toLowerCase().replace(/\s+/g, '-')}`;
      
      const existing = await prisma.asset.findUnique({
        where: { slug }
      });

      if (!existing) {
        await prisma.asset.create({
          data: {
            artistId: deannaArtist.id,
            title: item.title || 'First Light',
            image: item.image,
            slug: slug,
            description: null,
            isForSaleAsPrint: true,
            isAllowedInPremiumLibrary: false,
            active: true,
            sortOrder: createdCount,
          }
        });
        createdCount++;
      } else {
        skippedCount++;
      }
    }
    console.log(`   ✅ Created ${createdCount} assets for Deanna Lankin`);
    if (skippedCount > 0) {
      console.log(`   ℹ️  Skipped ${skippedCount} existing assets`);
    }
  }

  // 5. Update StoreProduct Categories
  console.log('\n4. Updating StoreProduct Categories...\n');

  // Get Bryant's ArtPrints product
  const artPrints = await prisma.storeProduct.findUnique({
    where: { slug: 'artprints' }
  });

  if (artPrints && artPrints.artistName === 'Bryant Colman') {
    await prisma.storeProduct.update({
      where: { slug: 'artprints' },
      data: {
        category: 'gallery.artists.bryant-colman'
      }
    });
    console.log('   ✅ ArtPrints → category: gallery.artists.bryant-colman');
  }

  // 6. Show final structure
  console.log('\n=== Final Structure ===\n');

  const artists = await prisma.artist.findMany({
    include: {
      _count: { select: { assets: true } }
    },
    orderBy: { sortOrder: 'asc' }
  });

  console.log('Artists (Lane B):');
  artists.forEach(a => {
    console.log(`  - ${a.name} (${a.slug}): ${a._count.assets} asset(s)`);
  });

  const products = await prisma.storeProduct.findMany({
    where: {
      category: { startsWith: 'gallery' }
    },
    orderBy: { category: 'asc' }
  });

  console.log('\nStoreProducts by Category:');
  const byCategory = {};
  products.forEach(p => {
    const cat = p.category || 'none';
    if (!byCategory[cat]) {
      byCategory[cat] = [];
    }
    byCategory[cat].push(p);
  });

  Object.keys(byCategory).sort().forEach(cat => {
    console.log(`  ${cat}:`);
    byCategory[cat].forEach(p => {
      console.log(`    - ${p.name} (${p.slug})${p.artistName ? ' - ' + p.artistName : ''}`);
    });
  });

  console.log('\n✅ Gallery structure setup complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
