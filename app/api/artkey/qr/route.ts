import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { Buffer } from 'buffer';

/**
 * QR Code Generation API for ArtKeys
 * Uses qrcode library (similar to endroid/qr-code in WordPress)
 * 
 * GET /api/artkey/qr?url=https://your-artkey-url.com&size=400
 * POST /api/artkey/qr (with body: { url, size, artKeyId })
 * 
 * Returns: Base64 data URL or can upload to WordPress and return URL
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const size = parseInt(searchParams.get('size') || '400');
    const artKeyId = searchParams.get('artKeyId');
    const formatParam = searchParams.get('format') || 'dataurl'; // 'dataurl' or 'wordpress'
    const format: 'dataurl' | 'wordpress' = (formatParam === 'wordpress' ? 'wordpress' : 'dataurl');

    if (!url && !artKeyId) {
      return NextResponse.json(
        { error: 'URL or artKeyId is required' },
        { status: 400 }
      );
    }

    // If artKeyId provided, construct the share URL
    let qrUrl = url;
    if (artKeyId && !url) {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                     process.env.VERCEL_URL || 
                     'http://localhost:3000';
      qrUrl = `${baseUrl}/artkey/${artKeyId}`;
    }

    // Generate QR code
    const result = await generateQRCode(qrUrl!, size, format);

    return NextResponse.json({
      success: true,
      qrCodeUrl: result.url,
      url: qrUrl,
      size: size,
      format: format,
    });
  } catch (error: any) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, size = 400, artKeyId, format = 'dataurl' } = body;

    if (!url && !artKeyId) {
      return NextResponse.json(
        { error: 'URL or artKeyId is required' },
        { status: 400 }
      );
    }

    // If artKeyId provided, construct the share URL
    let qrUrl = url;
    if (artKeyId && !url) {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                     process.env.VERCEL_URL || 
                     'http://localhost:3000';
      qrUrl = `${baseUrl}/artkey/${artKeyId}`;
    }

    const result = await generateQRCode(qrUrl!, size, format);

    return NextResponse.json({
      success: true,
      qrCodeUrl: result.url,
      url: qrUrl,
      size: size,
      format: format,
    });
  } catch (error: any) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}

/**
 * Generate QR Code using qrcode library
 * Matches endroid/qr-code functionality from WordPress:
 * - Size: 400 (default, configurable)
 * - Margin: 10 (4 modules)
 * - Error Correction: Medium
 * - Encoding: UTF-8
 * 
 * @param url - URL to encode in QR code
 * @param size - Size in pixels (default: 400)
 * @param format - 'dataurl' (base64) or 'wordpress' (upload to WordPress)
 */
async function generateQRCode(
  url: string, 
  size: number = 400, 
  format: 'dataurl' | 'wordpress' = 'dataurl'
): Promise<{ url: string; buffer?: Buffer }> {
  try {
    // Generate QR code as buffer (PNG)
    // Options match endroid/qr-code settings:
    // - errorCorrectionLevel: 'M' (Medium) - matches ErrorCorrectionLevelMedium
    // - margin: 1 (4 modules) - matches setMargin(10) in endroid
    // - width: size - matches setSize(400)
    const qrBuffer = await QRCode.toBuffer(url, {
      errorCorrectionLevel: 'M', // Medium error correction
      type: 'png',
      width: size,
      margin: 1, // 4 modules (1 * 4 = 4 modules, similar to margin 10 in endroid)
      color: {
        dark: '#000000', // Black foreground
        light: '#FFFFFF', // White background
      },
    });

    if (format === 'wordpress') {
      // Upload to WordPress Media Library
      const wpUrl = await uploadQRToWordPress(qrBuffer, url);
      return { url: wpUrl, buffer: qrBuffer };
    } else {
      // Return as data URL (base64)
      const base64 = qrBuffer.toString('base64');
      const dataUrl = `data:image/png;base64,${base64}`;
      return { url: dataUrl, buffer: qrBuffer };
    }
  } catch (error: any) {
    throw new Error(`QR code generation failed: ${error.message}`);
  }
}

/**
 * Upload QR code image to WordPress Media Library
 */
async function uploadQRToWordPress(buffer: Buffer, originalUrl: string): Promise<string> {
  const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.NEXT_PUBLIC_WOOCOMMERCE_URL;
  
  if (!WP_URL) {
    throw new Error('WordPress URL not configured');
  }

  const username = process.env.WORDPRESS_USERNAME;
  const appPassword = process.env.WORDPRESS_APP_PASSWORD;

  if (!username || !appPassword) {
    throw new Error('WordPress credentials not configured. Use dataurl format instead.');
  }

  // Create filename from URL hash
  const urlHash = Buffer.from(originalUrl).toString('base64').substring(0, 16);
  const filename = `artkey-qr-${urlHash}.png`;

  // Create form data
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(buffer)], { type: 'image/png' });
  formData.append('file', blob, filename);

  // Upload to WordPress
  const auth = Buffer.from(`${username}:${appPassword}`).toString('base64');
  const response = await fetch(`${WP_URL}/wp-json/wp/v2/media`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`WordPress upload failed: ${response.status}`);
  }

  const data = await response.json();
  return data.source_url || data.media_details?.sizes?.full?.source_url || data.guid?.rendered;
}

