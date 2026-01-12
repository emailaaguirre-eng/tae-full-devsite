/**
 * Gelato Catalog Sync API
 * 
 * POST /api/gelato/sync - Trigger full sync of all catalogs
 * POST /api/gelato/sync?catalog=folded-cards - Sync specific catalog
 * GET /api/gelato/sync - Get sync status
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { syncAllCatalogs, syncCatalog, syncProductsForCatalog } from '@/lib/gelato/sync';

const prisma = new PrismaClient();

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET - Get sync status
 */
export async function GET() {
  try {
    const catalogs = await prisma.gelatoCatalog.findMany({
      orderBy: { catalogUid: 'asc' },
      select: {
        catalogUid: true,
        title: true,
        syncStatus: true,
        syncError: true,
        lastSyncedAt: true,
        _count: {
          select: { products: true },
        },
      },
    });

    const totalProducts = await prisma.gelatoProduct.count();

    return NextResponse.json({
      success: true,
      data: {
        catalogs: catalogs.map(c => ({
          ...c,
          productCount: c._count.products,
        })),
        totalProducts,
        lastSync: catalogs.reduce((latest, c) => {
          const date = c.lastSyncedAt;
          return !latest || date > latest ? date : latest;
        }, null as Date | null),
      },
    });
  } catch (error) {
    console.error('[GelatoSync API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}

/**
 * POST - Trigger sync
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const catalogUid = searchParams.get('catalog');

    if (catalogUid) {
      // Sync specific catalog
      console.log(`[GelatoSync API] Syncing catalog: ${catalogUid}`);
      
      await syncCatalog(catalogUid);
      const productCount = await syncProductsForCatalog(catalogUid);

      return NextResponse.json({
        success: true,
        message: `Synced catalog ${catalogUid}`,
        data: {
          catalog: catalogUid,
          products: productCount,
        },
      });
    } else {
      // Full sync
      console.log('[GelatoSync API] Starting full sync...');
      
      const result = await syncAllCatalogs();

      return NextResponse.json({
        success: result.errors.length === 0,
        message: `Synced ${result.catalogs} catalogs, ${result.products} products`,
        data: result,
      });
    }
  } catch (error) {
    console.error('[GelatoSync API] Sync error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      },
      { status: 500 }
    );
  }
}
