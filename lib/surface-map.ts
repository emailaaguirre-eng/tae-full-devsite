/**
 * lib/surface-map.ts
 *
 * Unified Surface Mapping System
 *
 * Single source of truth that maps:
 *   UX surfaces (studio tabs) → Printful placements (export files)
 *
 * The studio reads uxSurfaces to render tabs.
 * The export pipeline reads exportRules to build output files.
 * Order creation reads exportRules to set Printful file types.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UxSurface {
  /** Unique ID used internally (e.g. "front", "inside_left", "back") */
  id: string;
  /** Human-readable label shown in the studio (e.g. "Front", "Inside (Left)") */
  label: string;
  /** The Printful placement this surface maps to (e.g. "default", "inside", "back") */
  printfulPlacement: string;
  /** Optional semantic role hint (e.g. "cover", "spread_left", "spread_right") */
  role?: string;
  /** Display order in the studio tab bar (0-based) */
  order: number;
}

export type CompositeType = "horizontalSpread" | "verticalSpread";

export interface ExportRule {
  /** The Printful placement name for the output file (e.g. "default", "inside", "back") */
  printfulPlacement: string;
  /** Which UX surface IDs contribute to this output */
  uxSurfaceIds: string[];
  /** If multiple surfaces map to this placement, how to composite them */
  composite?: { type: CompositeType };
}

export interface SurfaceMapConfig {
  printfulProductId: number;
  uxSurfaces: UxSurface[];
  exportRules: ExportRule[];
}

// ---------------------------------------------------------------------------
// Parsing helpers (DB row → typed config)
// ---------------------------------------------------------------------------

