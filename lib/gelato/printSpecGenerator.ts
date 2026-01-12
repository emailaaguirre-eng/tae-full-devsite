/**
 * Dynamic PrintSpec Generator
 * 
 * Converts Gelato product dimensions into complete print specifications
 * with bleed, safe zones, fold lines, and export settings.
 * 
 * This ensures the editor canvas matches exactly what Gelato will print.
 */

import { GelatoProduct } from '@prisma/client';

// ============================================================================
// Types
// ============================================================================

export interface PrintSide {
  id: 'front' | 'back' | 'inside' | 'inside-left' | 'inside-right';
  name: string;
  
  // Dimensions in mm
  trimMm: { w: number; h: number };  // Final cut size
  bleedMm: number;                    // Bleed extension (typically 3-4mm)
  safeMm: number;                     // Safe zone inset (typically 4-5mm)
  
  // Fold lines in mm from left edge (for trim area, not bleed)
  foldLines?: Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    label?: string;
  }>;
}

export interface PrintSpec {
  id: string;
  name: string;
  
  // Source product
  gelatoProductUid: string;
  gelatoCatalogUid?: string;
  
  // Print settings
  dpi: number;
  
  // All sides of the product
  sides: PrintSide[];
  sideIds: Array<PrintSide['id']>;
  
  // Product characteristics
  folded: boolean;
  doubleSided: boolean;
  
  // Dimensions summary (trim size of front)
  trimWidthMm: number;
  trimHeightMm: number;
  
  // Full export dimensions (with bleed)
  exportWidthMm: number;
  exportHeightMm: number;
  exportWidthPx: number;
  exportHeightPx: number;
}

// ============================================================================
// Constants
// ============================================================================

// Industry standard print settings
const DEFAULT_DPI = 300;
const DEFAULT_BLEED_MM = 4;  // 4mm bleed is common for cards
const DEFAULT_SAFE_MM = 4;   // 4mm safe zone

