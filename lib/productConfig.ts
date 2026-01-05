/**
 * Product Configuration System
 * 
 * This file defines:
 * 1. Product types we sell (cards, prints, etc.)
 * 2. Available options with UI assets (images, labels, descriptions)
 * 3. Mapping to Gelato product UIDs
 * 
 * To add a new product:
 * 1. Add to PRODUCT_CATALOG
 * 2. Define options in PRODUCT_OPTIONS
 * 3. Add mapping function in buildGelatoProductUid()
 */

// ============================================================================
// Types
// ============================================================================

export interface ProductOption {
  id: string;
  name: string;
  description?: string;
  image?: string;        // URL to preview image
  swatch?: string;       // Color hex for color swatches
  priceModifier?: number; // Additional cost
  gelatoValue?: string;   // Gelato attribute value
}

export interface ProductOptionGroup {
  id: string;
  name: string;
  description?: string;
  required: boolean;
  options: ProductOption[];
}

export interface ProductConfig {
  slug: string;
  name: string;
  description: string;
  icon: string;
  gelatoCatalog: string;      // Gelato catalog UID (e.g., "cards")
  gelatoProductBase: string;  // Base product UID pattern
  optionGroups: ProductOptionGroup[];
  printSpecId?: string;       // Default PrintSpec ID
  examples: string[];
}

// ============================================================================
// Size Options - Based on actual Gelato catalog
// Gelato uses metric (A6, A5) and some US sizes (5x7)
// ============================================================================

const CARD_SIZES: ProductOption[] = [
  { 
    id: 'a6', 
    name: 'A6 (4.1" × 5.8")', 
    description: 'Compact greeting card',
    gelatoValue: 'a6',
    priceModifier: 0 
  },
  { 
    id: '5x7', 
    name: '5" × 7"', 
    description: 'Classic US greeting card',
    gelatoValue: '5x7',
    priceModifier: 2 
  },
  { 
    id: 'a5', 
    name: 'A5 (5.8" × 8.3")', 
    description: 'Large greeting card',
    gelatoValue: 'a5',
    priceModifier: 4 
  },
  { 
    id: 'square', 
    name: 'Square (5.5" × 5.5")', 
    description: 'Modern square format',
    gelatoValue: 'square-140',
    priceModifier: 3 
  },
];

const PRINT_SIZES: ProductOption[] = [
  { id: '5x7', name: '5" × 7"', gelatoValue: '5x7', priceModifier: 0 },
  { id: '8x10', name: '8" × 10"', gelatoValue: '8x10', priceModifier: 5 },
  { id: '11x14', name: '11" × 14"', gelatoValue: '11x14', priceModifier: 15 },
  { id: '16x20', name: '16" × 20"', gelatoValue: '16x20', priceModifier: 30 },
  { id: '18x24', name: '18" × 24"', gelatoValue: '18x24', priceModifier: 40 },
  { id: '24x36', name: '24" × 36"', gelatoValue: '24x36', priceModifier: 70 },
];

// ============================================================================
// Paper/Material Options - Based on actual Gelato catalog
// Gelato offers 350gsm papers for cards
// ============================================================================

const CARD_PAPERS: ProductOption[] = [
  {
    id: 'matte',
    name: 'Matte',
    description: '350gsm uncoated, elegant finish',
    gelatoValue: '350-gsm-uncoated',
    priceModifier: 0,
  },
  {
    id: 'silk',
    name: 'Silk (Semi-Gloss)',
    description: '350gsm coated silk, vibrant colors',
    gelatoValue: '350-gsm-coated-silk',
    priceModifier: 0,
  },
];

const PRINT_MATERIALS: ProductOption[] = [
  {
    id: 'matte',
    name: 'Matte Photo Paper',
    description: 'No glare, soft finish',
    gelatoValue: 'matte',
    priceModifier: 0,
  },
  {
    id: 'glossy',
    name: 'Glossy Photo Paper',
    description: 'Vibrant, shiny finish',
    gelatoValue: 'glossy',
    priceModifier: 0,
  },
  {
    id: 'lustre',
    name: 'Lustre',
    description: 'Professional photo finish',
    gelatoValue: 'lustre',
    priceModifier: 2,
  },
  {
    id: 'canvas',
    name: 'Canvas',
    description: 'Gallery-wrapped canvas',
    gelatoValue: 'canvas',
    priceModifier: 20,
  },
];

