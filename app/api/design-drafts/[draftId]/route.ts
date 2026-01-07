import { NextRequest, NextResponse } from 'next/server';
import { getDesignDraft, updateDesignDraft } from '@/lib/prisma/designDrafts';

export async function GET(
  request: NextRequest,
  { params }: { params: { draftId: string } }
) {
  try {
    const { draftId } = params;
    const draft = await getDesignDraft(draftId);

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Return in API format
    return NextResponse.json({
      id: draft.id,
      productId: draft.productId,
      variantId: draft.variantId,
      printSpecId: draft.printSpecId,
      dpi: draft.dpi,
      cornerStyle: draft.cornerStyle,
      cornerRadiusMm: draft.cornerRadiusMm,
      designJsonBySide: {
        front: draft.designJsonFront,
        back: draft.designJsonBack,
      },
      previewPngBySide: {
        front: draft.previewPngFront,
        back: draft.previewPngBack,
      },
      artKeyData: draft.artKeyData ? JSON.parse(draft.artKeyData) : null,
      status: draft.status,
      sessionId: draft.sessionId,
      userId: draft.userId,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
    });
  } catch (error: any) {
    console.error('[DesignDrafts] GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load design draft' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { draftId: string } }
) {
  try {
    const { draftId } = params;
    const body = await request.json();

    const updated = await updateDesignDraft(draftId, body);

    return NextResponse.json({
      draftId: updated.id,
      draft: {
        id: updated.id,
        status: updated.status,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('[DesignDrafts] PUT error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update design draft' },
      { status: 500 }
    );
  }
}
