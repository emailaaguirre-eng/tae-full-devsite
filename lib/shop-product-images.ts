/**
 * Shop product image gallery — admin persistence and legacy merge.
 * @copyright B&D Servicing LLC 2026
 */

import { eq, inArray } from "drizzle-orm";
import { shopProductImages } from "@/db/schema";
import type { getDb } from "@/db";
import { generateId } from "@/lib/db";
import { normalizeHeroFlags } from "./product-image-ui";
import type { ProductImagePublic } from "./product-image-types";
import type { LibraryResolvedForMerge } from "@/lib/product-library-assignments";

export type DbInstance = Awaited<ReturnType<typeof getDb>>;

export const PRODUCT_IMAGE_SOURCE_TYPES = ["general", "variant", "api"] as const;
export type ProductImageSourceType = (typeof PRODUCT_IMAGE_SOURCE_TYPES)[number];

export type { ProductImagePublic } from "./product-image-types";

function mapRowToPublic(r: typeof shopProductImages.$inferSelect): ProductImagePublic {
  return {
    id: r.id,
    imageUrl: r.imageUrl,
    title: r.title ?? null,
    description: r.description ?? null,
    sortOrder: r.sortOrder ?? 0,
    isHero: !!r.isHero,
    isActive: r.isActive !== false,
    sourceType: r.sourceType || "general",
    variantKey: r.variantKey ?? null,
    variantId: r.variantId ?? null,
    size: r.size ?? null,
    frame: r.frame ?? null,
    frameColor: r.frameColor ?? null,
    material: r.material ?? null,
    orientation: r.orientation ?? null,
    format: r.format ?? null,
  };
}

function legacyVirtualImages(
  productId: string,
  heroImage: string | null | undefined,
  galleryImagesJson: string | null | undefined
): ProductImagePublic[] {
  const rows: ProductImagePublic[] = [];
  let order = 0;
  const hero = (heroImage || "").trim();
  if (hero) {
    rows.push({
      id: `legacy-hero-${productId}`,
      imageUrl: hero,
      title: null,
      description: null,
      sortOrder: order++,
      isHero: true,
      isActive: true,
      sourceType: "general",
      variantKey: null,
      variantId: null,
      size: null,
      frame: null,
      frameColor: null,
      material: null,
      orientation: null,
      format: null,
    });
  }
  let g: unknown[] = [];
  try {
    const parsed = galleryImagesJson ? JSON.parse(galleryImagesJson) : [];
    g = Array.isArray(parsed) ? parsed : [];
  } catch {
    g = [];
  }
  for (const u of g) {
    if (typeof u !== "string" || !u.trim()) continue;
    const url = u.trim();
    if (url === hero) continue;
    rows.push({
      id: `legacy-g-${productId}-${order}`,
      imageUrl: url,
      title: null,
      description: null,
      sortOrder: order++,
      isHero: false,
      isActive: true,
      sourceType: "general",
      variantKey: null,
      variantId: null,
      size: null,
      frame: null,
      frameColor: null,
      material: null,
      orientation: null,
      format: null,
    });
  }
  return rows;
}

function isApiSourceRow(row: ProductImagePublic): boolean {
  return (row.sourceType || "").trim().toLowerCase() === "api";
}

function libraryVirtualImageRows(productId: string, lib: LibraryResolvedForMerge): ProductImagePublic[] {
  const rows: ProductImagePublic[] = [];
  let order = -1_000_000;
  const heroU = lib.hero?.url?.trim() || "";
  if (lib.hero?.url?.trim()) {
    rows.push({
      id: `libasset:${lib.hero.assetId}`,
      imageUrl: lib.hero.url.trim(),
      title: null,
      description: null,
      sortOrder: order++,
      isHero: true,
      isActive: true,
      sourceType: "general",
      variantKey: null,
      variantId: null,
      size: null,
      frame: null,
      frameColor: null,
      material: null,
      orientation: null,
      format: null,
    });
  }
  for (const g of lib.gallery) {
    const u = g.url?.trim();
    if (!u || u === heroU) continue;
    rows.push({
      id: `libasset:${g.assetId}`,
      imageUrl: u,
      title: null,
      description: null,
      sortOrder: order++,
      isHero: false,
      isActive: true,
      sourceType: "general",
      variantKey: null,
      variantId: null,
      size: null,
      frame: null,
      frameColor: null,
      material: null,
      orientation: null,
      format: null,
    });
  }
  return rows;
}

/**
 * Merges DB gallery rows with legacy hero/gallery columns.
 * Product Media Library assignments (when resolved) are prepended and take priority over manual/legacy rows.
 * Manual uploads (non-api rows + legacy URLs) take priority over Printful (sourceType api) rows.
 */
