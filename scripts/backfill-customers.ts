/**
 * Backfill Customer records from existing Orders
 * 
 * This script:
 * 1. Finds all distinct customerEmail values in existing orders
 * 2. Creates Customer records for each unique email
 * 3. Links orders to customers via customerId
 * 
 * Run with: npx tsx scripts/backfill-customers.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillCustomers() {
  console.log('Starting customer backfill...\n');

  try {
    // Get all orders with customerEmail
    const orders = await prisma.order.findMany({
      where: {
        customerEmail: {
          not: null,
        },
      },
      select: {
        id: true,
        customerEmail: true,
        customerName: true,
        customerId: true,
      },
    });

    console.log(`Found ${orders.length} orders with customerEmail\n`);

    // Group by email
    const ordersByEmail = new Map<string, typeof orders>();
    for (const order of orders) {
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
      // Find or create customer
      let customer = await prisma.customer.findUnique({
        where: { email },
      });

      if (!customer) {
        // Use the most recent order's customerName if available
        const mostRecentOrder = emailOrders
          .filter(o => o.customerName)
          .sort((a, b) => {
            // Sort by order ID (newer orders have later IDs in CUID)
            return b.id.localeCompare(a.id);
          })[0];

        customer = await prisma.customer.create({
          data: {
            email,
            name: mostRecentOrder?.customerName || null,
            gelatoCustomerId: null, // Will be set when first order is submitted to Gelato
          },
        });
        customersCreated++;
        console.log(`✓ Created customer: ${email} (${customer.name || 'No name'})`);
      } else {
        customersUpdated++;
        console.log(`→ Customer exists: ${email}`);
      }

      // Update all orders for this email to link to customer
      const ordersToUpdate = emailOrders.filter(o => !o.customerId);
      if (ordersToUpdate.length > 0) {
        await prisma.order.updateMany({
          where: {
            id: {
              in: ordersToUpdate.map(o => o.id),
            },
          },
          data: {
            customerId: customer.id,
          },
        });
        ordersUpdated += ordersToUpdate.length;
        console.log(`  → Linked ${ordersToUpdate.length} orders to customer`);
      }
    }

    console.log('\n=== Backfill Summary ===');
    console.log(`Customers created: ${customersCreated}`);
    console.log(`Customers already existed: ${customersUpdated}`);
    console.log(`Orders linked: ${ordersUpdated}`);
    console.log('\n✓ Backfill complete!');
  } catch (error) {
    console.error('Error during backfill:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  backfillCustomers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { backfillCustomers };

