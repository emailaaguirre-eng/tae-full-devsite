# PrintSpec Mapping Guide

**Last Updated:** 2025-01-31  
**Sprint:** 2D

## Overview

This guide explains how to add new Gelato variant UIDs to the PrintSpec mapping system. The mapping system resolves Gelato variant UIDs to our internal PrintSpec IDs, which define print dimensions, bleed, trim, safe zones, and fold lines.

## Architecture

### PrintSpec Structure

Each `PrintSpec` defines:
- **Sides:** Available print sides (`front`, `inside`, `back`)
- **Dimensions:** Canvas size in pixels (at 300 DPI)
- **Bleed/Trim/Safe:** Print margins in pixels
- **Fold Lines:** Optional fold line coordinates (for folded products)
- **Folded Flag:** Boolean indicating if product has folds

### Mapping Flow

```
Gelato Variant UID
  ↓
getPrintSpecIdForVariantUid()
  ↓
PrintSpec ID (e.g., "greeting_card_bifold")
  ↓
getPrintSpec()
  ↓
PrintSpec object
```

## Adding New Variant Mappings

### Step 1: Identify the Variant UID

1. **From Gelato API:**
   - Call `/api/gelato/variants?productType=card`
   - Each variant has a `uid` field
   - Example: `cards_pf_a5_pt_350-gsm-coated-silk_cl_4-4_ver`

2. **From Browser Console:**
   - Open Project Editor
   - Check console for `[GELATO_VARIANT]` log
   - Copy the `gelatoVariantUid` value

### Step 2: Determine PrintSpec ID

Choose the appropriate PrintSpec based on product type and structure:

| Product Type | PrintSpec ID | Sides | Folded |
|-------------|--------------|-------|--------|
| Cards (bifold) | `greeting_card_bifold` | front, inside, back | Yes |
| Postcards | `postcard_front_back` | front, back | No |
| Invitations (flat) | `invitation_flat` | front | No |
| Announcements (flat) | `announcement_flat` | front | No |
| Wall prints | `poster_simple` | front | No |

### Step 3: Add Mapping

Edit `lib/printSpecs.ts` and add to `VARIANT_UID_TO_PRINTSPEC_MAP`:

```typescript
export const VARIANT_UID_TO_PRINTSPEC_MAP: Record<string, string> = {
  // Direct mapping (exact match)
  'cards_pf_a5_pt_350-gsm-coated-silk_cl_4-4_ver': 'greeting_card_bifold',
  
  // Pattern mapping (wildcard)
  'cards_*_a5_*': 'greeting_card_bifold', // All A5 cards
  'cards_*_a6_*': 'greeting_card_bifold', // All A6 cards
  
  // ... existing mappings
};
```

### Step 4: Test

1. **Load product page** with the variant
2. **Enter Project Editor** - should load without errors
3. **Check console** - no `printSpecError` should appear
4. **Verify sides** - correct sides should be available (Front/Inside/Back for cards)
5. **Test export** - export should work without blocking

## Mapping Strategies

### 1. Direct Mapping (Exact Match)

**Use when:** You have a specific variant UID that needs a specific PrintSpec.

```typescript
'cards_pf_a5_pt_350-gsm-coated-silk_cl_4-4_ver': 'greeting_card_bifold',
```

**Pros:**
- Precise control
- Easy to debug

**Cons:**
- Requires mapping each variant individually

### 2. Pattern Mapping (Wildcard)

**Use when:** Multiple variants share the same PrintSpec structure.

```typescript
'cards_*_a5_*': 'greeting_card_bifold', // All A5 cards
```

**Pattern syntax:**
- `*` matches any characters
- Example: `cards_*_a5_*` matches:
  - `cards_pf_a5_pt_350-gsm-coated-silk_cl_4-4_ver`
  - `cards_pf_a5_pt_300-gsm-uncoated_cl_4-4_ver`
  - `cards_pf_a5_pt_*_*_*`

**Pros:**
- Covers multiple variants with one entry
- Easier maintenance

**Cons:**
- Less precise (may match unintended variants)
- Order matters (first match wins)

### 3. Prefix Matching (Fallback)

**Use when:** All variants of a product type share the same PrintSpec.

The resolver automatically uses prefix matching as a fallback:

```typescript
if (variantUid.startsWith('cards_')) {
  return 'greeting_card_bifold';
}
```

**Current prefixes:**
- `cards_` → `greeting_card_bifold`
- `postcards_` → `postcard_front_back`
- `invitations_` → `invitation_flat`
- `announcements_` → `announcement_flat`
- `prints_` → `poster_simple`

**Pros:**
- Automatic coverage for new variants
- No manual mapping needed

**Cons:**
- Less flexible (all variants get same spec)
- May not work if variants need different specs

## Creating New PrintSpecs

If you need a new PrintSpec (e.g., different size or structure):

### Step 1: Define PrintSpec

Add to `printSpecs` object in `lib/printSpecs.ts`:

```typescript
export const printSpecs: Record<string, PrintSpec> = {
  // ... existing specs
  
  greeting_card_a6_bifold: {
    id: 'greeting_card_a6_bifold',
    name: 'Greeting Card A6 (Bifold)',
    sides: [
      {
        id: 'front',
        canvasPx: { w: inchesToPx(4.13), h: inchesToPx(5.83) }, // A6: 105x148mm
        bleedPx: inchesToPx(0.125),
        trimPx: inchesToPx(0.125),
        safePx: inchesToPx(0.25),
        foldLines: [
          { x1: inchesToPx(4.13), y1: 0, x2: inchesToPx(4.13), y2: inchesToPx(5.83) },
        ],
      },
      // ... inside and back sides
    ],
    folded: true,
    sideIds: ['front', 'inside', 'back'],
  },
};
```

### Step 2: Add Mapping

Map variant UIDs to the new PrintSpec:

```typescript
export const VARIANT_UID_TO_PRINTSPEC_MAP: Record<string, string> = {
  'cards_*_a6_*': 'greeting_card_a6_bifold',
  // ... other mappings
};
```

## Enforcement Rules

### Rule 1: Variant UID Required

If `gelatoVariantUid` is provided but no mapping exists:
- **Error shown:** "This format (variant: {uid}) isn't configured for print yet. Please contact support."
- **Export/Continue blocked:** Yes
- **Fallback:** None (enforcement)

### Rule 2: Product Slug Fallback

If `gelatoVariantUid` is NOT provided:
- **Fallback:** Use product slug mapping
- **Allowed for:** Simple posters only
- **Blocked for:** Cards, invitations, announcements (require variant UID)

### Rule 3: Card Products

Card-like products (`card`, `invitation`, `announcement`) require:
- Either `gelatoVariantUid` with valid mapping
- Or explicit product slug mapping (legacy support)

## Troubleshooting

### Error: "This format isn't configured for print yet"

**Cause:** Variant UID exists but no mapping found.

**Solution:**
1. Check variant UID in console log
2. Add mapping to `VARIANT_UID_TO_PRINTSPEC_MAP`
3. Verify PrintSpec ID exists in `printSpecs`

### Error: "Print spec '{id}' not found"

**Cause:** Mapping points to non-existent PrintSpec ID.

**Solution:**
1. Check PrintSpec ID in mapping
2. Verify PrintSpec exists in `printSpecs` object
3. Fix typo or create missing PrintSpec

### Wrong sides showing

**Cause:** PrintSpec has incorrect `sideIds` array.

**Solution:**
1. Check PrintSpec `sideIds` matches actual `sides` array
2. Verify `sideIds` includes all sides defined in `sides`
3. Update `sideIds` to match

### Fold lines not showing

**Cause:** PrintSpec `folded` flag is `false` or missing.

**Solution:**
1. Set `folded: true` in PrintSpec
2. Verify `foldLines` are defined on relevant sides
3. Check guide visibility toggle in editor

## Best Practices

1. **Use patterns for common variants:** Prefer wildcard patterns over individual mappings when possible.

2. **Document mappings:** Add comments explaining why a mapping exists:
   ```typescript
   // A5 cards (5x7 inches) - bifold structure
   'cards_*_a5_*': 'greeting_card_bifold',
   ```

3. **Test after adding:** Always test the variant in the editor after adding a mapping.

4. **Keep PrintSpecs minimal:** Only create new PrintSpecs when dimensions or structure differ significantly.

5. **Use prefix matching as last resort:** Prefer explicit mappings or patterns over prefix matching for better control.

## Examples

### Example 1: Adding A6 Card Variant

```typescript
// 1. Add PrintSpec (if A6 needs different dimensions)
greeting_card_a6_bifold: {
  id: 'greeting_card_a6_bifold',
  name: 'Greeting Card A6 (Bifold)',
  sides: [/* ... */],
  folded: true,
  sideIds: ['front', 'inside', 'back'],
},

// 2. Add mapping
export const VARIANT_UID_TO_PRINTSPEC_MAP: Record<string, string> = {
  'cards_*_a6_*': 'greeting_card_a6_bifold',
};
```

### Example 2: Adding Specific Postcard Variant

```typescript
// 1. PrintSpec already exists (postcard_front_back)

// 2. Add mapping
export const VARIANT_UID_TO_PRINTSPEC_MAP: Record<string, string> = {
  'postcards_pf_4x6_*': 'postcard_front_back',
};
```

### Example 3: Custom Invitation Size

```typescript
// 1. Add PrintSpec
invitation_5x7_flat: {
  id: 'invitation_5x7_flat',
  name: 'Invitation 5x7 (Flat)',
  sides: [
    {
      id: 'front',
      canvasPx: { w: inchesToPx(5), h: inchesToPx(7) },
      bleedPx: inchesToPx(0.125),
      trimPx: inchesToPx(0.125),
      safePx: inchesToPx(0.25),
    },
  ],
  folded: false,
  sideIds: ['front'],
},

// 2. Add mapping
export const VARIANT_UID_TO_PRINTSPEC_MAP: Record<string, string> = {
  'invitations_*_5x7_*': 'invitation_5x7_flat',
};
```

## Related Files

- **`lib/printSpecs.ts`**: PrintSpec definitions and mapping
- **`components/ProjectEditor/ProjectEditor.tsx`**: Editor integration
- **`app/shop/[product]/page.tsx`**: Variant UID passing

## Support

If you encounter issues or need help adding mappings:
1. Check console logs for variant UID
2. Verify PrintSpec exists and is correct
3. Test mapping with direct variant UID first
4. Contact development team if mapping doesn't work

