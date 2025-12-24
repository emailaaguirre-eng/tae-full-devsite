import { NextResponse } from 'next/server';

/**
 * Demo ArtKey Management API
 * Create, list, and manage demo ArtKeys for testing and sales demos
 */

// In-memory storage for demos (in production, use database or WordPress)
const demosStorage = new Map<string, any>();

interface Demo {
  id: string;
  token: string;
  title: string;
  description?: string;
  artKeyData: any;
  shareUrl: string;
  qrCodeUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * POST - Create a new demo ArtKey
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, artKeyData } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Generate unique token (12 hex characters for shorter URLs)
    const token = Array.from(crypto.getRandomValues(new Uint8Array(6)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                 process.env.VERCEL_URL || 
                 'http://localhost:3000';

    // Create ArtKey using the store API
    let artKeyToken = token;
    let shareUrl = `${baseUrl}/art-key/${token}`;
    let qrCodeUrl: string | undefined;

    try {
      // Store the ArtKey
      const storeResponse = await fetch(`${baseUrl}/api/artkey/store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artKeyData: artKeyData || {
            title: title,
            description: description,
            demo: true,
            createdAt: new Date().toISOString(),
          },
        }),
      });

      if (storeResponse.ok) {
        const storeData = await storeResponse.json();
        artKeyToken = storeData.artKey.token;
        shareUrl = storeData.artKey.shareUrl;
        qrCodeUrl = storeData.artKey.qrCodeUrl;
      }
    } catch (error) {
      console.error('Error storing ArtKey:', error);
      // Continue with demo creation even if ArtKey store fails
    }

    // Generate QR code if not already generated
    if (!qrCodeUrl) {
      try {
        const qrResponse = await fetch(`${baseUrl}/api/artkey/qr`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: shareUrl,
            size: 400,
            format: 'dataurl',
          }),
        });

        if (qrResponse.ok) {
          const qrData = await qrResponse.json();
          qrCodeUrl = qrData.qrCodeUrl;
        }
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    }

    // Create demo record
    const demo: Demo = {
      id: `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      token: artKeyToken,
      title: title,
      description: description,
      artKeyData: artKeyData || { title, description, demo: true },
      shareUrl: shareUrl,
      qrCodeUrl: qrCodeUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    demosStorage.set(demo.id, demo);

    return NextResponse.json({
      success: true,
      demo: {
        id: demo.id,
        token: demo.token,
        title: demo.title,
        description: demo.description,
        shareUrl: demo.shareUrl,
        qrCodeUrl: demo.qrCodeUrl,
        createdAt: demo.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error creating demo:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create demo' },
      { status: 500 }
    );
  }
}

/**
 * GET - List all demos
 */
export async function GET() {
  try {
    const demos = Array.from(demosStorage.values())
      .map(demo => ({
        id: demo.id,
        token: demo.token,
        title: demo.title,
        description: demo.description,
        shareUrl: demo.shareUrl,
        qrCodeUrl: demo.qrCodeUrl,
        createdAt: demo.createdAt,
        updatedAt: demo.updatedAt,
      }))
      .sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    // Include hardcoded demo if it doesn't exist in storage
    const hardcodedDemo = {
      id: '1',
      token: '691e3d09ef58e',
      title: 'Holiday Greeting Card Demo',
      shareUrl: '/art-key/691e3d09ef58e',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const allDemos = demos.find(d => d.token === hardcodedDemo.token) 
      ? demos 
      : [hardcodedDemo, ...demos];

    return NextResponse.json({
      success: true,
      demos: allDemos,
    });
  } catch (error: any) {
    console.error('Error listing demos:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list demos' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a demo
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Demo ID is required' },
        { status: 400 }
      );
    }

    if (id === '1') {
      return NextResponse.json(
        { error: 'Cannot delete the default demo' },
        { status: 400 }
      );
    }

    if (!demosStorage.has(id)) {
      return NextResponse.json(
        { error: 'Demo not found' },
        { status: 404 }
      );
    }

    demosStorage.delete(id);

    return NextResponse.json({
      success: true,
      message: 'Demo deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting demo:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete demo' },
      { status: 500 }
    );
  }
}

