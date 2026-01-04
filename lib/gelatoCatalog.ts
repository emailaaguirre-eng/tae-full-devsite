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

  // Cache missing or stale, fetch fresh
  return await refreshCatalogCache();
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