export function mergeLegacyAndDbImages(
  productId: string,
  heroImage: string | null | undefined,
  galleryImagesJson: string | null | undefined,
  dbRows: (typeof shopProductImages.$inferSelect)[],
  libraryResolved?: LibraryResolvedForMerge | null
): ProductImagePublic[] {
  const legacy = legacyVirtualImages(productId, heroImage, galleryImagesJson);
  const dbMapped = [...dbRows]
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map(mapRowToPublic);

  const nonApiRows = dbMapped.filter((r) => !isApiSourceRow(r));
  const apiRows = dbMapped.filter((r) => isApiSourceRow(r));

  const seen = new Set<string>();
  const manualPool: ProductImagePublic[] = [];
  if (libraryResolved) {
    for (const r of libraryVirtualImageRows(productId, libraryResolved)) {
      const u = (r.imageUrl || "").trim();
      if (!u || seen.has(u)) continue;
      manualPool.push(r);
      seen.add(u);
    }
  }
  for (const r of nonApiRows) {
    const u = (r.imageUrl || "").trim();
    if (!u) continue;
    manualPool.push(r);
    seen.add(u);
  }
  for (const r of legacy) {
    const u = (r.imageUrl || "").trim();
    if (!u || seen.has(u)) continue;
    manualPool.push(r);
    seen.add(u);
  }

  if (manualPool.length > 0) {
    return normalizeHeroFlags(manualPool);
  }
  if (apiRows.length > 0) {
    return normalizeHeroFlags(apiRows);
  }
  return normalizeHeroFlags(legacy);
}

