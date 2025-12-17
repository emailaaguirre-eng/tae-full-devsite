/**
 * Gelato API Integration
 * Handles print fulfillment and product creation
 */

const GELATO_API_KEY = process.env.GELATO_API_KEY;
const GELATO_API_URL = process.env.GELATO_API_URL || 'https://order.gelatoapis.com/v4';

interface GelatoProduct {
  productUid: string;
  quantity: number;
  files?: Array<{
    url: string;
    type: string;
  }>;
}

interface GelatoOrder {
  orderReferenceId: string;
  customerReferenceId?: string;
  shipmentMethodUid: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postCode: string;
    state?: string;
    country: string;
    email?: string;
    phone?: string;
  };
  items: GelatoProduct[];
}

/**
 * Create order with Gelato
 */
export async function createGelatoOrder(orderData: GelatoOrder) {
  try {
    const response = await fetch(`${GELATO_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'X-API-KEY': GELATO_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gelato API error: ${JSON.stringify(error)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating Gelato order:', error);
    throw error;
  }
}

/**
 * Get Gelato order status
 */
export async function getGelatoOrderStatus(orderId: string) {
  try {
    const response = await fetch(`${GELATO_API_URL}/orders/${orderId}`, {
      headers: {
        'X-API-KEY': GELATO_API_KEY || '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch order status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Gelato order status:', error);
    throw error;
  }
}

/**
 * Get available Gelato products
 */
export async function getGelatoProducts() {
  try {
    const response = await fetch(`${GELATO_API_URL}/products`, {
      headers: {
        'X-API-KEY': GELATO_API_KEY || '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Gelato products');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Gelato products:', error);
    return [];
  }
}

/**
 * Upload image to Gelato
 */
export async function uploadImageToGelato(imageFile: File | string) {
  try {
    const formData = new FormData();
    
    if (typeof imageFile === 'string') {
      // If it's a URL, fetch and convert to blob
      const response = await fetch(imageFile);
      const blob = await response.blob();
      formData.append('file', blob);
    } else {
      formData.append('file', imageFile);
    }

    const response = await fetch(`${GELATO_API_URL}/files`, {
      method: 'POST',
      headers: {
        'X-API-KEY': GELATO_API_KEY || '',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image to Gelato');
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading image to Gelato:', error);
    throw error;
  }
}

/**
 * Get shipping methods for a product
 */
export async function getShippingMethods(countryCode: string) {
  try {
    const response = await fetch(
      `${GELATO_API_URL}/shipment-methods?country=${countryCode}`,
      {
        headers: {
          'X-API-KEY': GELATO_API_KEY || '',
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch shipping methods');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching shipping methods:', error);
    return [];
  }
}

/**
 * Calculate shipping quote
 */
export async function getShippingQuote(orderData: {
  country: string;
  productUid: string;
  quantity: number;
}) {
  try {
    const response = await fetch(`${GELATO_API_URL}/shipping/quote`, {
      method: 'POST',
      headers: {
        'X-API-KEY': GELATO_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      throw new Error('Failed to get shipping quote');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting shipping quote:', error);
    throw error;
  }
}

