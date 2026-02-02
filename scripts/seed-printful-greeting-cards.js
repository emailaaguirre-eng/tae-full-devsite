// Seed script for Printful Greeting Card (Product 568)
// Run with: node scripts/seed-printful-greeting-cards.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Printful Greeting Card data...\n");

  // 1. Create or update the Greeting Cards category
  const category = await prisma.shopCategory.upsert({
    where: { taeId: "TAE-CARD" },
    update: {
      printProvider: "printful",
      printfulProductId: 568,
      requiresQrCode: true,
    },
    create: {
      taeId: "TAE-CARD",
      slug: "greeting-cards",
      name: "Greeting Cards",
      description: "Premium folded greeting cards with your custom design and QR code",
      printProvider: "printful",
      printfulProductId: 568,
      requiresQrCode: true,
      taeBaseFee: 2.0,
      active: true,
      featured: true,
      sortOrder: 1,
    },
  });

  console.log(`✅ Category created/updated: ${category.name} (${category.taeId})`);

  // 2. Define the three variants with their print specs
  const variants = [
    {
      taeId: "TAE-CARD-SM",
      slug: "greeting-card-small",
      name: "Greeting Card - Small (4.25\" x 5.5\")",
      sizeLabel: "4.25x5.5",
      printfulVariantId: 14457,
      printfulPrintfileId: 226,
      printWidth: 1842,
      printHeight: 1240,
      printDpi: 300,
      printFillMode: "cover",
      sortOrder: 1,
    },
    {
      taeId: "TAE-CARD-MD",
      slug: "greeting-card-medium",
      name: "Greeting Card - Medium (5\" x 7\")",
      sizeLabel: "5x7",
      printfulVariantId: 14458,
      printfulPrintfileId: 287,
      printWidth: 2146,
      printHeight: 1546,
      printDpi: 300,
      printFillMode: "cover",
      sortOrder: 2,
    },
    {
      taeId: "TAE-CARD-LG",
      slug: "greeting-card-large",
      name: "Greeting Card - Large (5.83\" x 8.27\" / A5)",
      sizeLabel: "A5",
      printfulVariantId: 14460,
      printfulPrintfileId: 289,
      printWidth: 2526,
      printHeight: 1794,
      printDpi: 300,
      printFillMode: "cover",
      sortOrder: 3,
    },
  ];

  // 3. Create or update each variant as a ShopProduct
  for (const v of variants) {
    const product = await prisma.shopProduct.upsert({
      where: { taeId: v.taeId },
      update: {
        printProvider: "printful",
        printfulProductId: 568,
        printfulVariantId: v.printfulVariantId,
        printfulPrintfileId: v.printfulPrintfileId,
        printWidth: v.printWidth,
        printHeight: v.printHeight,
        printDpi: v.printDpi,
        printFillMode: v.printFillMode,
        requiredPlacements: JSON.stringify(["front", "back", "inside1", "inside2"]),
        qrDefaultPosition: JSON.stringify({
          placement: "front",
          top: 50,
          left: 50,
          width: 150,
          height: 150,
        }),
      },
      create: {
        taeId: v.taeId,
        categoryId: category.id,
        slug: v.slug,
        name: v.name,
        description: `Premium folded greeting card, ${v.sizeLabel} size`,
        printProvider: "printful",
        printfulProductId: 568,
        printfulVariantId: v.printfulVariantId,
        printfulPrintfileId: v.printfulPrintfileId,
        printWidth: v.printWidth,
        printHeight: v.printHeight,
        printDpi: v.printDpi,
        printFillMode: v.printFillMode,
        requiredPlacements: JSON.stringify(["front", "back", "inside1", "inside2"]),
        qrDefaultPosition: JSON.stringify({
          placement: "front",
          top: 50,
          left: 50,
          width: 150,
          height: 150,
        }),
        sizeLabel: v.sizeLabel,
        printfulBasePrice: 0,
        taeAddOnFee: 0,
        active: true,
        sortOrder: v.sortOrder,
      },
    });

    console.log(`✅ Product created/updated: ${product.name}`);
    console.log(`   - Variant ID: ${v.printfulVariantId}`);
    console.log(`   - Print size: ${v.printWidth} x ${v.printHeight} px @ ${v.printDpi} DPI`);
    console.log("");
  }

  console.log("🎉 Seeding complete!\n");

  // 4. Display summary
  const categoryCount = await prisma.shopCategory.count();
  const productCount = await prisma.shopProduct.count();

  console.log("📊 Database summary:");
  console.log(`   - Categories: ${categoryCount}`);
  console.log(`   - Products: ${productCount}`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
