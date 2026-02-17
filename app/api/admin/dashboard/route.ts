import { NextResponse } from 'next/server';
import { getDb, shopProducts, shopCategories, customers, orders, artKeys } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();

    const allProducts = await db.select().from(shopProducts).all();
    const allCategories = await db.select().from(shopCategories).all();
    const allCustomers = await db.select().from(customers).all();
    const allOrders = await db.select().from(orders).all();
    const allArtKeys = await db.select().from(artKeys).all();

    const activeProducts = allProducts.filter(p => p.active);
    const recentOrders = allOrders
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, 5);

    const totalRevenue = allOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const pendingOrders = allOrders.filter(o => o.status === 'pending' || o.status === 'paid');

    return NextResponse.json({
      success: true,
      stats: {
        totalProducts: allProducts.length,
        activeProducts: activeProducts.length,
        totalCategories: allCategories.length,
        totalCustomers: allCustomers.length,
        totalOrders: allOrders.length,
        pendingOrders: pendingOrders.length,
        totalRevenue,
        totalArtKeys: allArtKeys.length,
      },
      recentOrders: recentOrders.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        customerName: o.customerName,
        customerEmail: o.customerEmail,
        total: o.total,
        createdAt: o.createdAt,
      })),
    });
  } catch (err: any) {
    console.error('Dashboard stats error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to load dashboard' },
      { status: 500 }
    );
  }
}
