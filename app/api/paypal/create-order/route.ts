/**
 * POST /api/paypal/create-order
 *
 * Creates a PayPal order server-side using the PayPal REST API.
 * The returned order ID is used by the client-side PayPal buttons.
 *
 * Requires env vars: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET
 * Optional: PAYPAL_MODE ("sandbox" | "live", defaults to "sandbox")
 */
import { NextResponse } from "next/server";

const getBase = () =>
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) {
    throw new Error("PayPal credentials not configured (PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET)");
  }

  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const res = await fetch(`${getBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`PayPal auth failed: ${data.error_description || res.statusText}`);
  }
  return data.access_token;
}

export async function POST(req: Request) {
  try {
    const { total, currency = "USD" } = await req.json();

    if (!total || total <= 0) {
      return NextResponse.json(
        { error: "Invalid total amount" },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken();

    const orderRes = await fetch(`${getBase()}/v2/checkout/orders`, {
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
