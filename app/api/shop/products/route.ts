/**
 * Shop Products API
 * GET /api/shop/products - List shop products (by category or all)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('category');
    const activeOnly = searchParams.get('active') !== 'false';

    // Build query
    const where: any = {};
    if (activeOnly) where.active = true;

    if (categorySlug) {
      const category = await prisma.shopCategory.findUnique({
        where: { slug: categorySlug },
      });
      if (!category) {
        return NextResponse.json(
          { success: false, error: 'Category not found' },
          { status: 404 }
        );
      }
      where.categoryId = category.id;
    }

    const products = await prisma.shopProduct.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        category: {
          select: {
            taeId: true,
            slug: true,
            name: true,
            taeBaseFee: true,
            requiresQrCode: true,
          },
        },
      },
    });

    // Calculate final prices
    const productsWithPricing = products.map(product => {
      const basePrice = product.gelatoBasePrice;
      const categoryFee = product.category.taeBaseFee;
      const productFee = product.taeAddOnFee;
      const finalPrice = basePrice + categoryFee + productFee;

      return {
        id: product.id,
        taeId: product.taeId,
        slug: product.slug,
        name: product.name,
        description: product.description,
        sizeLabel: product.sizeLabel,
        paperType: product.paperType,
        finishType: product.finishType,
        orientation: product.orientation,
        heroImage: product.heroImage,
        category: product.category,
        pricing: {
          basePrice,
          categoryFee,
          productFee,
          finalPrice,
        },
        requiresQrCode: product.category.requiresQrCode,
      };
    });

    return NextResponse.json({
      success: true,
      data: productsWithPricing,
    });
  } catch (error) {
    console.error('[Shop Products API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
