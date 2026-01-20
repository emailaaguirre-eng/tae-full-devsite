/**
 * Gallery Artist Detail API
 * GET /api/gallery/artists/[slug] - Get artist with their artworks and product options
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const artist = await prisma.artist.findUnique({
      where: { slug },
      include: {
        artworks: {
          where: { active: true },
          orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }],
          include: {
            productLinks: {
              include: {
                category: {
                  select: {
                    id: true,
                    taeId: true,
                    slug: true,
                    name: true,
                    icon: true,
                    taeBaseFee: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!artist) {
      return NextResponse.json(
        { success: false, error: 'Artist not found' },
        { status: 404 }
      );
    }

    // Transform artworks to include pricing with artist royalty
    const artworksWithPricing = artist.artworks.map(artwork => {
      // Get available product options for this artwork
      const productOptions = artwork.productLinks.map(link => {
        // Base price would come from Gelato sync - for now use category fee as base
        const basePrice = 0; // Will be filled by Gelato sync
        const categoryFee = link.category.taeBaseFee;
        const artistRoyalty = artist.royaltyFee;
        const estimatedPrice = basePrice + categoryFee + artistRoyalty;

        return {
          categoryId: link.category.id,
          categoryTaeId: link.category.taeId,
          categorySlug: link.category.slug,
          categoryName: link.category.name,
          categoryIcon: link.category.icon,
          pricing: {
            basePrice,
            categoryFee,
            artistRoyalty,
            estimatedPrice,
            note: 'Final price depends on size/options selected',
          },
        };
      });

      return {
        id: artwork.id,
        taeId: artwork.taeId,
        slug: artwork.slug,
        title: artwork.title,
        description: artwork.description,
        imageUrl: artwork.imageUrl,
        thumbnailUrl: artwork.thumbnailUrl,
        forSale: artwork.forSale,
        featured: artwork.featured,
        productOptions,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
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
        artworks: artworksWithPricing,
        artworkCount: artworksWithPricing.length,
      },
    });
  } catch (error) {
    console.error('[Gallery Artist Detail API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch artist' },
      { status: 500 }
    );
  }
}
