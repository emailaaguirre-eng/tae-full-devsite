import { NextResponse } from 'next/server';
import { getDb, artKeys, eq, sql } from '@/lib/db';

/**
 * Get admin dashboard statistics
 * GET /api/admin/stats
 * Now uses Drizzle ORM for ArtKey and demo counts
 */
export async function GET() {
  try {
    const db = await getDb();
    // Get total ArtKey count using Drizzle
    const totalArtKeysResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(artKeys)
      .get();
    const totalArtKeys = totalArtKeysResult?.count ?? 0;

    // Get demo count (ArtKeys with isDemo === true)
    const totalDemosResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(artKeys)
      .where(eq(artKeys.isDemo, true))
      .get();
    const totalDemos = totalDemosResult?.count ?? 0;

    // Product count removed - no longer using WooCommerce
    return NextResponse.json({
      totalArtKeys,
      totalDemos,
      totalProducts: 0, // Products now managed via Gelato API, not WooCommerce
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
