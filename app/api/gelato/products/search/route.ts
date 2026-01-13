import { NextRequest, NextResponse } from 'next/server';
import { getCatalog } from '@/lib/gelatoCatalog';
import { searchGelatoProducts } from '@/lib/gelato';

// Mark this route as dynamic (uses searchParams)
export const dynamic = 'force-dynamic';

/**
 * GET /api/gelato/products/search
 * Search Gelato products by category/catalog
 * 
 * Query params:
 * - catalogUid: Filter by catalog UID
 * - category: Filter by product category (cards, postcards, etc.)
 * - limit: Max results (default: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const catalogUid = searchParams.get('catalogUid');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    
    // Try to get from cached catalog first (getCatalog returns sample products if no API key)
    let products: any[] = [];
    try {
      products = await getCatalog(24); // Use cache if less than 24 hours old, or sample products
    } catch (error: any) {
      console.error('[GELATO_API] Error loading catalog, this should not happen:', error);
      // getCatalog should never throw (it returns sample products), but if it does, 
      // return empty array - the UI will show a helpful message
      products = [];
    }
    
    // If we need to search by catalog and it's not in cache, fetch from API
    if (catalogUid && products.length === 0) {
      try {
        const searchResults = await searchGelatoProducts(catalogUid, { limit });
        products = searchResults.data || searchResults || [];
      } catch (error) {
        console.error('Error searching Gelato products:', error);
        // Error already handled - products remains empty or from cache
      }
    }
    
    // Filter by category if provided
    if (category && products) {
      // Map our category names to Gelato catalog names
      const categoryMap: Record<string, string> = {
        'card': 'cards',
        'postcard': 'postcards',
        'invitation': 'invitations',
        'announcement': 'announcements',
        'print': 'prints',
        'wall-art': 'wall-art',
      };
      
      const gelatoCategory = categoryMap[category] || category;
      
      products = products.filter((p: any) => {
        // Check if product name or catalog contains category
        const name = (p.name || '').toLowerCase();
        const catalog = (p.catalogUid || '').toLowerCase();
        return name.includes(gelatoCategory) || catalog.includes(gelatoCategory);
      });
    }
    
    // Format response with variants and dimensions
    const formatted = products.map((product: any) => ({
      uid: product.uid,
      name: product.name,
      catalogUid: product.catalogUid,
      variants: (product.variants || []).map((variant: any) => ({
        uid: variant.uid,
        name: variant.name,
        dimensions: variant.dimensions,
        trimMm: variant.dimensions ? {
          w: variant.dimensions.unit === 'mm' ? variant.dimensions.width :
             variant.dimensions.unit === 'cm' ? variant.dimensions.width * 10 :
             variant.dimensions.unit === 'in' ? variant.dimensions.width * 25.4 :
             variant.dimensions.width,
          h: variant.dimensions.unit === 'mm' ? variant.dimensions.height :
             variant.dimensions.unit === 'cm' ? variant.dimensions.height * 10 :
             variant.dimensions.unit === 'in' ? variant.dimensions.height * 25.4 :
             variant.dimensions.height,
        } : null,
        attributes: variant.attributes,
      })),
    }));
    
    return NextResponse.json({
      products: formatted,
      count: formatted.length,
      cached: products.length > 0,
    });
  } catch (error: any) {
    console.error('Error searching Gelato products:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search products' },
      { status: 500 }
    );
  }
}

