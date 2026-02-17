/**
 * Store Products API
 * GET  /api/admin/store-products       - List all products
 * POST /api/admin/store-products       - Create a new product
 *
 * @copyright B&D Servicing LLC 2026
 */
import { NextResponse } from 'next/server';
import { getDb, shopProducts, shopCategories, desc, eq, generateId } from '@/lib/db';
import { saveDatabase } from '@/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get('category');

    // Get all categories for lookup
    const cats = await db.select().from(shopCategories).all();
    const catMap = new Map(cats.map(c => [c.id, c]));

    // Get products
    let products;
    if (categorySlug) {
      const cat = cats.find(c => c.slug === categorySlug);
      if (!cat) {
        return NextResponse.json({ success: true, data: [], categories: cats.map(c => ({ slug: c.slug, name: c.name, id: c.id })) });
      }
      products = await db
        .select()
        .from(shopProducts)
        .where(eq(shopProducts.categoryId, cat.id))
        .orderBy(desc(shopProducts.active), desc(shopProducts.sortOrder))
        .all();
    } else {
      products = await db
        .select()
        .from(shopProducts)
        .orderBy(desc(shopProducts.active), desc(shopProducts.sortOrder))
        .all();
    }

    const mapped = products.map((p) => {
      const cat = catMap.get(p.categoryId || '');
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        description: p.description,
        productType: p.printProvider === 'printful' ? 'printful_print' : 'custom_artwork',
        heroImage: p.heroImage,
        basePrice: (p.printfulBasePrice || 0) + (p.taeAddOnFee || 0),
        printfulBasePrice: p.printfulBasePrice || 0,
        taeAddOnFee: p.taeAddOnFee || 0,
        active: p.active ?? false,
        sortOrder: p.sortOrder ?? 0,
        createdAt: p.createdAt || '',
        updatedAt: p.updatedAt || '',
        printProvider: p.printProvider || 'printful',
        printfulProductId: p.printfulProductId,
        printfulVariantId: p.printfulVariantId,
        sizeLabel: p.sizeLabel,
        paperType: p.paperType,
        finishType: p.finishType,
        taeId: p.taeId,
        categoryId: p.categoryId,
        categoryName: cat?.name || 'Uncategorized',
        categorySlug: cat?.slug || '',
      };
    });

    return NextResponse.json({
      success: true,
      data: mapped,
      categories: cats.map(c => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        icon: c.icon,
        taeBaseFee: c.taeBaseFee,
        productCount: products.filter(p => p.categoryId === c.id).length,
      })),
    });
  } catch (err: any) {
    console.error('Failed to fetch products:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const db = await getDb();
    const body = await req.json();

    const id = generateId();
    const now = Date.now().toString();
    const slug = body.slug || body.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || id;
    const taeId = body.taeId || `TAE-${slug.toUpperCase().slice(0, 20)}`;

    let categoryId = body.categoryId;
    if (!categoryId) {
      const cats = await db.select().from(shopCategories).limit(1).all();
      categoryId = cats.length > 0 ? cats[0].id : null;
    }

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: 'No categories found. Run seed-all.js first.' },
        { status: 400 }
      );
    }

    await db.insert(shopProducts).values({
      id,
      taeId,
      categoryId,
      slug,
      name: body.name || 'New Product',
      description: body.description || null,
      printProvider: body.productType === 'printful_print' ? 'printful' : (body.printProvider || 'printful'),
      printfulProductId: body.printfulProductId || null,
      printfulVariantId: body.printfulVariantId || null,
      printfulBasePrice: body.printfulBasePrice || 0,
      taeAddOnFee: body.basePrice || body.taeAddOnFee || 0,
      sizeLabel: body.sizeLabel || null,
      paperType: body.paperType || null,
      finishType: body.finishType || null,
      heroImage: body.heroImage || null,
      printDpi: body.defaultDpi || 300,
      active: body.active !== false,
      sortOrder: body.sortOrder || 0,
      createdAt: now,
      updatedAt: now,
    });

    await saveDatabase();
    return NextResponse.json({ success: true, data: { id, slug } });
  } catch (err: any) {
    console.error('Failed to create product:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}
