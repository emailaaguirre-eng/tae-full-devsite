/**
 * Design Drafts API
 * POST /api/design-drafts — Create a new design draft
 * GET  /api/design-drafts?id=xxx — Get a specific draft
 * GET  /api/design-drafts — List recent drafts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb, designDrafts, eq, desc, saveDatabase } from '@/lib/db';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

function generateDraftId(): string {
  return `draft_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
}

export async function POST(request: NextRequest) {
  try {
    const contentLength = request.headers.get('content-length');
    const requestSize = contentLength ? parseInt(contentLength, 10) : 0;
    if (requestSize > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Request too large. Max 8MB.' },
        { status: 413 }
      );
    }

    const body = await request.json();
    const {
      productId,
      variantId,
      printSpecId,
      dpi,
      cornerStyle,
      cornerRadiusMm,
      designJson,
      previews,
      usedAssetIds,
      premiumFees,
      sessionId,
      userId,
    } = body;

    if (!printSpecId || !designJson) {
      return NextResponse.json(
        { error: 'Missing required fields: printSpecId, designJson' },
        { status: 400 }
      );
    }

    // Parse designJson to extract front/back/other sides
    let designJsonFront: string | null = null;
    let designJsonBack: string | null = null;

    try {
      const designData = typeof designJson === 'string' ? JSON.parse(designJson) : designJson;
      designJsonFront = designData.front ? JSON.stringify(designData.front) : null;
      designJsonBack = designData.back ? JSON.stringify(designData.back) : null;

      // If there are other sides (inside-left, inside-right, etc.), store them in front as the full JSON
      if (!designJsonFront && Object.keys(designData).length > 0) {
        designJsonFront = typeof designJson === 'string' ? designJson : JSON.stringify(designJson);
      }
    } catch {
      // If designJson is not valid JSON, store as-is
      designJsonFront = typeof designJson === 'string' ? designJson : JSON.stringify(designJson);
    }

    // Parse previews (if provided)
    let previewPngFront: string | null = null;
    let previewPngBack: string | null = null;
    if (previews) {
      try {
        const previewData = typeof previews === 'string' ? JSON.parse(previews) : previews;
        previewPngFront = previewData.front || null;
        previewPngBack = previewData.back || null;
      } catch { /* ignore */ }
    }

    const id = generateDraftId();
    const now = new Date().toISOString();

    const db = await getDb();
    await db.insert(designDrafts).values({
      id,
      productId: productId || null,
      variantId: variantId || null,
      printSpecId,
      dpi: dpi || 300,
      cornerStyle: cornerStyle || 'square',
      cornerRadiusMm: cornerRadiusMm || 0,
      designJsonFront,
      designJsonBack,
      previewPngFront,
      previewPngBack,
      usedAssetIds: usedAssetIds || null,
      premiumFees: premiumFees || 0,
      status: 'draft',
      sessionId: sessionId || null,
      userId: userId || null,
      createdAt: now,
      updatedAt: now,
    });

    await saveDatabase();

    return NextResponse.json(
      {
        draftId: id,
        draft: {
          id,
          productId,
          variantId,
          printSpecId,
          status: 'draft',
          createdAt: now,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[DesignDrafts] POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create design draft' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const db = await getDb();

    if (id) {
      // Get specific draft
      const draft = await db
        .select()
        .from(designDrafts)
        .where(eq(designDrafts.id, id))
        .get();

      if (!draft) {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
      }

      return NextResponse.json({ draft });
    }

    // List recent drafts (no design JSON to keep response small)
    const drafts = await db
      .select({
        id: designDrafts.id,
        productId: designDrafts.productId,
        variantId: designDrafts.variantId,
        printSpecId: designDrafts.printSpecId,
        status: designDrafts.status,
        premiumFees: designDrafts.premiumFees,
        createdAt: designDrafts.createdAt,
        updatedAt: designDrafts.updatedAt,
      })
      .from(designDrafts)
      .orderBy(desc(designDrafts.createdAt))
      .limit(50);

    return NextResponse.json({ drafts });
  } catch (error: any) {
    console.error('[DesignDrafts] GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch drafts' },
      { status: 500 }
    );
  }
}
