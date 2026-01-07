import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * GET /api/catalog/assets
 * Get all assets with filters
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const artistSlug = searchParams.get('artistSlug');
    const isForSaleAsPrint = searchParams.get('isForSaleAsPrint') === 'true';
    const isAllowedInPremiumLibrary = searchParams.get('isAllowedInPremiumLibrary') === 'true';
    const active = searchParams.get('active') !== 'false'; // Default to true
    
    const assets = await prisma.asset.findMany({
      where: {
        ...(active && { active: true }),
        ...(artistSlug && {
          artist: { slug: artistSlug },
        }),
        ...(isForSaleAsPrint !== null && { isForSaleAsPrint }),
        ...(isAllowedInPremiumLibrary !== null && { isAllowedInPremiumLibrary }),
      },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [
        { sortOrder: 'asc' },
        { title: 'asc' },
      ],
    });
    
    return NextResponse.json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 }
    );
  }
}

