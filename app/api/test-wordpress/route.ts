import { NextResponse } from 'next/server';

/**
 * Test WordPress API Connection
 * Visit: /api/test-wordpress?url=https://your-wordpress-site.com
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wpUrl = searchParams.get('url') || 
                 process.env.NEXT_PUBLIC_WORDPRESS_URL || 
                 process.env.NEXT_PUBLIC_WOOCOMMERCE_URL;

  if (!wpUrl) {
    return NextResponse.json({
      error: 'No WordPress URL provided',
      instructions: 'Add ?url=https://your-wordpress-site.com to the URL',
    }, { status: 400 });
  }

  const results: any = {
    wordpressUrl: wpUrl,
    timestamp: new Date().toISOString(),
    tests: {},
  };

  async function testEndpoint(name: string, endpoint: string) {
    try {
      const response = await fetch(endpoint, {
        next: { revalidate: 0 }, // Don't cache test requests
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          status: response.status,
          dataCount: Array.isArray(data) ? data.length : 1,
          message: 'Success',
        };
      } else {
        return {
          success: false,
          status: response.status,
          message: `HTTP ${response.status}`,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Connection failed',
      };
    }
  }

  // Test REST API Base
  results.tests.restApi = await testEndpoint(
    'REST API Base',
    `${wpUrl}/wp-json`
  );

  // Test Posts
  if (results.tests.restApi.success) {
    results.tests.posts = await testEndpoint(
      'Blog Posts',
      `${wpUrl}/wp-json/wp/v2/posts?per_page=1`
    );
  }

  // Test Pages
  if (results.tests.restApi.success) {
    results.tests.pages = await testEndpoint(
      'Pages',
      `${wpUrl}/wp-json/wp/v2/pages?per_page=1`
    );
  }

  // Test Media
  if (results.tests.restApi.success) {
    results.tests.media = await testEndpoint(
      'Media Library',
      `${wpUrl}/wp-json/wp/v2/media?per_page=1`
    );
  }

  // Test WooCommerce
  if (results.tests.restApi.success) {
    results.tests.woocommerce = await testEndpoint(
      'WooCommerce Products',
      `${wpUrl}/wp-json/wc/store/v1/products?per_page=1`
    );
  }

  // Calculate overall status
  const allTests = Object.values(results.tests);
  const passedTests = allTests.filter((t: any) => t.success).length;
  results.summary = {
    total: allTests.length,
    passed: passedTests,
    failed: allTests.length - passedTests,
    overall: passedTests > 0 ? 'SUCCESS' : 'FAILED',
  };

  return NextResponse.json(results, {
    status: results.summary.overall === 'SUCCESS' ? 200 : 500,
  });
}

