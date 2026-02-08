/**
 * Shipping Rates API (Printful)
 * Copyright (c) 2026 B&D Servicing LLC. All rights reserved.
 *
 * POST /api/orders/shipping-quote — Get shipping rates from Printful
 */

import { NextRequest, NextResponse } from 'next/server';
import { getShippingRates } from '@/lib/printful';

// POST /api/orders/shipping-quote - Get shipping options and pricing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { variantId, quantity, country, stateCode, zip, city, address1 } = body;

    if (!variantId) {
      return NextResponse.json(
        { success: false, error: 'Printful variant ID (variantId) is required' },
        { status: 400 }
      );
    }

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { success: false, error: 'Valid quantity is required' },
        { status: 400 }
      );
    }

    if (!country) {
      return NextResponse.json(
        { success: false, error: 'Country code is required' },
        { status: 400 }
      );
    }

    const result = await getShippingRates({
      recipient: {
        address1: address1 || '',
        city: city || '',
        country_code: country,
        state_code: stateCode || '',
        zip: zip || '',
      },
      items: [
        {
          variant_id: Number(variantId),
          quantity: Number(quantity),
        },
      ],
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Shipping rate error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get shipping rates' },
      { status: 500 }
    );
  }
}
