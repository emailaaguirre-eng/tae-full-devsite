/**
 * Gelato API Integration
 * 
 * Two separate APIs:
 * - Order API: https://order.gelatoapis.com/v4 (for orders, quotes)
 * - Product API: https://product.gelatoapis.com/v3 (for catalogs, products)
 */

const GELATO_API_KEY = process.env.GELATO_API_KEY || '';
const GELATO_ORDER_API_URL = process.env.GELATO_API_URL || 'https://order.gelatoapis.com/v4';
const GELATO_PRODUCT_API_URL = process.env.GELATO_PRODUCT_API_URL || 'https://product.gelatoapis.com/v3';

// ============================================================================
// Types
// ============================================================================

interface GelatoFile {
  url: string;
  type: 'default' | 'front' | 'back' | 'inside' | 'neck-inner' | 'neck-outer' | 'sleeve-left' | 'sleeve-right';
}

interface GelatoOrderItem {
  itemReferenceId: string;
  productUid: string;
  quantity: number;
  files?: GelatoFile[];
  pageCount?: number;
}

interface GelatoShippingAddress {
  firstName: string;
  lastName: string;
  companyName?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postCode: string;
  state?: string;
  country: string;
  email: string;
  phone?: string;
}

interface GelatoReturnAddress {
  companyName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postCode?: string;
  state?: string;
  country?: string;
  email?: string;
  phone?: string;
}

interface GelatoOrderRequest {
  orderType?: 'order' | 'draft';
  orderReferenceId: string;
  customerReferenceId: string;
  currency: string;
  items: GelatoOrderItem[];
  shippingAddress: GelatoShippingAddress;
  shipmentMethodUid?: string;
  returnAddress?: GelatoReturnAddress;
  metadata?: Array<{ key: string; value: string }>;
}

interface GelatoQuoteRequest {
  orderReferenceId: string;
  customerReferenceId: string;
  currency: string;
  recipient: GelatoShippingAddress;
  products: Array<{
    itemReferenceId: string;
    productUid: string;
    quantity: number;
    files?: GelatoFile[];
    pageCount?: number;
  }>;
  allowMultipleQuotes?: boolean;
}

// ============================================================================
// Order API Functions (https://order.gelatoapis.com/v4)
// ============================================================================

/**
 * Create order with Gelato
 * POST https://order.gelatoapis.com/v4/orders
 */
