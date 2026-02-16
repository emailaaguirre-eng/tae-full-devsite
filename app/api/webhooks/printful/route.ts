/**
 * POST /api/webhooks/printful
 *
 * Receives webhook events from Printful for order status updates.
 * Configure this URL in your Printful dashboard under Settings > Webhooks.
 *
 * Events handled:
 * - package_shipped: Order has shipped, includes tracking info
 * - order_failed: Order failed during fulfillment
 * - order_canceled: Order was canceled
 * - order_updated: Generic order update
 */
import { NextResponse } from "next/server";
import { getDb, orders, eq } from "@/lib/db";
import { saveDatabase } from "@/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json({ received: false, error: "Invalid payload" }, { status: 400 });
    }

    console.log(`[Printful Webhook] Event: ${type}`, JSON.stringify(data).substring(0, 200));

    const db = await getDb();
    const now = new Date().toISOString();

    // Find the order by Printful order ID or external ID
    const printfulOrderId = data.order?.id?.toString();
    const externalId = data.order?.external_id;

    if (!printfulOrderId && !externalId) {
      console.warn("[Printful Webhook] No order ID in payload");
      return NextResponse.json({ received: true, matched: false });
    }

    // Try to match by external ID (our order number) first
    let matchedOrders: any[] = [];
    if (externalId) {
      matchedOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.orderNumber, externalId))
        .all();
    }

    if (matchedOrders.length === 0 && printfulOrderId) {
      // Match by Printful order ID
      matchedOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.printfulOrderId, printfulOrderId))
        .all();
    }

    if (matchedOrders.length === 0) {
      console.warn(`[Printful Webhook] No matching order for ${externalId || printfulOrderId}`);
      return NextResponse.json({ received: true, matched: false });
    }

    const order = matchedOrders[0];

    // Update order based on event type
    switch (type) {
      case "package_shipped": {
        const shipment = data.shipment || {};
        await db
          .update(orders)
          .set({
            status: "shipped",
            printfulStatus: "shipped",
            trackingNumber: shipment.tracking_number || null,
            trackingUrl: shipment.tracking_url || null,
            carrier: shipment.carrier || null,
            updatedAt: now,
          })
          .where(eq(orders.id, order.id));

        // Send shipping notification email
        try {
          const { sendShippingNotification } = await import("@/lib/email");
          await sendShippingNotification({
            orderNumber: order.orderNumber,
            customerName: order.customerName || "",
            customerEmail: order.customerEmail || "",
            carrier: shipment.carrier || null,
            trackingNumber: shipment.tracking_number || null,
            trackingUrl: shipment.tracking_url || null,
          });
        } catch (emailErr: any) {
          console.error("[Webhook] Shipping email failed:", emailErr?.message);
        }
        break;
      }

      case "order_failed": {
        await db
          .update(orders)
          .set({
            status: "failed",
            printfulStatus: "failed",
            updatedAt: now,
          })
          .where(eq(orders.id, order.id));
        break;
      }

      case "order_canceled": {
        await db
          .update(orders)
          .set({
            status: "canceled",
            printfulStatus: "canceled",
            updatedAt: now,
          })
          .where(eq(orders.id, order.id));
        break;
      }

      case "order_updated": {
        const newStatus = data.order?.status;
        if (newStatus) {
          await db
            .update(orders)
            .set({
              printfulStatus: newStatus,
              updatedAt: now,
            })
            .where(eq(orders.id, order.id));
        }
        break;
      }

      default:
        console.log(`[Printful Webhook] Unhandled event type: ${type}`);
    }

    await saveDatabase();

    return NextResponse.json({
      received: true,
      matched: true,
      orderNumber: order.orderNumber,
      event: type,
    });
  } catch (err: any) {
    console.error("[Printful Webhook] Error:", err);
    return NextResponse.json(
      { received: false, error: err?.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}
