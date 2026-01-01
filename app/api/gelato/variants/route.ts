import { NextRequest, NextResponse } from 'next/server';

// Gelato API configuration
const GELATO_API_BASE = process.env.GELATO_API_BASE || 'https://api.gelato.com/v4';
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
 * Fetches product variants from Gelato API
 */
async function fetchGelatoVariants(productType: string): Promise<any> {
  if (!GELATO_API_KEY) {
    throw new Error('GELATO_API_KEY not configured');
  }

  const productUid = PRODUCT_TYPE_MAP[productType];
  if (!productUid) {
    throw new Error(`Unknown product type: ${productType}`);
  }

  try {
    const response = await fetch(`${GELATO_API_BASE}/products/${productUid}/variants`, {
      headers: {
        'Authorization': `Bearer ${GELATO_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Gelato API error: ${response.status}`);
    }

    const data = await response.json();
    return parseGelatoVariants(data, productType);
  } catch (error) {
    console.error('Error fetching Gelato variants:', error);
    throw error;
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
  try {
    const searchParams = request.nextUrl.searchParams;
    const productType = searchParams.get('productType');

    if (!productType) {
      return NextResponse.json(
        { error: 'productType parameter is required' },
        { status: 400 }
      );
    }

    const variants = await fetchGelatoVariants(productType);
    return NextResponse.json(variants);
  } catch (error: any) {
    console.error('Gelato variants API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch variants' },
      { status: 500 }
    );
  }
}

