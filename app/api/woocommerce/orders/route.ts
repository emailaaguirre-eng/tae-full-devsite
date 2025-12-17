import { NextResponse } from 'next/server';
import { getOrder, updateOrderStatus, addOrderNote, updateOrderMeta } from '@/lib/woocommerce';

/**
 * Get order by ID
 * GET /api/woocommerce/orders?id=123
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const order = await getOrder(orderId);
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

/**
 * Update order
 * PUT /api/woocommerce/orders?id=123
 */
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');
    const body = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Update order status if provided
    if (body.status) {
      const updated = await updateOrderStatus(orderId, body.status);
      return NextResponse.json(updated);
    }

    // Update meta data if provided
    if (body.meta_data) {
      const updated = await updateOrderMeta(orderId, body.meta_data);
      return NextResponse.json(updated);
    }

    return NextResponse.json(
      { error: 'No valid update data provided' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

