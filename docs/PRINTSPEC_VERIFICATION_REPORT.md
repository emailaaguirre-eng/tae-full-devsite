# PrintSpec Integration Verification Report
**Date**: 2025-01-31  
**Purpose**: Verify that PrintSpec integration will NOT affect customer-facing product options, pricing, checkout, or order fulfillment.

---

## A) Current Product Options Flow

### Source of Truth: **Hardcoded Constants**
Product options are defined as **static TypeScript constants** in `app/shop/[product]/page.tsx`:

**Files Involved:**
- `app/shop/[product]/page.tsx` (lines 28-150)

**Option Definitions:**
- `sizeOptions: Record<string, { name: string; price: number }[]>` (lines 109-134)
  - Maps product type → array of size options with prices
  - Example: `card: [{ name: '4x6', price: 12.99 }, ...]`
- `paperTypes: Array<{ name, description, price }>` (lines 137-142)
- `printMaterials: Array<{ name, price }>` (lines 145-150)
- `frameColors: Array<{ name, color, border }>` (lines 92-98)
- `foilColors: Array<{ name, color, price }>` (lines 101-106)

**UI Rendering:**
- Options are rendered directly from these constants (lines 500-700+)
- No API calls to fetch options
- No external data source (WooCommerce/Gelato) for options

**Key Finding**: Product options are **completely static** and **not fetched from any external API**.

---

## B) Current Checkout/Cart Flow

### Pricing Calculation
**Location**: `app/shop/[product]/page.tsx` - `calculateTotal()` function (lines 176-202)

**How it works:**
1. Looks up `selectedSize` in `sizeOptions[productType]`
2. Adds material/paper/frame/foil prices from hardcoded arrays
3. Multiplies by `quantity`
4. Returns formatted string: `(total * quantity).toFixed(2)`

**No external pricing API** - all prices are hardcoded.

### Selection Storage
**Location**: React state in `app/shop/[product]/page.tsx` (lines 159-168)
- `selectedSize`, `selectedPaper`, `selectedMaterial`, `selectedFrame`, `selectedFoil`, `quantity`
- Stored in component state only
- No cart/checkout API yet

### Order Payload
**Status**: **NOT IMPLEMENTED YET**

**Current State:**
- Checkout buttons are disabled placeholders (lines 887-901)
- Text: "(Checkout functionality coming soon)"
- No cart/checkout API routes found
- No Gelato order submission code found

**Design Data Storage:**
- `handleProjectEditorComplete()` saves to `localStorage` (lines 269-324)
- Stores: `{ artkeyId, designData: { imageUrl, productType, exportedSides }, productInfo: { productType, selectedSize, selectedPaper, ... }, timestamp }`
- This is **design data**, not order data

**Key Finding**: Checkout/cart is **not implemented**. Product selections are only in React state and localStorage (for design persistence).

---

## C) Gelato Fulfillment Integration

### Status: **NOT FOUND**

**Search Results:**
- No `gelato` references in codebase
- No Gelato API client files
- No order submission endpoints
- Comments mention "Gelato-ready" but no actual integration

**Comments Found:**
- Line 333: `// Upload design image to server/WordPress for Gelato (if needed later)`
- Line 380: `// Gelato-ready: If imageUrl is a WordPress URL, it's ready for Gelato API`

**Key Finding**: Gelato integration is **planned but not implemented**. No risk of PrintSpec affecting non-existent Gelato order payloads.

---

## D) PrintSpec Integration Plan (Read-Only)

### Current Integration Point
**File**: `components/ProjectEditor/ProjectEditor.tsx`

**Props:**
```typescript
interface ProjectEditorProps {
  printSpecId?: string;      // Optional explicit spec ID
  productSlug?: string;      // Product slug for spec lookup
  onComplete?: (exportData: { side: string; dataUrl: string; blob: Blob }[]) => void;
  onClose?: () => void;
}
```

**Usage in Shop Page:**
- `app/shop/[product]/page.tsx` line 842: `<ProjectEditor productSlug={productType} ... />`
- `productType` comes from URL params: `params.product` (line 155)
- This is **read-only** - PrintSpec is never written back to product options

### PrintSpec Lookup
**File**: `lib/printSpecs.ts`

**Function**: `getPrintSpecForProduct(productSlugOrId, variationId?)`
- Maps product slug → print spec ID
- Returns `PrintSpec` object with dimensions/guides
- **Does NOT modify product options**

**Mapping:**
```typescript
const mapping: Record<string, string> = {
  poster: 'poster_simple',
  print: 'poster_simple',
  card: 'greeting_card_bifold',
  invitation: 'greeting_card_bifold',
  announcement: 'greeting_card_bifold',
  postcard: 'poster_simple',
};
```

### Export Result Payload
**Current**: `onComplete` receives:
```typescript
{ side: string; dataUrl: string; blob: Blob }[]
```

