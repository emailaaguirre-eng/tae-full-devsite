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
 */
function parseGelatoVariants(data: any, productType: string) {
  const variants = data.variants || [];
  
  const result: any = {
    sizes: [],
    materials: [],
  };

  variants.forEach((variant: GelatoVariant) => {
    // Parse variant attributes to categorize
    const attrs = variant.attributes || {};
    
    // Size variants
    if (attrs.size || attrs.dimensions) {
      result.sizes.push({
        name: attrs.size || attrs.dimensions || variant.name,
        price: variant.price || 0,
        gelatoUid: variant.uid,
      });
    }
    
    // Material/paper variants
    if (attrs.material || attrs.paper || attrs.finish) {
      result.materials.push({
        name: attrs.material || attrs.paper || variant.name,
        price: variant.price || 0,
        gelatoUid: variant.uid,
        description: attrs.description || '',
      });
    }
    
    // Frame variants (for prints)
    if (productType === 'print' && (attrs.frame || attrs.framed)) {
      if (!result.frames) result.frames = [];
      result.frames.push({
        name: attrs.frameColor || attrs.frame || 'Standard',
        price: variant.price || 0,
        gelatoUid: variant.uid,
      });
    }
    
    // Foil variants (for cards)
    if ((productType === 'card' || productType === 'invitation' || productType === 'announcement') && attrs.foil) {
      if (!result.foilColors) result.foilColors = [];
      result.foilColors.push({
        name: attrs.foilColor || attrs.foil || 'Gold',
        price: variant.price || 0,
        gelatoUid: variant.uid,
      });
    }
  });

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

