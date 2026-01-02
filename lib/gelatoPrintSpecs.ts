/**
 * Gelato Print Specifications POC
 * Phase 1: Verification - Fetch and parse Gelato product print specs
 * 
 * IMPORTANT: This is a proof of concept to verify what Gelato API actually provides.
 * Do NOT assume bleed/trim/safe/fold data exists until verified in actual API responses.
 */

const GELATO_API_KEY = process.env.GELATO_API_KEY;
const GELATO_PRODUCT_API_URL = process.env.GELATO_PRODUCT_API_URL || 'https://product.gelatoapis.com/v3';

// DPI constant for conversion
const DPI = 300;

/**
 * Convert millimeters to pixels at specified DPI
 */
function mmToPx(mm: number): number {
  // 1 inch = 25.4 mm
  // pixels = (mm / 25.4) * DPI
  return (mm / 25.4) * DPI;
}

/**
 * Convert inches to pixels at specified DPI
 */
function inchesToPx(inches: number): number {
  return inches * DPI;
}

/**
 * Fetch raw product details from Gelato API
 * This is for verification - logs the full response structure
 */
export async function fetchGelatoProductRaw(productUid: string) {
  if (!GELATO_API_KEY) {
    throw new Error('GELATO_API_KEY not configured');
  }

  try {
    const response = await fetch(`${GELATO_PRODUCT_API_URL}/products/${productUid}`, {
      headers: {
        'X-API-KEY': GELATO_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Gelato API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[GelatoPrintSpecs] Error fetching product:', error);
    throw error;
  }
}

/**
 * Parse Gelato product response and extract print specifications
 * Attempts to find: dimensions, print area, bleed, trim, safe zones, fold info
 * 
 * NOTE: Field names are guesses based on common API patterns.
 * Actual field names will be determined from logged responses.
 */
export function parseGelatoPrintSpecs(rawResponse: any, productUid: string) {
  console.log('[GelatoPrintSpecs] Raw response structure:', JSON.stringify(rawResponse, null, 2));

  const spec: any = {
    productUid,
    source: 'gelato',
    raw: rawResponse, // Keep raw for inspection
  };

  // Try to extract dimensions (common field names)
  const dimensions = rawResponse.dimensions || 
                     rawResponse.size || 
                     rawResponse.measurements ||
                     rawResponse.width && rawResponse.height ? { width: rawResponse.width, height: rawResponse.height } : null;

  if (dimensions) {
    // Assume dimensions are in mm (Gelato typically uses mm)
    const widthMm = dimensions.width || dimensions.widthMm || dimensions.w;
    const heightMm = dimensions.height || dimensions.heightMm || dimensions.h;
    const unit = dimensions.unit || rawResponse.unit || 'mm';

    if (widthMm && heightMm) {
      // Convert to pixels
      const widthPx = unit === 'mm' ? mmToPx(widthMm) : unit === 'in' ? inchesToPx(widthMm) : widthMm;
      const heightPx = unit === 'mm' ? mmToPx(heightMm) : unit === 'in' ? inchesToPx(heightMm) : heightMm;

      spec.dimensions = {
        widthMm,
        heightMm,
        widthPx,
        heightPx,
        unit,
      };
    }
  }

  // Try to extract print area
  const printArea = rawResponse.printArea || 
                    rawResponse.print_area || 
                    rawResponse.printableArea ||
                    rawResponse.canvas;

  if (printArea) {
    spec.printArea = printArea;
  }

  // Try to extract bleed (typically 4mm or 0.125 inches)
  const bleed = rawResponse.bleed || 
                rawResponse.bleedRequirements || 
                rawResponse.bleedSize ||
                rawResponse.bleed_mm;

  if (bleed) {
    const bleedValue = typeof bleed === 'number' ? bleed : bleed.value || bleed.size;
    const bleedUnit = typeof bleed === 'object' ? (bleed.unit || 'mm') : 'mm';
    spec.bleed = {
      value: bleedValue,
      unit: bleedUnit,
      pixels: bleedUnit === 'mm' ? mmToPx(bleedValue) : bleedUnit === 'in' ? inchesToPx(bleedValue) : bleedValue,
    };
  }

  // Try to extract trim size
  const trim = rawResponse.trim || 
               rawResponse.trimSize || 
               rawResponse.finishedSize ||
               rawResponse.trim_size;

  if (trim) {
    spec.trim = trim;
  }

  // Try to extract safe zone
  const safeZone = rawResponse.safeZone || 
                   rawResponse.safe_area || 
                   rawResponse.safeArea ||
                   rawResponse.textSafeArea;

  if (safeZone) {
    const safeValue = typeof safeZone === 'number' ? safeZone : safeZone.value || safeZone.size;
    const safeUnit = typeof safeZone === 'object' ? (safeZone.unit || 'mm') : 'mm';
    spec.safeZone = {
      value: safeValue,
      unit: safeUnit,
      pixels: safeUnit === 'mm' ? mmToPx(safeValue) : safeUnit === 'in' ? inchesToPx(safeValue) : safeValue,
    };
  }

  // Try to extract fold information (for cards)
  const fold = rawResponse.fold || 
               rawResponse.foldLines || 
               rawResponse.fold_info ||
               rawResponse.folding;

  if (fold) {
    spec.fold = fold;
  }

  // Try to extract orientation
  const orientation = rawResponse.orientation || 
                      rawResponse.direction ||
                      rawResponse.layout;

  if (orientation) {
    spec.orientation = orientation;
  }

  return spec;
}

/**
 * Convert parsed Gelato spec to our PrintSpec format
 * This normalizes the data structure to match our existing PrintSpec interface
 */
export function gelatoSpecToPrintSpec(parsedSpec: any, sideId: 'front' | 'inside' | 'back' = 'front') {
  // Default values (will be overridden if Gelato provides them)
  const defaultBleedPx = mmToPx(4); // 4mm bleed (common standard)
  const defaultTrimPx = mmToPx(2); // 2mm trim
  const defaultSafePx = mmToPx(6); // 6mm safe zone

  const widthPx = parsedSpec.dimensions?.widthPx || 1500; // Fallback
  const heightPx = parsedSpec.dimensions?.heightPx || 2100; // Fallback
  const bleedPx = parsedSpec.bleed?.pixels || defaultBleedPx;
  const trimPx = parsedSpec.trim ? (typeof parsedSpec.trim === 'number' ? mmToPx(parsedSpec.trim) : defaultTrimPx) : defaultTrimPx;
  const safePx = parsedSpec.safeZone?.pixels || defaultSafePx;

  // Parse fold lines if available
  let foldLines: Array<{ x1: number; y1: number; x2: number; y2: number }> | undefined;
  if (parsedSpec.fold) {
    // Fold format will depend on Gelato's structure
    // Common formats: { x: number, y: number, type: 'vertical'|'horizontal' }
    // or: [{ x1, y1, x2, y2 }]
    if (Array.isArray(parsedSpec.fold)) {
      foldLines = parsedSpec.fold.map((f: any) => ({
        x1: f.x1 || f.x || 0,
        y1: f.y1 || f.y || 0,
        x2: f.x2 || f.x || widthPx,
        y2: f.y2 || f.y || heightPx,
      }));
    } else if (parsedSpec.fold.type === 'vertical') {
      const x = parsedSpec.fold.x || widthPx / 2;
      foldLines = [{ x1: x, y1: 0, x2: x, y2: heightPx }];
    } else if (parsedSpec.fold.type === 'horizontal') {
      const y = parsedSpec.fold.y || heightPx / 2;
      foldLines = [{ x1: 0, y1: y, x2: widthPx, y2: y }];
    }
  }

  return {
    id: `gelato_${parsedSpec.productUid}_${sideId}`,
    name: `Gelato ${parsedSpec.productUid} (${sideId})`,
    sides: [{
      id: sideId,
      canvasPx: { w: widthPx, h: heightPx },
      bleedPx,
      trimPx,
      safePx,
      foldLines,
    }],
    source: 'gelato',
    raw: parsedSpec.raw, // Keep for debugging
  };
}

/**
 * Main POC function: Fetch and parse Gelato print specs for a product
 * Logs everything for verification
 */
export async function verifyGelatoPrintSpecs(productUid: string) {
  console.log('[GelatoPrintSpecs] Starting verification for product:', productUid);

  try {
    // Step 1: Fetch raw response
    const rawResponse = await fetchGelatoProductRaw(productUid);
    console.log('[GelatoPrintSpecs] Raw API response received');

    // Step 2: Parse and extract fields
    const parsedSpec = parseGelatoPrintSpecs(rawResponse, productUid);
    console.log('[GelatoPrintSpecs] Parsed spec:', JSON.stringify(parsedSpec, null, 2));

    // Step 3: Convert to normalized format
    const normalizedSpec = gelatoSpecToPrintSpec(parsedSpec, 'front');
    console.log('[GelatoPrintSpecs] Normalized PrintSpec:', JSON.stringify(normalizedSpec, null, 2));

    // Step 4: Output summary
    const summary = {
      productUid,
      hasDimensions: !!parsedSpec.dimensions,
      hasBleed: !!parsedSpec.bleed,
      hasTrim: !!parsedSpec.trim,
      hasSafeZone: !!parsedSpec.safeZone,
      hasFold: !!parsedSpec.fold,
      dimensions: parsedSpec.dimensions,
      bleed: parsedSpec.bleed,
      safeZone: parsedSpec.safeZone,
      fold: parsedSpec.fold,
    };

    console.log('[GelatoPrintSpecs] Verification Summary:', JSON.stringify(summary, null, 2));

    return {
      success: true,
      rawResponse,
      parsedSpec,
      normalizedSpec,
      summary,
    };
  } catch (error: any) {
    console.error('[GelatoPrintSpecs] Verification failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

