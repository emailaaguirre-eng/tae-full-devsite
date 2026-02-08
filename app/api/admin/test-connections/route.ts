import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * Test connections to WordPress and Printful
 * GET /api/admin/test-connections?service=wordpress|printful|all
 */
export async function GET(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;
  const { searchParams } = new URL(request.url);
  const service = searchParams.get('service') || 'all';

  const results: {
    wordpress?: any;
    printful?: any;
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

  // Test Printful Connection
  if (service === 'all' || service === 'printful') {
    try {
      const printfulToken = process.env.PRINTFUL_TOKEN;
      const printfulStoreId = process.env.PRINTFUL_STORE_ID;

      if (!printfulToken) {
        results.printful = {
          success: false,
          message: 'Printful API token not configured (PRINTFUL_TOKEN)',
          configured: false,
        };
      } else {
        const headers: Record<string, string> = {
          'Authorization': `Bearer ${printfulToken}`,
          'Content-Type': 'application/json',
        };
        if (printfulStoreId) {
          headers['X-PF-Store-Id'] = printfulStoreId;
        }

        const testResponse = await fetch('https://api.printful.com/store', {
          method: 'GET',
          headers,
          next: { revalidate: 0 },
        });

        if (testResponse.ok) {
          const storeData = await testResponse.json();
          results.printful = {
            success: true,
            message: 'Printful API connection successful',
            configured: true,
            storeName: storeData?.result?.name || 'Connected',
            storeId: printfulStoreId || 'default',
          };
        } else {
          results.printful = {
            success: false,
            message: `Printful API connection failed: ${testResponse.status}`,
            configured: true,
          };
        }
      }
    } catch (error) {
      results.printful = {
        success: false,
        message: `Printful connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        configured: !!process.env.PRINTFUL_TOKEN,
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
