# Sprint 1: Server-Side PNG Export Implementation

## Overview
Implemented server-side PNG export pipeline that renders Design JSON deterministically, independent of Konva client-side rendering.

## Changes Made

### 1. Design JSON Data Model (`lib/designModel.ts`)
- **Independent Structure**: Design JSON format separate from Konva internals
- **PrintSpecData**: `{ trimW_mm, trimH_mm, bleed_mm, safe_mm, orientation, dpi }`
- **Element Types**:
  - `ImageElement`: src, cropRect, fitMode, opacity
  - `TextElement`: text, fontFamily, fontWeight, fontSize_pt, lineHeight, tracking, align, fill
  - `LabelElement`: shapePreset, padding_mm, cornerRadius_mm, stroke, fill, textProps
  - `OrnamentElement`: ornamentId, fill, stroke
- **All coordinates in mm**: x_mm, y_mm, w_mm, h_mm, rotation_deg, zIndex
- **Conversion Functions**: `editorObjectToDesignElement()` and `designElementToEditorObject()`

### 2. Server-Side Rendering (`lib/serverRender.ts`)
- **Sharp-based rendering**: Uses Sharp library for image manipulation
- **Deterministic output**: Same Design JSON always produces same PNG
- **Element rendering**:
  - Images: Resized and cropped as specified
  - Text: Rendered via SVG (vector text in SVG, then rasterized)
  - Labels: Rendered via SVG with shapes and text
- **Coordinate conversion**: mm -> pixels using DPI formula: `px = round((mm / 25.4) * DPI)`
- **Bleed handling**: Correctly offsets elements by bleed amount

### 3. Export API Route (`app/api/export/route.ts`)
- **POST `/api/export`**: Server-side PNG generation endpoint
- **Request Body**: `{ design: DesignJSON, pageId?: string, options?: { dpi?, includeBleed? } }`
- **Preflight Integration**: Runs preflight checks before export (blocks if unsafe)
- **File Storage**: Saves PNGs to `exports/` directory for debugging
- **Response**: PNG file with appropriate headers

### 4. Preflight System (`lib/preflight.ts`)
- **Comprehensive Checks**: Validates designs before export
- **Blocking Errors**: Text outside safe zone prevents export
- **Warnings**: Low image resolution, small font sizes (export allowed)

### 5. Test Fixtures (`lib/testFixtures.ts`)
- **Golden Master Design**: Rectangle border at trimBox edges, text in safe zone
- **Preflight Failure Design**: Text outside safe zone (for testing blocking)
- **Helper Function**: `getExpectedPNGDimensions()` calculates expected PNG size

### 6. Export Tests (`__tests__/export.test.ts`)
- **Golden Master Test**: Verifies PNG dimensions match PrintSpec exactly
- **Preflight Test**: Verifies preflight blocks unsafe designs
- **Border Test**: Verifies rectangle border renders correctly

## Files Created

1. `lib/designModel.ts` - Design JSON data model and conversion functions
2. `lib/serverRender.ts` - Server-side rendering using Sharp
3. `app/api/export/route.ts` - PNG export API endpoint
4. `lib/testFixtures.ts` - Golden master and test fixtures
5. `__tests__/export.test.ts` - Export tests

## Files Modified

1. `lib/preflight.ts` - Already existed, used by export route

## How to Run and Verify

### Setup
```bash
cd tae-full-devsite
npm install
npm run dev
```

### Test Server-Side Export

1. **Create Design JSON** (client-side):
```typescript
const design: DesignJSON = {
  printSpec: {
    trimW_mm: 101.6,
    trimH_mm: 152.4,
    bleed_mm: 4,
    safe_mm: 4,
    orientation: 'portrait',
    dpi: 300,
  },
  pages: [{
    id: 'front',
    elements: [
      // Your elements here
    ],
  }],
};

// Export via API
const response = await fetch('/api/export', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ design, pageId: 'front' }),
});

const blob = await response.blob();
// Download or display PNG
```

2. **Check Export Directory**:
   - Exported PNGs saved to `exports/` directory
   - Filename format: `export-{pageId}-{timestamp}.png`
   - Check console for file path

3. **Golden Master Test**:
```bash
# Run tests (if Jest/Vitest configured)
npm test __tests__/export.test.ts
```

### Verification Steps

1. **PNG Dimensions**:
   - Export golden master design
   - Verify PNG dimensions: 1295px × 1895px (for 4×6 postcard with 4mm bleed at 300 DPI)
   - Formula: `(trimW_mm + bleed_mm * 2) / 25.4 * 300`

2. **Preflight Blocking**:
   - Export design with text outside safe zone
   - Verify API returns 400 error with preflight errors
   - Export should be blocked

3. **Deterministic Output**:
   - Export same design JSON multiple times
   - Verify PNGs are identical (byte-for-byte)

4. **Border Position**:
   - Export golden master (has rectangle at trim edge)
   - Verify border is 4mm from canvas edge (bleed offset)
   - Border should align with trim guide

## Expected PNG Dimensions

For golden master (4×6 postcard):
- **Trim size**: 101.6mm × 152.4mm
- **Bleed**: 4mm all sides
- **Bleed box**: 109.6mm × 160.4mm
- **At 300 DPI**: 
  - Width: `round((109.6 / 25.4) * 300) = 1295px`
  - Height: `round((160.4 / 25.4) * 300) = 1895px`

## Data Model Example

```typescript
const design: DesignJSON = {
  printSpec: {
    trimW_mm: 101.6,
    trimH_mm: 152.4,
    bleed_mm: 4,
    safe_mm: 4,
    orientation: 'portrait',
    dpi: 300,
  },
  pages: [
    {
      id: 'front',
      elements: [
        {
          id: 'text-1',
          type: 'text',
          x_mm: 20,
          y_mm: 20,
          w_mm: undefined,
          h_mm: undefined,
          rotation_deg: 0,
          zIndex: 1,
          text: 'Hello World',
          fontFamily: 'Helvetica',
          fontWeight: 400,
          fontSize_pt: 24,
          lineHeight: 1.2,
          align: 'left',
          fill: '#000000',
        },
      ],
    },
  ],
};
```

## Notes

- **Design JSON is independent**: Not tied to Konva, can be generated/edited server-side
- **All coordinates in mm**: Ensures print accuracy
- **Deterministic rendering**: Same input = same output
- **Preflight blocks export**: Unsafe designs cannot be exported
- **PNGs stored locally**: Saved to `exports/` for debugging
- **Text rendering**: Uses SVG (vector in SVG, then rasterized to PNG)
- **Image handling**: Supports base64 data URLs, local files (remote URLs need fetch)

## Known Limitations

1. **Text Rendering**: 
   - Uses SVG (vector text in SVG, then rasterized)
   - Font embedding not yet implemented (uses system fonts)
   - Multi-line text needs improvement

2. **Image Loading**:
   - Base64 data URLs supported
   - Local file paths supported
   - Remote URLs need fetch implementation

3. **Ornament Rendering**:
   - Placeholder (returns null)
   - Would need SVG path parser for full vector rendering

4. **Label Shapes**:
   - Basic rectangle rendering
   - Other shapes (pill, circle, etc.) need custom SVG generation

## Next Steps (Sprint 2)

- Integrate Gelato product dimensions into PrintSpec
- Add product picker UI
- Map Gelato dimensions to trimBox mm
- Update Design JSON to include productUid/variantUid

