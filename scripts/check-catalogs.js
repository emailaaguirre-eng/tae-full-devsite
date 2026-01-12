const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const catalogs = await prisma.gelatoCatalog.findMany({
    select: { 
      catalogUid: true, 
      title: true, 
      _count: { select: { products: true } } 
    }
  });
  
  console.log('=== Synced Catalogs ===');
  catalogs.forEach(c => {
    console.log(`  ${c.catalogUid}: ${c._count.products} products`);
  });
  
  // Check a sample product
  const sample = await prisma.gelatoProduct.findFirst({
    where: { 
      catalog: { catalogUid: 'folded-cards' },
      paperFormat: '5R'
    }
  });
  
  if (sample) {
    console.log('\n=== Sample Folded Card Product ===');
    console.log('UID:', sample.productUid);
    console.log('Format:', sample.paperFormat);
    console.log('Paper:', sample.paperType);
    console.log('Orientation:', sample.orientation);
    console.log('Folding:', sample.foldingType);
    console.log('Width:', sample.widthMm, 'mm');
    console.log('Height:', sample.heightMm, 'mm');
  }
}

check()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });
