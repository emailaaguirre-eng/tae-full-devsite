import { NextResponse } from 'next/server';
import { getDb, orders, orderItems, customers, eq, desc } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let allOrders;
    if (status) {
      allOrders = await db.select().from(orders).where(eq(orders.status, status)).all();
    } else {
      allOrders = await db.select().from(orders).all();
    }

    allOrders.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    const allItems = await db.select().from(orderItems).all();

    const mapped = allOrders.map(o => ({
      ...o,
      items: allItems.filter(i => i.orderId === o.id),
      itemCount: allItems.filter(i => i.orderId === o.id).length,
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch (err: any) {
    console.error('Failed to fetch orders:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
