import { NextResponse } from 'next/server';
import { testConnection as testWooCommerce } from '@/lib/woocommerce';

/**
 * Test connections to WordPress, WooCommerce, and Gelato
 * GET /api/admin/test-connections?service=wordpress|woocommerce|gelato|all
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const service = searchParams.get('service') || 'all';

  const results: {
    wordpress?: any;
    woocommerce?: any;
    gelato?: any;
    timestamp: string;
  } = {
    timestamp: new Date().toISOString(),
  };

  // Test WordPress Connection (with authentication)
  if (service === 'all' || service === 'wordpress') {
    try {
      const wpApiBase = process.env.WP_API_BASE || 
                       (process.env.NEXT_PUBLIC_WORDPRESS_URL 
                         ? `${process.env.NEXT_PUBLIC_WORDPRESS_URL}/wp-json` 
                         : null);
      const wpAppUser = process.env.WP_APP_USER;
      const wpAppPass = process.env.WP_APP_PASS;

      if (!wpApiBase) {
        results.wordpress = {
          success: false,
          message: 'WordPress API base URL not configured (WP_API_BASE or NEXT_PUBLIC_WORDPRESS_URL)',
          configured: false,
        };
      } else if (!wpAppUser || !wpAppPass) {
        results.wordpress = {
          success: false,
          message: 'WordPress Application Password not configured (WP_APP_USER and WP_APP_PASS)',
          configured: false,
          apiBase: wpApiBase,
        };
      } else {
        // Test unauthenticated endpoint first
        const publicTest = await fetch(`${wpApiBase}`, {
          next: { revalidate: 0 },
        });

        if (!publicTest.ok) {
          results.wordpress = {
            success: false,
            message: `WordPress REST API not accessible: ${publicTest.status} ${publicTest.statusText}`,
            configured: true,
            apiBase: wpApiBase,
          };
        } else {
          // Test authenticated endpoint
          const authString = Buffer.from(`${wpAppUser}:${wpAppPass}`).toString('base64');
          const authTest = await fetch(`${wpApiBase}/wp/v2/users/me`, {
            headers: {
              'Authorization': `Basic ${authString}`,
            },
            next: { revalidate: 0 },
          });

          if (authTest.ok) {
            const userData = await authTest.json();
            results.wordpress = {
              success: true,
              message: 'WordPress connection successful',
              configured: true,
              apiBase: wpApiBase,
              authenticated: true,
              user: userData.name || userData.slug,
            };
          } else {
            results.wordpress = {
              success: false,
              message: `WordPress authentication failed: ${authTest.status} ${authTest.statusText}`,
              configured: true,
              apiBase: wpApiBase,
              authenticated: false,
            };
          }
        }
      }
    } catch (error) {
      results.wordpress = {
        success: false,
        message: `WordPress connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        configured: true,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Test WooCommerce Connection
  if (service === 'all' || service === 'woocommerce') {
    try {
      const wcResult = await testWooCommerce();
      results.woocommerce = {
        ...wcResult,
        configured: !!(process.env.WOOCOMMERCE_CONSUMER_KEY && 
                      process.env.WOOCOMMERCE_CONSUMER_SECRET &&
                      (process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || process.env.NEXT_PUBLIC_WORDPRESS_URL)),
      };
    } catch (error) {
      results.woocommerce = {
        success: false,
        message: `WooCommerce connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        configured: !!(process.env.WOOCOMMERCE_CONSUMER_KEY && 
                      process.env.WOOCOMMERCE_CONSUMER_SECRET),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Test Gelato Connection
  if (service === 'all' || service === 'gelato') {
    try {
      const gelatoApiKey = process.env.GELATO_API_KEY;
      const gelatoApiUrl = process.env.GELATO_API_URL || 'https://order.gelatoapis.com/v4';

      if (!gelatoApiKey) {
        results.gelato = {
          success: false,
          message: 'Gelato API key not configured (GELATO_API_KEY)',
          configured: false,
        };
      } else {
        // Test Gelato API connection by checking catalog or products endpoint
        const testResponse = await fetch(`${gelatoApiUrl}/catalog/products`, {
          method: 'GET',
          headers: {
            'X-API-KEY': gelatoApiKey,
            'Content-Type': 'application/json',
          },
          next: { revalidate: 0 },
        });

        if (testResponse.ok) {
          const data = await testResponse.json();
          results.gelato = {
            success: true,
            message: 'Gelato API connection successful',
            configured: true,
            apiUrl: gelatoApiUrl,
            productsAvailable: Array.isArray(data) ? data.length : 'N/A',
          };
        } else {
          const errorText = await testResponse.text();
          results.gelato = {
            success: false,
            message: `Gelato API connection failed: ${testResponse.status} ${testResponse.statusText}`,
            configured: true,
            apiUrl: gelatoApiUrl,
            error: errorText.substring(0, 200), // Limit error text length
          };
        }
      }
    } catch (error) {
      results.gelato = {
        success: false,
        message: `Gelato connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        configured: !!(process.env.GELATO_API_KEY),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Calculate overall status
  const allResults = Object.values(results).filter(
    (r) => r && typeof r === 'object' && 'success' in r
  ) as Array<{ success: boolean }>;
  const allSuccess = allResults.length > 0 && allResults.every((r) => r.success);
  const allConfigured = allResults.every((r) => 'configured' in r && r.configured);

  return NextResponse.json({
    ...results,
    summary: {
      allSuccess,
      allConfigured,
      totalServices: allResults.length,
      successfulServices: allResults.filter((r) => r.success).length,
    },
  });
}

