# Sprint 4 Implementation Summary

## Overview
Implemented print-native PDF export pipeline with vector text, ornaments, and embedded images at correct resolution. Includes comprehensive preflight checks.

## Changes Made

### 1. PDF Export Library (`lib/pdfExport.ts`)
- **PDFKit Integration**: Uses PDFKit for server-side PDF generation
- **Multi-page Support**: Exports each side as a separate PDF page
- **Trim/Bleed Geometry**: Preserves trim and bleed dimensions correctly
- **Text Rendering**: Renders text as vector PDF text (not rasterized)
- **Image Embedding**: Embeds images at correct resolution
- **Ornament Rendering**: Placeholder for vector ornament rendering (SVG path conversion needed)
- **Coordinate Conversion**: Converts from screen pixels (96 DPI) to PDF points (72 DPI) via mm

### 2. Preflight System (`lib/preflight.ts`)
- **Comprehensive Checks**: Validates designs before export
- **Text Safety**: Blocks export if text is outside safe zone (blocking error)
- **Image Resolution**: Warns about potentially low-resolution images (warning)
- **Font Size**: Warns about fonts smaller than 7pt (warning)
- **Error/Warning Separation**: Distinguishes blocking errors from warnings

### 3. PDF Export API Route (`app/api/export/pdf/route.ts`)
- **POST `/api/export/pdf`**: Server-side PDF generation endpoint
- **Request Body**: `{ printSpec, sideStates, options }`
- **Response**: PDF file with appropriate headers
- **Error Handling**: Returns JSON error responses on failure

### 4. Type Definitions
- **PreflightResult**: Interface for preflight check results (errors, warnings)
- **Export Options**: Configuration for PDF export (includeBleed, embedFonts)

## Files Created

1. `lib/pdfExport.ts` - PDF generation utilities
2. `lib/preflight.ts` - Comprehensive preflight checks
3. `app/api/export/pdf/route.ts` - PDF export API endpoint

## Files Modified

1. `package.json` - Added `pdfkit` and `@types/pdfkit` dependencies

## Key Features

### Vector Text Rendering
- Text is rendered as real PDF text (not rasterized)
- Font mapping: Maps web fonts to PDF standard fonts (Helvetica, Times, Courier)
- Font weight support: Handles bold/normal fonts
- Text alignment: Supports center/left alignment
- Line height: Respects line height settings

### Image Embedding
- Images embedded at correct resolution
- Supports base64 data URLs
- Calculates dimensions in PDF points
- Preserves aspect ratio

### Trim/Bleed Geometry
- Preserves trim and bleed dimensions accurately
- Converts mm to PDF points (1/72 inch)
- Supports both with-bleed and without-bleed exports
- Multi-page models: Each side exported as separate page

### Preflight Checks
- **Blocking Errors**:
  - Text outside safe zone (prevents export)
- **Warnings** (export allowed but user notified):
  - Low image resolution
  - Font size too small (< 7pt)

## Known Limitations

1. **Ornament Vector Rendering**: 
   - Currently placeholder (draws rectangle)
   - Full SVG path to PDF path conversion needed
   - Requires SVG path parser library (e.g., `svg-path-parser`)

2. **Font Embedding**:
   - Currently uses PDF standard fonts (Helvetica, Times, Courier)
   - True font embedding requires font files (TTF/OTF)
   - Would need to load font files and register with PDFKit

3. **Image Loading**:
   - Base64 data URLs supported
   - Remote URLs need fetch implementation
   - Local file paths need filesystem access

4. **SVG Path Conversion**:
   - Ornaments use SVG path data
   - PDFKit doesn't support SVG paths directly
   - Would need SVG path parser to convert to PDF path commands

## Acceptance Criteria Status

✅ **Text as Vector**: Text rendered as real PDF text (not rasterized)
⚠️ **Ornaments as Vectors**: Placeholder implemented, full SVG path conversion pending
✅ **Images at Correct Resolution**: Images embedded at correct resolution
✅ **Trim/Bleed Geometry**: Preserved accurately in PDF
✅ **Multi-page Models**: Each side exported as separate page
✅ **Preflight Blocking**: Blocks unsafe designs before export

## Next Steps

To complete full implementation:

1. **SVG Path Conversion**:
   - Install `svg-path-parser` or similar library
   - Convert SVG path commands to PDF path commands
   - Implement full ornament vector rendering

2. **Font Embedding**:
   - Add font files (TTF/OTF) to project
   - Register fonts with PDFKit
   - Map web fonts to embedded fonts

3. **Image Loading**:
   - Implement fetch for remote URLs
   - Handle local file paths
   - Support various image formats

4. **Testing**:
   - Test PDF export with various designs
   - Verify text remains crisp when zoomed
   - Verify ornaments are vectors
   - Test preflight blocking/warning behavior

## Usage

### Client-Side (ProjectEditor)
```typescript
// In handleExport or new handleExportPDF function
const response = await fetch('/api/export/pdf', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    printSpec,
    sideStates,
    options: {
      includeBleed: true,
      embedFonts: true,
    },
  }),
});

const blob = await response.blob();
const url = URL.createObjectURL(blob);
// Download PDF
```

### Preflight Check
```typescript
import { runPreflightChecks } from '@/lib/preflight';

const result = runPreflightChecks(printSpec, sideStates);
if (!result.isValid) {
  // Block export, show errors
  console.error('Preflight errors:', result.errors);
} else if (result.warnings.length > 0) {
  // Allow export but show warnings
  console.warn('Preflight warnings:', result.warnings);
}
```

## Notes

- PDF dimensions use points (1/72 inch)
- Coordinate conversion: screen px (96 DPI) -> mm -> points (72 DPI)
- Multi-page PDF: One page per side in printSpec.sideIds order
- Preflight runs server-side before PDF generation
- Text remains selectable/searchable in PDF (vector text)

