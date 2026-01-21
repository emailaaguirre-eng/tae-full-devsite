import { NextRequest, NextResponse } from 'next/server';
import { getDb, artKeys, generatePublicToken, generateOwnerToken, generateId, desc, eq } from '@/lib/db';
import { getAppBaseUrl } from '@/lib/wp';
import QRCode from 'qrcode';

/**
 * Demo ArtKey Management API
 * Create, list, and manage demo ArtKeys for testing and sales demos
 * Now uses Drizzle ORM instead of Prisma
 */

/**
 * POST - Create a new demo ArtKey
 */
export async function POST(request: Request) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { title, description, artKeyData } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Generate tokens
    let publicToken = generatePublicToken();
    const ownerToken = generateOwnerToken();

    // Ensure publicToken is unique
    let attempts = 0;
    while (true) {
      const existing = await db
        .select({ id: artKeys.id })
        .from(artKeys)
        .where(eq(artKeys.publicToken, publicToken))
        .get();

      if (!existing) break;

      publicToken = generatePublicToken();
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

    const now = new Date().toISOString();
    const id = generateId();

    // Create ArtKey in database using Drizzle
    // Store all the customization data as a single JSON string
    await db.insert(artKeys).values({
      id,
      publicToken,
      ownerToken,
      title: parsedArtKeyData.title || title,
      template: parsedArtKeyData.theme?.template || 'classic',
      customization: JSON.stringify(parsedArtKeyData),
      guestbookEnabled: parsedArtKeyData.features?.show_guestbook ?? true,
      mediaEnabled: parsedArtKeyData.features?.enable_gallery ?? true,
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    });

    const baseUrl = getAppBaseUrl();
    const shareUrl = `${baseUrl}/artkey/${publicToken}`;

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
        id,
        token: publicToken,
        title: parsedArtKeyData.title || title,
        description: description,
        shareUrl: shareUrl,
        qrCodeUrl: qrCodeUrl,
        ownerToken: ownerToken, // Include for admin use
        createdAt: now,
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
 * Demos are ArtKeys with isDemo === true
 */
export async function GET() {
  try {
    const db = await getDb();
    // Fetch all demo ArtKeys directly using the isDemo flag
    const demoArtKeys = await db
      .select()
      .from(artKeys)
      .where(eq(artKeys.isDemo, true))
      .orderBy(desc(artKeys.createdAt))
      .all();

    const baseUrl = getAppBaseUrl();

    // Generate QR codes for all demos in parallel
    const demos = await Promise.all(
      demoArtKeys.map(async (artKey) => {
        let description = '';
        try {
          if (artKey.customization) {
            const customization = JSON.parse(artKey.customization);
            description = customization.customizations?.description || '';
          }
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
          createdAt: artKey.createdAt,
          updatedAt: artKey.updatedAt,
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
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Demo ID is required' },
        { status: 400 }
      );
    }

    // Find the ArtKey
    const artKey = await db
      .select()
      .from(artKeys)
      .where(eq(artKeys.id, id))
      .get();

    if (!artKey) {
      return NextResponse.json(
        { error: 'Demo not found' },
        { status: 404 }
      );
    }

    // Verify it's a demo
    if (!artKey.isDemo) {
      return NextResponse.json(
        { error: 'This is not a demo ArtKey' },
        { status: 400 }
      );
    }

    // Delete the ArtKey
    await db.delete(artKeys).where(eq(artKeys.id, id));

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
