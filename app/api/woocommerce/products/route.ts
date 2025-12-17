import { NextResponse } from 'next/server';
import { getProducts, createOrder } from '@/lib/woocommerce';

/**
 * Get products
 * GET /api/woocommerce/products
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const per_page = searchParams.get('per_page') || '20';
    const status = searchParams.get('status') || 'publish';
    const featured = searchParams.get('featured') === 'true';

    const products = await getProducts({
      per_page: parseInt(per_page),
      status,
      featured,
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

/**
 * Create product
 * POST /api/woocommerce/products
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }

    // Build WooCommerce product object
    const wcProduct: any = {
      name: body.name,
      type: body.type || 'simple',
      status: body.status || 'draft',
      description: body.description || '',
      short_description: body.short_description || '',
      sku: body.sku || '',
      price: body.price || body.regular_price || '0',
      regular_price: body.regular_price || body.price || '0',
      stock_status: body.stock_status || 'instock',
      manage_stock: body.manage_stock || false,
    };

    // Add sale price if provided
    if (body.sale_price) {
      wcProduct.sale_price = body.sale_price;
    }

    // Add stock quantity if managing stock
    if (body.manage_stock && body.stock_quantity) {
      wcProduct.stock_quantity = parseInt(body.stock_quantity);
    }

    // Add images
    if (body.images && Array.isArray(body.images)) {
      wcProduct.images = body.images.map((img: string | { src: string }) => ({
        src: typeof img === 'string' ? img : img.src,
      }));
    }

    // Add categories
    if (body.categories && Array.isArray(body.categories)) {
      wcProduct.categories = body.categories;
    }

    // Create product via WooCommerce REST API
    const WC_URL = process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || process.env.NEXT_PUBLIC_WORDPRESS_URL;
    const WC_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY;
    const WC_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET;

    if (!WC_URL || !WC_KEY || !WC_SECRET) {
      return NextResponse.json(
        { error: 'WooCommerce API not configured' },
        { status: 500 }
      );
    }

    const authString = Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString('base64');

    const response = await fetch(`${WC_URL}/wp-json/wc/v3/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(wcProduct),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('WooCommerce API error:', errorData);
      return NextResponse.json(
        { error: `Failed to create product: ${JSON.stringify(errorData)}` },
        { status: response.status }
      );
    }

    const product = await response.json();

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

