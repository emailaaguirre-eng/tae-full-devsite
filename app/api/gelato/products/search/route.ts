import { NextRequest, NextResponse } from 'next/server';
import { getCatalog, findProductByUid, findVariantByUid } from '@/lib/gelatoCatalog';
import { getGelatoCatalogs, searchGelatoProducts } from '@/lib/gelato';

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
    
    // Try to get from cached catalog first
    const cached = await getCatalog(24); // Use cache if less than 24 hours old
    
    let products = cached;
    
    // If we need to search by catalog and it's not in cache, fetch from API
    if (catalogUid && (!cached || cached.length === 0)) {
      try {
        const searchResults = await searchGelatoProducts(catalogUid, { limit });
        products = searchResults.data || searchResults || [];
      } catch (error) {
        console.error('Error searching Gelato products:', error);
        // Fall back to cached catalog
        products = cached;
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
      cached: cached.length > 0,
    });
  } catch (error: any) {
    console.error('Error searching Gelato products:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search products' },
      { status: 500 }
    );
  }
}

