import { NextRequest, NextResponse } from 'next/server';
import { createDesignDraft } from '@/lib/prisma/designDrafts';

// Increase body size limit and duration for large payloads
// Note: Next.js 14 body size is typically limited by the server/proxy
// This route handles large design JSON payloads
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

// Log request size for debugging
function getRequestSize(request: NextRequest): number {
  // Approximate size - actual body is streamed
  const contentLength = request.headers.get('content-length');
  return contentLength ? parseInt(contentLength, 10) : 0;
}

export async function POST(request: NextRequest) {
  try {
    // Log request size for debugging
    const requestSize = getRequestSize(request);
    if (requestSize > 0) {
      const sizeKB = (requestSize / 1024).toFixed(2);
      console.log(`[DesignDrafts] Request size: ${sizeKB} KB`);
      
      if (requestSize > 4 * 1024 * 1024) { // 4MB
        console.warn(`[DesignDrafts] Large request detected: ${sizeKB} KB`);
      }
    }
    
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
