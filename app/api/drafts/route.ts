/**
 * Design Drafts API
 * Copyright (c) 2026 B&D Servicing LLC. All rights reserved.
 *
 * NOTE: Design drafts functionality is temporarily disabled.
 * The designDrafts table is not currently in the database schema.
 * This route will return a "feature not available" response.
 */

import { NextRequest, NextResponse } from 'next/server';

// GET /api/drafts - List drafts (optionally filter by sessionId or userId)
export async function GET(request: NextRequest) {
  // Design drafts feature not available - table not in schema
  return NextResponse.json(
    {
      success: false,
      error: 'Design drafts feature is not currently available',
      data: []
    },
    { status: 501 }
  );

  /* Original Prisma implementation - commented out as designDrafts table not in schema
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');
    const draftId = searchParams.get('id');

    // Fetch single draft by ID
    if (draftId) {
      const draft = await prisma.designDraft.findUnique({
        where: { id: draftId },
      });

      if (!draft) {
        return NextResponse.json(
          { success: false, error: 'Draft not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          ...draft,
          designJsonFront: draft.designJsonFront ? JSON.parse(draft.designJsonFront) : null,
          designJsonBack: draft.designJsonBack ? JSON.parse(draft.designJsonBack) : null,
          artKeyData: draft.artKeyData ? JSON.parse(draft.artKeyData) : null,
        },
      });
    }

    // Build filter
    const where: any = {};
    if (sessionId) where.sessionId = sessionId;
    if (userId) where.userId = userId;

    const drafts = await prisma.designDraft.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      data: drafts.map((draft) => ({
        ...draft,
        // Don't parse full JSON for list view - just include metadata
        designJsonFront: draft.designJsonFront ? 'has_data' : null,
        designJsonBack: draft.designJsonBack ? 'has_data' : null,
      })),
    });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch drafts' },
      { status: 500 }
    );
  }
  */
}

// POST /api/drafts - Create or update a draft
export async function POST(request: NextRequest) {
  // Design drafts feature not available - table not in schema
  return NextResponse.json(
    {
      success: false,
      error: 'Design drafts feature is not currently available'
    },
    { status: 501 }
  );

  /* Original Prisma implementation - commented out as designDrafts table not in schema
  try {
    const body = await request.json();
    const {
      id, // If provided, update existing draft
      productId,
      variantId,
      printSpecId,
      gelatoProductUid,
      dpi = 300,
      designObjects, // Array of design objects for all sides
      previewPngFront,
      previewPngBack,
      artKeyData,
      sessionId,
      userId,
      status = 'draft',
    } = body;

    // Validate required fields
    if (!printSpecId && !gelatoProductUid) {
      return NextResponse.json(
        { success: false, error: 'printSpecId or gelatoProductUid is required' },
        { status: 400 }
      );
    }

    // Separate objects by side
    const frontObjects = designObjects?.filter((obj: any) => obj.side === 'front') || [];
    const backObjects = designObjects?.filter((obj: any) => obj.side === 'back' || obj.side === 'inside') || [];

    const draftData = {
      productId: productId || null,
      variantId: variantId || null,
      printSpecId: printSpecId || gelatoProductUid,
      dpi,
      designJsonFront: frontObjects.length > 0 ? JSON.stringify(frontObjects) : null,
      designJsonBack: backObjects.length > 0 ? JSON.stringify(backObjects) : null,
      previewPngFront: previewPngFront || null,
      previewPngBack: previewPngBack || null,
      artKeyData: artKeyData ? JSON.stringify(artKeyData) : null,
      sessionId: sessionId || null,
      userId: userId || null,
      status,
    };

    let draft;

    if (id) {
      // Update existing draft
      draft = await prisma.designDraft.update({
        where: { id },
        data: draftData,
      });
    } else {
      // Create new draft
      draft = await prisma.designDraft.create({
        data: draftData,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: draft.id,
        status: draft.status,
        updatedAt: draft.updatedAt,
      },
      message: id ? 'Draft updated' : 'Draft created',
    });
  } catch (error) {
    console.error('Error saving draft:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save draft' },
      { status: 500 }
    );
  }
  */
}
