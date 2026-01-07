import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * GET /api/catalog/artists
 * Get all active artists
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active') !== 'false'; // Default to true
    
    const artists = await prisma.artist.findMany({
      where: {
        ...(active && { active: true }),
      },
      include: {
        assets: {
          where: { active: true },
          select: {
            id: true,
            title: true,
            image: true,
            slug: true,
            isForSaleAsPrint: true,
            isAllowedInPremiumLibrary: true,
          },
        },
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });
    
    return NextResponse.json(artists);
  } catch (error) {
    console.error('Error fetching artists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artists' },
      { status: 500 }
    );
  }
}

