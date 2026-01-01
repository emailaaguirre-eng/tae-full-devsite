/**
 * Gelato Print Specs Verification Endpoint (POC)
 * 
 * This endpoint is for testing/verification only.
 * It fetches a Gelato product and logs the print specification structure.
 * 
 * Usage: GET /api/gelato/test-print-specs?productUid=<GELATO_PRODUCT_UID>
 * 
 * Example: /api/gelato/test-print-specs?productUid=cards_pf_a5_pt_350-gsm-coated-silk_cl_4-4_ver
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyGelatoPrintSpecs } from '@/lib/gelatoPrintSpecs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productUid = searchParams.get('productUid');

    if (!productUid) {
      return NextResponse.json(
        { 
          error: 'productUid parameter is required',
          example: '/api/gelato/test-print-specs?productUid=cards_pf_a5_pt_350-gsm-coated-silk_cl_4-4_ver'
        },
        { status: 400 }
      );
    }

    // Verify Gelato API key is configured
    if (!process.env.GELATO_API_KEY) {
      return NextResponse.json(
        { error: 'GELATO_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Run verification
    const result = await verifyGelatoPrintSpecs(productUid);

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error || 'Failed to verify print specs',
          productUid 
        },
        { status: 500 }
      );
    }

    // Return verification results
    return NextResponse.json({
      success: true,
      productUid,
      summary: result.summary,
      normalizedSpec: result.normalizedSpec,
      // Include raw response for inspection (may be large)
      rawResponse: result.rawResponse,
      note: 'This is a POC verification endpoint. Check server logs for detailed parsing information.',
    });
  } catch (error: any) {
    console.error('[TestPrintSpecs] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        note: 'Check server console logs for detailed error information.'
      },
      { status: 500 }
    );
  }
}

