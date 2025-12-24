import { NextResponse } from 'next/server';
import { getWooCommerceProducts } from '@/lib/wordpress';

/**
 * Get admin dashboard statistics
 * GET /api/admin/stats
 */
export async function GET() {
  try {
    // Get ArtKey count (placeholder - implement when ArtKey storage is set up)
    const totalArtKeys = 0;
    
    // Get demo count (placeholder - implement when demo storage is set up)
    const totalDemos = 0;
    
    // Get WooCommerce product count
    let totalProducts = 0;
    let productsError = null;
    
    try {
      // Fetch all products (limit 0 = fetch all)
      const products = await getWooCommerceProducts(0);
      if (Array.isArray(products)) {
        totalProducts = products.length;
      }
    } catch (error) {
      productsError = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching product count:', error);
    }
    
    return NextResponse.json({
      totalArtKeys,
      totalDemos,
      totalProducts,
      productsError,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in stats API:', error);
    return NextResponse.json(
      {
        totalArtKeys: 0,
        totalDemos: 0,
        totalProducts: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
