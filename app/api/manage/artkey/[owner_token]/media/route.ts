import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDatabase, artKeys, artkeyMedia, eq, desc, and } from '@/lib/db';

/**
 * Owner Media Management API
 * GET: Returns all media for owner moderation
 * POST: Moderate media items (delete)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner_token: string }> }
) {
  try {
    const db = await getDb();
    const { owner_token } = await params;

    // Find ArtKey by owner token
    const artKey = await db.select().from(artKeys).where(eq(artKeys.ownerToken, owner_token)).get();

    if (!artKey) {
      return NextResponse.json(
        { error: 'ArtKey not found or invalid owner token' },
        { status: 404 }
      );
    }

    // Get all media items for this artkey
    const mediaItems = await db
      .select()
      .from(artkeyMedia)
      .where(eq(artkeyMedia.artkeyId, artKey.id))
      .orderBy(desc(artkeyMedia.createdAt))
      .all();

    // Group by type
    const mediaByType = {
      images: mediaItems.filter((m) => m.type === 'image'),
      videos: mediaItems.filter((m) => m.type === 'video'),
      audio: mediaItems.filter((m) => m.type === 'audio'),
    };

    return NextResponse.json({
      artkey_id: artKey.id,
      artkey_title: artKey.title,
      public_token: artKey.publicToken,
      media: {
        all: mediaItems.map((m) => ({
          id: m.id,
          type: m.type,
          url: m.url,
          caption: m.caption,
          createdAt: m.createdAt,
        })),
        byType: {
          images: mediaByType.images.map((m) => ({
            id: m.id,
            url: m.url,
            caption: m.caption,
            createdAt: m.createdAt,
          })),
          videos: mediaByType.videos.map((m) => ({
            id: m.id,
            url: m.url,
            caption: m.caption,
            createdAt: m.createdAt,
          })),
          audio: mediaByType.audio.map((m) => ({
            id: m.id,
            url: m.url,
            caption: m.caption,
            createdAt: m.createdAt,
          })),
        },
      },
      stats: {
        total: mediaItems.length,
        approved: mediaItems.length, // All items are visible in simplified schema
        pending: 0,
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
    const db = await getDb();
    const { owner_token } = await params;
    const body = await request.json();
    const { media_id, action } = body;

    if (!media_id || !action) {
      return NextResponse.json(
        { error: 'media_id and action are required' },
        { status: 400 }
      );
    }

    if (!['delete'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be delete' },
        { status: 400 }
      );
    }

    // Find ArtKey by owner token
    const artKey = await db.select().from(artKeys).where(eq(artKeys.ownerToken, owner_token)).get();

    if (!artKey) {
      return NextResponse.json(
        { error: 'ArtKey not found or invalid owner token' },
        { status: 404 }
      );
    }

    // Find the media item and verify it belongs to this ArtKey
    const mediaItem = await db
      .select()
      .from(artkeyMedia)
      .where(
        and(
          eq(artkeyMedia.id, media_id),
          eq(artkeyMedia.artkeyId, artKey.id)
        )
      )
      .get();

    if (!mediaItem) {
      return NextResponse.json(
        { error: 'Media item not found' },
        { status: 404 }
      );
    }

    // Apply the action
    if (action === 'delete') {
      // TODO: Optionally delete the physical file from the filesystem
      await db
        .delete(artkeyMedia)
        .where(eq(artkeyMedia.id, media_id));

      // Persist in-memory SQLite to disk
      await saveDatabase();
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
