# Physical Product Designer Refactor Plan

## Current State

**Main Component:** `components/ProjectEditor/ProjectEditor.tsx`  
**Route:** `/project-editor-demo` → wraps ProjectEditor component  
**Related Components:**
- `components/ProjectEditor/types.ts` - Current editor types
- `components/ProjectEditor/SizePicker.tsx` - Size selection UI
- `lib/printSpecs.ts` - Print specification utilities

**Current Issues:**
1. ❌ **413 Error on Save**: Drafts include base64 image data (too large)
2. ❌ **Hardcoded Options**: Product options are hardcoded (sizes, papers, etc.)
3. ❌ **No Provider Pattern**: Directly couples to Gelato API structure
4. ❌ **No Draft Persistence**: Save/Continue doesn't navigate to draft route
5. ❌ **Base64 in State**: Images stored as data URLs instead of asset references

## Target Architecture

### 1. Internal Type System (Provider-Agnostic)

```typescript
// lib/designer/types.ts

/** Product selection state - what the user has chosen */
export interface SelectionState {
  productType: 'greeting-card' | 'postcard' | 'print' | 'poster';
  orientation: 'portrait' | 'landscape';
  size: string; // e.g., "5x7", "A5"
  paperType?: string; // e.g., "matte", "glossy"
  foldFormat?: 'flat' | 'bifold' | 'trifold'; // for cards
  foilOption?: string; // e.g., "gold", "silver"
  envelopeOption?: string; // e.g., "white", "kraft"
}

/** Print specifications (mm-based, DPI, bleed, safe zones) */
export interface PrintSpec {
  id: string;
  trimMm: { w: number; h: number };
  bleedMm: number;
  safeMm: number;
  dpi: number;
  sides: PrintSide[];
  folded: boolean;
}

export interface PrintSide {
  id: string;
  name: string;
  trimMm: { w: number; h: number };
  bleedMm: number;
  safeMm: number;
  canvasPx: { w: number; h: number };
  foldLines?: Array<{ x1: number; y1: number; x2: number; y2: number }>;
}

/** Canvas design state - what's on the canvas */
export interface DesignState {
  sides: Record<string, SideDesign>;
}

export interface SideDesign {
  objects: DesignObject[];
}

export interface DesignObject {
  id: string;
  type: 'image' | 'text' | 'label' | 'qr';
  // Asset reference (NOT base64)
  assetId?: string; // Reference to uploaded asset
  assetUrl?: string; // Persisted URL (from /api/assets or CDN)
  // Transform data
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  // Text properties
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  fill?: string;
}

/** Draft data structure for persistence (NO base64!) */
export interface PhysicalDesignDraft {
  id: string;
  productType: string;
  selection: SelectionState;
  printSpecId: string;
  design: DesignState;
  // Metadata
  createdAt: number;
  updatedAt: number;
  // Provider data (for re-hydration)
  providerType: 'mock' | 'gelato';
  providerVariantId?: string;
  providerProductId?: string;
}
```

### 2. Product Provider Interface

```typescript
// lib/designer/providers/ProductProvider.ts

export interface ProductOption {
  id: string;
  label: string;
  value: string;
  price?: number;
  metadata?: Record<string, any>;
}

export interface ProductProvider {
  /** Provider identifier */
  type: 'mock' | 'gelato';
  
  /** Get available product types */
  getProductTypes(): Promise<ProductOption[]>;
  
  /** Get orientations for a product type */
  getOrientations(productType: string): Promise<ProductOption[]>;
  
  /** Get sizes for a product type + orientation */
  getSizes(productType: string, orientation: string): Promise<ProductOption[]>;
  
  /** Get paper types */
  getPaperTypes(productType: string): Promise<ProductOption[]>;
  
  /** Get fold formats (for cards) */
  getFoldFormats(productType: string): Promise<ProductOption[]>;
  
  /** Get foil options */
  getFoilOptions(productType: string): Promise<ProductOption[]>;
  
  /** Get envelope options */
  getEnvelopeOptions(productType: string): Promise<ProductOption[]>;
  
  /** Generate print spec from selection */
  generatePrintSpec(selection: SelectionState): Promise<PrintSpec>;
  
  /** Get price for selection */
  getPrice(selection: Partial<SelectionState>): Promise<number | null>;
}
```

