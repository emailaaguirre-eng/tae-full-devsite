/**
 * Individual Draft API
 * Copyright (c) 2026 B&D Servicing LLC. All rights reserved.
 *
 * NOTE: Design drafts functionality is temporarily disabled.
 * The designDrafts table is not currently in the database schema.
 * This route will return a "feature not available" response.
 */

import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/drafts/[id] - Get a specific draft
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  // Design drafts feature not available - table not in schema
  return NextResponse.json(
    {
      success: false,
      error: 'Design drafts feature is not currently available',
      requestedId: id
    },
    { status: 501 }
  );

  /* Original Prisma implementation - commented out as designDrafts table not in schema
  try {
    const { id } = await params;

    const draft = await prisma.designDraft.findUnique({
      where: { id },
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
  } catch (error) {
    console.error('Error fetching draft:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch draft' },
      { status: 500 }
    );
  }
  */
}

// DELETE /api/drafts/[id] - Delete a draft
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  // Design drafts feature not available - table not in schema
  return NextResponse.json(
    {
      success: false,
      error: 'Design drafts feature is not currently available',
      requestedId: id
    },
    { status: 501 }
  );

  /* Original Prisma implementation - commented out as designDrafts table not in schema
  try {
    const { id } = await params;

    await prisma.designDraft.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Draft deleted',
    });
  } catch (error) {
    console.error('Error deleting draft:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete draft' },
      { status: 500 }
    );
  }
  */
}
