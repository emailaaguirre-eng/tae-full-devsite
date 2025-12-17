import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    let { token } = await params;
    
    // Handle different token formats from URLs
    // e.g., "artkey-session-691e3d09ef58e" -> "691e3d09ef58e"
    if (token.includes('artkey-session-')) {
      token = token.replace('artkey-session-', '');
    }
    if (token.includes('session-')) {
      token = token.replace('session-', '');
    }
    
    // Query WordPress REST API directly
    const wpBase = process.env.WP_API_BASE || process.env.NEXT_PUBLIC_WORDPRESS_URL;
    if (!wpBase) {
      throw new Error('WP_API_BASE not configured. Set WP_API_BASE or NEXT_PUBLIC_WORDPRESS_URL to your WordPress URL (e.g., https://theartfulexperience.com)');
    }
    
    const baseUrl = wpBase.replace(/\/$/, '');
    
    // Try multiple endpoint patterns
    const endpoints = [
      // Custom endpoint (if exists)
      `${baseUrl}/wp-json/artkey/v1/get/${token}`,
      // Try with full token format
      `${baseUrl}/wp-json/artkey/v1/get/artkey-session-${token}`,
      // Alternative custom endpoint pattern
      `${baseUrl}/wp-json/wp/v2/artkey/get/${token}`,
      // Direct post type with token in path (if supported)
      `${baseUrl}/wp-json/wp/v2/artkey/${token}`,
    ];
    
    let res: Response | null = null;
    let lastError: string = '';
    
    for (const endpoint of endpoints) {
      try {
        res = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (res.ok) {
          break; // Found working endpoint
        }
        lastError = await res.text().catch(() => 'Unknown error');
      } catch (err: any) {
        lastError = err.message;
        continue;
      }
    }
    
    // If all custom endpoints failed, try fetching from standard post type
    if (!res || !res.ok) {
      // Try fetching all artkey posts (limited to 100 for performance)
      // Note: This is not ideal for production - consider adding a custom endpoint
      const allPostsUrl = `${baseUrl}/wp-json/wp/v2/artkey?per_page=100`;
      res = await fetch(allPostsUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (res.ok) {
        const posts = await res.json();
        // Find post with matching token - try multiple token formats
        const tokenVariations = [
          token, // Original token
          `artkey-session-${token}`, // Full format
          `session-${token}`, // Alternative format
        ];
        
        for (const post of posts) {
          // Check if meta is exposed in REST response
          const postToken = post.meta?._artkey_token || post._artkey_token;
          
          // Try matching against all token variations
          if (tokenVariations.includes(postToken) || postToken === token) {
            const artkeyData = {
              id: post.id,
              token: postToken,
              data: (post.meta?._artkey_json || post._artkey_json) 
                ? (typeof (post.meta?._artkey_json || post._artkey_json) === 'string' 
                  ? JSON.parse(post.meta?._artkey_json || post._artkey_json) 
                  : (post.meta?._artkey_json || post._artkey_json))
                : null,
            };
            
            return NextResponse.json(artkeyData, {
              status: 200,
              headers: {
                'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, noimageindex',
              },
            });
          }
        }
      }
      
      // If still not found, return error with helpful message
      return NextResponse.json(
        { 
          error: 'ArtKey not found',
          details: `Token: ${token}. Tried multiple endpoints. Last error: ${lastError}`,
          suggestion: 'Ensure the WordPress REST API endpoint is accessible and the token exists.'
        },
        {
          status: 404,
          headers: {
            'X-Robots-Tag': 'noindex, nofollow',
          },
        }
      );
    }
    
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
