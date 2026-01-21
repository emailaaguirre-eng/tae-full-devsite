/**
 * Submit Order to Gelato API
 * Copyright (c) 2026 B&D Servicing LLC. All rights reserved.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getDb,
  orders,
  customers,
  artKeys,
  shopProducts,
  shopCategories,
  eq,
  generatePublicToken,
  generateOwnerToken,
  generateId,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ orderId: string }>;
}

interface OrderItem {
  id: string;
  itemName: string;
  shopProductId?: string;
  artworkId?: string;
  artKeyId?: string;
  qrCodeUrl?: string;
  categoryRequiresQrCode?: boolean;
}

/**
 * POST /api/orders/[orderId]/submit-gelato
 * Submit order to Gelato after payment
 *
 * NOTE: This route needs to be updated to fully integrate with Gelato API
 * For now, it handles order status updates and ArtKey creation
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const db = await getDb();
    const { orderId } = await params;

    // Get order from database
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
        { error: 'Order must be paid before submitting to Gelato' },
        { status: 400 }
      );
    }

    if (order.gelatoOrderId) {
      return NextResponse.json(
        { error: 'Order already submitted to Gelato' },
        { status: 400 }
      );
    }

    // Get customer if exists
    let customer = null;
    if (order.customerId) {
      customer = await db
        .select()
        .from(customers)
        .where(eq(customers.id, order.customerId))
        .get();
    }

    // Parse order items from JSON
    let orderItems: OrderItem[] = [];
    if (order.itemsJson) {
      try {
        orderItems = JSON.parse(order.itemsJson);
      } catch (e) {
        console.error('[SubmitGelato] Failed to parse order items:', e);
      }
    }

    // Update order status to processing
    await db.update(orders)
      .set({
        status: 'processing',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orders.id, orderId));

    // Process each item - create ArtKeys for items that need QR codes
    const updatedItems: OrderItem[] = [];
    for (const item of orderItems) {
      let needsQrCode = item.categoryRequiresQrCode || false;

      // If we have a shopProductId, check if category requires QR code
      if (item.shopProductId && !needsQrCode) {
        const shopProduct = await db
          .select()
          .from(shopProducts)
          .where(eq(shopProducts.id, item.shopProductId))
          .get();

        if (shopProduct?.categoryId) {
          const category = await db
            .select()
            .from(shopCategories)
            .where(eq(shopCategories.id, shopProduct.categoryId))
            .get();

          // Check if this category requires QR codes (stored in JSON or column)
          // For now we'll rely on the item's categoryRequiresQrCode flag
        }
      }

      if (needsQrCode && !item.artKeyId) {
        try {
          // Generate unique public token
          let publicToken = generatePublicToken();
          let attempts = 0;

          // Check for duplicates
          let existingKey = await db
            .select()
            .from(artKeys)
            .where(eq(artKeys.publicToken, publicToken))
            .get();
          while (existingKey) {
            publicToken = generatePublicToken();
            attempts++;
            if (attempts > 10) {
              console.error(`[SubmitGelato] Failed to generate unique token for item ${item.id}`);
              break;
            }
            existingKey = await db
              .select()
              .from(artKeys)
              .where(eq(artKeys.publicToken, publicToken))
              .get();
          }

          if (attempts <= 10) {
            const ownerToken = generateOwnerToken();
            const artKeyId = generateId();

            // Create ArtKey portal
            await db.insert(artKeys)
              .values({
                id: artKeyId,
                publicToken,
                ownerToken,
                title: `${item.itemName} - Order ${order.orderNumber}`,
                template: 'classic',
                customization: JSON.stringify({
                  bg_color: '#F6F7FB',
                  font: 'g:Playfair Display',
                  text_color: '#111111',
                  title_color: '#4f46e5',
                }),
                guestbookEnabled: true,
                mediaEnabled: true,
                isDemo: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });

            // Generate QR code URL (actual QR generation happens on render)
            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://theartfulexperience.com';
            const artKeyUrl = `${baseUrl}/artkey/${publicToken}`;

            // Update item with ArtKey info
            item.artKeyId = artKeyId;
            item.qrCodeUrl = artKeyUrl;

            console.log(`[SubmitGelato] Created ArtKey for item ${item.id}: ${artKeyUrl}`);
          }
        } catch (error) {
          console.error(`[SubmitGelato] Error creating ArtKey for item ${item.id}:`, error);
        }
      }

      updatedItems.push(item);
    }

    // Update order with modified items (including ArtKey IDs)
    await db.update(orders)
      .set({
        itemsJson: JSON.stringify(updatedItems),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orders.id, orderId));

    // Get the updated order
    const updatedOrder = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .get();

    return NextResponse.json({
      success: true,
      message: 'Order queued for Gelato submission',
      order: {
        id: updatedOrder?.id,
        orderNumber: updatedOrder?.orderNumber,
        status: updatedOrder?.status,
      },
    });
  } catch (error: any) {
    console.error('[SubmitGelato] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process order' },
      { status: 500 }
    );
  }
}