export async function createGelatoOrder(orderData: GelatoOrderRequest) {
  if (!GELATO_API_KEY) {
    throw new Error('GELATO_API_KEY is not configured');
  }

  const response = await fetch(`${GELATO_ORDER_API_URL}/orders`, {
    method: 'POST',
    headers: {
      'X-API-KEY': GELATO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      orderType: orderData.orderType || 'order',
      ...orderData,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[GELATO_ORDER_ERROR]', { status: response.status, body: errorText });
    throw new Error(`Gelato order creation failed: ${response.status}`);
  }

  return await response.json();
}

/**
 * Get Gelato order by ID
 * GET https://order.gelatoapis.com/v4/orders/{orderId}
 */
export async function getGelatoOrder(orderId: string) {
  if (!GELATO_API_KEY) {
    throw new Error('GELATO_API_KEY is not configured');
  }

  const response = await fetch(`${GELATO_ORDER_API_URL}/orders/${orderId}`, {
    headers: {
      'X-API-KEY': GELATO_API_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch order: ${response.status}`);
  }

  return await response.json();
}

/**
 * Get Gelato order status (alias for getGelatoOrder)
 */
export async function getGelatoOrderStatus(orderId: string) {
  return getGelatoOrder(orderId);
}

/**
 * Search Gelato orders
 * POST https://order.gelatoapis.com/v4/orders:search
 */
export async function searchGelatoOrders(params: {
  orderTypes?: ('order' | 'draft')[];
  fulfillmentStatuses?: string[];
  financialStatuses?: string[];
  countries?: string[];
  limit?: number;
  offset?: number;
  search?: string;
  orderReferenceId?: string;
}) {
  if (!GELATO_API_KEY) {
    throw new Error('GELATO_API_KEY is not configured');
  }

  const response = await fetch(`${GELATO_ORDER_API_URL}/orders:search`, {
    method: 'POST',
    headers: {
      'X-API-KEY': GELATO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Failed to search orders: ${response.status}`);
  }

  return await response.json();
}

/**
 * Cancel a Gelato order
 * POST https://order.gelatoapis.com/v4/orders/{orderId}:cancel
 */
export async function cancelGelatoOrder(orderId: string) {
  if (!GELATO_API_KEY) {
    throw new Error('GELATO_API_KEY is not configured');
  }

  const response = await fetch(`${GELATO_ORDER_API_URL}/orders/${orderId}:cancel`, {
    method: 'POST',
    headers: {
      'X-API-KEY': GELATO_API_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 409) {
      throw new Error('Order cannot be canceled - already printed or shipped');
    }
    throw new Error(`Failed to cancel order: ${response.status}`);
  }

  return { success: true };
}

/**
 * Get shipping quote
 * POST https://order.gelatoapis.com/v4/orders:quote
 */
export async function getGelatoQuote(quoteData: GelatoQuoteRequest) {
  if (!GELATO_API_KEY) {
    throw new Error('GELATO_API_KEY is not configured');
  }

  const response = await fetch(`${GELATO_ORDER_API_URL}/orders:quote`, {
    method: 'POST',
    headers: {
      'X-API-KEY': GELATO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(quoteData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[GELATO_QUOTE_ERROR]', { status: response.status, body: errorText });
    throw new Error(`Failed to get quote: ${response.status}`);
  }

  return await response.json();
}

/**
 * Delete a draft order
 * DELETE https://order.gelatoapis.com/v4/orders/{orderId}
 */
export async function deleteGelatoDraftOrder(orderId: string) {
  if (!GELATO_API_KEY) {
    throw new Error('GELATO_API_KEY is not configured');
  }

  const response = await fetch(`${GELATO_ORDER_API_URL}/orders/${orderId}`, {
    method: 'DELETE',
    headers: {
      'X-API-KEY': GELATO_API_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete draft order: ${response.status}`);
  }

  return { success: true };
}

/**
 * Convert draft order to regular order
 * PATCH https://order.gelatoapis.com/v4/orders/{orderId}
 */
export async function convertDraftToOrder(orderId: string, items?: Array<{ id: string; files?: GelatoFile[] }>) {
  if (!GELATO_API_KEY) {
    throw new Error('GELATO_API_KEY is not configured');
  }

  const body: any = { orderType: 'order' };
  if (items) {
    body.items = items;
  }

  const response = await fetch(`${GELATO_ORDER_API_URL}/orders/${orderId}`, {
    method: 'PATCH',
    headers: {
      'X-API-KEY': GELATO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Failed to convert draft to order: ${response.status}`);
  }

  return await response.json();
}

// ============================================================================
// Product Catalog API Functions (https://product.gelatoapis.com/v3)
// ============================================================================

/**
 * List all catalogs
 * GET https://product.gelatoapis.com/v3/catalogs
 */
export async function getGelatoCatalogs() {
  if (!GELATO_API_KEY) {
    console.warn('[GELATO] API key not configured');
    return [];
  }

  const response = await fetch(`${GELATO_PRODUCT_API_URL}/catalogs`, {
    headers: {
      'X-API-KEY': GELATO_API_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    console.error('[GELATO_CATALOGS_ERROR]', response.status);
    return [];
  }

  return await response.json();
}

/**
 * Get catalog info with attributes
 * GET https://product.gelatoapis.com/v3/catalogs/{catalogUid}
 */
export async function getGelatoCatalog(catalogUid: string) {
  if (!GELATO_API_KEY) {
    throw new Error('GELATO_API_KEY is not configured');
  }

  const response = await fetch(`${GELATO_PRODUCT_API_URL}/catalogs/${catalogUid}`, {
    headers: {
      'X-API-KEY': GELATO_API_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch catalog: ${response.status}`);
  }

  return await response.json();
}

/**
 * Search products in a catalog
 * POST https://product.gelatoapis.com/v3/catalogs/{catalogUid}/products:search
 */
export async function searchGelatoProducts(catalogUid: string, params?: {
  attributeFilters?: Record<string, string[]>;
  limit?: number;
  offset?: number;
}) {
  if (!GELATO_API_KEY) {
    throw new Error('GELATO_API_KEY is not configured');
  }

  const response = await fetch(`${GELATO_PRODUCT_API_URL}/catalogs/${catalogUid}/products:search`, {
    method: 'POST',
    headers: {
      'X-API-KEY': GELATO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      limit: params?.limit || 100,
      offset: params?.offset || 0,
      attributeFilters: params?.attributeFilters || {},
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to search products: ${response.status}`);
  }

  return await response.json();
}

/**
 * Get single product details
 * GET https://product.gelatoapis.com/v3/products/{productUid}
 */
export async function getGelatoProduct(productUid: string) {
  if (!GELATO_API_KEY) {
    throw new Error('GELATO_API_KEY is not configured');
  }

  const response = await fetch(`${GELATO_PRODUCT_API_URL}/products/${productUid}`, {
    headers: {
      'X-API-KEY': GELATO_API_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch product: ${response.status}`);
  }

  return await response.json();
}

/**
 * Get available Gelato products (deprecated - use searchGelatoProducts instead)
 */
export async function getGelatoProducts() {
  console.warn('[GELATO] getGelatoProducts is deprecated. Use searchGelatoProducts(catalogUid) instead.');
  return [];
}

/**
 * Get product details (alias for getGelatoProduct)
 */
export async function getGelatoProductDetails(productUid: string) {
  return getGelatoProduct(productUid);
}

/**
 * Get print specifications from Gelato product details
 * Note: Gelato API returns dimensions but NOT bleed/trim/safe zones
 * Those must be maintained in our local PrintSpec library
 */
export async function getGelatoPrintSpecs(productUid: string) {
  try {
    const productDetails = await getGelatoProduct(productUid);
    
    // Gelato returns dimensions in mm
    const specs: any = {
      productUid,
      attributes: productDetails.attributes,
      dimensions: productDetails.dimensions,
      weight: productDetails.weight,
      supportedCountries: productDetails.supportedCountries,
      validPageCounts: productDetails.validPageCounts,
      isPrintable: productDetails.isPrintable,
      isStockable: productDetails.isStockable,
    };
    
    return specs;
  } catch (error) {
    console.error('[GELATO_PRINTSPEC_ERROR]', error);
    return null;
  }
}

/**
 * Get pricing for a product (all quantities)
 * GET https://product.gelatoapis.com/v3/products/{productUid}/prices
 */
export async function getGelatoProductPrices(
  productUid: string,
  options?: {
    country?: string;
    currency?: string;
    pageCount?: number;
  }
): Promise<Array<{
  productUid: string;
  country: string;
  quantity: number;
  price: number;
  currency: string;
  pageCount: number | null;
}>> {
  if (!GELATO_API_KEY) {
    console.warn('[GELATO] API key not configured');
    return [];
  }

  const params = new URLSearchParams();
  if (options?.country) params.append('country', options.country);
  if (options?.currency) params.append('currency', options.currency);
  if (options?.pageCount) params.append('pageCount', String(options.pageCount));

  const queryString = params.toString() ? `?${params.toString()}` : '';

  try {
    const response = await fetch(
      `${GELATO_PRODUCT_API_URL}/products/${productUid}/prices${queryString}`,
      {
        headers: {
          'X-API-KEY': GELATO_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('[GELATO_PRICES_ERROR]', response.status);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error('[GELATO_PRICES_ERROR]', error);
    return [];
  }
}

/**
 * Get price for a specific quantity (convenience wrapper)
 */
export async function getGelatoProductPrice(
  productUid: string, 
  quantity: number = 1, 
  country: string = 'US'
) {
  const prices = await getGelatoProductPrices(productUid, { country });
  
  // Find exact quantity match or closest
  const exactMatch = prices.find(p => p.quantity === quantity);
  if (exactMatch) {
    return { price: exactMatch.price, currency: exactMatch.currency };
  }

  // Find closest quantity that's >= requested
  const closestHigher = prices
    .filter(p => p.quantity >= quantity)
    .sort((a, b) => a.quantity - b.quantity)[0];
  
  if (closestHigher) {
    return { price: closestHigher.price, currency: closestHigher.currency };
  }

  return null;
}

/**
 * Check stock availability for products
 * POST https://product.gelatoapis.com/v3/stock/region-availability
 */
export async function checkGelatoStockAvailability(
  productUids: string[]
): Promise<{
  productsAvailability: Array<{
    productUid: string;
    availability: Array<{
      stockRegionUid: string;
      status: 'in-stock' | 'out-of-stock' | 'out-of-stock-replenishable' | 'non-stockable' | 'not-supported';
      replenishmentDate: string | null;
    }>;
  }>;
}> {
  if (!GELATO_API_KEY) {
    throw new Error('GELATO_API_KEY is not configured');
  }

  if (productUids.length === 0 || productUids.length > 250) {
    throw new Error('Must provide between 1 and 250 product UIDs');
  }

  const response = await fetch(`${GELATO_PRODUCT_API_URL}/stock/region-availability`, {
    method: 'POST',
    headers: {
      'X-API-KEY': GELATO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ products: productUids }),
  });

  if (!response.ok) {
    throw new Error(`Failed to check stock availability: ${response.status}`);
  }

  return await response.json();
}

/**
 * Get shipping methods from quote
 */
export async function getShippingMethods(
  productUid: string,
  quantity: number,
  countryCode: string
) {
  try {
    const quoteResponse = await getGelatoQuote({
      orderReferenceId: `shipping-check-${Date.now()}`,
      customerReferenceId: 'shipping-check',
      currency: 'USD',
      recipient: {
        firstName: 'Shipping',
        lastName: 'Check',
        addressLine1: '123 Main St',
        city: 'New York',
        postCode: '10001',
        state: countryCode === 'US' ? 'NY' : undefined,
        country: countryCode,
        email: 'shipping@check.com',
      },
      products: [{
        itemReferenceId: 'item-1',
        productUid,
        quantity,
      }],
    });

    return quoteResponse.quotes?.[0]?.shipmentMethods || [];
  } catch (error) {
    console.error('[GELATO_SHIPPING_ERROR]', error);
    return [];
  }
}

/**
 * Calculate shipping quote (alias for getGelatoQuote with simpler interface)
 */
export async function getShippingQuote(orderData: {
  country: string;
  productUid: string;
  quantity: number;
}) {
  return getShippingMethods(orderData.productUid, orderData.quantity, orderData.country);
}

/**
 * Upload image file to Gelato
 * Note: Gelato typically requires publicly accessible URLs for files in orders.
 * This function uploads to WordPress media library first, then returns the URL.
 * Alternatively, if Gelato has a direct file upload API, that could be used here.
 * 
 * @param file - File object to upload
 * @returns Object with url and id of uploaded file
 */
export async function uploadImageToGelato(file: File): Promise<{ url: string; id: string }> {
  if (!GELATO_API_KEY) {
    throw new Error('GELATO_API_KEY is not configured');
  }

  // Convert File to Buffer for WordPress upload
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to WordPress media library first (since Gelato needs publicly accessible URLs)
  // Import WordPress upload function
  const { uploadMedia } = await import('@/lib/wp');
  
  try {
    const media = await uploadMedia(buffer, file.name, file.type);
    
    // Return WordPress media URL (Gelato will fetch from this URL)
    return {
      url: media.source_url || media.guid?.rendered || media.url,
      id: String(media.id),
    };
  } catch (error) {
    console.error('[GELATO_UPLOAD_ERROR] Failed to upload to WordPress media:', error);
    throw new Error('Failed to upload image. Please ensure WordPress credentials are configured.');
  }
}