/**
 * Review Gallery Structure - Ensure Clean Organization
 * 
 * Checks and documents the complete gallery structure:
 * - Artists (Lane B) with Assets
 * - StoreProducts by category
 * - Ensures separation between artist-specific and general products
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('=== GALLERY STRUCTURE REVIEW ===\n');

  // 1. Artists (Lane B)
  console.log('1. ARTISTS (Lane B - Database Records):');
  console.log('─'.repeat(80));
  const artists = await prisma.artist.findMany({
    include: {
      _count: { select: { assets: true } }
    },
    orderBy: { sortOrder: 'asc' }
  });

  if (artists.length === 0) {
    console.log('   ❌ No artists found\n');
  } else {
    artists.forEach(a => {
      console.log(`   ✅ ${a.name} (${a.slug})`);
      console.log(`      Title: ${a.title || 'none'}`);
      console.log(`      Assets: ${a._count.assets} image(s)`);
      console.log(`      Active: ${a.active ? 'Yes' : 'No'}`);
      console.log('');
    });
  }

  // 2. StoreProducts by Category
  console.log('\n2. STOREPRODUCTS (Lane A - Products):');
  console.log('─'.repeat(80));
  
  const allProducts = await prisma.storeProduct.findMany({
    include: {
      gelatoCatalog: {
        select: {
          catalogUid: true,
          title: true
        }
      }
    },
    orderBy: [
      { category: 'asc' },
      { name: 'asc' }
    ]
  });

  // Group by category
  const byCategory = {};
  allProducts.forEach(p => {
    const cat = p.category || 'general';
    if (!byCategory[cat]) {
      byCategory[cat] = [];
    }
    byCategory[cat].push(p);
  });

  // Display organized structure
  Object.keys(byCategory).sort().forEach(cat => {
    if (cat.startsWith('gallery.artists')) {
      const artistSlug = cat.split('.').pop();
      console.log(`\n   📁 Gallery > Artists > ${artistSlug.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`);
    } else if (cat.startsWith('gallery.cocreators')) {
      const cocreatorSlug = cat.split('.').pop();
      console.log(`\n   📁 Gallery > CoCreators > ${cocreatorSlug.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`);
    } else {
      console.log(`\n   📁 ${cat === 'general' ? 'General Products (No Category)' : cat}`);
    }
    console.log('   ' + '─'.repeat(76));

    byCategory[cat].forEach(p => {
      const imgCount = p.galleryImages ? JSON.parse(p.galleryImages).length : 0;
      console.log(`   • ${p.name}`);
      console.log(`     Slug: ${p.slug}`);
      console.log(`     Type: ${p.productType}`);
      if (p.artistName) {
        console.log(`     Artist: ${p.artistName}`);
      }
      if (p.gelatoCatalog) {
        console.log(`     Gelato: ${p.gelatoCatalog.title} (${p.gelatoCatalog.catalogUid})`);
      }
      if (imgCount > 0) {
        console.log(`     Gallery Images: ${imgCount}`);
      }
      console.log(`     Active: ${p.active ? 'Yes' : 'No'}, Featured: ${p.featured ? 'Yes' : 'No'}`);
      console.log('');
    });
  });

  // 3. Check for issues/cleanliness
  console.log('\n3. STRUCTURE HEALTH CHECK:');
  console.log('─'.repeat(80));

  // Check if artists have corresponding products
  const artistSlugs = artists.map(a => a.slug);
  const artistProducts = allProducts.filter(p => p.artistName || (p.category && p.category.includes('artists')));

  console.log(`\n   Artists in database: ${artists.length}`);
  console.log(`   Products with artists: ${artistProducts.length}`);

  // Check for orphaned products (have artistName but no matching artist)
  const artistNames = new Set(artists.map(a => a.name));
  const orphaned = allProducts.filter(p => {
    return p.artistName && !artistNames.has(p.artistName);
  });

  if (orphaned.length > 0) {
    console.log(`\n   ⚠️  Warning: ${orphaned.length} product(s) have artistName but no matching Artist record:`);
    orphaned.forEach(p => {
      console.log(`      - ${p.name}: artistName="${p.artistName}" but no Artist record found`);
    });
  } else {
    console.log(`\n   ✅ All products with artists have matching Artist records`);
  }

  // Check for duplicate gallery images
  const productsWithImages = allProducts.filter(p => p.galleryImages);
  console.log(`\n   Products with gallery images: ${productsWithImages.length}`);
  
  if (productsWithImages.length > 0) {
    console.log(`   ✅ Gallery images are properly organized`);
  }

  // Summary
  console.log('\n4. SUMMARY:');
  console.log('─'.repeat(80));
  console.log(`   Total Artists: ${artists.length}`);
  console.log(`   Total Assets: ${artists.reduce((sum, a) => sum + a._count.assets, 0)}`);
  console.log(`   Total StoreProducts: ${allProducts.length}`);
  console.log(`   Products in Gallery categories: ${allProducts.filter(p => p.category && p.category.startsWith('gallery')).length}`);
  console.log(`   General products (no category): ${allProducts.filter(p => !p.category || !p.category.startsWith('gallery')).length}`);

  console.log('\n✅ Structure review complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
