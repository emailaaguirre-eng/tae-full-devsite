/**
 * Store Product by ID API
 *
 * @copyright B&D Servicing LLC 2026
 */
import { NextResponse } from 'next/server';
import { getDb, shopProducts, eq } from '@/lib/db';
import { saveDatabase } from '@/db';
import { mergeProductMeta, parseProductMeta, parseWatermarkSettings } from '@/lib/product-watermark';
import { parsePricingSettings } from '@/lib/product-pricing';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const product = await db.select().from(shopProducts).where(eq(shopProducts.id, id)).get();
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      data: {
        ...product,
        watermark: parseWatermarkSettings(product.printfulDataJson),
        pricing: parsePricingSettings(product.printfulDataJson),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const body = await req.json();
    const existing = await db.select().from(shopProducts).where(eq(shopProducts.id, id)).get();
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const updates: Record<string, any> = {};
    const allowedFields = [
      'name', 'slug', 'description', 'heroImage', 'galleryImages', 'sizeLabel',
      'paperType', 'finishType', 'orientation', 'active', 'sortOrder',
      'printProvider', 'printfulProductId', 'printfulVariantId',
      'printfulBasePrice', 'taeAddOnFee', 'printDpi', 'categoryId',
      'printWidth', 'printHeight', 'requiredPlacements', 'qrDefaultPosition',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (body.proofTerms !== undefined) {
      updates.printfulDataJson = mergeProductMeta(
        existing.printfulDataJson,
        { proofTerms: typeof body.proofTerms === 'string' ? body.proofTerms : '' }
      );
    }

    if (body.watermark !== undefined) {
      const baseMeta = parseProductMeta(updates.printfulDataJson ?? existing.printfulDataJson);
      updates.printfulDataJson = mergeProductMeta(JSON.stringify(baseMeta), {
        watermark: body.watermark,
      });
    }

    if (body.pricing !== undefined) {
      const baseMeta = parseProductMeta(updates.printfulDataJson ?? existing.printfulDataJson);
      updates.printfulDataJson = mergeProductMeta(JSON.stringify(baseMeta), {
        pricing: body.pricing,
      });
    }

    updates.updatedAt = Date.now().toString();

    await db.update(shopProducts).set(updates).where(eq(shopProducts.id, id));
    await saveDatabase();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
