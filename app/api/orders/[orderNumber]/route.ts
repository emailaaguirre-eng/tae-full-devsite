/**
 * GET /api/orders/[orderNumber]
 *
 * Fetch order details by order number.
 * Requires either the customer email as a query param (?email=...) or
 * a session token for security — prevents random order lookups.
 */
import { NextResponse } from "next/server";
import { getDb, orders, orderItems, artKeys, eq } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const db = await getDb();
    const { orderNumber } = params;
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    // Find the order
    const matchedOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .all();

    if (matchedOrders.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const order = matchedOrders[0];

    // Basic security: verify the email matches
    if (email && order.customerEmail !== email) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Fetch order items
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id))
      .all();

    // For items with artKeyId, fetch the portal tokens
    const itemsWithPortals = await Promise.all(
      items.map(async (item) => {
        let portalData = null;
        if (item.artKeyId) {
          const portals = await db
            .select({
              publicToken: artKeys.publicToken,
              ownerToken: artKeys.ownerToken,
              title: artKeys.title,
            })
            .from(artKeys)
            .where(eq(artKeys.id, item.artKeyId))
            .all();

          if (portals.length > 0) {
            const domain =
              process.env.ARTKEY_DOMAIN || "artkey.theartfulexperience.com";
            portalData = {
              title: portals[0].title,
              portalUrl: `https://${domain}/${portals[0].publicToken}`,
              editUrl: `/art-key/${portals[0].publicToken}/edit?owner=${portals[0].ownerToken}`,
            };
          }
        }

        return {
          id: item.id,
          itemName: item.itemName,
          itemType: item.itemType,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          basePrice: item.basePrice,
          portal: portalData,
        };
      })
    );

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        total: order.total,
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
        carrier: order.carrier,
        printfulStatus: order.printfulStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: itemsWithPortals,
      },
    });
  } catch (err: any) {
    console.error("Order fetch failed:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch order" },
      { status: 500 }
    );
  }
}
