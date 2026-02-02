/**
 * Gelato Product Sync Script
 *
 * Fetches products and pricing from Gelato API and caches locally.
 * Run: node scripts/sync-gelato-products.js
 *
 * This should be run:
 * - After initial setup
 * - Daily via cron/scheduler
 * - Manually when Gelato updates their catalog
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const prisma = new PrismaClient();

const GELATO_API_KEY = process.env.GELATO_API_KEY;
const GELATO_PRODUCT_API_URL = process.env.GELATO_PRODUCT_API_URL || 'https://product.gelatoapis.com/v3';

// Category to Gelato catalog mapping
const CATEGORY_CATALOG_MAP = {
  'wall-art': 'posters',
  'canvas-prints': 'canvas',
  'framed-prints': 'framed-posters',  // Note: hyphen required
  'cards': 'cards',
  'postcards': 'postcards',
  'invitations': 'cards',
  'announcements': 'cards',
};

// Sizes we want to offer (US standard sizes - both formats for matching)
const DESIRED_SIZES = {
  'posters': ['8x10', '11x14', '12x16', '12x18', '16x20', '18x24', '24x36'],
  'canvas': ['8x10', '11x14', '12x16', '16x20', '18x24', '24x36', '12x12', '16x16', '20x20'],
  'framed-posters': ['8x10', '11x14', '12x16', '16x20', '18x24', '24x36'],
};

// Frame colors we want to offer
const DESIRED_FRAME_COLORS = ['black', 'white', 'natural', 'walnut'];

/**
 * Fetch catalog info from Gelato
 */
