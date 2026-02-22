/**
 * Print Area Specs - resolve Printful printfile dimensions
 *
 * Given a (printfulProductId, printfulVariantId, placement), returns the
 * exact pixel dimensions Printful expects for that print area.
 */

export interface PrintfileSpec {
  printfile_id: number;
  width: number;
  height: number;
  dpi: number;
  fill_mode: string;
  can_rotate: boolean;
}

export interface VariantPrintfile {
  variant_id: number;
  placements: Record<string, number>; // placement name → printfile_id
}

export interface PrintAreaSpecData {
  available_placements: Record<string, string>; // placement key → display name
  printfiles: PrintfileSpec[];
  variant_printfiles: VariantPrintfile[];
}

export interface ResolvedPrintArea {
  placement: string;
  width: number;
  height: number;
  dpi: number;
  fill_mode: string;
  printfile_id: number;
}

/**
 * Parse the stored DB row into a typed structure.
 */
export function parsePrintAreaSpec(row: {
  availablePlacements: string;
  printfilesJson: string;
  variantPrintfilesJson: string;
}): PrintAreaSpecData | null {
  try {
    return {
      available_placements: JSON.parse(row.availablePlacements),
      printfiles: JSON.parse(row.printfilesJson),
      variant_printfiles: JSON.parse(row.variantPrintfilesJson),
    };
  } catch {
    return null;
  }
}

/**
 * Resolve the print area dimensions for a specific variant and placement.
 *
 * Returns null if the variant or placement is not found.
 */
export function resolvePrintArea(
  spec: PrintAreaSpecData,
  variantId: number,
  placement: string
): ResolvedPrintArea | null {
  const variantSpec = spec.variant_printfiles.find(
    (v) => v.variant_id === variantId
  );
  if (!variantSpec) return null;

  const printfileId = variantSpec.placements[placement];
  if (printfileId === undefined) return null;

  const printfile = spec.printfiles.find((p) => p.printfile_id === printfileId);
  if (!printfile) return null;

  return {
    placement,
    width: printfile.width,
    height: printfile.height,
    dpi: printfile.dpi,
    fill_mode: printfile.fill_mode,
    printfile_id: printfile.printfile_id,
  };
}

/**
 * Resolve all print areas for a variant.
 *
 * Returns a map of placement → dimensions.
 */
export function resolveAllPrintAreas(
  spec: PrintAreaSpecData,
  variantId: number
): Record<string, ResolvedPrintArea> {
  const result: Record<string, ResolvedPrintArea> = {};

  const variantSpec = spec.variant_printfiles.find(
    (v) => v.variant_id === variantId
  );
  if (!variantSpec) return result;

  for (const [placement, printfileId] of Object.entries(variantSpec.placements)) {
    const printfile = spec.printfiles.find((p) => p.printfile_id === printfileId);
    if (printfile) {
      result[placement] = {
        placement,
        width: printfile.width,
        height: printfile.height,
        dpi: printfile.dpi,
        fill_mode: printfile.fill_mode,
        printfile_id: printfile.printfile_id,
      };
    }
  }

  return result;
}

/**
 * Map studio placement names to Printful placement names.
 *
 * Studio uses: front, inside1, inside2, back
 * Printful uses: default (or front), inside, back
 */
export const STUDIO_TO_PRINTFUL_PLACEMENT: Record<string, string> = {
  front: "default",
  inside: "inside",
  inside1: "inside",
  inside2: "inside",
  back: "back",
};

/**
 * Get the Printful placement key for a studio placement.
 */
export function toPrintfulPlacement(studioPlacement: string): string {
  return STUDIO_TO_PRINTFUL_PLACEMENT[studioPlacement] || studioPlacement;
}
