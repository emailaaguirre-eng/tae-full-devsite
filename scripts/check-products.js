// NOTE: Gelato references in this script are legacy. Print fulfillment is now via Printful.
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    const totalCount = await prisma.gelatoProduct.count();
    const trueCount = await prisma.gelatoProduct.count({ where: { isPrintable: true } });
    const falseCount = await prisma.gelatoProduct.count({ where: { isPrintable: false } });
    const activatedCount = await prisma.gelatoProduct.count({ where: { productStatus: 'activated' } });
    
    console.log('Total products:', totalCount);
    console.log('isPrintable=true:', trueCount);
    console.log('isPrintable=false:', falseCount);
    console.log('productStatus=activated:', activatedCount);
    console.log('both conditions:', await prisma.gelatoProduct.count({ 
      where: { isPrintable: true, productStatus: 'activated' } 
    }));
    
    // Check a sample product from cards catalog
    const sample = await prisma.gelatoProduct.findFirst({
      where: { 
        catalog: { catalogUid: 'cards' },
        isPrintable: true,
        productStatus: 'activated',
      },
      select: {
        productUid: true,
        paperFormat: true,
        orientation: true,
        paperType: true,
        productStatus: true,
        isPrintable: true,
      }
    });
    console.log('\nSample cards product:', sample);
    
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
