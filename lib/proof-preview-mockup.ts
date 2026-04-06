/**
 * Print proof (mockup-generator) helpers — placement names must match Printful per product.
 *
 * Catalog examples (mockup-generator/printfiles):
 * - 568: front, inside1, inside2, back
 * - 1, 2, 3, 171, 172, 614: default only (studio may still label UX surface "front")
 */

import type { PrintAreaSpecData } from "@/lib/print-area-specs";

/** Printful product IDs we officially support for studio print proof. */
export const SUPPORTED_PROOF_PREVIEW_PRINTFUL_PRODUCT_IDS: ReadonlySet<number> = new Set([
  568, // Greeting / invitation / announcement (folded)
  3, // Canvas
  614, // Framed canvas
  1, // Matte poster
  171, // Luster poster
  2, // Framed matte
  172, // Framed luster
]);

/** Mockup API exposes only `default` for these (export may use `front`). */
const MOCKUP_DEFAULT_ONLY_PRODUCT_IDS = new Set([1, 2, 3, 171, 172, 614]);

/**
 * Map studio/export placement string to the placement key Printful's mockup task expects.
 * Uses synced PrintAreaSpec when present; otherwise a minimal fallback for default-only products.
 */
export function resolveMockupPlacementForPrintful(
  specData: PrintAreaSpecData | null,
  printfulProductId: number,
  exportPlacement: string
): string {
  const raw = String(exportPlacement || "").trim();
  const p = raw.toLowerCase();
  if (!p) return "default";

  const keys = specData?.available_placements
    ? Object.keys(specData.available_placements)
    : [];
  const matchCanonical = (want: string): string | null => {
    const w = want.toLowerCase();
    const hit = keys.find((k) => k.toLowerCase() === w);
    return hit ?? null;
  };

  if (keys.length > 0) {
    const direct = matchCanonical(p);
    if (direct) return direct;

    if (p === "front") {
      const def = matchCanonical("default");
      if (def) return def;
    }
    if (p === "default") {
      const fr = matchCanonical("front");
      if (fr) return fr;
    }

    return p;
  }

  // No PrintAreaSpec yet — avoid common mismatch for single-placement poster/canvas products.
  if (MOCKUP_DEFAULT_ONLY_PRODUCT_IDS.has(printfulProductId) && p === "front") {
    return "default";
  }

  return p;
}
