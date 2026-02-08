/**
 * Product Options API
 * GET /api/shop/product-options?category=wall-art
 *
 * Returns available product options (sizes, materials, prices)
 * from local ShopProduct table (Printful-backed).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb, shopCategories, shopProducts, eq, and, asc } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const searchParams = request.nextUrl.searchParams;
    const categorySlug = searchParams.get('category');

    if (!categorySlug) {
      return NextResponse.json({
        success: false,
        error: 'category parameter is required',
      });
    }

    // Get category info
    const category = await db
      .select()
      .from(shopCategories)
      .where(eq(shopCategories.slug, categorySlug))
      .get();

    if (!category) {
      return NextResponse.json({
        success: false,
        error: `Category not found: ${categorySlug}`,
      });
    }

    // Get active products for this category
    const products = await db
      .select()
      .from(shopProducts)
      .where(
        and(
          eq(shopProducts.categoryId, category.id),
          eq(shopProducts.active, true)
        )
      )
      .orderBy(asc(shopProducts.sortOrder), asc(shopProducts.name))
      .all();

    if (products.length === 0) {
      return NextResponse.json({
        success: true,
        source: 'empty',
        category: {
          slug: category.slug,
          name: category.name,
          taeBaseFee: category.taeBaseFee,
        },
        products: [],
        sizes: getFallbackSizes(categorySlug),
        message: 'No products configured. Add products in the admin panel.',
      });
    }

    // Group products by size for easier frontend consumption
    const sizeMap = new Map<string, any>();
    const paperTypes = new Set<string>();
    const finishTypes = new Set<string>();

    for (const product of products) {
      if (product.paperType) paperTypes.add(product.paperType);
      if (product.finishType) finishTypes.add(product.finishType);

      const sizeKey = product.sizeLabel || product.name;

      if (!sizeMap.has(sizeKey)) {
        // Compute dimensions from print specs if available
        let widthInches: number | null = null;
        let heightInches: number | null = null;
        if (product.printWidth && product.printHeight && product.printDpi) {
          widthInches = product.printWidth / product.printDpi;
          heightInches = product.printHeight / product.printDpi;
        }

        sizeMap.set(sizeKey, {
          size: sizeKey,
          sizeLabel: product.sizeLabel || product.name,
          widthInches,
          heightInches,
          basePrice: product.printfulBasePrice || 0,
          variants: [],
        });
      }

      // Add variant
      sizeMap.get(sizeKey).variants.push({
        productId: product.id,
        printfulVariantId: product.printfulVariantId,
        printfulProductId: product.printfulProductId,
        paperType: product.paperType,
        finishType: product.finishType,
        price: product.printfulBasePrice || 0,
        printWidth: product.printWidth,
        printHeight: product.printHeight,
        printDpi: product.printDpi,
      });

      // Track lowest price for this size
      const sizeEntry = sizeMap.get(sizeKey);
      if ((product.printfulBasePrice || 0) < sizeEntry.basePrice) {
        sizeEntry.basePrice = product.printfulBasePrice || 0;
      }
    }

    // Convert to array and sort by price
    const sizes = Array.from(sizeMap.values()).sort((a, b) => a.basePrice - b.basePrice);

    // Calculate total price (Printful base + TAE fee + artist royalty placeholder)
    const sizesWithPricing = sizes.map(size => ({
      ...size,
      taeBaseFee: category.taeBaseFee,
      totalPrice: size.basePrice + (category.taeBaseFee || 0),
    }));

    return NextResponse.json({
      success: true,
      source: 'database',
      category: {
        slug: category.slug,
        name: category.name,
        taeBaseFee: category.taeBaseFee,
        printfulProductId: category.printfulProductId,
      },
      sizes: sizesWithPricing,
      paperTypes: Array.from(paperTypes),
      finishTypes: Array.from(finishTypes),
      productCount: products.length,
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
 * Fallback sizes when no products are configured
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