### 3. Mock Provider Implementation

```typescript
// lib/designer/providers/MockProvider.ts

export class MockProvider implements ProductProvider {
  type = 'mock' as const;
  
  async getProductTypes() {
    return [
      { id: 'greeting-card', label: 'Greeting Card', value: 'greeting-card' },
      { id: 'postcard', label: 'Postcard', value: 'postcard' },
    ];
  }
  
  async getOrientations(productType: string) {
    return [
      { id: 'portrait', label: 'Portrait', value: 'portrait' },
      { id: 'landscape', label: 'Landscape', value: 'landscape' },
    ];
  }
  
  async getSizes(productType: string, orientation: string) {
    if (productType === 'greeting-card') {
      return [
        { id: '5x7', label: '5" × 7"', value: '5x7', metadata: { mm: { w: 127, h: 178 } } },
        { id: 'a5', label: 'A5', value: 'a5', metadata: { mm: { w: 148, h: 210 } } },
      ];
    }
    return [];
  }
  
  async getPaperTypes(productType: string) {
    return [
      { id: 'matte', label: 'Matte', value: 'matte' },
      { id: 'glossy', label: 'Glossy', value: 'glossy' },
      { id: 'premium', label: 'Premium Matte', value: 'premium' },
    ];
  }
  
  async getFoldFormats(productType: string) {
    if (productType === 'greeting-card') {
      return [
        { id: 'flat', label: 'Flat (Single Panel)', value: 'flat' },
        { id: 'bifold', label: 'Bifold (Folded Card)', value: 'bifold' },
      ];
    }
    return [];
  }
  
  async getFoilOptions(productType: string) {
    return [
      { id: 'none', label: 'No Foil', value: 'none' },
      { id: 'gold', label: 'Gold Foil', value: 'gold', price: 2.00 },
      { id: 'silver', label: 'Silver Foil', value: 'silver', price: 2.00 },
    ];
  }
  
  async getEnvelopeOptions(productType: string) {
    if (productType === 'greeting-card') {
      return [
        { id: 'white', label: 'White Envelope', value: 'white' },
        { id: 'kraft', label: 'Kraft Envelope', value: 'kraft' },
      ];
    }
    return [];
  }
  
  async generatePrintSpec(selection: SelectionState): Promise<PrintSpec> {
    // Use existing printSpecs.ts logic, map to internal types
    const sizeMm = selection.size === '5x7' 
      ? { w: 127, h: 178 } 
      : { w: 148, h: 210 };
    
    // Return PrintSpec with sides, bleed, safe zones
    return {
      id: `mock-${selection.productType}-${selection.size}-${selection.orientation}`,
      trimMm: sizeMm,
      bleedMm: 3,
      safeMm: 5,
      dpi: 300,
      sides: generateSides(selection),
      folded: selection.foldFormat === 'bifold',
    };
  }
  
  async getPrice(selection: Partial<SelectionState>) {
    return 2.99; // Mock price
  }
}
```

### 4. Asset Upload API

