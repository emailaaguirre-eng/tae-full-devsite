/**
 * Check Assets in Database
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const assets = await prisma.asset.findMany({
    where: {
      artist: {
        slug: { in: ['bryant-colman', 'deanna-lankin'] }
      }
    },
    include: {
      artist: true
    },
    orderBy: [
      { artist: { sortOrder: 'asc' } },
      { sortOrder: 'asc' }
    ]
  });

  console.log('=== ASSETS IN DATABASE ===\n');
  
  const byArtist = {};
  assets.forEach(a => {
    if (!byArtist[a.artist.name]) {
      byArtist[a.artist.name] = [];
    }
    byArtist[a.artist.name].push(a);
  });

  Object.keys(byArtist).forEach(artistName => {
    console.log(`\n${artistName} (${byArtist[artistName][0].artist.slug}):`);
    console.log(`  Total Assets: ${byArtist[artistName].length}`);
    byArtist[artistName].slice(0, 5).forEach(a => {
      console.log(`    - ${a.title} (${a.slug})`);
      console.log(`      Image: ${a.image.substring(0, 60)}...`);
    });
    if (byArtist[artistName].length > 5) {
      console.log(`    ... and ${byArtist[artistName].length - 5} more`);
    }
  });

  console.log(`\n✅ Total Assets: ${assets.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
