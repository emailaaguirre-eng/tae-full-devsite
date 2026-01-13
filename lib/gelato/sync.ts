/**
 * Gelato Catalog Sync Service
 * 
 * Fetches catalogs and products from Gelato API and caches in database.
 * This ensures we always have current product data without hardcoding.
 * 
 * Usage:
 *   await syncAllCatalogs()           // Sync all catalogs
 *   await syncCatalog('folded-cards') // Sync specific catalog
 *   await syncProductsForCatalog(id)  // Sync products for a catalog
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const GELATO_API_KEY = process.env.GELATO_API_KEY || '';
const GELATO_PRODUCT_API_URL = process.env.GELATO_PRODUCT_API_URL || 'https://product.gelatoapis.com/v3';

// Catalogs we care about for print products
// Only sync products we actually sell: cards, postcards, invitations, announcements, wall art
const RELEVANT_CATALOGS = [
  // Cards (greeting cards, folded cards)
  'cards',
  'folded-cards',
  'pack-of-cards',
  'pack-of-cards-envelopes',
  'pack-of-cards-folded',
  'pack-of-cards-folded-envelopes',
  // Postcards
  'postcards',
  // Invitations
  'invitations',
  // Announcements
  'announcements',
  // Wall Art (framed and unframed)
  'posters',           // Unframed posters
  'framed-posters',    // Framed posters
  'canvas',            // Unframed canvas
  'framed-canvas',     // Framed canvas
];

interface GelatoCatalogResponse {
  catalogUid: string;
  title: string;
  productAttributes: Array<{
    productAttributeUid: string;
    title: string;
    values: Array<{
      productAttributeValueUid: string;
      title: string;
    }> | Record<string, { productAttributeValueUid: string; title: string }>;
  }>;
}

interface GelatoProductResponse {
  productUid: string;
  attributes: Record<string, string>;
  dimensions?: Record<string, { value: string; measureUnit: string }>;
  weight?: { value: number; measureUnit: string };
  supportedCountries?: string[];
  isPrintable?: boolean;
  isStockable?: boolean;
}

interface GelatoProductSearchResponse {
  products: GelatoProductResponse[];
  pagination?: {
    total: number;
    offset: number;
  };
}

/**
 * Fetch all catalogs from Gelato API
 */
