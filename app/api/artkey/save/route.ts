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

    const wpBase = process.env.WP_API_BASE || process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.NEXT_WORDPRESS_URL;
    const wpUser = process.env.WP_APP_USER;
    const wpPass = process.env.WP_APP_PASS;

    console.log('[ARTKEY SAVE] WP Base:', wpBase);
    console.log('[ARTKEY SAVE] WP User:', wpUser);
    console.log('[ARTKEY SAVE] WP Pass length:', wpPass?.length);

    // If WordPress credentials not configured, save to in-memory store for demos
    if (!wpBase || !wpUser || !wpPass) {
      console.log('[ARTKEY SAVE] WordPress not configured, using demo mode');
      
      // Use the existing token or generate one
      const token = data.token || '691e3d09ef58e';
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                     process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                     'http://localhost:3000';
      const shareUrl = `${baseUrl}/art-key/artkey-session-${token}`;
      
      return NextResponse.json({
        success: true,
        id: `demo-${token}`,
        token: token,
        share_url: shareUrl,
        shareUrl,
        message: 'ArtKey saved in demo mode (no WordPress)',
      });
    }

    // Remove any spaces from password (WordPress app passwords have spaces but we need to remove them)
    const cleanPass = wpPass.replace(/\s+/g, '');
    const auth = Buffer.from(`${wpUser}:${cleanPass}`).toString('base64');

    // Check if product requires QR code (only for cards, invitations, postcards)
    let requiresQR = false;
    let qrCodeUrl = null;

    if (product_id) {
      try {
        // Fetch product info to check if it requires QR
        const productRes = await fetch(`${wpBase}/wp-json/wc/v3/products/${product_id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
        });

        if (productRes.ok) {
          const product = await productRes.json();
          const productName = (product.name || '').toLowerCase();
          const productCategories = (product.categories || []).map((cat: any) => cat.name?.toLowerCase() || '').join(' ');
          const productTags = (product.tags || []).map((tag: any) => tag.name?.toLowerCase() || '').join(' ');
          const allText = `${productName} ${productCategories} ${productTags}`;
          
          requiresQR = 
            allText.includes('card') || 
            allText.includes('invitation') || 
            allText.includes('postcard') ||
            product.meta_data?.some((meta: any) => 
              meta.key === '_requires_qr_code' && meta.value === 'yes'
            );
        }
      } catch (err) {
        console.warn('Failed to fetch product info for QR check:', err);
        // Default to false if we can't determine
      }
    }

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
        requires_qr: requiresQR, // Only true for cards/invitations/postcards
      }),
    });

    if (!wpResponse.ok) {
      const errorText = await wpResponse.text();
      console.error('[ARTKEY SAVE] WordPress error response:', errorText);
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { message: errorText || 'Save failed' };
      }
      return NextResponse.json(
        { 
          error: error.message || 'Save failed',
          details: error,
          status: wpResponse.status,
          url: `${wpBase}/wp-json/artkey/v1/save`
        },
        { status: wpResponse.status }
      );
    }

    const result = await wpResponse.json();
    
    // Build share URL - unique URL for each ArtKey
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   process.env.VERCEL_URL || 
                   'http://localhost:3000';
    const shareUrl = `${baseUrl}/art-key/${result.token}`;

    // Only generate QR code if product requires it (cards/invitations/postcards)
    if (requiresQR && result.token) {
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
