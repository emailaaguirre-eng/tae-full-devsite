import { NextResponse } from 'next/server';
import { getWooCommerceProducts } from '@/lib/wordpress';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category') || undefined;
    const featured = searchParams.get('featured') === 'true';

    const products = await getWooCommerceProducts(limit, category, featured);
    
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error in products API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
