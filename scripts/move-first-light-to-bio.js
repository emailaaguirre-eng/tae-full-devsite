/**
 * Move Deanna Lankin's "First Light" Asset to bioImage
 * 
 * Removes the Asset from Lane B and adds it as bioImage to the Artist record
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== Moving First Light to Deanna\'s bioImage ===\n');

  // 1. Find Deanna's "First Light" asset
  const firstLight = await prisma.asset.findFirst({
    where: {
      artist: { slug: 'deanna-lankin' },
      title: 'First Light'
    },
    include: {
      artist: true
    }
  });

  if (!firstLight) {
    console.log('❌ "First Light" asset not found for Deanna Lankin');
    return;
  }

  console.log(`✅ Found "First Light" asset:`);
  console.log(`   Image: ${firstLight.image}`);
  console.log(`   Current bioImage: ${firstLight.artist.bioImage || 'none'}\n`);

  // 2. Update Deanna's Artist record to use First Light as bioImage
  await prisma.artist.update({
    where: { id: firstLight.artistId },
    data: {
      bioImage: firstLight.image
    }
  });

  console.log('✅ Updated Deanna\'s bioImage to First Light image\n');

  // 3. Deactivate or delete the First Light asset (deactivate for now)
  await prisma.asset.update({
    where: { id: firstLight.id },
    data: {
      active: false
    }
  });

  console.log('✅ Deactivated "First Light" asset (removed from Available ArtWork)\n');

  // 4. Verify changes
  const deanna = await prisma.artist.findUnique({
    where: { slug: 'deanna-lankin' },
    include: {
      _count: { select: { assets: true } },
      assets: {
        where: { active: true },
        select: { id: true, title: true }
      }
    }
  });

  console.log('=== Verification ===\n');
  console.log(`Deanna Lankin:`);
  console.log(`  bioImage: ${deanna.bioImage || 'none'}`);
  console.log(`  Active Assets: ${deanna.assets.length}`);
  console.log(`  Total Assets (including inactive): ${deanna._count.assets}`);

  if (deanna.assets.length === 0) {
    console.log('\n✅ Deanna has no active assets - will show "Available ArtWork coming soon" message');
  }

  console.log('\n✅ Complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
