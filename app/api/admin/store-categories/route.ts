/**
 * Store Categories API
 * GET  /api/admin/store-categories       - List all categories with product counts
 * POST /api/admin/store-categories       - Create a new category
 *
 * @copyright B&D Servicing LLC 2026
 */
import { NextResponse } from 'next/server';
import { getDb, shopCategories, shopProducts, eq, desc, generateId } from '@/lib/db';
import { saveDatabase } from '@/db';
import { ensureStoreCategoryHierarchy } from '@/lib/store-category-tree';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureStoreCategoryHierarchy();
    const db = await getDb();
    const cats = await db
      .select()
      .from(shopCategories)
      .orderBy(desc(shopCategories.sortOrder))
      .all();

    // Get product counts per category
    const products = await db.select().from(shopProducts).all();

    const byId = new Map(cats.map((c) => [c.id, c]));
    const buildPathLabel = (categoryId: string): string => {
      const names: string[] = [];
      const visited = new Set<string>();
      let current = byId.get(categoryId);
      while (current && !visited.has(current.id)) {
        visited.add(current.id);
        names.unshift(current.name);
        current = current.parentId ? byId.get(current.parentId) : undefined;
      }
      return names.join(" > ");
    };

    const mapped = cats.map((c) => {
      const catProducts = products.filter(p => p.categoryId === c.id);
      const activeCount = catProducts.filter(p => p.active).length;
      return {
        id: c.id,
        taeId: c.taeId,
        slug: c.slug,
        name: c.name,
        parentId: c.parentId || null,
        categoryType: c.categoryType || "leaf",
        pathLabel: buildPathLabel(c.id),
        icon: c.icon,
        taeBaseFee: c.taeBaseFee || 0,
        requiresQrCode: c.requiresQrCode ?? false,
        active: c.active ?? true,
        featured: c.featured ?? false,
        sortOrder: c.sortOrder ?? 0,
        createdAt: c.createdAt || '',
        updatedAt: c.updatedAt || '',
        productCount: catProducts.length,
        activeProductCount: activeCount,
      };
    });

    return NextResponse.json({ success: true, data: mapped });
  } catch (err: any) {
    console.error('Failed to fetch categories:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await ensureStoreCategoryHierarchy();
    const db = await getDb();
    const body = await req.json();

    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }

    const id = generateId();
    const now = Date.now().toString();
    const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const taeId = body.taeId || `TAE-CAT-${slug.toUpperCase()}`;

    // Check for duplicate slug
    const existing = await db
      .select()
      .from(shopCategories)
      .where(eq(shopCategories.slug, slug))
      .get();

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Category with slug "${slug}" already exists` },
        { status: 400 }
      );
    }

    await db.insert(shopCategories).values({
      id,
      taeId,
      slug,
      name: body.name,
      parentId: body.parentId || null,
      categoryType: body.categoryType || 'leaf',
      icon: typeof body.icon === 'string' && body.icon.trim() ? body.icon.trim() : null,
      taeBaseFee: body.taeBaseFee || 0,
      requiresQrCode: body.requiresQrCode ? 1 : 0,
      active: body.active !== false ? 1 : 0,
      featured: body.featured ? 1 : 0,
      sortOrder: body.sortOrder || 0,
      createdAt: now,
      updatedAt: now,
    });

    await saveDatabase();
    return NextResponse.json({ success: true, data: { id, slug, name: body.name } });
  } catch (err: any) {
    console.error('Failed to create category:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to create category' },
      { status: 500 }
    );
  }
}