// Paper format dimensions (trim sizes in mm)
// These are the FINAL CUT sizes, not including bleed
const PAPER_FORMAT_DIMENSIONS: Record<string, { w: number; h: number }> = {
  // US sizes
  '5R': { w: 127, h: 178 },      // 5" x 7"
  'SM': { w: 108, h: 140 },      // 4.25" x 5.5"
  'SX': { w: 133, h: 133 },      // 5.25" x 5.25" square
  'LG': { w: 140, h: 216 },      // 5.5" x 8.5"
  'LGL': { w: 216, h: 140 },     // LG Long (landscape)
  
  // Metric sizes
  'A6': { w: 105, h: 148 },      // 10.5 x 14.8 cm
  'A5': { w: 148, h: 210 },      // 14.8 x 21 cm
  'A5L': { w: 210, h: 148 },     // A5 Long (landscape)
  'DL': { w: 99, h: 210 },       // DL (9.9 x 21 cm)
  'SQ148X148': { w: 148, h: 148 }, // 14.8 x 14.8 cm square
  
  // Poster sizes (inches to mm)
  '8X10': { w: 203, h: 254 },
  '11X14': { w: 279, h: 356 },
  '12X12': { w: 305, h: 305 },
  '16X20': { w: 406, h: 508 },
  '18X24': { w: 457, h: 610 },
  '24X36': { w: 610, h: 914 },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert mm to pixels at specified DPI
 */
export function mmToPx(mm: number, dpi: number = DEFAULT_DPI): number {
  return Math.round((mm / 25.4) * dpi);
}

/**
 * Convert pixels to mm at specified DPI
 */
export function pxToMm(px: number, dpi: number = DEFAULT_DPI): number {
  return (px / dpi) * 25.4;
}

/**
 * Get dimensions for a paper format
 */
function getFormatDimensions(format: string): { w: number; h: number } | null {
  const normalized = format.toUpperCase().replace(/-/g, '');
  return PAPER_FORMAT_DIMENSIONS[normalized] || null;
}

/**
 * Determine if product is folded based on catalog or folding type
 */
function isFoldedProduct(product: GelatoProduct, catalogUid?: string): boolean {
  // Check folding type attribute
  if (product.foldingType && product.foldingType !== 'none') {
    return true;
  }
  
  // Check catalog name
  if (catalogUid) {
    const foldedCatalogs = ['folded-cards', 'pack-of-cards-folded', 'pack-of-cards-folded-envelopes'];
    if (foldedCatalogs.some(c => catalogUid.includes(c))) {
      return true;
    }
  }
  
  return false;
}

/**
 * Determine if product is double-sided
 */
function isDoubleSided(product: GelatoProduct): boolean {
  // 4-4 means printed both sides
  // 4-0 means front only
  return product.colorType === '4-4';
}

/**
 * Get fold direction from folding type
 */
function getFoldDirection(foldingType: string | null): 'horizontal' | 'vertical' | null {
  if (!foldingType) return null;
  
  const ft = foldingType.toLowerCase();
  if (ft.includes('hor')) return 'horizontal';
  if (ft.includes('ver')) return 'vertical';
  
  return null;
}

// ============================================================================
// PrintSpec Generator
// ============================================================================

/**
 * Generate a complete PrintSpec from a Gelato product
 */
export function generatePrintSpec(
  product: GelatoProduct,
  catalogUid?: string,
  options?: {
    bleedMm?: number;
    safeMm?: number;
    dpi?: number;
  }
): PrintSpec {
  const bleedMm = options?.bleedMm ?? DEFAULT_BLEED_MM;
  const safeMm = options?.safeMm ?? DEFAULT_SAFE_MM;
  const dpi = options?.dpi ?? DEFAULT_DPI;
  
  // Get base dimensions
  let trimW: number;
  let trimH: number;
  
  // Try to get from product dimensions first
  if (product.widthMm && product.heightMm) {
    trimW = product.widthMm;
    trimH = product.heightMm;
  } else if (product.paperFormat) {
    // Fall back to paper format lookup
    const dims = getFormatDimensions(product.paperFormat);
    if (dims) {
      trimW = dims.w;
      trimH = dims.h;
    } else {
      // Default to 5x7
      console.warn(`[PrintSpec] Unknown format ${product.paperFormat}, defaulting to 5x7`);
      trimW = 127;
      trimH = 178;
    }
  } else {
    // Default
    trimW = 127;
    trimH = 178;
  }
  
  // Handle orientation
  const isLandscape = product.orientation === 'hor';
  if (isLandscape && trimW < trimH) {
    // Swap for landscape
    [trimW, trimH] = [trimH, trimW];
  } else if (!isLandscape && trimW > trimH) {
    // Swap for portrait
    [trimW, trimH] = [trimH, trimW];
  }
  
  // Determine product characteristics
  const folded = isFoldedProduct(product, catalogUid);
  const doubleSided = isDoubleSided(product);
  const foldDirection = getFoldDirection(product.foldingType);
  
  // Build sides array
  const sides: PrintSide[] = [];
  const sideIds: Array<PrintSide['id']> = [];
  
  if (folded) {
    // Folded card - has front (cover), inside, and back
    // For a bifold, the unfolded sheet is 2x the trim size in one direction
    
    if (foldDirection === 'horizontal') {
      // Horizontal fold: fold along the width, card opens up/down
      // Unfolded width = trimW, Unfolded height = trimH * 2
      
      // Front (outside when folded - what you see first)
      sides.push({
        id: 'front',
        name: 'Front Cover',
        trimMm: { w: trimW, h: trimH },
        bleedMm,
        safeMm,
      });
      sideIds.push('front');
      
      // Inside (both panels visible when opened)
      const insideHeight = trimH * 2;
      sides.push({
        id: 'inside',
        name: 'Inside',
        trimMm: { w: trimW, h: insideHeight },
        bleedMm,
        safeMm,
        foldLines: [{
          x1: 0,
          y1: trimH,
          x2: trimW,
          y2: trimH,
          label: 'Fold Line',
        }],
      });
      sideIds.push('inside');
      
      // Back (if double-sided)
      if (doubleSided) {
        sides.push({
          id: 'back',
          name: 'Back Cover',
          trimMm: { w: trimW, h: trimH },
          bleedMm,
          safeMm,
        });
        sideIds.push('back');
      }
    } else {
      // Vertical fold (default): fold along the height, card opens left/right
      // Unfolded width = trimW * 2, Unfolded height = trimH
      
      // Front (right panel of outside when closed)
      sides.push({
        id: 'front',
        name: 'Front Cover',
        trimMm: { w: trimW, h: trimH },
        bleedMm,
        safeMm,
      });
      sideIds.push('front');
      
      // Inside (both panels - inside-left and inside-right)
      const insideWidth = trimW * 2;
      sides.push({
        id: 'inside',
        name: 'Inside',
        trimMm: { w: insideWidth, h: trimH },
        bleedMm,
        safeMm,
        foldLines: [{
          x1: trimW,
          y1: 0,
          x2: trimW,
          y2: trimH,
          label: 'Fold Line',
        }],
      });
      sideIds.push('inside');
      
      // Back (left panel of outside when closed)
      if (doubleSided) {
        sides.push({
          id: 'back',
          name: 'Back Cover',
          trimMm: { w: trimW, h: trimH },
          bleedMm,
          safeMm,
        });
        sideIds.push('back');
      }
    }
  } else {
    // Flat product (postcard, poster, etc.)
    
    // Front
    sides.push({
      id: 'front',
      name: 'Front',
      trimMm: { w: trimW, h: trimH },
      bleedMm,
      safeMm,
    });
    sideIds.push('front');
    
    // Back (if double-sided)
    if (doubleSided) {
      sides.push({
        id: 'back',
        name: 'Back',
        trimMm: { w: trimW, h: trimH },
        bleedMm,
        safeMm,
      });
      sideIds.push('back');
    }
  }
  
  // Calculate export dimensions (front side with bleed)
  const frontSide = sides[0];
  const exportWidthMm = frontSide.trimMm.w + (bleedMm * 2);
  const exportHeightMm = frontSide.trimMm.h + (bleedMm * 2);
  
  return {
    id: `gelato_${product.productUid}`,
    name: buildProductName(product),
    gelatoProductUid: product.productUid,
    gelatoCatalogUid: catalogUid,
    dpi,
    sides,
    sideIds,
    folded,
    doubleSided,
    trimWidthMm: trimW,
    trimHeightMm: trimH,
    exportWidthMm,
    exportHeightMm,
    exportWidthPx: mmToPx(exportWidthMm, dpi),
    exportHeightPx: mmToPx(exportHeightMm, dpi),
  };
}

/**
 * Build a human-readable product name
 */
function buildProductName(product: GelatoProduct): string {
  const parts: string[] = [];
  
  // Format/Size
  if (product.paperFormat) {
    const format = product.paperFormat.toUpperCase();
    // Convert common formats to readable names
    const formatNames: Record<string, string> = {
      '5R': '5" × 7"',
      'A5': 'A5',
      'A6': 'A6',
      'SM': '4.25" × 5.5"',
      'SX': '5.25" Square',
      'DL': 'DL',
    };
    parts.push(formatNames[format] || format);
  }
  
  // Orientation
  if (product.orientation === 'hor') {
    parts.push('Landscape');
  } else if (product.orientation === 'ver') {
    parts.push('Portrait');
  }
  
  // Folding
  if (product.foldingType && product.foldingType !== 'none') {
    parts.push('Folded');
  }
  
  return parts.join(' ') || 'Product';
}

/**
 * Get export dimensions for a specific side
 */
export function getSideExportDimensions(
  side: PrintSide,
  dpi: number = DEFAULT_DPI
): {
  widthMm: number;
  heightMm: number;
  widthPx: number;
  heightPx: number;
} {
  const widthMm = side.trimMm.w + (side.bleedMm * 2);
  const heightMm = side.trimMm.h + (side.bleedMm * 2);
  
  return {
    widthMm,
    heightMm,
    widthPx: mmToPx(widthMm, dpi),
    heightPx: mmToPx(heightMm, dpi),
  };
}

/**
 * Get canvas display dimensions (for editor, scaled for screen)
 */
export function getCanvasDisplayDimensions(
  side: PrintSide,
  maxWidth: number = 800,
  maxHeight: number = 600
): {
  width: number;
  height: number;
  scale: number;
} {
  const exportDims = getSideExportDimensions(side);
  
  // Calculate scale to fit within max dimensions
  const scaleX = maxWidth / exportDims.widthPx;
  const scaleY = maxHeight / exportDims.heightPx;
  const scale = Math.min(scaleX, scaleY, 1); // Don't scale up
  
  return {
    width: Math.round(exportDims.widthPx * scale),
    height: Math.round(exportDims.heightPx * scale),
    scale,
  };
}

/**
 * Convert editor coordinates to print coordinates
 * (accounts for scale and bleed offset)
 */
export function editorToPrintCoords(
  x: number,
  y: number,
  side: PrintSide,
  editorScale: number,
  dpi: number = DEFAULT_DPI
): { x: number; y: number } {
  // Convert from scaled editor coords to actual pixel coords
  const actualX = x / editorScale;
  const actualY = y / editorScale;
  
  // These are already in the full export space (with bleed)
  return { x: actualX, y: actualY };
}

/**
 * Get guide positions for editor overlay
 * Returns positions in mm from top-left of canvas (including bleed)
 */
export function getGuidePositions(side: PrintSide): {
  bleed: { x: number; y: number; w: number; h: number };
  trim: { x: number; y: number; w: number; h: number };
  safe: { x: number; y: number; w: number; h: number };
  foldLines: Array<{ x1: number; y1: number; x2: number; y2: number }>;
} {
  const { bleedMm, safeMm, trimMm, foldLines } = side;
  
  // Bleed box is the full canvas
  const bleed = {
    x: 0,
    y: 0,
    w: trimMm.w + (bleedMm * 2),
    h: trimMm.h + (bleedMm * 2),
  };
  
  // Trim box is inset by bleed
  const trim = {
    x: bleedMm,
    y: bleedMm,
    w: trimMm.w,
    h: trimMm.h,
  };
  
  // Safe box is inset from trim by safe zone
  const safe = {
    x: bleedMm + safeMm,
    y: bleedMm + safeMm,
    w: trimMm.w - (safeMm * 2),
    h: trimMm.h - (safeMm * 2),
  };
  
  // Convert fold lines to canvas coordinates (offset by bleed)
  const adjustedFoldLines = (foldLines || []).map(line => ({
    x1: line.x1 + bleedMm,
    y1: line.y1 + bleedMm,
    x2: line.x2 + bleedMm,
    y2: line.y2 + bleedMm,
  }));
  
  return { bleed, trim, safe, foldLines: adjustedFoldLines };
}
