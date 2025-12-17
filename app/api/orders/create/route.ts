import { NextResponse } from 'next/server';
import { createOrder } from '@/lib/woocommerce';
import { createGelatoOrder } from '@/lib/gelato';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderData, gelatoData } = body;

    // Create order in WooCommerce first
    const wcOrder = await createOrder(orderData);

    // If order created successfully, send to Gelato for fulfillment
    if (wcOrder.id && gelatoData) {
      try {
        const gelatoOrder = await createGelatoOrder({
          ...gelatoData,
          orderReferenceId: `WC-${wcOrder.id}`,
          customerReferenceId: wcOrder.customer_id?.toString(),
        });

        // Update WooCommerce order with Gelato order ID
        // Store in order meta data
        console.log('Gelato order created:', gelatoOrder);

        return NextResponse.json({
          success: true,
          wcOrder,
          gelatoOrder,
        });
      } catch (gelatoError) {
        console.error('Gelato order failed:', gelatoError);
        // Order exists in WooCommerce but failed in Gelato
        // You may want to update order status or add note
        return NextResponse.json({
          success: true,
          wcOrder,
          gelatoError: 'Fulfillment pending',
        });
      }
    }

    return NextResponse.json({ success: true, wcOrder });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

