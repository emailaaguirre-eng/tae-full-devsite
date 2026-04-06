/**
 * Admin: Sync Print Area Specs from Printful
 * POST /api/admin/products/sync-printspecs
 *
 * Fetches printfile dimensions from Printful for all mapped product types
 * and stores them in the PrintAreaSpec table.
 *
 * Also updates each ShopProduct's printWidth/printHeight with
 * the Printful-authoritative dimensions for its specific variant.
 */
import { NextResponse } from "next/server";
import { getDb, shopProducts, printAreaSpecs, eq } from "@/lib/db";
import { saveDatabase } from "@/db";
import { generateId } from "@/lib/db";
import { getPrintfiles } from "@/lib/printful";
import { parsePrintAreaSpec, resolvePrintArea } from "@/lib/print-area-specs";
import {
  parseVariantMatrix,
  resolveShopProductPrintfulIds,
} from "@/lib/product-watermark";
import { SUPPORTED_PROOF_PREVIEW_PRINTFUL_PRODUCT_IDS } from "@/lib/proof-preview-mockup";

export const dynamic = "force-dynamic";

const DEBUG = process.env.DEBUG_PRINTSPECS === "true";

export async function POST() {
  try {
    const db = await getDb();
    const products = await db.select().from(shopProducts).all();

    const uniqueProductIds = new Set<number>();
    for (const p of products) {
      const resolved = resolveShopProductPrintfulIds(p);
      if (resolved.printfulProductId) {
        uniqueProductIds.add(resolved.printfulProductId);
      }
      for (const row of parseVariantMatrix(p.printfulDataJson)) {
        const pid = Math.trunc(Number(row.printfulProductId));
        if (Number.isFinite(pid) && pid > 0) uniqueProductIds.add(pid);
      }
    }

    // Always sync catalog IDs we support for print proof, even when ShopProduct is empty
    // (e.g. serverless DB path mismatch) or variantMatrix fails to parse — otherwise
    // uniqueProductIds stays empty → results: [] and PrintAreaSpec never writes.
    for (const id of SUPPORTED_PROOF_PREVIEW_PRINTFUL_PRODUCT_IDS) {
      uniqueProductIds.add(id);
    }

    if (DEBUG) console.log(`[sync-printspecs] Fetching specs for ${uniqueProductIds.size} product types`);

    const results: Array<{
      printfulProductId: number;
      status: string;
      placements?: Record<string, string>;
      printfileCount?: number;
      variantCount?: number;
    }> = [];

    for (const pfProductId of uniqueProductIds) {
      try {
        const pfData = await getPrintfiles(pfProductId);

        const availablePlacements = pfData.available_placements || {};
        const printfiles = pfData.printfiles || [];
        const variantPrintfiles = pfData.variant_printfiles || [];

        // Upsert into PrintAreaSpec
        const existing = await db
          .select()
          .from(printAreaSpecs)
          .where(eq(printAreaSpecs.printfulProductId, pfProductId))
          .all();

        const now = new Date().toISOString();

        if (existing.length > 0) {
          await db
            .update(printAreaSpecs)
            .set({
              availablePlacements: JSON.stringify(availablePlacements),
              printfilesJson: JSON.stringify(printfiles),
              variantPrintfilesJson: JSON.stringify(variantPrintfiles),
              optionGroups: JSON.stringify(pfData.option_groups || []),
              options: JSON.stringify(pfData.options || []),
              fetchedAt: now,
            })
            .where(eq(printAreaSpecs.printfulProductId, pfProductId));
        } else {
          await db.insert(printAreaSpecs).values({
            id: generateId(),
            printfulProductId: pfProductId,
            availablePlacements: JSON.stringify(availablePlacements),
            printfilesJson: JSON.stringify(printfiles),
            variantPrintfilesJson: JSON.stringify(variantPrintfiles),
            optionGroups: JSON.stringify(pfData.option_groups || []),
            options: JSON.stringify(pfData.options || []),
            fetchedAt: now,
          });
        }

        // Update each ShopProduct with its variant-specific dimensions
        const specData = parsePrintAreaSpec({
          availablePlacements: JSON.stringify(availablePlacements),
          printfilesJson: JSON.stringify(printfiles),
          variantPrintfilesJson: JSON.stringify(variantPrintfiles),
        });

        if (specData) {
          const productsForType = products.filter(
            (p) => p.printfulProductId === pfProductId && p.printfulVariantId
          );

          for (const product of productsForType) {
            const frontArea = resolvePrintArea(
              specData,
              product.printfulVariantId!,
              availablePlacements["default"] ? "default" : "front"
            ) || resolvePrintArea(specData, product.printfulVariantId!, "default");

            if (frontArea) {
              await db
                .update(shopProducts)
                .set({
                  printWidth: frontArea.width,
                  printHeight: frontArea.height,
                  printDpi: frontArea.dpi,
                  printFillMode: frontArea.fill_mode,
                  updatedAt: now,
                })
                .where(eq(shopProducts.id, product.id));

              if (DEBUG) {
                console.log(
                  `[sync-printspecs] Updated ${product.slug}: ${frontArea.width}x${frontArea.height} @ ${frontArea.dpi}dpi`
                );
              }
            }
          }
        }

        results.push({
          printfulProductId: pfProductId,
          status: "synced",
          placements: availablePlacements,
          printfileCount: printfiles.length,
          variantCount: variantPrintfiles.length,
        });
      } catch (err: any) {
        console.error(`[sync-printspecs] Failed for product ${pfProductId}:`, err.message);
        results.push({
          printfulProductId: pfProductId,
          status: `error: ${err.message}`,
        });
      }
    }

    await saveDatabase();

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (err: any) {
    console.error("[sync-printspecs] Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Sync failed" },
      { status: 500 }
    );
  }
}
