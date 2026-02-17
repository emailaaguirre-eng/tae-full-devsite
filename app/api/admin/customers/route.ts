import { NextResponse } from 'next/server';
import { getDb, customers, orders, eq, desc, generateId } from '@/lib/db';
import { saveDatabase } from '@/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();
    const allCustomers = await db.select().from(customers).all();
    const allOrders = await db.select().from(orders).all();

    const mapped = allCustomers.map(c => {
      const customerOrders = allOrders.filter(o => o.customerId === c.id);
      const totalSpent = customerOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const lastOrder = customerOrders.sort((a, b) =>
        (b.createdAt || '').localeCompare(a.createdAt || '')
      )[0];

      return {
        id: c.id,
        email: c.email,
        name: c.name,
        phone: c.phone,
        notes: c.notes,
        orderCount: customerOrders.length,
        totalSpent,
        lastOrderDate: lastOrder?.createdAt || null,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      };
    });

    mapped.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    return NextResponse.json({ success: true, data: mapped });
  } catch (err: any) {
    console.error('Failed to fetch customers:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const db = await getDb();
    const body = await req.json();

    if (!body.email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const existing = await db.select().from(customers).where(eq(customers.email, body.email)).get();
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Customer with this email already exists' },
        { status: 400 }
      );
    }

    const id = generateId();
    const now = new Date().toISOString();

    await db.insert(customers).values({
      id,
      email: body.email,
      name: body.name || null,
      phone: body.phone || null,
      notes: body.notes || null,
      createdAt: now,
      updatedAt: now,
    });

    await saveDatabase();

    return NextResponse.json({ success: true, data: { id, email: body.email } });
  } catch (err: any) {
    console.error('Failed to create customer:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to create customer' },
      { status: 500 }
    );
  }
}
