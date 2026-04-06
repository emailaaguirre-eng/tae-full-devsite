/**
 * Printful API Service
 *
 * Handles all communication with the Printful v2 API:
 * - File upload (for customer designs)
 * - Order creation & submission
 * - Shipping rate estimation
 * - Order status tracking
 *
 * Requires env vars: PRINTFUL_TOKEN, PRINTFUL_STORE_ID
 */

const PRINTFUL_BASE = "https://api.printful.com";

function getToken(): string {
  const token = process.env.PRINTFUL_TOKEN;
  if (!token) throw new Error("Missing PRINTFUL_TOKEN env var");
  return token;
}

function getStoreId(): string {
  return process.env.PRINTFUL_STORE_ID || "17578870";
}

/** True when Printful API calls can be attempted (token present). */
export function isPrintfulConfigured(): boolean {
  return Boolean(process.env.PRINTFUL_TOKEN?.trim());
}

function headers(): HeadersInit {
  return {
    Authorization: `Bearer ${getToken()}`,
    "X-PF-Store-ID": getStoreId(),
    "Content-Type": "application/json",
  };
}

async function pfFetch<T = any>(
  path: string,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data: T; error?: string }> {
  const res = await fetch(`${PRINTFUL_BASE}${path}`, {
    ...options,
    headers: { ...headers(), ...(options?.headers || {}) },
    cache: "no-store",
  });

  const text = await res.text();
  let json: any;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      data: json,
      error: json?.error?.message || json?.result || res.statusText,
    };
  }

  return { ok: true, status: res.status, data: json?.result ?? json };
}

// ─── File Upload ──────────────────────────────────────────────────────────

/**
 * Upload a design file to Printful via URL.
 * Printful fetches the image from the provided URL.
 */
export async function uploadFileByUrl(
  imageUrl: string,
  filename: string
): Promise<{ id: number; url: string }> {
  const res = await pfFetch<any>("/files", {
    method: "POST",
    body: JSON.stringify({
      url: imageUrl,
      filename,
    }),
  });

  if (!res.ok) {
    throw new Error(`Printful file upload failed: ${res.error}`);
  }

  return { id: res.data.id, url: res.data.url || res.data.preview_url };
}

/**
 * Upload a design file as base64 data.
 * Converts the data URL to a format Printful accepts.
 */
export async function uploadFileBase64(
  dataUrl: string,
  filename: string
): Promise<{ id: number; url: string }> {
  // Printful's file API prefers URL-based uploads.
  // For base64, we upload the raw data.
  const base64Data = dataUrl.split(",")[1];

  const res = await pfFetch<any>("/files", {
    method: "POST",
    body: JSON.stringify({
      type: "default",
      filename,
      contents: base64Data,
    }),
  });

  if (!res.ok) {
    throw new Error(`Printful file upload failed: ${res.error}`);
  }

  return { id: res.data.id, url: res.data.url || res.data.preview_url };
}

// ─── Shipping Rates ───────────────────────────────────────────────────────

export interface ShippingRateItem {
  variant_id: number;
  quantity: number;
  files?: { url: string }[];
}

export interface ShippingAddress {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state_code: string;
  zip: string;
  country_code: string;
  phone?: string;
  email?: string;
}

export interface ShippingRate {
  id: string;
  name: string;
  rate: string;
  currency: string;
  minDeliveryDays: number;
  maxDeliveryDays: number;
}

/**
 * Get shipping rates for a set of items to a destination address.
 */
export async function getShippingRates(
  recipient: ShippingAddress,
  items: ShippingRateItem[]
): Promise<ShippingRate[]> {
  const res = await pfFetch<any[]>("/shipping/rates", {
    method: "POST",
    body: JSON.stringify({
      recipient: {
        name: recipient.name,
        address1: recipient.address1,
        address2: recipient.address2,
        city: recipient.city,
        state_code: recipient.state_code,
        zip: recipient.zip,
        country_code: recipient.country_code,
        phone: recipient.phone,
        email: recipient.email,
      },
      items: items.map((i) => ({
        variant_id: i.variant_id,
        quantity: i.quantity,
      })),
    }),
  });

  if (!res.ok) {
    throw new Error(`Printful shipping rates failed: ${res.error}`);
  }

  const rates: ShippingRate[] = (res.data || []).map((r: any) => ({
    id: r.id,
    name: r.name,
    rate: r.rate,
    currency: r.currency,
    minDeliveryDays: r.minDeliveryDays ?? r.min_delivery_days ?? 0,
    maxDeliveryDays: r.maxDeliveryDays ?? r.max_delivery_days ?? 0,
  }));

  return rates;
}

// ─── Order Creation ───────────────────────────────────────────────────────

export interface PrintfulOrderItem {
  variant_id: number;
  quantity: number;
  name?: string;
  retail_price?: string;
  files: {
    type?: string;
    url?: string;
    id?: number;
  }[];
}

export interface PrintfulOrder {
  external_id?: string;
  recipient: ShippingAddress;
  items: PrintfulOrderItem[];
}

/**
 * Create a new order in Printful (draft by default).
 * Set confirm=true to auto-submit for fulfillment.
 */
export async function createOrder(
  order: PrintfulOrder,
  confirm = false
): Promise<{ id: number; status: string; externalId?: string }> {
  const res = await pfFetch<any>(`/orders${confirm ? "?confirm=true" : ""}`, {
    method: "POST",
    body: JSON.stringify(order),
  });

  if (!res.ok) {
    throw new Error(`Printful order creation failed: ${res.error}`);
  }

  return {
    id: res.data.id,
    status: res.data.status,
    externalId: res.data.external_id,
  };
}

