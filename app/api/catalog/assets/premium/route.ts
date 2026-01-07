import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * GET /api/catalog/assets/premium
 * Get all premium library assets (for use in customizable products)
 */
export async function GET(request: Request) {
  try {
    const assets = await prisma.asset.findMany({
      where: {
        active: true,
        isAllowedInPremiumLibrary: true,
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
        { artist: { sortOrder: 'asc' } },
        { sortOrder: 'asc' },
        { title: 'asc' },
      ],
    });
    
    // Format response with premium fee info
    const premiumAssets = assets.map(asset => ({
      id: asset.id,
      title: asset.title,
      image: asset.image,
      description: asset.description,
      slug: asset.slug,
      premiumFee: asset.premiumFee || 0,
      editRules: asset.editRules,
      artist: asset.artist,
      metadata: asset.metadata,
    }));
    
    return NextResponse.json(premiumAssets);
  } catch (error) {
    console.error('Error fetching premium assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch premium assets' },
      { status: 500 }
    );
  }
}

