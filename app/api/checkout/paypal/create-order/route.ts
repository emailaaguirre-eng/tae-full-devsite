/**
 * PayPal Create Order API
 * Copyright (c) 2026 B&D Servicing LLC. All rights reserved.
 *
 * POST /api/checkout/paypal/create-order
 * Creates a PayPal order and returns the order ID for client-side approval.
 *
 * Request body:
 *  - orderId: string (our internal order ID)
 *  OR
 *  - items, subtotal, shippingCost, tax (for ad-hoc orders)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createPayPalOrder,
  buildPurchaseUnit,
  formatPayPalAmount,
} from '@/lib/paypal';
import {
  getDb,
  orders,
  orderItems,
  eq,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    let purchaseUnit;

    // Option A: Create PayPal order from an existing local order
    if (body.orderId) {
      const db = await getDb();

      const order = await db
        .select()
        .from(orders)
        .where(eq(orders.id, body.orderId))
        .get();

      if (!order) {
        return NextResponse.json(
          { success: false, error: 'Order not found' },
          { status: 404 }
        );
      }

      // Get order items for line-item detail
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, body.orderId))
        .all();

      purchaseUnit = buildPurchaseUnit({
        orderId: order.id,
        description: `The Artful Experience - Order ${order.orderNumber}`,
        subtotal: order.subtotal || 0,
        shippingCost: order.shippingCost || 0,
        items: items.map(item => ({
          name: item.itemName,
          quantity: item.quantity || 1,
          price: item.unitPrice || 0,
          sku: item.itemTaeId,
        })),
      });
    }
    // Option B: Ad-hoc order from checkout form
    else if (body.items && body.subtotal !== undefined) {
      purchaseUnit = buildPurchaseUnit({
        orderId: body.referenceId || `tae-${Date.now()}`,
        description: body.description || 'The Artful Experience - Purchase',
        subtotal: body.subtotal,
        shippingCost: body.shippingCost || 0,
        tax: body.tax || 0,
        items: body.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity || 1,
          price: item.price,
          sku: item.sku,
        })),
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Provide orderId or items+subtotal' },
        { status: 400 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://theartfulexperience.com';

    const result = await createPayPalOrder({
      intent: 'CAPTURE',
      purchase_units: [purchaseUnit],
      application_context: {
        brand_name: 'The Artful Experience',
        shipping_preference: body.noShipping ? 'NO_SHIPPING' : 'GET_FROM_FILE',
        user_action: 'PAY_NOW',
        return_url: `${siteUrl}/checkout/success`,
        cancel_url: `${siteUrl}/checkout/cancel`,
      },
    });

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to create PayPal order' },
        { status: 502 }
      );
    }

    // Return the PayPal order ID — the client uses this with the PayPal JS SDK
    return NextResponse.json({
      success: true,
      paypalOrderId: result.data.id,
      status: result.data.status,
      // Approval link for redirect flow (optional)
      approvalLink: result.data.links?.find(l => l.rel === 'approve')?.href,
    });
  } catch (error) {
    console.error('[PayPal Create Order] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create PayPal order' },
      { status: 500 }
    );
  }
}
