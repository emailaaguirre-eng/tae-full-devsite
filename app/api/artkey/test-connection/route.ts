import { NextResponse } from "next/server";
import { getWpApiBase, getWpSiteBase } from "@/lib/wp";

// Test endpoint to check WordPress REST API connectivity
export async function GET() {
  try {
    let wpSiteBase: string;
    let wpApiBase: string;
    try {
      wpSiteBase = getWpSiteBase();
      wpApiBase = getWpApiBase();
    } catch (e: any) {
      return NextResponse.json(
        {
          error: e?.message || "WordPress URL not configured",
          env: {
            WP_API_BASE: process.env.WP_API_BASE,
            NEXT_PUBLIC_WORDPRESS_URL: process.env.NEXT_PUBLIC_WORDPRESS_URL,
            NEXT_WORDPRESS_URL: process.env.NEXT_WORDPRESS_URL,
          },
        },
        { status: 500 }
      );
    }
    
    // Test basic WordPress REST API
    const testEndpoints = [
      `${wpSiteBase.replace(/\/$/, '')}/wp-json/`,
      `${wpApiBase}/wp/v2/`,
      `${wpApiBase}/wp/v2/artkey`,
      `${wpApiBase}/artkey/v1/get/691e3d09ef58e`,
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
      wpSiteBase,
      wpApiBase,
      endpoints: results,
    });
  } catch (err: any) {
    return NextResponse.json({
      error: err.message,
    }, { status: 500 });
  }
}
