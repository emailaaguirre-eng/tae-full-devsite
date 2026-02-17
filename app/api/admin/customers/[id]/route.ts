import { NextResponse } from 'next/server';
import { getDb, customers, orders, orderItems, eq } from '@/lib/db';
import { saveDatabase } from '@/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const customer = await db.select().from(customers).where(eq(customers.id, id)).get();
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }

    const customerOrders = await db.select().from(orders).where(eq(orders.customerId, id)).all();
    const orderIds = customerOrders.map(o => o.id);
    let items: any[] = [];
    for (const oid of orderIds) {
      const oi = await db.select().from(orderItems).where(eq(orderItems.orderId, oid)).all();
      items.push(...oi);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...customer,
        orders: customerOrders.map(o => ({
          ...o,
          items: items.filter(i => i.orderId === o.id),
        })),
      },
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
    if (body.name !== undefined) updates.name = body.name;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.notes !== undefined) updates.notes = body.notes;
    updates.updatedAt = new Date().toISOString();

    await db.update(customers).set(updates).where(eq(customers.id, id));
    await saveDatabase();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();

    const customerOrders = await db.select().from(orders).where(eq(orders.customerId, id)).all();
    if (customerOrders.length > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete: customer has ${customerOrders.length} orders.` },
        { status: 400 }
      );
    }

    await db.delete(customers).where(eq(customers.id, id));
    await saveDatabase();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed' }, { status: 500 });
  }
}
