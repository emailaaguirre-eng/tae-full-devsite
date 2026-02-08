/**
 * Shop Products API
 * GET /api/shop/products - List shop products (by category or all)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb, shopProducts, shopCategories, eq, and, asc } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('category');
    const activeOnly = searchParams.get('active') !== 'false';

    // Build conditions
    const conditions = [];
    if (activeOnly) conditions.push(eq(shopProducts.active, true));

    // If category slug provided, find category first
    if (categorySlug) {
      const category = await db
        .select()
        .from(shopCategories)
        .where(eq(shopCategories.slug, categorySlug))
        .get();

      if (!category) {
        return NextResponse.json(
          { success: false, error: 'Category not found' },
          { status: 404 }
        );
      }
      conditions.push(eq(shopProducts.categoryId, category.id));
    }

    // Query products with category join
    const products = await db
      .select({
        id: shopProducts.id,
        taeId: shopProducts.taeId,
        slug: shopProducts.slug,
        name: shopProducts.name,
        description: shopProducts.description,
        sizeLabel: shopProducts.sizeLabel,
        paperType: shopProducts.paperType,
        finishType: shopProducts.finishType,
        orientation: shopProducts.orientation,
        heroImage: shopProducts.heroImage,
        printfulBasePrice: shopProducts.printfulBasePrice,
        taeAddOnFee: shopProducts.taeAddOnFee,
        categoryTaeId: shopCategories.taeId,
        categorySlug: shopCategories.slug,
        categoryName: shopCategories.name,
        categoryFee: shopCategories.taeBaseFee,
      })
      .from(shopProducts)
      .innerJoin(shopCategories, eq(shopProducts.categoryId, shopCategories.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(shopProducts.sortOrder), asc(shopProducts.name))
      .all();

    // Calculate final prices
    const productsWithPricing = products.map(product => {
      const basePrice = product.printfulBasePrice || 0;
      const categoryFee = product.categoryFee || 0;
      const productFee = product.taeAddOnFee || 0;
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
        category: {
          taeId: product.categoryTaeId,
          slug: product.categorySlug,
          name: product.categoryName,
          taeBaseFee: product.categoryFee,
        },
        pricing: {
          basePrice,
          categoryFee,
          productFee,
          finalPrice,
        },
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
