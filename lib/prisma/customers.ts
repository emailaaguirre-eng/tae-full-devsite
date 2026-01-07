/**
 * Customer management helpers
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
  let customer = await prisma.customer.findUnique({
    where: { email: data.email },
  });

  if (!customer) {
    // Create new customer
    customer = await prisma.customer.create({
      data: {
        email: data.email,
        name: data.name || null,
        phone: data.phone || null,
      },
    });
  } else {
    // Update existing customer if new data provided
    if (data.name && !customer.name) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: { name: data.name },
      });
    }
    if (data.phone && !customer.phone) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: { phone: data.phone },
      });
    }
  }

  return customer;
}

/**
 * Get customer with order count
 */
export async function getCustomerWithStats(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      orders: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!customer) return null;

  const stats = {
    totalOrders: customer.orders.length,
    totalSpent: customer.orders.reduce((sum, order) => sum + order.total, 0),
    lastOrderDate: customer.orders[0]?.createdAt || null,
  };

  return {
    ...customer,
    stats,
  };
}

/**
 * Get customer reference ID for Gelato
 * Uses gelatoCustomerRefId if set, otherwise falls back to customer.id
 */
export function getGelatoCustomerRefId(customer: { id: string; gelatoCustomerRefId?: string | null }): string {
  return customer.gelatoCustomerRefId || customer.id;
}

/**
 * Update customer's Gelato reference ID
 * Called after first successful Gelato order submission
 */
export async function setGelatoCustomerRefId(customerId: string, gelatoCustomerRefId: string) {
  return prisma.customer.update({
    where: { id: customerId },
    data: { gelatoCustomerRefId },
  });
}

