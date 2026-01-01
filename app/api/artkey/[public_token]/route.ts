import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Public ArtKey Portal API
 * Returns ArtKey data with approved guestbook entries and media for public display
 * This endpoint is used by the public portal page
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ public_token: string }> }
) {
  try {
    const { public_token } = await params;

    // Find ArtKey by public token
    const artKey = await prisma.artKey.findUnique({
      where: { publicToken: public_token },
      include: {
        guestbookEntries: {
          where: { approved: true },
          orderBy: { createdAt: 'asc' },
          include: {
            replies: {
              where: { approved: true },
              orderBy: { createdAt: 'asc' },
            },
            mediaItems: {
              where: { approved: true },
            },
          },
        },
        mediaItems: {
          where: { approved: true },
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

    // Parse JSON fields
    const theme = JSON.parse(artKey.theme);
    const features = JSON.parse(artKey.features);
    const links = JSON.parse(artKey.links);
    const spotify = JSON.parse(artKey.spotify);
    const featuredVideo = artKey.featuredVideo ? JSON.parse(artKey.featuredVideo) : null;
    const customizations = JSON.parse(artKey.customizations);
    const uploadedImages = JSON.parse(artKey.uploadedImages);
    const uploadedVideos = JSON.parse(artKey.uploadedVideos);

    // Build nested guestbook structure (replies nested under parents)
    const guestbookMap = new Map();
    const guestbookEntries: any[] = [];

    // First pass: create map of all entries
    artKey.guestbookEntries.forEach((entry) => {
      if (!entry.parentId) {
        // Top-level entry
        guestbookMap.set(entry.id, {
          id: entry.id,
          name: entry.name,
          email: entry.email || undefined, // Include email if present
          message: entry.message,
          role: entry.role || 'guest', // Include role (default to 'guest' for backward compatibility)
          createdAt: entry.createdAt.toISOString(),
          children: [],
          media: entry.mediaItems.map((m) => ({
            id: m.id,
            type: m.type,
            url: m.url,
            caption: m.caption,
          })),
        });
        guestbookEntries.push(guestbookMap.get(entry.id));
      }
    });

    // Second pass: add replies to their parents
    artKey.guestbookEntries.forEach((entry) => {
      if (entry.parentId && guestbookMap.has(entry.parentId)) {
        guestbookMap.get(entry.parentId).children.push({
          id: entry.id,
          name: entry.name,
          email: entry.email || undefined, // Include email if present
          message: entry.message,
          role: entry.role || 'guest', // Include role
          createdAt: entry.createdAt.toISOString(),
          media: entry.mediaItems.map((m) => ({
            id: m.id,
            type: m.type,
            url: m.url,
            caption: m.caption,
          })),
        });
      }
    });

    // Group media by type
    const mediaByType = {
      image: artKey.mediaItems.filter((m) => m.type === 'image'),
      video: artKey.mediaItems.filter((m) => m.type === 'video'),
      audio: artKey.mediaItems.filter((m) => m.type === 'audio'),
    };

    // Check if guestbook signing is enabled and not closed
    const canSign = features.show_guestbook && 
                   features.gb_signing_status !== 'closed' &&
                   (features.gb_signing_status === 'open' || 
                    (features.gb_signing_status === 'scheduled' && 
                     checkSigningSchedule(features.gb_signing_start, features.gb_signing_end)));

    return NextResponse.json({
      id: artKey.id,
      public_token: artKey.publicToken,
      title: artKey.title,
      theme,
      features,
      links,
      spotify,
      featured_video: featuredVideo,
      customizations,
      uploadedImages,
      uploadedVideos,
      guestbook: {
        entries: guestbookEntries,
        canSign,
        requiresApproval: features.gb_require_approval || false,
      },
      media: {
        all: artKey.mediaItems.map((m) => ({
          id: m.id,
          type: m.type,
          url: m.url,
          caption: m.caption,
          createdAt: m.createdAt.toISOString(),
        })),
        byType: {
          images: mediaByType.image.map((m) => ({
            id: m.id,
            url: m.url,
            caption: m.caption,
            createdAt: m.createdAt.toISOString(),
          })),
          videos: mediaByType.video.map((m) => ({
            id: m.id,
            url: m.url,
            caption: m.caption,
            createdAt: m.createdAt.toISOString(),
          })),
          audio: mediaByType.audio.map((m) => ({
            id: m.id,
            url: m.url,
            caption: m.caption,
            createdAt: m.createdAt.toISOString(),
          })),
        },
      },
      createdAt: artKey.createdAt.toISOString(),
      updatedAt: artKey.updatedAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching ArtKey:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch ArtKey' },
      { status: 500 }
    );
  }
}

/**
 * Helper to check if current time is within signing schedule
 */
function checkSigningSchedule(start: string, end: string): boolean {
  if (!start || !end) return false;
  const now = new Date();
  const startDate = new Date(start);
  const endDate = new Date(end);
  return now >= startDate && now <= endDate;
}

