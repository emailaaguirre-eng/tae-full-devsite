/**
 * Gallery Artists API
 * GET /api/gallery/artists - List all artists with artwork counts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb, artists, artistArtworks, eq, and, desc, asc, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false';
    const featured = searchParams.get('featured') === 'true';

    // Build conditions array
    const conditions = [];
    if (activeOnly) conditions.push(eq(artists.active, true));
    if (featured) conditions.push(eq(artists.featured, true));

    // Query artists
    const artistsList = await db
      .select()
      .from(artists)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(artists.featured), asc(artists.sortOrder), asc(artists.name))
      .all();

    // Get artwork counts for each artist
    const artistsWithCounts = await Promise.all(
      artistsList.map(async (artist) => {
        const countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(artistArtworks)
          .where(
            and(
              eq(artistArtworks.artistId, artist.id),
              eq(artistArtworks.active, true),
              eq(artistArtworks.forSale, true)
            )
          )
          .get();

        return {
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
          artworkCount: countResult?.count || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: artistsWithCounts,
    });
  } catch (error) {
    console.error('[Gallery Artists API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch artists' },
      { status: 500 }
    );
  }
}
