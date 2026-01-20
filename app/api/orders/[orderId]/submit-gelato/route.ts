import { NextRequest, NextResponse } from 'next/server';
import { prisma, generatePublicToken, generateOwnerToken } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/orders/[orderId]/submit-gelato
 * Submit order to Gelato after payment
 *
 * NOTE: This route needs to be updated to fully integrate with Gelato API
 * For now, it handles order status updates and ArtKey creation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } | Promise<{ orderId: string }> }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const { orderId } = resolvedParams;

    // Get order with all relations
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        items: {
          include: {
            shopProduct: {
              include: {
                category: true,
              },
            },
            artwork: {
              include: {
                artist: true,
              },
            },
          },
        },
      },
    });

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

    // TODO: Build Gelato order items from order.items
    // Each item needs:
    // - productUid from shopProduct.gelatoProductUid or from category mapping
    // - quantity
    // - files (design files from designDraftId)

    // For now, update order status to processing
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'processing',
        gelatoStatus: 'pending_submission',
      },
    });

    // Create ArtKey portals for items that require QR codes
    for (const item of order.items) {
      // Check if item's category requires QR code
      const requiresQrCode = item.shopProduct?.category?.requiresQrCode ?? false;

      if (requiresQrCode && !item.artKeyId) {
        try {
          // Generate unique tokens
          let publicToken = generatePublicToken();
          let attempts = 0;
          while (await prisma.artKey.findUnique({ where: { publicToken } })) {
            publicToken = generatePublicToken();
            attempts++;
            if (attempts > 10) {
              console.error(`[SubmitGelato] Failed to generate unique token for item ${item.id}`);
              continue;
            }
          }

          const ownerToken = generateOwnerToken();

          // Create ArtKey portal
          const artKey = await prisma.artKey.create({
            data: {
              publicToken,
              ownerToken,
              title: `${item.itemName} - Order ${order.orderNumber}`,
              theme: JSON.stringify({
                template: 'classic',
                bg_color: '#F6F7FB',
                font: 'g:Playfair Display',
                text_color: '#111111',
                title_color: '#4f46e5',
              }),
              features: JSON.stringify({
                enable_gallery: false,
                show_guestbook: true,
                gb_require_approval: true,
              }),
              links: JSON.stringify([]),
              spotify: JSON.stringify({ url: '', autoplay: false }),
              customizations: JSON.stringify({}),
              uploadedImages: JSON.stringify([]),
              uploadedVideos: JSON.stringify([]),
            },
          });

          // Generate QR code URL (actual QR generation happens on render)
          const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://theartfulexperience.com';
          const artKeyUrl = `${baseUrl}/artkey/${publicToken}`;

          // Update order item
          await prisma.orderItem.update({
            where: { id: item.id },
            data: {
              artKeyId: artKey.id,
              qrCodeUrl: artKeyUrl, // Store URL, generate QR on demand
            },
          });

          console.log(`[SubmitGelato] Created ArtKey for item ${item.id}: ${artKeyUrl}`);
        } catch (error) {
          console.error(`[SubmitGelato] Error creating ArtKey for item ${item.id}:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order queued for Gelato submission',
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        gelatoStatus: updatedOrder.gelatoStatus,
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
