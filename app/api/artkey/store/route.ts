import { NextResponse } from 'next/server';

/**
 * ArtKey Storage API
 * Save and retrieve ArtKey designs for reuse
 * 
 * POST /api/artkey/store - Save ArtKey
 * GET /api/artkey/store?userId=xxx - Get user's ArtKeys
 * GET /api/artkey/store?id=xxx - Get specific ArtKey
 */

// In-memory storage (for demo - replace with database in production)
// In production, use: PostgreSQL, MongoDB, or WordPress custom post type
const artKeyStorage = new Map<string, any>();

interface ArtKeyStorage {
  id: string;
  userId?: string;
  sessionId?: string;
  token: string; // 32-char token for shareable URL
  shareUrl: string;
  productId?: string;
  cartItemId?: string;
  artKeyData: any;
  createdAt: string;
  updatedAt: string;
  qrCodeUrl?: string;
}

/**
 * Generate unique token for ArtKey (32 hex characters)
 */
function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * POST - Save ArtKey
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      sessionId,
      productId,
      cartItemId,
      artKeyData,
      existingId, // If updating existing ArtKey
    } = body;

    if (!artKeyData) {
      return NextResponse.json(
        { error: 'ArtKey data is required' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   process.env.VERCEL_URL || 
                   'http://localhost:3000';

    let artKey: ArtKeyStorage;

    if (existingId && artKeyStorage.has(existingId)) {
      // Update existing ArtKey
      artKey = artKeyStorage.get(existingId);
      artKey.artKeyData = artKeyData;
      artKey.updatedAt = new Date().toISOString();
      if (productId) artKey.productId = productId;
      if (cartItemId) artKey.cartItemId = cartItemId;
    } else {
      // Create new ArtKey
      const token = generateToken();
      artKey = {
        id: existingId || `artkey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: userId,
        sessionId: sessionId,
        token: token,
        shareUrl: `${baseUrl}/artkey/${token}`,
        productId: productId,
        cartItemId: cartItemId,
        artKeyData: artKeyData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Generate QR code URL (using qrcode library, similar to endroid/qr-code)
    try {
      // Use dataurl format for immediate use, or 'wordpress' to upload to WordPress
      const qrFormat = process.env.WORDPRESS_USERNAME ? 'wordpress' : 'dataurl';
      const qrResponse = await fetch(`${baseUrl}/api/artkey/qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: artKey.shareUrl,
          size: 400, // Match endroid/qr-code default size
          format: qrFormat,
        }),
      });
      
      if (qrResponse.ok) {
        const qrData = await qrResponse.json();
        artKey.qrCodeUrl = qrData.qrCodeUrl;
      }
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      // Continue without QR code
    }

    // Store ArtKey
    artKeyStorage.set(artKey.id, artKey);

    // Also store by token for easy lookup
    const tokenMap = new Map<string, string>();
    if (typeof (global as any).artKeyTokenMap === 'undefined') {
      (global as any).artKeyTokenMap = tokenMap;
    }
    (global as any).artKeyTokenMap.set(artKey.token, artKey.id);

    return NextResponse.json({
      success: true,
      artKey: {
        id: artKey.id,
        token: artKey.token,
        shareUrl: artKey.shareUrl,
        qrCodeUrl: artKey.qrCodeUrl,
        createdAt: artKey.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error storing ArtKey:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to store ArtKey' },
      { status: 500 }
    );
  }
}

/**
 * GET - Retrieve ArtKey(s)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');

    // Get specific ArtKey by ID
    if (id) {
      const artKey = artKeyStorage.get(id);
      if (!artKey) {
        return NextResponse.json(
          { error: 'ArtKey not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        artKey: artKey,
      });
    }

    // Get ArtKey by token (for shareable URLs)
    if (token) {
      const tokenMap = (global as any).artKeyTokenMap || new Map();
      const artKeyId = tokenMap.get(token);
      if (artKeyId) {
        const artKey = artKeyStorage.get(artKeyId);
        if (artKey) {
          return NextResponse.json({
            success: true,
            artKey: artKey,
          });
        }
      }
      return NextResponse.json(
        { error: 'ArtKey not found' },
        { status: 404 }
      );
    }

    // Get all ArtKeys for user or session
    if (userId || sessionId) {
      const userArtKeys: ArtKeyStorage[] = [];
      for (const [key, artKey] of artKeyStorage.entries()) {
        if ((userId && artKey.userId === userId) || 
            (sessionId && artKey.sessionId === sessionId)) {
          userArtKeys.push(artKey);
        }
      }
      
      // Sort by most recent first
      userArtKeys.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      return NextResponse.json({
        success: true,
        artKeys: userArtKeys.map(ak => ({
          id: ak.id,
          token: ak.token,
          shareUrl: ak.shareUrl,
          qrCodeUrl: ak.qrCodeUrl,
          productId: ak.productId,
          title: ak.artKeyData?.title || 'Untitled ArtKey',
          createdAt: ak.createdAt,
          updatedAt: ak.updatedAt,
        })),
      });
    }

    return NextResponse.json(
      { error: 'ID, token, userId, or sessionId is required' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error retrieving ArtKey:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve ArtKey' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete ArtKey
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ArtKey ID is required' },
        { status: 400 }
      );
    }

    const artKey = artKeyStorage.get(id);
    if (!artKey) {
      return NextResponse.json(
        { error: 'ArtKey not found' },
        { status: 404 }
      );
    }

    // Remove from storage
    artKeyStorage.delete(id);
    
    // Remove from token map
    const tokenMap = (global as any).artKeyTokenMap || new Map();
    if (artKey.token) {
      tokenMap.delete(artKey.token);
    }

    return NextResponse.json({
      success: true,
      message: 'ArtKey deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting ArtKey:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete ArtKey' },
      { status: 500 }
    );
  }
}

