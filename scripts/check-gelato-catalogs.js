/**
 * Check Gelato Catalogs Available for Wall Art/Posters
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('=== Checking Gelato Catalogs ===\n');

  // Check all Gelato catalogs
  const catalogs = await prisma.gelatoCatalog.findMany({
    include: {
      _count: {
        select: { products: true }
      }
    },
    orderBy: { title: 'asc' }
  });

  if (catalogs.length === 0) {
    console.log('❌ No Gelato catalogs found in database');
    console.log('\n💡 You may need to sync catalogs from Gelato API first.');
    console.log('   Try: /api/gelato/sync or run the sync process');
  } else {
    console.log(`✅ Found ${catalogs.length} Gelato Catalog(s):\n`);
    catalogs.forEach(catalog => {
      console.log(`  - ${catalog.title} (${catalog.catalogUid})`);
      console.log(`    Products: ${catalog._count.products}`);
      console.log(`    Last Synced: ${catalog.lastSyncedAt}`);
      console.log('');
    });

    // Check for wall art/poster related catalogs
    const wallArtCatalogs = catalogs.filter(c => 
      c.catalogUid.toLowerCase().includes('wall') ||
      c.catalogUid.toLowerCase().includes('poster') ||
      c.catalogUid.toLowerCase().includes('print') ||
      c.title.toLowerCase().includes('wall') ||
      c.title.toLowerCase().includes('poster') ||
      c.title.toLowerCase().includes('print')
    );

    if (wallArtCatalogs.length > 0) {
      console.log('🎨 Potential Wall Art/Poster Catalogs:');
      wallArtCatalogs.forEach(c => {
        console.log(`  ✅ ${c.title} (${c.catalogUid})`);
      });
    } else {
      console.log('⚠️  No obvious wall art/poster catalogs found');
      console.log('   Check the catalog UIDs and titles above to find the right one');
    }
  }

  // Check current Wall Art product configuration
  console.log('\n=== Current Wall Art Product Configuration ===');
  const wallArt = await prisma.storeProduct.findUnique({
    where: { slug: 'wall-art' },
    include: {
      gelatoCatalog: {
        select: {
          catalogUid: true,
          title: true
        }
      }
    }
  });

  if (wallArt) {
    console.log(`\nProduct: ${wallArt.name} (${wallArt.slug})`);
    console.log(`  Artist: ${wallArt.artistName || 'none'}`);
    console.log(`  Gelato Catalog: ${wallArt.gelatoCatalog ? wallArt.gelatoCatalog.title + ' (' + wallArt.gelatoCatalog.catalogUid + ')' : 'Not linked'}`);
    console.log(`  Gallery Images: ${wallArt.galleryImages ? JSON.parse(wallArt.galleryImages).length : 0}`);
    
    if (wallArt.allowedFormats) {
      console.log(`  Allowed Formats: ${JSON.parse(wallArt.allowedFormats).join(', ')}`);
    }
    if (wallArt.allowedPapers) {
      console.log(`  Allowed Papers: ${JSON.parse(wallArt.allowedPapers).length} paper type(s)`);
    }
    if (wallArt.allowedCoatings) {
      console.log(`  Allowed Coatings: ${JSON.parse(wallArt.allowedCoatings).join(', ')}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
