import { NextRequest, NextResponse } from 'next/server';

// Mark this route as dynamic (uses searchParams)
export const dynamic = 'force-dynamic';

// Gelato API configuration
const GELATO_PRODUCT_API_URL = process.env.GELATO_PRODUCT_API_URL || 'https://product.gelatoapis.com/v3';
const GELATO_API_KEY = process.env.GELATO_API_KEY || '';

/**
 * Maps our product types to Gelato catalog UIDs
 */
const CATALOG_MAP: Record<string, string> = {
  card: 'cards',
  postcard: 'cards',
  invitation: 'cards',
  announcement: 'cards',
  print: 'posters',
};

/**
 * Fallback options when Gelato API is unavailable
 */
function getFallbackOptions(productType: string) {
  switch (productType) {
    case 'card':
    case 'invitation':
    case 'announcement':
      return {
        sizes: [
          { name: '4x6', price: 12.99 },
          { name: '5x7', price: 15.99 },
          { name: '6x9', price: 19.99 },
        ],
        materials: [],
        papers: [
          { name: 'Premium Cardstock', price: 0 },
          { name: 'Matte Cardstock', price: 0 },
          { name: 'Linen Cardstock', price: 2.00 },
        ],
        frames: [],
        foilColors: [
          { name: 'Gold', price: 5.00 },
          { name: 'Silver', price: 5.00 },
          { name: 'Rose Gold', price: 6.00 },
        ],
      };
    case 'postcard':
      return {
        sizes: [
          { name: '4x6', price: 8.99 },
          { name: '5x7', price: 10.99 },
          { name: '6x9', price: 14.99 },
        ],
        materials: [],
        papers: [
          { name: 'Premium Cardstock', price: 0 },
          { name: 'Matte Cardstock', price: 0 },
        ],
        frames: [],
        foilColors: [],
      };
    case 'print':
      return {
        sizes: [
          { name: '5x7', price: 9.99 },
          { name: '8x10', price: 14.99 },
          { name: '11x14', price: 24.99 },
          { name: '16x20', price: 39.99 },
          { name: '24x36', price: 89.99 },
        ],
        materials: [
          { name: 'Glossy', price: 0 },
          { name: 'Matte', price: 2.00 },
          { name: 'Canvas', price: 15.00 },
        ],
        papers: [],
        frames: [
          { name: 'Black', price: 0 },
          { name: 'White', price: 5.00 },
          { name: 'Silver', price: 6.00 },
        ],
        foilColors: [],
      };
    default:
      return { sizes: [], materials: [], papers: [], frames: [], foilColors: [] };
  }
}

/**
 * Fetches catalog info from Gelato API to get available attributes
 */
async function fetchCatalogInfo(catalogUid: string): Promise<any> {
  const response = await fetch(`${GELATO_PRODUCT_API_URL}/catalogs/${catalogUid}`, {
    headers: {
      'X-API-KEY': GELATO_API_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Gelato API error: ${response.status}`);
  }

  return await response.json();
}

/**
 * Searches products in a catalog
 */
async function searchCatalogProducts(catalogUid: string, filters?: any): Promise<any> {
  const response = await fetch(`${GELATO_PRODUCT_API_URL}/catalogs/${catalogUid}/products:search`, {
    method: 'POST',
    headers: {
      'X-API-KEY': GELATO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      limit: 100,
      offset: 0,
      ...filters,
    }),
  });

  if (!response.ok) {
    throw new Error(`Gelato API error: ${response.status}`);
  }

  return await response.json();
}

/**
 * Transforms Gelato catalog data into our options format
 */
function transformCatalogToOptions(catalogInfo: any, productsData: any, productType: string) {
  const options: any = {
    sizes: [],
    materials: [],
    papers: [],
    frames: [],
    foilColors: [],
  };

  // Extract options from catalog attributes
  if (catalogInfo.productAttributes) {
    for (const attr of catalogInfo.productAttributes) {
      const attrName = attr.productAttributeUid?.toLowerCase() || '';
      const values = attr.values || [];

      if (attrName.includes('format') || attrName.includes('size')) {
        options.sizes = values.map((v: any) => ({
          name: v.title || v.productAttributeValueUid,
          value: v.productAttributeValueUid,
          price: 0, // Price would come from pricing API
        }));
      } else if (attrName.includes('paper') || attrName.includes('material')) {
        const targetArray = productType === 'print' ? options.materials : options.papers;
        values.forEach((v: any) => {
          targetArray.push({
            name: v.title || v.productAttributeValueUid,
            value: v.productAttributeValueUid,
            price: 0,
          });
        });
      } else if (attrName.includes('coating') || attrName.includes('finish')) {
        // Add to materials or papers based on product type
        const targetArray = productType === 'print' ? options.materials : options.papers;
        values.forEach((v: any) => {
          if (!targetArray.find((x: any) => x.value === v.productAttributeValueUid)) {
            targetArray.push({
              name: v.title || v.productAttributeValueUid,
              value: v.productAttributeValueUid,
              price: 0,
            });
          }
        });
      }
    }
  }

  return options;
}

export async function GET(request: NextRequest) {
  const errorResponse = (error: string) => ({
    ok: false,
    error,
    source: 'error',
    variants: [],
    sizes: [],
    materials: [],
    papers: [],
    frames: [],
    foilColors: [],
  });

  try {
    const searchParams = request.nextUrl.searchParams;
    const productType = searchParams.get('productType');

    if (!productType) {
      return NextResponse.json(errorResponse('productType parameter is required'));
    }

    const catalogUid = CATALOG_MAP[productType];
    if (!catalogUid) {
      return NextResponse.json(errorResponse(`Unknown product type: ${productType}`));
    }

    if (!GELATO_API_KEY || GELATO_API_KEY.trim() === '') {
      console.error('[GELATO_VARIANTS]', { productType, error: 'Missing GELATO_API_KEY' });
      const fallback = getFallbackOptions(productType);
      return NextResponse.json({
        ok: true,
        source: 'fallback',
        variants: [],
        ...fallback,
      });
    }

    try {
      // Fetch catalog info and products from Gelato
      const [catalogInfo, productsData] = await Promise.all([
        fetchCatalogInfo(catalogUid),
        searchCatalogProducts(catalogUid),
      ]);

      const options = transformCatalogToOptions(catalogInfo, productsData, productType);

      // If we got empty options, use fallback
      if (options.sizes.length === 0 && options.materials.length === 0 && options.papers.length === 0) {
        const fallback = getFallbackOptions(productType);
        return NextResponse.json({
          ok: true,
          source: 'gelato-with-fallback',
          catalogUid,
          variants: productsData.products || [],
          ...fallback,
        });
      }

      return NextResponse.json({
        ok: true,
        source: 'gelato',
        catalogUid,
        variants: productsData.products || [],
        ...options,
      });
    } catch (apiError: any) {
      console.error('[GELATO_VARIANTS]', { productType, catalogUid, error: apiError.message });
      const fallback = getFallbackOptions(productType);
      return NextResponse.json({
        ok: true,
        source: 'fallback',
        error: apiError.message,
        variants: [],
        ...fallback,
      });
    }
  } catch (error: any) {
    console.error('[GELATO_VARIANTS_ERROR]', { error: error.message });
    return NextResponse.json(errorResponse(error.message || 'Internal server error'));
  }
}
