import { NextRequest, NextResponse } from 'next/server';
import { getDb, orders, customers, shopProducts, artistArtworks, desc, eq, inArray } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/orders
 * Get all orders with customer and item relations
 */
export async function GET(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Build the query
    let ordersList;
    if (status && status !== 'all') {
      ordersList = await db
        .select()
        .from(orders)
        .where(eq(orders.status, status))
        .orderBy(desc(orders.createdAt))
        .all();
    } else {
      ordersList = await db
        .select()
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .all();
    }

    // Get all unique customer IDs
    const customerIds = [...new Set(ordersList.map(o => o.customerId).filter(Boolean))] as string[];

    // Fetch customers in bulk
    const customersList = customerIds.length > 0
      ? await db
          .select({
            id: customers.id,
            email: customers.email,
            firstName: customers.firstName,
            lastName: customers.lastName,
          })
          .from(customers)
          .where(inArray(customers.id, customerIds))
          .all()
      : [];

    // Create a customer lookup map
    const customerMap = new Map(customersList.map(c => [c.id, {
      id: c.id,
      email: c.email,
      name: c.firstName && c.lastName
        ? `${c.firstName} ${c.lastName}`
        : c.firstName || c.lastName || null,
    }]));

    // Parse items from itemsJson and enrich with product/artwork data
    const enrichedOrders = await Promise.all(
      ordersList.map(async (order) => {
        let items: any[] = [];

        if (order.itemsJson) {
          try {
            const parsedItems = JSON.parse(order.itemsJson);

            // Collect all product and artwork IDs
            const productIds = parsedItems.map((item: any) => item.shopProductId).filter(Boolean);
            const artworkIds = parsedItems.map((item: any) => item.artworkId).filter(Boolean);

            // Fetch products and artworks in bulk
            const productsList = productIds.length > 0
              ? await db
                  .select({
                    id: shopProducts.id,
                    name: shopProducts.name,
                    slug: shopProducts.slug,
                    taeId: shopProducts.taeId,
                  })
                  .from(shopProducts)
                  .where(inArray(shopProducts.id, productIds))
                  .all()
              : [];

            const artworksList = artworkIds.length > 0
              ? await db
                  .select({
                    id: artistArtworks.id,
                    title: artistArtworks.title,
                    slug: artistArtworks.slug,
                    taeId: artistArtworks.taeId,
                  })
                  .from(artistArtworks)
                  .where(inArray(artistArtworks.id, artworkIds))
                  .all()
              : [];

            // Create lookup maps
            const productMap = new Map(productsList.map(p => [p.id, p]));
            const artworkMap = new Map(artworksList.map(a => [a.id, a]));

            // Enrich items with product and artwork data
            items = parsedItems.map((item: any) => ({
              ...item,
              shopProduct: item.shopProductId ? productMap.get(item.shopProductId) || null : null,
              artwork: item.artworkId ? artworkMap.get(item.artworkId) || null : null,
            }));
          } catch (e) {
            console.error('Error parsing itemsJson for order:', order.id, e);
          }
        }

        return {
          ...order,
          customer: order.customerId ? customerMap.get(order.customerId) || null : null,
          items,
        };
      })
    );

    return NextResponse.json(enrichedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
