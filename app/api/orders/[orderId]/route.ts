/**
 * Individual Order API
 * Copyright (c) 2026 B&D Servicing LLC. All rights reserved.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrderStatus, cancelOrder } from '@/lib/gelato/orderService';

interface RouteParams {
  params: Promise<{ orderId: string }>;
}

// GET /api/orders/[orderId] - Get order status
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const result = await getOrderStatus(orderId);

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
    console.error('Order status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get order status' },
      { status: 500 }
    );
  }
}

// DELETE /api/orders/[orderId] - Cancel an order
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const result = await cancelOrder(orderId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
    });
  } catch (error) {
    console.error('Order cancellation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel order' },
      { status: 500 }
    );
  }
}
