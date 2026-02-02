/**
 * Mock Product Provider
 * Provides hardcoded greeting card options for testing without external API
 */

import type {
  ProductProvider,
  ProductOption,
  ValidationResult,
  ProviderConfig,
} from './ProductProvider';
import type { SelectionState, PrintSpec, PrintSide, FoldLine } from '../types';

const DEFAULT_DPI = 300;
const DEFAULT_BLEED_MM = 3;
const DEFAULT_SAFE_MM = 5;
const SCREEN_DPI = 96;

/** Convert mm to pixels at specified DPI */
function mmToPx(mm: number, dpi: number = SCREEN_DPI): number {
  return (mm / 25.4) * dpi;
}

export class MockProvider implements ProductProvider {
  readonly type = 'mock' as const;
  readonly name = 'Mock Provider (Testing)';
  
  private config: ProviderConfig;
  
  constructor(config: ProviderConfig = {}) {
    this.config = {
      cacheEnabled: false,
      ...config,
    };
  }
  
  // ===========================================================================
  // PRODUCT OPTIONS
  // ===========================================================================
  
  async getProductTypes(): Promise<ProductOption[]> {
    return [
      {
        id: 'greeting-card',
        label: 'Greeting Card',
        value: 'greeting-card',
        metadata: { category: 'cards' },
      },
      {
        id: 'postcard',
        label: 'Postcard',
        value: 'postcard',
        metadata: { category: 'cards' },
      },
      {
        id: 'print',
        label: 'Art Print',
        value: 'print',
        metadata: { category: 'prints' },
      },
    ];
  }
  
  async getOrientations(productType: string): Promise<ProductOption[]> {
    return [
      { id: 'portrait', label: 'Portrait', value: 'portrait' },
      { id: 'landscape', label: 'Landscape', value: 'landscape' },
    ];
  }
  
  async getSizes(productType: string, orientation: string): Promise<ProductOption[]> {
    if (productType === 'greeting-card') {
      return [
        {
          id: '5x7',
          label: '5" × 7"',
          value: '5x7',
          metadata: { mm: { w: 127, h: 178 } },
        },
        {
          id: 'a5',
          label: 'A5 (148mm × 210mm)',
          value: 'a5',
          metadata: { mm: { w: 148, h: 210 } },
        },
        {
          id: '4x6',
          label: '4" × 6"',
          value: '4x6',
          metadata: { mm: { w: 102, h: 152 } },
        },
      ];
    }
    
    if (productType === 'postcard') {
      return [
        {
          id: '4x6',
          label: '4" × 6"',
          value: '4x6',
          metadata: { mm: { w: 102, h: 152 } },
        },
        {
          id: '5x7',
          label: '5" × 7"',
          value: '5x7',
          metadata: { mm: { w: 127, h: 178 } },
        },
      ];
    }
    
    if (productType === 'print') {
      return [
        {
          id: '8x10',
          label: '8" × 10"',
          value: '8x10',
          metadata: { mm: { w: 203, h: 254 } },
        },
        {
          id: '11x14',
          label: '11" × 14"',
          value: '11x14',
          metadata: { mm: { w: 279, h: 356 } },
        },
      ];
    }
    
    return [];
  }
  
  async getPaperTypes(productType: string): Promise<ProductOption[]> {
    return [
      {
        id: 'matte',
        label: 'Matte',
        value: 'matte',
        metadata: { finish: 'non-reflective' },
      },
      {
        id: 'glossy',
        label: 'Glossy',
        value: 'glossy',
        price: 0.50,
        metadata: { finish: 'shiny' },
      },
      {
        id: 'premium',
        label: 'Premium Matte',
        value: 'premium',
        price: 1.00,
        metadata: { finish: 'high-quality-matte', weight: 'heavy' },
      },
    ];
  }
  
  async getFoldFormats(productType: string): Promise<ProductOption[]> {
    if (productType === 'greeting-card' || productType === 'invitation') {
      return [
        {
          id: 'flat',
          label: 'Flat (Single Panel)',
          value: 'flat',
          metadata: { panels: 1 },
        },
        {
          id: 'bifold',
          label: 'Bifold (Folded Card)',
          value: 'bifold',
          price: 0.50,
          metadata: { panels: 4, foldCount: 1 },
        },
      ];
    }
    return [];
  }
  
