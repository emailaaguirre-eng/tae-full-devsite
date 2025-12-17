import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    
    // Query WordPress REST API directly
    const wpBase = process.env.WP_API_BASE || process.env.NEXT_PUBLIC_WORDPRESS_URL;
    if (!wpBase) {
      throw new Error('WP_API_BASE not configured');
    }
    
    const wpUrl = `${wpBase.replace(/\/$/, '')}/wp-json/artkey/v1/get/${token}`;
    const res = await fetch(wpUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // No auth needed - endpoint is public
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: `Failed to fetch ArtKey: ${errorText}` },
        {
          status: res.status,
          headers: {
            'X-Robots-Tag': 'noindex, nofollow',
          },
        }
      );
    }
    
    const data = await res.json();
    
    // Add X-Robots-Tag header to prevent indexing
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, noimageindex',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unknown error" },
      {
        status: 500,
        headers: {
          'X-Robots-Tag': 'noindex, nofollow',
        },
      }
    );
  }
}
