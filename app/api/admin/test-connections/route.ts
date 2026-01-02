import { NextResponse } from 'next/server';

/**
 * Test connections to WordPress and Gelato
 * GET /api/admin/test-connections?service=wordpress|gelato|all
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const service = searchParams.get('service') || 'all';

  const results: {
    wordpress?: any;
    gelato?: any;
    timestamp: string;
  } = {
    timestamp: new Date().toISOString(),
  };

  // Test WordPress Connection
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
          message: 'WordPress API base URL not configured',
          configured: false,
        };
      } else if (!wpAppUser || !wpAppPass) {
        results.wordpress = {
          success: false,
          message: 'WordPress Application Password not configured',
          configured: false,
          apiBase: wpApiBase,
        };
      } else {
        const publicTest = await fetch(`${wpApiBase}`, { next: { revalidate: 0 } });
        if (!publicTest.ok) {
          results.wordpress = {
            success: false,
            message: `WordPress REST API not accessible: ${publicTest.status}`,
            configured: true,
            apiBase: wpApiBase,
          };
        } else {
          const authString = Buffer.from(`${wpAppUser}:${wpAppPass}`).toString('base64');
          const authTest = await fetch(`${wpApiBase}/wp/v2/users/me`, {
            headers: { 'Authorization': `Basic ${authString}` },
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
              message: `WordPress authentication failed: ${authTest.status}`,
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
      };
    }
  }

  // Test Gelato Connection
  if (service === 'all' || service === 'gelato') {
    try {
      const gelatoApiKey = process.env.GELATO_API_KEY;
      const gelatoProductApiUrl = process.env.GELATO_PRODUCT_API_URL || 'https://product.gelatoapis.com/v3';

      if (!gelatoApiKey) {
        results.gelato = {
          success: false,
          message: 'Gelato API key not configured',
          configured: false,
        };
      } else {
        const testResponse = await fetch(`${gelatoProductApiUrl}/products`, {
          method: 'GET',
          headers: {
            'X-API-KEY': gelatoApiKey,
            'Content-Type': 'application/json',
          },
          next: { revalidate: 0 },
        });

        if (testResponse.ok) {
          results.gelato = {
            success: true,
            message: 'Gelato API connection successful',
            configured: true,
            apiUrl: gelatoProductApiUrl,
          };
        } else {
          results.gelato = {
            success: false,
            message: `Gelato API connection failed: ${testResponse.status}`,
            configured: true,
            apiUrl: gelatoProductApiUrl,
          };
        }
      }
    } catch (error) {
      results.gelato = {
        success: false,
        message: `Gelato connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        configured: !!process.env.GELATO_API_KEY,
      };
    }
  }

  const allResults = Object.values(results).filter(
    (r) => r && typeof r === 'object' && 'success' in r
  ) as Array<{ success: boolean }>;

  return NextResponse.json({
    ...results,
    summary: {
      allSuccess: allResults.every((r) => r.success),
      totalServices: allResults.length,
      successfulServices: allResults.filter((r) => r.success).length,
    },
  });
}
