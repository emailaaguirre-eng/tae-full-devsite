import { NextResponse } from 'next/server';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

// TODO: Implement getWooCommerceProducts function in @/lib/wordpress
// This route is currently disabled - use /api/catalog/products instead

export async function GET(request: Request) {
  // This endpoint is deprecated - use /api/catalog/products instead
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. Use /api/catalog/products instead.',
      message: 'WooCommerce integration has been replaced with the unified catalog system.'
    },
    { status: 410 }
  );
}
