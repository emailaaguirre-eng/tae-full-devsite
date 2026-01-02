// Print Specs Library
// Defines print specifications for different product types

export interface PrintSide {
  id: 'front' | 'inside' | 'back';
  canvasPx: { w: number; h: number };
  bleedPx: number;
  trimPx: number;
  safePx: number;
  foldLines?: Array<{ x1: number; y1: number; x2: number; y2: number }>;
}

export interface PrintSpec {
  id: string;
  name: string;
  sides: PrintSide[];
  folded?: boolean; // true if product has fold lines (e.g., bifold cards)
  sideIds: Array<'front' | 'inside' | 'back'>; // Explicit list of available sides
}

// DPI constant
const DPI = 300;

// Helper to convert inches to pixels at 300 DPI
function inchesToPx(inches: number): number {
  return Math.round(inches * DPI);
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

/**
 * Generate a dynamic print spec based on product type and size
 * This allows print specs to adapt to user's size selection
 */
export function generatePrintSpecForSize(
  productType: 'card' | 'postcard' | 'invitation' | 'announcement' | 'print',
  sizeId: string,
  orientation: 'portrait' | 'landscape' = 'portrait'
): PrintSpec {
  const dims = SIZE_DIMENSIONS[sizeId] || { w: 5, h: 7 }; // Default to 5x7
  
  // Apply orientation
  const w = orientation === 'landscape' ? Math.max(dims.w, dims.h) : Math.min(dims.w, dims.h);
  const h = orientation === 'landscape' ? Math.min(dims.w, dims.h) : Math.max(dims.w, dims.h);
  
  const canvasW = inchesToPx(w);
  const canvasH = inchesToPx(h);
  const bleed = inchesToPx(0.125);
  const trim = inchesToPx(0.125);
  const safe = inchesToPx(0.25);

  // Card types (bifold with front, inside, back)
  if (productType === 'card') {
    return {
      id: `card_${sizeId}_${orientation}`,
      name: `Card ${sizeId.toUpperCase()} (${orientation})`,
      folded: true,
      sideIds: ['front', 'inside', 'back'],
      sides: [
        {
          id: 'front',
          canvasPx: { w: canvasW, h: canvasH },
          bleedPx: bleed,
          trimPx: trim,
          safePx: safe,
          foldLines: [{ x1: canvasW, y1: 0, x2: canvasW, y2: canvasH }],
        },
        {
          id: 'inside',
          canvasPx: { w: canvasW, h: canvasH },
          bleedPx: bleed,
          trimPx: trim,
          safePx: safe,
          foldLines: [
            { x1: 0, y1: 0, x2: 0, y2: canvasH },
            { x1: canvasW, y1: 0, x2: canvasW, y2: canvasH },
          ],
        },
        {
          id: 'back',
          canvasPx: { w: canvasW, h: canvasH },
          bleedPx: bleed,
          trimPx: trim,
          safePx: safe,
          foldLines: [{ x1: 0, y1: 0, x2: 0, y2: canvasH }],
        },
      ],
    };
  }

  // Postcard (front and back, no fold)
  if (productType === 'postcard') {
    return {
      id: `postcard_${sizeId}_${orientation}`,
      name: `Postcard ${sizeId.toUpperCase()} (${orientation})`,
      folded: false,
      sideIds: ['front', 'back'],
      sides: [
        {
          id: 'front',
          canvasPx: { w: canvasW, h: canvasH },
          bleedPx: bleed,
          trimPx: trim,
          safePx: safe,
        },
        {
          id: 'back',
          canvasPx: { w: canvasW, h: canvasH },
          bleedPx: bleed,
          trimPx: trim,
          safePx: safe,
        },
      ],
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
        {
          id: 'front',
          canvasPx: { w: canvasW, h: canvasH },
          bleedPx: bleed,
          trimPx: trim,
          safePx: safe,
        },
      ],
    };
  }

  // Prints (single-sided)
  return {
    id: `print_${sizeId}_${orientation}`,
    name: `Print ${sizeId.toUpperCase()} (${orientation})`,
    folded: false,
    sideIds: ['front'],
    sides: [
      {
        id: 'front',
        canvasPx: { w: canvasW, h: canvasH },
        bleedPx: bleed,
        trimPx: trim,
        safePx: safe,
      },
    ],
  };
}

export function getPrintSide(spec: PrintSpec, sideId: 'front' | 'inside' | 'back'): PrintSide | undefined {
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

