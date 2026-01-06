/**
 * Network Error Handler Utility
 * Provides better error handling for WordPress API calls
 */

export interface NetworkError {
  type: 'NETWORK_ERROR' | 'CORS_ERROR' | 'TIMEOUT_ERROR' | 'API_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  status?: number;
  url?: string;
}

/**
 * Enhanced fetch with timeout and better error handling
 */
export async function safeFetch(
  url: string,
  options: RequestInit = {},
  timeout = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error(Request timeout after ms: );
    }
    
    if (error.message?.includes('CORS') || error.message?.includes('cross-origin')) {
      throw new Error(CORS error: . Check if WordPress allows requests from this origin.);
    }
    
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      throw new Error(Network error: Cannot connect to . Check your internet connection and WordPress URL.);
    }
    
    throw error;
  }
}

/**
 * Check if WordPress API is accessible
 */
export async function testWordPressConnection(wpUrl?: string): Promise<{
  success: boolean;
  error?: string;
  details?: any;
}> {
  const url = wpUrl || process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || 'https://theartfulexperience.com';
  const apiUrl = ${url}/wp-json;
  
  try {
    const response = await safeFetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }, 5000);
    
    if (!response.ok) {
      return {
        success: false,
        error: HTTP : ,
        details: {
          status: response.status,
          statusText: response.statusText,
          url: apiUrl,
        },
      };
    }
    
    const data = await response.json();
    return {
      success: true,
      details: {
        name: data.name,
        url: apiUrl,
        status: response.status,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error',
      details: {
        url: apiUrl,
        message: error.message,
      },
    };
  }
}