async function fetchCatalog(catalogUid) {
  const response = await fetch(`${GELATO_PRODUCT_API_URL}/catalogs/${catalogUid}`, {
    headers: {
      'X-API-KEY': GELATO_API_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch catalog ${catalogUid}: ${response.status}`);
  }

  return response.json();
}

/**
 * Search products in a catalog with pagination
 */
async function searchAllProducts(catalogUid) {
  const allProducts = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;

  while (hasMore) {
    const url = `${GELATO_PRODUCT_API_URL}/catalogs/${catalogUid}/products:search`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-API-KEY': GELATO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ limit, offset }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`  Error at offset ${offset}: ${errorText.substring(0, 200)}`);
      break;
    }

    const data = await response.json();
    const products = data.products || [];
    allProducts.push(...products);

    console.log(`  Fetched ${products.length} products (offset ${offset}, total so far: ${allProducts.length})`);

    // Check if there are more
    if (products.length < limit) {
      hasMore = false;
    } else {
      offset += limit;
      // Safety limit to avoid infinite loops
      if (offset > 2000) {
        console.log(`  Reached safety limit at offset ${offset}`);
        hasMore = false;
      }
    }
  }

  return { products: allProducts };
}

/**
 * Get pricing for a specific product
 */
async function getProductPricing(productUid, country = 'US') {
  try {
    const response = await fetch(`${GELATO_PRODUCT_API_URL}/products/${productUid}/prices?country=${country}`, {
      headers: {
        'X-API-KEY': GELATO_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log(`  Price not available for ${productUid}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    // API returns array directly, find qty=1 price or use first price
    const qtyOnePrice = data.find(p => p.quantity === 1);
    return qtyOnePrice?.price || data?.[0]?.price || null;
  } catch (error) {
    console.log(`  Price error for ${productUid}: ${error.message}`);
    return null;
  }
}

/**
 * Parse size from product UID or attributes
 */
function parseSize(productUid, attributes) {
  // Try to get from attributes first
  if (attributes?.PaperFormat) {
    return attributes.PaperFormat;
  }

  // Parse from productUid (e.g., "posters_pf_12x18-inch_pt_...")
  const sizeMatch = productUid.match(/_pf_([^_]+)_/);
  if (sizeMatch) {
    return sizeMatch[1];
  }

  return null;
}

/**
 * Parse frame color from product UID
 * Format: _frc_black_ or _frc_white_ etc.
 */
function parseFrameColor(productUid) {
  // Match _frc_<color>_ pattern (frame color)
  const frameMatch = productUid.match(/_frc_([^_]+)/);
  if (frameMatch) {
    const color = frameMatch[1].toLowerCase();
    if (color.includes('black')) return 'black';
    if (color.includes('white')) return 'white';
    if (color.includes('natural') || color.includes('wood') || color.includes('light')) return 'natural';
    if (color.includes('walnut') || color.includes('dark')) return 'walnut';
    return color;
  }
  return null;
}

/**
 * Format size for display
 */
function formatSizeLabel(size) {
  // Convert "12x18-inch" to "12\" x 18\""
  const match = size.match(/(\d+)x(\d+)/);
  if (match) {
    return `${match[1]}" x ${match[2]}"`;
  }
  return size;
}

/**
 * Parse dimensions from size
 */
function parseDimensions(size) {
  const match = size.match(/(\d+)x(\d+)/);
  if (match) {
    const w = parseInt(match[1]);
    const h = parseInt(match[2]);
    return {
      widthInches: w,
      heightInches: h,
      widthMm: Math.round(w * 25.4),
      heightMm: Math.round(h * 25.4),
    };
  }
  return { widthInches: null, heightInches: null, widthMm: null, heightMm: null };
}

/**
 * Check if a size matches our desired sizes
 */
function sizeMatchesDesired(size, desiredSizes) {
  if (desiredSizes.length === 0) return true;

  // Extract numeric dimensions from size (e.g., "12x18-inch" -> "12x18")
  const sizeNums = size.match(/(\d+)x(\d+)/);
  if (!sizeNums) return false;

  const sizeKey = `${sizeNums[1]}x${sizeNums[2]}`;
  return desiredSizes.includes(sizeKey);
}

/**
 * Sync products for a single category
 */
async function syncCategory(categorySlug, gelatoCatalog) {
  console.log(`\nSyncing ${categorySlug} from Gelato catalog: ${gelatoCatalog}`);

  const desiredSizes = DESIRED_SIZES[gelatoCatalog] || [];
  const stats = { processed: 0, created: 0, updated: 0, skipped: 0, errors: 0 };

  try {
    // Fetch all products from this catalog (with pagination)
    const productsData = await searchAllProducts(gelatoCatalog);
    const products = productsData.products || [];

    console.log(`  Found ${products.length} total products in catalog`);

    for (const product of products) {
      stats.processed++;

      const size = parseSize(product.productUid, product.attributes);
      if (!size) {
        stats.skipped++;
        continue;
      }

      // Filter to desired sizes using flexible matching
      if (!sizeMatchesDesired(size, desiredSizes)) {
        stats.skipped++;
        continue;
      }

      // Check if US is supported
      const supportedInUS = product.supportedCountries?.includes('US');
      if (!supportedInUS) {
        stats.skipped++;
        continue;
      }

      // Parse frame color for framed prints
      const frameColor = gelatoCatalog === 'framed-posters' ? parseFrameColor(product.productUid) : null;
      if (gelatoCatalog === 'framed-posters' && frameColor && !DESIRED_FRAME_COLORS.includes(frameColor)) {
        stats.skipped++;
        continue;
      }

      // Get paper type
      const paperType = product.attributes?.PaperType || null;

      // Get pricing
      const price = await getProductPricing(product.productUid);

      // Parse dimensions
      const dimensions = parseDimensions(size);

      // Build product name
      let productName = formatSizeLabel(size);
      if (paperType) {
        const paperLabel = paperType.replace(/-/g, ' ').replace(/gsm/i, 'gsm');
        productName += ` - ${paperLabel}`;
      }
      if (frameColor) {
        productName += ` (${frameColor} frame)`;
      }

      // Upsert to cache
      try {
        await prisma.gelatoProductCache.upsert({
          where: { gelatoProductUid: product.productUid },
          update: {
            categorySlug,
            gelatoCatalog,
            productName,
            size,
            sizeLabel: formatSizeLabel(size),
            paperType,
            frameColor,
            orientation: product.attributes?.Orientation || null,
            gelatoPrice: price || 0,
            available: supportedInUS && price !== null,
            supportedCountries: JSON.stringify(product.supportedCountries || []),
            widthMm: dimensions.widthMm,
            heightMm: dimensions.heightMm,
            widthInches: dimensions.widthInches,
            heightInches: dimensions.heightInches,
            rawDataJson: JSON.stringify(product),
            lastSyncedAt: new Date(),
          },
          create: {
            categorySlug,
            gelatoCatalog,
            gelatoProductUid: product.productUid,
            productName,
            size,
            sizeLabel: formatSizeLabel(size),
            paperType,
            frameColor,
            orientation: product.attributes?.Orientation || null,
            gelatoPrice: price || 0,
            available: supportedInUS && price !== null,
            supportedCountries: JSON.stringify(product.supportedCountries || []),
            widthMm: dimensions.widthMm,
            heightMm: dimensions.heightMm,
            widthInches: dimensions.widthInches,
            heightInches: dimensions.heightInches,
            rawDataJson: JSON.stringify(product),
          },
        });
        stats.created++;
      } catch (err) {
        // Handle unique constraint - try update
        stats.updated++;
      }
    }

    console.log(`  Results: ${stats.created} created, ${stats.updated} updated, ${stats.skipped} skipped`);
    return stats;

  } catch (error) {
    console.error(`  Error syncing ${categorySlug}: ${error.message}`);
    stats.errors++;
    return stats;
  }
}

/**
 * Main sync function
 */
async function main() {
  console.log('===========================================');
  console.log('Gelato Product Sync');
  console.log('===========================================');
  console.log(`API URL: ${GELATO_PRODUCT_API_URL}`);
  console.log(`API Key: ${GELATO_API_KEY ? '✓ Present' : '✗ Missing'}`);

  if (!GELATO_API_KEY) {
    console.error('\nError: GELATO_API_KEY not found in environment');
    process.exit(1);
  }

  // Log sync start
  const syncLog = await prisma.gelatoSyncLog.create({
    data: {
      syncType: 'full',
      status: 'started',
    },
  });

  const totalStats = { processed: 0, created: 0, updated: 0, skipped: 0, errors: 0 };

  // Sync each category we care about for gallery (artist prints)
  const categoriesToSync = ['wall-art', 'canvas-prints', 'framed-prints'];

  for (const categorySlug of categoriesToSync) {
    const gelatoCatalog = CATEGORY_CATALOG_MAP[categorySlug];
    if (!gelatoCatalog) {
      console.log(`\nSkipping ${categorySlug} - no catalog mapping`);
      continue;
    }

    const stats = await syncCategory(categorySlug, gelatoCatalog);
    totalStats.processed += stats.processed;
    totalStats.created += stats.created;
    totalStats.updated += stats.updated;
    totalStats.skipped += stats.skipped;
    totalStats.errors += stats.errors;
  }

  // Update sync log
  await prisma.gelatoSyncLog.update({
    where: { id: syncLog.id },
    data: {
      status: totalStats.errors > 0 ? 'completed_with_errors' : 'completed',
      itemsProcessed: totalStats.processed,
      itemsUpdated: totalStats.created + totalStats.updated,
      itemsFailed: totalStats.errors,
      completedAt: new Date(),
    },
  });

  console.log('\n===========================================');
  console.log('Sync Complete');
  console.log('===========================================');
  console.log(`Total processed: ${totalStats.processed}`);
  console.log(`Created/Updated: ${totalStats.created + totalStats.updated}`);
  console.log(`Skipped: ${totalStats.skipped}`);
  console.log(`Errors: ${totalStats.errors}`);

  // Show sample of cached products
  const cachedCount = await prisma.gelatoProductCache.count();
  console.log(`\nTotal products in cache: ${cachedCount}`);

  const sample = await prisma.gelatoProductCache.findMany({
    take: 5,
    where: { available: true },
    orderBy: { categorySlug: 'asc' },
  });

  if (sample.length > 0) {
    console.log('\nSample cached products:');
    sample.forEach(p => {
      console.log(`  ${p.categorySlug} | ${p.sizeLabel} | $${p.gelatoPrice.toFixed(2)}`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
