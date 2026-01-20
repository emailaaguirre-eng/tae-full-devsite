import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/orders
 * Get all orders with customer and item relations
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const orders = await prisma.order.findMany({
      where: {
        ...(status && status !== 'all' ? { status } : {}),
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
            shopProduct: {
              select: {
                name: true,
                slug: true,
                taeId: true,
              },
            },
            artwork: {
              select: {
                title: true,
                slug: true,
                taeId: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
