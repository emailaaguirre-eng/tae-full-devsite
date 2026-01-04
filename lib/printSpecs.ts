// Print Specs Library
// Defines print specifications for different product types
// 
// SPRINT 1: Refactored to use mm internally (spec-driven)
// - trimBox: final cut size from Gelato (in mm)
// - bleedBox: trimBox + 4mm on all sides (default)
// - safeBox: trimBox inset 4mm on all sides (default)
// - All dimensions stored in mm, converted to pixels for display/export

export interface PrintSide {
  id: 'front' | 'inside' | 'inside-left' | 'inside-right' | 'inside-top' | 'inside-bottom' | 'back';
  name?: string; // Optional display name for clarity
  // Dimensions in mm (internal storage)
  trimMm: { w: number; h: number }; // Final cut size (from Gelato)
  bleedMm: number; // Bleed amount in mm (default 4mm)
  safeMm: number; // Safe zone inset in mm (default 4mm)
  foldLines?: Array<{ x1: number; y1: number; x2: number; y2: number }>; // Coordinates in mm
  // Legacy pixel properties (deprecated - use conversion functions)
  /** @deprecated Use trimMm and mmToPx() instead */
  canvasPx?: { w: number; h: number };
  /** @deprecated Use bleedMm and mmToPx() instead */
  bleedPx?: number;
  /** @deprecated Use trimMm and mmToPx() instead */
  trimPx?: number;
  /** @deprecated Use safeMm and mmToPx() instead */
  safePx?: number;
}

export interface PrintSpec {
  id: string;
  name: string;
  sides: PrintSide[];
  folded?: boolean; // true if product has fold lines (e.g., bifold cards)
  sideIds: Array<'front' | 'inside' | 'inside-left' | 'inside-right' | 'inside-top' | 'inside-bottom' | 'back'>; // Explicit list of available sides
  dpi?: number; // Print DPI (default 300)
}

// DPI constant (default print DPI)
export const DEFAULT_DPI = 300;

/**
 * Convert millimeters to pixels at specified DPI
 * Formula: mm -> inches (divide by 25.4) -> pixels (multiply by DPI)
 */
export function mmToPx(mm: number, dpi: number = DEFAULT_DPI): number {
  return (mm / 25.4) * dpi;
}

/**
 * Convert pixels to millimeters at specified DPI
 * Formula: pixels -> inches (divide by DPI) -> mm (multiply by 25.4)
 */
export function pxToMm(px: number, dpi: number = DEFAULT_DPI): number {
  return (px / dpi) * 25.4;
}

/**
 * Convert inches to pixels at specified DPI
 * @deprecated Use mm-based functions for new code
 */
function inchesToPx(inches: number, dpi: number = DEFAULT_DPI): number {
  return Math.round(inches * dpi);
}

/**
 * Convert inches to millimeters
 */
function inchesToMm(inches: number): number {
  return inches * 25.4;
}

