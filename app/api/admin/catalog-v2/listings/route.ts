import { NextResponse } from "next/server";
import { getDb, querySql } from "@/lib/db";
import { ensureStoreCategoryHierarchy } from "@/lib/store-category-tree";

export const dynamic = "force-dynamic";

type ListingRow = {
  id: string;
  listingCode: string;
  slug: string;
  name: string;
  description: string | null;
  heroImage: string | null;
  galleryImages: string | null;
  categoryId: string | null;
  customizable: number | null;
  requiresQrCode: number | null;
  active: number | null;
  featured: number | null;
  sortOrder: number | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  parentId: string | null;
  categoryType: string | null;
  icon: string | null;
  taeBaseFee: number | null;
  requiresQrCode: number | null;
};

type AggregateRow = {
  listingId: string;
  assignmentCount: number;
  enabledAssignmentCount: number;
  mappedAssignmentCount: number;
  minEffectivePrice: number | null;
  maxEffectivePrice: number | null;
};

type AssignmentThumbRow = {
  listingId: string;
  enabled: number | null;
  heroImageOverride: string | null;
  legacyHero: string | null;
};

type ListingSearchMetaRow = {
  listingId: string;
  legacyNames: string | null;
  legacySlugs: string | null;
  artistSlugs: string | null;
  artistNames: string | null;
  coSlugs: string | null;
  coNames: string | null;
};

function trimUrl(s: string | null | undefined): string | null {
  const t = typeof s === "string" ? s.trim() : "";
  return t || null;
}

function firstGalleryUrl(galleryJson: string | null | undefined): string | null {
  if (!galleryJson) return null;
  try {
    const g = JSON.parse(galleryJson);
    if (!Array.isArray(g)) return null;
    for (const u of g) {
      if (typeof u === "string" && u.trim()) return u.trim();
    }
  } catch {
    /* ignore */
  }
  return null;
}

function pickAssignmentThumbnail(rows: AssignmentThumbRow[]): string | null {
  const norm = trimUrl;
  const enabledOverride = rows.find((r) => r.enabled && norm(r.heroImageOverride));
  if (enabledOverride) return norm(enabledOverride.heroImageOverride);
  const anyOverride = rows.find((r) => norm(r.heroImageOverride));
  if (anyOverride) return norm(anyOverride.heroImageOverride);
  const enabledLegacy = rows.find((r) => r.enabled && norm(r.legacyHero));
  if (enabledLegacy) return norm(enabledLegacy.legacyHero);
  const anyLegacy = rows.find((r) => norm(r.legacyHero));
  return anyLegacy ? norm(anyLegacy.legacyHero) : null;
}

function resolveListingThumbnail(
  listing: ListingRow,
  assignmentRows: AssignmentThumbRow[]
): string | null {
  const forListing = assignmentRows.filter((r) => r.listingId === listing.id);
  return (
    trimUrl(listing.heroImage) ||
    firstGalleryUrl(listing.galleryImages) ||
    pickAssignmentThumbnail(forListing) ||
    null
  );
}

function buildPathLabel(
  categoryId: string | null | undefined,
  catMap: Map<string, CategoryRow>
): string {
  if (!categoryId) return "";
  const parts: string[] = [];
  const visited = new Set<string>();
  let current = catMap.get(categoryId);

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    parts.unshift(current.name);
    current = current.parentId ? catMap.get(current.parentId) : undefined;
  }

  return parts.join(" > ");
}

