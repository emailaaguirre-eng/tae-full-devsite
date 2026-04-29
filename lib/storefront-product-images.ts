/**
 * Storefront: ShopProductImage selection, ordering, and variant matching (client-safe).
 * @copyright B&D Servicing LLC 2026
 */

import type { ProductImagePublic, StorefrontProductImage } from "@/lib/product-image-types";

export type { StorefrontProductImage };

/** Printful/API backfill rows — excluded from public storefront hero, gallery, and PDP option fallbacks. */
export function isPrintfulApiSampleSourceRow(row: ProductImagePublic | null | undefined): boolean {
  return String(row?.sourceType || "")
    .trim()
    .toLowerCase() === "api";
}

function norm(s: unknown): string {
  return String(s ?? "")
    .trim()
    .toLowerCase();
}

function parseMatchValues(raw: string | null | undefined): string[] {
  const value = String(raw ?? "").trim();
  if (!value) return [];
  if (value.startsWith("[")) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return [...new Set(parsed.map((v) => String(v ?? "").trim()).filter(Boolean))];
      }
    } catch {}
  }
  return [value];
}

export type VariantImageMatchContext = {
  matrixRowId: string | null;
  printfulVariantId: number | null;
  sizeLabel: string | null;
  paperType: string | null;
  finishType: string | null;
  pfColor: string | null;
  pfSize: string | null;
  orientation: string | null;
};

/** Non-empty variantId / variantKey / dimension fields mean the row is option-specific (not default catalog). */
function hasRestrictiveMetadata(row: ProductImagePublic): boolean {
  return !!(
    parseMatchValues(row.variantId).length > 0 ||
    parseMatchValues(row.variantKey).length > 0 ||
    row.size?.trim() ||
    row.frame?.trim() ||
    row.frameColor?.trim() ||
    row.material?.trim() ||
    row.orientation?.trim() ||
    row.format?.trim()
  );
}

/**
 * Default catalog for PDP matching: admin `general` rows, non-restrictive `variant` rows.
 * Printful `api` / sample rows are never treated as public default catalog (see isPrintfulApiSampleSourceRow).
 */
export function isGeneralCatalogRow(row: ProductImagePublic): boolean {
  const st = (row.sourceType || "general").toLowerCase();
  if (st === "api") return false;
  if (st === "general") return true;
  if (st === "variant" && !hasRestrictiveMetadata(row)) return true;
  return false;
}

function metadataPairs(row: ProductImagePublic, ctx: VariantImageMatchContext) {
  return [
    [row.size, ctx.sizeLabel || ctx.pfSize],
    [row.material, ctx.paperType],
    [row.frame, ctx.finishType],
    [row.frameColor, ctx.pfColor],
    [row.orientation, ctx.orientation],
  ] as const;
}

/** All non-empty row dimensions must equal context; variantId / variantKey when present must match. */
function exactMetadataMatch(row: StorefrontProductImage, ctx: VariantImageMatchContext): boolean {
  const pv = ctx.printfulVariantId;
  const variantIds = parseMatchValues(row.variantId);
  if (variantIds.length > 0) {
    if (pv == null || pv <= 0) return false;
    const ok = variantIds.some((vid) => {
      const n = Number(vid);
      return (Number.isFinite(n) && Math.trunc(n) === pv) || vid === String(pv);
    });
    if (!ok) return false;
  }

  const variantKeys = parseMatchValues(row.variantKey);
  if (variantKeys.length > 0) {
    if (!ctx.matrixRowId || !variantKeys.includes(ctx.matrixRowId)) return false;
  }

  for (const [rv, cv] of metadataPairs(row, ctx)) {
    const r = norm(rv);
    if (!r) continue;
    const c = norm(cv);
    if (!c || r !== c) return false;
  }

  const fmt = norm(row.format);
  if (fmt) {
    /* format not on VariantOption yet; skip strict failure so products still resolve */
  }

  return true;
}

/** Higher = better partial match (variantId/key weighted above dimensions). */
function partialMetadataScore(row: StorefrontProductImage, ctx: VariantImageMatchContext): number {
  let score = 0;
  const pv = ctx.printfulVariantId;
  const variantIds = parseMatchValues(row.variantId);
  if (variantIds.length > 0 && pv != null && pv > 0) {
    const matched = variantIds.some((vid) => {
      const n = Number(vid);
      return (Number.isFinite(n) && Math.trunc(n) === pv) || vid === String(pv);
    });
    if (matched) score += 1000;
  }
  const variantKeys = parseMatchValues(row.variantKey);
  if (variantKeys.length > 0 && ctx.matrixRowId && variantKeys.includes(ctx.matrixRowId)) score += 1000;

  for (const [rv, cv] of metadataPairs(row, ctx)) {
    const r = norm(rv);
    const c = norm(cv);
    if (r && c && r === c) score += 10;
  }
  return score;
}

