/**
 * Public Shop Products API
 * 
 * GET /api/shop/products - List active store products for the shop
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * GET - List active store products
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured') === 'true';

    const where: any = { active: true };
    if (featured) {
      where.featured = true;
    }

    const products = await prisma.storeProduct.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        shortDescription: true,
        icon: true,
        heroImage: true,
        basePrice: true,
        featured: true,
        gelatoCatalog: {
          select: {
            catalogUid: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('[Shop Products API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
