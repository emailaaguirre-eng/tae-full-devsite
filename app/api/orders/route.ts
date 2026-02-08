/**
 * Orders API
 * Copyright (c) 2026 B&D Servicing LLC. All rights reserved.
 *
 * POST /api/orders — Create a new order on Printful
 * Supports both draft and confirmed orders.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createPrintfulOrder,
  type PrintfulOrderRequest,
} from '@/lib/printful';

// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { confirm, ...orderData } = body as { confirm?: boolean } & PrintfulOrderRequest;

    // Validate required fields
    if (!orderData.recipient) {
      return NextResponse.json(
        { success: false, error: 'Recipient / shipping address is required' },
        { status: 400 }
      );
    }

    if (!orderData.items || orderData.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one item is required' },
        { status: 400 }
      );
    }

    // Validate each item has required fields
    for (const item of orderData.items) {
      if (!item.variant_id) {
        return NextResponse.json(
          { success: false, error: 'Each item must have a variant_id (Printful variant)' },
          { status: 400 }
        );
      }
      if (!item.files || item.files.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Each item must have at least one print file' },
          { status: 400 }
        );
      }
      // Validate file URLs are accessible
      for (const file of item.files) {
        if (!file.url || !file.url.startsWith('http')) {
          return NextResponse.json(
            { success: false, error: 'Each file must have a valid public URL' },
            { status: 400 }
          );
        }
      }
    }

    // Create order — confirm immediately or leave as draft
    const result = await createPrintfulOrder(orderData, { confirm: !!confirm });

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
