/**
 * Submit Order to Printful API
 * Copyright (c) 2026 B&D Servicing LLC. All rights reserved.
 *
 * POST /api/orders/[orderId]/submit-printful
 * After payment, this route:
 *  1. Creates ArtKey portals for items that need QR codes
 *  2. Builds the Printful order payload
 *  3. Submits the order to Printful (as draft first, then confirm)
 *  4. Stores the Printful order ID locally
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getDb,
  saveDatabase,
  orders,
  customers,
  artKeys,
  orderItems,
  shopProducts,
  shopCategories,
  eq,
  generatePublicToken,
  generateOwnerToken,
  generateId,
} from '@/lib/db';
import {
  createPrintfulOrder,
  confirmPrintfulOrder,
  type PrintfulOrderItem,
  type PrintfulRecipient,
} from '@/lib/printful';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ orderId: string }>;
}

/**
 * POST /api/orders/[orderId]/submit-printful
 * Submit order to Printful after payment is confirmed.
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const db = await getDb();
    const { orderId } = await params;

    // ── 1. Validate the order ─────────────────────────────────────────────

    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .get();

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.status !== 'paid') {
      return NextResponse.json(
        { error: 'Order must be paid before submitting to Printful' },
        { status: 400 }
      );
    }

    if (order.printfulOrderId) {
      return NextResponse.json(
        { error: 'Order already submitted to Printful', printfulOrderId: order.printfulOrderId },
        { status: 400 }
      );
    }

    // ── 2. Gather order items from DB ─────────────────────────────────────

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId))
      .all();

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'Order has no items' },
        { status: 400 }
      );
    }

    // ── 3. Get customer / shipping info ───────────────────────────────────

    let customer = null;
    if (order.customerId) {
      customer = await db
        .select()
        .from(customers)
        .where(eq(customers.id, order.customerId))
        .get();
    }

    // Parse shipping address from the order (stored as JSON in a future field,
    // or sourced from customer record). For now, we use the customer info.
    // Callers can also pass shipping info in the POST body to override.
    let shippingOverride: Partial<PrintfulRecipient> | null = null;
    try {
      const body = await request.json().catch(() => ({}));
      if (body.shipping) {
        shippingOverride = body.shipping;
      }
    } catch {
      // No body or not JSON — that's fine
    }

    const recipient: PrintfulRecipient = {
      name: shippingOverride?.name || order.customerName || customer?.name || 'Customer',
      address1: shippingOverride?.address1 || '',
      city: shippingOverride?.city || '',
      state_code: shippingOverride?.state_code || '',
      country_code: shippingOverride?.country_code || 'US',
      zip: shippingOverride?.zip || '',
      email: shippingOverride?.email || order.customerEmail || customer?.email || '',
      phone: shippingOverride?.phone || customer?.phone || '',
    };

    // ── 4. Create ArtKey portals for QR code items ────────────────────────

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://theartfulexperience.com';

    for (const item of items) {
      // Check if item's category requires a QR code and doesn't already have one
      if (item.artKeyId) continue;

      let needsQrCode = false;

      if (item.shopProductId) {
        const product = await db
          .select()
          .from(shopProducts)
          .where(eq(shopProducts.id, item.shopProductId))
          .get();

        if (product?.categoryId) {
          const category = await db
            .select()
            .from(shopCategories)
            .where(eq(shopCategories.id, product.categoryId))
            .get();

          needsQrCode = !!category?.requiresQrCode;
        }
      }

      if (!needsQrCode) continue;

      // Generate unique public token (32 chars)
      let publicToken = generatePublicToken();
      let attempts = 0;
      let existingKey = await db
        .select()
        .from(artKeys)
        .where(eq(artKeys.publicToken, publicToken))
        .get();

      while (existingKey && attempts < 10) {
        publicToken = generatePublicToken();
        attempts++;
        existingKey = await db
          .select()
          .from(artKeys)
          .where(eq(artKeys.publicToken, publicToken))
          .get();
      }

      if (attempts >= 10) {
        console.error(`[SubmitPrintful] Failed to generate unique token for item ${item.id}`);
        continue;
      }

      const ownerToken = generateOwnerToken();
      const artKeyId = generateId();
      const now = new Date().toISOString();

      await db.insert(artKeys).values({
        id: artKeyId,
        publicToken,
        ownerToken,
        title: `${item.itemName} - Order ${order.orderNumber}`,
        theme: JSON.stringify({
          template: 'classic',
          bg_color: '#F6F7FB',
          bg_image_id: 0,
          bg_image_url: '',
          font: 'g:Playfair Display',
          text_color: '#111111',
          title_color: '#4f46e5',
          title_style: 'solid',
          button_color: '#4f46e5',
          button_gradient: '',
          color_scope: 'content',
        }),
        features: JSON.stringify({
          enable_gallery: true,
          enable_video: false,
          show_guestbook: true,
          enable_custom_links: false,
          enable_spotify: false,
          allow_img_uploads: true,
          allow_vid_uploads: false,
          gb_btn_view: true,
          gb_signing_status: 'open',
          gb_signing_start: '',
          gb_signing_end: '',
          gb_require_approval: false,
          img_require_approval: false,
          vid_require_approval: false,
          order: ['gallery', 'guestbook', 'video'],
        }),
        links: JSON.stringify([]),
        spotify: JSON.stringify({ url: 'https://', autoplay: false }),
        featuredVideo: null,
        customizations: JSON.stringify({}),
        uploadedImages: JSON.stringify([]),
        uploadedVideos: JSON.stringify([]),
        createdAt: now,
        updatedAt: now,
      });

      const artKeyUrl = `${baseUrl}/artkey/${publicToken}`;

      // Update order item with ArtKey reference
      await db.update(orderItems)
        .set({
          artKeyId,
          qrCodeUrl: artKeyUrl,
        })
        .where(eq(orderItems.id, item.id));

      console.log(`[SubmitPrintful] Created ArtKey for item ${item.id}: ${artKeyUrl}`);
    }

    // ── 5. Build Printful order items ─────────────────────────────────────

    const printfulItems: PrintfulOrderItem[] = [];

    // Re-fetch items to get updated ArtKey IDs
    const updatedItems = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId))
      .all();

    for (const item of updatedItems) {
      // Look up the shop product for Printful variant ID
      let variantId: number | null = null;
      let files: Array<{ type: string; url: string }> = [];

      if (item.shopProductId) {
        const product = await db
          .select()
          .from(shopProducts)
          .where(eq(shopProducts.id, item.shopProductId))
          .get();

        if (product?.printfulVariantId) {
          variantId = product.printfulVariantId;
        }
      }

      if (!variantId) {
        console.warn(`[SubmitPrintful] No Printful variant ID for item ${item.id}, skipping`);
        continue;
      }

      // Build file list — if item has a design draft, use its rendered PNG.
      // The design URL should be publicly accessible for Printful to download.
      if (item.designDraftId) {
        // TODO: Resolve design draft to a public URL for the rendered print file
        // For now, use a placeholder that can be replaced with the actual workflow
        files.push({
          type: 'default',
          url: `${baseUrl}/api/designs/${item.designDraftId}/render`,
        });
      }

      // If there's a QR code URL and the item needs one, the compose route
      // should have already generated the print file with QR embedded.
      // That file URL would be stored on the design draft.

      printfulItems.push({
        variant_id: variantId,
        quantity: item.quantity || 1,
        name: item.itemName,
        retail_price: item.unitPrice ? String(item.unitPrice) : undefined,
        files,
        external_id: item.id,
      });
    }

    if (printfulItems.length === 0) {
      // No items with valid Printful variant IDs — still mark as processing
      await db.update(orders)
        .set({
          status: 'processing',
          fulfillmentStatus: 'pending_manual',
          updatedAt: new Date().toISOString(),
        })
        .where(eq(orders.id, orderId));

      await saveDatabase();

      return NextResponse.json({
        success: true,
        message: 'No items have Printful variant IDs — order marked for manual fulfillment',
        order: { id: orderId, orderNumber: order.orderNumber, status: 'processing' },
      });
    }

    // ── 6. Submit to Printful ─────────────────────────────────────────────

    // Update order status to processing
    await db.update(orders)
      .set({
        status: 'processing',
        printProvider: 'printful',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orders.id, orderId));

    // Create draft order on Printful first
    const createResult = await createPrintfulOrder({
      external_id: order.orderNumber,
      recipient,
      items: printfulItems,
      retail_costs: {
        currency: 'USD',
        subtotal: order.subtotal ? String(order.subtotal) : undefined,
        shipping: order.shippingCost ? String(order.shippingCost) : undefined,
        total: order.total ? String(order.total) : undefined,
      },
    });

    if (!createResult.success || !createResult.data) {
      // Store the error but keep the order in processing state for retry
      await db.update(orders)
        .set({
          fulfillmentStatus: 'submission_failed',
          updatedAt: new Date().toISOString(),
        })
        .where(eq(orders.id, orderId));

      await saveDatabase();

      console.error('[SubmitPrintful] Order creation failed:', createResult.error);
      return NextResponse.json(
        {
          success: false,
          error: `Printful order creation failed: ${createResult.error}`,
          order: { id: orderId, orderNumber: order.orderNumber, status: 'processing' },
        },
        { status: 502 }
      );
    }

    const printfulOrderId = String(createResult.data.id);

    // Store the Printful order ID
    await db.update(orders)
      .set({
        printfulOrderId,
        fulfillmentStatus: createResult.data.status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orders.id, orderId));

    // Now confirm the draft order to send it to production
    const confirmResult = await confirmPrintfulOrder(printfulOrderId);

    if (confirmResult.success && confirmResult.data) {
      await db.update(orders)
        .set({
          fulfillmentStatus: confirmResult.data.status,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(orders.id, orderId));
    } else {
      console.warn('[SubmitPrintful] Draft created but confirm failed:', confirmResult.error);
      // Draft was created, admin can confirm manually from Printful dashboard
    }

    // ── 7. Persist and respond ────────────────────────────────────────────

    await saveDatabase();

    const finalOrder = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .get();

    return NextResponse.json({
      success: true,
      message: 'Order submitted to Printful',
      printfulOrderId,
      order: {
        id: finalOrder?.id,
        orderNumber: finalOrder?.orderNumber,
        status: finalOrder?.status,
        fulfillmentStatus: finalOrder?.fulfillmentStatus,
        printfulOrderId: finalOrder?.printfulOrderId,
      },
    });
  } catch (error: any) {
    console.error('[SubmitPrintful] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process order' },
      { status: 500 }
    );
  }
}
