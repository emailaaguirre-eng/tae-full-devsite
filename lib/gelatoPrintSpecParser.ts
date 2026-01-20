/**
 * Gelato Print Spec Parser
 * Converts Gelato API response to PrintSpec format
 * 
 * NOTE: This is a POC parser. Actual field names may vary based on Gelato API response.
 */

import { PrintSpec, PrintSide } from './printSpecs';

// DPI constant (matches printSpecs.ts)
const DPI = 300;

/**
 * Converts millimeters to pixels at specified DPI
 */
function mmToPx(mm: number, dpi: number = DPI): number {
  // mm -> inches: divide by 25.4
  // inches -> pixels: multiply by DPI
  return (mm / 25.4) * dpi;
}

/**
 * Converts inches to pixels at specified DPI
 */
function inchesToPx(inches: number, dpi: number = DPI): number {
  return inches * dpi;
}

/**
 * Converts a value with unit to pixels
 */
function convertToPx(value: number, unit: string, dpi: number = DPI): number {
  const unitLower = unit.toLowerCase();
  
  if (unitLower === 'mm' || unitLower === 'millimeters' || unitLower === 'millimetres') {
    return mmToPx(value, dpi);
  } else if (unitLower === 'in' || unitLower === 'inch' || unitLower === 'inches') {
    return inchesToPx(value, dpi);
  } else if (unitLower === 'px' || unitLower === 'pixels' || unitLower === 'pixel') {
    return value; // Already pixels
  } else {
    // Default to mm if unit unknown
    console.warn(`[GelatoPrintSpecParser] Unknown unit "${unit}", assuming mm`);
    return mmToPx(value, dpi);
  }
}

/**
 * Extracts numeric value from various formats
 */
