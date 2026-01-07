import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * GET /api/catalog/artists/[slug]
 * Get artist by slug with all assets
 */
export async function GET(
  request: Request,
  { params }: { params: { slug: string } | Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const { slug } = resolvedParams;
    
    const artist = await prisma.artist.findUnique({
      where: { slug },
      include: {
        assets: {
          where: { active: true },
          orderBy: [
            { sortOrder: 'asc' },
            { title: 'asc' },
          ],
        },
      },
    });
    
    if (!artist) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(artist);
  } catch (error) {
    console.error('Error fetching artist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artist' },
      { status: 500 }
    );
  }
}

