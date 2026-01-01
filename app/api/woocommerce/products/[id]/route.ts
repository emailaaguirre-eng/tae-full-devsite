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
    
    // Determine if product requires QR code (cards, invitations, postcards, announcements)
    // Products with quantity > 1 typically need skeleton keys and QR codes
    const productName = (product.name || '').toLowerCase();
    const productCategories = (product.categories || []).map((cat: any) => cat.name?.toLowerCase() || '').join(' ');
    const productTags = (product.tags || []).map((tag: any) => tag.name?.toLowerCase() || '').join(' ');
    const allText = `${productName} ${productCategories} ${productTags}`;
    
    // Check if product requires QR code based on:
    // 1. Product name/categories/tags contain keywords
    // 2. Custom meta field _requires_qr_code
    // 3. Product type or quantity settings (cards/invitations typically have min quantity > 1)
    const hasQRKeywords = 
      allText.includes('card') || 
      allText.includes('invitation') || 
      allText.includes('postcard') ||
      allText.includes('announcement');
    
    const hasQRMeta = product.meta_data?.some((meta: any) => 
      meta.key === '_requires_qr_code' && meta.value === 'yes'
    );
    
    // Check if product has minimum quantity > 1 (typically cards/invitations)
    const minQuantity = product.meta_data?.find((meta: any) => 
      meta.key === '_min_quantity' || meta.key === 'minimum_quantity'
    )?.value;
    const hasMinQuantity = minQuantity && parseInt(minQuantity) > 1;
    
    // Check if product is sold individually (opposite of bulk/quantity products)
    const soldIndividually = product.sold_individually === false || product.sold_individually === 'no';
    
    const requiresQR = hasQRKeywords || hasQRMeta || (hasMinQuantity && soldIndividually);

    return NextResponse.json({
      ...product,
      requiresQR,
      requiresSkeletonKey: requiresQR, // Same requirement for skeleton keys
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