// Print Specs
export const printSpecs: Record<string, PrintSpec> = {
  poster_simple: {
    id: 'poster_simple',
    name: 'Poster (Simple)',
    sides: [
      {
        id: 'front',
        canvasPx: { w: inchesToPx(18), h: inchesToPx(24) }, // 18x24 inches
        bleedPx: inchesToPx(0.125), // 1/8 inch bleed
        trimPx: inchesToPx(0.125), // 1/8 inch trim
        safePx: inchesToPx(0.25), // 1/4 inch safe zone
      },
    ],
    folded: false,
    sideIds: ['front'],
  },
  greeting_card_bifold: {
    id: 'greeting_card_bifold',
    name: 'Greeting Card (Bifold)',
    sides: [
      {
        id: 'front',
        canvasPx: { w: inchesToPx(5), h: inchesToPx(7) }, // 5x7 inches per side
        bleedPx: inchesToPx(0.125),
        trimPx: inchesToPx(0.125),
        safePx: inchesToPx(0.25),
        foldLines: [
          { x1: inchesToPx(5), y1: 0, x2: inchesToPx(5), y2: inchesToPx(7) }, // Vertical fold at right edge (fold to inside)
        ],
      },
      {
        id: 'inside',
        canvasPx: { w: inchesToPx(5), h: inchesToPx(7) },
        bleedPx: inchesToPx(0.125),
        trimPx: inchesToPx(0.125),
        safePx: inchesToPx(0.25),
        foldLines: [
          { x1: 0, y1: 0, x2: 0, y2: inchesToPx(7) }, // Vertical fold at left edge (fold from front)
          { x1: inchesToPx(5), y1: 0, x2: inchesToPx(5), y2: inchesToPx(7) }, // Vertical fold at right edge (fold to back)
        ],
      },
      {
        id: 'back',
        canvasPx: { w: inchesToPx(5), h: inchesToPx(7) },
        bleedPx: inchesToPx(0.125),
        trimPx: inchesToPx(0.125),
        safePx: inchesToPx(0.25),
        foldLines: [
          { x1: 0, y1: 0, x2: 0, y2: inchesToPx(7) }, // Vertical fold at left edge (fold from inside)
        ],
      },
    ],
    folded: true,
    sideIds: ['front', 'inside', 'back'],
  },
  postcard_front_back: {
    id: 'postcard_front_back',
    name: 'Postcard (Front/Back)',
    sides: [
      {
        id: 'front',
        canvasPx: { w: inchesToPx(4), h: inchesToPx(6) }, // 4x6 inches
        bleedPx: inchesToPx(0.125),
        trimPx: inchesToPx(0.125),
        safePx: inchesToPx(0.25),
      },
      {
        id: 'back',
        canvasPx: { w: inchesToPx(4), h: inchesToPx(6) },
        bleedPx: inchesToPx(0.125),
        trimPx: inchesToPx(0.125),
        safePx: inchesToPx(0.25),
      },
    ],
    folded: false,
    sideIds: ['front', 'back'],
  },
  invitation_flat: {
    id: 'invitation_flat',
    name: 'Invitation (Flat)',
    sides: [
      {
        id: 'front',
        canvasPx: { w: inchesToPx(5), h: inchesToPx(7) }, // 5x7 inches
        bleedPx: inchesToPx(0.125),
        trimPx: inchesToPx(0.125),
        safePx: inchesToPx(0.25),
      },
    ],
    folded: false,
    sideIds: ['front'],
  },
  announcement_flat: {
    id: 'announcement_flat',
    name: 'Announcement (Flat)',
    sides: [
      {
        id: 'front',
        canvasPx: { w: inchesToPx(5), h: inchesToPx(7) }, // 5x7 inches
        bleedPx: inchesToPx(0.125),
        trimPx: inchesToPx(0.125),
        safePx: inchesToPx(0.25),
      },
    ],
    folded: false,
    sideIds: ['front'],
  },
};

export function getPrintSpec(id: string): PrintSpec | undefined {
  return printSpecs[id];
}

// Size dimensions in inches (width x height)
// For cards, this is the FOLDED size (front panel size)
// NOTE: These are converted to mm internally
const SIZE_DIMENSIONS: Record<string, { w: number; h: number }> = {
  'a6': { w: 4.1, h: 5.8 },      // A6 metric
  '5x7': { w: 5, h: 7 },         // US standard
  'a5': { w: 5.8, h: 8.3 },      // A5 metric
  'square': { w: 5.5, h: 5.5 },  // Square
  '4x6': { w: 4, h: 6 },         // Small postcard
  '8x10': { w: 8, h: 10 },       // Print
  '11x14': { w: 11, h: 14 },     // Print
  '16x20': { w: 16, h: 20 },     // Print
  '18x24': { w: 18, h: 24 },     // Print
  '24x36': { w: 24, h: 36 },     // Print
};

// Default bleed and safe zone values in mm
const DEFAULT_BLEED_MM = 4;
const DEFAULT_SAFE_MM = 4;

/**
 * Get a hardcoded sample spec for Sprint 1 testing
 * Returns a 4x6 postcard (front/back) in portrait orientation
 */
export function getSamplePostcardSpec(): PrintSpec {
  const trimW = inchesToMm(4); // 4 inches = 101.6mm
  const trimH = inchesToMm(6); // 6 inches = 152.4mm
  const bleedMm = DEFAULT_BLEED_MM;
  const safeMm = DEFAULT_SAFE_MM;
  
  const trimWpx = mmToPx(trimW);
  const trimHpx = mmToPx(trimH);
  const bleedPx = mmToPx(bleedMm);
  const safePx = mmToPx(safeMm);
  
  return {
    id: 'sample_postcard_4x6_portrait',
    name: 'Sample Postcard 4x6 (Portrait)',
    folded: false,
    sideIds: ['front', 'back'],
    sides: [
      {
        id: 'front',
        name: 'Front',
        trimMm: { w: trimW, h: trimH },
        bleedMm,
        safeMm,
        // Legacy pixel properties for backward compatibility
        canvasPx: { w: trimWpx, h: trimHpx },
        bleedPx,
        trimPx: trimWpx,
        safePx,
      },
      {
        id: 'back',
        name: 'Back',
        trimMm: { w: trimW, h: trimH },
        bleedMm,
        safeMm,
        canvasPx: { w: trimWpx, h: trimHpx },
        bleedPx,
        trimPx: trimWpx,
        safePx,
      },
    ],
    dpi: DEFAULT_DPI,
  };
}

