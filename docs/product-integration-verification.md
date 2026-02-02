# Product Integration Verification

## Current Website Setup

### ✅ What's Already Working

1. **Product Fetching**:
   - Products are fetched from WooCommerce via `/api/products`
   - Uses `getWooCommerceProducts()` from `lib/wordpress.ts`
   - Supports both authenticated (REST API v3) and public (Store API) access

2. **Product Display**:
   - Products displayed via `FeaturedProducts` component
   - Products shown on gallery pages (`/gallery/[slug]`)
   - Products shown on cocreator pages (`/cocreators/[slug]`)

3. **Product Linking**:
   - Products link to `/customize?product_id=XXX&product_name=...&price=...`
   - **Note**: `/customize` page may need to be created or redirects to editor

4. **Editor Access**:
   - Editor is at `/art-key/editor`
   - Editor reads `product_id` from URL params
   - Editor fetches product info from `/api/woocommerce/products/[id]`
   - Editor checks if product requires skeleton key/QR

5. **Product Detection**:
   - API route `/api/woocommerce/products/[id]` detects if product requires QR
   - Checks for keywords: "card", "invitation", "postcard", "announcement"
   - Checks for custom meta field: `_requires_qr_code`
   - Checks for minimum quantity > 1

### ⚠️ Potential Issues

1. **Missing `/customize` Page**:
   - Products link to `/customize?product_id=XXX`
   - But no customize page was found in the codebase
   - **Solution**: Either create the page or update product links to go directly to `/art-key/editor?product_id=XXX&from_shop=true`

2. **Product Info Loading**:
   - Editor fetches product info on mount
   - If API fails, skeleton key section won't appear
   - **Solution**: Ensure WooCommerce API credentials are configured

## How It Works (Current Flow)

```
WooCommerce Product
    ↓
Website Display (FeaturedProducts component)
    ↓
User clicks "Customize"
    ↓
Redirects to: /customize?product_id=XXX
    ↓
[Missing: /customize page - should redirect to editor]
    ↓
Editor at: /art-key/editor?product_id=XXX
    ↓
Editor fetches: /api/woocommerce/products/XXX
    ↓
Product info loaded → checks requiresQR
    ↓
If requiresQR → Shows skeleton key/QR section
    ↓
User designs ArtKey → Saves
    ↓
ArtKey saved with product_id and customizations
```

## What You Need to Do in WooCommerce

### For Products Requiring Skeleton Keys (Cards, Invitations, etc.)

**Method 1: Use Keywords** (Recommended)
- Add to Product Name, Category, or Tags:
  - "card"
  - "invitation"  
  - "postcard"
  - "announcement"

**Method 2: Use Custom Meta Field**
- Add custom field:
  - Key: `_requires_qr_code`
  - Value: `yes`

**Method 3: Set Minimum Quantity**
- Add custom field:
  - Key: `_min_quantity`
  - Value: `2` (or any number > 1)

### For Regular Products
- No special configuration needed
- Just create product normally

## Verification Checklist

### ✅ Setup Verification

1. **WooCommerce API Configuration**:
   - [ ] `NEXT_PUBLIC_WOOCOMMERCE_URL` or `NEXT_PUBLIC_WORDPRESS_URL` set in `.env`
   - [ ] `WOOCOMMERCE_CONSUMER_KEY` set in `.env`
   - [ ] `WOOCOMMERCE_CONSUMER_SECRET` set in `.env`
   - [ ] API keys have Read/Write permissions

2. **Product Setup**:
   - [ ] Product created in WooCommerce
   - [ ] Product is published
   - [ ] Product has images
   - [ ] If requiring skeleton key, has keywords or meta field

3. **Website Integration**:
   - [ ] Products appear on website (via FeaturedProducts)
   - [ ] "Customize" button works
   - [ ] Editor loads with product context
   - [ ] Skeleton key section appears (if product requires it)

### 🔧 Testing Steps

1. **Test Product Display**:
   ```
   Visit: Your website page with products
   Verify: Products appear in list
   ```

2. **Test Product Linking**:
   ```
   Click: "Customize" on a product
   Verify: Redirects to /customize or /art-key/editor with product_id
   ```

3. **Test Editor Integration**:
   ```
   Open: /art-key/editor?product_id=XXX&from_shop=true
   Verify: Product info loads
   Verify: If product requires QR, skeleton key section appears
   ```

4. **Test Skeleton Key Requirement**:
   ```
   Create product with "card" in name
   Open editor for that product
   Verify: Skeleton key section appears
   Try to save without selecting skeleton key
   Verify: Save is blocked with error message
   ```

## Missing Pieces (If Any)

### If `/customize` Page Doesn't Exist

You have two options:

**Option A: Create `/customize` Page**
- Create `app/customize/page.tsx`
- Read `product_id` from URL params
- Redirect to `/art-key/editor?product_id=XXX&from_customize=true`

**Option B: Update Product Links**
- Change product links to go directly to editor:
  - From: `/customize?product_id=XXX`
  - To: `/art-key/editor?product_id=XXX&from_shop=true`

## Current Status

✅ **Working**:
- Product fetching from WooCommerce
- Product display on website
- Editor reads product_id from URL
- Product info fetching
- Skeleton key requirement detection
- Validation for skeleton key/QR setup

⚠️ **Needs Verification**:
- `/customize` page existence (may need to be created)
- Product linking flow (may need to redirect to editor)

## Next Steps

1. **Verify `/customize` page exists** or create it
2. **Test product flow** end-to-end
3. **Configure products** in WooCommerce with keywords/meta fields
4. **Test skeleton key requirement** works correctly

