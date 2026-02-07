/**
 * Shipping Quote API
 * Copyright (c) 2026 B&D Servicing LLC. All rights reserved.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getShippingQuote } from '@/lib/gelato/orderService';

// POST /api/orders/shipping-quote - Get shipping options and pricing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productUid, quantity, country } = body;

    if (!productUid) {
      return NextResponse.json(
        { success: false, error: 'Product UID is required' },
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

    const result = await getShippingQuote(productUid, quantity, country);

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
    console.error('Shipping quote error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get shipping quote' },
      { status: 500 }
    );
  }
}
