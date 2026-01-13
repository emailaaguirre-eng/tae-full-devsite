import { NextRequest, NextResponse } from 'next/server';
import { getGelatoCustomerRefId, setGelatoCustomerRefId } from '@/lib/prisma/customers';
import { createGelatoOrder } from '@/lib/gelato';
import { prisma, generatePublicToken, generateOwnerToken } from '@/lib/db';
import { getAppBaseUrl } from '@/lib/wp';
import QRCode from 'qrcode';

export const dynamic = 'force-dynamic';

/**
 * POST /api/orders/[orderId]/submit-gelato
 * Submit order to Gelato after payment
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
            product: true,
            asset: true,
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

    // Get customer reference ID for Gelato
    if (!order.customer) {
      return NextResponse.json(
        { error: 'Order must have a customer' },
        { status: 400 }
      );
    }

    const customerRefId = getGelatoCustomerRefId(order.customer);

    // Parse shipping address
    let shippingAddress;
    try {
      shippingAddress = order.shippingAddress ? JSON.parse(order.shippingAddress) : null;
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid shipping address format' },
        { status: 400 }
      );
    }

    if (!shippingAddress) {
      return NextResponse.json(
        { error: 'Shipping address is required' },
        { status: 400 }
      );
    }

    // Build Gelato order items
    const gelatoItems = order.items.map((item, index) => {
      // Determine product UID
      let productUid: string | null = null;
      
      if (item.productId && item.product?.gelatoProductUid) {
        productUid = item.product.gelatoProductUid;
      } else if (item.assetId && item.asset?.printProductUid) {
        productUid = item.asset.printProductUid;
      }

      if (!productUid) {
        throw new Error(`Item ${index + 1} (${item.itemName}) missing Gelato product UID`);
      }

      // TODO: Get design files from designDraftId
      // For now, we'll need to upload files first and get URLs
      const files: any[] = []; // TODO: Add file URLs from design draft

      return {
        itemReferenceId: item.id,
        productUid,
        quantity: item.quantity,
        files: files.length > 0 ? files : undefined,
      };
    });

    // Validate product availability before submitting order
    // Note: We sync catalog 3-4x daily, so database check is sufficient
    const productUids = gelatoItems.map(item => item.productUid);
    
    const dbProducts = await prisma.gelatoProduct.findMany({
      where: {
        productUid: { in: productUids },
      },
      select: {
        productUid: true,
        isPrintable: true,
        productStatus: true,
      },
    });

    // Check if all products exist and are available
    const unavailableProducts = [];
    for (const item of gelatoItems) {
      const dbProduct = dbProducts.find(p => p.productUid === item.productUid);
      
      if (!dbProduct) {
        unavailableProducts.push({
          productUid: item.productUid,
          reason: 'Product not found in catalog',
        });
      } else if (!dbProduct.isPrintable || dbProduct.productStatus !== 'activated') {
        unavailableProducts.push({
          productUid: item.productUid,
          reason: 'Product is not available for printing',
        });
      }
    }

    if (unavailableProducts.length > 0) {
      return NextResponse.json(
        {
          error: 'One or more products are no longer available',
          unavailableProducts: unavailableProducts.map(p => p.productUid),
          details: unavailableProducts,
        },
        { status: 400 }
      );
    }

    // Create Gelato order
    const gelatoOrder = await createGelatoOrder({
      orderType: 'order',
      orderReferenceId: order.orderNumber,
      customerReferenceId: customerRefId,
      currency: 'USD',
      items: gelatoItems,
      shippingAddress: {
        firstName: shippingAddress.name?.split(' ')[0] || shippingAddress.firstName || '',
        lastName: shippingAddress.name?.split(' ').slice(1).join(' ') || shippingAddress.lastName || '',
        companyName: shippingAddress.companyName,
        addressLine1: shippingAddress.address || shippingAddress.addressLine1 || '',
        addressLine2: shippingAddress.addressLine2,
        city: shippingAddress.city || '',
        postCode: shippingAddress.zip || shippingAddress.postCode || '',
        state: shippingAddress.state,
        country: shippingAddress.country || 'US',
        email: order.customerEmail || order.customer.email,
        phone: shippingAddress.phone,
      },
    });

    // Update order with Gelato order ID
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        gelatoOrderId: gelatoOrder.orderId || gelatoOrder.id,
        gelatoStatus: gelatoOrder.status || 'submitted',
        status: 'processing',
      },
    });

    // Update customer's Gelato reference ID if not set
    if (!order.customer.gelatoCustomerRefId && gelatoOrder.customerReferenceId) {
      await setGelatoCustomerRefId(order.customer.id, gelatoOrder.customerReferenceId);
    }

    // Create ArtKey portals and QR codes for products that require them
    for (const item of order.items) {
      // Try to find StoreProduct that matches this order item
      // Check by product slug if available, otherwise try to match by item name
      let storeProduct = null;
      if (item.product?.slug) {
        storeProduct = await prisma.storeProduct.findUnique({
          where: { slug: item.product.slug },
        });
      }
      
      // If not found by slug, try to match by name (slugify itemName)
      if (!storeProduct && item.itemName) {
        const slugFromName = item.itemName
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
        if (slugFromName) {
          storeProduct = await prisma.storeProduct.findUnique({
            where: { slug: slugFromName },
          });
        }
      }

      // If product requires ArtKey, create portal and QR code
      if (storeProduct?.requiresArtKey) {
        try {
          // Generate unique tokens for ArtKey
          let publicToken = generatePublicToken();
          let ownerToken = generateOwnerToken();
          
          // Ensure publicToken is unique
          let attempts = 0;
          while (await prisma.artKey.findUnique({ where: { publicToken } })) {
            publicToken = generatePublicToken();
            attempts++;
            if (attempts > 10) {
              console.error(`[SubmitGelato] Failed to generate unique ArtKey token for item ${item.id}`);
              continue; // Skip this item
            }
          }

          // Create ArtKey with default data
          const baseUrl = getAppBaseUrl();
          const artKeyTitle = `${storeProduct.name} - Order ${order.orderNumber}`;
          
          const artKey = await prisma.artKey.create({
            data: {
              publicToken,
              ownerToken,
              title: artKeyTitle,
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
                enable_gallery: false,
                enable_video: false,
                show_guestbook: false,
                enable_custom_links: false,
                enable_spotify: false,
                allow_img_uploads: false,
                allow_vid_uploads: false,
                gb_btn_view: true,
                gb_signing_status: 'open',
                gb_signing_start: '',
                gb_signing_end: '',
                gb_require_approval: true,
                img_require_approval: true,
                vid_require_approval: true,
                order: ['gallery', 'guestbook', 'video'],
              }),
              links: JSON.stringify([]),
              spotify: JSON.stringify({ url: 'https://', autoplay: false }),
              featuredVideo: null,
              customizations: JSON.stringify({}),
              uploadedImages: JSON.stringify([]),
              uploadedVideos: JSON.stringify([]),
            },
          });

          const artKeyUrl = `${baseUrl}/artkey/${publicToken}`;
          
          // Generate QR code as data URL
          const qrCodeDataUrl = await QRCode.toDataURL(artKeyUrl, {
            width: 400,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
          });

          // Update order item with ArtKey info
          await prisma.orderItem.update({
            where: { id: item.id },
            data: {
              artKeyId: artKey.id,
              artKeyUrl: artKeyUrl,
              qrCodeUrl: qrCodeDataUrl,
            },
          });

          console.log(`[SubmitGelato] Created ArtKey portal for item ${item.id}: ${artKeyUrl}`);
        } catch (error: any) {
          console.error(`[SubmitGelato] Error creating ArtKey for item ${item.id}:`, error);
          // Continue with other items even if one fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        gelatoOrderId: updatedOrder.gelatoOrderId,
        gelatoStatus: updatedOrder.gelatoStatus,
        status: updatedOrder.status,
      },
      gelatoOrder,
    });
  } catch (error: any) {
    console.error('[SubmitGelato] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit order to Gelato' },
      { status: 500 }
    );
  }
}

