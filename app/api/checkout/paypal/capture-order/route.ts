/**
 * PayPal Capture Order API
 * Copyright (c) 2026 B&D Servicing LLC. All rights reserved.
 *
 * POST /api/checkout/paypal/capture-order
 * After the buyer approves the payment in the PayPal popup/redirect,
 * the client calls this to capture (finalize) the payment.
 *
 * Request body:
 *  - paypalOrderId: string (the PayPal order ID from create-order)
 *  - orderId?: string (our internal order ID to update status)
 */

import { NextRequest, NextResponse } from 'next/server';
import { capturePayPalOrder } from '@/lib/paypal';
import {
  getDb,
  saveDatabase,
  orders,
  eq,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paypalOrderId, orderId } = body;

    if (!paypalOrderId) {
      return NextResponse.json(
        { success: false, error: 'paypalOrderId is required' },
        { status: 400 }
      );
    }

    // Capture the payment
    const result = await capturePayPalOrder(paypalOrderId);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to capture PayPal payment' },
        { status: 502 }
      );
    }

    const captureData = result.data;

    // Check if the capture was successful
    if (captureData.status !== 'COMPLETED') {
      return NextResponse.json(
        {
          success: false,
          error: `Payment not completed. Status: ${captureData.status}`,
          status: captureData.status,
        },
        { status: 400 }
      );
    }

    // Extract capture details
    const capture = captureData.purchase_units?.[0]?.payments?.captures?.[0];
    const payer = captureData.payer;

    // If we have a local order ID, update its status to "paid"
    if (orderId) {
      const db = await getDb();

      const order = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .get();

      if (order) {
        await db.update(orders)
          .set({
            status: 'paid',
            customerEmail: payer?.email_address || order.customerEmail,
            customerName: payer ? `${payer.name.given_name} ${payer.name.surname}` : order.customerName,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(orders.id, orderId));

        await saveDatabase();
      }
    }

    return NextResponse.json({
      success: true,
      paypalOrderId: captureData.id,
      status: captureData.status,
      capture: capture ? {
        id: capture.id,
        status: capture.status,
        amount: capture.amount,
      } : null,
      payer: payer ? {
        email: payer.email_address,
        name: `${payer.name.given_name} ${payer.name.surname}`,
        payerId: payer.payer_id,
      } : null,
    });
  } catch (error) {
    console.error('[PayPal Capture] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to capture payment' },
      { status: 500 }
    );
  }
}
