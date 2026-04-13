/**
 * POST /api/paypal/capture-order
 *
 * Captures (completes) a PayPal order after the buyer approves.
 * Returns the transaction ID on success.
 *
 * Credentials: lib/paypal-effective-mode.ts
 */
import { NextResponse } from "next/server";
import { getEffectivePayPalConfig, getPayPalAccessToken } from "@/lib/paypal-effective-mode";

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing PayPal order ID" },
        { status: 400 }
      );
    }

    const config = await getEffectivePayPalConfig();
    const accessToken = await getPayPalAccessToken(config);

    const captureRes = await fetch(
      `${config.apiBase}/v2/checkout/orders/${orderId}/capture`,
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