/**
 * Generate a dynamic print spec based on product type and size
 * This allows print specs to adapt to user's size selection
 * 
 * SPRINT 1: Refactored to use mm internally
 * - trimBox: calculated from size dimensions (converted from inches to mm)
 * - bleedBox: trimBox + DEFAULT_BLEED_MM (4mm) on all sides
 * - safeBox: trimBox inset DEFAULT_SAFE_MM (4mm) on all sides
 */
export function generatePrintSpecForSize(
  productType: 'card' | 'postcard' | 'invitation' | 'announcement' | 'print',
  sizeId: string,
  orientation: 'portrait' | 'landscape' = 'portrait',
  foldOption: 'bifold' | 'flat' = 'bifold',
  bleedMm: number = DEFAULT_BLEED_MM,
  safeMm: number = DEFAULT_SAFE_MM
): PrintSpec {
  const dims = SIZE_DIMENSIONS[sizeId] || { w: 5, h: 7 }; // Default to 5x7 inches
  
  // Apply orientation
  const wInches = orientation === 'landscape' ? Math.max(dims.w, dims.h) : Math.min(dims.w, dims.h);
  const hInches = orientation === 'landscape' ? Math.min(dims.w, dims.h) : Math.max(dims.w, dims.h);
  
  // Convert trim dimensions from inches to mm
  const trimW = inchesToMm(wInches);
  const trimH = inchesToMm(hInches);
  
  // trimBox = final cut size (in mm)
  const trimBox = { w: trimW, h: trimH };
  
  // bleedBox = trimBox + bleedMm on all sides
  // safeBox = trimBox inset safeMm on all sides (content should stay within this)
  
  // For backward compatibility, also compute pixel values
  const canvasW = mmToPx(trimW);
  const canvasH = mmToPx(trimH);
  const bleedPx = mmToPx(bleedMm);
  const safePx = mmToPx(safeMm);

  // Helper function to create a PrintSide with mm dimensions
  const createSide = (
    id: PrintSide['id'],
    name: string,
    foldLinesMm?: Array<{ x1: number; y1: number; x2: number; y2: number }>
  ): PrintSide => ({
    id,
    name,
    trimMm: { w: trimBox.w, h: trimBox.h },
    bleedMm,
    safeMm,
    foldLines: foldLinesMm, // Fold lines are already in mm coordinates
    // Legacy pixel properties for backward compatibility
    canvasPx: { w: canvasW, h: canvasH },
    bleedPx: bleedPx,
    trimPx: canvasW, // trimPx is the canvas width (trim size in pixels)
    safePx: safePx,
  });

  // Card types - check fold option
  if (productType === 'card') {
    const isBifold = foldOption === 'bifold';
    
    if (isBifold) {
      if (orientation === 'portrait') {
        // Portrait card - opens left to right like a book
        // Button order: Front Cover, Inside Left, Inside Right, Back Cover
        // Fold lines in mm coordinates (0 = left/top edge, trimBox.w/h = right/bottom edge)
        return {
          id: `card_${sizeId}_${orientation}_bifold`,
          name: `Card ${sizeId.toUpperCase()} (${orientation}, Bifold)`,
          folded: true,
          sideIds: ['front', 'inside-left', 'inside-right', 'back'],
          sides: [
            createSide('front', 'Front Cover', [
              { x1: 0, y1: 0, x2: 0, y2: trimBox.h }, // Left edge (connects to inside-right) - mm coordinates
            ]),
            createSide('inside-left', 'Inside Left', [
              { x1: trimBox.w, y1: 0, x2: trimBox.w, y2: trimBox.h }, // Right edge (center fold) - mm coordinates
            ]),
            createSide('inside-right', 'Inside Right', [
              { x1: 0, y1: 0, x2: 0, y2: trimBox.h }, // Left edge (center fold) - mm coordinates
              { x1: trimBox.w, y1: 0, x2: trimBox.w, y2: trimBox.h }, // Right edge (front fold) - mm coordinates
            ]),
            createSide('back', 'Back Cover', [
              { x1: trimBox.w, y1: 0, x2: trimBox.w, y2: trimBox.h }, // Right edge (connects to inside-left) - mm coordinates
            ]),
          ],
          dpi: DEFAULT_DPI,
        };
      } else {
        // Landscape card - opens top to bottom like a tent
        // Button order: Front Cover, Inside Top, Inside Bottom, Back Cover
        return {
          id: `card_${sizeId}_${orientation}_bifold`,
          name: `Card ${sizeId.toUpperCase()} (${orientation}, Bifold)`,
          folded: true,
          sideIds: ['front', 'inside-top', 'inside-bottom', 'back'],
          sides: [
            createSide('front', 'Front Cover', [
              { x1: 0, y1: trimBox.h, x2: trimBox.w, y2: trimBox.h }, // Bottom edge (connects to inside-bottom) - mm coordinates
            ]),
            createSide('inside-top', 'Inside Top', [
              { x1: 0, y1: trimBox.h, x2: trimBox.w, y2: trimBox.h }, // Bottom edge (center fold) - mm coordinates
            ]),
            createSide('inside-bottom', 'Inside Bottom', [
              { x1: 0, y1: 0, x2: trimBox.w, y2: 0 }, // Top edge (center fold) - mm coordinates
              { x1: 0, y1: trimBox.h, x2: trimBox.w, y2: trimBox.h }, // Bottom edge (front fold) - mm coordinates
            ]),
            createSide('back', 'Back Cover', [
              { x1: 0, y1: 0, x2: trimBox.w, y2: 0 }, // Top edge (connects to inside-top) - mm coordinates
            ]),
          ],
          dpi: DEFAULT_DPI,
        };
      }
    } else {
      // Flat card - no fold, just front and back
      return {
        id: `card_${sizeId}_${orientation}_flat`,
        name: `Card ${sizeId.toUpperCase()} (${orientation}, Flat)`,
        folded: false,
        sideIds: ['front', 'back'],
        sides: [
          createSide('front', 'Front'),
          createSide('back', 'Back'),
        ],
        dpi: DEFAULT_DPI,
      };
    }
  }

  // Postcard (front and back, no fold)
  if (productType === 'postcard') {
    return {
      id: `postcard_${sizeId}_${orientation}`,
      name: `Postcard ${sizeId.toUpperCase()} (${orientation})`,
      folded: false,
      sideIds: ['front', 'back'],
      sides: [
        createSide('front', 'Front'),
        createSide('back', 'Back'),
      ],
      dpi: DEFAULT_DPI,
    };
  }

  // Invitations and Announcements (single-sided flat)
  if (productType === 'invitation' || productType === 'announcement') {
    return {
      id: `${productType}_${sizeId}_${orientation}`,
      name: `${productType.charAt(0).toUpperCase() + productType.slice(1)} ${sizeId.toUpperCase()} (${orientation})`,
      folded: false,
      sideIds: ['front'],
      sides: [
        createSide('front', 'Front'),
      ],
      dpi: DEFAULT_DPI,
    };
  }

  // Prints (single-sided)
  return {
    id: `print_${sizeId}_${orientation}`,
    name: `Print ${sizeId.toUpperCase()} (${orientation})`,
    folded: false,
    sideIds: ['front'],
    sides: [
      createSide('front', 'Front'),
    ],
    dpi: DEFAULT_DPI,
  };
}

