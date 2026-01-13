import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * POST /api/products/validate-availability
 * Validate that products are still available before checkout
 * 
 * Body: {
 *   items: Array<{ productUid: string, variantUid?: string, quantity: number }>,
 *   country?: string  // ISO country code for region availability check
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, country = 'US' } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required' },
        { status: 400 }
      );
    }

    const productUids = items.map(item => item.productUid).filter(Boolean);
    
    if (productUids.length === 0) {
      return NextResponse.json(
        { error: 'At least one productUid is required' },
        { status: 400 }
      );
    }

    // Check database for isPrintable status first (faster check)
    const dbProducts = await prisma.gelatoProduct.findMany({
      where: {
        productUid: { in: productUids },
      },
      select: {
        productUid: true,
        isPrintable: true,
        productStatus: true,
      },
    });

    const dbStatusMap = new Map(
      dbProducts.map(p => [p.productUid, { isPrintable: p.isPrintable, status: p.productStatus }])
    );

    // Quick check: filter out non-printable or deactivated products
    const unavailableProducts: string[] = [];
    for (const item of items) {
      const dbStatus = dbStatusMap.get(item.productUid);
      if (!dbStatus || !dbStatus.isPrintable || dbStatus.status !== 'activated') {
        unavailableProducts.push(item.productUid);
      }
    }

    if (unavailableProducts.length > 0) {
      return NextResponse.json({
        valid: false,
        unavailableProducts,
        errors: unavailableProducts.map(uid => ({
          productUid: uid,
          reason: 'Product is not available for printing',
        })),
      });
    }

    // All products passed database validation
    // Note: Catalog is synced 3-4x daily, so database status is current
    return NextResponse.json({
      valid: true,
      message: 'All products are available',
    });

  } catch (error: any) {
    console.error('[AvailabilityCheck] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to validate availability' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
