import { NextRequest, NextResponse } from 'next/server';
import { getDb, artKeys, artkeyMedia, eq, desc, generateId } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * Media Upload and Listing API
 * POST: Upload media files (images, videos, audio) from guests
 * GET: List media for public display
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ public_token: string }> }
) {
  try {
    const db = await getDb();
    const { public_token } = await params;
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Find ArtKey by public token
    const artKey = await db.select().from(artKeys).where(eq(artKeys.publicToken, public_token)).get();

    if (!artKey) {
      return NextResponse.json(
        { error: 'ArtKey not found' },
        { status: 404 }
      );
    }

    // Parse customization to check feature flags
    let customization: Record<string, any> = {};
    if (artKey.customization) {
      try {
        customization = JSON.parse(artKey.customization);
      } catch (e) {
        console.error('Error parsing customization JSON:', e);
      }
    }

    const features = customization.features || {
      enable_gallery: artKey.mediaEnabled ?? true,
      enable_video: false,
      allow_img_uploads: false,
      allow_vid_uploads: false,
    };

    // Determine file type
    const fileType = file.type.split('/')[0]; // 'image', 'video', or 'audio'
    let mediaType: 'image' | 'video' | 'audio';

    if (fileType === 'image') {
      if (!features.enable_gallery || !features.allow_img_uploads) {
        return NextResponse.json(
          { error: 'Image uploads are not enabled for this ArtKey' },
          { status: 403 }
        );
      }
      mediaType = 'image';
    } else if (fileType === 'video') {
      if (!features.enable_video || !features.allow_vid_uploads) {
        return NextResponse.json(
          { error: 'Video uploads are not enabled for this ArtKey' },
          { status: 403 }
        );
      }
      mediaType = 'video';
    } else if (fileType === 'audio') {
      mediaType = 'audio';
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Only images, videos, and audio are allowed.' },
        { status: 400 }
      );
    }

    // Save file to public/uploads directory
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'artkey', public_token);

    // Ensure directory exists
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop();
    const filename = `${timestamp}-${randomStr}.${fileExtension}`;
    const filepath = join(uploadsDir, filename);

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Build public URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const publicUrl = `${baseUrl}/uploads/artkey/${public_token}/${filename}`;

    // Create media item in database
    const mediaId = generateId();
    const now = new Date().toISOString();

    // Get max sort order
    const existingMedia = await db
      .select()
      .from(artkeyMedia)
      .where(eq(artkeyMedia.artkeyId, artKey.id))
      .orderBy(desc(artkeyMedia.sortOrder))
      .limit(1)
      .all();

    const maxSortOrder = existingMedia.length > 0 ? (existingMedia[0].sortOrder || 0) : 0;

    await db.insert(artkeyMedia).values({
      id: mediaId,
      artkeyId: artKey.id,
      type: mediaType,
      url: publicUrl,
      caption: null,
      sortOrder: maxSortOrder + 1,
      createdAt: now,
    });

    // Get the created media item
    const mediaItem = await db
      .select()
      .from(artkeyMedia)
      .where(eq(artkeyMedia.id, mediaId))
      .get();

    return NextResponse.json({
      success: true,
      media: {
        id: mediaItem?.id,
        type: mediaItem?.type,
        url: mediaItem?.url,
        createdAt: mediaItem?.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error uploading media:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload media' },
      { status: 500 }
    );
  }
}

/**
 * GET: List media for public display
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

    // Get all media items
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
    });
  } catch (error: any) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch media' },
      { status: 500 }
    );
  }
}
