import { NextRequest, NextResponse } from 'next/server';

/**
 * ArtKey Media Upload API
 * Proxies uploads to WordPress REST API
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Forward to WordPress REST API
    const wpBase = process.env.WP_API_BASE || process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.NEXT_WORDPRESS_URL;
    const wpUser = process.env.WP_APP_USER;
    const wpPass = process.env.WP_APP_PASS;

    if (!wpBase || !wpUser || !wpPass) {
      return NextResponse.json(
        { error: 'WordPress API credentials not configured' },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const auth = Buffer.from(`${wpUser}:${wpPass}`).toString('base64');

    const uploadFormData = new FormData();
    uploadFormData.append('file', new Blob([buffer]), file.name);

    const wpResponse = await fetch(`${wpBase}/wp-json/artkey/v1/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
      body: uploadFormData,
    });

    if (!wpResponse.ok) {
      const error = await wpResponse.text();
      console.error('WordPress upload error:', error);
      return NextResponse.json(
        { error: 'Upload failed' },
        { status: wpResponse.status }
      );
    }

    const result = await wpResponse.json();
    return NextResponse.json({
      url: result.url || result.fileUrl,
      id: result.id,
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
