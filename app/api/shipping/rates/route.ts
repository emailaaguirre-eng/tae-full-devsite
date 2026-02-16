/**
 * POST /api/shipping/rates
 *
 * Get shipping rate estimates from Printful for the cart items.
 *
 * Request body:
 * {
 *   address: { name, address1, address2?, city, state_code, zip, country_code },
 *   items: [{ variant_id: number, quantity: number }]
 * }
 */
import { NextResponse } from "next/server";
import { getShippingRates } from "@/lib/printful";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { address, items } = body;

    if (!address || !items?.length) {
      return NextResponse.json(
        { success: false, error: "Missing address or items" },
        { status: 400 }
      );
    }

    const rates = await getShippingRates(
      {
        name: address.name || "Customer",
        address1: address.address1 || address.line1,
        address2: address.address2 || address.line2,
        city: address.city,
        state_code: address.state_code || address.state,
        zip: address.zip,
        country_code: address.country_code || address.country || "US",
        phone: address.phone,
        email: address.email,
      },
      items.map((i: any) => ({
        variant_id: i.variant_id || i.printfulVariantId,
        quantity: i.quantity || 1,
      }))
    );

    return NextResponse.json({ success: true, rates });
  } catch (err: any) {
    console.error("Shipping rates error:", err);

    // If Printful is not configured, return a placeholder rate
    if (err?.message?.includes("PRINTFUL_TOKEN")) {
      return NextResponse.json({
        success: true,
        rates: [
          {
            id: "STANDARD",
            name: "Standard Shipping (estimate)",
            rate: "5.99",
            currency: "USD",
            minDeliveryDays: 5,
            maxDeliveryDays: 10,
          },
        ],
        note: "Printful not configured — showing estimated rates",
      });
    }

    return NextResponse.json(
      { success: false, error: err?.message || "Failed to get shipping rates" },
      { status: 500 }
    );
  }
}
