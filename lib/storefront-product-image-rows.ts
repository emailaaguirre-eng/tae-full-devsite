/**
 * Builds merged ShopProductImage rows + preview URLs (server / API only).
 * @copyright B&D Servicing LLC 2026
 */

import type { shopProductImages } from "@/db/schema";
import { mergeLegacyAndDbImages } from "@/lib/shop-product-images";
import { buildProductPreviewUrl, buildShopProductImagePreviewUrl } from "@/lib/product-watermark";
import type { StorefrontProductImage } from "@/lib/product-image-types";

export type ShopProductImageRow = typeof shopProductImages.$inferSelect;

export function buildStorefrontProductImageRows(
  productId: string,
  heroImage: string | null | undefined,
  galleryImagesJson: string | null | undefined,
  dbRows: ShopProductImageRow[]
): StorefrontProductImage[] {
  const merged = mergeLegacyAndDbImages(productId, heroImage, galleryImagesJson, dbRows);
  const active = merged
    .filter((r) => r.isActive !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  let galIdx = 0;
  return active.map((row) => {
    let previewUrl: string;
    if (row.id.startsWith("legacy-")) {
      previewUrl = row.isHero
        ? buildProductPreviewUrl(productId, "hero")
        : buildProductPreviewUrl(productId, "gallery", galIdx++);
    } else {
      previewUrl = buildShopProductImagePreviewUrl(productId, row.id);
    }
    return { ...row, previewUrl };
  });
}