async function fetchGelatoCatalogs(): Promise<GelatoCatalogResponse[]> {
  if (!GELATO_API_KEY) {
    throw new Error('GELATO_API_KEY not configured');
  }

  const response = await fetch(`${GELATO_PRODUCT_API_URL}/catalogs`, {
    headers: {
      'X-API-KEY': GELATO_API_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch catalogs: ${response.status}`);
  }

  const data = await response.json();
  return data.data || data;
}

/**
 * Fetch catalog details with attributes
 */
async function fetchCatalogDetails(catalogUid: string): Promise<GelatoCatalogResponse> {
  if (!GELATO_API_KEY) {
    throw new Error('GELATO_API_KEY not configured');
  }

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
 * Search products in a catalog
 */
async function searchCatalogProducts(
  catalogUid: string,
  limit: number = 100,
  offset: number = 0
): Promise<GelatoProductSearchResponse> {
  if (!GELATO_API_KEY) {
    throw new Error('GELATO_API_KEY not configured');
  }

  const response = await fetch(
    `${GELATO_PRODUCT_API_URL}/catalogs/${catalogUid}/products:search`,
    {
      method: 'POST',
      headers: {
        'X-API-KEY': GELATO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ limit, offset }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to search products in ${catalogUid}: ${response.status}`);
  }

  return response.json();
}

/**
 * Sync a single catalog to database
 */
export async function syncCatalog(catalogUid: string): Promise<void> {
  console.log(`[GelatoSync] Syncing catalog: ${catalogUid}`);

  try {
    // Fetch catalog details
    const catalogData = await fetchCatalogDetails(catalogUid);

    // Upsert catalog
    await prisma.gelatoCatalog.upsert({
      where: { catalogUid },
      create: {
        catalogUid,
        title: catalogData.title,
        attributesJson: JSON.stringify(catalogData.productAttributes),
        lastSyncedAt: new Date(),
        syncStatus: 'synced',
      },
      update: {
        title: catalogData.title,
        attributesJson: JSON.stringify(catalogData.productAttributes),
        lastSyncedAt: new Date(),
        syncStatus: 'synced',
        syncError: null,
      },
    });

    console.log(`[GelatoSync] ✅ Catalog synced: ${catalogUid}`);
  } catch (error) {
    console.error(`[GelatoSync] ❌ Failed to sync catalog ${catalogUid}:`, error);

    // Mark as error in database
    await prisma.gelatoCatalog.upsert({
      where: { catalogUid },
      create: {
        catalogUid,
        title: catalogUid,
        syncStatus: 'error',
        syncError: error instanceof Error ? error.message : 'Unknown error',
      },
      update: {
        syncStatus: 'error',
        syncError: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    throw error;
  }
}

/**
 * Parse product UID to extract attributes
 * Example: cards_pf_5r_pt_100-lb-cover-coated-silk_cl_4-4_hor
 */
function parseProductUid(productUid: string): Record<string, string | null> {
  const parts = productUid.toLowerCase().split('_');
  
  const result: Record<string, string | null> = {
    paperFormat: null,
    paperType: null,
    colorType: null,
    orientation: null,
    coatingType: null,
    foldingType: null,
    spotFinishing: null,
    protectionType: null,
  };

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const nextPart = parts[i + 1];

    if (part === 'pf' && nextPart) {
      result.paperFormat = nextPart.toUpperCase();
      i++;
    } else if (part === 'pt' && nextPart) {
      // Paper type can span multiple parts (e.g., 100-lb-cover-coated-silk)
      let paperType = nextPart;
      while (parts[i + 2] && !['cl', 'ct', 'ft', 'sft', 'prt', 'hor', 'ver'].includes(parts[i + 2])) {
        paperType += '-' + parts[i + 2];
        i++;
      }
      result.paperType = paperType;
      i++;
    } else if (part === 'cl' && nextPart) {
      result.colorType = nextPart;
      i++;
    } else if (part === 'ct' && nextPart) {
      let coatingType = nextPart;
      // Coating type can be multi-part
      if (parts[i + 2] && !['prt', 'sft', 'hor', 'ver', 'ft'].includes(parts[i + 2])) {
        coatingType += '-' + parts[i + 2];
        i++;
      }
      result.coatingType = coatingType;
      i++;
    } else if (part === 'ft' && nextPart) {
      let foldType = nextPart;
      if (parts[i + 2] && ['hor', 'ver'].includes(parts[i + 2])) {
        foldType += '-' + parts[i + 2];
        i++;
      }
      result.foldingType = foldType;
      i++;
    } else if (part === 'sft' && nextPart) {
      let spotFinish = nextPart;
      // Spot finishing can be multi-part (e.g., foil-gold-1-1)
      while (parts[i + 2] && !['hor', 'ver', 'prt'].includes(parts[i + 2])) {
        spotFinish += '-' + parts[i + 2];
        i++;
      }
      result.spotFinishing = spotFinish;
      i++;
    } else if (part === 'prt' && nextPart) {
      result.protectionType = nextPart;
      i++;
    } else if (part === 'hor') {
      result.orientation = 'hor';
    } else if (part === 'ver') {
      result.orientation = 'ver';
    }
  }

  return result;
}

/**
 * Sync products for a catalog
 */
export async function syncProductsForCatalog(catalogUid: string): Promise<number> {
  console.log(`[GelatoSync] Syncing products for catalog: ${catalogUid}`);

  // Get catalog from database
  const catalog = await prisma.gelatoCatalog.findUnique({
    where: { catalogUid },
  });

  if (!catalog) {
    throw new Error(`Catalog ${catalogUid} not found. Sync catalog first.`);
  }

  let totalSynced = 0;
  let offset = 0;
  const limit = 100;
  let hasMore = true;

  while (hasMore) {
    try {
      const response = await searchCatalogProducts(catalogUid, limit, offset);
      const products = response.products || [];

      if (products.length === 0) {
        hasMore = false;
        continue;
      }

      // Upsert each product
      for (const product of products) {
        const parsed = parseProductUid(product.productUid);
        
        // Extract dimensions
        let widthMm: number | null = null;
        let heightMm: number | null = null;
        let weightGrams: number | null = null;

        if (product.dimensions) {
          const width = product.dimensions['Width'];
          const height = product.dimensions['Height'];
          if (width?.measureUnit === 'mm') {
            widthMm = parseFloat(width.value);
          }
          if (height?.measureUnit === 'mm') {
            heightMm = parseFloat(height.value);
          }
        }

        if (product.weight?.measureUnit === 'grams') {
          weightGrams = product.weight.value;
        }

        await prisma.gelatoProduct.upsert({
          where: { productUid: product.productUid },
          create: {
            productUid: product.productUid,
            catalogId: catalog.id,
            paperFormat: parsed.paperFormat,
            paperType: parsed.paperType,
            colorType: parsed.colorType,
            orientation: parsed.orientation,
            coatingType: parsed.coatingType,
            foldingType: parsed.foldingType,
            spotFinishing: parsed.spotFinishing,
            protectionType: parsed.protectionType,
            widthMm,
            heightMm,
            weightGrams,
            attributesJson: JSON.stringify(product.attributes),
            dimensionsJson: product.dimensions ? JSON.stringify(product.dimensions) : null,
            supportedCountries: product.supportedCountries ? JSON.stringify(product.supportedCountries) : null,
            isPrintable: product.isPrintable ?? true,
            isStockable: product.isStockable ?? false,
            productStatus: product.attributes?.ProductStatus || 'activated',
            lastSyncedAt: new Date(),
          },
          update: {
            paperFormat: parsed.paperFormat,
            paperType: parsed.paperType,
            colorType: parsed.colorType,
            orientation: parsed.orientation,
            coatingType: parsed.coatingType,
            foldingType: parsed.foldingType,
            spotFinishing: parsed.spotFinishing,
            protectionType: parsed.protectionType,
            widthMm,
            heightMm,
            weightGrams,
            attributesJson: JSON.stringify(product.attributes),
            dimensionsJson: product.dimensions ? JSON.stringify(product.dimensions) : null,
            supportedCountries: product.supportedCountries ? JSON.stringify(product.supportedCountries) : null,
            isPrintable: product.isPrintable ?? true,
            isStockable: product.isStockable ?? false,
            productStatus: product.attributes?.ProductStatus || 'activated',
            lastSyncedAt: new Date(),
          },
        });

        totalSynced++;
      }

      console.log(`[GelatoSync] Synced ${totalSynced} products so far...`);

      offset += limit;
      hasMore = products.length === limit;

      // Rate limiting - wait a bit between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`[GelatoSync] Error at offset ${offset}:`, error);
      hasMore = false;
    }
  }

  console.log(`[GelatoSync] ✅ Synced ${totalSynced} products for ${catalogUid}`);
  return totalSynced;
}

/**
 * Sync all relevant catalogs
 */
export async function syncAllCatalogs(): Promise<{
  catalogs: number;
  products: number;
  errors: string[];
}> {
  console.log('[GelatoSync] Starting full sync...');

  const errors: string[] = [];
  let catalogCount = 0;
  let productCount = 0;

  // First, fetch all available catalogs
  const allCatalogs = await fetchGelatoCatalogs();
  const relevantCatalogs = allCatalogs.filter(c => 
    RELEVANT_CATALOGS.includes(c.catalogUid)
  );

  console.log(`[GelatoSync] Found ${relevantCatalogs.length} relevant catalogs`);

  for (const catalog of relevantCatalogs) {
    try {
      await syncCatalog(catalog.catalogUid);
      catalogCount++;

      const products = await syncProductsForCatalog(catalog.catalogUid);
      productCount += products;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`${catalog.catalogUid}: ${message}`);
      console.error(`[GelatoSync] Failed to sync ${catalog.catalogUid}:`, message);
    }
  }

  console.log(`[GelatoSync] ✅ Full sync complete: ${catalogCount} catalogs, ${productCount} products`);

  return { catalogs: catalogCount, products: productCount, errors };
}

/**
 * Get cached catalog with attributes
 */
export async function getCachedCatalog(catalogUid: string) {
  const catalog = await prisma.gelatoCatalog.findUnique({
    where: { catalogUid },
  });

  if (!catalog) return null;

  return {
    ...catalog,
    attributes: catalog.attributesJson ? JSON.parse(catalog.attributesJson) : [],
  };
}

/**
 * Get cached products for a catalog with filters
 */
export async function getCachedProducts(
  catalogUid: string,
  filters?: {
    paperFormat?: string;
    orientation?: string;
    colorType?: string;
    coatingType?: string;
    foldingType?: string;
  }
) {
  const catalog = await prisma.gelatoCatalog.findUnique({
    where: { catalogUid },
  });

  if (!catalog) return [];

  const where: any = {
    catalogId: catalog.id,
    productStatus: 'activated',
    isPrintable: true,
  };

  if (filters?.paperFormat) where.paperFormat = filters.paperFormat;
  if (filters?.orientation) where.orientation = filters.orientation;
  if (filters?.colorType) where.colorType = filters.colorType;
  if (filters?.coatingType) where.coatingType = filters.coatingType;
  if (filters?.foldingType) where.foldingType = filters.foldingType;

  return prisma.gelatoProduct.findMany({
    where,
    orderBy: { productUid: 'asc' },
  });
}

/**
 * Get unique attribute values for a catalog
 * Useful for building filter dropdowns
 */
export async function getCatalogAttributeValues(catalogUid: string) {
  const catalog = await prisma.gelatoCatalog.findUnique({
    where: { catalogUid },
  });

  if (!catalog) return null;

  const products = await prisma.gelatoProduct.findMany({
    where: {
      catalogId: catalog.id,
      productStatus: 'activated',
    },
    select: {
      paperFormat: true,
      paperType: true,
      colorType: true,
      orientation: true,
      coatingType: true,
      foldingType: true,
      spotFinishing: true,
    },
  });

  // Extract unique values
  const values = {
    paperFormats: [...new Set(products.map(p => p.paperFormat).filter(Boolean))],
    paperTypes: [...new Set(products.map(p => p.paperType).filter(Boolean))],
    colorTypes: [...new Set(products.map(p => p.colorType).filter(Boolean))],
    orientations: [...new Set(products.map(p => p.orientation).filter(Boolean))],
    coatingTypes: [...new Set(products.map(p => p.coatingType).filter(Boolean))],
    foldingTypes: [...new Set(products.map(p => p.foldingType).filter(Boolean))],
    spotFinishings: [...new Set(products.map(p => p.spotFinishing).filter(Boolean))],
  };

  return values;
}
