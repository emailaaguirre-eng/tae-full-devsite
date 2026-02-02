/**
 * Gelato Order Service
 * Copyright (c) 2026 B&D Servicing LLC. All rights reserved.
 * 
 * Handles file uploads and order submission to Gelato Print API
 */

const GELATO_API_KEY = process.env.GELATO_API_KEY || '';
const GELATO_API_URL = 'https://order.gelatoapis.com/v4';

export interface FileUploadResult {
  success: boolean;
  fileUrl?: string;
  error?: string;
}

export interface GelatoOrderItem {
  itemReferenceId: string;
  productUid: string;
  files: Array<{
    type: 'default' | 'front' | 'back' | 'inside' | 'outside';
    url: string;
  }>;
  quantity: number;
}

export interface GelatoShippingAddress {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postCode: string;
  state?: string;
  country: string; // ISO 3166-1 alpha-2 code
  email: string;
  phone?: string;
}

export interface GelatoOrderRequest {
  orderReferenceId: string;
  customerReferenceId?: string;
  currency: string;
  items: GelatoOrderItem[];
  shippingAddress: GelatoShippingAddress;
  metadata?: Record<string, string>;
}

export interface GelatoOrderResponse {
  id: string;
  orderReferenceId: string;
  fulfillmentStatus: string;
  financialStatus: string;
  items: Array<{
    id: string;
    itemReferenceId: string;
    productUid: string;
    status: string;
  }>;
  createdAt: string;
}

/**
 * Upload a file to WordPress Media Library for Gelato
 * Uses the /api/upload endpoint which handles WordPress REST API
 */
export async function uploadFileForGelato(
  fileBlob: Blob,
  fileName: string,
  baseUrl: string = ''
): Promise<FileUploadResult> {
  try {
    const formData = new FormData();
    formData.append('file', fileBlob, fileName);
    formData.append('fileName', fileName);

    const response = await fetch(`${baseUrl}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Upload failed',
      };
    }

    return {
      success: true,
      fileUrl: result.url,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file',
    };
  }
}

/**
 * Create a draft order in Gelato
 * Draft orders can be reviewed before payment
 */
export async function createDraftOrder(
  order: GelatoOrderRequest
): Promise<{ success: boolean; data?: GelatoOrderResponse; error?: string }> {
  if (!GELATO_API_KEY) {
    return { success: false, error: 'Gelato API key not configured' };
  }

  try {
    const response = await fetch(`${GELATO_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': GELATO_API_KEY,
      },
      body: JSON.stringify({
        ...order,
        // Draft mode - won't charge until confirmed
        orderType: 'draft',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `API error: ${response.status}`,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order',
    };
  }
}

/**
 * Create and submit an order to Gelato
 * This will immediately process and charge the order
 */
export async function submitOrder(
  order: GelatoOrderRequest
): Promise<{ success: boolean; data?: GelatoOrderResponse; error?: string }> {
  if (!GELATO_API_KEY) {
    return { success: false, error: 'Gelato API key not configured' };
  }

  try {
    const response = await fetch(`${GELATO_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': GELATO_API_KEY,
      },
      body: JSON.stringify({
        ...order,
        orderType: 'order',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `API error: ${response.status}`,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit order',
    };
  }
}

/**
 * Get order status from Gelato
 */
export async function getOrderStatus(
  orderId: string
): Promise<{ success: boolean; data?: GelatoOrderResponse; error?: string }> {
  if (!GELATO_API_KEY) {
    return { success: false, error: 'Gelato API key not configured' };
  }

  try {
    const response = await fetch(`${GELATO_API_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'X-API-KEY': GELATO_API_KEY,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `API error: ${response.status}`,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get order status',
    };
  }
}

/**
 * Cancel a draft order
 */
export async function cancelOrder(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  if (!GELATO_API_KEY) {
    return { success: false, error: 'Gelato API key not configured' };
  }

  try {
    const response = await fetch(`${GELATO_API_URL}/orders/${orderId}:cancel`, {
      method: 'POST',
      headers: {
        'X-API-KEY': GELATO_API_KEY,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `API error: ${response.status}`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel order',
    };
  }
}

/**
 * Get shipping options and quotes for an order
 */
export async function getShippingQuote(
  productUid: string,
  quantity: number,
  country: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!GELATO_API_KEY) {
    return { success: false, error: 'Gelato API key not configured' };
  }

  try {
    const response = await fetch(`${GELATO_API_URL}/shipment/quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': GELATO_API_KEY,
      },
      body: JSON.stringify({
        products: [
          {
            productUid,
            quantity,
          },
        ],
        shippingAddress: {
          country,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `API error: ${response.status}`,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get shipping quote',
    };
  }
}

/**
 * Map editor side IDs to Gelato file types
 */
export function mapSideToGelatoFileType(
  sideId: string,
  productType: 'flat' | 'folded' | 'doubleSided'
): 'default' | 'front' | 'back' | 'inside' | 'outside' {
  switch (productType) {
    case 'folded':
      // Folded cards have outside (front cover + back) and inside
      if (sideId === 'front' || sideId === 'outside') return 'outside';
      if (sideId === 'inside' || sideId === 'back') return 'inside';
      return 'default';
    
    case 'doubleSided':
      // Double-sided products have front and back
      if (sideId === 'front') return 'front';
      if (sideId === 'back') return 'back';
      return 'default';
    
    case 'flat':
    default:
      // Single-sided products use default
      return 'default';
  }
}
