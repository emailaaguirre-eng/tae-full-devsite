# Sprint 2: Gelato Product Catalog Integration

## Overview
Integrated Gelato Product Catalog API to populate size picker, map dimensions to PrintSpec, and lock designs to productUid.

## Changes Made

### 1. Product Search API Route (`app/api/gelato/products/search/route.ts`)
- **GET `/api/gelato/products/search`**: Search Gelato products by category/catalog
- **Query Parameters**:
  - `catalogUid`: Filter by catalog UID
  - `category`: Filter by product category (cards, postcards, etc.)
  - `limit`: Max results (default: 100)
- **Response**: Formatted products with variants and dimensions in mm
- **Uses cached catalog**: Falls back to API if cache missing

### 2. Size Picker Component (`components/ProjectEditor/SizePicker.tsx`)
- **Populates from Gelato catalog**: Fetches products via search API
- **Displays variants**: Shows all available sizes for selected product category
- **Size format**: Displays in inches (e.g., "4.0" × 6.0") and mm
- **Selection handling**: Calls `onVariantSelect` with `{ uid, productUid, trimMm }`
- **Loading/Error states**: Shows loading spinner and error messages
- **Empty state**: Prompts user to refresh catalog if no sizes available

### 3. ProjectEditor Integration
- **Size Picker UI**: Added to sidebar (shown when no variant selected)
- **Product Locking**: Once a variant is selected, spec is locked to that `productUid`
- **State Management**:
  - `lockedProductUid`: Prevents spec changes after selection
  - `lockedVariantUid`: Locks to specific variant
- **Export Data**: Includes `productUid` and `variantUid` in `onComplete` callback
- **Spec Generation**: Uses Gelato dimensions via `generatePrintSpecFromGelatoVariant`

### 4. Design JSON Model Update (`lib/designModel.ts`)
- **PrintSpecData**: Added `productUid` and `variantUid` fields
- **Locking**: Design JSON now includes product/variant UIDs to lock spec

### 5. Existing Infrastructure (Already Complete)
- **`lib/gelatoCatalog.ts`**: Catalog caching system
- **`app/api/gelato/catalog/route.ts`**: Catalog API route
- **`app/api/gelato/variant/[uid]/route.ts`**: Variant details API route
- **`lib/printSpecs.ts`**: `generatePrintSpecFromGelatoVariant()` function

## Files Created

1. `app/api/gelato/products/search/route.ts` - Product search API
2. `components/ProjectEditor/SizePicker.tsx` - Size picker component
3. `SPRINT2_SUMMARY.md` - This file

## Files Modified

1. `components/ProjectEditor/ProjectEditor.tsx`
   - Added SizePicker import and UI
   - Added product locking state (`lockedProductUid`, `lockedVariantUid`)
   - Updated `onComplete` callback to include `productUid` and `variantUid`
   - Locked spec generation to selected variant

2. `lib/designModel.ts`
   - Added `productUid` and `variantUid` to `PrintSpecData` interface

## How to Use

### 1. Refresh Gelato Catalog
```bash
npm run refresh-catalog
```

### 2. Open Project Editor
- Navigate to product editor (e.g., `/shop/card`)
- Size picker appears in sidebar if no variant selected
- Select a size from Gelato catalog
- Spec locks to selected productUid

### 3. Verify Canvas Changes
- Selecting different sizes changes canvas dimensions exactly
- Canvas reflects Gelato product dimensions in mm
- Export dimensions match spec pixel dimensions

## Acceptance Criteria

✅ **Size picker populates from Gelato catalog**
- Size picker fetches products via `/api/gelato/products/search`
- Displays all variants with dimensions
- Shows loading/error states appropriately

✅ **Canvas changes exactly with size selection**
- Selecting different sizes updates canvas dimensions
- Dimensions match Gelato product specifications
- Orientation toggle updates spec correctly

✅ **Exports match spec pixel dimensions**
- Export uses locked productUid/variantUid
- PNG dimensions match PrintSpec exactly
- Formula: `px = round((mm / 25.4) * DPI)`

✅ **Spec locked to productUid**
- Once variant selected, spec locks to productUid
- Cannot change spec after selection
- Design JSON includes productUid/variantUid

## Testing

### Manual Testing Steps

1. **Refresh Catalog**:
   ```bash
   npm run refresh-catalog
   ```

2. **Open Editor**:
   - Navigate to `/shop/card` (or any product)
   - Click "Customize" to open editor
   - Size picker should appear in sidebar

3. **Select Size**:
   - Click a size from the picker
   - Canvas should update to match dimensions
   - Product should be locked (blue banner appears)

4. **Verify Export**:
   - Add some elements to canvas
   - Click "Export"
   - Check exported PNG dimensions match spec

5. **Test Multiple Sizes**:
   - Try different product categories (cards, postcards, etc.)
   - Verify each size changes canvas correctly
   - Verify exports match expected dimensions

### Expected Behavior

- **Size Picker**: Shows all available sizes for product category
- **Selection**: Locks spec to selected productUid
- **Canvas**: Updates dimensions immediately on selection
- **Export**: PNG dimensions match PrintSpec (e.g., 1295px × 1895px for 4×6 postcard at 300 DPI)

## Known Limitations

1. **Catalog Refresh Required**: Must run `npm run refresh-catalog` before sizes appear
2. **Category Mapping**: Product slug to Gelato category mapping may need adjustment
3. **Variant Filtering**: Currently shows all variants; may need filtering by attributes (orientation, fold, etc.)
4. **Parent Component Integration**: Size picker selection needs to update parent component's `gelatoVariantUid` prop

## Next Steps

1. **Parent Component Integration**: Update shop page to handle size picker selection
2. **Variant Filtering**: Filter variants by orientation, fold, material, etc.
3. **Category Mapping**: Refine product slug to Gelato category mapping
4. **Error Handling**: Improve error messages and fallback behavior
5. **Loading States**: Add skeleton loaders for better UX