export function parseSurfaceMap(row: {
  printfulProductId: number;
  uxSurfacesJson: string;
  exportRulesJson: string;
}): SurfaceMapConfig | null {
  try {
    return {
      printfulProductId: row.printfulProductId,
      uxSurfaces: JSON.parse(row.uxSurfacesJson),
      exportRules: JSON.parse(row.exportRulesJson),
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Default config generation from Printful availablePlacements
// ---------------------------------------------------------------------------

const PRINTFUL_PLACEMENT_LABELS: Record<string, string> = {
  default: "Front",
  front: "Front",
  back: "Back",
  inside: "Inside",
  inside1: "Inside 1",
  inside2: "Inside 2",
  label_outside: "Outside Label",
  label_inside: "Inside Label",
  sleeve_left: "Left Sleeve",
  sleeve_right: "Right Sleeve",
};

/**
 * Generate a default SurfaceMapConfig from Printful's availablePlacements.
 * Creates one UX surface per Printful placement, no composites.
 */
export function generateDefaultSurfaceMap(
  printfulProductId: number,
  availablePlacements: Record<string, string>
): SurfaceMapConfig {
  const entries = Object.entries(availablePlacements);
  const uxSurfaces: UxSurface[] = entries.map(([key, displayName], idx) => ({
    id: key === "default" ? "front" : key,
    label: displayName || PRINTFUL_PLACEMENT_LABELS[key] || key,
    printfulPlacement: key,
    order: idx,
  }));

  const exportRules: ExportRule[] = entries.map(([key]) => ({
    printfulPlacement: key,
    uxSurfaceIds: [key === "default" ? "front" : key],
  }));

  return { printfulProductId, uxSurfaces, exportRules };
}

// ---------------------------------------------------------------------------
// Known multi-surface overrides
// These define products where UX surfaces differ from Printful placements.
// ---------------------------------------------------------------------------

const KNOWN_OVERRIDES: Record<number, SurfaceMapConfig> = {
  // Greeting Card (product 568): Printful mockup + printfiles use front, inside1, inside2, back — not "inside".
  568: {
    printfulProductId: 568,
    uxSurfaces: [
      { id: "front", label: "Front", printfulPlacement: "front", role: "cover", order: 0 },
      { id: "inside_left", label: "Inside (Left)", printfulPlacement: "inside1", role: "spread_left", order: 1 },
      { id: "inside_right", label: "Inside (Right)", printfulPlacement: "inside2", role: "spread_right", order: 2 },
      { id: "back", label: "Back", printfulPlacement: "back", order: 3 },
    ],
    exportRules: [
      { printfulPlacement: "front", uxSurfaceIds: ["front"] },
      { printfulPlacement: "inside1", uxSurfaceIds: ["inside_left"] },
      { printfulPlacement: "inside2", uxSurfaceIds: ["inside_right"] },
      { printfulPlacement: "back", uxSurfaceIds: ["back"] },
    ],
  },
};

/**
 * Returns true if a known multi-surface override exists for this product.
 */
export function hasKnownOverride(printfulProductId: number): boolean {
  return printfulProductId in KNOWN_OVERRIDES;
}

/**
 * Get the known override config for a product, or null.
 */
export function getKnownOverride(printfulProductId: number): SurfaceMapConfig | null {
  return KNOWN_OVERRIDES[printfulProductId] || null;
}

/**
 * Merge DB SurfaceMap with canonical multi-surface overrides.
 * When the DB row is missing, empty, or has fewer UX surfaces than the known
 * catalog config (e.g. a single-surface row for a folded greeting card), use
 * the override so the studio gets the full placement list.
 */
export function resolveSurfaceMapForPrintSpecs(
  parsedFromDb: SurfaceMapConfig | null,
  printfulProductId: number
): SurfaceMapConfig | null {
  const known = getKnownOverride(printfulProductId);
  if (!known) return parsedFromDb;
  const dbCount = parsedFromDb?.uxSurfaces?.length ?? 0;
  if (!parsedFromDb || dbCount === 0 || dbCount < known.uxSurfaces.length) {
    return known;
  }
  // Product 568: mockup API rejects placement "inside"; prefer catalog if DB still maps inside_* → "inside".
  if (
    printfulProductId === 568 &&
    parsedFromDb.uxSurfaces.some((s) => s.printfulPlacement === "inside")
  ) {
    return known;
  }
  return parsedFromDb;
}

// ---------------------------------------------------------------------------
// Studio bridge helpers
// ---------------------------------------------------------------------------

/**
 * Convert a SurfaceMapConfig into the Placement[] + labels that the studio
 * currently expects. This bridges the new system with the existing studio types.
 *
 * Returns:
 *  - placements: string[] of UX surface IDs (used as tab identifiers)
 *  - labels: Record<string, string> mapping surface ID → display label
 */
export function toStudioPlacements(config: SurfaceMapConfig): {
  placements: string[];
  labels: Record<string, string>;
} {
  const sorted = [...config.uxSurfaces].sort((a, b) => a.order - b.order);
  const placements = sorted.map((s) => s.id);
  const labels: Record<string, string> = {};
  for (const s of sorted) {
    labels[s.id] = s.label;
  }
  return { placements, labels };
}

/**
 * Get the Printful placement for a given UX surface ID.
 */
export function getPrintfulPlacement(config: SurfaceMapConfig, uxSurfaceId: string): string | null {
  const surface = config.uxSurfaces.find((s) => s.id === uxSurfaceId);
  return surface?.printfulPlacement ?? null;
}

/**
 * Given the UX surface exports (id → dataUrl), apply the export rules
 * to produce the final set of files for Printful.
 *
 * Returns an array of { printfulPlacement, dataUrl } ready for order submission.
 * Composite rules are returned as a pending marker so the caller can invoke
 * the compositor with the right strategy.
 */
export interface ExportOutput {
  printfulPlacement: string;
  dataUrl: string;
}

export interface PendingComposite {
  printfulPlacement: string;
  uxSurfaceIds: string[];
  compositeType: CompositeType;
}

export function applyExportRules(
  config: SurfaceMapConfig,
  surfaceExports: Map<string, string>
): { direct: ExportOutput[]; composites: PendingComposite[] } {
  const direct: ExportOutput[] = [];
  const composites: PendingComposite[] = [];

  for (const rule of config.exportRules) {
    if (rule.composite && rule.uxSurfaceIds.length > 1) {
      const allPresent = rule.uxSurfaceIds.every((id) => surfaceExports.has(id));
      if (allPresent) {
        composites.push({
          printfulPlacement: rule.printfulPlacement,
          uxSurfaceIds: rule.uxSurfaceIds,
          compositeType: rule.composite.type,
        });
      }
    } else {
      const surfaceId = rule.uxSurfaceIds[0];
      const dataUrl = surfaceExports.get(surfaceId);
      if (dataUrl) {
        direct.push({ printfulPlacement: rule.printfulPlacement, dataUrl });
      }
    }
  }

  return { direct, composites };
}
