/**
 * Public: Get gallery artists with artworks
 * Returns DB data if available, otherwise signals to use static fallback.
 */
import { NextResponse } from "next/server";
import { getDb, artists, artistArtworks, eq, asc } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    const allArtists = await db
      .select()
      .from(artists)
      .where(eq(artists.active, true))
      .orderBy(asc(artists.sortOrder))
      .all();

    if (allArtists.length === 0) {
      return NextResponse.json({ source: "static", data: [] });
    }

    const result = await Promise.all(
      allArtists.map(async (artist) => {
        const works = await db
          .select()
          .from(artistArtworks)
          .where(eq(artistArtworks.artistId, artist.id))
          .orderBy(asc(artistArtworks.sortOrder))
          .all();

        return {
          ...artist,
          portfolio: works
            .filter((w) => w.active)
            .map((w) => ({
              title: w.title,
              image: w.imageUrl,
              forSale: w.forSale,
              price: null,
            })),
        };
      })
    );

    return NextResponse.json({ source: "db", data: result });
  } catch {
    return NextResponse.json({ source: "static", data: [] });
  }
}
