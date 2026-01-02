import { NextRequest, NextResponse } from 'next/server';

// Gelato API configuration
const GELATO_PRODUCT_API_URL = process.env.GELATO_PRODUCT_API_URL || 'https://product.gelatoapis.com/v3';
const GELATO_API_KEY = process.env.GELATO_API_KEY || '';

interface GelatoVariant {
  uid: string;
  name: string;
  price: number;
  attributes?: Record<string, any>;
}

interface GelatoProduct {
  uid: string;
  name: string;
  variants: GelatoVariant[];
}

/**
 * Maps Gelato product types to their UIDs
 */
const PRODUCT_TYPE_MAP: Record<string, string> = {
  print: 'prints_pt_cl',
  card: 'cards_cl_dtc_prt_pt',
  postcard: 'postcards_cl_dtc_prt_pt',
  invitation: 'invitations_cl_dtc_prt_pt',
  announcement: 'announcements_cl_dtc_prt_pt',
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
 * Fetches product variants from Gelato API
 * Returns null on error (caller should handle gracefully)
 */
async function fetchGelatoVariants(productType: string): Promise<any> {
  const productUid = PRODUCT_TYPE_MAP[productType];
  if (!productUid) {
    return null;
  }

  try {
    const response = await fetch(`${GELATO_PRODUCT_API_URL}/products/${productUid}/variants`, {
      headers: {
        'X-API-KEY': GELATO_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Gelato API error: ${response.status} - ${errorText.substring(0, 100)}`);
    }

    const data = await response.json();
    return parseGelatoVariants(data, productType);
  } catch (error: any) {
    console.error('[GELATO_VARIANTS_ERROR]', { productType, message: error.message });
    return null;
  }
}

/**
 * Parses Gelato API response into our format
 * Returns both categorized options AND full variant list for matching
 */
function parseGelatoVariants(data: any, productType: string) {
  const variants = data.variants || [];
  
  const result: any = {
    sizes: [],
    materials: [],
    variants: [], // Full variant list for matching
  };

  variants.forEach((variant: GelatoVariant) => {
    // Parse variant attributes to categorize
    const attrs = variant.attributes || {};
    
    // Normalize variant data with consistent fields
    const normalizedVariant = {
      uid: variant.uid,
      name: variant.name,
      price: variant.price || 0,
      // Normalized option fields for matching
      size: attrs.size || attrs.dimensions || null,
      material: attrs.material || attrs.paper || attrs.finish || null,
      paper: attrs.paper || attrs.material || null, // For cards
      frame: attrs.frame || attrs.frameColor || (attrs.framed ? 'Standard' : null) || null,
      foil: attrs.foil || attrs.foilColor || null,
      // Keep raw attributes for reference
      attributes: attrs,
    };
    
    result.variants.push(normalizedVariant);
    
    // Size variants
    if (normalizedVariant.size) {
      const existingSize = result.sizes.find((s: any) => s.name === normalizedVariant.size);
      if (!existingSize) {
        result.sizes.push({
          name: normalizedVariant.size,
          // Price will be determined by matching variant
        });
      }
    }
    
    // Material/paper variants
    if (normalizedVariant.material || normalizedVariant.paper) {
      const materialName = normalizedVariant.paper || normalizedVariant.material;
      const existingMaterial = result.materials.find((m: any) => m.name === materialName);
      if (!existingMaterial) {
        result.materials.push({
          name: materialName,
          description: attrs.description || '',
        });
      }
    }
    
    // Frame variants (for prints)
    if (productType === 'print' && normalizedVariant.frame) {
      if (!result.frames) result.frames = [];
      const existingFrame = result.frames.find((f: any) => f.name === normalizedVariant.frame);
      if (!existingFrame) {
        result.frames.push({
          name: normalizedVariant.frame,
        });
      }
    }
    
    // Foil variants (for cards)
    if ((productType === 'card' || productType === 'invitation' || productType === 'announcement') && normalizedVariant.foil) {
      if (!result.foilColors) result.foilColors = [];
      const existingFoil = result.foilColors.find((f: any) => f.name === normalizedVariant.foil);
      if (!existingFoil) {
        result.foilColors.push({
          name: normalizedVariant.foil,
        });
      }
    }
  });

  // Sort options for consistent display
  result.sizes.sort((a: any, b: any) => a.name.localeCompare(b.name));
  result.materials.sort((a: any, b: any) => a.name.localeCompare(b.name));
  if (result.frames) result.frames.sort((a: any, b: any) => a.name.localeCompare(b.name));
  if (result.foilColors) result.foilColors.sort((a: any, b: any) => a.name.localeCompare(b.name));

  return result;
}

export async function GET(request: NextRequest) {
  // Stable error response schema
  const errorResponse = (error: string) => ({
    ok: false,
    error,
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

    // Validate productType parameter
    if (!productType) {
      return NextResponse.json(errorResponse('productType parameter is required'));
    }

    // Validate productType is known
    if (!PRODUCT_TYPE_MAP[productType]) {
      return NextResponse.json(errorResponse(`Unknown product type: ${productType}`));
    }

    // Validate GELATO_API_KEY
    if (!GELATO_API_KEY || GELATO_API_KEY.trim() === '') {
      console.error('[GELATO_VARIANTS_ERROR]', { productType, error: 'Missing GELATO_API_KEY' });
      return NextResponse.json(errorResponse('Missing GELATO_API_KEY'));
    }

    // Fetch variants from Gelato
    const variants = await fetchGelatoVariants(productType);
    
    if (!variants) {
      // fetchGelatoVariants returns null on error - use fallback options
      const fallback = getFallbackOptions(productType);
      return NextResponse.json({
        ok: true,
        source: 'fallback',
        variants: [],
        ...fallback,
      });
    }

    // Success response with stable schema
    return NextResponse.json({
      ok: true,
      variants: variants.variants || [],
      sizes: variants.sizes || [],
      materials: variants.materials || [],
      papers: variants.papers || [],
      frames: variants.frames || [],
      foilColors: variants.foilColors || [],
    });
  } catch (error: any) {
    const searchParams = request.nextUrl.searchParams;
    const productType = searchParams.get('productType') || 'unknown';
    const status = error.status || 'unknown';
    const message = error.message || 'Unknown error';
    
    console.error('[GELATO_VARIANTS_ERROR]', { productType, status, message });
    
    // Always return 200 with error schema (never 500)
    return NextResponse.json(errorResponse(`Failed to fetch variants: ${message.substring(0, 100)}`));
  }
}

