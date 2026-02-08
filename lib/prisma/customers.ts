/**
 * Customer management helpers
 * Updated for Drizzle ORM
 */

import { db, saveDatabase, customers, orders, eq, desc, generateId } from '@/lib/db';

/**
 * Find or create a customer by email
 * Used when creating orders to ensure customer exists
 */
export async function findOrCreateCustomer(data: {
  email: string;
  name?: string;
  phone?: string;
}) {
  // Try to find existing customer
  let customer = await db
    .select()
    .from(customers)
    .where(eq(customers.email, data.email))
    .get();

  if (!customer) {
    // Create new customer
    await db.insert(customers).values({
      id: generateId(),
      email: data.email,
      name: data.name || null,
      phone: data.phone || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await saveDatabase();

    customer = await db
      .select()
      .from(customers)
      .where(eq(customers.email, data.email))
      .get();
  } else {
    // Update existing customer if new data provided
    const updates: any = {};

    if (data.name && !customer.name) {
      updates.name = data.name;
    }
    if (data.phone && !customer.phone) {
      updates.phone = data.phone;
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date().toISOString();
      await db
        .update(customers)
        .set(updates)
        .where(eq(customers.id, customer.id));

      await saveDatabase();

      customer = await db
        .select()
        .from(customers)
        .where(eq(customers.id, customer.id))
        .get();
    }
  }

  return customer;
}

/**
 * Get customer with order count
 */
export async function getCustomerWithStats(customerId: string) {
  const customer = await db
    .select()
    .from(customers)
    .where(eq(customers.id, customerId))
    .get();

  if (!customer) return null;

  const customerOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      total: orders.total,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.customerId, customerId))
    .orderBy(desc(orders.createdAt))
    .all();

  const stats = {
    totalOrders: customerOrders.length,
    totalSpent: customerOrders.reduce((sum, order) => sum + (order.total || 0), 0),
    lastOrderDate: customerOrders[0]?.createdAt || null,
  };

  return {
    ...customer,
    orders: customerOrders,
    stats,
  };
}

/**
 * Get customer reference ID for Gelato
 * Uses gelatoCustomerId if set, otherwise falls back to customer.id
 * @deprecated gelatoCustomerId is legacy - kept for backward compatibility
 */
export function getGelatoCustomerRefId(customer: { id: string; gelatoCustomerId?: string | null }): string {
  // Legacy: gelatoCustomerId field
  return customer.gelatoCustomerId || customer.id;
}

/**
 * Update customer's Gelato reference ID
 * Called after first successful Gelato order submission
 * @deprecated gelatoCustomerId is legacy - kept for backward compatibility
 */
export async function setGelatoCustomerId(customerId: string, gelatoCustomerId: string) {
  await db
    .update(customers)
    .set({
      gelatoCustomerId, // Legacy field
      updatedAt: new Date().toISOString(),
    })
    .where(eq(customers.id, customerId));

  await saveDatabase();

  return db
    .select()
    .from(customers)
    .where(eq(customers.id, customerId))
    .get();
}
