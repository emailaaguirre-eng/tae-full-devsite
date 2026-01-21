/**
 * Order Status Lookup API
 * POST /api/order-status - Look up order by email and order number
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb, orders, orderItems, eq, and } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { email, orderNumber } = body;

    if (!email || !orderNumber) {
      return NextResponse.json(
        { success: false, error: 'Email and order number are required' },
        { status: 400 }
      );
    }

    // Find the order
    const order = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.orderNumber, orderNumber.trim().toUpperCase()),
          eq(orders.customerEmail, email.trim().toLowerCase())
        )
      )
      .get();

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found. Please check your email and order number.' },
        { status: 404 }
      );
    }

    // Get order items
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id))
      .all();

    // Format the response (hide sensitive internal data)
    const statusInfo = getStatusInfo(order.status || 'pending', order.gelatoStatus);

    return NextResponse.json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        statusLabel: statusInfo.label,
        statusDescription: statusInfo.description,
        statusColor: statusInfo.color,
        total: order.total,
        createdAt: order.createdAt,
        // Tracking info (if shipped)
        tracking: order.trackingNumber ? {
          number: order.trackingNumber,
          url: order.trackingUrl,
          carrier: order.carrier,
        } : null,
        // Gelato production status
        gelatoStatus: order.gelatoStatus,
        // Items summary
        items: items.map(item => ({
          name: item.itemName,
          quantity: item.quantity,
          price: item.unitPrice,
        })),
        itemCount: items.length,
      },
    });
  } catch (error) {
    console.error('[Order Status API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to look up order' },
      { status: 500 }
    );
  }
}

function getStatusInfo(status: string, gelatoStatus: string | null): { label: string; description: string; color: string } {
  // Map internal + Gelato status to customer-friendly info
  const statusMap: Record<string, { label: string; description: string; color: string }> = {
    'pending': {
      label: 'Order Received',
      description: 'We\'ve received your order and it\'s being processed.',
      color: 'yellow',
    },
    'paid': {
      label: 'Payment Confirmed',
      description: 'Your payment has been confirmed. Your order will enter production soon.',
      color: 'blue',
    },
    'processing': {
      label: 'In Production',
      description: 'Your order is being printed and prepared for shipping.',
      color: 'blue',
    },
    'shipped': {
      label: 'Shipped',
      description: 'Your order is on its way! Check tracking for delivery updates.',
      color: 'purple',
    },
    'delivered': {
      label: 'Delivered',
      description: 'Your order has been delivered. Enjoy your purchase!',
      color: 'green',
    },
    'completed': {
      label: 'Completed',
      description: 'Your order is complete. Thank you for your purchase!',
      color: 'green',
    },
    'cancelled': {
      label: 'Cancelled',
      description: 'This order has been cancelled. Contact us if you have questions.',
      color: 'red',
    },
  };

  // Check Gelato status for more detail
  if (gelatoStatus) {
    const gelatoLower = gelatoStatus.toLowerCase();
    if (gelatoLower.includes('ship') || gelatoLower.includes('transit')) {
      return statusMap['shipped'];
    }
    if (gelatoLower.includes('produc') || gelatoLower.includes('print')) {
      return statusMap['processing'];
    }
    if (gelatoLower.includes('deliver')) {
      return statusMap['delivered'];
    }
  }

  return statusMap[status] || statusMap['pending'];
}
