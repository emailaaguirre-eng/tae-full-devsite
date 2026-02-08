/**
 * Printful API Integration
 * Copyright (c) 2026 B&D Servicing LLC. All rights reserved.
 *
 * Printful REST API v1: https://api.printful.com/
 * Auth: Bearer token via PRINTFUL_TOKEN env var
 * Store selection: X-PF-Store-Id header via PRINTFUL_STORE_ID env var
 */

// =============================================================================
// Configuration
// =============================================================================

const PRINTFUL_API_URL = 'https://api.printful.com';

function getHeaders(): Record<string, string> {
  const token = process.env.PRINTFUL_TOKEN;
  if (!token) {
    throw new Error('PRINTFUL_TOKEN is not configured');
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const storeId = process.env.PRINTFUL_STORE_ID;
  if (storeId) {
    headers['X-PF-Store-Id'] = storeId;
  }

  return headers;
}

// =============================================================================
// Types
// =============================================================================

export interface PrintfulRecipient {
  name: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state_code?: string;
  state_name?: string;
  country_code: string;   // ISO 3166-1 alpha-2
  country_name?: string;
  zip: string;
  phone?: string;
  email?: string;
  tax_number?: string;
}

export interface PrintfulFile {
  type?: string;          // "default", "front", "back", "label_inside", etc.
  url: string;            // Publicly accessible URL to the print file
  filename?: string;
  visible?: boolean;
  position?: {
    area_width: number;
    area_height: number;
    width: number;
    height: number;
    top: number;
    left: number;
  };
}

export interface PrintfulOrderItem {
  variant_id: number;       // Printful catalog variant ID
  quantity: number;
  name?: string;            // Custom item name
  retail_price?: string;    // Retail price shown to customer
  files: PrintfulFile[];
  options?: Array<{
    id: string;
    value: string | boolean | number;
  }>;
  external_id?: string;     // Your system's item ID
  sku?: string;
}

export interface PrintfulRetailCosts {
  currency?: string;
  subtotal?: string;
  discount?: string;
  shipping?: string;
  tax?: string;
  total?: string;
}

export interface PrintfulOrderRequest {
  external_id?: string;           // Your system's order ID
  shipping?: string;              // Shipping method (e.g. "STANDARD")
  recipient: PrintfulRecipient;
  items: PrintfulOrderItem[];
  retail_costs?: PrintfulRetailCosts;
  gift?: {
    subject?: string;
    message?: string;
  };
  packing_slip?: {
    email?: string;
    phone?: string;
    message?: string;
    logo_url?: string;
    store_name?: string;
    custom_order_id?: string;
  };
  is_draft?: boolean;             // If true, create as draft (not sent to production)
}

export interface PrintfulShipment {
  id: number;
  carrier: string;
  service: string;
  tracking_number: string;
  tracking_url: string;
  created: number;
  ship_date: string;
  shipped_at: number;
  reshipment: boolean;
  items: Array<{
    item_id: number;
    quantity: number;
    picked: number;
    printed: number;
  }>;
}

export interface PrintfulOrderResponse {
  id: number;
  external_id: string | null;
  store: number;
  status: string;               // "draft" | "pending" | "failed" | "canceled" | "inprocess" | "onhold" | "partial" | "fulfilled"
  shipping: string;
  shipping_service_name: string;
  created: number;              // Unix timestamp
  updated: number;
  recipient: PrintfulRecipient;
  items: Array<{
    id: number;
    external_id: string | null;
    variant_id: number;
    sync_variant_id: number | null;
    external_variant_id: string | null;
    quantity: number;
    price: string;
    retail_price: string;
    name: string;
    product: {
      variant_id: number;
      product_id: number;
      image: string;
      name: string;
    };
    files: PrintfulFile[];
    options: Array<{ id: string; value: string }>;
    sku: string | null;
    discontinued: boolean;
    out_of_stock: boolean;
  }>;
  shipments: PrintfulShipment[];
  gift: { subject: string; message: string } | null;
  packing_slip: Record<string, string> | null;
  costs: {
    currency: string;
    subtotal: string;
    discount: string;
    shipping: string;
    digitization: string;
    additional_fee: string;
    fulfillment_fee: string;
    retail_delivery_fee: string;
    tax: string;
    vat: string;
    total: string;
  };
  retail_costs: PrintfulRetailCosts;
  pricing_breakdown: Array<Record<string, string>>;
  dashboard_url: string;
}

export interface PrintfulShippingRate {
  id: string;
  name: string;
  rate: string;
  currency: string;
  minDeliveryDays: number;
  maxDeliveryDays: number;
  minDeliveryDate: string;
  maxDeliveryDate: string;
}

export interface PrintfulApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// =============================================================================
// Core fetch wrapper
// =============================================================================

/**
 * Authenticated fetch against Printful API.
 * Handles headers, JSON parsing, and error extraction.
 */
async function pfFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ code: number; result: T }> {
  const headers = getHeaders();

  const response = await fetch(`${PRINTFUL_API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string> || {}),
    },
  });

  const json = await response.json().catch(() => ({
    code: response.status,
    result: response.statusText,
    error: { reason: 'ParseError', message: 'Failed to parse Printful response' },
  }));

  if (!response.ok) {
    const errorMsg =
      json?.error?.message ||
      json?.result ||
      `Printful API error: ${response.status}`;
    throw new Error(errorMsg);
  }

  return json as { code: number; result: T };
}

// =============================================================================
// Order API — https://api.printful.com/orders
// =============================================================================

/**
 * Create a new order on Printful.
 * By default creates a draft (is_draft: true).
 * Set confirm: true to immediately send to production.
 */
export async function createPrintfulOrder(
  orderData: PrintfulOrderRequest,
  options?: { confirm?: boolean }
): Promise<PrintfulApiResult<PrintfulOrderResponse>> {
  try {
    const confirm = options?.confirm ?? false;
    const qs = confirm ? '?confirm=true' : '';

    const { result } = await pfFetch<PrintfulOrderResponse>(`/orders${qs}`, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('[PRINTFUL_CREATE_ORDER]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create Printful order',
    };
  }
}

/**
 * Get an order by its Printful ID or external ID.
 * Use "@" prefix for external ID, e.g. "@TAE-00042".
 */
export async function getPrintfulOrder(
  orderId: string | number
): Promise<PrintfulApiResult<PrintfulOrderResponse>> {
  try {
    const { result } = await pfFetch<PrintfulOrderResponse>(`/orders/${orderId}`);
    return { success: true, data: result };
  } catch (error) {
    console.error('[PRINTFUL_GET_ORDER]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get Printful order',
    };
  }
}

/**
 * Cancel a Printful order.
 * Only draft and pending orders can be cancelled.
 */
export async function cancelPrintfulOrder(
  orderId: string | number
): Promise<PrintfulApiResult<PrintfulOrderResponse>> {
  try {
    const { result } = await pfFetch<PrintfulOrderResponse>(`/orders/${orderId}`, {
      method: 'DELETE',
    });
    return { success: true, data: result };
  } catch (error) {
    console.error('[PRINTFUL_CANCEL_ORDER]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel Printful order',
    };
  }
}

/**
 * Confirm a draft order (sends it to production / fulfillment).
 */
export async function confirmPrintfulOrder(
  orderId: string | number
): Promise<PrintfulApiResult<PrintfulOrderResponse>> {
  try {
    const { result } = await pfFetch<PrintfulOrderResponse>(
      `/orders/${orderId}/confirm`,
      { method: 'POST' }
    );
    return { success: true, data: result };
  } catch (error) {
    console.error('[PRINTFUL_CONFIRM_ORDER]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to confirm Printful order',
    };
  }
}

/**
 * Update a Printful order (only works on draft / pending orders).
 */
export async function updatePrintfulOrder(
  orderId: string | number,
  orderData: Partial<PrintfulOrderRequest>
): Promise<PrintfulApiResult<PrintfulOrderResponse>> {
  try {
    const { result } = await pfFetch<PrintfulOrderResponse>(`/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    });
    return { success: true, data: result };
  } catch (error) {
    console.error('[PRINTFUL_UPDATE_ORDER]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update Printful order',
    };
  }
}

