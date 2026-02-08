import { NextRequest, NextResponse } from 'next/server';
import { getDb, customers, orders, desc, eq } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/customers
 * Get all customers with order counts
 */
export async function GET(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const db = await getDb();
    // Get all customers
    const customersList = await db.select().from(customers).orderBy(desc(customers.createdAt)).all();

    // For each customer, get their orders
    const customersWithOrders = await Promise.all(
      customersList.map(async (customer) => {
        const customerOrders = await db
          .select({
            id: orders.id,
            orderNumber: orders.orderNumber,
            status: orders.status,
            total: orders.total,
            createdAt: orders.createdAt,
          })
          .from(orders)
          .where(eq(orders.customerId, customer.id))
          .orderBy(desc(orders.createdAt))
          .all();

        return {
          ...customer,
          orders: customerOrders,
        };
      })
    );

    return NextResponse.json(customersWithOrders);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}
