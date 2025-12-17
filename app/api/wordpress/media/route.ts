import { NextResponse } from 'next/server';
import { getAllMedia, getMedia, getImageUrl, getImageSizes } from '@/lib/wordpress';

/**
 * GET /api/wordpress/media
 * Fetch WordPress media/images
 * 
 * Query params:
 * - id: Get specific media by ID
 * - limit: Number of images to fetch (default: 100)
 * - mimeType: Filter by MIME type (e.g., 'image/jpeg')
 * - size: Get image URL in specific size (thumbnail, medium, large, full)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const limit = parseInt(searchParams.get('limit') || '100');
    const mimeType = searchParams.get('mimeType') || undefined;
    const size = searchParams.get('size') || undefined;

    // Get specific media by ID
    if (id) {
      const media = await getMedia(parseInt(id));
      
      if (!media) {
        return NextResponse.json(
          { error: 'Media not found' },
          { status: 404 }
        );
      }

      // If size is specified, return just the URL
      if (size) {
        const url = getImageUrl(media, size);
        return NextResponse.json({
          id: media.id,
          url,
          sizes: getImageSizes(media),
        });
      }

      // Return full media object with all sizes
      return NextResponse.json({
        ...media,
        sizes: getImageSizes(media),
        url: getImageUrl(media, 'full'),
      });
    }

    // Get all media
    const media = await getAllMedia(limit, mimeType);

    // Transform media objects to include sizes
    const transformedMedia = media.map((item: any) => ({
      id: item.id,
      title: item.title?.rendered || item.title,
      alt: item.alt_text || '',
      url: getImageUrl(item, 'full'),
      sizes: getImageSizes(item),
      mimeType: item.mime_type,
      date: item.date,
      sourceUrl: item.source_url,
      mediaDetails: {
        width: item.media_details?.width,
        height: item.media_details?.height,
        file: item.media_details?.file,
      },
    }));

    return NextResponse.json({
      total: transformedMedia.length,
      media: transformedMedia,
    });
  } catch (error: any) {
    console.error('Error fetching WordPress media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media', details: error.message },
      { status: 500 }
    );
  }
}

