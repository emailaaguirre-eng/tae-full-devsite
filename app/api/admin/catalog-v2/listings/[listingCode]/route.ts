import { NextResponse } from "next/server";
import { querySql } from "@/lib/db";
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

type AssignmentRow = {
  assignmentId: string;
  assignmentSku: string;
  enabled: number | null;
  priceOverride: number | null;
  proofTermsOverride: string | null;
  customizable: number | null;
  requiresQrCode: number | null;
  legacyShopProductId: string | null;
  legacyProductSlug: string | null;
  mediumTemplateId: string;
  mediumCode: string;
  mediumName: string;
  mediumSlug: string;
  mediumActive: number | null;
  variantId: string;
  variantCode: string;
  variantSku: string;
  variantName: string | null;
  sizeLabel: string | null;
  paperType: string | null;
  finishType: string | null;
  frameType: string | null;
  orientation: string | null;
  colorName: string | null;
  colorCode: string | null;
  basePrice: number | null;
  variantActive: number | null;
  printWidth: number | null;
  printHeight: number | null;
  printDpi: number | null;
  printfulProductId: number | null;
  printfulVariantId: number | null;
  printfulPrintfileId: number | null;
  mappingActive: number | null;
};

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

export async function GET(
  _req: Request,
  { params }: { params: { listingCode: string } }
) {
  try {
    await ensureStoreCategoryHierarchy();

    const listingCode = decodeURIComponent(params.listingCode || "").trim();
    if (!listingCode) {
      return NextResponse.json(
        { success: false, error: "listingCode is required" },
        { status: 400 }
      );
    }

    const categories = await querySql<CategoryRow>(
      `SELECT id, slug, name, parentId, categoryType, icon, taeBaseFee, requiresQrCode
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
       WHERE listingCode = ?`,
      [listingCode]
    );

    const listing = listings[0];
    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      );
    }

    const category = listing.categoryId ? catMap.get(listing.categoryId) : undefined;

    const assignments = await querySql<AssignmentRow>(
      `SELECT
         lma.id AS assignmentId,
         lma.assignmentSku AS assignmentSku,
         lma.enabled AS enabled,
         lma.priceOverride AS priceOverride,
         lma.proofTermsOverride AS proofTermsOverride,
         lma.customizable AS customizable,
         lma.requiresQrCode AS requiresQrCode,
         lma.legacyShopProductId AS legacyShopProductId,
         sp.slug AS legacyProductSlug,
         mt.id AS mediumTemplateId,
         mt.mediumCode AS mediumCode,
         mt.name AS mediumName,
         mt.slug AS mediumSlug,
         mt.active AS mediumActive,
         mtv.id AS variantId,
         mtv.variantCode AS variantCode,
         mtv.variantSku AS variantSku,
         mtv.name AS variantName,
         mtv.sizeLabel AS sizeLabel,
         mtv.paperType AS paperType,
         mtv.finishType AS finishType,
         mtv.frameType AS frameType,
         mtv.orientation AS orientation,
         mtv.colorName AS colorName,
         mtv.colorCode AS colorCode,
         mtv.basePrice AS basePrice,
         mtv.active AS variantActive,
         mtv.printWidth AS printWidth,
         mtv.printHeight AS printHeight,
         mtv.printDpi AS printDpi,
         vfm.printfulProductId AS printfulProductId,
         vfm.printfulVariantId AS printfulVariantId,
         vfm.printfulPrintfileId AS printfulPrintfileId,
         vfm.active AS mappingActive
       FROM ListingMediaAssignment lma
       INNER JOIN MediumTemplate mt
         ON mt.id = lma.mediumTemplateId
       INNER JOIN MediumTemplateVariant mtv
         ON mtv.id = lma.mediumTemplateVariantId
       LEFT JOIN ShopProduct sp
         ON sp.id = lma.legacyShopProductId
       LEFT JOIN VariantFulfillmentMapping vfm
         ON vfm.mediumTemplateVariantId = lma.mediumTemplateVariantId
       WHERE lma.listingId = ?
       ORDER BY lma.enabled DESC, mtv.sortOrder ASC, mtv.sizeLabel ASC, lma.assignmentSku ASC`,
      [listing.id]
    );

    const mappedAssignments = assignments.filter((a) => a.mappingActive === 1).length;
    const enabledAssignments = assignments.filter((a) => a.enabled === 1).length;

    return NextResponse.json({
      success: true,
      data: {
        listing: {
          id: listing.id,
          listingCode: listing.listingCode,
          slug: listing.slug,
          name: listing.name,
          description: listing.description,
          heroImage: listing.heroImage,
          galleryImages: listing.galleryImages,
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
          assignmentCount: assignments.length,
          enabledAssignmentCount: enabledAssignments,
          mappedAssignmentCount: mappedAssignments,
        },
        assignments: assignments.map((a) => ({
          assignmentId: a.assignmentId,
          assignmentSku: a.assignmentSku,
          enabled: !!a.enabled,
          priceOverride:
            a.priceOverride === null || a.priceOverride === undefined ? null : Number(a.priceOverride),
          effectivePrice:
            a.priceOverride === null || a.priceOverride === undefined
              ? Number(a.basePrice || 0)
              : Number(a.priceOverride),
          proofTermsOverride: a.proofTermsOverride,
          customizable:
            a.customizable === null || a.customizable === undefined ? null : !!a.customizable,
          requiresQrCode:
            a.requiresQrCode === null || a.requiresQrCode === undefined ? null : !!a.requiresQrCode,
          legacyShopProductId: a.legacyShopProductId,
          legacyProductSlug: a.legacyProductSlug,
          mediumTemplateId: a.mediumTemplateId,
          mediumCode: a.mediumCode,
          mediumName: a.mediumName,
          mediumSlug: a.mediumSlug,
          mediumActive: !!a.mediumActive,
          variantId: a.variantId,
          variantCode: a.variantCode,
          variantSku: a.variantSku,
          variantName: a.variantName,
          sizeLabel: a.sizeLabel,
          paperType: a.paperType,
          finishType: a.finishType,
          frameType: a.frameType,
          orientation: a.orientation,
          colorName: a.colorName,
          colorCode: a.colorCode,
          basePrice: Number(a.basePrice || 0),
          variantActive: !!a.variantActive,
          printWidth: a.printWidth,
          printHeight: a.printHeight,
          printDpi: a.printDpi,
          printfulProductId: a.printfulProductId,
          printfulVariantId: a.printfulVariantId,
          printfulPrintfileId: a.printfulPrintfileId,
          mappingActive:
            a.mappingActive === null || a.mappingActive === undefined ? null : !!a.mappingActive,
        })),
      },
    });
  } catch (err: any) {
    console.error("Failed to fetch Catalog V2 listing detail:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch Catalog V2 listing detail" },
      { status: 500 }
    );
  }
}
