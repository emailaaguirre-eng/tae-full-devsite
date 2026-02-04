/**
 * Store Category by ID API
 * GET    /api/admin/store-categories/[id]  - Get single category
 * PUT    /api/admin/store-categories/[id]  - Update category
 * DELETE /api/admin/store-categories/[id]  - Delete category
 *
 * @copyright B&D Servicing LLC 2026
 */
import { NextResponse } from 'next/server';
import { getDb, shopCategories, shopProducts, eq } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const category = await db.select().from(shopCategories).where(eq(shopCategories.id, id)).get();
    if (!category) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: category });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to fetch category' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const body = await req.json();

    const updates: Record<string, any> = {};
    const allowedFields = ['name', 'slug', 'icon', 'taeBaseFee', 'requiresQrCode', 'active', 'featured', 'sortOrder'];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }
    updates.updatedAt = Date.now().toString();

    await db.update(shopCategories).set(updates).where(eq(shopCategories.id, id));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();

    // Check if category has products
    const products = await db.select().from(shopProducts).where(eq(shopProducts.categoryId, id)).all();
    if (products.length > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete: category has ${products.length} products. Move or delete them first.` },
        { status: 400 }
      );
    }

    await db.delete(shopCategories).where(eq(shopCategories.id, id));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to delete category' }, { status: 500 });
  }
}