// ============================================================================
// Foil Options - Note: Foil availability varies by Gelato product
// Check Gelato catalog for actual foil support on specific products
// ============================================================================

const FOIL_OPTIONS: ProductOption[] = [
  {
    id: 'none',
    name: 'No Foil',
    description: 'Standard full-color printing',
    swatch: 'transparent',
    priceModifier: 0,
  },
  {
    id: 'gold',
    name: 'Gold Foil',
    description: 'Elegant gold accents',
    swatch: '#D4AF37',
    gelatoValue: 'gold',
    priceModifier: 8,
  },
  {
    id: 'silver',
    name: 'Silver Foil',
    description: 'Sleek silver highlights',
    swatch: '#C0C0C0',
    gelatoValue: 'silver',
    priceModifier: 8,
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold',
    description: 'Warm pink-gold shimmer',
    swatch: '#E8B4B8',
    gelatoValue: 'rose-gold',
    priceModifier: 8,
  },
  {
    id: 'copper',
    name: 'Copper',
    description: 'Rich copper metallic',
    swatch: '#B87333',
    gelatoValue: 'copper',
    priceModifier: 8,
  },
];

// ============================================================================
// Frame Options (for prints)
// ============================================================================

const FRAME_OPTIONS: ProductOption[] = [
  {
    id: 'none',
    name: 'No Frame',
    description: 'Print only',
    priceModifier: 0,
  },
  {
    id: 'black',
    name: 'Black Frame',
    description: 'Classic black wood frame',
    swatch: '#1a1a1a',
    gelatoValue: 'black',
    priceModifier: 25,
  },
  {
    id: 'white',
    name: 'White Frame',
    description: 'Clean white wood frame',
    swatch: '#ffffff',
    gelatoValue: 'white',
    priceModifier: 25,
  },
  {
    id: 'natural',
    name: 'Natural Wood',
    description: 'Light oak finish',
    swatch: '#DEB887',
    gelatoValue: 'natural',
    priceModifier: 30,
  },
  {
    id: 'walnut',
    name: 'Walnut',
    description: 'Rich dark wood',
    swatch: '#5D432C',
    gelatoValue: 'walnut',
    priceModifier: 35,
  },
];

// ============================================================================
// Orientation Options
// ============================================================================

const ORIENTATION_OPTIONS: ProductOption[] = [
  {
    id: 'horizontal',
    name: 'Landscape',
    description: 'Horizontal orientation',
    gelatoValue: 'hor',
    priceModifier: 0,
  },
  {
    id: 'vertical',
    name: 'Portrait',
    description: 'Vertical orientation',
    gelatoValue: 'ver',
    priceModifier: 0,
  },
];

// ============================================================================
// Product Catalog
// ============================================================================

