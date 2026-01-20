/**
 * Gallery Artists API
 * GET /api/gallery/artists - List all artists with artwork counts
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false';
    const featured = searchParams.get('featured') === 'true';

    const where: any = {};
    if (activeOnly) where.active = true;
    if (featured) where.featured = true;

    const artists = await prisma.artist.findMany({
      where,
      orderBy: [
        { featured: 'desc' },
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
      include: {
        _count: {
          select: { artworks: { where: { active: true, forSale: true } } },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: artists.map(artist => ({
        id: artist.id,
        slug: artist.slug,
        name: artist.name,
        title: artist.title,
        bio: artist.bio,
        description: artist.description,
        thumbnailImage: artist.thumbnailImage,
        bioImage: artist.bioImage,
        royaltyFee: artist.royaltyFee,
        featured: artist.featured,
        artworkCount: artist._count.artworks,
      })),
    });
  } catch (error) {
    console.error('[Gallery Artists API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch artists' },
      { status: 500 }
    );
  }
}
