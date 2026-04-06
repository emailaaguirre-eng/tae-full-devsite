import { NextResponse } from "next/server";
import { getDb, printAreaSpecs, surfaceMaps, eq, querySql } from "@/lib/db";
import { parsePrintAreaSpec, resolveAllPrintAreas } from "@/lib/print-area-specs";
import { parseSurfaceMap } from "@/lib/surface-map";

export const dynamic = "force-dynamic";

type AssignmentStudioRow = {
  assignmentId: string;
  assignmentSku: string;
  listingId: string;
  listingCode: string;
  listingSlug: string;
  listingName: string;
  listingDescription: string | null;
  listingHeroImage: string | null;
  listingCategoryId: string | null;
  listingCustomizable: number | null;
  listingRequiresQrCode: number | null;
  assignmentCustomizable: number | null;
  assignmentRequiresQrCode: number | null;
  priceOverride: number | null;
  proofTermsOverride: string | null;
  mediumTemplateId: string;
  mediumCode: string;
  mediumName: string;
  mediumSlug: string;
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
  printWidth: number | null;
  printHeight: number | null;
  printDpi: number | null;
  printFillMode: string | null;
  requiredPlacements: string | null;
  qrDefaultPosition: string | null;
  categorySlug: string | null;
  categoryName: string | null;
  categoryRequiresQrCode: number | null;
  legacyShopProductId: string | null;
  legacyProductSlug: string | null;
  mappedPrintfulProductId: number | null;
  mappedPrintfulVariantId: number | null;
  mappedPrintfulPrintfileId: number | null;
  legacyPrintfulProductId: number | null;
  legacyPrintfulVariantId: number | null;
  legacyPrintfulPrintfileId: number | null;
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const rows = await querySql<AssignmentStudioRow>(
      `SELECT
         lma.id AS assignmentId,
         lma.assignmentSku AS assignmentSku,
         pl.id AS listingId,
         pl.listingCode AS listingCode,
         pl.slug AS listingSlug,
         pl.name AS listingName,
         pl.description AS listingDescription,
         pl.heroImage AS listingHeroImage,
         pl.categoryId AS listingCategoryId,
         pl.customizable AS listingCustomizable,
         pl.requiresQrCode AS listingRequiresQrCode,
         lma.customizable AS assignmentCustomizable,
         lma.requiresQrCode AS assignmentRequiresQrCode,
         lma.priceOverride AS priceOverride,
         lma.proofTermsOverride AS proofTermsOverride,
         mt.id AS mediumTemplateId,
         mt.mediumCode AS mediumCode,
         mt.name AS mediumName,
         mt.slug AS mediumSlug,
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
         mtv.printWidth AS printWidth,
         mtv.printHeight AS printHeight,
         mtv.printDpi AS printDpi,
         mtv.printFillMode AS printFillMode,
         mtv.requiredPlacements AS requiredPlacements,
         mtv.qrDefaultPosition AS qrDefaultPosition,
         sc.slug AS categorySlug,
         sc.name AS categoryName,
         sc.requiresQrCode AS categoryRequiresQrCode,
         lma.legacyShopProductId AS legacyShopProductId,
         sp.slug AS legacyProductSlug,
         vfm.printfulProductId AS mappedPrintfulProductId,
         vfm.printfulVariantId AS mappedPrintfulVariantId,
         vfm.printfulPrintfileId AS mappedPrintfulPrintfileId,
         sp.printfulProductId AS legacyPrintfulProductId,
         sp.printfulVariantId AS legacyPrintfulVariantId,
         sp.printfulPrintfileId AS legacyPrintfulPrintfileId
       FROM ListingMediaAssignment lma
       INNER JOIN ProductListing pl
         ON pl.id = lma.listingId
       INNER JOIN MediumTemplate mt
         ON mt.id = lma.mediumTemplateId
       INNER JOIN MediumTemplateVariant mtv
         ON mtv.id = lma.mediumTemplateVariantId
       LEFT JOIN ShopCategory sc
         ON sc.id = pl.categoryId
       LEFT JOIN VariantFulfillmentMapping vfm
         ON vfm.mediumTemplateVariantId = lma.mediumTemplateVariantId
         AND vfm.provider = 'printful'
         AND vfm.active = 1
       LEFT JOIN ShopProduct sp
         ON sp.id = lma.legacyShopProductId
       WHERE lma.id = ?
       LIMIT 1`,
      [id]
    );

    const row = rows[0];
    if (!row) {
      return NextResponse.json(
        { success: false, error: "Assignment not found" },
        { status: 404 }
      );
    }

    const requiresQrCode =
      row.assignmentRequiresQrCode === null || row.assignmentRequiresQrCode === undefined
        ? row.listingRequiresQrCode === null || row.listingRequiresQrCode === undefined
          ? !!row.categoryRequiresQrCode
          : !!row.listingRequiresQrCode
        : !!row.assignmentRequiresQrCode;

    const customizable =
      row.assignmentCustomizable === null || row.assignmentCustomizable === undefined
        ? !!row.listingCustomizable
        : !!row.assignmentCustomizable;

    const printfulProductId =
      row.mappedPrintfulProductId ?? row.legacyPrintfulProductId ?? null;
    const printfulVariantId =
      row.mappedPrintfulVariantId ?? row.legacyPrintfulVariantId ?? null;
    const printfulPrintfileId =
      row.mappedPrintfulPrintfileId ?? row.legacyPrintfulPrintfileId ?? null;

    let printAreas: Record<string, any> = {};
    let surfaceMapPayload: {
      uxSurfaces: Array<{ id: string; label: string; printfulPlacement: string; role?: string; order: number }>;
      exportRules: Array<{ printfulPlacement: string; uxSurfaceIds: string[]; composite?: { type: string } }>;
    } | null = null;

    if (printfulProductId) {
      const db = await getDb();

      const specs = await db
        .select()
        .from(printAreaSpecs)
        .where(eq(printAreaSpecs.printfulProductId, printfulProductId))
        .limit(1)
        .all();

      if (specs.length > 0) {
        const specData = parsePrintAreaSpec(specs[0]);
        if (specData) {
          printAreas = printfulVariantId
            ? resolveAllPrintAreas(specData, printfulVariantId)
            : {};
        }
      }

      const surfaceMapRows = await db
        .select()
        .from(surfaceMaps)
        .where(eq(surfaceMaps.printfulProductId, printfulProductId))
        .limit(1)
        .all();

      const surfaceMap = surfaceMapRows.length > 0
        ? parseSurfaceMap(surfaceMapRows[0])
        : null;

      if (surfaceMap) {
        surfaceMapPayload = {
          uxSurfaces: surfaceMap.uxSurfaces,
          exportRules: surfaceMap.exportRules,
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        product: {
          id: row.assignmentId,
          slug: row.legacyProductSlug || row.listingSlug,
          name: `${row.listingName} - ${row.sizeLabel || row.variantName || row.variantCode}`,
          description: row.listingDescription,
          heroImage: row.listingHeroImage,
          basePrice:
            row.priceOverride === null || row.priceOverride === undefined
              ? Number(row.basePrice || 0)
              : Number(row.priceOverride),
          printfulProductId,
          printfulVariantId,
          printfulPrintfileId,
          printWidth: row.printWidth,
          printHeight: row.printHeight,
          printDpi: row.printDpi || 300,
          printFillMode: row.printFillMode,
          requiredPlacements: row.requiredPlacements,
          qrDefaultPosition: row.qrDefaultPosition,
          requiresQrCode,
          customizable,
          category: row.categorySlug || row.categoryName
            ? {
                id: row.listingCategoryId,
                slug: row.categorySlug,
                name: row.categoryName,
              }
            : null,
        },
        printSpecs: {
          printfulProductId,
          printfulVariantId,
          printAreas,
          surfaceMap: surfaceMapPayload,
        },
        meta: {
          listingId: row.listingId,
          listingCode: row.listingCode,
          listingSlug: row.listingSlug,
          mediumTemplateId: row.mediumTemplateId,
          mediumCode: row.mediumCode,
          mediumSlug: row.mediumSlug,
          variantId: row.variantId,
          variantCode: row.variantCode,
          variantSku: row.variantSku,
          legacyShopProductId: row.legacyShopProductId,
        },
      },
    });
  } catch (err: any) {
    console.error("Failed to fetch assignment studio spec:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch assignment studio spec" },
      { status: 500 }
    );
  }
}
