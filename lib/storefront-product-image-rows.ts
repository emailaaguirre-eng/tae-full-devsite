/**
 * Builds merged ShopProductImage rows + preview URLs (server / API only).
 * @copyright B&D Servicing LLC 2026
 */

import type { shopProductImages } from "@/db/schema";
import { mergeLegacyAndDbImages } from "@/lib/shop-product-images";
import { buildProductPreviewUrl, buildShopProductImagePreviewUrl } from "@/lib/product-watermark";
import type { StorefrontProductImage } from "@/lib/product-image-types";
import type { LibraryResolvedForMerge } from "@/lib/product-library-assignments";
import { normalizeHeroFlags } from "@/lib/product-image-ui";
import { isPrintfulApiSampleSourceRow } from "@/lib/storefront-product-images";

export type ShopProductImageRow = typeof shopProductImages.$inferSelect;

/** Drop later rows that resolve to the same customer-facing preview URL (first row wins). */
function dedupeStorefrontRowsByPreviewUrlPreserveOrder(
  rows: StorefrontProductImage[]
): StorefrontProductImage[] {
  const seen = new Set<string>();
  const out: StorefrontProductImage[] = [];
  for (const r of rows) {
    const u = (r.previewUrl || "").trim();
    if (!u || seen.has(u)) continue;
    seen.add(u);
    out.push(r);
  }
  return out;
}

function isLibraryVirtualRow(row: Pick<StorefrontProductImage, "id">): boolean {
  return String(row.id || "").startsWith("libasset:");
}

/** Public hero: admin general, library, or variant row used as hero — never Printful `api`. */
function isPublicHeroCandidateRow(row: StorefrontProductImage): boolean {
  if (isPrintfulApiSampleSourceRow(row)) return false;
  const st = String(row.sourceType || "general").trim().toLowerCase();
  if (st === "general") return true;
  if (isLibraryVirtualRow(row)) return true;
  if (st === "variant") return true;
  return false;
}

/** Public top-level gallery: admin `general` + library only (no variant-matrix-only rows here). */
function isPublicGalleryStripRow(row: StorefrontProductImage): boolean {
  if (isPrintfulApiSampleSourceRow(row)) return false;
  const st = String(row.sourceType || "general").trim().toLowerCase();
  if (st === "general") return true;
  if (isLibraryVirtualRow(row)) return true;
  return false;
}

/**
 * Public hero + gallery preview URLs aligned with `productImages` row previews when approved rows exist.
 * - Excludes Printful/API (`sourceType === "api"`) samples from public hero and gallery.
 * - Public gallery is general + library only; variant-targeted rows stay in `productImages` for PDP matching.
 * - Avoids duplicate URLs vs legacy `kind=hero` / `kind=gallery` preview paths.
 */
export function derivePublicHeroAndGalleryPreviews(
  productImages: StorefrontProductImage[],
  productId: string,
  legacyHeroRaw: string | null | undefined,
  legacyGalleryJson: string | null | undefined
): { hero: string | null; gallery: string[] } {
  const sorted = productImages
    .filter((r) => r.isActive !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const approved = sorted.filter((r) => !isPrintfulApiSampleSourceRow(r));

  if (sorted.length > 0 && approved.length > 0) {
    const heroCandidates = approved.filter(isPublicHeroCandidateRow);
    const heroRow =
      heroCandidates.find((r) => r.isHero) ||
      heroCandidates[0] ||
      approved.find((r) => r.isHero) ||
      approved[0];
    const hero = (heroRow?.previewUrl || "").trim() || null;
    const seen = new Set<string>();
    if (hero) seen.add(hero);
    const gallery: string[] = [];
    for (const r of approved) {
      if (!isPublicGalleryStripRow(r)) continue;
      if (heroRow && r.id === heroRow.id) continue;
      const u = (r.previewUrl || "").trim();
      if (!u || seen.has(u)) continue;
      seen.add(u);
      gallery.push(u);
    }
    return { hero, gallery };
  }

  const hero = (legacyHeroRaw || "").trim()
    ? buildProductPreviewUrl(productId, "hero")
    : null;
  const seen = new Set<string>();
  if (hero) seen.add(hero);
  const gallery: string[] = [];
  let gi = 0;
  try {
    const parsed = legacyGalleryJson ? JSON.parse(legacyGalleryJson) : [];
    const arr = Array.isArray(parsed) ? parsed : [];
    const heroRaw = (legacyHeroRaw || "").trim();
    for (const item of arr) {
      if (typeof item !== "string" || !item.trim()) continue;
      const raw = item.trim();
      if (heroRaw && raw === heroRaw) continue;
      const u = buildProductPreviewUrl(productId, "gallery", gi++);
      if (!seen.has(u)) {
        seen.add(u);
        gallery.push(u);
      }
    }
  } catch {
    /* ignore corrupt gallery JSON */
  }
  return { hero, gallery };
}

export function buildStorefrontProductImageRows(
  productId: string,
  heroImage: string | null | undefined,
  galleryImagesJson: string | null | undefined,
  dbRows: ShopProductImageRow[],
  libraryResolved?: LibraryResolvedForMerge | null
): StorefrontProductImage[] {
  const merged = mergeLegacyAndDbImages(
    productId,
    heroImage,
    galleryImagesJson,
    dbRows,
    libraryResolved ?? null
  );
  const active = merged
    .filter((r) => r.isActive !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  let galIdx = 0;
  const withPreview: StorefrontProductImage[] = active.map((row) => {
    let previewUrl: string;
    if (row.id.startsWith("libasset:")) {
      const assetId = row.id.slice("libasset:".length);
      previewUrl = `/api/products/preview?${new URLSearchParams({
        productId,
        libraryAssetId: assetId,
      }).toString()}`;
    } else if (row.id.startsWith("legacy-")) {
      previewUrl = row.isHero
        ? buildProductPreviewUrl(productId, "hero")
        : buildProductPreviewUrl(productId, "gallery", galIdx++);
    } else {
      previewUrl = buildShopProductImagePreviewUrl(productId, row.id);
    }
    return { ...row, previewUrl };
  });

  const deduped = dedupeStorefrontRowsByPreviewUrlPreserveOrder(withPreview);
  return normalizeHeroFlags(deduped);
}
