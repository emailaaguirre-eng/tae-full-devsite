/**
 * Shop Categories API
 * GET /api/shop/categories - List all shop categories
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false';
    const featured = searchParams.get('featured') === 'true';

    const where: any = {};
    if (activeOnly) where.active = true;
    if (featured) where.featured = true;

    const categories = await prisma.shopCategory.findMany({
      where,
      orderBy: [
        { featured: 'desc' },
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
      select: {
        id: true,
        taeId: true,
        slug: true,
        name: true,
        description: true,
        icon: true,
        heroImage: true,
        taeBaseFee: true,
        requiresQrCode: true,
        featured: true,
        active: true,
        _count: {
          select: { products: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: categories.map(cat => ({
        ...cat,
        productCount: cat._count.products,
        _count: undefined,
      })),
    });
  } catch (error) {
    console.error('[Shop Categories API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
