/**
 * PayPal Client ID API
 * Copyright (c) 2026 B&D Servicing LLC. All rights reserved.
 *
 * GET /api/checkout/paypal/client-id
 * Returns the PayPal client ID for use in the PayPal JS SDK.
 * This is safe to expose to the client.
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const mode = process.env.PAYPAL_MODE || 'sandbox';

  if (!clientId) {
    return NextResponse.json(
      { success: false, error: 'PayPal is not configured' },
      { status: 503 }
    );
  }

  return NextResponse.json({
    success: true,
    clientId,
    mode,
  });
}
