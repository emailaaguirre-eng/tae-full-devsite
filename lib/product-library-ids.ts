/** Client-safe: Product Media Library id list JSON on ShopProduct (no DB imports). */

export function parseLibraryGalleryIdsJson(raw: string | null | undefined): string[] {
  if (!raw || !raw.trim()) return [];
  try {
    const p = JSON.parse(raw);
    if (!Array.isArray(p)) return [];
    return p
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map((x) => x.trim());
  } catch {
    return [];
  }
}

export function galleryIdsJsonFromList(ids: string[]): string {
  const clean = ids.map((x) => x.trim()).filter(Boolean);
  return JSON.stringify(clean);
}
