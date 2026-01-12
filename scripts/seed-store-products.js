/**
 * Seed Store Products
 * 
 * Creates initial store products linked to Gelato catalogs
 * Run: node scripts/seed-store-products.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const STORE_PRODUCTS = [
  {
    slug: 'greeting-cards',
    name: 'Greeting Cards',
    description: 'Beautiful folded greeting cards for any occasion. Add your photos, customize with text, and include an ArtKey for a digital experience.',
    shortDescription: 'Folded cards with your personal touch',
    icon: '💌',
    gelatoCatalogUid: 'folded-cards',
    allowedFormats: ['5R', 'A5', 'A6', 'SM', 'SQ148X148'],
    basePrice: 4.99,
    active: true,
    featured: true,
    sortOrder: 1,
    editorConfig: {
      showFoilLayer: true,
      allowText: true,
      allowShapes: true,
      allowImages: true,
      showFoldLines: true,
    },
  },
  {
    slug: 'postcards',
    name: 'Postcards',
    description: 'Flat postcards perfect for quick notes, save-the-dates, or promotional materials. Double-sided printing available.',
    shortDescription: 'Flat cards for any message',
    icon: '📮',
    gelatoCatalogUid: 'cards',
    allowedFormats: ['5R', 'A6'],
    basePrice: 2.99,
    active: true,
    featured: false,
    sortOrder: 2,
    editorConfig: {
      showFoilLayer: false,
      allowText: true,
      allowShapes: true,
      allowImages: true,
      showFoldLines: false,
    },
  },
  {
    slug: 'invitations',
    name: 'Invitations',
    description: 'Elegant invitations for weddings, parties, and special events. Premium papers and optional foil accents available.',
    shortDescription: 'Make your event unforgettable',
    icon: '🎉',
    gelatoCatalogUid: 'folded-cards',
    allowedFormats: ['5R', 'A5', 'SQ148X148'],
    basePrice: 5.99,
    active: true,
    featured: true,
    sortOrder: 3,
    editorConfig: {
      showFoilLayer: true,
      allowText: true,
      allowShapes: true,
      allowImages: true,
      showFoldLines: true,
    },
  },
  {
    slug: 'announcements',
    name: 'Announcements',
    description: 'Share your news beautifully - births, graduations, engagements, and more. Include an ArtKey to share photos and videos.',
    shortDescription: 'Share life\'s big moments',
    icon: '📢',
    gelatoCatalogUid: 'folded-cards',
    allowedFormats: ['5R', 'A5', 'A6'],
    basePrice: 4.99,
    active: true,
    featured: false,
    sortOrder: 4,
    editorConfig: {
      showFoilLayer: true,
      allowText: true,
      allowShapes: true,
      allowImages: true,
      showFoldLines: true,
    },
  },
  {
    slug: 'wall-art',
    name: 'Wall Art',
    description: 'Premium prints for your walls. Choose from posters, canvas, or framed options in various sizes.',
    shortDescription: 'Gallery-quality prints',
    icon: '🖼️',
    gelatoCatalogUid: 'posters',
    allowedFormats: ['8X10', '11X14', '16X20', '18X24', '24X36'],
    basePrice: 14.99,
    active: true,
    featured: true,
    sortOrder: 5,
    editorConfig: {
      showFoilLayer: false,
      allowText: true,
      allowShapes: true,
      allowImages: true,
      showFoldLines: false,
    },
  },
  {
    slug: 'canvas-prints',
    name: 'Canvas Prints',
    description: 'Museum-quality canvas prints stretched on wooden frames. Perfect for showcasing your photos and artwork.',
    shortDescription: 'Art that makes a statement',
    icon: '🎨',
    gelatoCatalogUid: 'canvas',
    allowedFormats: ['8X10', '11X14', '12X12', '16X20', '18X24', '24X36'],
    basePrice: 29.99,
    active: true,
    featured: false,
    sortOrder: 6,
    editorConfig: {
      showFoilLayer: false,
      allowText: true,
      allowShapes: true,
      allowImages: true,
      showFoldLines: false,
    },
  },
  {
    slug: 'framed-prints',
    name: 'Framed Prints',
    description: 'Ready-to-hang framed prints. Choose from black, white, natural wood, or walnut frames.',
    shortDescription: 'Prints that arrive ready to display',
    icon: '🪟',
    gelatoCatalogUid: 'framed-posters',
    allowedFormats: ['8X10', '11X14', '16X20', '18X24', '24X36'],
    basePrice: 39.99,
    active: true,
    featured: false,
    sortOrder: 7,
    editorConfig: {
      showFoilLayer: false,
      allowText: true,
      allowShapes: true,
      allowImages: true,
      showFoldLines: false,
    },
  },
];

async function seedProducts() {
  console.log('🌱 Seeding store products...\n');

  for (const product of STORE_PRODUCTS) {
    try {
      // Get catalog ID
      let gelatoCatalogId = null;
      if (product.gelatoCatalogUid) {
        const catalog = await prisma.gelatoCatalog.findUnique({
          where: { catalogUid: product.gelatoCatalogUid },
        });
        if (catalog) {
          gelatoCatalogId = catalog.id;
        } else {
          console.log(`  ⚠️  Catalog ${product.gelatoCatalogUid} not found, skipping link`);
        }
      }

      // Check if exists
      const existing = await prisma.storeProduct.findUnique({
        where: { slug: product.slug },
      });

      if (existing) {
        console.log(`  ⏭️  ${product.name} already exists, skipping`);
        continue;
      }

      // Create product
      await prisma.storeProduct.create({
        data: {
          slug: product.slug,
          name: product.name,
          description: product.description,
          shortDescription: product.shortDescription,
          icon: product.icon,
          gelatoCatalogId,
          allowedFormats: JSON.stringify(product.allowedFormats),
          basePrice: product.basePrice,
          active: product.active,
          featured: product.featured,
          sortOrder: product.sortOrder,
          editorConfig: product.editorConfig ? JSON.stringify(product.editorConfig) : null,
        },
      });

      console.log(`  ✅ Created: ${product.name}`);
    } catch (error) {
      console.error(`  ❌ Failed to create ${product.name}:`, error.message);
    }
  }

  console.log('\n🎉 Seeding complete!');
}

seedProducts()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error('Seed failed:', error);
    prisma.$disconnect();
    process.exit(1);
  });
