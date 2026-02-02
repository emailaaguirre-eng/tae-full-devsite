# Gelato UID Audit Report

## Summary
This audit examines where Gelato product/variant UIDs are currently used in the codebase and identifies gaps where they should be added for print spec integration.

## Files Containing Gelato Identifiers

### Core Gelato Integration
- **`lib/gelato.ts`**: Main Gelato API client
  - Uses `productUid` in `getGelatoProductDetails()`, `getGelatoPrintSpecs()`, `createGelatoOrder()`
  - Interface `GelatoProduct` has `productUid: string`

- **`lib/gelatoPrintSpecs.ts`**: Print specs POC (new)
  - Uses `productUid` for fetching print specifications

- **`app/api/gelato/variants/route.ts`**: Variants API endpoint
  - Maps product types to base product UIDs (`PRODUCT_TYPE_MAP`)
  - Fetches variants from Gelato API
  - **Returns `gelatoUid` in parsed response** (lines 84, 93, 104, 114)

### Product Pages
- **`app/shop/[product]/page.tsx`**: Main product page
  - **Does NOT use Gelato variants API**
  - Uses hardcoded options: `sizeOptions`, `paperTypes`, `printMaterials`, `frameColors`, `foilColors`
  - Stores selected options in state: `selectedSize`, `selectedMaterial`, `selectedPaper`, `selectedFrame`, `selectedFoil`
  - **No Gelato UID tracking in selected options**

### Order Creation
- **`app/api/orders/create/route.ts`**: Order creation endpoint
  - Expects `gelatoData` with `productUid` but source is unclear

### Documentation/Examples
- **`docs/gelato-print-specs-poc.md`**: POC documentation
- **`docs/PRODUCT_MANAGEMENT_PLAN.md`**: Product management references
- **`docs/MULTI_SURFACE_CARD_EDITOR.md`**: References `gelatoProductUid`
- **`docs/GELATO_PAPER_OPTIONS_FOIL.md`**: Examples with product UIDs
- **`docs/GELATO_PRICING_SETUP.md`**: Product UID examples

## Current Product Options Structure

### How Options Are Built (app/shop/[product]/page.tsx)

**Hardcoded Options (Lines 108-150):**
```typescript
const sizeOptions: Record<string, { name: string; price: number }[]> = {
  card: [
    { name: '4x6', price: 12.99 },
    { name: '5x7', price: 15.99 },
    { name: '6x9', price: 19.99 },
  ],
  // ... other product types
};

const paperTypes = [
  { name: 'Premium Cardstock', description: '350gsm coated silk', price: 0 },
  // ... more options
];
```

**State Management:**
- `selectedSize`: string | null
- `selectedMaterial`: string | null
- `selectedPaper`: string | null
- `selectedFrame`: string | null
- `selectedFoil`: string | null

**No Gelato UID stored with selections.**

### Gelato Variants API Structure (app/api/gelato/variants/route.ts)

**Returns:**
```typescript
{
  sizes: [{ name: string, price: number, gelatoUid: string }],
  materials: [{ name: string, price: number, gelatoUid: string, description: string }],
  frames?: [{ name: string, price: number, gelatoUid: string }],
  foilColors?: [{ name: string, price: number, gelatoUid: string }]
}
```

**Key Finding:** The API endpoint **does return `gelatoUid`** for each variant, but the shop page **does not use this API**.

## Gelato UID Availability Per Variant

### ✅ Where Gelato UIDs Exist:
1. **`app/api/gelato/variants/route.ts`**: Returns `gelatoUid` for each variant (sizes, materials, frames, foil)
2. **Gelato API response**: Each variant has a `uid` field

### ❌ Where Gelato UIDs Are Missing:
1. **`app/shop/[product]/page.tsx`**: 
   - Hardcoded options don't include Gelato UIDs
   - Selected options state doesn't track Gelato UIDs
   - Options passed to ProjectEditor don't include Gelato UID

2. **`components/ProjectEditor/ProjectEditor.tsx`**:
   - Props don't accept `gelatoProductUid` or `gelatoVariantUid`
   - Print spec lookup uses `productSlug` only, not Gelato UID

3. **Order creation flow**:
   - `gelatoData.productUid` expected but source unclear
   - No mapping from selected options to Gelato variant UID