export async function GET(req: Request) {
  try {
    await ensureStoreCategoryHierarchy();
    await getDb();

    const { searchParams } = new URL(req.url);
    const categorySlug = (searchParams.get("category") || "").trim();
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    const categories = await querySql<CategoryRow>(
      `SELECT
         id,
         slug,
         name,
         parentId,
         categoryType,
         icon,
         taeBaseFee,
         requiresQrCode
       FROM ShopCategory`
    );
    const catMap = new Map(categories.map((c) => [c.id, c]));

    const listings = await querySql<ListingRow>(
      `SELECT
         id,
         listingCode,
         slug,
         name,
         description,
         heroImage,
         galleryImages,
         categoryId,
         customizable,
         requiresQrCode,
         active,
         featured,
         sortOrder,
         createdAt,
         updatedAt
       FROM ProductListing
       ORDER BY active DESC, sortOrder DESC, name ASC`
    );

    const aggregates = await querySql<AggregateRow>(
      `SELECT
         lma.listingId AS listingId,
         COUNT(lma.id) AS assignmentCount,
         SUM(CASE WHEN lma.enabled = 1 THEN 1 ELSE 0 END) AS enabledAssignmentCount,
         SUM(CASE WHEN vfm.id IS NOT NULL AND vfm.active = 1 THEN 1 ELSE 0 END) AS mappedAssignmentCount,
         MIN(COALESCE(lma.priceOverride, mtv.basePrice, 0)) AS minEffectivePrice,
         MAX(COALESCE(lma.priceOverride, mtv.basePrice, 0)) AS maxEffectivePrice
       FROM ListingMediaAssignment lma
       LEFT JOIN MediumTemplateVariant mtv
         ON mtv.id = lma.mediumTemplateVariantId
       LEFT JOIN VariantFulfillmentMapping vfm
         ON vfm.mediumTemplateVariantId = lma.mediumTemplateVariantId
        AND vfm.active = 1
       GROUP BY lma.listingId`
    );
    const aggregateMap = new Map(aggregates.map((a) => [a.listingId, a]));

    const assignmentThumbRows = await querySql<AssignmentThumbRow>(
      `SELECT
         lma.listingId AS listingId,
         lma.enabled AS enabled,
         lma.heroImageOverride AS heroImageOverride,
         sp.heroImage AS legacyHero
       FROM ListingMediaAssignment lma
       LEFT JOIN ShopProduct sp ON sp.id = lma.legacyShopProductId`
    );

    const listingMetaRows = await querySql<ListingSearchMetaRow>(
      `SELECT
         lma.listingId AS listingId,
         GROUP_CONCAT(DISTINCT sp.name) AS legacyNames,
         GROUP_CONCAT(DISTINCT sp.slug) AS legacySlugs,
         GROUP_CONCAT(DISTINCT ar.slug) AS artistSlugs,
         GROUP_CONCAT(DISTINCT ar.name) AS artistNames,
         GROUP_CONCAT(DISTINCT cr.slug) AS coSlugs,
         GROUP_CONCAT(DISTINCT cr.name) AS coNames
       FROM ListingMediaAssignment lma
       LEFT JOIN ShopProduct sp ON sp.id = lma.legacyShopProductId
       LEFT JOIN Artist ar ON ar.id = sp.artistId
       LEFT JOIN CoCreator cr ON cr.id = sp.coCreatorId
       GROUP BY lma.listingId`
    );
    const metaMap = new Map(listingMetaRows.map((m) => [m.listingId, m]));

    let filtered = listings;

    if (categorySlug) {
      const category = categories.find((c) => c.slug === categorySlug);
      filtered = category ? filtered.filter((l) => l.categoryId === category.id) : [];
    }

    if (search) {
      const metaSearchText = (listingId: string): string => {
        const m = metaMap.get(listingId);
        return [
          m?.legacyNames || "",
          m?.legacySlugs || "",
          m?.artistSlugs || "",
          m?.artistNames || "",
          m?.coSlugs || "",
          m?.coNames || "",
        ]
          .join(" ")
          .toLowerCase();
      };
      filtered = filtered.filter((l) => {
        const category = l.categoryId ? catMap.get(l.categoryId) : undefined;
        const pathLabel = buildPathLabel(l.categoryId, catMap);
        const haystack = [
          l.listingCode,
          l.slug,
          l.name,
          l.description || "",
          category?.name || "",
          category?.slug || "",
          pathLabel,
          metaSearchText(l.id),
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(search);
      });
    }

    const data = filtered.map((listing) => {
      const category = listing.categoryId ? catMap.get(listing.categoryId) : undefined;
      const agg = aggregateMap.get(listing.id);
      const pathLabel = buildPathLabel(listing.categoryId, catMap);
      const meta = metaMap.get(listing.id);
      const searchText = [
        listing.listingCode,
        listing.slug,
        listing.name,
        listing.description || "",
        category?.name || "",
        category?.slug || "",
        pathLabel,
        meta?.legacyNames || "",
        meta?.legacySlugs || "",
        meta?.artistSlugs || "",
        meta?.artistNames || "",
        meta?.coSlugs || "",
        meta?.coNames || "",
      ]
        .join(" ")
        .toLowerCase();

      return {
        id: listing.id,
        listingCode: listing.listingCode,
        slug: listing.slug,
        name: listing.name,
        description: listing.description,
        heroImage: listing.heroImage,
        galleryImages: listing.galleryImages,
        thumbnailUrl: resolveListingThumbnail(listing, assignmentThumbRows),
        searchText,
        active: !!listing.active,
        featured: !!listing.featured,
        customizable: !!listing.customizable,
        requiresQrCode:
          listing.requiresQrCode !== null && listing.requiresQrCode !== undefined
            ? !!listing.requiresQrCode
            : !!category?.requiresQrCode,
        sortOrder: listing.sortOrder ?? 0,
        createdAt: listing.createdAt || "",
        updatedAt: listing.updatedAt || "",
        categoryId: listing.categoryId,
        categoryName: category?.name || "Uncategorized",
        categorySlug: category?.slug || "",
        categoryPathLabel: buildPathLabel(listing.categoryId, catMap),
        assignmentCount: Number(agg?.assignmentCount || 0),
        enabledAssignmentCount: Number(agg?.enabledAssignmentCount || 0),
        mappedAssignmentCount: Number(agg?.mappedAssignmentCount || 0),
        minEffectivePrice:
          agg?.minEffectivePrice === null || agg?.minEffectivePrice === undefined
            ? null
            : Number(agg.minEffectivePrice),
        maxEffectivePrice:
          agg?.maxEffectivePrice === null || agg?.maxEffectivePrice === undefined
            ? null
            : Number(agg.maxEffectivePrice),
      };
    });

    return NextResponse.json({
      success: true,
      data,
      categories: categories.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        parentId: c.parentId || null,
        categoryType: c.categoryType || "leaf",
        pathLabel: buildPathLabel(c.id, catMap),
        icon: c.icon || "",
        taeBaseFee: Number(c.taeBaseFee || 0),
        requiresQrCode: !!c.requiresQrCode,
        productCount: data.filter((row) => row.categoryId === c.id).length,
      })),
    });
  } catch (err: any) {
    console.error("Failed to fetch Catalog V2 listings:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch Catalog V2 listings" },
      { status: 500 }
    );
  }
}
