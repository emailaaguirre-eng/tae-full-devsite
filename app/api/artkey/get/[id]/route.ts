import { NextRequest, NextResponse } from 'next/server';
import { getWpApiBase } from '@/lib/wp';

/**
 * ArtKey Get API
 * Proxies to WordPress REST API to fetch ArtKey by ID or token
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const wpApiBase = getWpApiBase();

    // Fetch from WordPress REST API
    const wpResponse = await fetch(`${wpApiBase}/artkey/v1/get/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!wpResponse.ok) {
      return NextResponse.json(
        { error: 'ArtKey not found' },
        { status: 404 }
      );
    }

    const result = await wpResponse.json();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching ArtKey:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch ArtKey' },
      { status: 500 }
    );
  }
}
