import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * Get ArtKey details with ALL content (approved and pending) for owner
 * This shows everything, regardless of visibility settings
 */
export async function GET(
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

    // Find ArtKey and verify ownership
    const artKey = await prisma.artKey.findUnique({
      where: { id },
      include: {
        // Get ALL guestbook entries (approved and pending)
        guestbookEntries: {
          orderBy: { createdAt: 'asc' },
          include: {
            replies: {
              orderBy: { createdAt: 'asc' },
            },
            mediaItems: true,
          },
        },
        // Get ALL media items (approved and pending)
        mediaItems: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!artKey) {
      return NextResponse.json(
        { error: 'ArtKey not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (artKey.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to view this ArtKey' },
        { status: 403 }
      );
    }

    // Parse JSON fields
    const theme = JSON.parse(artKey.theme);
    const features = JSON.parse(artKey.features);
    const links = JSON.parse(artKey.links);
    const spotify = JSON.parse(artKey.spotify);
    const featuredVideo = artKey.featuredVideo ? JSON.parse(artKey.featuredVideo) : null;
    const customizations = JSON.parse(artKey.customizations);

    // Build nested guestbook structure with ALL entries
    const guestbookMap = new Map();
    const guestbookEntries: any[] = [];

    // First pass: create map of all entries (including pending)
    artKey.guestbookEntries.forEach((entry) => {
      if (!entry.parentId) {
        guestbookMap.set(entry.id, {
          id: entry.id,
          name: entry.name,
          email: entry.email || undefined,
          message: entry.message,
          role: entry.role || 'guest',
          approved: entry.approved,
          createdAt: entry.createdAt.toISOString(),
          children: [],
          media: entry.mediaItems.map((m) => ({
            id: m.id,
            type: m.type,
            url: m.url,
            caption: m.caption,
            approved: m.approved,
          })),
        });
        guestbookEntries.push(guestbookMap.get(entry.id));
      }
    });

    // Second pass: add replies
    artKey.guestbookEntries.forEach((entry) => {
      if (entry.parentId && guestbookMap.has(entry.parentId)) {
        guestbookMap.get(entry.parentId).children.push({
          id: entry.id,
          name: entry.name,
          email: entry.email || undefined,
          message: entry.message,
          role: entry.role || 'guest',
          approved: entry.approved,
          createdAt: entry.createdAt.toISOString(),
          media: entry.mediaItems.map((m) => ({
            id: m.id,
            type: m.type,
            url: m.url,
            caption: m.caption,
            approved: m.approved,
          })),
        });
      }
    });

    // Group media by type (all items, approved and pending)
    const mediaByType = {
      image: artKey.mediaItems.filter((m) => m.type === 'image'),
      video: artKey.mediaItems.filter((m) => m.type === 'video'),
      audio: artKey.mediaItems.filter((m) => m.type === 'audio'),
    };

    // Calculate stats
    const stats = {
      guestbook: {
        total: artKey.guestbookEntries.length,
        approved: artKey.guestbookEntries.filter((e) => e.approved).length,
        pending: artKey.guestbookEntries.filter((e) => !e.approved).length,
      },
      media: {
        total: artKey.mediaItems.length,
        approved: artKey.mediaItems.filter((m) => m.approved).length,
        pending: artKey.mediaItems.filter((m) => !m.approved).length,
        byType: {
          image: mediaByType.image.length,
          video: mediaByType.video.length,
          audio: mediaByType.audio.length,
        },
      },
    };

    return NextResponse.json({
      success: true,
      artKey: {
        id: artKey.id,
        publicToken: artKey.publicToken,
        title: artKey.title,
        theme,
        features,
        links,
        spotify,
        featured_video: featuredVideo,
        customizations,
        guestbook: {
          entries: guestbookEntries,
          stats: stats.guestbook,
        },
        media: {
          all: artKey.mediaItems.map((m) => ({
            id: m.id,
            type: m.type,
            url: m.url,
            caption: m.caption,
            approved: m.approved,
            createdAt: m.createdAt.toISOString(),
          })),
          byType: {
            images: mediaByType.image.map((m) => ({
              id: m.id,
              url: m.url,
              caption: m.caption,
              approved: m.approved,
              createdAt: m.createdAt.toISOString(),
            })),
            videos: mediaByType.video.map((m) => ({
              id: m.id,
              url: m.url,
              caption: m.caption,
              approved: m.approved,
              createdAt: m.createdAt.toISOString(),
            })),
            audio: mediaByType.audio.map((m) => ({
              id: m.id,
              url: m.url,
              caption: m.caption,
              approved: m.approved,
              createdAt: m.createdAt.toISOString(),
            })),
          },
          stats: stats.media,
        },
        stats,
        createdAt: artKey.createdAt.toISOString(),
        updatedAt: artKey.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error fetching ArtKey for owner:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch ArtKey' },
      { status: 500 }
    );
  }
}

