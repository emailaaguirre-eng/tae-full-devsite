import { NextResponse } from "next/server";

// Test endpoint to check WordPress REST API connectivity
export async function GET() {
  try {
    const wpBase = process.env.WP_API_BASE || process.env.NEXT_PUBLIC_WORDPRESS_URL;
    if (!wpBase) {
      return NextResponse.json({
        error: 'WP_API_BASE not configured',
        env: {
          WP_API_BASE: process.env.WP_API_BASE,
          NEXT_PUBLIC_WORDPRESS_URL: process.env.NEXT_PUBLIC_WORDPRESS_URL,
        }
      }, { status: 500 });
    }
    
    const baseUrl = wpBase.replace(/\/$/, '');
    
    // Test basic WordPress REST API
    const testEndpoints = [
      `${baseUrl}/wp-json/`,
      `${baseUrl}/wp-json/wp/v2/`,
      `${baseUrl}/wp-json/wp/v2/artkey`,
      `${baseUrl}/wp-json/artkey/v1/get/691e3d09ef58e`,
    ];
    
    const results: Record<string, any> = {};
    
    for (const endpoint of testEndpoints) {
      try {
        const res = await fetch(endpoint, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        results[endpoint] = {
          status: res.status,
          ok: res.ok,
          data: res.ok ? await res.json().catch(() => 'Non-JSON response') : await res.text().catch(() => 'No response'),
        };
      } catch (err: any) {
        results[endpoint] = {
          error: err.message,
        };
      }
    }
    
    return NextResponse.json({
      wpBase,
      baseUrl,
      endpoints: results,
    });
  } catch (err: any) {
    return NextResponse.json({
      error: err.message,
    }, { status: 500 });
  }
}