export function getPrintSide(spec: PrintSpec, sideId: 'front' | 'inside' | 'inside-left' | 'inside-right' | 'inside-top' | 'inside-bottom' | 'back'): PrintSide | undefined {
  return spec.sides.find((s) => s.id === sideId);
}

// Result type for print spec lookup
export interface PrintSpecResult {
  spec: PrintSpec | undefined;
  error?: string; // Error message if spec is required but missing
}

// Card-like products that REQUIRE explicit PrintSpec mapping
const CARD_PRODUCTS = ['card', 'invitation', 'announcement'];

/**
 * Variant UID to PrintSpec ID Mapping
 * Maps Gelato variant UIDs to our PrintSpec IDs
 * 
 * Format: variantUid (or pattern) -> printSpecId
 * 
 * Patterns can use wildcards:
 * - "*" matches any characters
 * - Example: "cards_*_a5_*" matches all A5 card variants
 */
export const VARIANT_UID_TO_PRINTSPEC_MAP: Record<string, string> = {
  // Cards (bifold, multi-side)
  // Pattern: cards_*_a5_* -> greeting_card_bifold (5x7 inches)
  // Pattern: cards_*_a6_* -> greeting_card_bifold (smaller size, but same structure)
  // Add specific variant UIDs as they are discovered from Gelato API
  
  // Postcards (front/back)
  // Pattern: postcards_* -> postcard_front_back
  
  // Invitations (flat, front only)
  // Pattern: invitations_* -> invitation_flat
  
  // Announcements (flat, front only)
  // Pattern: announcements_* -> announcement_flat
  
  // Wall prints (front only)
  // Pattern: prints_* -> poster_simple
};

