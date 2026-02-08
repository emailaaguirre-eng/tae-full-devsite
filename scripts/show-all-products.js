/**
 * Show All Products in Product Management System
 *
 * NOTE: Gelato references in this script are legacy. Print fulfillment is now via Printful.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('=== PRODUCT MANAGEMENT SYSTEM - CURRENT PRODUCTS ===\n');

  // Get all StoreProducts with details
  const products = await prisma.storeProduct.findMany({
    include: {
      gelatoCatalog: {
        select: {
          catalogUid: true,
          title: true,
        },
      },
    },
    orderBy: [
      { category: 'asc' },
      { name: 'asc' },
    ],
  });

  if (products.length === 0) {
    console.log('❌ No products found in the database\n');
    return;
  }

  console.log(`✅ Found ${products.length} product(s) in the system:\n`);

  // Group by category
  const byCategory = {};
  products.forEach(p => {
    const category = p.category || 'uncategorized';
    if (!byCategory[category]) {
      byCategory[category] = [];
    }
    byCategory[category].push(p);
  });

  // Display by category
  Object.keys(byCategory).sort().forEach(category => {
    const categoryProducts = byCategory[category];
    console.log(`\n📁 Category: ${category === 'uncategorized' ? 'None' : category} (${categoryProducts.length} product(s))`);
    console.log('─'.repeat(80));

    categoryProducts.forEach(p => {
      console.log(`\n  Product: ${p.name}`);
      console.log(`    Slug: ${p.slug}`);
      console.log(`    Type: ${p.productType || 'gelato'}`);
      console.log(`    Artist: ${p.artistName || 'none'}`);
      console.log(`    Category: ${p.category || 'none'}`);
      
      if (p.galleryImages) {
        const images = JSON.parse(p.galleryImages);
        console.log(`    Gallery Images: ${images.length} image(s)`);
        if (images.length > 0) {
          console.log(`      Examples:`);
          images.slice(0, 3).forEach((img, idx) => {
            const filename = img.substring(img.lastIndexOf('/') + 1);
            console.log(`        ${idx + 1}. ${filename}`);
          });
          if (images.length > 3) {
            console.log(`        ... and ${images.length - 3} more`);
          }
        }
      } else {
        console.log(`    Gallery Images: none`);
      }

      if (p.gelatoCatalog) {
        console.log(`    Gelato Catalog: ${p.gelatoCatalog.title} (${p.gelatoCatalog.catalogUid})`);
      }

      if (p.allowedFormats) {
        const formats = JSON.parse(p.allowedFormats);
        console.log(`    Allowed Formats: ${formats.join(', ')}`);
      }

      console.log(`    Active: ${p.active ? 'Yes' : 'No'}`);
      console.log(`    Featured: ${p.featured ? 'Yes' : 'No'}`);
      console.log(`    Base Price: $${p.basePrice.toFixed(2)}`);
    });
  });

  // Summary
  console.log('\n\n=== SUMMARY ===');
  console.log(`Total Products: ${products.length}`);
  
  const categories = Object.keys(byCategory);
  console.log(`\nCategories:`);
  categories.forEach(cat => {
    console.log(`  - ${cat === 'uncategorized' ? 'None' : cat}: ${byCategory[cat].length} product(s)`);
  });

  const withArtists = products.filter(p => p.artistName);
  console.log(`\nProducts with Artists:`);
  if (withArtists.length === 0) {
    console.log(`  - None`);
  } else {
    const artists = [...new Set(withArtists.map(p => p.artistName))];
    artists.forEach(artist => {
      const count = withArtists.filter(p => p.artistName === artist).length;
      console.log(`  - ${artist}: ${count} product(s)`);
    });
  }

  const withImages = products.filter(p => p.galleryImages);
  console.log(`\nProducts with Gallery Images:`);
  if (withImages.length === 0) {
    console.log(`  - None`);
  } else {
    withImages.forEach(p => {
      const imgCount = JSON.parse(p.galleryImages).length;
      console.log(`  - ${p.name}: ${imgCount} image(s)`);
    });
  }

  console.log('\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
