import { NextRequest, NextResponse } from 'next/server';
import { prisma, generatePublicToken, generateOwnerToken, ArtKeyData } from '@/lib/db';
import { getAppBaseUrl } from '@/lib/wp';
import { verifyToken } from '@/lib/auth';

/**
 * ArtKey Save API
 * Saves or updates ArtKey data from the editor
 * Creates new ArtKey with public_token and owner_token if not exists
 * Updates existing ArtKey if id or public_token is provided
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, product_id, owner_token } = body;

    if (!data) {
      return NextResponse.json(
        { error: 'ArtKey data is required' },
        { status: 400 }
      );
    }

    // Try to get authenticated user from Authorization header
    let authenticatedUser = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      authenticatedUser = verifyToken(token);
    }

    // Parse the ArtKeyData structure from the editor
    const artKeyData: ArtKeyData = {
      title: data.title || 'Your Personalized Design',
      theme: data.theme || {
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
      links: data.links || [],
      spotify: data.spotify || { url: 'https://', autoplay: false },
      featured_video: data.featured_video || null,
      features: data.features || {
        enable_gallery: false,
        enable_video: false,
        show_guestbook: false,
        enable_custom_links: false,
        enable_spotify: false,
        allow_img_uploads: false,
        allow_vid_uploads: false,
        gb_btn_view: true,
        gb_signing_status: 'open',
        gb_signing_start: '',
        gb_signing_end: '',
        gb_require_approval: true,
        img_require_approval: true,
        vid_require_approval: true,
        order: ['gallery', 'guestbook', 'video'],
      },
      uploadedImages: data.uploadedImages || [],
      uploadedVideos: data.uploadedVideos || [],
      customizations: data.customizations || {},
    };

    // Determine if we're updating or creating
    let existingArtKey = null;
    if (data.id) {
      existingArtKey = await prisma.artKey.findUnique({
        where: { id: data.id },
      });
    } else if (data.public_token) {
      existingArtKey = await prisma.artKey.findUnique({
        where: { publicToken: data.public_token },
      });
    } else if (owner_token) {
      existingArtKey = await prisma.artKey.findUnique({
        where: { ownerToken: owner_token },
      });
    }

    let publicToken: string;
    let ownerToken: string;

    if (existingArtKey) {
      // Update existing ArtKey
      // Verify ownership if user is authenticated
      if (authenticatedUser && existingArtKey.ownerId !== authenticatedUser.id) {
        return NextResponse.json(
          { error: 'You do not have permission to edit this ArtKey' },
          { status: 403 }
        );
      }

      publicToken = existingArtKey.publicToken;
      ownerToken = existingArtKey.ownerToken;
      
      await prisma.artKey.update({
        where: { id: existingArtKey.id },
        data: {
          title: artKeyData.title,
          theme: JSON.stringify(artKeyData.theme),
          features: JSON.stringify(artKeyData.features),
          links: JSON.stringify(artKeyData.links),
          spotify: JSON.stringify(artKeyData.spotify),
          featuredVideo: artKeyData.featured_video ? JSON.stringify(artKeyData.featured_video) : null,
          customizations: JSON.stringify(artKeyData.customizations),
          uploadedImages: JSON.stringify(artKeyData.uploadedImages),
          uploadedVideos: JSON.stringify(artKeyData.uploadedVideos),
          // Link to user if authenticated and not already linked
          ...(authenticatedUser && !existingArtKey.ownerId ? { ownerId: authenticatedUser.id } : {}),
        },
      });
    } else {
      // Create new ArtKey
      publicToken = generatePublicToken();
      ownerToken = generateOwnerToken();
      
      // Ensure publicToken is unique
      let attempts = 0;
      while (await prisma.artKey.findUnique({ where: { publicToken } })) {
        publicToken = generatePublicToken();
        attempts++;
        if (attempts > 10) {
          return NextResponse.json(
            { error: 'Failed to generate unique token' },
            { status: 500 }
          );
        }
      }

      await prisma.artKey.create({
        data: {
          publicToken: publicToken,
          ownerToken: ownerToken,
          ownerId: authenticatedUser?.id || null, // Link to authenticated user if available
          title: artKeyData.title,
          theme: JSON.stringify(artKeyData.theme),
          features: JSON.stringify(artKeyData.features),
          links: JSON.stringify(artKeyData.links),
          spotify: JSON.stringify(artKeyData.spotify),
          featuredVideo: artKeyData.featured_video ? JSON.stringify(artKeyData.featured_video) : null,
          customizations: JSON.stringify(artKeyData.customizations),
          uploadedImages: JSON.stringify(artKeyData.uploadedImages),
          uploadedVideos: JSON.stringify(artKeyData.uploadedVideos),
        },
      });
    }

    const baseUrl = getAppBaseUrl();
    const shareUrl = `${baseUrl}/artkey/${publicToken}`;
    const manageUrl = `${baseUrl}/manage/artkey/${ownerToken}`;

    return NextResponse.json({
      success: true,
      id: existingArtKey?.id || 'new',
      public_token: publicToken,
      owner_token: ownerToken, // Only return when saving from editor context
      share_url: shareUrl,
      shareUrl,
      manage_url: manageUrl,
      message: existingArtKey ? 'ArtKey updated successfully' : 'ArtKey created successfully',
    });
  } catch (error: any) {
    console.error('Error saving ArtKey:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save ArtKey' },
      { status: 500 }
    );
  }
}
