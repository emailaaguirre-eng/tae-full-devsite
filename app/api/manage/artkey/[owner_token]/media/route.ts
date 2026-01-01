import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Owner Media Management API
 * GET: Returns all media (approved and pending) for owner moderation
 * POST: Moderate media items (approve/reject/delete)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner_token: string }> }
) {
  try {
    const { owner_token } = await params;

    // Find ArtKey by owner token
    const artKey = await prisma.artKey.findUnique({
      where: { ownerToken: owner_token },
      include: {
        mediaItems: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!artKey) {
      return NextResponse.json(
        { error: 'ArtKey not found or invalid owner token' },
        { status: 404 }
      );
    }

    // Group by type and approval status
    const mediaByType = {
      images: artKey.mediaItems.filter((m) => m.type === 'image'),
      videos: artKey.mediaItems.filter((m) => m.type === 'video'),
      audio: artKey.mediaItems.filter((m) => m.type === 'audio'),
    };

    const pendingCount = artKey.mediaItems.filter((m) => !m.approved).length;

    return NextResponse.json({
      artkey_id: artKey.id,
      artkey_title: artKey.title,
      public_token: artKey.publicToken,
      media: {
        all: artKey.mediaItems.map((m) => ({
          id: m.id,
          type: m.type,
          url: m.url,
          caption: m.caption,
          approved: m.approved,
          guestbookEntryId: m.guestbookEntryId,
          createdAt: m.createdAt.toISOString(),
        })),
        byType: {
          images: mediaByType.images.map((m) => ({
            id: m.id,
            url: m.url,
            caption: m.caption,
            approved: m.approved,
            guestbookEntryId: m.guestbookEntryId,
            createdAt: m.createdAt.toISOString(),
          })),
          videos: mediaByType.videos.map((m) => ({
            id: m.id,
            url: m.url,
            caption: m.caption,
            approved: m.approved,
            guestbookEntryId: m.guestbookEntryId,
            createdAt: m.createdAt.toISOString(),
          })),
          audio: mediaByType.audio.map((m) => ({
            id: m.id,
            url: m.url,
            caption: m.caption,
            approved: m.approved,
            guestbookEntryId: m.guestbookEntryId,
            createdAt: m.createdAt.toISOString(),
          })),
        },
      },
      stats: {
        total: artKey.mediaItems.length,
        approved: artKey.mediaItems.filter((m) => m.approved).length,
        pending: pendingCount,
      },
    });
  } catch (error: any) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch media' },
      { status: 500 }
    );
  }
}

/**
 * POST: Moderate media items
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ owner_token: string }> }
) {
  try {
    const { owner_token } = await params;
    const body = await request.json();
    const { media_id, action } = body;

    if (!media_id || !action) {
      return NextResponse.json(
        { error: 'media_id and action are required' },
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

    // Find the media item and verify it belongs to this ArtKey
    const mediaItem = await prisma.mediaItem.findFirst({
      where: {
        id: media_id,
        artkeyId: artKey.id,
      },
    });

    if (!mediaItem) {
      return NextResponse.json(
        { error: 'Media item not found' },
        { status: 404 }
      );
    }

    // Apply the action
    if (action === 'approve') {
      await prisma.mediaItem.update({
        where: { id: media_id },
        data: { approved: true },
      });
    } else if (action === 'reject') {
      await prisma.mediaItem.update({
        where: { id: media_id },
        data: { approved: false },
      });
    } else if (action === 'delete') {
      // TODO: Optionally delete the physical file from the filesystem
      await prisma.mediaItem.delete({
        where: { id: media_id },
      });
    }

    return NextResponse.json({
      success: true,
      action,
      media_id,
      message: `Media ${action}d successfully`,
    });
  } catch (error: any) {
    console.error('Error moderating media:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to moderate media' },
      { status: 500 }
    );
  }
}