/** Preserve sortOrder; hero preview first; remaining previews in sortOrder. */
export function orderImagePreviewUrlsHeroFirst(rows: StorefrontProductImage[]): string[] {
  const sorted = [...rows].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const hero = sorted.find((r) => r.isHero) || sorted[0];
  if (!hero) return [];
  const rest = sorted.filter((r) => r.id !== hero.id);
  return [hero.previewUrl, ...rest.map((r) => r.previewUrl)];
}

export function dedupePreviewUrlsPreserveOrder(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of urls) {
    if (!u || seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}

function legacyPreviewList(
  legacyHeroImage: string | null | undefined,
  legacyGalleryImages: string[] | null | undefined
): string[] {
  const hero = (legacyHeroImage || "").trim();
  const gal = legacyGalleryImages || [];
  return dedupePreviewUrlsPreserveOrder([
    ...(hero ? [legacyHeroImage as string] : []),
    ...gal.filter((u) => u && u !== hero),
  ]);
}

/**
 * Single entry point for PDP gallery URLs.
 *
 * Priority:
 * 1) Exact match among option-specific rows (restrictive metadata / variant source with IDs or dimensions)
 * 2) Partial match (best score, ties kept, sortOrder preserved within set)
 * 3) General + non-restrictive variant rows (default catalog; never Printful `api` samples)
 * 4) Legacy heroImage + galleryImages preview URLs — only when there are no customer-facing rows at all
 * 5) Empty array when rows exist but none match and there is no general/legacy pool (caller uses JSON matrix)
 *
 * Inactive rows ignored. Duplicate preview URLs removed without reordering collapse.
 */
export function getBestProductImages(
  productImages: StorefrontProductImage[] | null | undefined,
  selectedOptions: VariantImageMatchContext,
  legacyHeroImage: string | null | undefined,
  legacyGalleryImages: string[] | null | undefined
): string[] {
  const legacy = legacyPreviewList(legacyHeroImage, legacyGalleryImages);
  const active = (productImages || []).filter(
    (r) => r.isActive !== false && !isPrintfulApiSampleSourceRow(r)
  );

  if (active.length === 0) {
    return legacy;
  }

  const pack = (rows: StorefrontProductImage[]) =>
    dedupePreviewUrlsPreserveOrder(orderImagePreviewUrlsHeroFirst(rows));

  const generalPool = active.filter((r) => isGeneralCatalogRow(r));
  const specificPool = active.filter((r) => !isGeneralCatalogRow(r));

  if (specificPool.length === 0) {
    if (generalPool.length > 0) return pack(generalPool);
    return legacy;
  }

  const exact = specificPool.filter((r) => exactMetadataMatch(r, selectedOptions));
  if (exact.length > 0) {
    return dedupePreviewUrlsPreserveOrder([
      ...pack(exact),
      ...pack(generalPool),
    ]);
  }

  const scored = specificPool
    .map((row) => ({ row, score: partialMetadataScore(row, selectedOptions) }))
    .filter((x) => x.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        (a.row.sortOrder ?? 0) - (b.row.sortOrder ?? 0) ||
        a.row.id.localeCompare(b.row.id)
    );

  if (scored.length > 0) {
    const best = scored[0].score;
    const tied = scored.filter((x) => x.score === best).map((x) => x.row);
    return dedupePreviewUrlsPreserveOrder([
      ...pack(tied),
      ...pack(generalPool),
    ]);
  }

  if (generalPool.length > 0) {
    return pack(generalPool);
  }

  // Had only unmatched variant-specific rows and no general pool — let PDP use matrix / variant JSON.
  return [];
}

/**
 * Preview URLs for shop rows that exactly match the selected variant context (option-targeted rows only).
 * Used by the PDP to prepend exact storefront images ahead of JSON matrix / broader getBestProductImages.
 */
export function getExactMatchProductImagePreviewUrls(
  productImages: StorefrontProductImage[] | null | undefined,
  selectedOptions: VariantImageMatchContext
): string[] {
  const active = (productImages || []).filter(
    (r) => r.isActive !== false && !isPrintfulApiSampleSourceRow(r)
  );
  const specificPool = active.filter((r) => !isGeneralCatalogRow(r));
  const exact = specificPool.filter((r) => exactMetadataMatch(r, selectedOptions));
  if (exact.length === 0) return [];
  return dedupePreviewUrlsPreserveOrder(orderImagePreviewUrlsHeroFirst(exact));
}
