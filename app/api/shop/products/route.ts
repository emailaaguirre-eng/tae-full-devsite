/**
 * Shop Products API
 * 
 * GET /api/shop/products - List general products (excludes gallery/artist/cocreator/collaboration products)
 * 
 * Shop page should only show general products like Cards, Invitations, Announcements, etc.
 * Gallery images are Assets (Lane B), not StoreProducts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * GET - List general products only (excludes gallery/artist/cocreator/collaboration products)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false'; // Default true

    const where: any = {
      // Exclude gallery products: category is null or doesn't start with 'gallery'
      // AND artistName is null (general products only)
      AND: [
        {
          OR: [
            { category: null },
            { category: { not: { startsWith: 'gallery' } } },
          ],
        },
        { artistName: null },
      ],
    };

    if (activeOnly) {
      where.AND.push({ active: true });
    }

    const products = await prisma.storeProduct.findMany({
      where,
      orderBy: [
        { featured: 'desc' },
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
      include: {
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
      data: products.map(p => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        description: p.description,
        shortDescription: p.shortDescription,
        icon: p.icon,
        heroImage: p.heroImage,
        basePrice: p.basePrice,
        featured: p.featured,
        gelatoCatalog: p.gelatoCatalog,
      })),
    });
  } catch (error) {
    console.error('[Shop Products API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch shop products' },
      { status: 500 }
    );
  }
}
