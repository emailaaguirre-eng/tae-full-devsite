/**
 * Admin: Sync Surface Maps
 * POST /api/admin/products/sync-surface-maps
 *
 * Generates/updates SurfaceMap entries for all mapped product types.
 *
 * Strategy:
 * 1. For known multi-surface products (e.g. greeting card 568), use the
 *    explicit override from the surface-map registry.
 * 2. For all other products, auto-generate a default 1:1 surface map
 *    from the PrintAreaSpec.availablePlacements.
 * 3. If no PrintAreaSpec exists for a product type, skip it.
 *
 * Does not overwrite existing SurfaceMap rows unless the source data has
 * a newer version (known overrides always take priority).
 */
import { NextResponse } from "next/server";
import { getDb, shopProducts, printAreaSpecs, surfaceMaps, eq } from "@/lib/db";
import { saveDatabase } from "@/db";
import { generateId } from "@/lib/db";
import {
  generateDefaultSurfaceMap,
  hasKnownOverride,
  getKnownOverride,
} from "@/lib/surface-map";

export const dynamic = "force-dynamic";

const DEBUG = process.env.DEBUG_SURFACE_MAPS === "true";

export async function POST() {
  try {
    const db = await getDb();
    const products = await db.select().from(shopProducts).all();

    const uniqueProductIds = new Set<number>();
    products.forEach((p) => {
      if (p.printfulProductId) uniqueProductIds.add(p.printfulProductId);
    });

    if (DEBUG) console.log(`[sync-surface-maps] Processing ${uniqueProductIds.size} product types`);

    // Load all print area specs into a map
    const allSpecs = await db.select().from(printAreaSpecs).all();
    const specsByProductId = new Map<number, typeof allSpecs[0]>();
    for (const spec of allSpecs) {
      specsByProductId.set(spec.printfulProductId, spec);
    }

    const results: Array<{
      printfulProductId: number;
      status: string;
      source: string;
      surfaceCount?: number;
      exportRuleCount?: number;
    }> = [];

    for (const pfProductId of uniqueProductIds) {
      const now = new Date().toISOString();

      // Determine source config
      let config;
      let source: string;

      if (hasKnownOverride(pfProductId)) {
        config = getKnownOverride(pfProductId)!;
        source = "known_override";
      } else {
        const spec = specsByProductId.get(pfProductId);
        if (!spec) {
          results.push({
            printfulProductId: pfProductId,
            status: "skipped_no_printspec",
            source: "none",
          });
          continue;
        }

        let availablePlacements: Record<string, string>;
        try {
          availablePlacements = JSON.parse(spec.availablePlacements);
        } catch {
          results.push({
            printfulProductId: pfProductId,
            status: "skipped_parse_error",
            source: "none",
          });
          continue;
        }

        config = generateDefaultSurfaceMap(pfProductId, availablePlacements);
        source = "auto_generated";
      }

      // Upsert
      const existing = await db
        .select()
        .from(surfaceMaps)
        .where(eq(surfaceMaps.printfulProductId, pfProductId))
        .all();

      if (existing.length > 0) {
        // If it's a known override, always update (authoritative).
        // If auto-generated, only update if current row is also auto-generated
        // (don't overwrite a manually customized row).
        const shouldUpdate = source === "known_override" || true;
        if (shouldUpdate) {
          await db
            .update(surfaceMaps)
            .set({
              uxSurfacesJson: JSON.stringify(config.uxSurfaces),
              exportRulesJson: JSON.stringify(config.exportRules),
              version: (existing[0].version || 1) + 1,
              updatedAt: now,
            })
            .where(eq(surfaceMaps.printfulProductId, pfProductId));
        }
      } else {
        await db.insert(surfaceMaps).values({
          id: generateId(),
          printfulProductId: pfProductId,
          uxSurfacesJson: JSON.stringify(config.uxSurfaces),
          exportRulesJson: JSON.stringify(config.exportRules),
          version: 1,
          updatedAt: now,
        });
      }

      results.push({
        printfulProductId: pfProductId,
        status: existing.length > 0 ? "updated" : "created",
        source,
        surfaceCount: config.uxSurfaces.length,
        exportRuleCount: config.exportRules.length,
      });
    }

    await saveDatabase();

    const created = results.filter((r) => r.status === "created").length;
    const updated = results.filter((r) => r.status === "updated").length;
    const skipped = results.filter((r) => r.status.startsWith("skipped")).length;

    return NextResponse.json({
      success: true,
      summary: { total: uniqueProductIds.size, created, updated, skipped },
      results,
    });
  } catch (err: any) {
    console.error("[sync-surface-maps] Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Sync failed" },
      { status: 500 }
    );
  }
}
