import { NextResponse } from 'next/server';
import { getCatalog, loadCachedCatalog } from '@/lib/gelatoCatalog';

/**
 * GET /api/gelato/catalog
 * Returns cached Gelato product catalog
 */
export async function GET() {
  try {
    // Return cached catalog (will fetch if missing/stale)
    const catalog = loadCachedCatalog();
    
    if (!catalog) {
      return NextResponse.json(
        { error: 'Catalog not cached. Run npm run refresh-catalog first.' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(catalog);
  } catch (error: any) {
    console.error('Error fetching catalog:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch catalog' },
      { status: 500 }
    );
  }
}

