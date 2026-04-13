/**
 * POST /api/paypal/create-order
 *
 * Creates a PayPal order server-side using the PayPal REST API.
 * The returned order ID is used by the client-side PayPal buttons.
 *
 * Credentials: lib/paypal-effective-mode.ts (sandbox vs live client ID/secret per mode).
 */
import { NextResponse } from "next/server";
import { getEffectivePayPalConfig, getPayPalAccessToken } from "@/lib/paypal-effective-mode";

export async function POST(req: Request) {
  try {
    const { total, currency = "USD" } = await req.json();

    if (!total || total <= 0) {
      return NextResponse.json(
        { error: "Invalid total amount" },
        { status: 400 }
      );
    }

    const config = await getEffectivePayPalConfig();
    const accessToken = await getPayPalAccessToken(config);

    const orderRes = await fetch(`${config.apiBase}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: total.toFixed(2),
            },
            description: "The Artful Experience Order",
          },
        ],
      }),
    });

    const orderData = await orderRes.json();
    if (!orderRes.ok) {
      console.error("[PayPal] Create order failed:", orderData);
      return NextResponse.json(
        { error: orderData.message || "PayPal order creation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ orderId: orderData.id });
  } catch (err: any) {
    console.error("[PayPal] Create order error:", err);
    return NextResponse.json(
      { error: err.message || "PayPal order creation failed" },
      { status: 500 }
    );
  }
}