/**
 * Resolves PrintSpec ID from Gelato variant UID
 * 
 * @param variantUid Gelato variant UID
 * @returns PrintSpec ID or null if no mapping found
 */
export function getPrintSpecIdForVariantUid(variantUid: string): string | null {
  // Direct match first
  if (VARIANT_UID_TO_PRINTSPEC_MAP[variantUid]) {
    return VARIANT_UID_TO_PRINTSPEC_MAP[variantUid];
  }
  
  // Pattern matching (wildcard support)
  for (const [pattern, specId] of Object.entries(VARIANT_UID_TO_PRINTSPEC_MAP)) {
    if (pattern.includes('*')) {
      // Convert pattern to regex
      const regexPattern = pattern.replace(/\*/g, '.*');
      const regex = new RegExp(`^${regexPattern}$`);
      if (regex.test(variantUid)) {
        return specId;
      }
    }
  }
  
  // Try prefix matching (e.g., "cards_" prefix -> greeting_card_bifold)
  if (variantUid.startsWith('cards_')) {
    // Default to bifold card for card variants
    return 'greeting_card_bifold';
  }
  if (variantUid.startsWith('postcards_')) {
    return 'postcard_front_back';
  }
  if (variantUid.startsWith('invitations_')) {
    return 'invitation_flat';
  }
  if (variantUid.startsWith('announcements_')) {
    return 'announcement_flat';
  }
  if (variantUid.startsWith('prints_')) {
    return 'poster_simple';
  }
  
  return null;
}

/**
 * Updated getPrintSpecForProduct to support gelatoVariantUid
 * 
 * Priority:
 * 1. If gelatoVariantUid provided, use variant UID resolver
 * 2. If gelatoVariantUid exists but no mapping found, return error (enforcement)
 * 3. If no gelatoVariantUid, fall back to product slug mapping (only for simple posters)
 */
export function getPrintSpecForProduct(
  productSlugOrId: string,
  variationId?: string,
  gelatoVariantUid?: string
): PrintSpecResult {
  // Priority 1: Use gelatoVariantUid if provided
  if (gelatoVariantUid) {
    const specId = getPrintSpecIdForVariantUid(gelatoVariantUid);
    
    if (specId) {
      const spec = getPrintSpec(specId);
      if (spec) {
        return { spec };
      } else {
        return {
          spec: undefined,
          error: `Print spec "${specId}" not found for variant ${gelatoVariantUid}.`,
        };
      }
    } else {
      // Enforcement: If variant UID exists but no mapping, block with error
      return {
        spec: undefined,
        error: `This format (variant: ${gelatoVariantUid}) isn't configured for print yet. Please contact support.`,
      };
    }
  }
  
  // Priority 2: Fall back to product slug mapping (only for simple posters)
  const mapping: Record<string, string> = {
    poster: 'poster_simple',
    print: 'poster_simple',
    card: 'greeting_card_bifold',
    invitation: 'invitation_flat',
    announcement: 'announcement_flat',
    postcard: 'postcard_front_back',
  };

  const specId = mapping[productSlugOrId];

  // For card products, require explicit mapping (or variant UID)
  if (CARD_PRODUCTS.includes(productSlugOrId) && !specId) {
    return {
      spec: undefined,
      error: `This card format (${productSlugOrId}) isn't configured for print yet. Please contact support.`,
    };
  }

  // For posters and other products, fallback to poster_simple
  const finalSpecId = specId || 'poster_simple';
  const spec = getPrintSpec(finalSpecId);

  if (!spec) {
    return {
      spec: undefined,
      error: `Print spec "${finalSpecId}" not found.`,
    };
  }

  return { spec };
}

/**
 * Generate PrintSpec from Gelato variant dimensions
 * SPRINT 2: Creates PrintSpec from Gelato product variant data
 */
