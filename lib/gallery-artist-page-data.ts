/**
 * Server-only: resolve gallery artist detail for /gallery/[slug].
 * DB (active artist) takes precedence over content/gallery.json so first paint matches admin data.
 */
import { getDb, artists, artistArtworks, eq, and, asc } from "@/lib/db";
import galleryData from "@/content/gallery.json";

export type GalleryArtistWork = {
  title: string;
  image: string;
  forSale: boolean;
  price?: number | null;
};

export type GalleryArtistPageData = {
  id?: string;
  name: string;
  title: string;
  image: string;
  bioImage?: string;
  bio: string;
  description?: string;
  slug: string;
  portfolio: GalleryArtistWork[];
};

function staticArtistFromJson(slug: string): GalleryArtistPageData | null {
  const staticArtists = galleryData.artists as Array<{
    name: string;
    title?: string;
    image?: string;
    bioImage?: string;
    bio?: string;
    description?: string;
    slug: string;
    portfolio?: GalleryArtistWork[];
  }>;
  const s = staticArtists.find((a) => a.slug === slug);
  if (!s) return null;
  return {
    name: s.name,
    title: s.title || "",
    image: s.image || "",
    bioImage: s.bioImage,
    bio: s.bio || "",
    description: s.description || "",
    slug: s.slug,
    portfolio: Array.isArray(s.portfolio) ? s.portfolio : [],
  };
}

export async function resolveGalleryArtistForSlug(slug: string): Promise<GalleryArtistPageData | null> {
  if (!slug) return null;

  try {
    const db = await getDb();
    const row = await db
      .select()
      .from(artists)
      .where(and(eq(artists.slug, slug), eq(artists.active, true)))
      .get();

    if (row) {
      const works = await db
        .select()
        .from(artistArtworks)
        .where(eq(artistArtworks.artistId, row.id))
        .orderBy(asc(artistArtworks.sortOrder))
        .all();

      return {
        id: row.id,
        name: row.name,
        title: row.title || "",
        image: row.thumbnailImage || row.bioImage || "",
        bioImage: row.bioImage || row.thumbnailImage || "",
        bio: row.bio || "",
        description: row.description || "",
        slug: row.slug,
        portfolio: works
          .filter((w) => w.active)
          .map((w) => ({
            title: w.title,
            image: w.imageUrl,
            forSale: w.forSale,
            price: null,
          })),
      };
    }
  } catch {
    /* fall through to static */
  }

  return staticArtistFromJson(slug);
}
