import { NextResponse } from 'next/server';

// This would connect to your database
// For now, using in-memory storage as example

let artkeyConfigs: Record<string, any> = {};

/**
 * GET /api/artkey/config?productId=xxx
 * Retrieve ArtKey configuration for a product
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId');

  if (!productId) {
    return NextResponse.json(
      { error: 'Product ID required' },
      { status: 400 }
    );
  }

  const config = artkeyConfigs[productId] || null;

  return NextResponse.json({
    success: true,
    config,
  });
}

/**
 * POST /api/artkey/config
 * Save ArtKey configuration for a product
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, config } = body;

    if (!productId || !config) {
      return NextResponse.json(
        { error: 'Product ID and config required' },
        { status: 400 }
      );
    }

    // Validate config structure
    const validatedConfig = {
      enabled: config.enabled ?? true,
      productId,
      productName: config.productName || 'Product',
      
      // Hotspot configuration
      hotspot: {
        x: config.hotspot?.x || '50%',
        y: config.hotspot?.y || '50%',
        size: config.hotspot?.size || '40px',
      },
      
      // Product information (for mini ArtKey display)
      productInfo: {
        description: config.productInfo?.description || '',
        price: config.productInfo?.price || '',
        image: config.productInfo?.image || '',
        category: config.productInfo?.category || '',
      },
      
      // ArtKey content (matches WordPress plugin structure)
      artKeyData: {
        title: config.artKeyData?.title || 'Sample ArtKey',
        
        theme: {
          template: config.artKeyData?.theme?.template || 'aurora',
          bg_color: config.artKeyData?.theme?.bg_color || '#F6F7FB',
          bg_image_url: config.artKeyData?.theme?.bg_image_url || '',
          text_color: config.artKeyData?.theme?.text_color || '#111111',
          title_color: config.artKeyData?.theme?.title_color || '#667eea',
          button_color: config.artKeyData?.theme?.button_color || '#667eea',
          button_gradient: config.artKeyData?.theme?.button_gradient || '',
          font: config.artKeyData?.theme?.font || 'system',
        },
        
        links: config.artKeyData?.links || [],
        
        features: {
          enable_gallery: config.artKeyData?.features?.enable_gallery ?? true,
          enable_video: config.artKeyData?.features?.enable_video ?? true,
          show_guestbook: config.artKeyData?.features?.show_guestbook ?? true,
          allow_img_uploads: config.artKeyData?.features?.allow_img_uploads ?? true,
          allow_vid_uploads: config.artKeyData?.features?.allow_vid_uploads ?? false,
        },
        
        spotify: {
          url: config.artKeyData?.spotify?.url || '',
        },
        
        gallery_images: config.artKeyData?.gallery_images || [],
        gallery_videos: config.artKeyData?.gallery_videos || [],
      },
    };

    // Save to database (or in-memory for now)
    artkeyConfigs[productId] = validatedConfig;

    return NextResponse.json({
      success: true,
      message: 'ArtKey configuration saved',
      config: validatedConfig,
    });
  } catch (error) {
    console.error('Error saving ArtKey config:', error);
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/artkey/config?productId=xxx
 * Remove ArtKey configuration for a product
 */
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId');

  if (!productId) {
    return NextResponse.json(
      { error: 'Product ID required' },
      { status: 400 }
    );
  }

  delete artkeyConfigs[productId];

  return NextResponse.json({
    success: true,
    message: 'ArtKey configuration removed',
  });
}

