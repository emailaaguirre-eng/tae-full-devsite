/**
 * Gallery Artist Detail API
 * GET /api/gallery/artists/[slug] - Get artist with their artworks and product options
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb, artists, artistArtworks, artworkProductLinks, shopCategories, eq, and, desc, asc } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const db = await getDb();
    const { slug } = await params;

    // Get artist
    const artist = await db
      .select()
      .from(artists)
      .where(eq(artists.slug, slug))
      .get();

    if (!artist) {
      return NextResponse.json(
        { success: false, error: 'Artist not found' },
        { status: 404 }
      );
    }

    // Get artworks
    const artworks = await db
      .select()
      .from(artistArtworks)
      .where(and(eq(artistArtworks.artistId, artist.id), eq(artistArtworks.active, true)))
      .orderBy(desc(artistArtworks.featured), asc(artistArtworks.sortOrder))
      .all();

    // Get product links with categories for each artwork
    const artworksWithPricing = await Promise.all(
      artworks.map(async (artwork) => {
        // Get product links with category info
        const links = await db
          .select({
            linkId: artworkProductLinks.id,
            categoryId: shopCategories.id,
            categoryTaeId: shopCategories.taeId,
            categorySlug: shopCategories.slug,
            categoryName: shopCategories.name,
            categoryIcon: shopCategories.icon,
            categoryFee: shopCategories.taeBaseFee,
          })
          .from(artworkProductLinks)
          .innerJoin(shopCategories, eq(artworkProductLinks.categoryId, shopCategories.id))
          .where(eq(artworkProductLinks.artworkId, artwork.id))
          .all();

        // Build product options with pricing
        const productOptions = links.map((link) => {
          const basePrice = 0; // Will be filled by Gelato sync
          const categoryFee = link.categoryFee || 5;
          const artistRoyalty = artist.royaltyFee || 0;
          const estimatedPrice = basePrice + categoryFee + artistRoyalty;

          return {
            categoryId: link.categoryId,
            categoryTaeId: link.categoryTaeId,
            categorySlug: link.categorySlug,
            categoryName: link.categoryName,
            categoryIcon: link.categoryIcon,
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
      })
    );

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
