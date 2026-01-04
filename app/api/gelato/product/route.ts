import { NextRequest, NextResponse } from 'next/server';
import { getGelatoProduct } from '@/lib/gelato';
import { gelatoDataToPrintSpec } from '@/lib/gelatoPrintSpecParser';

/**
 * GET /api/gelato/product?uid={productUid}
 * Fetches Gelato product data and converts it to PrintSpec format
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json(
        { error: 'uid parameter is required' },
        { status: 400 }
      );
    }

    // Fetch product from Gelato
    const gelatoData = await getGelatoProduct(uid);
    
    if (!gelatoData) {
      return NextResponse.json(
        { error: 'Product not found in Gelato' },
        { status: 404 }
      );
    }

    // Convert to PrintSpec
    const printSpec = gelatoDataToPrintSpec(gelatoData, uid, uid);
    
    if (!printSpec) {
      return NextResponse.json(
        { 
          error: 'Could not parse Gelato product data into PrintSpec',
          rawData: gelatoData // Return raw data for debugging
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      printSpec,
      rawGelatoData: gelatoData, // Include raw data for reference
    });
  } catch (error: any) {
    console.error('[Gelato Product API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch Gelato product',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

