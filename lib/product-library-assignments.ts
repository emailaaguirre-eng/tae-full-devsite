/**
 * Product ↔ Product Media Library assignments (Phase 2 storefront hero + global gallery).
 */
import { inArray } from "drizzle-orm";
import { productMediaLibrary } from "@/db/schema";
import type { getDb } from "@/db";
import { parseLibraryGalleryIdsJson } from "@/lib/product-library-ids";

export type DbInstance = Awaited<ReturnType<typeof getDb>>;

/** Resolved URLs + ids for merge into storefront image rows (library first). */
export type LibraryResolvedForMerge = {
  hero: { assetId: string; url: string } | null;
  gallery: { assetId: string; url: string }[];
};

export { parseLibraryGalleryIdsJson, galleryIdsJsonFromList } from "@/lib/product-library-ids";

/** Collect unique library asset ids referenced by a list of shop product rows. */
export function collectLibraryAssetIdsFromProducts(
  products: Array<{
    libraryHeroMediaId?: string | null;
    libraryGalleryMediaIdsJson?: string | null;
  }>
): string[] {
  const out = new Set<string>();
  for (const p of products) {
    const h = (p.libraryHeroMediaId || "").trim();
    if (h) out.add(h);
    for (const id of parseLibraryGalleryIdsJson(p.libraryGalleryMediaIdsJson)) {
      out.add(id);
    }
  }
  return [...out];
}

export async function fetchProductMediaUrlMap(db: DbInstance, assetIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const ids = [...new Set(assetIds.map((x) => x.trim()).filter(Boolean))];
  if (ids.length === 0) return map;
  const rows = await db.select().from(productMediaLibrary).where(inArray(productMediaLibrary.id, ids)).all();
  for (const r of rows) {
    if (r.imageUrl?.trim()) map.set(r.id, r.imageUrl.trim());
  }
  return map;
}

export function buildLibraryResolvedForMerge(
  libraryHeroMediaId: string | null | undefined,
  libraryGalleryMediaIdsJson: string | null | undefined,
  urlById: Map<string, string>
): LibraryResolvedForMerge | null {
  const heroId = (libraryHeroMediaId || "").trim() || null;
  const heroUrl = heroId ? urlById.get(heroId) ?? null : null;
  const gallery: { assetId: string; url: string }[] = [];
  for (const id of parseLibraryGalleryIdsJson(libraryGalleryMediaIdsJson)) {
    const url = urlById.get(id);
    if (url?.trim()) gallery.push({ assetId: id, url: url.trim() });
  }
  if (!heroUrl?.trim() && gallery.length === 0) return null;
  return {
    hero: heroUrl && heroId ? { assetId: heroId, url: heroUrl.trim() } : null,
    gallery,
  };
}
