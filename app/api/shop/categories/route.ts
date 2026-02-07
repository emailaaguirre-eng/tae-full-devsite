/**
 * Shop Categories API
 * GET /api/shop/categories - List all shop categories
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb, shopCategories, shopProducts, eq, and, asc, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false';

    // Build conditions
    const conditions = [];
    if (activeOnly) conditions.push(eq(shopCategories.active, true));

    // Query categories
    const categories = await db
      .select()
      .from(shopCategories)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(shopCategories.sortOrder), asc(shopCategories.name))
      .all();

    // Get product counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(shopProducts)
          .where(eq(shopProducts.categoryId, category.id))
          .get();

        return {
          id: category.id,
          taeId: category.taeId,
          slug: category.slug,
          name: category.name,
          description: category.description,
          icon: category.icon,
          taeBaseFee: category.taeBaseFee,
          active: category.active,
          productCount: countResult?.count || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: categoriesWithCounts,
    });
  } catch (error) {
    console.error('[Shop Categories API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
