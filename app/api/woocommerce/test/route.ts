import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/woocommerce';

/**
 * Test WooCommerce API connection
 * GET /api/woocommerce/test
 */
export async function GET() {
  try {
    const result = await testConnection();
    
    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}

