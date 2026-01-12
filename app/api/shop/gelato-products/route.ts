/**
 * Shop Gelato Products API
 * 
 * GET /api/shop/gelato-products?catalog=folded-cards - Get available Gelato products
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const catalogUid = searchParams.get('catalog');

    if (!catalogUid) {
      return NextResponse.json(
        { success: false, error: 'catalog parameter required' },
        { status: 400 }
      );
    }

    // Find the catalog
    const catalog = await prisma.gelatoCatalog.findUnique({
      where: { catalogUid },
    });

    if (!catalog) {
      return NextResponse.json(
        { success: false, error: 'Catalog not found' },
        { status: 404 }
      );
    }

    // Get products for this catalog
    const products = await prisma.gelatoProduct.findMany({
      where: {
        catalogId: catalog.id,
        productStatus: 'activated',
        isPrintable: true,
      },
      select: {
        productUid: true,
        paperFormat: true,
        paperType: true,
        colorType: true,
        orientation: true,
        coatingType: true,
        foldingType: true,
        spotFinishing: true,
        protectionType: true,
        widthMm: true,
        heightMm: true,
      },
      orderBy: [
        { paperFormat: 'asc' },
        { orientation: 'asc' },
        { paperType: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: products,
      meta: {
        catalog: catalogUid,
        total: products.length,
      },
    });
  } catch (error) {
    console.error('[Gelato Products API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Gelato products' },
      { status: 500 }
    );
  }
}
