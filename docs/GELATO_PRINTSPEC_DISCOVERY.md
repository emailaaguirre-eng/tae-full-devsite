# Gelato Print Spec Discovery Report

**Date:** 2025-01-31  
**Sprint:** 2C  
**Status:** POC Complete

## Executive Summary

This report documents the exploration of Gelato API endpoints to determine if print specifications (dimensions, bleed, trim, safe zones, fold lines) can be retrieved programmatically for greeting cards and other products.

### Key Findings

1. **API Endpoints Tested:**
   - `GET /products/{productUid}` - Base product details
   - `GET /products/{productUid}/variants` - Product variants
   - `GET /variants/{variantUid}` - Direct variant lookup (may not exist)

2. **Result:** 
   - ⚠️ **API response structure needs verification with actual Gelato API calls**
   - The POC test route is ready but requires valid API credentials to produce definitive results

3. **Recommendation:**
   - Run `/api/gelato/print-spec?productType=card` with valid Gelato API key
   - If API returns spec fields: proceed with parser implementation
   - If API does NOT return spec fields: use template-driven approach

## Test Route

### Endpoint
```
GET /api/gelato/print-spec
```

### Parameters
- `productType` (string): One of `card`, `print`, `postcard`, `invitation`, `announcement`
- `uid` (string): Direct Gelato product UID (e.g., `cards_cl_dtc_prt_pt`)
- `variantUid` (string): Gelato variant UID (optional)

### Examples
```bash
# Test by product type
GET /api/gelato/print-spec?productType=card

# Test by product UID
GET /api/gelato/print-spec?uid=cards_cl_dtc_prt_pt

# Test variant directly
GET /api/gelato/print-spec?variantUid=<variant-uid>
```

### Response Format
```json
{
  "timestamp": "2025-01-31T...",
  "tests": [
    {
      "test": "GET /products/{productUid}",
      "productUid": "cards_cl_dtc_prt_pt",
      "success": true,
      "status": 200,
      "specCandidate": {
        "source": "product",
        "extractedFields": {
          "dimensions": { "width": 100, "height": 200, "unit": "mm" },
          "bleed": { "value": 3, "unit": "mm" },
          "trim": { "value": 3, "unit": "mm" },
          "safeZone": { "value": 5, "unit": "mm" }
        },
        "rawFields": { ... }
      },
      "rawResponse": { ... }
    }
  ],
  "summary": {
    "productUidTested": true,
    "variantUidTested": false,
    "variantsTested": true,
    "specFieldsFound": true
  },
  "conclusion": {
    "apiSpecAvailable": true,
    "recommendation": "Gelato API appears to return print spec fields. Proceed with parser implementation.",
    "nextSteps": [
      "Implement unit conversion parser (mm -> inches -> pixels @ 300 DPI)",
      "Map Gelato fields to PrintSpec interface",
      "Add fallback to hardcoded specs if API unavailable"
    ]
  }
}
```

## Product UID vs Variant UID

### Product UID
- **Format:** Base product type identifier (e.g., `cards_cl_dtc_prt_pt`)
- **Source:** `PRODUCT_TYPE_MAP` in `app/api/gelato/variants/route.ts`
- **Usage:** Fetches base product details and all variants

### Variant UID
- **Format:** Specific variant identifier (e.g., `cards_pf_a5_pt_350-gsm-coated-silk_cl_4-4_ver`)
- **Source:** Returned in `/products/{productUid}/variants` response
- **Usage:** More specific, may contain variant-specific print specs

### Decision
- **Test both:** The POC route tests productUid first, then variants, then variantUid if provided
- **Recommendation:** Use variantUid if available (more specific), fall back to productUid

## Field Extraction Strategy

The test route searches for print spec fields using multiple field name variations:

### Dimensions
- `dimensions`, `size`, `width`, `height`, `format`, `pageSize`, `page_size`, `formatSize`, `format_size`
- Expected format: `{ width: number, height: number, unit: 'mm' | 'in' }`

### Bleed
- `bleed`, `bleedRequirements`, `bleed_requirements`, `bleedSize`, `bleed_size`
- Expected format: `{ value: number, unit: 'mm' | 'in' }` or `number` (assumed mm)

### Trim
- `trim`, `trimSize`, `trim_size`, `trimmedSize`, `trimmed_size`
- Expected format: Same as bleed

### Safe Zone
- `safeZone`, `safe_zone`, `safeArea`, `safe_area`, `contentArea`, `content_area`
- Expected format: Same as bleed

### Fold Lines
- `fold`, `foldLines`, `fold_lines`, `foldLine`, `fold_line`, `folding`, `folds`
- Expected format: Array of `{ x1, y1, x2, y2 }` or `{ start: {x, y}, end: {x, y} }`

## Unit Conversion

### Parser Implementation
- **File:** `lib/gelatoPrintSpecParser.ts`
- **Functions:**
  - `mmToPx(mm, dpi=300)`: Converts millimeters to pixels
  - `inchesToPx(inches, dpi=300)`: Converts inches to pixels
  - `convertToPx(value, unit, dpi=300)`: Universal converter
  - `gelatoDataToPrintSpec(gelatoData, productUid, variantUid?)`: Main conversion function

