/**
 * Create Order API
 * Copyright (c) 2026 B&D Servicing LLC. All rights reserved.
 *
 * POST /api/orders/create
 * Creates a new order on Printful (as a draft by default).
 */

import { NextResponse } from 'next/server';
import {
  createPrintfulOrder,
  type PrintfulOrderRequest,
} from '@/lib/printful';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderData, confirm } = body as {
      orderData: PrintfulOrderRequest;
      confirm?: boolean;
    };

    if (!orderData) {
      return NextResponse.json(
        { success: false, error: 'Missing order data' },
        { status: 400 }
      );
    }

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

    // Validate each item has a variant ID and files
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
      for (const file of item.files) {
        if (!file.url || !file.url.startsWith('http')) {
          return NextResponse.json(
            { success: false, error: 'Each file must have a valid public URL' },
            { status: 400 }
          );
        }
      }
    }

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
    console.error('Error creating Printful order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
