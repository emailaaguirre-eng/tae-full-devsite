import { NextResponse } from 'next/server';

/**
 * Get product by ID
 * GET /api/woocommerce/products/[id]
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const WC_URL = process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.NEXT_WORDPRESS_URL;
    const WC_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY;
    const WC_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET;

    if (!WC_URL || !WC_KEY || !WC_SECRET) {
      return NextResponse.json(
        { error: 'WooCommerce API not configured' },
        { status: 500 }
      );
    }

    const authString = Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString('base64');

    const normalizeWpSiteBase = (input: string) => {
      const trimmed = input.trim().replace(/\/$/, '');
      const idx = trimmed.indexOf('/wp-json');
      return idx >= 0 ? trimmed.slice(0, idx) : trimmed;
    };
    const wcApiBase = `${normalizeWpSiteBase(WC_URL)}/wp-json`;

    const response = await fetch(`${wcApiBase}/wc/v3/products/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const product = await response.json();
    
    // Determine if product requires QR code (cards, invitations, postcards)
    const productName = (product.name || '').toLowerCase();
    const productCategories = (product.categories || []).map((cat: any) => cat.name?.toLowerCase() || '').join(' ');
    const productTags = (product.tags || []).map((tag: any) => tag.name?.toLowerCase() || '').join(' ');
    const allText = `${productName} ${productCategories} ${productTags}`;
    
    const requiresQR = 
      allText.includes('card') || 
      allText.includes('invitation') || 
      allText.includes('postcard') ||
      product.meta_data?.some((meta: any) => 
        meta.key === '_requires_qr_code' && meta.value === 'yes'
      );

    return NextResponse.json({
      ...product,
      requiresQR,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
