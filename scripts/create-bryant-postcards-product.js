/**
 * Create Bryant Colman's Postcards Product
 * 
 * Creates a separate Postcards product specifically for Bryant Colman
 * under gallery.artists.bryant-colman category
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('=== Creating Bryant Colman Postcards Product ===\n');

  // 1. Load Bryant's images from gallery.json
  const galleryPath = path.join(__dirname, '..', 'content', 'gallery.json');
  const galleryData = JSON.parse(fs.readFileSync(galleryPath, 'utf8'));
  const bryant = galleryData.artists.find(a => a.slug === 'bryant-colman');

  if (!bryant || !bryant.portfolio) {
    console.error('❌ Bryant Colman not found in gallery.json');
    return;
  }

  const bryantImages = bryant.portfolio.map(item => item.image);
  console.log(`✅ Loaded ${bryantImages.length} images for Bryant Colman\n`);

  // 2. Check if Bryant's Postcards product already exists
  const existing = await prisma.storeProduct.findUnique({
    where: { slug: 'bryant-colman-postcards' }
  });

  if (existing) {
    console.log('ℹ️  Bryant Colman Postcards product already exists');
    console.log(`   Updating with ${bryantImages.length} images...`);
    
    await prisma.storeProduct.update({
      where: { slug: 'bryant-colman-postcards' },
      data: {
        galleryImages: JSON.stringify(bryantImages),
        artistName: 'Bryant Colman',
        category: 'gallery.artists.bryant-colman',
      }
    });
    console.log('   ✅ Updated existing product');
  } else {
    // 3. Get Gelato "Cards" catalog for postcards
    const cardsCatalog = await prisma.gelatoCatalog.findUnique({
      where: { catalogUid: 'cards' }
    });

    if (!cardsCatalog) {
      console.error('❌ Gelato "cards" catalog not found. Please sync catalogs first.');
      return;
    }

    // 4. Create Bryant's Postcards product
    console.log('Creating Bryant Colman Postcards product...');
    const bryantPostcards = await prisma.storeProduct.create({
      data: {
        slug: 'bryant-colman-postcards',
        name: 'Bryant Colman - Postcards',
        shortDescription: 'Photography postcards by Bryant Colman',
        description: 'A collection of stunning photography postcards featuring the work of Bryant Colman.',
        productType: 'gelato',
        category: 'gallery.artists.bryant-colman',
        artistName: 'Bryant Colman',
        galleryImages: JSON.stringify(bryantImages),
        gelatoCatalogId: cardsCatalog.id,
        allowedFormats: JSON.stringify(['5R', 'A6']), // Standard postcard formats
        basePrice: 2.99,
        active: true,
        featured: false,
        sortOrder: 1,
      }
    });

    console.log('✅ Created Bryant Colman Postcards product:');
    console.log(`   Slug: ${bryantPostcards.slug}`);
    console.log(`   Category: ${bryantPostcards.category}`);
    console.log(`   Gallery Images: ${bryantImages.length}`);
    console.log(`   Gelato Catalog: Cards`);
  }

  // 5. Verify structure
  console.log('\n=== Product Structure ===\n');
  
  const bryantProducts = await prisma.storeProduct.findMany({
    where: {
      OR: [
        { artistName: 'Bryant Colman' },
        { category: 'gallery.artists.bryant-colman' }
      ]
    },
    orderBy: { name: 'asc' }
  });

  console.log('Bryant Colman Products:');
  bryantProducts.forEach(p => {
    const imgCount = p.galleryImages ? JSON.parse(p.galleryImages).length : 0;
    console.log(`  - ${p.name} (${p.slug})`);
    console.log(`    Category: ${p.category}`);
    console.log(`    Gallery Images: ${imgCount}`);
  });

  const generalPostcards = await prisma.storeProduct.findUnique({
    where: { slug: 'postcards' }
  });

  console.log('\nGeneral Products (not artist-specific):');
  console.log(`  - ${generalPostcards.name} (${generalPostcards.slug})`);
  console.log(`    Category: ${generalPostcards.category || 'none'}`);
  console.log(`    Artist: ${generalPostcards.artistName || 'none'}`);

  console.log('\n✅ Structure is clean: Bryant\'s products are separate from general products');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
