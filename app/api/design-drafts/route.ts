import { NextRequest, NextResponse } from 'next/server';
import { createDesignDraft } from '@/lib/prisma/designDrafts';

// Increase body size limit (default is ~4.5MB for Next.js)
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      productId,
      variantId,
      productSlug,
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

    // Validate required fields
    if (!printSpecId || !designJson) {
      return NextResponse.json(
        { error: 'Missing required fields: printSpecId, designJson' },
        { status: 400 }
      );
    }

    // Parse designJson to extract front/back
    const designData = JSON.parse(designJson);
    const designJsonFront = designData.front ? JSON.stringify(designData.front) : null;
    const designJsonBack = designData.back ? JSON.stringify(designData.back) : null;
    
    // Parse previews
    const previewData = previews ? JSON.parse(previews) : {};
    const previewPngFront = previewData.front || null;
    const previewPngBack = previewData.back || null;
    
    // Parse usedAssetIds
    const usedAssetIdsArray = usedAssetIds ? JSON.parse(usedAssetIds) : [];
    const usedAssetIdsStr = usedAssetIdsArray.length > 0 ? JSON.stringify(usedAssetIdsArray) : null;
    
    // Create draft
    const draft = await createDesignDraft({
      productId,
      variantId,
      printSpecId,
      dpi: dpi || 300,
      cornerStyle: cornerStyle || 'square',
      cornerRadiusMm: cornerRadiusMm || 0,
      designJsonFront,
      designJsonBack,
      previewPngFront,
      previewPngBack,
      usedAssetIds: usedAssetIdsStr,
      premiumFees: premiumFees || 0,
      sessionId,
      userId,
    });

    return NextResponse.json(
      {
        draftId: draft.id,
        draft: {
          id: draft.id,
          productId: draft.productId,
          variantId: draft.variantId,
          printSpecId: draft.printSpecId,
          status: draft.status,
          createdAt: draft.createdAt,
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