export const PRODUCT_CATALOG: Record<string, ProductConfig> = {
  card: {
    slug: 'card',
    name: 'Greeting Cards',
    description: 'Folded greeting cards for any occasion',
    icon: '\uD83D\uDC8C', // 💌
    gelatoCatalog: 'cards',
    gelatoProductBase: 'cards',
    printSpecId: 'greeting_card_bifold',
    optionGroups: [
      {
        id: 'size',
        name: 'Size',
        required: true,
        options: CARD_SIZES,
      },
      {
        id: 'paper',
        name: 'Paper',
        required: true,
        options: CARD_PAPERS,
      },
      {
        id: 'foil',
        name: 'Foil Accent',
        description: 'Add a metallic foil accent to your design',
        required: true,
        options: FOIL_OPTIONS,
      },
      {
        id: 'orientation',
        name: 'Orientation',
        required: false, // Controlled in the Project Editor, not in product options
        options: ORIENTATION_OPTIONS,
      },
    ],
    examples: [
      'Birthday cards',
      'Thank you cards',
      'Holiday greetings',
      'Congratulations',
    ],
  },

  postcard: {
    slug: 'postcard',
    name: 'Postcards',
    description: 'Flat postcards with writable back',
    icon: '\uD83D\uDCEE', // 📮
    gelatoCatalog: 'cards',
    gelatoProductBase: 'postcards',
    printSpecId: 'postcard_flat',
    optionGroups: [
      {
        id: 'size',
        name: 'Size',
        required: true,
        options: CARD_SIZES.filter(s => ['a6', '5x7'].includes(s.id)),
      },
      {
        id: 'paper',
        name: 'Paper',
        required: true,
        options: CARD_PAPERS,
      },
      {
        id: 'orientation',
        name: 'Orientation',
        required: false, // Controlled in the Project Editor, not in product options
        options: ORIENTATION_OPTIONS,
      },
    ],
    examples: [
      'Travel postcards',
      'Vacation memories',
      'Quick notes',
    ],
  },

  invitation: {
    slug: 'invitation',
    name: 'Invitations',
    description: 'Beautiful invitations for special events',
    icon: '\uD83C\uDF89', // 🎉
    gelatoCatalog: 'cards',
    gelatoProductBase: 'cards', // Gelato uses same catalog for invitations
    printSpecId: 'greeting_card_bifold',
    optionGroups: [
      {
        id: 'size',
        name: 'Size',
        required: true,
        options: CARD_SIZES,
      },
      {
        id: 'paper',
        name: 'Paper',
        required: true,
        options: CARD_PAPERS,
      },
      {
        id: 'foil',
        name: 'Foil Accent',
        description: 'Add a metallic foil accent to your design',
        required: true,
        options: FOIL_OPTIONS,
      },
      {
        id: 'orientation',
        name: 'Orientation',
        required: false, // Controlled in the Project Editor, not in product options
        options: ORIENTATION_OPTIONS,
      },
    ],
    examples: [
      'Wedding invitations',
      'Birthday party',
      'Baby shower',
      'Graduation',
    ],
  },

  announcement: {
    slug: 'announcement',
    name: 'Announcements',
    description: 'Share your news beautifully',
    icon: '\uD83D\uDCE2', // 📢
    gelatoCatalog: 'cards',
    gelatoProductBase: 'cards', // Gelato uses same catalog
    printSpecId: 'greeting_card_bifold',
    optionGroups: [
      {
        id: 'size',
        name: 'Size',
        required: true,
        options: CARD_SIZES,
      },
      {
        id: 'paper',
        name: 'Paper',
        required: true,
        options: CARD_PAPERS,
      },
      {
        id: 'foil',
        name: 'Foil Accent',
        description: 'Add a metallic foil accent to your design',
        required: true,
        options: FOIL_OPTIONS,
      },
      {
        id: 'orientation',
        name: 'Orientation',
        required: false, // Controlled in the Project Editor, not in product options
        options: ORIENTATION_OPTIONS,
      },
    ],
    examples: [
      'Birth announcements',
      'Engagement',
      'Moving',
      'Graduation',
    ],
  },

  print: {
    slug: 'print',
    name: 'Wall Art',
    description: 'Premium prints for your walls',
    icon: '\uD83D\uDDBC\uFE0F', // 🖼️
    gelatoCatalog: 'posters',
    gelatoProductBase: 'posters',
    printSpecId: 'poster_simple',
    optionGroups: [
      {
        id: 'size',
        name: 'Size',
        required: true,
        options: PRINT_SIZES,
      },
      {
        id: 'material',
        name: 'Material',
        required: true,
        options: PRINT_MATERIALS,
      },
      {
        id: 'frame',
        name: 'Frame',
        description: 'Optional framing',
        required: false,
        options: FRAME_OPTIONS,
      },
      {
        id: 'orientation',
        name: 'Orientation',
        required: false, // Controlled in the Project Editor, not in product options
        options: ORIENTATION_OPTIONS,
      },
    ],
    examples: [
      'Family portraits',
      'Landscape photography',
      'Abstract art',
      'Pet portraits',
    ],
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get product config by slug
 */
export function getProductConfig(slug: string): ProductConfig | null {
  return PRODUCT_CATALOG[slug] || null;
}

/**
 * Get all product slugs
 */
export function getProductSlugs(): string[] {
  return Object.keys(PRODUCT_CATALOG);
}

/**
 * Calculate total price based on selections
 */
export function calculatePrice(
  basePrice: number,
  productSlug: string,
  selections: Record<string, string>
): number {
  const config = getProductConfig(productSlug);
  if (!config) return basePrice;

  let total = basePrice;

  for (const group of config.optionGroups) {
    const selectedId = selections[group.id];
    if (selectedId) {
      const option = group.options.find(o => o.id === selectedId);
      if (option?.priceModifier) {
        total += option.priceModifier;
      }
    }
  }

  return total;
}

/**
 * Build Gelato product UID from selections
 * 
 * Gelato product UIDs follow patterns like:
 * cards_pf_{format}_pt_{paper-type}_cl_{color}_{orientation}
 * 
 * Example: cards_pf_a5_pt_350-gsm-coated-silk_cl_4-4_ver
 * 
 * This function maps our UI selections to valid Gelato UIDs
 */
export function buildGelatoProductUid(
  productSlug: string,
  selections: Record<string, string>
): string | null {
  const config = getProductConfig(productSlug);
  if (!config) return null;

  // Helper to find option value
  const getOptionValue = (groupId: string): string | undefined => {
    const group = config.optionGroups.find(g => g.id === groupId);
    const option = group?.options.find(o => o.id === selections[groupId]);
    return option?.gelatoValue;
  };

  // Build UID based on product type
  switch (productSlug) {
    case 'card':
    case 'invitation':
    case 'announcement': {
      // Folded cards pattern: cards_pf_{size}_pt_{paper}_cl_4-4_{orientation}
      const size = getOptionValue('size') || 'a5';
      const paper = getOptionValue('paper') || '350-gsm-coated-silk';
      const orient = getOptionValue('orientation') || 'ver';
      const color = '4-4'; // Full color both sides (front+back of folded card)
      
      return `cards_pf_${size}_pt_${paper}_cl_${color}_${orient}`;
    }

    case 'postcard': {
      // Flat postcards pattern: same as cards but single-sided option
      const size = getOptionValue('size') || 'a6';
      const paper = getOptionValue('paper') || '350-gsm-coated-silk';
      const orient = getOptionValue('orientation') || 'hor';
      const color = '4-4'; // Full color both sides
      
      return `cards_pf_${size}_pt_${paper}_cl_${color}_${orient}`;
    }

    case 'print': {
      // Posters pattern: posters_pf_{size}_pt_{material}_cl_4-0_{orientation}
      const size = getOptionValue('size') || '8x10';
      const material = getOptionValue('material') || 'matte';
      const orient = getOptionValue('orientation') || 'ver';
      const color = '4-0'; // Full color front only
      
      const frame = getOptionValue('frame');
      
      // If framed, use framed_posters pattern
      if (frame && frame !== 'none') {
        return `framed_posters_pf_${size}_pt_${material}_fr_${frame}_cl_${color}_${orient}`;
      }
      
      return `posters_pf_${size}_pt_${material}_cl_${color}_${orient}`;
    }

    default:
      return null;
  }
}

/**
 * Validate that all required options are selected
 */
export function validateSelections(
  productSlug: string,
  selections: Record<string, string>
): { valid: boolean; missing: string[] } {
  const config = getProductConfig(productSlug);
  if (!config) return { valid: false, missing: ['Unknown product'] };

  const missing: string[] = [];

  for (const group of config.optionGroups) {
    if (group.required && !selections[group.id]) {
      missing.push(group.name);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Get default selections for a product
 */
export function getDefaultSelections(productSlug: string): Record<string, string> {
  const config = getProductConfig(productSlug);
  if (!config) return {};

  const defaults: Record<string, string> = {};

  for (const group of config.optionGroups) {
    if (group.options.length > 0) {
      // Select first option as default, or 'none' if available
      const noneOption = group.options.find(o => o.id === 'none');
      defaults[group.id] = noneOption ? 'none' : group.options[0].id;
    }
  }

  return defaults;
}