function extractNumericValue(value: any): number | null {
  if (typeof value === 'number') {
    return value;
  }
  
  if (typeof value === 'string') {
    // Try to parse number from string
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  
  if (value && typeof value === 'object') {
    // Check for common object formats: { value: 3, unit: 'mm' } or { width: 100, height: 200 }
    if ('value' in value && typeof value.value === 'number') {
      return value.value;
    }
    if ('width' in value && typeof value.width === 'number') {
      return value.width;
    }
  }
  
  return null;
}

/**
 * Extracts unit from various formats
 */
function extractUnit(value: any, defaultUnit: string = 'mm'): string {
  if (typeof value === 'object' && value !== null) {
    if ('unit' in value && typeof value.unit === 'string') {
      return value.unit;
    }
  }
  
  return defaultUnit;
}

/**
 * Parses dimensions from Gelato API response
 */
function parseDimensions(data: any): { width: number; height: number } | null {
  // Try various field names
  const dimensionFields = [
    'dimensions',
    'size',
    'format',
    'pageSize',
    'page_size',
    'formatSize',
    'format_size',
  ];

  for (const field of dimensionFields) {
    if (data[field]) {
      const dim = data[field];
      
      // Format: { width: 100, height: 200, unit: 'mm' }
      if (dim.width && dim.height) {
        const unit = extractUnit(dim, 'mm');
        return {
          width: convertToPx(extractNumericValue(dim.width) || 0, unit),
          height: convertToPx(extractNumericValue(dim.height) || 0, unit),
        };
      }
      
      // Format: { w: 100, h: 200, unit: 'mm' }
      if (dim.w && dim.h) {
        const unit = extractUnit(dim, 'mm');
        return {
          width: convertToPx(extractNumericValue(dim.w) || 0, unit),
          height: convertToPx(extractNumericValue(dim.h) || 0, unit),
        };
      }
      
      // Format: [100, 200] or "100x200"
      if (Array.isArray(dim) && dim.length >= 2) {
        const unit = extractUnit(data, 'mm');
        return {
          width: convertToPx(extractNumericValue(dim[0]) || 0, unit),
          height: convertToPx(extractNumericValue(dim[1]) || 0, unit),
        };
      }
      
      if (typeof dim === 'string') {
        // Try parsing "100x200" or "100mm x 200mm"
        const match = dim.match(/(\d+\.?\d*)\s*x\s*(\d+\.?\d*)/i);
        if (match) {
          const unit = dim.toLowerCase().includes('mm') ? 'mm' : 
                      dim.toLowerCase().includes('in') ? 'in' : 'mm';
          return {
            width: convertToPx(parseFloat(match[1]), unit),
            height: convertToPx(parseFloat(match[2]), unit),
          };
        }
      }
    }
  }
  
  return null;
}

/**
 * Parses bleed value from Gelato API response
 */
function parseBleed(data: any): number {
  const bleedFields = ['bleed', 'bleedRequirements', 'bleed_requirements', 'bleedSize', 'bleed_size'];
  
  for (const field of bleedFields) {
    if (data[field] !== undefined) {
      const value = extractNumericValue(data[field]);
      if (value !== null) {
        const unit = extractUnit(data[field], 'mm');
        return convertToPx(value, unit);
      }
    }
  }
  
  // Default bleed: 3mm (0.118 inches)
  return mmToPx(3);
}

/**
 * Parses trim value from Gelato API response
 */
function parseTrim(data: any): number {
  const trimFields = ['trim', 'trimSize', 'trim_size', 'trimmedSize', 'trimmed_size'];
  
  for (const field of trimFields) {
    if (data[field] !== undefined) {
      const value = extractNumericValue(data[field]);
      if (value !== null) {
        const unit = extractUnit(data[field], 'mm');
        return convertToPx(value, unit);
      }
    }
  }
  
  // Default trim: same as bleed
  return parseBleed(data);
}

/**
 * Parses safe zone value from Gelato API response
 */
function parseSafeZone(data: any): number {
  const safeFields = ['safeZone', 'safe_zone', 'safeArea', 'safe_area', 'contentArea', 'content_area'];
  
  for (const field of safeFields) {
    if (data[field] !== undefined) {
      const value = extractNumericValue(data[field]);
      if (value !== null) {
        const unit = extractUnit(data[field], 'mm');
        return convertToPx(value, unit);
      }
    }
  }
  
  // Default safe zone: 5mm (0.197 inches)
  return mmToPx(5);
}

/**
 * Parses fold lines from Gelato API response
 */
function parseFoldLines(data: any, canvasWidth: number, canvasHeight: number): Array<{ x1: number; y1: number; x2: number; y2: number }> {
  const foldFields = ['fold', 'foldLines', 'fold_lines', 'foldLine', 'fold_line', 'folding', 'folds'];
  
  for (const field of foldFields) {
    if (data[field]) {
      const fold = data[field];
      
      // Format: Array of fold lines
      if (Array.isArray(fold)) {
        return fold.map((line: any) => {
          // Format: { x1, y1, x2, y2 } or { start: {x, y}, end: {x, y} }
          if (line.x1 !== undefined && line.y1 !== undefined && line.x2 !== undefined && line.y2 !== undefined) {
            return {
              x1: convertToPx(extractNumericValue(line.x1) || 0, extractUnit(line, 'mm')),
              y1: convertToPx(extractNumericValue(line.y1) || 0, extractUnit(line, 'mm')),
              x2: convertToPx(extractNumericValue(line.x2) || 0, extractUnit(line, 'mm')),
              y2: convertToPx(extractNumericValue(line.y2) || 0, extractUnit(line, 'mm')),
            };
          }
          
          if (line.start && line.end) {
            return {
              x1: convertToPx(extractNumericValue(line.start.x) || 0, extractUnit(line.start, 'mm')),
              y1: convertToPx(extractNumericValue(line.start.y) || 0, extractUnit(line.start, 'mm')),
              x2: convertToPx(extractNumericValue(line.end.x) || 0, extractUnit(line.end, 'mm')),
              y2: convertToPx(extractNumericValue(line.end.y) || 0, extractUnit(line.end, 'mm')),
            };
          }
          
          return null;
        }).filter((line: any) => line !== null);
      }
      
      // Format: Single fold line object
      if (fold.x1 !== undefined || fold.start) {
        const line = Array.isArray(fold) ? fold[0] : fold;
        if (line.x1 !== undefined || line.start) {
          return [{
            x1: convertToPx(extractNumericValue(line.x1 || line.start?.x) || 0, extractUnit(line, 'mm')),
            y1: convertToPx(extractNumericValue(line.y1 || line.start?.y) || 0, extractUnit(line, 'mm')),
            x2: convertToPx(extractNumericValue(line.x2 || line.end?.x) || 0, extractUnit(line, 'mm')),
            y2: convertToPx(extractNumericValue(line.y2 || line.end?.y) || 0, extractUnit(line, 'mm')),
          }];
        }
      }
    }
  }
  
  // Default: no fold lines
  return [];
}

/**
 * Converts pixels to mm at specified DPI
 */
function pxToMm(px: number, dpi: number = DPI): number {
  return (px / dpi) * 25.4;
}

/**
 * Converts Gelato API response to PrintSpec format
 *
 * @param gelatoData Raw response from Gelato API
 * @param productUid Gelato product UID
 * @param variantUid Optional variant UID
 * @returns PrintSpec object or null if conversion fails
 */
export function gelatoDataToPrintSpec(
  gelatoData: any,
  productUid: string,
  variantUid?: string
): PrintSpec | null {
  try {
    // Extract dimensions
    const dimensions = parseDimensions(gelatoData);
    if (!dimensions) {
      console.warn('[GelatoPrintSpecParser] Could not parse dimensions from Gelato data');
      return null;
    }

    // Extract bleed, trim, safe zone (in pixels)
    const bleedPx = parseBleed(gelatoData);
    const safePx = parseSafeZone(gelatoData);

    // Convert to mm for required PrintSide fields
    const trimMm = { w: pxToMm(dimensions.width), h: pxToMm(dimensions.height) };
    const bleedMm = pxToMm(bleedPx);
    const safeMm = pxToMm(safePx);

    // Extract fold lines
    const foldLines = parseFoldLines(gelatoData, dimensions.width, dimensions.height);
    // Convert fold lines to mm
    const foldLinesMm = foldLines.length > 0 ? foldLines.map(line => ({
      x1: pxToMm(line.x1),
      y1: pxToMm(line.y1),
      x2: pxToMm(line.x2),
      y2: pxToMm(line.y2),
    })) : undefined;

    // Determine sides based on product type
    // For cards, typically: front, inside, back
    // For posters: just front
    const isCard = productUid.includes('card') || productUid.includes('invitation') || productUid.includes('announcement');

    const sides: PrintSide[] = [];
    const sideIds: Array<'front' | 'inside' | 'inside-left' | 'inside-right' | 'inside-top' | 'inside-bottom' | 'back'> = [];

    if (isCard) {
      // Bifold card: front, inside, back
      sides.push({
        id: 'front',
        name: 'Front',
        trimMm,
        bleedMm,
        safeMm,
        canvasPx: { w: dimensions.width, h: dimensions.height },
        bleedPx,
        safePx,
        foldLines: foldLinesMm,
      });
      sideIds.push('front');

      sides.push({
        id: 'inside',
        name: 'Inside',
        trimMm,
        bleedMm,
        safeMm,
        canvasPx: { w: dimensions.width, h: dimensions.height },
        bleedPx,
        safePx,
      });
      sideIds.push('inside');

      sides.push({
        id: 'back',
        name: 'Back',
        trimMm,
        bleedMm,
        safeMm,
        canvasPx: { w: dimensions.width, h: dimensions.height },
        bleedPx,
        safePx,
      });
      sideIds.push('back');
    } else {
      // Single-sided (poster, postcard)
      sides.push({
        id: 'front',
        name: 'Front',
        trimMm,
        bleedMm,
        safeMm,
        canvasPx: { w: dimensions.width, h: dimensions.height },
        bleedPx,
        safePx,
      });
      sideIds.push('front');
    }

    return {
      id: `gelato_${productUid}${variantUid ? `_${variantUid}` : ''}`,
      name: `Gelato ${productUid}${variantUid ? ` (${variantUid})` : ''}`,
      sides,
      sideIds,
    };
  } catch (error) {
    console.error('[GelatoPrintSpecParser] Error converting Gelato data to PrintSpec:', error);
    return null;
  }
}

