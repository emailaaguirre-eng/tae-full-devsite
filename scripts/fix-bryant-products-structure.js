/**
 * Fix Bryant Colman Products Structure
 * 
 * 1. Delete "Bryant Colman - Postcards" StoreProduct (not needed - images are Assets)
 * 2. Move "ArtPrints" from gallery.artists.bryant-colman to general category
 * 3. ArtPrints, Canvas Prints, Frame Prints should be general products (not gallery-specific)
 * 
 * Gallery images are Assets (Lane B), not StoreProducts.
 * When clicking an Asset, user can buy it in ArtPrints/Canvas/Frame formats (general products).
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== Fixing Bryant Colman Products Structure ===\n');

  // 1. Delete "Bryant Colman - Postcards" product
  console.log('1. Deleting "Bryant Colman - Postcards" product...\n');
  const postcards = await prisma.storeProduct.findUnique({
    where: { slug: 'bryant-colman-postcards' }
  });

  if (postcards) {
    await prisma.storeProduct.delete({
      where: { slug: 'bryant-colman-postcards' }
    });
    console.log('   ✅ Deleted "Bryant Colman - Postcards" product');
  } else {
    console.log('   ℹ️  "Bryant Colman - Postcards" product not found');
  }

  // 2. Move ArtPrints from gallery category to general
  console.log('\n2. Moving "ArtPrints" from gallery category to general...\n');
  const artPrints = await prisma.storeProduct.findUnique({
    where: { slug: 'artprints' }
  });

  if (artPrints) {
    if (artPrints.category && artPrints.category.startsWith('gallery')) {
      await prisma.storeProduct.update({
        where: { slug: 'artprints' },
        data: {
          category: null, // General product, not gallery-specific
          artistName: null, // Not artist-specific
          galleryImages: null, // Not a gallery product with images
        }
      });
      console.log('   ✅ Moved "ArtPrints" to general category');
      console.log('   ✅ Removed artistName and galleryImages');
    } else {
      console.log('   ℹ️  "ArtPrints" already in general category');
    }
  } else {
    console.log('   ⚠️  "ArtPrints" product not found');
  }

  // 3. Verify Canvas Prints and Frame Prints are general products
  console.log('\n3. Verifying Canvas Prints and Frame Prints are general...\n');
  
  const canvasPrints = await prisma.storeProduct.findUnique({
    where: { slug: 'canvas-prints' }
  });

  if (canvasPrints) {
    if (canvasPrints.category && canvasPrints.category.startsWith('gallery')) {
      await prisma.storeProduct.update({
        where: { slug: 'canvas-prints' },
        data: {
          category: null,
          artistName: null,
          galleryImages: null,
        }
      });
      console.log('   ✅ Fixed "Canvas Prints" category');
    } else {
      console.log('   ✅ "Canvas Prints" is already general');
    }
  }

  const framePrints = await prisma.storeProduct.findUnique({
    where: { slug: 'framed-prints' }
  });

  if (framePrints) {
    if (framePrints.category && framePrints.category.startsWith('gallery')) {
      await prisma.storeProduct.update({
        where: { slug: 'framed-prints' },
        data: {
          category: null,
          artistName: null,
          galleryImages: null,
        }
      });
      console.log('   ✅ Fixed "Framed Prints" category');
    } else {
      console.log('   ✅ "Framed Prints" is already general');
    }
  }

  // 4. Show final structure
  console.log('\n=== Final Structure ===\n');

  const galleryProducts = await prisma.storeProduct.findMany({
    where: {
      OR: [
        { category: { startsWith: 'gallery' } },
        { artistName: { not: null } },
      ]
    },
    orderBy: { name: 'asc' }
  });

  const generalProducts = await prisma.storeProduct.findMany({
    where: {
      AND: [
        { category: { not: { startsWith: 'gallery' } } },
        { artistName: null },
        { category: null }
      ]
    },
    orderBy: { name: 'asc' }
  });

  console.log('Gallery Products (should NOT appear on shop page):');
  if (galleryProducts.length === 0) {
    console.log('   ✅ None - all gallery products removed!');
  } else {
    galleryProducts.forEach(p => {
      console.log(`   ⚠️  ${p.name} (${p.slug}) - category: ${p.category || 'none'}, artist: ${p.artistName || 'none'}`);
    });
  }

  console.log('\nGeneral Products (should appear on shop page):');
  generalProducts.forEach(p => {
    console.log(`   ✅ ${p.name} (${p.slug})`);
  });

  console.log('\nAssets (Lane B - Gallery images, can be purchased in ArtPrints/Canvas/Frame):');
  const artists = await prisma.artist.findMany({
    include: {
      _count: { select: { assets: true } }
    },
    orderBy: { name: 'asc' }
  });

  artists.forEach(a => {
    console.log(`   ✅ ${a.name}: ${a._count.assets} asset(s)`);
  });

  console.log('\n✅ Structure fixed!');
  console.log('\nNote: Gallery images are Assets (Lane B), not StoreProducts.');
  console.log('When clicking an Asset on the gallery page, user can purchase it in:');
  console.log('  - ArtPrints (general product)');
  console.log('  - Canvas Prints (general product)');
  console.log('  - Frame Prints (general product)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
