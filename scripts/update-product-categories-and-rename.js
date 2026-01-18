/**
 * Update Product Categories and Rename Wall Art to ArtPrints
 * 
 * Sets up category structure:
 * - gallery > artists (for artist products like Bryant Colman, Deanna Lankin)
 * - gallery > cocreators (for CoCreator products)
 * - gallery > collaborations (for collaboration products)
 * 
 * Products:
 * - Cards (greeting cards)
 * - Invitations
 * - Postcards
 * - ArtPrints (renamed from Wall Art)
 * - Announcements
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('=== Updating Product Categories and Renaming ===\n');

  // 1. Rename Wall Art to ArtPrints
  const wallArt = await prisma.storeProduct.findUnique({
    where: { slug: 'wall-art' }
  });

  if (wallArt) {
    console.log('1. Renaming "Wall Art" to "ArtPrints"...');
    const updated = await prisma.storeProduct.update({
      where: { slug: 'wall-art' },
      data: {
        name: 'ArtPrints',
        slug: 'artprints',
        // Keep existing category as "wall-art" or change to "gallery.artists"?
        // Based on user request, products should have categories like:
        // Category: "gallery" or "gallery.artists"
      }
    });
    console.log(`   ✅ Renamed to "${updated.name}" (slug: ${updated.slug})\n`);
  }

  // 2. Update categories for all products
  console.log('2. Updating product categories...\n');

  // Products that should be in gallery > artists category
  // (products with artist associations)
  const artistProducts = await prisma.storeProduct.findMany({
    where: {
      artistName: { not: null }
    }
  });

  for (const product of artistProducts) {
    console.log(`   Updating ${product.name}...`);
    await prisma.storeProduct.update({
      where: { id: product.id },
      data: {
        category: 'gallery.artists'
      }
    });
    console.log(`     ✅ Category set to: gallery.artists`);
  }

  // 3. Show current state
  console.log('\n3. Current Product Categories:\n');
  const allProducts = await prisma.storeProduct.findMany({
    orderBy: [
      { category: 'asc' },
      { name: 'asc' }
    ]
  });

  const byCategory = {};
  allProducts.forEach(p => {
    const cat = p.category || 'none';
    if (!byCategory[cat]) {
      byCategory[cat] = [];
    }
    byCategory[cat].push(p);
  });

  Object.keys(byCategory).sort().forEach(cat => {
    console.log(`📁 ${cat === 'none' ? 'No Category' : cat}:`);
    byCategory[cat].forEach(p => {
      console.log(`   - ${p.name} (${p.slug})${p.artistName ? ' - Artist: ' + p.artistName : ''}`);
    });
    console.log('');
  });

  console.log('✅ Category updates complete!\n');
  console.log('Note: Category structure uses dot notation:');
  console.log('  - gallery.artists = Gallery > Artists');
  console.log('  - gallery.cocreators = Gallery > CoCreators');
  console.log('  - gallery.collaborations = Gallery > Collaborations');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