```typescript
// app/api/assets/route.ts

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Generate unique ID
    const assetId = `asset_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    
    // Convert to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Optimize with sharp
    const optimized = await sharp(buffer)
      .resize(3000, 3000, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();
    
    // Save to public/uploads (or S3/CDN in production)
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const filePath = join(uploadDir, `${assetId}.jpg`);
    await writeFile(filePath, optimized);
    
    // Return asset metadata
    return NextResponse.json({
      assetId,
      url: `/uploads/${assetId}.jpg`,
      width: 3000, // Get from sharp metadata
      height: 3000,
      mimeType: 'image/jpeg',
      size: optimized.length,
    });
  } catch (error) {
    console.error('Asset upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
```

### 5. Draft Persistence

```typescript
// app/api/drafts/route.ts

export async function POST(req: NextRequest) {
  const draft: PhysicalDesignDraft = await req.json();
  
  // Validate: no base64 in draft
  for (const sideId in draft.design.sides) {
    for (const obj of draft.design.sides[sideId].objects) {
      if (obj.assetUrl?.startsWith('data:')) {
        return NextResponse.json(
          { error: 'Draft contains base64 data. Upload assets first.' },
          { status: 400 }
        );
      }
    }
  }
  
  // Save to DB/file
  const draftId = draft.id || `draft_${Date.now()}`;
  await saveDraft(draftId, draft);
  
  return NextResponse.json({ draftId, url: `/designer/draft/${draftId}` });
}
```

### 6. Refactored Options UI

```typescript
// components/Designer/OptionsPanel.tsx

export function OptionsPanel({ provider, selection, onSelectionChange }) {
  const [sizes, setSizes] = useState<ProductOption[]>([]);
  const [papers, setPapers] = useState<ProductOption[]>([]);
  // ... load options from provider
  
  useEffect(() => {
    if (selection.productType && selection.orientation) {
      provider.getSizes(selection.productType, selection.orientation)
        .then(setSizes);
      provider.getPaperTypes(selection.productType)
        .then(setPapers);
    }
  }, [selection.productType, selection.orientation]);
  
  return (
    <div className="space-y-4">
      <OptionGroup label="Size">
        {sizes.map(size => (
          <OptionButton 
            key={size.id}
            selected={selection.size === size.value}
            onClick={() => onSelectionChange({ size: size.value })}
          >
            {size.label}
          </OptionButton>
        ))}
      </OptionGroup>
      
      <OptionGroup label="Paper Type">
        {papers.map(paper => (
          <OptionButton 
            key={paper.id}
            selected={selection.paperType === paper.value}
            onClick={() => onSelectionChange({ paperType: paper.value })}
          >
            {paper.label}
          </OptionButton>
        ))}
      </OptionGroup>
    </div>
  );
}
```

## Step-by-Step Implementation Plan

### Phase 1: Foundation (Types + Providers)
1. ✅ Create `lib/designer/types.ts` with internal types
2. ✅ Create `lib/designer/providers/ProductProvider.ts` interface
3. ✅ Implement `lib/designer/providers/MockProvider.ts`
4. ✅ Add provider tests

### Phase 2: Asset Management
5. ✅ Create `/api/assets` upload endpoint
6. ✅ Create `lib/assetManager.ts` for client-side asset handling
7. ✅ Update `EditorObject` to use `assetId`/`assetUrl` instead of base64

### Phase 3: UI Refactor
8. ✅ Create `components/Designer/OptionsPanel.tsx` (provider-driven)
9. ✅ Refactor `ProjectEditor.tsx` to use provider pattern
10. ✅ Update sidebar to use `OptionsPanel`

### Phase 4: Draft System
11. ✅ Create `/api/drafts` POST endpoint
12. ✅ Create `/api/drafts/[id]` GET endpoint
13. ✅ Add "Save Draft" button with upload + navigate
14. ✅ Add "Save & Continue" button with same flow

### Phase 5: Gelato Provider
15. ✅ Implement `lib/designer/providers/GelatoProvider.ts`
16. ✅ Add caching layer for Gelato API responses
17. ✅ Map Gelato API to internal types
18. ✅ Test with real Gelato products

## Breaking Changes

- ❌ **Old**: `EditorObject.src` contains base64 data URL
- ✅ **New**: `EditorObject.assetId` + `EditorObject.assetUrl`

- ❌ **Old**: Hardcoded size/paper options in component
- ✅ **New**: Provider-driven options

- ❌ **Old**: `handleSave()` sends full design with base64
- ✅ **New**: Upload assets first, then save with references

## Migration Path

1. Add new types alongside existing (no breaking changes yet)
2. Add asset upload API
3. Update image handling to use asset IDs
4. Refactor options UI incrementally
5. Replace hardcoded Gelato calls with provider
6. Remove deprecated base64 handling

## File Changes Summary

### New Files
- `lib/designer/types.ts`
- `lib/designer/providers/ProductProvider.ts`
- `lib/designer/providers/MockProvider.ts`
- `lib/designer/providers/GelatoProvider.ts`
- `lib/designer/assetManager.ts`
- `app/api/assets/route.ts`
- `app/api/drafts/route.ts`
- `app/api/drafts/[id]/route.ts`
- `components/Designer/OptionsPanel.tsx`

### Modified Files
- `components/ProjectEditor/types.ts` - Add asset references
- `components/ProjectEditor/ProjectEditor.tsx` - Use provider pattern
- `lib/assetStore.ts` - Track uploaded asset IDs

### Removed (Eventually)
- Hardcoded Gelato size lookups
- Base64 image storage in drafts

