import { NextResponse } from 'next/server';
import { getWooCommerceProducts } from '@/lib/wordpress';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    // If limit is 0, -1, or not specified with a high value, fetch all products
    const limit = limitParam ? parseInt(limitParam) : 20;
    const category = searchParams.get('category') || undefined;
    const featured = searchParams.get('featured') === 'true';

    // If limit is 100 or more, fetch all products (0 = fetch all)
    const fetchLimit = limit >= 100 ? 0 : limit;
    const products = await getWooCommerceProducts(fetchLimit, category, featured);
    
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error in products API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
