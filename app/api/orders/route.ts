/**
 * Orders API
 * Copyright (c) 2026 B&D Servicing LLC. All rights reserved.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createDraftOrder, submitOrder, type GelatoOrderRequest } from '@/lib/gelato/orderService';

// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderType, ...orderData } = body as { orderType: 'draft' | 'order' } & GelatoOrderRequest;

    // Validate required fields
    if (!orderData.orderReferenceId) {
      return NextResponse.json(
        { success: false, error: 'Order reference ID is required' },
        { status: 400 }
      );
    }

    if (!orderData.items || orderData.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one item is required' },
        { status: 400 }
      );
    }

    if (!orderData.shippingAddress) {
      return NextResponse.json(
        { success: false, error: 'Shipping address is required' },
        { status: 400 }
      );
    }

    // Validate each item has required fields
    for (const item of orderData.items) {
      if (!item.productUid) {
        return NextResponse.json(
          { success: false, error: 'Each item must have a productUid' },
          { status: 400 }
        );
      }
      if (!item.files || item.files.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Each item must have at least one file' },
          { status: 400 }
        );
      }
      // Validate file URLs are accessible
      for (const file of item.files) {
        if (!file.url || !file.url.startsWith('http')) {
          return NextResponse.json(
            { success: false, error: 'Each file must have a valid URL' },
            { status: 400 }
          );
        }
      }
    }

    // Create order based on type
    let result;
    if (orderType === 'order') {
      result = await submitOrder(orderData);
    } else {
      result = await createDraftOrder(orderData);
    }

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
    console.error('Order creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
