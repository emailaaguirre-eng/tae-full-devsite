import { NextResponse } from 'next/server';
import { getDb, orders, orderItems, eq } from '@/lib/db';
import { saveDatabase } from '@/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const order = await db.select().from(orders).where(eq(orders.id, id)).get();
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id)).all();

    return NextResponse.json({
      success: true,
      data: { ...order, items },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const body = await req.json();

    const updates: Record<string, any> = {};
    const allowedFields = ['status', 'trackingNumber', 'trackingUrl', 'carrier'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }
    updates.updatedAt = new Date().toISOString();

    await db.update(orders).set(updates).where(eq(orders.id, id));
    await saveDatabase();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed' }, { status: 500 });
  }
}
