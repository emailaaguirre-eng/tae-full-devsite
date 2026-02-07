/**
 * Gelato Product Catalog Integration
 * 
 * SPRINT 2: Fetch and cache Gelato product catalog
 * - Fetches products from Gelato Product API
 * - Maps Gelato dimensions to trimBox mm
 * - Caches results in JSON file
 * - Provides refresh command
 */

import fs from 'fs';
import path from 'path';
import { getGelatoCatalogs, searchGelatoProducts, getGelatoProduct } from './gelato';

const GELATO_API_KEY = process.env.GELATO_API_KEY || '';
const GELATO_PRODUCT_API_URL = process.env.GELATO_PRODUCT_API_URL || 'https://product.gelatoapis.com/v3';

// Cache file location
const CACHE_DIR = path.join(process.cwd(), 'data');
const CACHE_FILE = path.join(CACHE_DIR, 'gelato-catalog-cache.json');

// ============================================================================
// Types
// ============================================================================

export interface GelatoProductDimension {
  width: number;
  height: number;
  unit: 'mm' | 'in' | 'cm';
}

export interface GelatoProductVariant {
  uid: string;
  name: string;
  dimensions?: GelatoProductDimension;
  attributes?: Record<string, string>;
}

export interface GelatoProduct {
  uid: string;
  name: string;
  catalogUid?: string;
  variants?: GelatoProductVariant[];
}

export interface CachedCatalog {
  timestamp: number;
  products: GelatoProduct[];
}

// ============================================================================
// Gelato API Functions
// ============================================================================

/**
 * Fetch product catalog from Gelato API
 */
async function fetchGelatoCatalog(): Promise<GelatoProduct[]> {
  const products: GelatoProduct[] = [];
  
  try {
    // Fetch catalogs first
    const catalogsData = await getGelatoCatalogs();
    const catalogs = catalogsData.data || catalogsData || [];
    
    // Fetch products from each catalog
    for (const catalog of catalogs) {
      const catalogUid = catalog.uid || catalog.id;
      if (!catalogUid) continue;
      
      try {
        // Use search to get products from catalog
        const productsData = await searchGelatoProducts(catalogUid, { limit: 1000 });
        const catalogProducts = productsData.data || productsData || [];
        
        for (const productData of catalogProducts) {
          const productUid = productData.uid || productData.id;
          if (!productUid) continue;
          
          try {
            // Fetch full product details to get variants
            const productDetails = await getGelatoProduct(productUid);
            
            // Extract dimensions from product or variants
            const variants: GelatoProductVariant[] = [];
            if (productDetails.variants) {
              for (const variantData of productDetails.variants) {
                variants.push({
                  uid: variantData.uid || variantData.id,
                  name: variantData.name || variantData.title,
                  dimensions: variantData.dimensions ? {
                    width: variantData.dimensions.width || variantData.dimensions.w,
                    height: variantData.dimensions.height || variantData.dimensions.h,
                    unit: variantData.dimensions.unit || 'mm',
                  } : undefined,
                  attributes: variantData.attributes,
                });
              }
            }
            
            products.push({
              uid: productUid,
              name: productDetails.name || productDetails.title || productData.name,
              catalogUid,
              variants,
            });
          } catch (error) {
            console.warn(`Failed to fetch details for product ${productUid}:`, error);
            // Add product without variants as fallback
            products.push({
              uid: productUid,
              name: productData.name || productData.title,
              catalogUid,
              variants: [],
            });
          }
        }
      } catch (error) {
        console.warn(`Error fetching products from catalog ${catalogUid}:`, error);
      }
    }
  } catch (error) {
    console.error('Error fetching Gelato catalog:', error);
    throw error;
  }

  return products;
}

/**
 * Convert Gelato dimension to mm
 */
export function gelatoDimensionToMm(dimension: GelatoProductDimension): { w: number; h: number } {
  let widthMm: number;
  let heightMm: number;

  switch (dimension.unit) {
    case 'mm':
      widthMm = dimension.width;
      heightMm = dimension.height;
      break;
    case 'cm':
      widthMm = dimension.width * 10;
      heightMm = dimension.height * 10;
      break;
    case 'in':
      widthMm = dimension.width * 25.4;
      heightMm = dimension.height * 25.4;
      break;
    default:
      // Default to mm if unit unknown
      console.warn(`Unknown dimension unit: ${dimension.unit}, assuming mm`);
      widthMm = dimension.width;
      heightMm = dimension.height;
  }

  return { w: widthMm, h: heightMm };
}

/**
 * Load cached catalog
 */
export function loadCachedCatalog(): CachedCatalog | null {
  try {
    if (!fs.existsSync(CACHE_FILE)) {
      return null;
    }

    const content = fs.readFileSync(CACHE_FILE, 'utf-8');
    return JSON.parse(content) as CachedCatalog;
  } catch (error) {
    console.error('Error loading cached catalog:', error);
    return null;
  }
}

/**
 * Save catalog to cache
 */
export function saveCatalogCache(products: GelatoProduct[]): void {
  try {
    // Ensure cache directory exists
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }

    const cache: CachedCatalog = {
      timestamp: Date.now(),
      products,
    };

    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
    console.log(`Catalog cached to ${CACHE_FILE}`);
  } catch (error) {
    console.error('Error saving catalog cache:', error);
    throw error;
  }
}

/**
 * Refresh catalog from Gelato API and update cache
 */
export async function refreshCatalogCache(): Promise<GelatoProduct[]> {
  console.log('Fetching catalog from Gelato API...');
  const products = await fetchGelatoCatalog();
  saveCatalogCache(products);
  console.log(`Catalog refreshed: ${products.length} products cached`);
  return products;
}

