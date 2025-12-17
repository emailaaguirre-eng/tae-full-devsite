import { NextRequest, NextResponse } from 'next/server';

/**
 * ArtKey Save API
 * Proxies to WordPress REST API to save ArtKey data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, product_id } = body;

    if (!data) {
      return NextResponse.json(
        { error: 'ArtKey data is required' },
        { status: 400 }
      );
    }

    const wpBase = process.env.WP_API_BASE;
    const wpUser = process.env.WP_APP_USER;
    const wpPass = process.env.WP_APP_PASS;

    if (!wpBase || !wpUser || !wpPass) {
      return NextResponse.json(
        { error: 'WordPress API credentials not configured' },
        { status: 500 }
      );
    }

    const auth = Buffer.from(`${wpUser}:${wpPass}`).toString('base64');

    // Forward to WordPress REST API
    const wpResponse = await fetch(`${wpBase}/wp-json/artkey/v1/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        data: { ...data, product_id },
        product_id,
      }),
    });

    if (!wpResponse.ok) {
      const error = await wpResponse.json().catch(() => ({ message: 'Save failed' }));
      return NextResponse.json(
        { error: error.message || 'Save failed' },
        { status: wpResponse.status }
      );
    }

    const result = await wpResponse.json();
    
    // Build share URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   process.env.VERCEL_URL || 
                   'http://localhost:3000';
    const shareUrl = `${baseUrl}/art-key/${result.token}`;

    return NextResponse.json({
      success: true,
      id: result.id,
      token: result.token,
      share_url: shareUrl,
      shareUrl,
    });
  } catch (error: any) {
    console.error('Error saving ArtKey:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save ArtKey' },
      { status: 500 }
    );
  }
}
