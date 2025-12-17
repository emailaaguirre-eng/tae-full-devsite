/**
 * WooCommerce REST API Integration
 * Handles product data, cart, and order management
 * 
 * Documentation: https://woocommerce.github.io/woocommerce-rest-api-docs/
 */

const WC_URL = process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || process.env.NEXT_PUBLIC_WORDPRESS_URL;
const WC_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY;
const WC_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET;

/**
 * Get authentication header for WooCommerce API
 * Uses Basic Auth with Consumer Key and Consumer Secret
 */
function getAuthHeader(): string {
  if (!WC_KEY || !WC_SECRET) {
    throw new Error('WooCommerce API credentials not configured. Please set WOOCOMMERCE_CONSUMER_KEY and WOOCOMMERCE_CONSUMER_SECRET in .env.local');
  }
  const authString = Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString('base64');
  return `Basic ${authString}`;
}

/**
 * Check if WooCommerce API is configured
 */
export function isWooCommerceConfigured(): boolean {
  return !!(WC_URL && WC_KEY && WC_SECRET);
}

/**
 * Fetch products from WooCommerce
 * @param params - Query parameters (per_page, status, category, etc.)
 */
export async function getProducts(params?: {
  per_page?: number;
  status?: string;
  category?: string | number;
  featured?: boolean;
  on_sale?: boolean;
  search?: string;
}) {
  try {
    if (!isWooCommerceConfigured()) {
      console.warn('WooCommerce not configured, returning empty array');
      return [];
    }

    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = `${WC_URL}/wp-json/wc/v3/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WooCommerce API error:', response.status, errorText);
      throw new Error(`Failed to fetch products: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

/**
 * Get single product by ID or SKU
 */
export async function getProduct(productId: string | number) {
  try {
    if (!isWooCommerceConfigured()) {
      return null;
    }

    const response = await fetch(`${WC_URL}/wp-json/wc/v3/products/${productId}`, {
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch product: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

/**
 * Create order in WooCommerce
 * @param orderData - WooCommerce order object
 * @see https://woocommerce.github.io/woocommerce-rest-api-docs/#orders
 */
export async function createOrder(orderData: {
  payment_method: string;
  payment_method_title: string;
  set_paid?: boolean;
  billing: {
    first_name: string;
    last_name: string;
    address_1: string;
    address_2?: string;
    city: string;
    state?: string;
    postcode: string;
    country: string;
    email: string;
    phone?: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    address_1: string;
    address_2?: string;
    city: string;
    state?: string;
    postcode: string;
    country: string;
  };
  line_items: Array<{
    product_id: number;
    quantity: number;
    variation_id?: number;
    meta_data?: Array<{ key: string; value: string }>;
  }>;
  shipping_lines?: Array<{
    method_id: string;
    method_title: string;
    total: string;
  }>;
  fee_lines?: Array<{
    name: string;
    total: string;
  }>;
  meta_data?: Array<{ key: string; value: string }>;
}) {
  try {
    if (!isWooCommerceConfigured()) {
      throw new Error('WooCommerce API not configured');
    }

    const response = await fetch(`${WC_URL}/wp-json/wc/v3/orders`, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('WooCommerce order creation error:', errorData);
      throw new Error(`Failed to create order: ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

/**
 * Update order status
 * @param orderId - WooCommerce order ID
 * @param status - Order status (pending, processing, on-hold, completed, cancelled, refunded, failed)
 */
export async function updateOrderStatus(orderId: string | number, status: string) {
  try {
    if (!isWooCommerceConfigured()) {
      throw new Error('WooCommerce API not configured');
    }

    const response = await fetch(`${WC_URL}/wp-json/wc/v3/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`Failed to update order: ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
}

/**
 * Get order by ID
 */
export async function getOrder(orderId: string | number) {
  try {
    if (!isWooCommerceConfigured()) {
      return null;
    }

    const response = await fetch(`${WC_URL}/wp-json/wc/v3/orders/${orderId}`, {
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch order: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}

/**
 * Add order note
 */
export async function addOrderNote(orderId: string | number, note: string, customerNote: boolean = false) {
  try {
    if (!isWooCommerceConfigured()) {
      throw new Error('WooCommerce API not configured');
    }

    const response = await fetch(`${WC_URL}/wp-json/wc/v3/orders/${orderId}/notes`, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        note,
        customer_note: customerNote,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add order note');
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding order note:', error);
    throw error;
  }
}

/**
 * Update order meta data
 */
export async function updateOrderMeta(orderId: string | number, metaData: Array<{ key: string; value: string }>) {
  try {
    if (!isWooCommerceConfigured()) {
      throw new Error('WooCommerce API not configured');
    }

    const order = await getOrder(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Merge with existing meta data
    const existingMeta = order.meta_data || [];
    const newMeta = [...existingMeta, ...metaData];

    const response = await fetch(`${WC_URL}/wp-json/wc/v3/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        meta_data: newMeta,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update order meta');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating order meta:', error);
    throw error;
  }
}

/**
 * Get product categories
 */
export async function getCategories(params?: {
  per_page?: number;
  hide_empty?: boolean;
  parent?: number;
}) {
  try {
    if (!isWooCommerceConfigured()) {
      return [];
    }

    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = `${WC_URL}/wp-json/wc/v3/products/categories${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Test WooCommerce API connection
 */
export async function testConnection(): Promise<{ success: boolean; message: string }> {
  try {
    if (!isWooCommerceConfigured()) {
      return {
        success: false,
        message: 'WooCommerce API credentials not configured',
      };
    }

    const response = await fetch(`${WC_URL}/wp-json/wc/v3/system_status`, {
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        message: `API connection failed: ${response.status} ${response.statusText}`,
      };
    }

    return {
      success: true,
      message: 'WooCommerce API connection successful',
    };
  } catch (error) {
    return {
      success: false,
      message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

