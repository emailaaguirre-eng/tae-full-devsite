import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * Moderate guestbook entries or media items
 * POST /api/owner/artkey/[id]/moderate
 * Body: { type: 'guestbook' | 'media', itemId: string, action: 'approve' | 'reject' | 'delete' }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const user = verifyToken(token);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { type, itemId, action } = body;

    if (!type || !itemId || !action) {
      return NextResponse.json(
        { error: 'type, itemId, and action are required' },
        { status: 400 }
      );
    }

    // Verify ArtKey ownership
    const artKey = await prisma.artKey.findUnique({
      where: { id },
    });

    if (!artKey) {
      return NextResponse.json(
        { error: 'ArtKey not found' },
        { status: 404 }
      );
    }

    if (artKey.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to moderate this ArtKey' },
        { status: 403 }
      );
    }

    if (type === 'guestbook') {
      // Verify the entry belongs to this ArtKey
      const entry = await prisma.guestbookEntry.findFirst({
        where: {
          id: itemId,
          artkeyId: artKey.id,
        },
      });

      if (!entry) {
        return NextResponse.json(
          { error: 'Guestbook entry not found' },
          { status: 404 }
        );
      }

      if (action === 'approve') {
        await prisma.guestbookEntry.update({
          where: { id: itemId },
          data: { approved: true },
        });
      } else if (action === 'reject') {
        await prisma.guestbookEntry.update({
          where: { id: itemId },
          data: { approved: false },
        });
      } else if (action === 'delete') {
        await prisma.guestbookEntry.delete({
          where: { id: itemId },
        });
      } else {
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
      }
    } else if (type === 'media') {
      // Verify the media item belongs to this ArtKey
      const mediaItem = await prisma.mediaItem.findFirst({
        where: {
          id: itemId,
          artkeyId: artKey.id,
        },
      });

      if (!mediaItem) {
        return NextResponse.json(
          { error: 'Media item not found' },
          { status: 404 }
        );
      }

      if (action === 'approve') {
        await prisma.mediaItem.update({
          where: { id: itemId },
          data: { approved: true },
        });
      } else if (action === 'reject') {
        await prisma.mediaItem.update({
          where: { id: itemId },
          data: { approved: false },
        });
      } else if (action === 'delete') {
        await prisma.mediaItem.delete({
          where: { id: itemId },
        });
      } else {
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid type' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${type} ${action}d successfully`,
    });
  } catch (error: any) {
    console.error('Error moderating content:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to moderate content' },
      { status: 500 }
    );
  }
}

