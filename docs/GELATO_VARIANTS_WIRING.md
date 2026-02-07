# Gelato Variants API Wiring

## Overview
This document explains how the shop page fetches and matches Gelato product variants to user selections.

## Data Flow

### 1. Variant Fetching
**Location:** `app/shop/[product]/page.tsx`

On component mount, the page fetches variants from:
```
GET /api/gelato/variants?productType={productType}
```

**Response Structure:**
```typescript
{
  sizes: [{ name: string }],
  materials: [{ name: string, description?: string }],
  frames?: [{ name: string }],
  foilColors?: [{ name: string }],
  variants: [
    {
      uid: string,           // Gelato variant UID
      name: string,
      price: number,
      size: string | null,
      material: string | null,
      paper: string | null,
      frame: string | null,
      foil: string | null,
      attributes: Record<string, any>
    }
  ]
}
```

### 2. Option Building
The UI builds option selectors from the `sizes`, `materials`, `frames`, and `foilColors` arrays. These are unique values extracted from all variants.

**Example:**
- If variants have sizes: "4x6", "5x7", "6x9"
- The `sizes` array will be: `[{ name: "4x6" }, { name: "5x7" }, { name: "6x9" }]`

### 3. Variant Matching
**Location:** `app/shop/[product]/page.tsx` - `useEffect` hook

When user selections change, the component matches a variant using this logic:

```typescript
// Build match criteria from selections
const matchCriteria = {
  size: selectedSize,
  material: selectedMaterial,      // For prints
  paper: selectedPaper,            // For cards
  frame: isFramed ? selectedFrame : null,  // For prints
  foil: hasFoil ? selectedFoil : null      // For cards
};

// Find variant where ALL criteria match
const matchedVariant = variants.find(variant => {
  if (matchCriteria.size && variant.size !== matchCriteria.size) return false;
  if (matchCriteria.material && variant.material !== matchCriteria.material) return false;
  if (matchCriteria.paper && variant.paper !== matchCriteria.paper) return false;
  if (matchCriteria.frame !== undefined) {
    if (matchCriteria.frame === null && variant.frame !== null) return false;
    if (matchCriteria.frame !== null && variant.frame !== matchCriteria.frame) return false;
  }
  if (matchCriteria.foil !== undefined) {
    if (matchCriteria.foil === null && variant.foil !== null) return false;
    if (matchCriteria.foil !== null && variant.foil !== matchCriteria.foil) return false;
  }
  return true;
});
```

### 4. State Updates
When a variant is matched:
- `selectedVariant` = full variant object
- `gelatoVariantUid` = `variant.uid`

When no variant matches:
- `selectedVariant` = `null`
- `gelatoVariantUid` = `null`
- `canProceed()` returns `false`
- UI shows: "⚠️ This combination isn't available."

## Matching Rules

### Exact Matching
All selected options must exactly match a variant's normalized fields:
- Size: exact string match
- Material/Paper: exact string match
- Frame: exact string match (or `null` if unframed)
- Foil: exact string match (or `null` if no foil)

### Null Handling
- If user selects "No Foil" → `hasFoil = false` → matches variants where `foil === null`
- If user selects "Unframed" → `isFramed = false` → matches variants where `frame === null`

### Partial Selections
If user hasn't selected all required options, matching is skipped until all are selected.

## Variant Normalization

**Location:** `app/api/gelato/variants/route.ts` - `parseGelatoVariants()`

The API normalizes Gelato variant attributes into consistent fields:

```typescript
{
  size: attrs.size || attrs.dimensions || null,
  material: attrs.material || attrs.paper || attrs.finish || null,
  paper: attrs.paper || attrs.material || null,
  frame: attrs.frame || attrs.frameColor || (attrs.framed ? 'Standard' : null) || null,
  foil: attrs.foil || attrs.foilColor || null,
}
```

This ensures consistent matching regardless of how Gelato structures their variant attributes.

## Price Calculation

**Priority:**
1. If `selectedVariant` exists → use `selectedVariant.price * quantity`
2. Otherwise → fallback to hardcoded pricing (for error state)

## Error Handling

### Loading State
- Shows spinner and "Loading options..." message
- Options are disabled during fetch

### API Error
- Shows yellow warning banner with error message
- Retry button to re-fetch
- Falls back to hardcoded options (limited functionality)
- Message: "Using default options. Some features may be limited."

### Invalid Combination
- Shows red warning: "⚠️ This combination isn't available."
- Continue button is disabled
- User must change selections to proceed

## Development Mode

In development (`NODE_ENV === 'development'`):
- `gelatoVariantUid` is displayed in Order Summary sidebar
- Console logs matched variant details when selection changes

## Future Integration Points

### ProjectEditor
When passing to ProjectEditor (future Sprint 2B):
```typescript
<ProjectEditor
  productSlug={productType}
  gelatoVariantUid={gelatoVariantUid}  // NEW
  config={{ ... }}
/>
```

### Order Creation
When creating order (future):
```typescript
const gelatoData = {
  productUid: gelatoVariantUid,  // Use matched variant UID
  quantity: quantity,
  // ... other order data
};
```

## Testing Checklist

- [ ] Load `/shop/card`: options appear from API
- [ ] Select size: variant matches, `gelatoVariantUid` updates
- [ ] Select paper: variant matches, price updates
- [ ] Select invalid combo: Continue disabled, message appears
- [ ] API error: fallback to hardcoded options works
- [ ] Retry button: re-fetches variants
- [ ] Dev mode: UID displayed in sidebar
- [ ] No regressions in Step 1 upload or navigation

