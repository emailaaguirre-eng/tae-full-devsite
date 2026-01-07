import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getGelatoCustomerRefId, setGelatoCustomerRefId } from '@/lib/prisma/customers';
import { createGelatoOrder } from '@/lib/gelato';

const prisma = new PrismaClient();

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

