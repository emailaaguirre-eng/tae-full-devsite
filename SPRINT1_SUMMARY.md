# Sprint 1 Implementation Summary

## Overview
Implemented spec-driven print editor with mm-based coordinate system, preflight checks, and export functionality.

## Changes Made

### 1. PrintSpec Model Refactored to mm (`lib/printSpecs.ts`)
- **PrintSide interface**: Now stores dimensions in mm (`trimMm`, `bleedMm`, `safeMm`)
- **Conversion functions**: Added `mmToPx()` and `pxToMm()` for DPI-aware conversions
- **generatePrintSpecForSize**: Refactored to use mm internally with default 4mm bleed and safe zones
- **getSamplePostcardSpec**: New function returning hardcoded 4x6 postcard spec for testing

### 2. Canvas Uses mm with Screen Scaling (`components/ProjectEditor/ProjectEditor.tsx`)
- **Canvas dimensions**: Calculated from mm (bleedBox = trimBox + bleed on all sides)
- **Screen scaling**: Uses 96 DPI for display, converts mm to screen pixels
- **Guide rendering**: Bleed box (purple), Trim box (orange), Safe box (green), Fold lines (red)
- **Sample spec fallback**: Editor uses `getSamplePostcardSpec()` when no variant selected

### 3. Minimal Preflight Check
- **Text safety check**: Blocks export if any text bounding box intersects outside safeBox
- **Error reporting**: Shows specific errors for each text element outside safe area
- **Implementation**: `runPreflight()` function checks text objects against safe zone bounds

### 4. Export Functionality
- **Print DPI**: Exports at 300 DPI (DEFAULT_DPI)
- **Bleed included**: Export includes full bleed area (trimBox + bleed on all sides)
- **Pixel ratio**: Scales from screen DPI (96) to print DPI (300) using Konva's pixelRatio
- **Single side export**: Exports current active side (Sprint 1 scope)

## Files Changed (Sprint 1 Only)

1. `lib/printSpecs.ts` (317 lines changed)
   - Added mm-based interfaces and conversion functions (`mmToPx`, `pxToMm`)
   - Refactored `generatePrintSpecForSize()` to use mm internally
   - Added `getSamplePostcardSpec()` function for hardcoded 4x6 postcard testing
   - Added `DEFAULT_DPI = 300` constant

2. `components/ProjectEditor/ProjectEditor.tsx` (Significant refactoring)
   - Updated canvas dimension calculation to use mm (bleedBox calculation)
   - Updated guide rendering (bleed/trim/safe/fold) to use mm coordinates
   - Added `runPreflight()` function for text safety checking
   - Updated `handleExport()` to export at 300 DPI with bleed included
   - Updated to use `getSamplePostcardSpec()` as fallback

## How to Run and Verify

### Setup
```bash
cd tae-full-devsite
npm install
npm run dev
```

### Verification Steps

1. **Load Sample Spec**
   - Navigate to the project editor (e.g., `/project-editor-demo`)
   - Editor should load with sample 4x6 postcard spec automatically
   - Verify guides are visible: purple (bleed), orange (trim), green (safe)

2. **Test Image Element**
   - Click "Upload Images" button
   - Select an image file
   - Verify image appears on canvas
   - Test move: Click and drag image
   - Test scale: Select image, use corner handles to resize
   - Test rotate: Select image, use rotation handle

3. **Test Text Element**
   - Click "Add Text" button
   - Type some text
   - Verify text appears on canvas
   - Test move: Click and drag text
   - Test edit: Select text, modify in sidebar inspector

4. **Test Preflight (Blocking)**
   - Add text element
   - Move text outside green safe zone (drag near edges)
   - Click "Export" button
   - Verify export is blocked with error message
   - Move text inside safe zone
   - Verify export succeeds

5. **Test Export (Golden Master)**
   - Create a design with:
     - One text element inside safe zone
     - One image element
     - Optional: Border/rectangle at trim edge
   - Click "Export" button
   - Verify export completes without errors
   - Check exported PNG dimensions:
     - Width: Should be `(trimMm.w + bleedMm * 2) * (300 / 25.4)` pixels
     - Height: Should be `(trimMm.h + bleedMm * 2) * (300 / 25.4)` pixels
     - For 4x6 postcard: `(101.6 + 8) * (300 / 25.4) = 1295px` width
     - For 4x6 postcard: `(152.4 + 8) * (300 / 25.4) = 1896px` height

6. **Golden Master Test Case**
   - Place a border/rectangle at trim edge (orange guide)
   - Add text inside safe zone
   - Export the design
   - Verify exported PNG dimensions match spec exactly:
     - Expected: 1295px × 1895px (for 4×6 postcard with 4mm bleed at 300 DPI)
   - Border should be at correct position in exported image (4mm from edge)
   - Text should be at correct position relative to trim edge

## Expected Export Dimensions (Sample Postcard)

- **Trim size**: 4" × 6" = 101.6mm × 152.4mm
- **Bleed**: 4mm on all sides
- **Bleed box**: 109.6mm × 160.4mm
- **At 300 DPI**:
  - Width: `109.6 * (300 / 25.4) = 1294.49px` ≈ **1295px**
  - Height: `160.4 * (300 / 25.4) = 1894.49px` ≈ **1895px**

## Notes

- Legacy pixel properties (`canvasPx`, `safePx`, etc.) are maintained for backward compatibility
- Screen DPI (96) is used for display, print DPI (300) for export
- Preflight only checks text elements in Sprint 1 (images deferred to later sprints)
- Export uses Konva's `toDataURL()` with `pixelRatio` parameter for DPI scaling

## Known Limitations (Sprint 1 Scope)

- Export only handles current active side (not all sides)
- Preflight only checks text bounding boxes (simplified calculation)
- Image DPI check not implemented (deferred)
- Guide visibility toggle not implemented (guides always visible)
- Templates not implemented (deferred to later sprints)

