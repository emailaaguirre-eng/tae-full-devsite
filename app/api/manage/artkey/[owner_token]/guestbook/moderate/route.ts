import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Guestbook Moderation API
 * Allows owner to approve, reject, or delete guestbook entries
 * Only accessible with owner_token
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ owner_token: string }> }
) {
  try {
    const { owner_token } = await params;
    const body = await request.json();
    const { entry_id, action } = body;

    if (!entry_id || !action) {
      return NextResponse.json(
        { error: 'entry_id and action are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject', 'delete'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be approve, reject, or delete' },
        { status: 400 }
      );
    }

    // Find ArtKey by owner token
    const artKey = await prisma.artKey.findUnique({
      where: { ownerToken: owner_token },
    });

    if (!artKey) {
      return NextResponse.json(
        { error: 'ArtKey not found or invalid owner token' },
        { status: 404 }
      );
    }

    // Find the guestbook entry and verify it belongs to this ArtKey
    const entry = await prisma.guestbookEntry.findFirst({
      where: {
        id: entry_id,
        artkeyId: artKey.id,
      },
      include: {
        replies: true,
        mediaItems: true,
      },
    });

    if (!entry) {
      return NextResponse.json(
        { error: 'Guestbook entry not found' },
        { status: 404 }
      );
    }

    // Apply the action
    if (action === 'approve') {
      await prisma.guestbookEntry.update({
        where: { id: entry_id },
        data: { approved: true },
      });
    } else if (action === 'reject') {
      await prisma.guestbookEntry.update({
        where: { id: entry_id },
        data: { approved: false },
      });
    } else if (action === 'delete') {
      // Delete the entry and all its replies (cascade will handle this via Prisma)
      // Also delete associated media items
      await prisma.mediaItem.deleteMany({
        where: { guestbookEntryId: entry_id },
      });
      
      await prisma.guestbookEntry.delete({
        where: { id: entry_id },
      });
    }

    return NextResponse.json({
      success: true,
      action,
      entry_id,
      message: `Entry ${action}d successfully`,
    });
  } catch (error: any) {
    console.error('Error moderating guestbook entry:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to moderate entry' },
      { status: 500 }
    );
  }
}