  async getFoilOptions(productType: string): Promise<ProductOption[]> {
    if (productType === 'greeting-card' || productType === 'invitation') {
      return [
        {
          id: 'none',
          label: 'No Foil',
          value: 'none',
        },
        {
          id: 'gold',
          label: 'Gold Foil',
          value: 'gold',
          price: 2.00,
          metadata: { color: '#FFD700' },
        },
        {
          id: 'silver',
          label: 'Silver Foil',
          value: 'silver',
          price: 2.00,
          metadata: { color: '#C0C0C0' },
        },
        {
          id: 'rose-gold',
          label: 'Rose Gold Foil',
          value: 'rose-gold',
          price: 2.50,
          metadata: { color: '#B76E79' },
        },
      ];
    }
    return [];
  }
  
  async getEnvelopeOptions(productType: string): Promise<ProductOption[]> {
    if (productType === 'greeting-card' || productType === 'invitation') {
      return [
        {
          id: 'white',
          label: 'White Envelope',
          value: 'white',
          metadata: { color: '#FFFFFF' },
        },
        {
          id: 'kraft',
          label: 'Kraft Envelope',
          value: 'kraft',
          price: 0.25,
          metadata: { color: '#D2B48C' },
        },
        {
          id: 'black',
          label: 'Black Envelope',
          value: 'black',
          price: 0.50,
          metadata: { color: '#000000' },
        },
      ];
    }
    return [];
  }
  
  // ===========================================================================
  // PRINT SPEC GENERATION
  // ===========================================================================
  
  async generatePrintSpec(selection: SelectionState): Promise<PrintSpec> {
    // Get size dimensions from selection
    const sizes = await this.getSizes(selection.productType, selection.orientation);
    const sizeOption = sizes.find(s => s.value === selection.size);
    
    if (!sizeOption || !sizeOption.metadata?.mm) {
      throw new Error(`Size "${selection.size}" not found for ${selection.productType}`);
    }
    
    const sizeMm = sizeOption.metadata.mm as { w: number; h: number };
    
    // Adjust for orientation
    const trimMm = selection.orientation === 'landscape'
      ? { w: Math.max(sizeMm.w, sizeMm.h), h: Math.min(sizeMm.w, sizeMm.h) }
      : { w: Math.min(sizeMm.w, sizeMm.h), h: Math.max(sizeMm.w, sizeMm.h) };
    
    const isFolded = selection.foldFormat === 'bifold';
    const sides = this.generateSides(selection, trimMm, isFolded);
    
    return {
      id: `mock-${selection.productType}-${selection.size}-${selection.orientation}-${selection.foldFormat || 'flat'}`,
      productType: selection.productType,
      trimMm,
      bleedMm: DEFAULT_BLEED_MM,
      safeMm: DEFAULT_SAFE_MM,
      dpi: DEFAULT_DPI,
      sides,
      folded: isFolded,
      providerType: 'mock',
    };
  }
  
