import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAppBaseUrl, getWpApiBase, getWpSiteBase } from '@/lib/wp';

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

    const wpSiteBase = getWpSiteBase();
    const wpApiBase = getWpApiBase();

    // Remove any spaces from password (WordPress app passwords have spaces but we need to remove them)
    const cleanPass = wpPass.replace(/\s+/g, '');
    const auth = Buffer.from(`${wpUser}:${cleanPass}`).toString('base64');

    const ensureToken = (incoming: any) => {
      const t = incoming?.token;
      if (typeof t === 'string' && t.length >= 8) return t;
      return crypto.randomBytes(16).toString('hex'); // 32-char hex
    };

    // Check if product requires QR code (only for cards, invitations, postcards)
    let requiresQR = false;
    let qrCodeUrl = null;

    if (product_id) {
      try {
        // Fetch product info to check if it requires QR
        const productRes = await fetch(`${wpApiBase}/wc/v3/products/${product_id}`, {
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

    const token = ensureToken(data);
    const dataWithToken = { ...data, token, product_id };

    // Helper: fallback save via core WP REST (avoids custom namespace blocks)
    const saveViaWpV2 = async () => {
      // Try to find existing ArtKey post by token (requires auth since CPT is non-public)
      let existingId: number | null = null;
      try {
        const listRes = await fetch(`${wpApiBase}/wp/v2/artkey?per_page=100&status=publish`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`,
          },
        });
        if (listRes.ok) {
          const posts = await listRes.json();
          for (const p of posts) {
            const postToken = p?.meta?._artkey_token;
            if (postToken === token) {
              existingId = p.id;
              break;
            }
          }
        }
      } catch {
        // ignore lookup failures; we'll create a new post
      }

      const endpoint = existingId
        ? `${wpApiBase}/wp/v2/artkey/${existingId}`
        : `${wpApiBase}/wp/v2/artkey`;

      const saveRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`,
        },
        body: JSON.stringify({
          status: 'publish',
          title: `ArtKey ${String(token).slice(0, 8)}`,
          meta: {
            _artkey_token: token,
            _artkey_json: JSON.stringify(dataWithToken),
            _artkey_template: data?.theme?.template || '',
          },
        }),
      });

      if (!saveRes.ok) {
        const errorText = await saveRes.text().catch(() => '');
        return {
          ok: false,
          status: saveRes.status,
          errorText,
          url: endpoint,
        } as const;
      }

      const saved = await saveRes.json();
      return { ok: true, id: saved.id, token } as const;
    };

    // 1) Try custom endpoint (if available)
    let result: any = null;
    const customRes = await fetch(`${wpApiBase}/artkey/v1/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        data: dataWithToken,
        product_id,
        requires_qr: requiresQR,
      }),
    });

    if (customRes.ok) {
      result = await customRes.json();
    } else {
      const errorText = await customRes.text().catch(() => '');
      let parsed: any = null;
      try {
        parsed = JSON.parse(errorText);
      } catch {
        parsed = null;
      }

      const isNoRoute =
        customRes.status === 404 &&
        (parsed?.code === 'rest_no_route' || errorText.includes('rest_no_route'));

      if (isNoRoute) {
        console.warn('[ARTKEY SAVE] Custom endpoint not available, falling back to wp/v2');
        const fallback = await saveViaWpV2();
        if (!fallback.ok) {
          return NextResponse.json(
            {
              error: 'Save failed (fallback wp/v2 also failed)',
              status: fallback.status,
              details: fallback.errorText,
              url: fallback.url,
            },
            { status: fallback.status }
          );
        }
        result = { id: fallback.id, token: fallback.token };
      } else {
        console.error('[ARTKEY SAVE] WordPress error response:', errorText);
        return NextResponse.json(
          {
            error: parsed?.message || 'Save failed',
            details: parsed || { message: errorText || 'Save failed' },
            status: customRes.status,
            url: `${wpApiBase}/artkey/v1/save`,
          },
          { status: customRes.status }
        );
      }
    }
    
    // Build share URL - unique URL for each ArtKey
    const baseUrl = getAppBaseUrl();
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
            await fetch(`${wpApiBase}/wp/v2/artkey/${result.id}`, {
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