export async function loadImagesByProductIds(
  db: DbInstance,
  productIds: string[]
): Promise<Map<string, (typeof shopProductImages.$inferSelect)[]>> {
  const map = new Map<string, (typeof shopProductImages.$inferSelect)[]>();
  if (productIds.length === 0) return map;
  const rows = await db
    .select()
    .from(shopProductImages)
    .where(inArray(shopProductImages.productId, productIds))
    .all();
  rows.sort((a, b) => {
    if (a.productId !== b.productId) return a.productId.localeCompare(b.productId);
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
  for (const r of rows) {
    const list = map.get(r.productId) || [];
    list.push(r);
    map.set(r.productId, list);
  }
  return map;
}

function normalizeSourceType(raw: unknown): ProductImageSourceType {
  const s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (s === "variant" || s === "api") return s;
  return "general";
}

function deriveHeroAndGalleryFromPublic(rows: ProductImagePublic[]): {
  heroImage: string | null;
  galleryImagesJson: string;
} {
  const active = rows.filter((r) => r.isActive !== false);
  const sorted = [...active].sort((a, b) => a.sortOrder - b.sortOrder);
  const heroRow = sorted.find((r) => r.isHero) || sorted[0];
  const heroImage = heroRow?.imageUrl?.trim() || null;
  const gallery: string[] = [];
  for (const r of sorted) {
    if (heroRow && r.id === heroRow.id) continue;
    const u = (r.imageUrl || "").trim();
    if (!u) continue;
    gallery.push(u);
  }
  return { heroImage, galleryImagesJson: JSON.stringify(gallery) };
}

export { normalizeHeroFlags };

export type IncomingProductImage = {
  imageUrl: string;
  title?: string | null;
  description?: string | null;
  sortOrder?: number;
  isHero?: boolean;
  isActive?: boolean;
  sourceType?: string | null;
  variantKey?: string | null;
  variantId?: string | null;
  size?: string | null;
  frame?: string | null;
  frameColor?: string | null;
  material?: string | null;
  orientation?: string | null;
  format?: string | null;
};

export function parseIncomingProductImages(raw: unknown): IncomingProductImage[] | null {
  if (!Array.isArray(raw)) return null;
  const out: IncomingProductImage[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const url = typeof o.imageUrl === "string" ? o.imageUrl.trim() : "";
    if (!url) continue;
    out.push({
      imageUrl: url,
      title: typeof o.title === "string" ? o.title : o.title === null ? null : undefined,
      description:
        typeof o.description === "string" ? o.description : o.description === null ? null : undefined,
      sortOrder: typeof o.sortOrder === "number" && Number.isFinite(o.sortOrder) ? o.sortOrder : undefined,
      isHero: typeof o.isHero === "boolean" ? o.isHero : undefined,
      isActive: typeof o.isActive === "boolean" ? o.isActive : undefined,
      sourceType: typeof o.sourceType === "string" ? o.sourceType : undefined,
      variantKey: typeof o.variantKey === "string" ? o.variantKey : o.variantKey === null ? null : undefined,
      variantId: typeof o.variantId === "string" ? o.variantId : o.variantId === null ? null : undefined,
      size: typeof o.size === "string" ? o.size : o.size === null ? null : undefined,
      frame: typeof o.frame === "string" ? o.frame : o.frame === null ? null : undefined,
      frameColor:
        typeof o.frameColor === "string" ? o.frameColor : o.frameColor === null ? null : undefined,
      material: typeof o.material === "string" ? o.material : o.material === null ? null : undefined,
      orientation:
        typeof o.orientation === "string" ? o.orientation : o.orientation === null ? null : undefined,
      format: typeof o.format === "string" ? o.format : o.format === null ? null : undefined,
    });
  }
  return out;
}

/** Full replace of gallery rows + derived ShopProduct hero/gallery columns. */
export async function replaceProductImagesForProduct(
  db: DbInstance,
  productId: string,
  incoming: IncomingProductImage[]
): Promise<{ heroImage: string | null; galleryImagesJson: string }> {
  const now = Date.now().toString();
  const withOrder = incoming.map((r, i) => ({
    ...r,
    sortOrder: r.sortOrder ?? i,
  }));
  const publicRows: ProductImagePublic[] = withOrder.map((r, i) => ({
    id: `tmp-${i}`,
    imageUrl: r.imageUrl,
    title: r.title ?? null,
    description: r.description ?? null,
    sortOrder: r.sortOrder ?? i,
    isHero: !!r.isHero,
    isActive: r.isActive !== false,
    sourceType: normalizeSourceType(r.sourceType),
    variantKey: r.variantKey ?? null,
    variantId: r.variantId ?? null,
    size: r.size ?? null,
    frame: r.frame ?? null,
    frameColor: r.frameColor ?? null,
    material: r.material ?? null,
    orientation: r.orientation ?? null,
    format: r.format ?? null,
  }));
  const normalized = normalizeHeroFlags(publicRows);

  await db.delete(shopProductImages).where(eq(shopProductImages.productId, productId));

  for (let i = 0; i < normalized.length; i++) {
    const r = normalized[i];
    await db.insert(shopProductImages).values({
      id: generateId(),
      productId,
      imageUrl: r.imageUrl,
      title: r.title,
      description: r.description,
      sortOrder: i,
      isHero: r.isHero,
      isActive: r.isActive,
      sourceType: r.sourceType,
      variantKey: r.variantKey,
      variantId: r.variantId,
      size: r.size,
      frame: r.frame,
      frameColor: r.frameColor,
      material: r.material,
      orientation: r.orientation,
      format: r.format,
      createdAt: now,
      updatedAt: now,
    });
  }

  return deriveHeroAndGalleryFromPublic(normalized);
}

/**
 * When ShopProductImage rows exist, keep them aligned with heroImage + galleryImages columns
 * after upload-image or other legacy updates. Preserves metadata keyed by imageUrl.
 */
export async function reconcileImagesTableWithProductColumns(
  db: DbInstance,
  productId: string,
  heroImage: string | null | undefined,
  galleryImagesJson: string | null | undefined
): Promise<void> {
  const existing = await db
    .select()
    .from(shopProductImages)
    .where(eq(shopProductImages.productId, productId))
    .all();
  if (existing.length === 0) return;

  const byUrl = new Map(existing.map((r) => [r.imageUrl, r]));
  let g: unknown[] = [];
  try {
    const parsed = galleryImagesJson ? JSON.parse(galleryImagesJson) : [];
    g = Array.isArray(parsed) ? parsed : [];
  } catch {
    g = [];
  }
  const hero = (heroImage || "").trim();
  const ordered: { url: string; isHero: boolean }[] = [];
  if (hero) ordered.push({ url: hero, isHero: true });
  for (const u of g) {
    if (typeof u !== "string" || !u.trim()) continue;
    const t = u.trim();
    if (t === hero) continue;
    ordered.push({ url: t, isHero: false });
  }

  await db.delete(shopProductImages).where(eq(shopProductImages.productId, productId));
  const now = Date.now().toString();
  for (let i = 0; i < ordered.length; i++) {
    const { url, isHero } = ordered[i];
    const prev = byUrl.get(url);
    await db.insert(shopProductImages).values({
      id: prev?.id ?? generateId(),
      productId,
      imageUrl: url,
      title: prev?.title ?? null,
      description: prev?.description ?? null,
      sortOrder: i,
      isHero,
      isActive: prev?.isActive ?? true,
      sourceType: prev?.sourceType ?? "general",
      variantKey: prev?.variantKey ?? null,
      variantId: prev?.variantId ?? null,
      size: prev?.size ?? null,
      frame: prev?.frame ?? null,
      frameColor: prev?.frameColor ?? null,
      material: prev?.material ?? null,
      orientation: prev?.orientation ?? null,
      format: prev?.format ?? null,
      createdAt: prev?.createdAt ?? now,
      updatedAt: now,
    });
  }
}

export async function deleteImagesForProduct(db: DbInstance, productId: string): Promise<void> {
  await db.delete(shopProductImages).where(eq(shopProductImages.productId, productId));
}
