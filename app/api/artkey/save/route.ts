import { NextRequest, NextResponse } from 'next/server';

/**
 * ArtKey Save API
 * Proxies to WordPress REST API to save ArtKey data
 * If product requires QR code, generates and saves it automatically
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

    // Always generate QR code for all ArtKeys
    let requiresQR = true; // Always true - generate QR for everything
    let qrCodeUrl = null;

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
        requires_qr: true, // Always generate QR code
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
    
    // Build share URL - unique URL for each ArtKey
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   process.env.VERCEL_URL || 
                   'http://localhost:3000';
    const shareUrl = `${baseUrl}/art-key/${result.token}`;

    // Always generate QR code for every ArtKey (unique URL per token)
    if (result.token) {
      try {
        // Generate QR code using the unique ArtKey share URL
        const qrResponse = await fetch(`${baseUrl}/api/artkey/qr?url=${encodeURIComponent(shareUrl)}&format=wordpress`, {
          method: 'GET',
        });
        
        if (qrResponse.ok) {
          const qrData = await qrResponse.json();
          qrCodeUrl = qrData.qrCodeUrl;
          
          // Update ArtKey with QR code URL in WordPress
          if (qrCodeUrl && result.id) {
            await fetch(`${wpBase}/wp-json/wp/v2/artkey/${result.id}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`,
              },
              body: JSON.stringify({
                meta: {
                  _artkey_qr_url: qrCodeUrl,
                },
              }),
            }).catch(err => console.warn('Failed to update QR code URL:', err));
          }
        } else {
          console.warn('QR code generation failed:', await qrResponse.text().catch(() => 'Unknown error'));
        }
      } catch (err) {
        console.error('Failed to generate QR code:', err);
        // Continue even if QR generation fails - ArtKey is still saved
      }
    }

    return NextResponse.json({
      success: true,
      id: result.id,
      token: result.token,
      share_url: shareUrl,
      shareUrl,
      qr_code_url: qrCodeUrl,
      requires_qr: requiresQR,
    });
  } catch (error: any) {
    console.error('Error saving ArtKey:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save ArtKey' },
      { status: 500 }
    );
  }
}
