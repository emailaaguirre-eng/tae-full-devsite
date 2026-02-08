/**
 * PayPal REST API v2 Integration
 * Copyright (c) 2026 B&D Servicing LLC. All rights reserved.
 *
 * PayPal Orders API v2: https://developer.paypal.com/docs/api/orders/v2/
 * Auth: OAuth 2.0 client credentials (PAYPAL_CLIENT_ID + PAYPAL_CLIENT_SECRET)
 *
 * Flow:
 *  1. Server creates an order via POST /v2/checkout/orders
 *  2. Client approves the payment using PayPal JS SDK (redirect or popup)
 *  3. Server captures the payment via POST /v2/checkout/orders/{id}/capture
 */

// =============================================================================
// Configuration
// =============================================================================

function getBaseUrl(): string {
  const mode = process.env.PAYPAL_MODE || 'sandbox';
  return mode === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

function getClientId(): string {
  const id = process.env.PAYPAL_CLIENT_ID;
  if (!id) throw new Error('PAYPAL_CLIENT_ID is not configured');
  return id;
}

function getClientSecret(): string {
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!secret) throw new Error('PAYPAL_CLIENT_SECRET is not configured');
  return secret;
}

// =============================================================================
// Types
// =============================================================================

export interface PayPalAmount {
  currency_code: string;       // e.g. "USD"
  value: string;               // e.g. "29.99" — decimal string
  breakdown?: {
    item_total?: { currency_code: string; value: string };
    shipping?: { currency_code: string; value: string };
    tax_total?: { currency_code: string; value: string };
    discount?: { currency_code: string; value: string };
  };
}

export interface PayPalItem {
  name: string;
  description?: string;
  quantity: string;            // e.g. "1"
  unit_amount: {
    currency_code: string;
    value: string;
  };
  sku?: string;
  category?: 'DIGITAL_GOODS' | 'PHYSICAL_GOODS' | 'DONATION';
}

export interface PayPalShipping {
  name?: { full_name: string };
  address?: {
    address_line_1: string;
    address_line_2?: string;
    admin_area_1?: string;     // State/province
    admin_area_2?: string;     // City
    postal_code: string;
    country_code: string;
  };
}

export interface PayPalPurchaseUnit {
  reference_id?: string;
  description?: string;
  custom_id?: string;          // Your internal order ID
  invoice_id?: string;
  amount: PayPalAmount;
  items?: PayPalItem[];
  shipping?: PayPalShipping;
}

export interface PayPalCreateOrderRequest {
  intent: 'CAPTURE' | 'AUTHORIZE';
  purchase_units: PayPalPurchaseUnit[];
  application_context?: {
    brand_name?: string;
    locale?: string;
    landing_page?: 'LOGIN' | 'BILLING' | 'NO_PREFERENCE';
    shipping_preference?: 'GET_FROM_FILE' | 'NO_SHIPPING' | 'SET_PROVIDED_ADDRESS';
    user_action?: 'CONTINUE' | 'PAY_NOW';
    return_url?: string;
    cancel_url?: string;
  };
}

export interface PayPalOrderResponse {
  id: string;
  status: string;              // CREATED, SAVED, APPROVED, VOIDED, COMPLETED, PAYER_ACTION_REQUIRED
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
  purchase_units?: Array<{
    reference_id: string;
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount: PayPalAmount;
        create_time: string;
        update_time: string;
      }>;
    };
  }>;
  payer?: {
    name: { given_name: string; surname: string };
    email_address: string;
    payer_id: string;
    address?: {
      country_code: string;
    };
  };
  create_time?: string;
  update_time?: string;
}

export interface PayPalApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// =============================================================================
// OAuth 2.0 Access Token
// =============================================================================

// Cache token in memory (with expiry)
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get a PayPal OAuth 2.0 access token.
 * Caches the token until it's about to expire.
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const baseUrl = getBaseUrl();
  const clientId = getClientId();
  const clientSecret = getClientSecret();

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[PAYPAL_AUTH]', response.status, errorText);
    throw new Error(`PayPal authentication failed: ${response.status}`);
  }

  const data = await response.json();

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
  };

  return cachedToken.token;
}

// =============================================================================
// Core fetch wrapper
// =============================================================================

