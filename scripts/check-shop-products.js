/**
 * Check Shop Products
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== CHECKING SHOP PRODUCTS ===\n');

  // Check what the shop API should return
  const where = {
    NOT: [
      { category: { startsWith: 'gallery' } },
      { artistName: { not: null } },
    ],
    OR: [
      { category: null },
      { category: { not: { startsWith: 'gallery' } } },
    ],
    active: true,
  };

  const shopProducts = await prisma.storeProduct.findMany({
    where,
    orderBy: [
      { featured: 'desc' },
      { sortOrder: 'asc' },
      { name: 'asc' },
    ],
  });

  console.log(`Shop Products (should appear on /shop page): ${shopProducts.length}\n`);

  if (shopProducts.length === 0) {
    console.log('❌ No products found for shop page!');
    console.log('\nChecking all products...\n');
    
    const allProducts = await prisma.storeProduct.findMany({
      orderBy: { name: 'asc' }
    });

    console.log(`Total StoreProducts: ${allProducts.length}\n`);

    allProducts.forEach(p => {
      const hasGalleryCategory = p.category && p.category.startsWith('gallery');
      const hasArtistName = p.artistName !== null;
      const isActive = p.active;
      
      console.log(`- ${p.name} (${p.slug})`);
      console.log(`  Category: ${p.category || 'null'}`);
      console.log(`  Artist: ${p.artistName || 'null'}`);
      console.log(`  Active: ${isActive}`);
      console.log(`  Would show on shop: ${isActive && !hasGalleryCategory && !hasArtistName}`);
      console.log('');
    });
  } else {
    console.log('✅ Products for shop page:');
    shopProducts.forEach(p => {
      console.log(`  - ${p.name} (${p.slug})`);
      console.log(`    Category: ${p.category || 'none'}`);
      console.log(`    Featured: ${p.featured}`);
      console.log(`    Active: ${p.active}`);
    });
  }

  console.log('\n=== EXPECTED PRODUCTS ===');
  console.log('Cards, Invitations, Postcards, ArtPrints, Canvas Prints, Framed Prints, Announcements');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
