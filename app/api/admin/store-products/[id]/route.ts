/**
 * Store Product by ID API
 * GET    /api/admin/store-products/[id]  - Get single product
 * PUT    /api/admin/store-products/[id]  - Update product
 * DELETE /api/admin/store-products/[id]  - Delete product
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDatabase, shopProducts, eq } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { id } = await params;
    const db = await getDb();
    const product = await db.select().from(shopProducts).where(eq(shopProducts.id, id)).get();
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: product });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { id } = await params;
    const db = await getDb();
    const body = await req.json();

    const updates: Record<string, any> = {};
    const allowedFields = [
      'name', 'slug', 'description', 'heroImage', 'sizeLabel',
      'paperType', 'finishType', 'orientation', 'active', 'sortOrder',
      'printProvider', 'printfulProductId', 'printfulVariantId',
      'printfulBasePrice', 'taeAddOnFee', 'printDpi', 'printWidth',
      'printHeight', 'categoryId',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }
    updates.updatedAt = Date.now().toString();

    await db.update(shopProducts).set(updates).where(eq(shopProducts.id, id));
    await saveDatabase();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { id } = await params;
    const db = await getDb();
    await db.delete(shopProducts).where(eq(shopProducts.id, id));
    await saveDatabase();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to delete product' }, { status: 500 });
  }
}
