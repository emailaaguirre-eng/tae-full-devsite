/**
 * Individual Design Draft API
 * Copyright (c) 2026 B&D Servicing LLC. All rights reserved.
 *
 * NOTE: Design drafts functionality is temporarily disabled.
 * The designDrafts table is not currently in the database schema.
 * This route will return a "feature not available" response.
 */

import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ draftId: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { draftId } = await params;

  // Design drafts feature not available - table not in schema
  return NextResponse.json(
    {
      error: 'Design drafts feature is not currently available',
      requestedId: draftId
    },
    { status: 501 }
  );

  /* Original Prisma implementation - commented out as designDrafts table not in schema
  try {
    const { draftId } = await params;
    // Would use Drizzle here if table existed:
    // const draft = db.select().from(designDrafts).where(eq(designDrafts.id, draftId)).get();

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
  */
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  const { draftId } = await params;

  // Design drafts feature not available - table not in schema
  return NextResponse.json(
    {
      error: 'Design drafts feature is not currently available',
      requestedId: draftId
    },
    { status: 501 }
  );

  /* Original Prisma implementation - commented out as designDrafts table not in schema
  try {
    const { draftId } = await params;
    const body = await request.json();

    // Would use Drizzle here if table existed:
    // const updated = db.update(designDrafts).set({...body, updatedAt: new Date().toISOString()}).where(eq(designDrafts.id, draftId)).returning().get();

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
  */
}