export function generatePrintSpecFromGelatoVariant(
  variantUid: string,
  productType: 'card' | 'postcard' | 'invitation' | 'announcement' | 'print',
  trimMm: { w: number; h: number },
  orientation: 'portrait' | 'landscape' = 'portrait',
  foldOption?: 'bifold' | 'flat',
  bleedMm: number = DEFAULT_BLEED_MM,
  safeMm: number = DEFAULT_SAFE_MM
): PrintSpec {
  // Apply orientation (swap dimensions if landscape)
  const finalTrim = orientation === 'landscape'
    ? { w: Math.max(trimMm.w, trimMm.h), h: Math.min(trimMm.w, trimMm.h) }
    : { w: Math.min(trimMm.w, trimMm.h), h: Math.max(trimMm.w, trimMm.h) };
  
  // Use existing generatePrintSpecForSize logic but with custom dimensions
  // For now, we'll create a custom spec since we have exact dimensions
  const trimWpx = mmToPx(finalTrim.w);
  const trimHpx = mmToPx(finalTrim.h);
  const bleedPx = mmToPx(bleedMm);
  const safePx = mmToPx(safeMm);
  
  const createSide = (
    id: PrintSide['id'],
    name: string,
    foldLinesMm?: Array<{ x1: number; y1: number; x2: number; y2: number }>
  ): PrintSide => ({
    id,
    name,
    trimMm: { w: finalTrim.w, h: finalTrim.h },
    bleedMm,
    safeMm,
    foldLines: foldLinesMm,
    // Legacy pixel properties for backward compatibility
    canvasPx: { w: trimWpx, h: trimHpx },
    bleedPx,
    trimPx: trimWpx,
    safePx,
  });
  
  // Generate sides based on product type
  if (productType === 'card' && foldOption === 'bifold') {
    if (orientation === 'portrait') {
      return {
        id: `gelato_${variantUid}_portrait_bifold`,
        name: `Card (${variantUid})`,
        folded: true,
        sideIds: ['front', 'inside-left', 'inside-right', 'back'],
        sides: [
          createSide('front', 'Front Cover', [
            { x1: 0, y1: 0, x2: 0, y2: finalTrim.h },
          ]),
          createSide('inside-left', 'Inside Left', [
            { x1: finalTrim.w, y1: 0, x2: finalTrim.w, y2: finalTrim.h },
          ]),
          createSide('inside-right', 'Inside Right', [
            { x1: 0, y1: 0, x2: 0, y2: finalTrim.h },
            { x1: finalTrim.w, y1: 0, x2: finalTrim.w, y2: finalTrim.h },
          ]),
          createSide('back', 'Back Cover', [
            { x1: finalTrim.w, y1: 0, x2: finalTrim.w, y2: finalTrim.h },
          ]),
        ],
        dpi: DEFAULT_DPI,
      };
    } else {
      return {
        id: `gelato_${variantUid}_landscape_bifold`,
        name: `Card (${variantUid})`,
        folded: true,
        sideIds: ['front', 'inside-top', 'inside-bottom', 'back'],
        sides: [
          createSide('front', 'Front Cover', [
            { x1: 0, y1: finalTrim.h, x2: finalTrim.w, y2: finalTrim.h },
          ]),
          createSide('inside-top', 'Inside Top', [
            { x1: 0, y1: finalTrim.h, x2: finalTrim.w, y2: finalTrim.h },
          ]),
          createSide('inside-bottom', 'Inside Bottom', [
            { x1: 0, y1: 0, x2: finalTrim.w, y2: 0 },
            { x1: 0, y1: finalTrim.h, x2: finalTrim.w, y2: finalTrim.h },
          ]),
          createSide('back', 'Back Cover', [
            { x1: 0, y1: 0, x2: finalTrim.w, y2: 0 },
          ]),
        ],
        dpi: DEFAULT_DPI,
      };
    }
  } else if (productType === 'card' || productType === 'postcard') {
    // Flat card or postcard (front and back)
    return {
      id: `gelato_${variantUid}_${orientation}`,
      name: `${productType} (${variantUid})`,
      folded: false,
      sideIds: ['front', 'back'],
      sides: [
        createSide('front', 'Front'),
        createSide('back', 'Back'),
      ],
      dpi: DEFAULT_DPI,
    };
  } else {
    // Single-sided (invitation, announcement, print)
    return {
      id: `gelato_${variantUid}_${orientation}`,
      name: `${productType} (${variantUid})`,
      folded: false,
      sideIds: ['front'],
      sides: [
        createSide('front', 'Front'),
      ],
      dpi: DEFAULT_DPI,
    };
  }
}

