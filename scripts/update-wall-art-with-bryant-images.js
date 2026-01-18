/**
 * Update Wall Art StoreProduct with Bryant Colman's Gallery Images
 * 
 * This script:
 * 1. Loads Bryant Colman's 26 images from gallery.json
 * 2. Updates the "Wall Art" StoreProduct with:
 *    - All 26 images in galleryImages field
 *    - artistName set to "Bryant Colman"
 *    - Proper configuration for wall art/poster products
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('=== Updating Wall Art Product with Bryant Colman Images ===\n');

  // 1. Load Bryant's images from gallery.json
  const galleryPath = path.join(__dirname, '..', 'content', 'gallery.json');
  const galleryData = JSON.parse(fs.readFileSync(galleryPath, 'utf8'));
  const bryant = galleryData.artists.find(a => a.slug === 'bryant-colman');

  if (!bryant || !bryant.portfolio) {
    console.error('❌ Bryant Colman not found in gallery.json or has no portfolio');
    return;
  }

  // Extract image URLs from portfolio
  const bryantImages = bryant.portfolio.map(item => item.image);
  console.log(`✅ Loaded ${bryantImages.length} images from Bryant Colman's gallery\n`);

  // 2. Find the Wall Art product
  const wallArtProduct = await prisma.storeProduct.findUnique({
    where: { slug: 'wall-art' }
  });

  if (!wallArtProduct) {
    console.error('❌ Wall Art product not found! Make sure it exists first.');
    return;
  }

  console.log('Current Wall Art Product:');
  console.log(`  Name: ${wallArtProduct.name}`);
  console.log(`  Type: ${wallArtProduct.productType}`);
  console.log(`  Category: ${wallArtProduct.category || 'none'}`);
  console.log(`  Artist: ${wallArtProduct.artistName || 'none'}`);
  console.log(`  Current Gallery Images: ${wallArtProduct.galleryImages ? JSON.parse(wallArtProduct.galleryImages).length : 0}\n`);

  // 3. Update the product with Bryant's images
  console.log('Updating Wall Art product...');
  
  const updatedProduct = await prisma.storeProduct.update({
    where: { slug: 'wall-art' },
    data: {
      artistName: 'Bryant Colman',
      galleryImages: JSON.stringify(bryantImages),
      // Keep existing values but update artist and images
      // Make sure productType is appropriate
      productType: wallArtProduct.productType || 'gelato',
      // You may want to set a category if needed
      category: wallArtProduct.category || 'wall-art',
    }
  });

  console.log('✅ Successfully updated Wall Art product!');
  console.log('\nUpdated Product Details:');
  console.log(`  Name: ${updatedProduct.name}`);
  console.log(`  Artist: ${updatedProduct.artistName}`);
  console.log(`  Gallery Images: ${JSON.parse(updatedProduct.galleryImages).length} images`);
  console.log(`\nImages added:`);
  JSON.parse(updatedProduct.galleryImages).slice(0, 5).forEach((img, idx) => {
    console.log(`  ${idx + 1}. ${img.substring(img.lastIndexOf('/') + 1)}`);
  });
  if (bryantImages.length > 5) {
    console.log(`  ... and ${bryantImages.length - 5} more`);
  }

  console.log('\n✅ Migration complete!');
  console.log('\nNext steps:');
  console.log('1. Verify the product in admin portal: /b_d_admn_tae/catalog/products');
  console.log('2. Check that Gelato catalog is linked (if using Gelato)');
  console.log('3. Configure allowed formats/papers/coatings for wall art options');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