## Where Gelato UIDs Should Be Added

### Priority 1: Product Options Selection
**File:** `app/shop/[product]/page.tsx`

**Changes Needed:**
1. Replace hardcoded options with Gelato variants API call
2. Store `gelatoUid` with each selected option:
   ```typescript
   const [selectedSize, setSelectedSize] = useState<{ name: string; gelatoUid: string } | null>(null);
   const [selectedMaterial, setSelectedMaterial] = useState<{ name: string; gelatoUid: string } | null>(null);
   // ... etc
   ```
3. Pass Gelato variant UID to ProjectEditor

### Priority 2: ProjectEditor Integration
**File:** `components/ProjectEditor/ProjectEditor.tsx`

**Changes Needed:**
1. Add `gelatoVariantUid?: string` to `ProjectEditorProps`
2. Update `getPrintSpecForProduct()` to accept optional `gelatoVariantUid`
3. If `gelatoVariantUid` provided, fetch print specs from Gelato API
4. Fall back to hardcoded specs if Gelato fetch fails

### Priority 3: Print Specs Lookup
**File:** `lib/printSpecs.ts`

**Changes Needed:**
1. Update `getPrintSpecForProduct()` signature:
   ```typescript
   export function getPrintSpecForProduct(
     productSlugOrId: string,
     variationId?: string,
     gelatoVariantUid?: string  // NEW
   ): PrintSpecResult
   ```
2. If `gelatoVariantUid` provided, call `getGelatoPrintSpecs()` from `lib/gelatoPrintSpecs.ts`
3. Convert Gelato spec to `PrintSpec` format
4. Fall back to hardcoded mapping if Gelato unavailable

### Priority 4: Order Creation
**File:** `app/shop/[product]/page.tsx` (order submission)

**Changes Needed:**
1. Build `gelatoData` from selected options with Gelato UIDs
2. Determine final product UID (may need to combine variant UIDs or use base product UID)

## Print Spec Related Fields

### Current Print Spec Fields (lib/printSpecs.ts)
- `canvasPx`: { w: number, h: number }
- `bleedPx`: number
- `trimPx`: number
- `safePx`: number
- `foldLines`: Array<{ x1, y1, x2, y2 }>

### Gelato API Fields to Map (lib/gelatoPrintSpecs.ts)
- `dimensions`: { width, height, unit }
- `bleed`: { value, unit }
- `trim`: value
- `safeZone`: { value, unit }
- `fold`: fold information

**Status:** POC parser exists but needs verification of actual Gelato API response structure.

## Recommendations

### Immediate Actions:
1. **Verify Gelato API response structure** using `/api/gelato/test-print-specs` endpoint
2. **Update shop page** to use Gelato variants API instead of hardcoded options
3. **Add Gelato UID tracking** to selected options state

### Integration Plan:
1. **Phase 1**: Update product options to use Gelato variants API and track UIDs
2. **Phase 2**: Pass Gelato variant UID to ProjectEditor
3. **Phase 3**: Update print spec lookup to use Gelato API when UID available
4. **Phase 4**: Test with multiple product types and verify fallback behavior

### Data Flow:
```
User selects options
  ↓
Fetch from /api/gelato/variants?productType=card
  ↓
Store selectedSize.gelatoUid, selectedMaterial.gelatoUid, etc.
  ↓
Pass gelatoVariantUid to ProjectEditor
  ↓
ProjectEditor calls getPrintSpecForProduct(productSlug, undefined, gelatoVariantUid)
  ↓
If gelatoVariantUid exists: fetch from Gelato API → convert to PrintSpec
  ↓
If not: use hardcoded PrintSpec mapping
```

## Notes

- **Gelato Product UID vs Variant UID**: 
  - Product UID: Base product type (e.g., `cards_cl_dtc_prt_pt`)
  - Variant UID: Specific combination (e.g., `cards_pf_a5_pt_350-gsm-coated-silk_cl_4-4_ver`)
  - For print specs, we likely need the **variant UID** (more specific)

- **Multiple Variants**: 
  - Cards may have size + paper + foil variants
  - Need to determine final variant UID from combination
  - Or use base product UID and fetch all variants, then match

- **Fallback Strategy**:
  - Always fall back to hardcoded specs if Gelato unavailable
  - Hardcoded specs should remain as default until verified

