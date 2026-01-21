import { NextRequest, NextResponse } from 'next/server';
import { getDb, artKeys, artkeyGuestbookEntries, artkeyMedia, eq, desc, asc } from '@/lib/db';

/**
 * Public ArtKey Portal API
 * Returns ArtKey data with guestbook entries and media for public display
 * This endpoint is used by the public portal page
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ public_token: string }> }
) {
  try {
    const db = await getDb();
    const { public_token } = await params;

    // Find ArtKey by public token
    const artKey = await db.select().from(artKeys).where(eq(artKeys.publicToken, public_token)).get();

    if (!artKey) {
      return NextResponse.json(
        { error: 'ArtKey not found' },
        { status: 404 }
      );
    }

    // Get guestbook entries for this artkey
    const guestbookEntries = await db
      .select()
      .from(artkeyGuestbookEntries)
      .where(eq(artkeyGuestbookEntries.artkeyId, artKey.id))
      .orderBy(asc(artkeyGuestbookEntries.createdAt))
      .all();

    // Get media items for this artkey
    const mediaItems = await db
      .select()
      .from(artkeyMedia)
      .where(eq(artkeyMedia.artkeyId, artKey.id))
      .orderBy(desc(artkeyMedia.createdAt))
      .all();

    // Parse customization JSON if present
    let customization: Record<string, any> = {};
    if (artKey.customization) {
      try {
        customization = JSON.parse(artKey.customization);
      } catch (e) {
        console.error('Error parsing customization JSON:', e);
      }
    }

    // Extract theme, features, links, etc. from customization
    const theme = customization.theme || {
      template: artKey.template || 'classic',
      bg_color: '#F6F7FB',
      bg_image_id: 0,
      bg_image_url: '',
      font: 'g:Playfair Display',
      text_color: '#111111',
      title_color: '#4f46e5',
      title_style: 'solid',
      button_color: '#4f46e5',
      button_gradient: '',
      color_scope: 'content',
    };
    const features = customization.features || {
      enable_gallery: artKey.mediaEnabled ?? true,
      enable_video: false,
      show_guestbook: artKey.guestbookEnabled ?? true,
      enable_custom_links: false,
      enable_spotify: false,
      allow_img_uploads: false,
      allow_vid_uploads: false,
      gb_btn_view: true,
      gb_signing_status: 'open',
      gb_signing_start: '',
      gb_signing_end: '',
      gb_require_approval: false,
      img_require_approval: false,
      vid_require_approval: false,
      order: ['gallery', 'guestbook', 'video'],
    };
    const links = customization.links || [];
    const spotify = customization.spotify || { url: 'https://', autoplay: false };
    const featuredVideo = customization.featured_video || null;
    const uploadedImages = customization.uploadedImages || [];
    const uploadedVideos = customization.uploadedVideos || [];

    // Format guestbook entries
    const formattedGuestbook = guestbookEntries.map((entry) => ({
      id: entry.id,
      name: entry.senderName,
      message: entry.message,
      createdAt: entry.createdAt,
      children: [],
      media: [],
    }));

    // Group media by type
    const mediaByType = {
      image: mediaItems.filter((m) => m.type === 'image'),
      video: mediaItems.filter((m) => m.type === 'video'),
      audio: mediaItems.filter((m) => m.type === 'audio'),
    };

    // Check if guestbook signing is enabled
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
      customizations: customization.customizations || {},
      uploadedImages,
      uploadedVideos,
      guestbook: {
        entries: formattedGuestbook,
        canSign,
        requiresApproval: features.gb_require_approval || false,
      },
      media: {
        all: mediaItems.map((m) => ({
          id: m.id,
          type: m.type,
          url: m.url,
          caption: m.caption,
          createdAt: m.createdAt,
        })),
        byType: {
          images: mediaByType.image.map((m) => ({
            id: m.id,
            url: m.url,
            caption: m.caption,
            createdAt: m.createdAt,
          })),
          videos: mediaByType.video.map((m) => ({
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
      createdAt: artKey.createdAt,
      updatedAt: artKey.updatedAt,
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
