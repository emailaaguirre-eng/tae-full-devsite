/**
 * Refresh Gelato Catalog Cache
 * 
 * Usage: npm run refresh-catalog
 * 
 * Fetches latest product catalog from Gelato API and saves to cache file.
 */

import { refreshCatalogCache } from '../lib/gelatoCatalog';

async function main() {
  try {
    console.log('Refreshing Gelato catalog cache...');
    const products = await refreshCatalogCache();
    console.log(`✓ Successfully cached ${products.length} products`);
    process.exit(0);
  } catch (error: any) {
    console.error('✗ Error refreshing catalog:', error.message);
    process.exit(1);
  }
}

main();