/**
 * Confirm (submit for fulfillment) an existing draft order.
 */
export async function confirmOrder(
  orderId: number
): Promise<{ id: number; status: string }> {
  const res = await pfFetch<any>(`/orders/${orderId}/confirm`, {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error(`Printful order confirmation failed: ${res.error}`);
  }

  return { id: res.data.id, status: res.data.status };
}

// ─── Order Status ─────────────────────────────────────────────────────────

export interface PrintfulOrderStatus {
  id: number;
  externalId: string | null;
  status: string;
  shipping: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  carrier: string | null;
  created: string;
  updated: string;
}

/**
 * Get the status of an order by Printful order ID.
 */
export async function getOrderStatus(
  orderId: number
): Promise<PrintfulOrderStatus> {
  const res = await pfFetch<any>(`/orders/${orderId}`);

  if (!res.ok) {
    throw new Error(`Printful order status failed: ${res.error}`);
  }

  const shipment = res.data.shipments?.[0];

  return {
    id: res.data.id,
    externalId: res.data.external_id,
    status: res.data.status,
    shipping: res.data.shipping_service_name || null,
    trackingNumber: shipment?.tracking_number || null,
    trackingUrl: shipment?.tracking_url || null,
    carrier: shipment?.carrier || null,
    created: res.data.created,
    updated: res.data.updated,
  };
}

/**
 * Get the status of an order by external ID (our order number).
 */
export async function getOrderByExternalId(
  externalId: string
): Promise<PrintfulOrderStatus> {
  const res = await pfFetch<any>(`/orders/@${externalId}`);

  if (!res.ok) {
    throw new Error(`Printful order lookup failed: ${res.error}`);
  }

  const shipment = res.data.shipments?.[0];

  return {
    id: res.data.id,
    externalId: res.data.external_id,
    status: res.data.status,
    shipping: res.data.shipping_service_name || null,
    trackingNumber: shipment?.tracking_number || null,
    trackingUrl: shipment?.tracking_url || null,
    carrier: shipment?.carrier || null,
    created: res.data.created,
    updated: res.data.updated,
  };
}

// ─── Product Catalog ──────────────────────────────────────────────────────

/**
 * Get product details from Printful catalog.
 */
export async function getProduct(productId: number) {
  const res = await pfFetch<any>(`/products/${productId}`);
  if (!res.ok) throw new Error(`Printful product fetch failed: ${res.error}`);
  return res.data;
}

/**
 * Get variant details from Printful catalog.
 */
export async function getVariant(variantId: number) {
  const res = await pfFetch<any>(`/products/variant/${variantId}`);
  if (!res.ok) throw new Error(`Printful variant fetch failed: ${res.error}`);
  return res.data;
}

// ─── Mockup Generation ───────────────────────────────────────────────────

/**
 * Get available mockup templates for a product.
 */
export async function getMockupTemplates(productId: number) {
  const res = await pfFetch<any>(`/mockup-generator/templates/${productId}`);
  if (!res.ok) throw new Error(`Printful templates fetch failed: ${res.error}`);
  return res.data;
}

/** Printful mockup create-task file entry; `position` required for many catalog products. */
export interface MockupGenerationFile {
  placement: string;
  image_url?: string;
  image?: string;
  position?: {
    area_width: number;
    area_height: number;
    width: number;
    height: number;
    top: number;
    left: number;
  };
}

export interface MockupGenerationRequest {
  variant_ids: number[];
  format?: "jpg" | "png";
  files: MockupGenerationFile[];
  option_groups?: string[];
  options?: string[];
}

/**
 * Create a mockup generation task.
 * Returns a task_key used to poll for completion.
 */
export async function createMockupTask(
  productId: number,
  body: MockupGenerationRequest
): Promise<{ task_key: string; status: string }> {
  const res = await pfFetch<any>(`/mockup-generator/create-task/${productId}`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Printful mockup task creation failed: ${res.error}`);
  }

  return {
    task_key: res.data.task_key,
    status: res.data.status,
  };
}

export interface MockupResult {
  status: string;
  mockups?: Array<{
    placement: string;
    variant_ids: number[];
    mockup_url: string;
    extra: Array<{ title: string; url: string; option: string; option_group: string }>;
  }>;
  error?: string;
}

/**
 * Poll a mockup generation task for its result.
 */
export async function getMockupTaskResult(taskKey: string): Promise<MockupResult> {
  const res = await pfFetch<any>(`/mockup-generator/task?task_key=${encodeURIComponent(taskKey)}`);

  if (!res.ok) {
    throw new Error(`Printful mockup task poll failed: ${res.error}`);
  }

  return {
    status: res.data.status,
    mockups: res.data.mockups || undefined,
    error: res.data.error || undefined,
  };
}

/**
 * Get printfile specifications for a product.
 */
export async function getPrintfiles(productId: number, orientation?: string, technique?: string) {
  const qs = new URLSearchParams();
  if (orientation) qs.set("orientation", orientation);
  if (technique) qs.set("technique", technique);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";

  const res = await pfFetch<any>(`/mockup-generator/printfiles/${productId}${suffix}`);
  if (!res.ok) throw new Error(`Printful printfiles fetch failed: ${res.error}`);
  return res.data;
}
