/**
 * Backfill Customer records from existing Orders
 * Updated for Drizzle ORM
 *
 * This script:
 * 1. Finds all distinct customerEmail values in existing orders
 * 2. Creates Customer records for each unique email
 * 3. Links orders to customers via customerId
 *
 * Run with: npx tsx scripts/backfill-customers.ts
 */

import { db, saveDatabase, customers, orders } from '../db';
import { eq, isNotNull } from 'drizzle-orm';

function generateId(): string {
  return crypto.randomUUID().replace(/-/g, '').substring(0, 24);
}

async function backfillCustomers() {
  console.log('Starting customer backfill...\n');

  try {
    // Get all orders with customerEmail
    const allOrders = await db
      .select({
        id: orders.id,
        customerEmail: orders.customerEmail,
        customerName: orders.customerName,
        customerId: orders.customerId,
      })
      .from(orders)
      .where(isNotNull(orders.customerEmail))
      .all();

    console.log(`Found ${allOrders.length} orders with customerEmail\n`);

    // Group by email
    const ordersByEmail = new Map<string, typeof allOrders>();
    for (const order of allOrders) {
      if (!order.customerEmail) continue;

      if (!ordersByEmail.has(order.customerEmail)) {
        ordersByEmail.set(order.customerEmail, []);
      }
      ordersByEmail.get(order.customerEmail)!.push(order);
    }

    console.log(`Found ${ordersByEmail.size} unique customer emails\n`);

    let customersCreated = 0;
    let customersUpdated = 0;
    let ordersUpdated = 0;

    // Process each unique email
    for (const [email, emailOrders] of ordersByEmail) {
      // Find existing customer
      let customer = await db
        .select()
        .from(customers)
        .where(eq(customers.email, email))
        .get();

      if (!customer) {
        // Use the most recent order's customerName if available
        const mostRecentOrder = emailOrders
          .filter(o => o.customerName)
          .sort((a, b) => {
            // Sort by order ID (newer orders have later IDs)
            return b.id.localeCompare(a.id);
          })[0];

        const newId = generateId();
        await db.insert(customers).values({
          id: newId,
          email,
          name: mostRecentOrder?.customerName || null,
          phone: null,
          gelatoCustomerId: null, // Legacy field — kept for backward compatibility, not used by new code
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        customer = await db.select().from(customers).where(eq(customers.id, newId)).get();
        customersCreated++;
        console.log(`✓ Created customer: ${email} (${mostRecentOrder?.customerName || 'No name'})`);
      } else {
        customersUpdated++;
        console.log(`→ Customer exists: ${email}`);
      }

      if (!customer) continue;

      // Update all orders for this email to link to customer
      const ordersToUpdate = emailOrders.filter(o => !o.customerId);
      if (ordersToUpdate.length > 0) {
        const orderIds = ordersToUpdate.map(o => o.id);

        // Update orders one at a time since Drizzle SQLite doesn't support updateMany with inArray well
        for (const orderId of orderIds) {
          await db
            .update(orders)
            .set({ customerId: customer.id })
            .where(eq(orders.id, orderId));
        }

        ordersUpdated += ordersToUpdate.length;
        console.log(`  → Linked ${ordersToUpdate.length} orders to customer`);
      }
    }

    // Persist all changes to disk
    await saveDatabase();

    console.log('\n=== Backfill Summary ===');
    console.log(`Customers created: ${customersCreated}`);
    console.log(`Customers already existed: ${customersUpdated}`);
    console.log(`Orders linked: ${ordersUpdated}`);
    console.log('\n✓ Backfill complete!');
  } catch (error) {
    console.error('Error during backfill:', error);
    throw error;
  }
}

// Run if called directly
backfillCustomers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export { backfillCustomers };
