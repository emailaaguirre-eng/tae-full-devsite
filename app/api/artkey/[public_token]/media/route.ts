import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDatabase, artKeys, artkeyMedia, eq, desc, generateId } from '@/lib/db';
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

    // --- Security: File size limits ---
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB
    const MAX_AUDIO_SIZE = 20 * 1024 * 1024; // 20 MB

    // --- Security: MIME type allowlist (server-side validation) ---
    const ALLOWED_MIME_TYPES: Record<string, string[]> = {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
      video: ['video/mp4', 'video/webm', 'video/quicktime'],
      audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
    };

    const allAllowed = [...ALLOWED_MIME_TYPES.image, ...ALLOWED_MIME_TYPES.video, ...ALLOWED_MIME_TYPES.audio];
    if (!allAllowed.includes(file.type)) {
      return NextResponse.json(
        { error: `File type "${file.type}" is not allowed.` },
        { status: 400 }
      );
    }

    // --- Security: Validate public_token format (alphanumeric only) ---
    if (!/^[a-z0-9]+$/.test(public_token)) {
      return NextResponse.json(
        { error: 'Invalid token format' },
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

    // Parse features JSON from the schema column
    let features: Record<string, any> = {
      enable_gallery: true,
      enable_video: false,
      allow_img_uploads: false,
      allow_vid_uploads: false,
    };
    if (artKey.features) {
      try {
        features = { ...features, ...JSON.parse(artKey.features) };
      } catch (e) {
        console.error('Error parsing features JSON:', e);
      }
    }

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

    // --- Security: Enforce size limit per media type ---
    const sizeLimit = mediaType === 'image' ? MAX_IMAGE_SIZE
                    : mediaType === 'video' ? MAX_VIDEO_SIZE
                    : MAX_AUDIO_SIZE;
    if (file.size > sizeLimit) {
      const limitMb = Math.round(sizeLimit / (1024 * 1024));
      return NextResponse.json(
        { error: `File too large. Maximum size for ${mediaType} is ${limitMb} MB.` },
        { status: 400 }
      );
    }

    // Save file to public/uploads directory
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'artkey', public_token);

    // Ensure directory exists
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // --- Security: Generate safe filename (never use user-supplied file.name in path) ---
    const MIME_TO_EXT: Record<string, string> = {
      'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif',
      'image/webp': 'webp', 'image/svg+xml': 'svg',
      'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov',
      'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a',
    };
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = MIME_TO_EXT[file.type] || 'bin';
    const filename = `${timestamp}-${randomStr}.${ext}`;
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

    await db.insert(artkeyMedia).values({
      id: mediaId,
      artkeyId: artKey.id,
      type: mediaType,
      url: publicUrl,
      caption: null,
      createdAt: now,
    });

    // Persist in-memory SQLite to disk
    await saveDatabase();

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
