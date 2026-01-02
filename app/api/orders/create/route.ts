import { NextResponse } from 'next/server';
import { createGelatoOrder } from '@/lib/gelato';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gelatoData } = body;

    if (!gelatoData) {
      return NextResponse.json({ error: 'Missing order data' }, { status: 400 });
    }

    const gelatoOrder = await createGelatoOrder(gelatoData);

    return NextResponse.json({
      success: true,
      gelatoOrder,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
