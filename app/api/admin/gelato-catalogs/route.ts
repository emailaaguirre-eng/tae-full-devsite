/**
 * Gelato Catalogs API (for admin forms)
 * 
 * GET /api/admin/gelato-catalogs - List all synced catalogs with attribute options
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCatalogAttributeValues } from '@/lib/gelato/sync';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * GET - List catalogs with available attribute values
 */
export async function GET() {
  try {
    const catalogs = await prisma.gelatoCatalog.findMany({
      where: { syncStatus: 'synced' },
      orderBy: { catalogUid: 'asc' },
      select: {
        id: true,
        catalogUid: true,
        title: true,
        lastSyncedAt: true,
        _count: {
          select: { products: true },
        },
      },
    });

    // Get attribute values for each catalog
    const catalogsWithAttributes = await Promise.all(
      catalogs.map(async (catalog) => {
        const attributeValues = await getCatalogAttributeValues(catalog.catalogUid);
        return {
          ...catalog,
          productCount: catalog._count.products,
          attributeValues,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: catalogsWithAttributes,
    });
  } catch (error) {
    console.error('[GelatoCatalogs API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch catalogs' },
      { status: 500 }
    );
  }
}
