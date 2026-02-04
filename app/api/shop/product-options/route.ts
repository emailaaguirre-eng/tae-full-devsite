/**
 * Product Options API
 * GET /api/shop/product-options?category=wall-art
 *
 * Returns available product options (sizes, materials, frames, prices)
 * from LOCAL CACHE - fast and accurate.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categorySlug = searchParams.get('category');

    if (!categorySlug) {
      return NextResponse.json({
        success: false,
        error: 'category parameter is required',
      });
    }

    // Get category info
    const category = await prisma.shopCategory.findUnique({
      where: { slug: categorySlug },
    });

    if (!category) {
      return NextResponse.json({
        success: false,
        error: `Category not found: ${categorySlug}`,
      });
    }

    // Get cached products for this category using raw SQL
    // (Prisma client may not have GelatoProductCache model regenerated yet)
    const cachedProducts: any[] = await prisma.$queryRaw`
      SELECT * FROM GelatoProductCache
      WHERE categorySlug = ${categorySlug} AND available = 1
      ORDER BY size ASC, frameColor ASC
    `;

    // If no cached products, return empty with fallback flag
    if (cachedProducts.length === 0) {
      return NextResponse.json({
        success: true,
        source: 'fallback',
        category: {
          slug: category.slug,
          name: category.name,
          taeBaseFee: category.taeBaseFee,
        },
        products: [],
        sizes: getFallbackSizes(categorySlug),
        message: 'No cached products available. Run sync script.',
      });
    }

    // Group products by size for easier frontend consumption
    const sizeMap = new Map<string, any>();
    const frameColors = new Set<string>();
    const paperTypes = new Set<string>();

    for (const product of cachedProducts) {
      // Collect unique frame colors and paper types
      if (product.frameColor) frameColors.add(product.frameColor);
      if (product.paperType) paperTypes.add(product.paperType);

      // Group by size
      if (!sizeMap.has(product.size)) {
        sizeMap.set(product.size, {
          size: product.size,
          sizeLabel: product.sizeLabel,
          widthInches: product.widthInches,
          heightInches: product.heightInches,
          basePrice: product.gelatoPrice,
          variants: [],
        });
      }

      // Add variant
      sizeMap.get(product.size).variants.push({
        gelatoProductUid: product.gelatoProductUid,
        paperType: product.paperType,
        frameColor: product.frameColor,
        price: product.gelatoPrice,
      });

      // Update base price to lowest
      const sizeEntry = sizeMap.get(product.size);
      if (product.gelatoPrice < sizeEntry.basePrice) {
        sizeEntry.basePrice = product.gelatoPrice;
      }
    }

    // Convert to array and sort by size
    const sizes = Array.from(sizeMap.values()).sort((a, b) => {
      const aNum = parseInt(a.size);
      const bNum = parseInt(b.size);
      return aNum - bNum;
    });

    // Calculate total price (Gelato base + tAE fee + artist royalty placeholder)
    const sizesWithPricing = sizes.map(size => ({
      ...size,
      taeBaseFee: category.taeBaseFee,
      totalPrice: size.basePrice + category.taeBaseFee, // Artist royalty added by frontend
    }));

    return NextResponse.json({
      success: true,
      source: 'cache',
      lastSynced: cachedProducts[0]?.lastSyncedAt || null,
      category: {
        slug: category.slug,
        name: category.name,
        taeBaseFee: category.taeBaseFee,
        gelatoCatalog: category.gelatoCatalogUid,
      },
      sizes: sizesWithPricing,
      frameColors: Array.from(frameColors),
      paperTypes: Array.from(paperTypes),
      productCount: cachedProducts.length,
    });

  } catch (error: any) {
    console.error('[Product Options API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}

/**
 * Fallback sizes when cache is empty
 */
function getFallbackSizes(categorySlug: string) {
  const fallbacks: Record<string, any[]> = {
    'wall-art': [
      { size: '8x10-inch', sizeLabel: '8" x 10"', basePrice: 15, totalPrice: 20 },
      { size: '11x14-inch', sizeLabel: '11" x 14"', basePrice: 22, totalPrice: 27 },
      { size: '16x20-inch', sizeLabel: '16" x 20"', basePrice: 35, totalPrice: 40 },
      { size: '24x36-inch', sizeLabel: '24" x 36"', basePrice: 55, totalPrice: 60 },
    ],
    'canvas-prints': [
      { size: '12x12-inch', sizeLabel: '12" x 12"', basePrice: 45, totalPrice: 55 },
      { size: '16x20-inch', sizeLabel: '16" x 20"', basePrice: 65, totalPrice: 75 },
      { size: '24x36-inch', sizeLabel: '24" x 36"', basePrice: 95, totalPrice: 105 },
    ],
    'framed-prints': [
      { size: '8x10-inch', sizeLabel: '8" x 10"', basePrice: 45, totalPrice: 60 },
      { size: '11x14-inch', sizeLabel: '11" x 14"', basePrice: 65, totalPrice: 80 },
      { size: '16x20-inch', sizeLabel: '16" x 20"', basePrice: 95, totalPrice: 110 },
    ],
  };

  return fallbacks[categorySlug] || [];
}
