import { NextResponse } from 'next/server';

/**
 * POST /api/wordpress/media/upload
 * Upload an image file to WordPress media library
 * Returns the WordPress media URL for use with Gelato
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string || 'Uploaded Image';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Get WordPress API credentials
    const wpApiBase = process.env.WP_API_BASE || 
                     (process.env.NEXT_PUBLIC_WORDPRESS_URL 
                       ? `${process.env.NEXT_PUBLIC_WORDPRESS_URL}/wp-json` 
                       : null);
    const wpAppUser = process.env.WP_APP_USER;
    const wpAppPass = process.env.WP_APP_PASS;

    if (!wpApiBase || !wpAppUser || !wpAppPass) {
      return NextResponse.json(
        { error: 'WordPress API credentials not configured' },
        { status: 500 }
      );
    }

    // Convert file to base64 for WordPress REST API
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const base64Data = `data:${file.type};base64,${base64}`;

    // Upload to WordPress media library via REST API
    const auth = Buffer.from(`${wpAppUser}:${wpAppPass}`).toString('base64');
    
    const uploadResponse = await fetch(`${wpApiBase}/wp/v2/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Disposition': `attachment; filename="${file.name}"`,
      },
      body: JSON.stringify({
        title: title,
        content: base64Data,
        status: 'inherit',
      }),
    });

    if (!uploadResponse.ok) {
      // Try alternative method: multipart form data
      const formData2 = new FormData();
      formData2.append('file', file);
      formData2.append('title', title);

      const uploadResponse2 = await fetch(`${wpApiBase}/wp/v2/media`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
        },
        body: formData2,
      });

      if (!uploadResponse2.ok) {
        const errorText = await uploadResponse2.text();
        console.error('WordPress upload failed:', errorText);
        return NextResponse.json(
          { error: 'Failed to upload to WordPress media library' },
          { status: 500 }
        );
      }

      const mediaData = await uploadResponse2.json();
      return NextResponse.json({
        success: true,
        id: mediaData.id,
        url: mediaData.source_url || mediaData.guid?.rendered || mediaData.url,
        title: mediaData.title?.rendered || title,
      });
    }

    const mediaData = await uploadResponse.json();
    
    return NextResponse.json({
      success: true,
      id: mediaData.id,
      url: mediaData.source_url || mediaData.guid?.rendered || mediaData.url,
      title: mediaData.title?.rendered || title,
    });
  } catch (error: any) {
    console.error('Error uploading to WordPress:', error);
    return NextResponse.json(
      { error: 'Failed to upload image', details: error.message },
      { status: 500 }
    );
  }
}

