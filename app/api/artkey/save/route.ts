import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDatabase, artKeys, eq, generatePublicToken, generateOwnerToken, generateId, ArtKeyData } from '@/lib/db';
import { getAppBaseUrl } from '@/lib/wp';

/**
 * ArtKey Save API
 * Saves or updates ArtKey data from the editor
 * Creates new ArtKey with public_token and owner_token if not exists
 * Updates existing ArtKey if id or public_token is provided
 */
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { data, product_id, owner_token } = body;

    if (!data) {
      return NextResponse.json(
        { error: 'ArtKey data is required' },
        { status: 400 }
      );
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
      existingArtKey = await db.select().from(artKeys).where(eq(artKeys.id, data.id)).get();
    } else if (data.public_token) {
      existingArtKey = await db.select().from(artKeys).where(eq(artKeys.publicToken, data.public_token)).get();
    } else if (owner_token) {
      existingArtKey = await db.select().from(artKeys).where(eq(artKeys.ownerToken, owner_token)).get();
    }

    let publicToken: string;
    let ownerTokenValue: string;
    const now = new Date().toISOString();

    // Serialize each field as JSON text to match schema columns
    const themeJson = JSON.stringify(artKeyData.theme);
    const featuresJson = JSON.stringify(artKeyData.features);
    const linksJson = JSON.stringify(artKeyData.links);
    const spotifyJson = JSON.stringify(artKeyData.spotify);
    const featuredVideoJson = artKeyData.featured_video ? JSON.stringify(artKeyData.featured_video) : null;
    const customizationsJson = JSON.stringify(artKeyData.customizations);
    const uploadedImagesJson = JSON.stringify(artKeyData.uploadedImages);
    const uploadedVideosJson = JSON.stringify(artKeyData.uploadedVideos);

    if (existingArtKey) {
      // Update existing ArtKey
      publicToken = existingArtKey.publicToken;
      ownerTokenValue = existingArtKey.ownerToken;

      await db.update(artKeys)
        .set({
          title: artKeyData.title,
          theme: themeJson,
          features: featuresJson,
          links: linksJson,
          spotify: spotifyJson,
          featuredVideo: featuredVideoJson,
          customizations: customizationsJson,
          uploadedImages: uploadedImagesJson,
          uploadedVideos: uploadedVideosJson,
          updatedAt: now,
        })
        .where(eq(artKeys.id, existingArtKey.id));
    } else {
      // Create new ArtKey
      publicToken = generatePublicToken();
      ownerTokenValue = generateOwnerToken();

      // Ensure publicToken is unique
      let attempts = 0;
      while (await db.select().from(artKeys).where(eq(artKeys.publicToken, publicToken)).get()) {
        publicToken = generatePublicToken();
        attempts++;
        if (attempts > 10) {
          return NextResponse.json(
            { error: 'Failed to generate unique token' },
            { status: 500 }
          );
        }
      }

      const artKeyId = generateId();

      await db.insert(artKeys).values({
        id: artKeyId,
        publicToken: publicToken,
        ownerToken: ownerTokenValue,
        title: artKeyData.title,
        theme: themeJson,
        features: featuresJson,
        links: linksJson,
        spotify: spotifyJson,
        featuredVideo: featuredVideoJson,
        customizations: customizationsJson,
        uploadedImages: uploadedImagesJson,
        uploadedVideos: uploadedVideosJson,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Persist in-memory SQLite to disk
    await saveDatabase();

    const baseUrl = getAppBaseUrl();
    const shareUrl = `${baseUrl}/artkey/${publicToken}`;
    const manageUrl = `${baseUrl}/manage/artkey/${ownerTokenValue}`;

    return NextResponse.json({
      success: true,
      id: existingArtKey?.id || 'new',
      public_token: publicToken,
      owner_token: ownerTokenValue, // Only return when saving from editor context
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
