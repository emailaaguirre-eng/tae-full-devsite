import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getWooCommerceProducts } from '@/lib/wordpress';

/**
 * Get admin dashboard statistics
 * GET /api/admin/stats
 * Now uses Prisma database for ArtKey and demo counts
 */
export async function GET() {
  try {
    // Get ArtKey count from database
    const totalArtKeys = await prisma.artKey.count();
    
    // Get demo count (ArtKeys with customizations.demo === true)
    const allArtKeys = await prisma.artKey.findMany({
      select: { customizations: true },
    });
    
    const totalDemos = allArtKeys.filter((artKey) => {
      try {
        const customizations = JSON.parse(artKey.customizations);
        return customizations.demo === true;
      } catch {
        return false;
      }
    }).length;
    
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
