/**
 * POST /api/orders/create
 *
 * Creates an order after PayPal payment is captured.
 * Saves the order + items to the local DB and creates ArtKey portal records.
 *
 * Request body:
 * {
 *   paypalOrderId: string,
 *   paypalTransactionId: string,
 *   customer: { name, email, phone? },
 *   shipping: { line1, line2?, city, state, zip, country },
 *   items: [{
 *     cartItemId, name, price, quantity,
 *     printfulProductId?, printfulVariantId?, productSlug?,
 *     designFiles?, requiresQrCode?,
 *     portalToken?, portalUrl?,
 *     artKeyData?,
 *   }],
 *   subtotal: number,
 *   shippingCost: number,
 *   total: number,
 * }
 */
import { NextResponse } from "next/server";
import { getDb, generateId, orders, orderItems, artKeys, customers } from "@/lib/db";
import { eq } from "drizzle-orm";

function generateOrderNumber(): string {
  const prefix = "TAE";
  const timestamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${rand}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      paypalOrderId,
      paypalTransactionId,
      customer,
      shipping,
      items,
      subtotal,
      shippingCost,
      total,
    } = body;

    if (!customer?.email || !items?.length) {
      return NextResponse.json(
        { success: false, error: "Missing customer or items" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const now = new Date().toISOString();
    const orderNumber = generateOrderNumber();
    const orderId = generateId();

    // Upsert customer
    const existingCustomers = await db
      .select()
      .from(customers)
      .where(eq(customers.email, customer.email))
      .all();

    let customerId: string;
    if (existingCustomers.length > 0) {
      customerId = existingCustomers[0].id;
    } else {
      customerId = generateId();
      await db.insert(customers).values({
        id: customerId,
        email: customer.email,
        name: customer.name || null,
        phone: customer.phone || null,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Create order
    await db.insert(orders).values({
      id: orderId,
      orderNumber,
      status: "paid",
      customerId,
      customerEmail: customer.email,
      customerName: customer.name || null,
      subtotal: subtotal || 0,
      shippingCost: shippingCost || 0,
      total: total || 0,
      createdAt: now,
      updatedAt: now,
    });

    // Create order items (portal records already created during proof generation)
    const createdItems: Array<{
      itemId: string;
      artKeyId: string | null;
      portalToken?: string;
      portalUrl?: string;
      editUrl: string | null;
    }> = [];
    for (const item of items) {
      const itemId = generateId();

      // Look up existing portal record created during proof generation
      let artKeyId: string | null = null;
      let editUrl: string | null = null;
      if (item.requiresQrCode && item.portalToken) {
        const existingPortals = await db
          .select()
          .from(artKeys)
          .where(eq(artKeys.publicToken, item.portalToken))
          .all();

        if (existingPortals.length > 0) {
          const portal = existingPortals[0];
          artKeyId = portal.id;
          editUrl = `/art-key/${portal.publicToken}/edit?owner=${portal.ownerToken}`;

          // Update ownerEmail if not set during proof generation
          if (!portal.ownerEmail && customer.email) {
            await db
              .update(artKeys)
              .set({ ownerEmail: customer.email, updatedAt: now })
              .where(eq(artKeys.id, portal.id));
          }
        }
      }

      await db.insert(orderItems).values({
        id: itemId,
        orderId,
        shopProductId: item.productSlug || null,
        itemType: item.requiresQrCode ? "custom" : "standard",
        itemName: item.name,
        itemTaeId: item.cartItemId || itemId,
        quantity: item.quantity || 1,
        basePrice: item.price || 0,
        taeAddOnFee: 0,
        unitPrice: item.price || 0,
        artKeyId: artKeyId || null,
        qrCodeUrl: item.portalUrl || null,
        createdAt: now,
      });

      createdItems.push({
        itemId,
        artKeyId,
        portalToken: item.portalToken,
        portalUrl: item.portalUrl,
        editUrl,
      });
    }

    // Save database to disk
    const { saveDatabase } = await import("@/db");
    await saveDatabase();

    // Submit order to Printful (best-effort — don't block the response)
    let printfulOrderId: number | null = null;
    let printfulStatus: string | null = null;
    const isDemoPayment = paypalOrderId?.startsWith("DEMO");
    try {
      const {
        createOrder: pfCreateOrder,
        confirmOrder: pfConfirmOrder,
        uploadFileBase64,
      } = await import("@/lib/printful");

      // Build Printful order items from cart items that have variant IDs
      const pfItems = [];
      for (const i of items.filter((x: any) => x.printfulVariantId)) {
        const files: { type?: string; url?: string; id?: number }[] = [];

        if (i.designFiles?.length) {
          for (const df of i.designFiles) {
            const placementType = df.placement === "back" ? "back" : "default";

            if (df.dataUrl?.startsWith("http")) {
              files.push({ type: placementType, url: df.dataUrl });
            } else if (df.dataUrl?.startsWith("data:")) {
              // Upload base64 design to Printful and use the returned URL
              try {
                const uploaded = await uploadFileBase64(
                  df.dataUrl,
                  `${orderNumber}-${df.placement}.png`
                );
                files.push({ type: placementType, url: uploaded.url });
                console.log(`[Order] Uploaded ${df.placement} design to Printful: ${uploaded.url}`);
              } catch (uploadErr: any) {
                console.error(`[Order] Design upload failed for ${df.placement}:`, uploadErr?.message);
              }
            }
          }
        }

        pfItems.push({
          variant_id: i.printfulVariantId,
          quantity: i.quantity || 1,
          name: i.name,
          retail_price: String(i.price || "0.00"),
          files,
        });
      }

      if (pfItems.length > 0) {
        // Create order as draft first
        const pfOrder = await pfCreateOrder(
          {
            external_id: orderNumber,
            recipient: {
              name: shipping?.name || customer.name,
              address1: shipping?.line1 || "",
              address2: shipping?.line2 || "",
              city: shipping?.city || "",
              state_code: shipping?.state || "",
              zip: shipping?.zip || "",
              country_code: shipping?.country || "US",
              phone: customer.phone || "",
              email: customer.email,
            },
            items: pfItems,
          },
          false
        );

        printfulOrderId = pfOrder.id;
        printfulStatus = pfOrder.status;

        // Auto-confirm the order for fulfillment when payment is real (not demo)
        if (!isDemoPayment && pfOrder.id) {
          try {
            const confirmed = await pfConfirmOrder(pfOrder.id);
            printfulStatus = confirmed.status;
            console.log(`[Order] Printful order ${pfOrder.id} confirmed for fulfillment`);
          } catch (confirmErr: any) {
            console.error("[Order] Printful confirm failed:", confirmErr?.message);
          }
        }

        // Update our order with the Printful order ID
        await db
          .update(orders)
          .set({
            printfulOrderId: String(pfOrder.id),
            printfulStatus: printfulStatus,
            updatedAt: now,
          })
          .where(eq(orders.id, orderId));
        await saveDatabase();
      }
    } catch (pfErr: any) {
      console.error("[Order] Printful submission failed:", pfErr?.message);
    }

    // Send order confirmation email (best-effort, non-blocking)
    try {
      const { sendOrderConfirmation } = await import("@/lib/email");
      await sendOrderConfirmation({
        orderNumber,
        customerName: customer.name || "",
        customerEmail: customer.email,
        total: total || 0,
        items: items.map((i: any) => {
          const ci = createdItems.find((c) => c.portalToken === i.portalToken);
          return {
            name: i.name,
            quantity: i.quantity || 1,
            price: i.price || 0,
            portalUrl: i.portalUrl || undefined,
            editUrl: ci?.editUrl || undefined,
          };
        }),
      });
    } catch (emailErr: any) {
      console.error("[Order] Email send failed:", emailErr?.message);
    }

    return NextResponse.json({
      success: true,
      order: {
        id: orderId,
        orderNumber,
        status: "paid",
        total,
        customerEmail: customer.email,
        printfulOrderId,
        printfulStatus,
        items: createdItems,
      },
    });
  } catch (err: any) {
    console.error("Order creation failed:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Order creation failed" },
      { status: 500 }
    );
  }
}
