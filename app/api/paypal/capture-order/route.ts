/**
 * POST /api/paypal/capture-order
 *
 * Captures (completes) a PayPal order after the buyer approves.
 * Returns the transaction ID on success.
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
    throw new Error("PayPal credentials not configured");
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
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing PayPal order ID" },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken();

    const captureRes = await fetch(
      `${getBase()}/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const captureData = await captureRes.json();
    if (!captureRes.ok) {
      console.error("[PayPal] Capture failed:", captureData);
      return NextResponse.json(
        { error: captureData.message || "PayPal capture failed" },
        { status: 500 }
      );
    }

    const capture =
      captureData.purchase_units?.[0]?.payments?.captures?.[0];

    return NextResponse.json({
      success: true,
      paypalOrderId: captureData.id,
      transactionId: capture?.id || captureData.id,
      status: captureData.status,
    });
  } catch (err: any) {
    console.error("[PayPal] Capture error:", err);
    return NextResponse.json(
      { error: err.message || "PayPal capture failed" },
      { status: 500 }
    );
  }
}
