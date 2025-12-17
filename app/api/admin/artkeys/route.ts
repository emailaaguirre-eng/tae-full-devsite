import { NextResponse } from "next/server";

export async function GET() {
  try {
    const wpBase = process.env.WP_API_BASE || process.env.NEXT_PUBLIC_WORDPRESS_URL;
    if (!wpBase) {
      return NextResponse.json(
        { error: 'WP_API_BASE not configured' },
        { status: 500 }
      );
    }

    const baseUrl = wpBase.replace(/\/$/, '');
    
    // Fetch all artkey posts from WordPress
    const res = await fetch(`${baseUrl}/wp-json/wp/v2/artkey?per_page=100`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch ArtKeys from WordPress' },
        { status: res.status }
      );
    }

    const posts = await res.json();
    
    // Format ArtKeys for admin display
    const artkeys = posts.map((post: any) => ({
      id: post.id,
      token: post.meta?._artkey_token || post._artkey_token || 'N/A',
      title: post.title?.rendered || post.title || 'Untitled',
      createdAt: post.date || new Date().toISOString(),
    }));

    return NextResponse.json({ artkeys });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch ArtKeys' },
      { status: 500 }
    );
  }
}