async function ppFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getBaseUrl();
  const accessToken = await getAccessToken();

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(options.headers as Record<string, string> || {}),
    },
  });

  // Some PayPal endpoints return 204 (no content)
  if (response.status === 204) {
    return {} as T;
  }

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg =
      json?.message ||
      json?.details?.[0]?.description ||
      json?.error_description ||
      `PayPal API error: ${response.status}`;
    console.error('[PAYPAL_API]', response.status, JSON.stringify(json));
    throw new Error(errorMsg);
  }

  return json as T;
}

// =============================================================================
// Orders API — /v2/checkout/orders
// =============================================================================

/**
 * Create a PayPal order.
 * The client must then approve the order using the PayPal JS SDK,
 * after which you call captureOrder to finalize the payment.
 */
export async function createPayPalOrder(
  orderData: PayPalCreateOrderRequest
): Promise<PayPalApiResult<PayPalOrderResponse>> {
  try {
    const result = await ppFetch<PayPalOrderResponse>('/v2/checkout/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('[PAYPAL_CREATE_ORDER]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create PayPal order',
    };
  }
}

/**
 * Capture payment for an approved PayPal order.
 * Call this AFTER the payer approves via the PayPal JS SDK.
 */
export async function capturePayPalOrder(
  orderId: string
): Promise<PayPalApiResult<PayPalOrderResponse>> {
  try {
    const result = await ppFetch<PayPalOrderResponse>(
      `/v2/checkout/orders/${orderId}/capture`,
      { method: 'POST' }
    );

    return { success: true, data: result };
  } catch (error) {
    console.error('[PAYPAL_CAPTURE_ORDER]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to capture PayPal payment',
    };
  }
}

/**
 * Get PayPal order details.
 */
export async function getPayPalOrder(
  orderId: string
): Promise<PayPalApiResult<PayPalOrderResponse>> {
  try {
    const result = await ppFetch<PayPalOrderResponse>(
      `/v2/checkout/orders/${orderId}`
    );

    return { success: true, data: result };
  } catch (error) {
    console.error('[PAYPAL_GET_ORDER]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get PayPal order details',
    };
  }
}

/**
 * Authorize payment (hold funds without capturing).
 * Use capturePayPalAuthorization later to capture.
 */
export async function authorizePayPalOrder(
  orderId: string
): Promise<PayPalApiResult<PayPalOrderResponse>> {
  try {
    const result = await ppFetch<PayPalOrderResponse>(
      `/v2/checkout/orders/${orderId}/authorize`,
      { method: 'POST' }
    );

    return { success: true, data: result };
  } catch (error) {
    console.error('[PAYPAL_AUTHORIZE_ORDER]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to authorize PayPal payment',
    };
  }
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Get the PayPal client ID for use in the PayPal JS SDK on the frontend.
 * This is safe to expose to the client.
 */
export function getPayPalClientId(): string {
  return process.env.PAYPAL_CLIENT_ID || '';
}

/**
 * Check if PayPal is configured (has credentials).
 */
export function isPayPalConfigured(): boolean {
  return !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

/**
 * Format a number as a PayPal-compatible decimal string.
 * PayPal requires exactly 2 decimal places for USD.
 */
export function formatPayPalAmount(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Build a standard purchase unit for a TAE order.
 */
export function buildPurchaseUnit(params: {
  orderId: string;
  description: string;
  subtotal: number;
  shippingCost: number;
  tax?: number;
  items?: Array<{ name: string; quantity: number; price: number; sku?: string }>;
  currency?: string;
}): PayPalPurchaseUnit {
  const currency = params.currency || 'USD';
  const total = params.subtotal + params.shippingCost + (params.tax || 0);

  const unit: PayPalPurchaseUnit = {
    reference_id: 'default',
    description: params.description,
    custom_id: params.orderId,
    amount: {
      currency_code: currency,
      value: formatPayPalAmount(total),
      breakdown: {
        item_total: {
          currency_code: currency,
          value: formatPayPalAmount(params.subtotal),
        },
        shipping: {
          currency_code: currency,
          value: formatPayPalAmount(params.shippingCost),
        },
      },
    },
  };

  if (params.tax) {
    unit.amount.breakdown!.tax_total = {
      currency_code: currency,
      value: formatPayPalAmount(params.tax),
    };
  }

  if (params.items && params.items.length > 0) {
    unit.items = params.items.map(item => ({
      name: item.name.substring(0, 127), // PayPal max 127 chars
      quantity: String(item.quantity),
      unit_amount: {
        currency_code: currency,
        value: formatPayPalAmount(item.price),
      },
      sku: item.sku,
      category: 'PHYSICAL_GOODS' as const,
    }));
  }

  return unit;
}
