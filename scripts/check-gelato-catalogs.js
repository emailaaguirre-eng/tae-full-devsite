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

  // Check current ArtPrints product configuration
  console.log('\n=== Current ArtPrints Product Configuration ===');
  const artPrints = await prisma.storeProduct.findUnique({
    where: { slug: 'artprints' },
    include: {
      gelatoCatalog: {
        select: {
          catalogUid: true,
          title: true
        }
      }
    }
  });

  if (artPrints) {
    console.log(`\nProduct: ${artPrints.name} (${artPrints.slug})`);
    console.log(`  Artist: ${artPrints.artistName || 'none'}`);
    console.log(`  Category: ${artPrints.category || 'none'}`);
    console.log(`  Gelato Catalog: ${artPrints.gelatoCatalog ? artPrints.gelatoCatalog.title + ' (' + artPrints.gelatoCatalog.catalogUid + ')' : 'Not linked'}`);
    console.log(`  Gallery Images: ${artPrints.galleryImages ? JSON.parse(artPrints.galleryImages).length : 0}`);
    
    if (artPrints.allowedFormats) {
      console.log(`  Allowed Formats: ${JSON.parse(artPrints.allowedFormats).join(', ')}`);
    }
    if (artPrints.allowedPapers) {
      console.log(`  Allowed Papers: ${JSON.parse(artPrints.allowedPapers).length} paper type(s)`);
    }
    if (artPrints.allowedCoatings) {
      console.log(`  Allowed Coatings: ${JSON.parse(artPrints.allowedCoatings).join(', ')}`);
    }
  } else {
    console.log('⚠️  ArtPrints product not found (slug: artprints)');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
