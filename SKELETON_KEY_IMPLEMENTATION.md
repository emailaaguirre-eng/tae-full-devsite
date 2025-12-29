# Skeleton Key (Placeholder QR Code) Implementation

## Overview
The "Skeleton Key" is a placeholder QR code element that can be added to product designs in PersonalizationStudio. It gets replaced with the actual QR code after order completion when the ArtKey token is generated.

## Why This Is Needed

### The Problem:
1. **QR Code Generation Timing**: QR code is generated AFTER order completion (when token is created)
2. **Design Submission Timing**: Design needs to be sent to Gelato BEFORE order completion
3. **Solution**: Use placeholder QR that gets replaced with real QR after order completion

## Implementation Plan

### 1. Add Skeleton Key to PersonalizationStudio

**Location**: `components/PersonalizationStudio.tsx`

**What to Add**:
- A new tool/button in the toolbar: "Add Skeleton Key" or "Add QR Placeholder"
- When clicked, adds a placeholder QR code image to the canvas
- Placeholder should be:
  - Visually distinct (e.g., grayed out, with "QR Code" text, or pattern)
  - Identifiable in the design data (special metadata)
  - Resizable and positionable like other elements
  - Same size as final QR code will be (e.g., 1" x 1" or 2" x 2")

**Implementation Steps**:

```typescript
// Add to toolbar tools
const addSkeletonKey = () => {
  // Create placeholder QR code image
  const placeholderQR = createPlaceholderQRCode();
  
  // Add to canvas as fabric.Image
  fabric.Image.fromURL(placeholderQR, (img) => {
    img.set({
      left: canvas.width / 2 - 50, // Center
      top: canvas.height - 100, // Bottom area
      scaleX: 1,
      scaleY: 1,
      // Mark as skeleton key for later replacement
      name: 'skeleton-key',
      type: 'skeleton-key',
      // Store metadata
      metadata: {
        isPlaceholder: true,
        placeholderType: 'qr-code',
        size: { width: 100, height: 100 }, // In pixels at 300 DPI
      }
    });
    
    canvas.add(img);
    canvas.renderAll();
  });
};

// Create placeholder QR code image (data URL)
const createPlaceholderQRCode = (): string => {
  // Option 1: Generate a simple pattern
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  
  // Draw placeholder pattern (checkerboard or pattern)
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, 200, 200);
  ctx.fillStyle = '#333';
  
  // Draw QR-like pattern
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      if ((i + j) % 2 === 0) {
        ctx.fillRect(i * 20, j * 20, 20, 20);
      }
    }
  }
  
  // Add text
  ctx.fillStyle = '#666';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('QR Code', 100, 100);
  ctx.fillText('Placeholder', 100, 120);
  
  return canvas.toDataURL('image/png');
};
```

### 2. Store Skeleton Key Metadata in Design Data

**When design is exported**, include skeleton key information:

```typescript
interface DesignOutput {
  imageDataUrl: string;
  imageBlob: Blob;
  dimensions: { width: number; height: number };
  dpi: number;
  productType: string;
  productSize: string;
  skeletonKeys?: Array<{
    id: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    placeholderType: 'qr-code';
  }>;
}
```

### 3. Workflow for QR Code Replacement

**After Order Completion** (when QR code is generated):

1. **Retrieve Design Data** from order meta
2. **Identify Skeleton Keys** in design data
3. **Generate Real QR Code** (already done by `artkey_generate_qr_code()`)
4. **Replace Placeholder** in design:
   - Load original design image
   - Find skeleton key positions
   - Replace placeholder with real QR code image
   - Export updated design
5. **Update Gelato Order** with new design file

**Implementation Location**: 
- Next.js API route: `/api/orders/update-design` or
- WordPress hook: After `artkey_woo_create_portal()` completes

### 4. QR Code Replacement Function

```typescript
// In Next.js API route or server-side function
async function replaceSkeletonKeyWithQR(
  designImageUrl: string,
  skeletonKeyData: SkeletonKeyData,
  qrCodeImageUrl: string
): Promise<Blob> {
  // Load original design
  const designImage = await loadImage(designImageUrl);
  
  // Load QR code
  const qrImage = await loadImage(qrCodeImageUrl);
  
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = designImage.width;
  canvas.height = designImage.height;
  const ctx = canvas.getContext('2d');
  
  // Draw original design
  ctx.drawImage(designImage, 0, 0);
  
  // Calculate QR position and size (convert from design coordinates)
  const qrX = skeletonKeyData.position.x;
  const qrY = skeletonKeyData.position.y;
  const qrWidth = skeletonKeyData.size.width;
  const qrHeight = skeletonKeyData.size.height;
  
  // Draw QR code over placeholder
  ctx.drawImage(qrImage, qrX, qrY, qrWidth, qrHeight);
  
  // Export as blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/png', 1.0);
  });
}
```

### 5. Update Gelato Order

**After replacing QR code**, update Gelato order:

```typescript
// In Next.js API route
async function updateGelatoOrderWithQR(
  gelatoOrderId: string,
  updatedDesignBlob: Blob
) {
  // Upload updated design to Gelato
  const fileUrl = await uploadImageToGelato(updatedDesignBlob);
  
  // Update Gelato order with new file
  // Note: Gelato API may need to support file updates
  // If not, may need to cancel and recreate order
  await updateGelatoOrder(gelatoOrderId, {
    files: [{ url: fileUrl, type: 'image/png' }]
  });
}
```

## Plugin Changes Needed

### ✅ No Changes Required to WordPress Plugins

The WordPress plugins (`artkey-core.php`, `artkey-woo.php`) don't need changes because:
- QR code generation already happens automatically
- The replacement workflow happens in Next.js/API layer
- Plugins just need to expose QR code URL (which they already do)

### Optional Enhancement

You could add a hook in `artkey-woo.php` to trigger design update:

```php
// After QR code is generated
add_action('artkey_qr_generated', function($token, $qr_url, $order_id) {
    // Trigger Next.js API to update design
    // This is optional - can be handled by Next.js webhook instead
}, 10, 3);
```

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Design Creation (PersonalizationStudio)             │
│ Customer adds "Skeleton Key" placeholder                     │
│ Design saved with skeleton key metadata                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Order Placement                                      │
│ Design with placeholder sent to Gelato                      │
│ Order created in WooCommerce                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Payment Complete                                     │
│ artkey-woo.php creates portal & generates QR                 │
│ QR code URL: https://yoursite.com/a/{token}                 │
│ QR image URL saved to order meta                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: QR Code Replacement (Next.js API)                    │
│ 1. Retrieve design from order meta                           │
│ 2. Retrieve skeleton key positions                           │
│ 3. Load QR code image                                        │
│ 4. Replace placeholder with real QR                         │
│ 5. Export updated design                                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Update Gelato Order                                  │
│ Upload updated design to Gelato                              │
│ Update Gelato order with new design file                     │
│ (If order hasn't started printing)                           │
└─────────────────────────────────────────────────────────────┘
```

## Important Considerations

### Timing Challenge

**Problem**: Gelato might start printing before QR code is ready

**Solutions**:

1. **Option A: Delay Gelato Order** (Recommended)
   - Don't send to Gelato immediately
   - Wait for order completion + QR generation
   - Then send complete design to Gelato
   - **Pros**: Simpler, ensures QR is always included
   - **Cons**: Slight delay in fulfillment

2. **Option B: Update Gelato Order**
   - Send design with placeholder immediately
   - After QR generation, update Gelato order if not started
   - **Pros**: Faster initial submission
   - **Cons**: May miss window if printing starts quickly

3. **Option C: Two-Pass Printing**
   - Gelato prints base design
   - QR code printed separately and attached
   - **Pros**: Always works
   - **Cons**: More complex, may not look as good

### Recommended Approach: Option A

**Implementation**:
- Store design in order meta (not sent to Gelato yet)
- After payment completion:
  1. Generate QR code (automatic)
  2. Replace skeleton key with real QR
  3. Send updated design to Gelato
  4. Create Gelato order

## Code Locations

### Files to Modify:

1. **`components/PersonalizationStudio.tsx`**
   - Add skeleton key tool/button
   - Add `addSkeletonKey()` function
   - Add `createPlaceholderQRCode()` function
   - Update design export to include skeleton key metadata

2. **`app/api/orders/create/route.ts`** (or new route)
   - Add function to replace skeleton keys
   - Add function to update Gelato order
   - Call after QR generation

3. **`lib/gelato.ts`**
   - Add `updateGelatoOrder()` function (if Gelato API supports it)

### New Files to Create:

1. **`lib/qr-replacement.ts`**
   - `replaceSkeletonKeyWithQR()` function
   - Image manipulation utilities

2. **`app/api/orders/update-design/route.ts`**
   - API endpoint to handle design updates
   - Called after QR generation

## Testing Checklist

- [ ] Skeleton key can be added to design
- [ ] Skeleton key is visible and positionable
- [ ] Skeleton key metadata is saved with design
- [ ] Design with skeleton key can be exported
- [ ] QR code generation works after order completion
- [ ] Skeleton key can be identified in design data
- [ ] QR code replacement works correctly
- [ ] Updated design is exported properly
- [ ] Gelato order can be updated with new design
- [ ] Final printed product has real QR code

## Summary

**Yes, this is possible!** The Skeleton Key feature:
- ✅ Can be added to PersonalizationStudio
- ✅ No plugin changes needed (handled in Next.js)
- ✅ Works with existing QR generation workflow
- ✅ Provides seamless user experience

The main implementation work is in:
1. PersonalizationStudio (add skeleton key tool)
2. Next.js API (replace placeholder with real QR)
3. Gelato integration (update order with new design)

This is a Next.js/design workflow feature, not a WordPress plugin feature.