/**
 * Estimate order costs without creating an order.
 * Useful for showing price breakdowns in checkout.
 */
export async function estimateOrderCosts(
  orderData: PrintfulOrderRequest
): Promise<PrintfulApiResult<PrintfulOrderResponse>> {
  try {
    const { result } = await pfFetch<PrintfulOrderResponse>('/orders/estimate', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
    return { success: true, data: result };
  } catch (error) {
    console.error('[PRINTFUL_ESTIMATE]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to estimate order costs',
    };
  }
}

// =============================================================================
// Shipping Rate API — https://api.printful.com/shipping/rates
// =============================================================================

/**
 * Get shipping rates for a set of items to a destination.
 */
export async function getShippingRates(params: {
  recipient: {
    address1?: string;
    city?: string;
    country_code: string;
    state_code?: string;
    zip?: string;
  };
  items: Array<{
    variant_id?: number;
    external_variant_id?: string;
    quantity: number;
  }>;
  currency?: string;
  locale?: string;
}): Promise<PrintfulApiResult<PrintfulShippingRate[]>> {
  try {
    const { result } = await pfFetch<PrintfulShippingRate[]>('/shipping/rates', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return { success: true, data: result };
  } catch (error) {
    console.error('[PRINTFUL_SHIPPING_RATES]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get shipping rates',
    };
  }
}

// =============================================================================
// Catalog API helpers (for product/variant lookups)
// =============================================================================

/**
 * Get a Printful catalog product by ID (includes variants list).
 */
export async function getPrintfulProduct(productId: number): Promise<PrintfulApiResult<any>> {
  try {
    const { result } = await pfFetch<any>(`/products/${productId}`);
    return { success: true, data: result };
  } catch (error) {
    console.error('[PRINTFUL_GET_PRODUCT]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get Printful product',
    };
  }
}

/**
 * Get a specific variant by ID (includes parent product info).
 */
export async function getPrintfulVariant(variantId: number): Promise<PrintfulApiResult<any>> {
  try {
    const { result } = await pfFetch<any>(`/products/variant/${variantId}`);
    return { success: true, data: result };
  } catch (error) {
    console.error('[PRINTFUL_GET_VARIANT]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get Printful variant',
    };
  }
}

/**
 * Get store information (useful for connection tests).
 */
export async function getPrintfulStore(): Promise<PrintfulApiResult<any>> {
  try {
    const { result } = await pfFetch<any>('/store');
    return { success: true, data: result };
  } catch (error) {
    console.error('[PRINTFUL_GET_STORE]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get Printful store info',
    };
  }
}

// =============================================================================
// File Library API helpers
// =============================================================================

/**
 * Upload a file to Printful's file library from a URL.
 * Printful will download the file from the given URL.
 */
export async function addFileFromUrl(
  fileUrl: string,
  filename?: string
): Promise<PrintfulApiResult<any>> {
  try {
    const { result } = await pfFetch<any>('/files', {
      method: 'POST',
      body: JSON.stringify({
        type: 'default',
        url: fileUrl,
        filename: filename || undefined,
      }),
    });
    return { success: true, data: result };
  } catch (error) {
    console.error('[PRINTFUL_ADD_FILE]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add file to Printful',
    };
  }
}

// =============================================================================
// Status mapping helpers
// =============================================================================

/**
 * Map Printful order status to a customer-friendly label.
 * Printful statuses: draft, pending, failed, canceled, inprocess, onhold, partial, fulfilled
 */
export function mapPrintfulStatus(printfulStatus: string): {
  label: string;
  description: string;
  color: string;
} {
  const statusMap: Record<string, { label: string; description: string; color: string }> = {
    draft: {
      label: 'Draft',
      description: 'Order has been created as a draft and is not yet submitted.',
      color: 'gray',
    },
    pending: {
      label: 'Pending',
      description: 'Order is waiting to be fulfilled. Payment is being processed.',
      color: 'yellow',
    },
    failed: {
      label: 'Failed',
      description: 'Order fulfillment has failed. Our team is looking into it.',
      color: 'red',
    },
    canceled: {
      label: 'Cancelled',
      description: 'This order has been cancelled.',
      color: 'red',
    },
    inprocess: {
      label: 'In Production',
      description: 'Your order is being printed and prepared for shipping.',
      color: 'blue',
    },
    onhold: {
      label: 'On Hold',
      description: 'Your order is on hold. We may need additional information.',
      color: 'orange',
    },
    partial: {
      label: 'Partially Shipped',
      description: 'Part of your order has shipped. The rest is still being processed.',
      color: 'purple',
    },
    fulfilled: {
      label: 'Shipped',
      description: 'Your order has been shipped! Check tracking for delivery updates.',
      color: 'green',
    },
  };

  return statusMap[printfulStatus?.toLowerCase()] || {
    label: 'Processing',
    description: 'Your order is being processed.',
    color: 'blue',
  };
}

/**
 * Map editor side IDs to Printful file placement types.
 */
export function mapSideToPrintfulFileType(
  sideId: string,
  productType: 'flat' | 'folded' | 'doubleSided' | 'poster' | 'canvas'
): string {
  switch (productType) {
    case 'folded':
      if (sideId === 'front' || sideId === 'outside') return 'front';
      if (sideId === 'inside' || sideId === 'back') return 'back';
      return 'default';

    case 'doubleSided':
      if (sideId === 'front') return 'front';
      if (sideId === 'back') return 'back';
      return 'default';

    case 'poster':
    case 'canvas':
    case 'flat':
    default:
      return 'default';
  }
}
