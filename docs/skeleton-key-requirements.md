# Skeleton Key & QR Code Requirements

## Overview
Products with quantity > 1 (cards, invitations, postcards, announcements) **require** skeleton key templates and QR code placement before they can be saved.

## How Products Are Detected

A product requires skeleton key/QR setup if **any** of these conditions are met:

1. **Product Keywords**: Product name, categories, or tags contain:
   - "card"
   - "invitation"
   - "postcard"
   - "announcement"

2. **Custom Meta Field**: Product has custom meta field:
   - `_requires_qr_code` = `"yes"`

3. **Minimum Quantity**: Product has minimum quantity > 1:
   - `_min_quantity` > 1
   - `minimum_quantity` > 1
   - `_min_purchase_quantity` > 1

4. **Bulk Products**: Product is NOT sold individually (can have quantity > 1)

## Setting Up Products in WooCommerce

### Option 1: Use Product Keywords
Simply include keywords in the product name, category, or tags:
- "Wedding Invitation"
- "Holiday Card"
- "Birth Announcement"
- "Postcard Set"

### Option 2: Use Custom Meta Field
Add a custom field to your product:
- **Key**: `_requires_qr_code`
- **Value**: `yes`

### Option 3: Set Minimum Quantity
Set minimum quantity meta field:
- **Key**: `_min_quantity`
- **Value**: `2` (or any number > 1)

## Editor Behavior

When a product requires skeleton key/QR setup:

1. **QR Code Placement Section Appears**: The editor shows Step 8 with skeleton key and QR position options

2. **Validation Warning**: If skeleton key or QR position is not selected, a red warning box appears

3. **Save Validation**: When user tries to save:
   - If skeleton key or QR position is missing → Save is blocked
   - Error message: "Please select a skeleton key template and QR code position before saving"
   - Editor scrolls to QR Code Placement section

4. **Required Fields**:
   - ✅ Skeleton Key Template (must select one of 5 templates)
   - ✅ QR Code Position (must select one of 9 positions)

## Product Examples

### ✅ Requires Skeleton Key/QR:
- "Wedding Invitation Set" (has "invitation" keyword)
- "Holiday Greeting Cards" (has "card" keyword, quantity > 1)
- "Birth Announcement" (has "announcement" keyword)
- "Custom Postcards" (has "postcard" keyword)

### ❌ Does NOT Require:
- "Custom Canvas Print" (single item)
- "Framed Artwork" (sold individually)
- "Digital Download" (no physical product)

## Testing

To test if a product requires skeleton key/QR:

1. Create/edit a product in WooCommerce
2. Add one of the keywords or set the meta field
3. Open the ArtKey editor with that product
4. Verify the QR Code Placement section appears
5. Try to save without selecting skeleton key/QR position
6. Verify save is blocked with error message

## Customization

To customize which products require skeleton keys, modify:
- `app/api/woocommerce/products/[id]/route.ts` - Product detection logic
- `components/ArtKeyEditor.tsx` - Validation and UI