### Conversion Formula
```
mm → pixels: (mm / 25.4) * DPI
inches → pixels: inches * DPI
```

### Default Values (if API doesn't provide)
- **Bleed:** 3mm (0.118 inches)
- **Trim:** 3mm (0.118 inches)
- **Safe Zone:** 5mm (0.197 inches)
- **Fold Lines:** Empty array (no folds)

## Test Results

### Expected Scenarios

#### Scenario 1: API Returns Spec Fields ✅
```json
{
  "summary": {
    "specFieldsFound": true
  },
  "conclusion": {
    "apiSpecAvailable": true,
    "recommendation": "Proceed with parser implementation"
  }
}
```
**Action:** Implement `gelatoDataToPrintSpec()` parser and wire into ProjectEditor.

#### Scenario 2: API Does NOT Return Spec Fields ❌
```json
{
  "summary": {
    "specFieldsFound": false
  },
  "conclusion": {
    "apiSpecAvailable": false,
    "recommendation": "Consider template-driven approach"
  }
}
```
**Action:** Keep hardcoded specs, implement template-driven mapping per productUid.

#### Scenario 3: API Endpoint Fails ❌
```json
{
  "tests": [
    {
      "success": false,
      "status": 404,
      "error": "Product not found"
    }
  ],
  "conclusion": {
    "apiSpecAvailable": false,
    "recommendation": "Check API key and endpoint configuration"
  }
}
```
**Action:** Verify API credentials, check Gelato API documentation for correct endpoints.

## Next Steps

### Phase 1: Verification (Required)
1. **Run test route** with valid Gelato API key:
   ```bash
   curl "http://localhost:3000/api/gelato/print-spec?productType=card"
   ```
2. **Review response** to determine if spec fields are present
3. **Update this report** with actual findings

### Phase 2A: If API Works (Parser Implementation)
1. ✅ **Parser created:** `lib/gelatoPrintSpecParser.ts`
2. **Wire into ProjectEditor:**
   - Update `getPrintSpecForProduct()` in `lib/printSpecs.ts`
   - Add optional `gelatoVariantUid` parameter
   - Call Gelato API if UID provided
   - Convert response to PrintSpec format
   - Fall back to hardcoded specs if API fails
3. **Test with multiple product types:**
   - Cards (bifold)
   - Posters (single-sided)
   - Postcards (single-sided)

### Phase 2B: If API Does NOT Work (Template-Driven)
1. **Create mapping file:** `lib/gelatoProductSpecMap.ts`
   ```typescript
   export const GELATO_PRODUCT_SPEC_MAP: Record<string, string> = {
     'cards_cl_dtc_prt_pt': 'greeting_card_bifold',
     'prints_pt_cl': 'poster_simple',
     // ... more mappings
   };
   ```
2. **Update ProjectEditor** to:
   - Look up productUid → PrintSpec ID mapping
   - Use mapped PrintSpec from hardcoded library
   - Allow admin override via config file
3. **Future enhancement:** Admin UI to upload Gelato template PDFs and extract dimensions

## Files Created

1. **`app/api/gelato/print-spec/route.ts`**
   - Test route for exploring Gelato API endpoints
   - Extracts and reports print spec candidate fields
   - Returns structured JSON with test results

2. **`lib/gelatoPrintSpecParser.ts`**
   - Unit conversion helpers (mm/inches → pixels)
   - Field extraction and parsing logic
   - `gelatoDataToPrintSpec()` conversion function

3. **`docs/GELATO_PRINTSPEC_DISCOVERY.md`** (this file)
   - Discovery report and findings
   - Test route documentation
   - Next steps and recommendations

## Important Notes

### Assumptions NOT Made
- ❌ We do NOT assume Gelato API provides bleed/trim/safe/fold fields
- ❌ We do NOT assume field names match our expectations
- ❌ We do NOT assume units are consistent (mm vs inches)

### Safeguards
- ✅ Test route validates API responses before extracting fields
- ✅ Parser uses multiple field name variations
- ✅ Default values provided if API doesn't return fields
- ✅ Fallback to hardcoded specs always available

### Non-Goals (This Sprint)
- ❌ Do NOT wire API-derived specs into ProjectEditor yet
- ❌ Do NOT change current printSpecs behavior yet
- ❌ This sprint is discovery + POC + report only

## Acceptance Criteria

- ✅ `/api/gelato/print-spec` returns structured JSON result
- ✅ Report explains clearly whether Gelato API provides what we need
- ✅ Recommendation provided for next step
- ⏳ **PENDING:** Actual API test with valid credentials (requires deployment or local testing)

## Conclusion

The POC infrastructure is complete and ready for testing. The test route will determine whether Gelato API provides print spec fields, and the parser is ready to convert them if available. If the API does not provide these fields, the template-driven approach is recommended as a fallback.

**Next Action:** Run the test route with valid Gelato API credentials to produce definitive results.

