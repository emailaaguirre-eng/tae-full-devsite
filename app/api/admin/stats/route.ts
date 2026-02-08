import { NextRequest, NextResponse } from 'next/server';
import { getDb, artKeys, shopProducts, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * Get admin dashboard statistics
 * GET /api/admin/stats
 */
export async function GET(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const db = await getDb();
    // Get total ArtKey count
    const totalArtKeysResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(artKeys)
      .get();
    const totalArtKeys = totalArtKeysResult?.count ?? 0;

    // Get portal (demo) count
    const allArtKeysForDemo = await db.select({ customizations: artKeys.customizations }).from(artKeys).all();
    const totalDemos = allArtKeysForDemo.filter((ak) => {
      try {
        const c = ak.customizations ? JSON.parse(ak.customizations) : {};
        return c.demo === true;
      } catch { return false; }
    }).length;

    // Get product count from local store
    let totalProducts = 0;
    try {
      const productCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(shopProducts)
        .get();
      totalProducts = productCountResult?.count ?? 0;
    } catch {
      // Table may not exist yet
    }

    return NextResponse.json({
      totalArtKeys,
      totalDemos,
      totalProducts,
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