/**
 * Get catalog (from cache or fetch if cache missing/stale)
 */
export async function getCatalog(maxAgeHours: number = 24): Promise<GelatoProduct[]> {
  const cached = loadCachedCatalog();
  
  if (cached) {
    const ageHours = (Date.now() - cached.timestamp) / (1000 * 60 * 60);
    if (ageHours < maxAgeHours) {
      console.log(`Using cached catalog (${Math.round(ageHours * 10) / 10} hours old)`);
      return cached.products;
    }
  }

  // Check if Gelato API key is configured
  const GELATO_API_KEY = process.env.GELATO_API_KEY || '';
  if (!GELATO_API_KEY) {
    console.log('[GELATO] No API key configured - using sample product sizes');
    return getSampleProducts();
  }

  // Cache missing or stale, fetch fresh
  try {
    return await refreshCatalogCache();
  } catch (error) {
    console.error('[GELATO] Failed to refresh catalog, using sample products:', error);
    return getSampleProducts();
  }
}

/**
 * Sample products for development/demo when Gelato API is not configured
 */
function getSampleProducts(): GelatoProduct[] {
  return [
    {
      uid: 'sample-greeting-cards',
      name: 'Greeting Cards',
      catalogUid: 'cards',
      variants: [
        { uid: 'card-4x6-flat', name: '4x6 Flat Card', dimensions: { width: 101.6, height: 152.4, unit: 'mm' } },
        { uid: 'card-5x7-flat', name: '5x7 Flat Card', dimensions: { width: 127, height: 177.8, unit: 'mm' } },
        { uid: 'card-4x6-folded', name: '4x6 Folded Card', dimensions: { width: 101.6, height: 152.4, unit: 'mm' } },
        { uid: 'card-5x7-folded', name: '5x7 Folded Card', dimensions: { width: 127, height: 177.8, unit: 'mm' } },
        { uid: 'card-a6-flat', name: 'A6 Flat Card', dimensions: { width: 105, height: 148, unit: 'mm' } },
        { uid: 'card-a5-flat', name: 'A5 Flat Card', dimensions: { width: 148, height: 210, unit: 'mm' } },
      ],
    },
    {
      uid: 'sample-postcards',
      name: 'Postcards',
      catalogUid: 'postcards',
      variants: [
        { uid: 'postcard-4x6', name: '4x6 Postcard', dimensions: { width: 101.6, height: 152.4, unit: 'mm' } },
        { uid: 'postcard-5x7', name: '5x7 Postcard', dimensions: { width: 127, height: 177.8, unit: 'mm' } },
        { uid: 'postcard-6x9', name: '6x9 Postcard', dimensions: { width: 152.4, height: 228.6, unit: 'mm' } },
        { uid: 'postcard-a6', name: 'A6 Postcard', dimensions: { width: 105, height: 148, unit: 'mm' } },
      ],
    },
    {
      uid: 'sample-invitations',
      name: 'Invitations',
      catalogUid: 'invitations',
      variants: [
        { uid: 'invite-5x7', name: '5x7 Invitation', dimensions: { width: 127, height: 177.8, unit: 'mm' } },
        { uid: 'invite-4x9', name: '4x9 Invitation', dimensions: { width: 101.6, height: 228.6, unit: 'mm' } },
        { uid: 'invite-square-5', name: '5x5 Square Invitation', dimensions: { width: 127, height: 127, unit: 'mm' } },
      ],
    },
    {
      uid: 'sample-prints',
      name: 'Photo Prints',
      catalogUid: 'prints',
      variants: [
        { uid: 'print-4x6', name: '4x6 Print', dimensions: { width: 101.6, height: 152.4, unit: 'mm' } },
        { uid: 'print-5x7', name: '5x7 Print', dimensions: { width: 127, height: 177.8, unit: 'mm' } },
        { uid: 'print-8x10', name: '8x10 Print', dimensions: { width: 203.2, height: 254, unit: 'mm' } },
        { uid: 'print-11x14', name: '11x14 Print', dimensions: { width: 279.4, height: 355.6, unit: 'mm' } },
        { uid: 'print-16x20', name: '16x20 Print', dimensions: { width: 406.4, height: 508, unit: 'mm' } },
      ],
    },
    {
      uid: 'sample-wall-art',
      name: 'Wall Art',
      catalogUid: 'wall-art',
      variants: [
        { uid: 'canvas-12x12', name: '12x12 Canvas', dimensions: { width: 304.8, height: 304.8, unit: 'mm' } },
        { uid: 'canvas-16x20', name: '16x20 Canvas', dimensions: { width: 406.4, height: 508, unit: 'mm' } },
        { uid: 'canvas-24x36', name: '24x36 Canvas', dimensions: { width: 609.6, height: 914.4, unit: 'mm' } },
        { uid: 'poster-18x24', name: '18x24 Poster', dimensions: { width: 457.2, height: 609.6, unit: 'mm' } },
        { uid: 'poster-24x36', name: '24x36 Poster', dimensions: { width: 609.6, height: 914.4, unit: 'mm' } },
      ],
    },
  ];
}

/**
 * Find product by UID
 */
export function findProductByUid(products: GelatoProduct[], uid: string): GelatoProduct | undefined {
  return products.find(p => p.uid === uid);
}

/**
 * Find variant by UID
 */
export function findVariantByUid(products: GelatoProduct[], variantUid: string): { product: GelatoProduct; variant: GelatoProductVariant } | undefined {
  for (const product of products) {
    const variant = product.variants?.find(v => v.uid === variantUid);
    if (variant) {
      return { product, variant };
    }
  }
  return undefined;
}

