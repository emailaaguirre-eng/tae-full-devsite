/**
 * Test Assets API Response
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== Testing Assets API Logic ===\n');
  
  const artistSlug = 'bryant-colman';
  const active = true;
  
  const where = {
    active: true,
    artist: { slug: artistSlug },
  };

  const assets = await prisma.asset.findMany({
    where,
    include: {
      artist: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: [
      { sortOrder: 'asc' },
      { title: 'asc' },
    ],
  });

  console.log(`Query: artistSlug=${artistSlug}, active=${active}`);
  console.log(`Result: ${assets.length} assets found\n`);
  
  if (assets.length === 0) {
    // Check if any assets exist without the active filter
    const allAssets = await prisma.asset.findMany({
      where: {
        artist: { slug: artistSlug },
      },
    });
    console.log(`Total assets for ${artistSlug} (including inactive): ${allAssets.length}`);
    const activeCount = allAssets.filter(a => a.active).length;
    const inactiveCount = allAssets.filter(a => !a.active).length;
    console.log(`  Active: ${activeCount}`);
    console.log(`  Inactive: ${inactiveCount}`);
    
    if (inactiveCount > 0) {
      console.log('\n⚠️  Some assets are inactive. Setting them to active...');
      await prisma.asset.updateMany({
        where: {
          artist: { slug: artistSlug },
          active: false,
        },
        data: {
          active: true,
        },
      });
      console.log('✅ Updated inactive assets to active');
    }
  } else {
    console.log('First 5 assets:');
    assets.slice(0, 5).forEach(a => {
      console.log(`  - ${a.title} (${a.slug}) - Active: ${a.active}`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
