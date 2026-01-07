import { NextRequest, NextResponse } from 'next/server';
import { createDesignDraft } from '@/lib/prisma/designDrafts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      productId,
      variantId,
      printSpecId,
      dpi,
      cornerStyle,
      cornerRadiusMm,
      designJsonBySide,
      previewPngBySide,
      sessionId,
      userId,
    } = body;

    // Validate required fields
    if (!printSpecId || !designJsonBySide) {
      return NextResponse.json(
        { error: 'Missing required fields: printSpecId, designJsonBySide' },
        { status: 400 }
      );
    }

    // Create draft
    const draft = await createDesignDraft({
      productId,
      variantId,
      printSpecId,
      dpi,
      cornerStyle,
      cornerRadiusMm,
      designJsonBySide,
      previewPngBySide: previewPngBySide || { front: null, back: null },
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
