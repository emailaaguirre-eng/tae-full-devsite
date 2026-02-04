import { NextResponse } from 'next/server';
import { refreshCatalogCache } from '@/lib/gelatoCatalog';

/**
 * POST /api/gelato/catalog/refresh
 * Refreshes the Gelato catalog cache
 */
export async function POST() {
  try {
    const products = await refreshCatalogCache();
    return NextResponse.json({
      success: true,
      productsCount: products.length,
      message: `Catalog refreshed: ${products.length} products cached`,
    });
  } catch (error: any) {
    console.error('Error refreshing catalog:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to refresh catalog' },
      { status: 500 }
    );
  }
}

