/**
 * Test Shop API Query Logic
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== Testing Shop API Query ===\n');

  const activeOnly = true;

  const where = {
    AND: [
      {
        OR: [
          { category: null },
          { category: { not: { startsWith: 'gallery' } } },
        ],
      },
      { artistName: null },
    ],
  };

  if (activeOnly) {
    where.AND.push({ active: true });
  }

  console.log('Query where clause:');
  console.log(JSON.stringify(where, null, 2));
  console.log('\n');

  try {
    const products = await prisma.storeProduct.findMany({
      where,
      orderBy: [
        { featured: 'desc' },
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
      take: 10,
    });

    console.log(`✅ Query successful! Found ${products.length} products:\n`);
    products.forEach(p => {
      console.log(`  - ${p.name} (${p.slug})`);
    });
  } catch (error) {
    console.error('❌ Query failed:');
    console.error(error.message);
    console.error(error);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
