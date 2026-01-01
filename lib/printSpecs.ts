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
}

// DPI constant
const DPI = 300;

// Helper to convert inches to pixels
function inchesToPx(inches: number): number {
  return (inches / 25.4) * DPI;
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
          { x1: inchesToPx(5), y1: 0, x2: inchesToPx(5), y2: inchesToPx(7) }, // Vertical fold
        ],
      },
      {
        id: 'inside',
        canvasPx: { w: inchesToPx(5), h: inchesToPx(7) },
        bleedPx: inchesToPx(0.125),
        trimPx: inchesToPx(0.125),
        safePx: inchesToPx(0.25),
      },
      {
        id: 'back',
        canvasPx: { w: inchesToPx(5), h: inchesToPx(7) },
        bleedPx: inchesToPx(0.125),
        trimPx: inchesToPx(0.125),
        safePx: inchesToPx(0.25),
      },
    ],
  },
};

export function getPrintSpec(id: string): PrintSpec | undefined {
  return printSpecs[id];
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

// Map product slug/type to print spec ID
// This is a simple mapping - can be enhanced later with variationId support
export function getPrintSpecForProduct(
  productSlugOrId: string,
  variationId?: string
): PrintSpecResult {
  const mapping: Record<string, string> = {
    poster: 'poster_simple',
    print: 'poster_simple',
    card: 'greeting_card_bifold',
    invitation: 'greeting_card_bifold',
    announcement: 'greeting_card_bifold',
    postcard: 'poster_simple', // Postcards use simple poster spec
  };

  const specId = mapping[productSlugOrId];

  // For card products, require explicit mapping
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

