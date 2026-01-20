/**
 * Design Drafts API
 * Copyright (c) 2026 B&D Servicing LLC. All rights reserved.
 *
 * NOTE: Design drafts functionality is temporarily disabled.
 * The designDrafts table is not currently in the database schema.
 * This route will return a "feature not available" response.
 */

import { NextRequest, NextResponse } from 'next/server';

// Increase body size limit and duration for large payloads
// Note: Next.js 14 body size is typically limited by the server/proxy
// This route handles large design JSON payloads
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Design drafts feature not available - table not in schema
  return NextResponse.json(
    {
      error: 'Design drafts feature is not currently available'
    },
    { status: 501 }
  );

  /* Original Prisma implementation - commented out as designDrafts table not in schema
  try {
    // Log request size for debugging
    const contentLength = request.headers.get('content-length');
    const requestSize = contentLength ? parseInt(contentLength, 10) : 0;
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

    // Create draft - would use Drizzle here if table existed:
    // const draft = await db.insert(designDrafts).values({...}).returning().get();

    return NextResponse.json(
      {
        draftId: 'unavailable',
        draft: {
          id: 'unavailable',
          productId,
          variantId,
          printSpecId,
          status: 'draft',
          createdAt: new Date().toISOString(),
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
  */
}
