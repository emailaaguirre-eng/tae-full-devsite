import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { findOrCreateCustomer, getGelatoCustomerRefId } from '@/lib/prisma/customers';
import { createGelatoOrder } from '@/lib/gelato';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * POST /api/orders
 * Create a new order
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerEmail,
      customerName,
      customerPhone,
      shippingAddress,
      items,
      designDraftId,
      subtotal,
      premiumFees,
      shipping,
      total,
    } = body;

    // Validate required fields
    if (!customerEmail || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: customerEmail, items' },
        { status: 400 }
      );
    }

    // Find or create customer
    const customer = await findOrCreateCustomer({
      email: customerEmail,
      name: customerName,
      phone: customerPhone,
    });

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create order with snapshot of customer info
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        customerEmail, // Snapshot
        customerName, // Snapshot
        shippingAddress: shippingAddress ? JSON.stringify(shippingAddress) : null,
        subtotal: subtotal || 0,
        premiumFees: premiumFees || 0,
        shipping: shipping || 0,
        total: total || (subtotal || 0) + (premiumFees || 0) + (shipping || 0),
        designDraftId,
        status: 'pending',
        items: {
          create: items.map((item: any) => ({
            productId: item.productId || null,
            assetId: item.assetId || null,
            itemType: item.itemType || 'product',
            itemName: item.itemName || 'Unknown Item',
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            usedAssetIds: item.usedAssetIds ? JSON.stringify(item.usedAssetIds) : null,
            premiumFees: item.premiumFees || 0,
            designDraftId: item.designDraftId || null,
          })),
        },
      },
      include: {
        customer: true,
        items: true,
      },
    });

    return NextResponse.json(
      {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          total: order.total,
          customerId: order.customerId,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[Orders] POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/orders
 * Get orders (with optional filters)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');

    const orders = await prisma.order.findMany({
      where: {
        ...(customerId ? { customerId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        items: {
          include: {
            product: true,
            asset: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('[Orders] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

