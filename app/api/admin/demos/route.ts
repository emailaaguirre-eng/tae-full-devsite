import { NextRequest, NextResponse } from 'next/server';
import { prisma, generatePublicToken, generateOwnerToken } from '@/lib/db';
import { getAppBaseUrl } from '@/lib/wp';
import QRCode from 'qrcode';

/**
 * Demo ArtKey Management API
 * Create, list, and manage demo ArtKeys for testing and sales demos
 * Now uses Prisma database instead of in-memory storage
 */

/**
 * POST - Create a new demo ArtKey
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, artKeyData } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Generate tokens
    const publicToken = generatePublicToken();
    const ownerToken = generateOwnerToken();

    // Ensure publicToken is unique
    let attempts = 0;
    let finalPublicToken = publicToken;
    while (await prisma.artKey.findUnique({ where: { publicToken: finalPublicToken } })) {
      finalPublicToken = generatePublicToken();
      attempts++;
      if (attempts > 10) {
        return NextResponse.json(
          { error: 'Failed to generate unique token' },
          { status: 500 }
        );
      }
    }

    // Parse or create default ArtKey data
    let parsedArtKeyData = artKeyData;
    if (!parsedArtKeyData) {
      parsedArtKeyData = {
        title: title,
        theme: {
          template: 'classic',
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
        },
        links: [],
        spotify: { url: 'https://', autoplay: false },
        featured_video: null,
        features: {
          enable_gallery: true,
          enable_video: true,
          show_guestbook: true,
          enable_custom_links: false,
          enable_spotify: false,
          allow_img_uploads: true,
          allow_vid_uploads: true,
          gb_btn_view: true,
          gb_signing_status: 'open',
          gb_signing_start: '',
          gb_signing_end: '',
          gb_require_approval: false,
          img_require_approval: false,
          vid_require_approval: false,
          order: ['gallery', 'guestbook', 'video'],
        },
        uploadedImages: [],
        uploadedVideos: [],
        customizations: {
          demo: true,
          description: description || '',
        },
      };
    } else {
      // Ensure demo flag is set
      if (!parsedArtKeyData.customizations) {
        parsedArtKeyData.customizations = {};
      }
      parsedArtKeyData.customizations.demo = true;
      if (description) {
        parsedArtKeyData.customizations.description = description;
      }
    }

    // Create ArtKey in database
    const artKey = await prisma.artKey.create({
      data: {
        publicToken: finalPublicToken,
        ownerToken: ownerToken,
        title: parsedArtKeyData.title || title,
        theme: JSON.stringify(parsedArtKeyData.theme || {}),
        features: JSON.stringify(parsedArtKeyData.features || {}),
        links: JSON.stringify(parsedArtKeyData.links || []),
        spotify: JSON.stringify(parsedArtKeyData.spotify || { url: 'https://', autoplay: false }),
        featuredVideo: parsedArtKeyData.featured_video ? JSON.stringify(parsedArtKeyData.featured_video) : null,
        customizations: JSON.stringify(parsedArtKeyData.customizations || {}),
        uploadedImages: JSON.stringify(parsedArtKeyData.uploadedImages || []),
        uploadedVideos: JSON.stringify(parsedArtKeyData.uploadedVideos || []),
      },
    });

    const baseUrl = getAppBaseUrl();
    const shareUrl = `${baseUrl}/artkey/${finalPublicToken}`;

    // Generate QR code
    let qrCodeUrl: string | undefined;
    try {
      const qrResponse = await fetch(`${baseUrl}/api/artkey/qr?url=${encodeURIComponent(shareUrl)}&format=dataurl&size=400`);
      if (qrResponse.ok) {
        const qrData = await qrResponse.json();
        qrCodeUrl = qrData.qrCodeUrl;
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
    }

    return NextResponse.json({
      success: true,
      demo: {
        id: artKey.id,
        token: artKey.publicToken,
        title: artKey.title,
        description: description,
        shareUrl: shareUrl,
        qrCodeUrl: qrCodeUrl,
        ownerToken: ownerToken, // Include for admin use
        createdAt: artKey.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error creating demo:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create demo' },
      { status: 500 }
    );
  }
}

/**
 * GET - List all demos
 * Demos are ArtKeys with customizations.demo === true
 */
export async function GET() {
  try {
    // Fetch all ArtKeys and filter for demos
    const allArtKeys = await prisma.artKey.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const baseUrl = getAppBaseUrl();
    const demoArtKeys = allArtKeys.filter((artKey) => {
      try {
        const customizations = JSON.parse(artKey.customizations);
        return customizations.demo === true;
      } catch {
        return false;
      }
    });

    // Generate QR codes for all demos in parallel
    const demos = await Promise.all(
      demoArtKeys.map(async (artKey) => {
        let description = '';
        try {
          const customizations = JSON.parse(artKey.customizations);
          description = customizations.description || '';
        } catch {}

        const shareUrl = `${baseUrl}/artkey/${artKey.publicToken}`;
        
        // Generate QR code on-demand
        let qrCodeUrl: string | undefined;
        try {
          qrCodeUrl = await QRCode.toDataURL(shareUrl, {
            width: 400,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
          });
        } catch (error) {
          console.error('Error generating QR code for demo:', error);
        }

        return {
          id: artKey.id,
          token: artKey.publicToken,
          title: artKey.title,
          description: description,
          shareUrl: shareUrl,
          qrCodeUrl: qrCodeUrl,
          ownerToken: artKey.ownerToken, // Include for admin editing
          createdAt: artKey.createdAt.toISOString(),
          updatedAt: artKey.updatedAt.toISOString(),
        };
      })
    );

    return NextResponse.json({
      success: true,
      demos: demos,
    });
  } catch (error: any) {
    console.error('Error listing demos:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list demos' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a demo
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Demo ID is required' },
        { status: 400 }
      );
    }

    // Find and delete the ArtKey
    const artKey = await prisma.artKey.findUnique({
      where: { id },
    });

    if (!artKey) {
      return NextResponse.json(
        { error: 'Demo not found' },
        { status: 404 }
      );
    }

    // Verify it's a demo
    try {
      const customizations = JSON.parse(artKey.customizations);
      if (customizations.demo !== true) {
        return NextResponse.json(
          { error: 'This is not a demo ArtKey' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid ArtKey data' },
        { status: 400 }
      );
    }

    // Delete the ArtKey (cascade will delete related entries and media)
    await prisma.artKey.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Demo deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting demo:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete demo' },
      { status: 500 }
    );
  }
}