**Proposed Enhancement** (future, not implemented):
```typescript
{
  exports: [{ sideId, dataUrl, width, height }],
  specId: string
}
```

**Key Finding**: PrintSpec is **completely isolated** from product options. It only affects:
1. Editor canvas dimensions
2. Guide overlay rendering (bleed/trim/safe/fold)
3. Export PNG dimensions

---

## E) Explicit Statement

### ✅ **NO CUSTOMER-FACING PRODUCT OPTIONS CHANGE**

**Confirmation:**
1. Product options (`sizeOptions`, `paperTypes`, etc.) are **hardcoded constants** - PrintSpec does not read or modify them
2. Pricing (`calculateTotal()`) uses **hardcoded prices** - PrintSpec does not affect pricing logic
3. Product selection state is **separate** from PrintSpec - PrintSpec is only passed to editor
4. Checkout/cart is **not implemented** - no risk of PrintSpec affecting order payloads
5. Gelato integration is **not implemented** - no risk of PrintSpec affecting fulfillment

**PrintSpec is READ-ONLY for editor purposes only.**

---

## F) Risks / Edge Cases

### ✅ **LOW RISK** - PrintSpec is isolated from product flow

### Potential Risks (Mitigated):

1. **Risk**: PrintSpec mapping could accidentally be used for product options
   - **Mitigation**: PrintSpec is only used in `ProjectEditor` component, never in product options UI
   - **Status**: ✅ Safe - no code paths connect PrintSpec to options

2. **Risk**: Export dimensions could be confused with product size selection
   - **Mitigation**: Export dimensions come from PrintSpec (editor), product size comes from `selectedSize` (options)
   - **Status**: ✅ Safe - separate data sources

3. **Risk**: Missing PrintSpec mapping could break editor
   - **Current**: Falls back to `poster_simple` (line 94 in `printSpecs.ts`)
   - **Required Safeguard**: For card products, **MUST block** if spec missing (see below)

4. **Risk**: Future Gelato integration might use PrintSpec for order payload
   - **Mitigation**: Gelato order payload should use `productInfo` from localStorage, NOT PrintSpec
   - **Recommendation**: Document that PrintSpec is editor-only

### Required Safeguards

#### 1. Card Products Must Block if Spec Missing
**Location**: `components/ProjectEditor/ProjectEditor.tsx`

**Current Behavior** (line 94):
```typescript
const specId = mapping[productSlugOrId] || 'poster_simple'; // ⚠️ Falls back silently
```

**Required Change**:
```typescript
export function getPrintSpecForProduct(productSlugOrId: string, variationId?: string): PrintSpec | undefined {
  const mapping: Record<string, string> = { ... };
  const specId = mapping[productSlugOrId];
  
  // For card products, require explicit mapping
  const cardProducts = ['card', 'invitation', 'announcement'];
  if (cardProducts.includes(productSlugOrId) && !specId) {
    return undefined; // Return undefined to trigger error
  }
  
  return specId ? getPrintSpec(specId) : getPrintSpec('poster_simple'); // Poster fallback OK
}
```

**In ProjectEditor** (add validation):
```typescript
if (!printSpec && isCardProduct) {
  return (
    <div className="error-message">
      This card format isn't configured for print yet. Please contact support.
    </div>
  );
}
```

#### 2. Poster Products Can Fallback
- ✅ Posters can safely fallback to `poster_simple`
- No blocking required

#### 3. Document PrintSpec Isolation
**Recommendation**: Add comment in `lib/printSpecs.ts`:
```typescript
/**
 * PrintSpec Library - READ-ONLY for Editor Use Only
 * 
 * WARNING: This library is ONLY for editor canvas sizing and export dimensions.
 * It MUST NOT be used for:
 * - Product options/variations
 * - Pricing calculations
 * - Checkout/cart logic
 * - Order fulfillment payloads
 * 
 * Product options come from hardcoded constants in app/shop/[product]/page.tsx
 */
```

---

## Summary

### ✅ **VERIFIED SAFE**

1. **Product Options**: Hardcoded constants, completely separate from PrintSpec
2. **Pricing**: Calculated from hardcoded prices, PrintSpec never accessed
3. **Checkout**: Not implemented, no risk
4. **Gelato**: Not implemented, no risk
5. **PrintSpec Usage**: Only in `ProjectEditor` for canvas/export, read-only

### Required Actions

1. ✅ **Implement card product blocking** if PrintSpec missing (see safeguard #1)
2. ✅ **Add documentation** clarifying PrintSpec is editor-only (see safeguard #3)
3. ✅ **Future Gelato integration**: Ensure order payload uses `productInfo` from localStorage, NOT PrintSpec

### Conclusion

**PrintSpec integration is SAFE and will NOT affect customer-facing product options, pricing, or checkout.** The only required change is adding validation to block card products if PrintSpec mapping is missing.

