/**
 * Check Products and Migrate Bryant Colman's Gallery Images
 * 
 * This script:
 * 1. Lists all StoreProducts in the database
 * 2. Lists all Artists and Assets
 * 3. Shows Bryant Colman's images from gallery.json
 * 4. Provides migration plan
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('=== Checking Products and Bryant Colman Images ===\n');

  // 1. Check StoreProducts
  console.log('1. STORE PRODUCTS:');
  const storeProducts = await prisma.storeProduct.findMany({
    orderBy: { name: 'asc' }
  });
  
  if (storeProducts.length === 0) {
    console.log('   ❌ No StoreProducts found in database');
  } else {
    console.log(`   ✅ Found ${storeProducts.length} StoreProduct(s):`);
    storeProducts.forEach(p => {
      console.log(`   - ${p.name} (slug: ${p.slug})`);
      console.log(`     Type: ${p.productType}, Category: ${p.category || 'none'}`);
      console.log(`     Artist: ${p.artistName || 'none'}`);
      console.log(`     Has Gallery Images: ${p.galleryImages ? 'Yes (' + JSON.parse(p.galleryImages).length + ')' : 'No'}`);
      console.log('');
    });
  }

  // 2. Check Artists
  console.log('\n2. ARTISTS:');
  const artists = await prisma.artist.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { assets: true }
      }
    }
  });

  if (artists.length === 0) {
    console.log('   ❌ No Artists found in database');
  } else {
    console.log(`   ✅ Found ${artists.length} Artist(s):`);
    artists.forEach(a => {
      console.log(`   - ${a.name} (slug: ${a.slug}) - ${a._count.assets} asset(s)`);
    });
  }

  // 3. Check Assets for Bryant Colman
  console.log('\n3. BRYANT COLMAN ASSETS:');
  const bryantAssets = await prisma.asset.findMany({
    where: {
      artist: { slug: 'bryant-colman' }
    },
    include: {
      artist: {
        select: { name: true, slug: true }
      }
    }
  });

  if (bryantAssets.length === 0) {
    console.log('   ❌ No Assets found for Bryant Colman in database');
  } else {
    console.log(`   ✅ Found ${bryantAssets.length} Asset(s) for Bryant Colman:`);
    bryantAssets.forEach(a => {
      console.log(`   - ${a.title} (slug: ${a.slug})`);
      console.log(`     Image: ${a.image.substring(0, 80)}...`);
    });
  }

  // 4. Load Bryant's images from gallery.json
  console.log('\n4. BRYANT COLMAN GALLERY.JSON IMAGES:');
  const galleryPath = path.join(__dirname, '..', 'content', 'gallery.json');
  
  try {
    const galleryData = JSON.parse(fs.readFileSync(galleryPath, 'utf8'));
    const bryant = galleryData.artists.find(a => a.slug === 'bryant-colman');
    
    if (bryant && bryant.portfolio) {
      console.log(`   ✅ Found ${bryant.portfolio.length} images in gallery.json:`);
      bryant.portfolio.forEach((item, idx) => {
        console.log(`   ${idx + 1}. ${item.title || 'Untitled'}`);
        console.log(`      ${item.image}`);
      });

      // 5. Migration Plan
      console.log('\n=== MIGRATION PLAN ===');
      console.log('\nTo link Bryant Colman\'s gallery images to products:');
      console.log('\nOPTION 1: Link to StoreProduct galleryImages field');
      console.log('  - Find or create a StoreProduct for Bryant Colman\'s artwork');
      console.log('  - Update the StoreProduct.galleryImages field with the image URLs');
      console.log('  - Set productType to "artwork" and artistName to "Bryant Colman"');
      
      console.log('\nOPTION 2: Create Asset records (Lane B - Recommended)');
      console.log('  - Create an Artist record for Bryant Colman if not exists');
      console.log('  - Create Asset records for each image in gallery.json');
      console.log('  - Set isForSaleAsPrint or isAllowedInPremiumLibrary as needed');
      
      console.log('\nThe gallery.json has these images ready to migrate:');
      console.log(`  - ${bryant.portfolio.length} images total`);
    } else {
      console.log('   ❌ Bryant Colman not found in gallery.json or has no portfolio');
    }
  } catch (error) {
    console.log(`   ❌ Error reading gallery.json: ${error.message}`);
  }

  // 6. Check for products matching Bryant
  console.log('\n5. BRYANT COLMAN PRODUCTS:');
  const bryantProducts = storeProducts.filter(p => 
    p.artistName && p.artistName.toLowerCase().includes('bryant') ||
    p.name && p.name.toLowerCase().includes('bryant')
  );

  if (bryantProducts.length === 0) {
    console.log('   ⚠️  No StoreProducts found for Bryant Colman');
    console.log('   💡 You may need to create placeholder products first');
  } else {
    console.log(`   ✅ Found ${bryantProducts.length} product(s) for Bryant:`);
    bryantProducts.forEach(p => {
      console.log(`   - ${p.name} (${p.slug})`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