  private generateSides(
    selection: SelectionState,
    trimMm: { w: number; h: number },
    isFolded: boolean
  ): PrintSide[] {
    const sides: PrintSide[] = [];
    
    if (isFolded && (selection.productType === 'greeting-card' || selection.productType === 'invitation')) {
      // Bifold card: 4 sides (front, back, inside-left, inside-right)
      // When folded, the card is landscape orientation (even if trimMm is portrait)
      // Layout: [Inside Left | Inside Right]
      //         [     Front    |     Back    ]
      
      const isPortrait = selection.orientation === 'portrait';
      
      if (isPortrait) {
        // Portrait bifold: 2x1 grid (2 panels wide, 1 panel tall)
        const panelW = trimMm.w;
        const panelH = trimMm.h;
        
        // Front (bottom-left panel)
        sides.push(this.createSide('front', 'Front', panelW, panelH, []));
        
        // Back (bottom-right panel)
        sides.push(this.createSide('back', 'Back', panelW, panelH, []));
        
        // Inside Left (top-left panel)
        sides.push(this.createSide('inside-left', 'Inside Left', panelW, panelH, []));
        
        // Inside Right (top-right panel) 
        sides.push(this.createSide('inside-right', 'Inside Right', panelW, panelH, []));
        
        // Fold line: vertical center fold
        const centerFold: FoldLine = {
          x1: panelW,
          y1: 0,
          x2: panelW,
          y2: panelH,
          type: 'fold',
        };
        
        // Add fold lines to each side
        sides.forEach(side => {
          side.foldLines = [centerFold];
        });
      } else {
        // Landscape bifold: 1x2 grid (1 panel wide, 2 panels tall)
        const panelW = trimMm.w;
        const panelH = trimMm.h;
        
        // Front (top panel)
        sides.push(this.createSide('front', 'Front', panelW, panelH, []));
        
        // Back (top panel, flipped)
        sides.push(this.createSide('back', 'Back', panelW, panelH, []));
        
        // Inside Top (bottom-left when unfolded)
        sides.push(this.createSide('inside-top', 'Inside Top', panelW, panelH, []));
        
        // Inside Bottom (bottom-right when unfolded)
        sides.push(this.createSide('inside-bottom', 'Inside Bottom', panelW, panelH, []));
        
        // Fold line: horizontal center fold
        const centerFold: FoldLine = {
          x1: 0,
          y1: panelH,
          x2: panelW,
          y2: panelH,
          type: 'fold',
        };
        
        // Add fold lines to each side
        sides.forEach(side => {
          side.foldLines = [centerFold];
        });
      }
    } else {
      // Flat product: 2 sides (front, back) or 1 side (print)
      sides.push(this.createSide('front', 'Front', trimMm.w, trimMm.h, []));
      
      if (selection.productType !== 'print') {
        sides.push(this.createSide('back', 'Back', trimMm.w, trimMm.h, []));
      }
    }
    
    return sides;
  }
  
  private createSide(
    id: string,
    name: string,
    trimW: number,
    trimH: number,
    foldLines: FoldLine[]
  ): PrintSide {
    // Canvas size = trim + bleed on all sides, converted to screen pixels
    const bleedBoxW = trimW + (DEFAULT_BLEED_MM * 2);
    const bleedBoxH = trimH + (DEFAULT_BLEED_MM * 2);
    
    return {
      id,
      name,
      trimMm: { w: trimW, h: trimH },
      bleedMm: DEFAULT_BLEED_MM,
      safeMm: DEFAULT_SAFE_MM,
      canvasPx: {
        w: mmToPx(bleedBoxW, SCREEN_DPI),
        h: mmToPx(bleedBoxH, SCREEN_DPI),
      },
      foldLines,
    };
  }
  
  // ===========================================================================
  // PRICING
  // ===========================================================================
  
  async getPrice(selection: Partial<SelectionState>): Promise<number | null> {
    if (!selection.productType || !selection.size) {
      return null;
    }
    
    // Base prices
    let basePrice = 0;
    if (selection.productType === 'greeting-card') basePrice = 3.99;
    else if (selection.productType === 'postcard') basePrice = 2.49;
    else if (selection.productType === 'print') basePrice = 12.99;
    
    // Add-on costs
    let addOns = 0;
    
    if (selection.paperType === 'glossy') addOns += 0.50;
    if (selection.paperType === 'premium') addOns += 1.00;
    if (selection.foldFormat === 'bifold') addOns += 0.50;
    if (selection.foilOption && selection.foilOption !== 'none') addOns += 2.00;
    if (selection.envelopeOption === 'kraft') addOns += 0.25;
    if (selection.envelopeOption === 'black') addOns += 0.50;
    
    return basePrice + addOns;
  }
  
  // ===========================================================================
  // VALIDATION
  // ===========================================================================
  
  async validateSelection(selection: Partial<SelectionState>): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Required fields
    if (!selection.productType) {
      errors.push('Product type is required');
    }
    if (!selection.orientation) {
      errors.push('Orientation is required');
    }
    if (!selection.size) {
      errors.push('Size is required');
    }
    
    // Warnings
    if (selection.foilOption && selection.foilOption !== 'none' && !selection.paperType) {
      warnings.push('Foil works best on premium paper');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

