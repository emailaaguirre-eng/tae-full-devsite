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

    // Check if product requires QR code
    let requiresQR = false;
    let qrCodeUrl = null;
    
    if (product_id) {
      try {
        // Fetch product from WooCommerce to check meta
        const wcKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
        const wcSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;
        
        if (wcKey && wcSecret) {
          const wcAuth = Buffer.from(`${wcKey}:${wcSecret}`).toString('base64');
          const productResponse = await fetch(`${wpBase}/wp-json/wc/v3/products/${product_id}`, {
            headers: {
              'Authorization': `Basic ${wcAuth}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (productResponse.ok) {
            const product = await productResponse.json();
            // Check for meta field indicating QR code requirement
            // Common field names: _requires_qr_code, _product_requires_qr, requires_qr_code
            const meta = product.meta_data || [];
            const qrMeta = meta.find((m: any) => 
              m.key === '_requires_qr_code' || 
              m.key === '_product_requires_qr' || 
              m.key === 'requires_qr_code' ||
              m.key === 'product_requires_qr_code'
            );
            
            requiresQR = qrMeta?.value === 'yes' || qrMeta?.value === true || qrMeta?.value === '1' || qrMeta?.value === 1;
          }
        }
      } catch (err) {
        console.warn('Could not check product QR requirement:', err);
        // Continue without QR code if check fails
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
        requires_qr: requiresQR,
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

    // Generate QR code if product requires it
    if (requiresQR && result.token) {
      try {
        const qrResponse = await fetch(`${baseUrl}/api/artkey/qr?artKeyId=${result.token}&format=wordpress`, {
          method: 'GET',
        });
        
        if (qrResponse.ok) {
          const qrData = await qrResponse.json();
          qrCodeUrl = qrData.qrCodeUrl;
          
          // Update ArtKey with QR code URL
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
        }
      } catch (err) {
        console.warn('Failed to generate QR code:', err);
        // Continue even if QR generation fails
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
