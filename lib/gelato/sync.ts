/**
 * Gelato Catalog Sync Service
 *
 * NOTE: This module is stubbed out pending schema migration.
 * The GelatoCatalog and GelatoProduct models need to be re-added to the schema
 * before this functionality can be restored.
 *
 * TODO: Re-implement when Gelato sync is needed
 */

// Stub implementations that don't depend on removed Prisma models

const GELATO_API_KEY = process.env.GELATO_API_KEY || '';
const GELATO_PRODUCT_API_URL = process.env.GELATO_PRODUCT_API_URL || 'https://product.gelatoapis.com/v3';

// Catalogs we care about for print products
export const RELEVANT_CATALOGS = [
  'cards',
  'folded-cards',
  'postcards',
  'invitations',
  'announcements',
  'posters',
  'framed-posters',
  'canvas',
  'framed-canvas',
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

/**
 * Fetch catalog details from Gelato API (no database)
 */
export async function fetchCatalogDetails(catalogUid: string): Promise<GelatoCatalogResponse | null> {
  if (!GELATO_API_KEY) {
    console.warn('[GelatoSync] GELATO_API_KEY not configured');
    return null;
  }

  try {
    const response = await fetch(`${GELATO_PRODUCT_API_URL}/catalogs/${catalogUid}`, {
      headers: {
        'X-API-KEY': GELATO_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[GelatoSync] Failed to fetch catalog ${catalogUid}: ${response.status}`);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error(`[GelatoSync] Error fetching catalog ${catalogUid}:`, error);
    return null;
  }
}

/**
 * Search products in a catalog (direct API call, no caching)
 */
export async function searchCatalogProducts(
  catalogUid: string,
  limit: number = 100,
  offset: number = 0
): Promise<{ products: GelatoProductResponse[]; total?: number } | null> {
  if (!GELATO_API_KEY) {
    console.warn('[GelatoSync] GELATO_API_KEY not configured');
    return null;
  }

  try {
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
      console.error(`[GelatoSync] Failed to search products in ${catalogUid}: ${response.status}`);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error(`[GelatoSync] Error searching products in ${catalogUid}:`, error);
    return null;
  }
}

/**
 * Stub: Sync a single catalog to database
 * TODO: Re-implement when GelatoCatalog model is restored
 */
export async function syncCatalog(catalogUid: string): Promise<void> {
  console.warn(`[GelatoSync] syncCatalog is stubbed - GelatoCatalog model not available`);
  console.log(`[GelatoSync] Would sync catalog: ${catalogUid}`);
}

/**
 * Stub: Sync products for a catalog
 * TODO: Re-implement when GelatoProduct model is restored
 */
export async function syncProductsForCatalog(catalogUid: string): Promise<number> {
  console.warn(`[GelatoSync] syncProductsForCatalog is stubbed - GelatoProduct model not available`);
  console.log(`[GelatoSync] Would sync products for: ${catalogUid}`);
  return 0;
}

/**
 * Stub: Sync all relevant catalogs
 * TODO: Re-implement when Gelato models are restored
 */
export async function syncAllCatalogs(): Promise<{
  catalogs: number;
  products: number;
  errors: string[];
}> {
  console.warn(`[GelatoSync] syncAllCatalogs is stubbed - Gelato models not available`);
  return { catalogs: 0, products: 0, errors: ['Gelato sync is disabled - models not available'] };
}

/**
 * Stub: Get cached catalog
 * TODO: Re-implement when GelatoCatalog model is restored
 */
export async function getCachedCatalog(catalogUid: string) {
  console.warn(`[GelatoSync] getCachedCatalog is stubbed - using direct API call`);
  return fetchCatalogDetails(catalogUid);
}

/**
 * Stub: Get cached products for a catalog
 * TODO: Re-implement when GelatoProduct model is restored
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
  console.warn(`[GelatoSync] getCachedProducts is stubbed - returning empty array`);
  return [];
}

/**
 * Stub: Get unique attribute values for a catalog
 * TODO: Re-implement when GelatoProduct model is restored
 */
export async function getCatalogAttributeValues(catalogUid: string) {
  console.warn(`[GelatoSync] getCatalogAttributeValues is stubbed - returning null`);
  return null;
}

/**
 * Parse product UID to extract attributes
 * Example: cards_pf_5r_pt_100-lb-cover-coated-silk_cl_4-4_hor
 */
export function parseProductUid(productUid: string): Record<string, string | null> {
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
