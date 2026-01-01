import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * Media Upload and Listing API
 * POST: Upload media files (images, videos, audio) from guests
 * GET: List approved media for public display
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ public_token: string }> }
) {
  try {
    const { public_token } = await params;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const guestbook_entry_id = formData.get('guestbook_entry_id') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Find ArtKey by public token
    const artKey = await prisma.artKey.findUnique({
      where: { publicToken: public_token },
    });

    if (!artKey) {
      return NextResponse.json(
        { error: 'ArtKey not found' },
        { status: 404 }
      );
    }

    // Parse features to check upload permissions
    const features = JSON.parse(artKey.features);

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

    // Validate guestbook_entry_id if provided
    if (guestbook_entry_id) {
      const entry = await prisma.guestbookEntry.findFirst({
        where: {
          id: guestbook_entry_id,
          artkeyId: artKey.id,
        },
      });

      if (!entry) {
        return NextResponse.json(
          { error: 'Invalid guestbook entry' },
          { status: 400 }
        );
      }
    }

    // Determine approval status
    const requiresApproval = 
      (mediaType === 'image' && features.img_require_approval) ||
      (mediaType === 'video' && features.vid_require_approval) ||
      (mediaType === 'audio' && features.vid_require_approval); // Use vid_require_approval for audio too

    const approved = !requiresApproval;

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
    const mediaItem = await prisma.mediaItem.create({
      data: {
        artkeyId: artKey.id,
        guestbookEntryId: guestbook_entry_id || null,
        type: mediaType,
        url: publicUrl,
        caption: null,
        approved,
      },
    });

    return NextResponse.json({
      success: true,
      media: {
        id: mediaItem.id,
        type: mediaItem.type,
        url: mediaItem.url,
        approved: mediaItem.approved,
        requiresApproval: !approved,
        createdAt: mediaItem.createdAt.toISOString(),
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
 * GET: List approved media for public display
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
    });

    if (!artKey) {
      return NextResponse.json(
        { error: 'ArtKey not found' },
        { status: 404 }
      );
    }

    // Get all approved media items
    const mediaItems = await prisma.mediaItem.findMany({
      where: {
        artkeyId: artKey.id,
        approved: true,
      },
      orderBy: { createdAt: 'desc' },
    });

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
          createdAt: m.createdAt.toISOString(),
        })),
        byType: {
          images: mediaByType.images.map((m) => ({
            id: m.id,
            url: m.url,
            caption: m.caption,
            createdAt: m.createdAt.toISOString(),
          })),
          videos: mediaByType.videos.map((m) => ({
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
    });
  } catch (error: any) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch media' },
      { status: 500 }
    );
  }
}

