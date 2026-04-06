/**
 * Public: Get print area specs + surface map for a product
 * GET /api/products/[slug]/print-specs
 *
 * Returns:
 *  - resolved per-placement print area dimensions (from PrintAreaSpec)
 *  - surface map config (from SurfaceMap) describing UX surfaces and export rules
 */
import { NextResponse } from "next/server";
import { getDb, shopProducts, printAreaSpecs, surfaceMaps, eq } from "@/lib/db";
import {
  parsePrintAreaSpec,
  resolveAllPrintAreas,
} from "@/lib/print-area-specs";
import {
  generateDefaultSurfaceMap,
  parseSurfaceMap,
  resolveSurfaceMapForPrintSpecs,
} from "@/lib/surface-map";
import { resolveShopProductPrintfulIds } from "@/lib/product-watermark";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const db = await getDb();

    const products = await db
      .select()
      .from(shopProducts)
      .where(eq(shopProducts.slug, params.slug))
      .limit(1)
      .all();

    if (products.length === 0) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const product = products[0];

    const resolved = resolveShopProductPrintfulIds(product);

    if (!resolved.printfulProductId) {
      return NextResponse.json({
        success: true,
        data: null,
        reason: "no_printful_mapping",
      });
    }

    const { printfulProductId, printfulVariantId } = resolved;

    // Fetch print area specs
    const specs = await db
      .select()
      .from(printAreaSpecs)
      .where(eq(printAreaSpecs.printfulProductId, printfulProductId))
      .limit(1)
      .all();

    let allAreas: Record<string, any> = {};
    let availablePlacements: Record<string, string> = {};
    let fetchedAt: string | null = null;

    if (specs.length > 0) {
      const specData = parsePrintAreaSpec(specs[0]);
      if (specData) {
        availablePlacements = specData.available_placements;
        allAreas =
          printfulVariantId != null
            ? resolveAllPrintAreas(specData, printfulVariantId)
            : {};
        fetchedAt = specs[0].fetchedAt;
      }
    }

    // Fetch surface map
    const surfaceMapRows = await db
      .select()
      .from(surfaceMaps)
      .where(eq(surfaceMaps.printfulProductId, printfulProductId))
      .limit(1)
      .all();

    const parsedSurfaceMap = surfaceMapRows.length > 0
      ? parseSurfaceMap(surfaceMapRows[0])
      : null;
    let surfaceMap = resolveSurfaceMapForPrintSpecs(
      parsedSurfaceMap,
      printfulProductId
    );
    // Poster/canvas/catalog: mockup printfiles often only expose `default`; no DB SurfaceMap row.
    if (
      !surfaceMap &&
      Object.keys(availablePlacements).length > 0
    ) {
      surfaceMap = generateDefaultSurfaceMap(
        printfulProductId,
        availablePlacements
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        printfulProductId,
        printfulVariantId,
        availablePlacements,
        printAreas: allAreas,
        fetchedAt,
        surfaceMap: surfaceMap
          ? {
              uxSurfaces: surfaceMap.uxSurfaces,
              exportRules: surfaceMap.exportRules,
            }
          : null,
      },
    });
  } catch (err: any) {
    console.error("[print-specs] Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch print specs" },
      { status: 500 }
    );
  }
}
