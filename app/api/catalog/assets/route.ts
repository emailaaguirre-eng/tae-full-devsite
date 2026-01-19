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
    const isForSaleAsPrintParam = searchParams.get('isForSaleAsPrint');
    const isAllowedInPremiumLibraryParam = searchParams.get('isAllowedInPremiumLibrary');
    const active = searchParams.get('active') !== 'false'; // Default to true
    
    const where: any = {};
    
    if (active) {
      where.active = true;
    }
    
    if (artistSlug) {
      where.artist = { slug: artistSlug };
    }
    
    // Only filter if the parameter is explicitly provided
    if (isForSaleAsPrintParam !== null) {
      where.isForSaleAsPrint = isForSaleAsPrintParam === 'true';
    }
    
    if (isAllowedInPremiumLibraryParam !== null) {
      where.isAllowedInPremiumLibrary = isAllowedInPremiumLibraryParam === 'true';
    }

    const assets = await prisma.asset.findMany({
      where,
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
    
    console.log(`[Assets API] Found ${assets.length} assets for artistSlug=${artistSlug || 'all'}`);
    
    return NextResponse.json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 }
    );
  }
}

