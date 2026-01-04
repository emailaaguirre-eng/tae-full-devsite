import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserArtKeys } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const user = verifyToken(token);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Get user's ArtKeys
    const artKeys = await getUserArtKeys(user.id);

    return NextResponse.json({
      success: true,
      artKeys,
    });
  } catch (error: any) {
    console.error('Error fetching ArtKeys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ArtKeys' },
      { status: 500 }
    );
  }
}

