# Gelato Print Specifications POC

## Overview
This document tracks the proof-of-concept verification of Gelato API print specifications integration.

## Phase 1: Verification (Current)

### Goal
Verify what print specification data Gelato API actually provides, without making assumptions.

### Implementation

1. **Verification Endpoint**: `/api/gelato/test-print-specs`
   - Fetches raw product data from Gelato API
   - Parses and logs the response structure
   - Attempts to extract: dimensions, bleed, trim, safe zones, fold info
   - Converts units (mm/in) to pixels at 300 DPI
   - Outputs normalized PrintSpec-like object

2. **Test Command**:
   ```bash
   # Example: Test with a known greeting card product UID
   curl "http://localhost:3000/api/gelato/test-print-specs?productUid=cards_pf_a5_pt_350-gsm-coated-silk_cl_4-4_ver"
   ```

3. **What to Check**:
   - Server console logs show the raw API response structure
   - Response JSON shows what fields were successfully parsed
   - Summary indicates which fields are available (dimensions, bleed, trim, safe, fold)

### Known Gelato Product UIDs for Testing

Based on Gelato documentation patterns:
- Greeting Cards: `cards_pf_a5_pt_350-gsm-coated-silk_cl_4-4_ver`
- Other formats: Check Gelato Dashboard for actual UIDs

### Expected Output Structure

```json
{
  "success": true,
  "productUid": "...",
  "summary": {
    "hasDimensions": true/false,
    "hasBleed": true/false,
    "hasTrim": true/false,
    "hasSafeZone": true/false,
    "hasFold": true/false,
    "dimensions": { ... },
    "bleed": { ... },
    "safeZone": { ... },
    "fold": { ... }
  },
  "normalizedSpec": {
    "id": "gelato_...",
    "name": "...",
    "sides": [{
      "id": "front",
      "canvasPx": { "w": ..., "h": ... },
      "bleedPx": ...,
      "trimPx": ...,
      "safePx": ...,
      "foldLines": [ ... ]
    }]
  },
  "rawResponse": { ... }
}
```

## Phase 2: Integration (Future - Only if Phase 1 succeeds)

If Phase 1 verification shows that Gelato provides:
- ✅ Dimensions
- ✅ Bleed requirements
- ✅ Safe zones
- ✅ Fold information (for cards)

Then we will:
1. Add `GelatoSpecOverride` layer to `getPrintSpecForProduct()`
2. Fetch Gelato specs when variant UID is available
3. Fall back to hardcoded specs if fetch fails
4. Keep hardcoded specs as default until verified for multiple formats

## Notes

- **Do NOT assume** Gelato provides bleed/trim/safe/fold until verified
- Field names in parser are educated guesses - actual API structure may differ
- Unit conversion assumes mm (Gelato standard) but handles inches too
- This is server-side only (no client exposure of API keys)

## Testing Checklist

- [ ] Test with at least one greeting card product UID
- [ ] Verify raw response structure in server logs
- [ ] Confirm which fields are actually present
- [ ] Verify unit conversion (mm → pixels) is correct
- [ ] Document actual field names from Gelato API
- [ ] Test with multiple product types if available

