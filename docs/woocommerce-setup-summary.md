# WooCommerce Product Setup - Quick Reference

## ✅ YES - This Will Work With Your Current Setup

Based on your codebase, here's how products connect:

### Current Flow (Already Implemented)

1. **Products in WooCommerce** → Stored in WordPress/WooCommerce database

2. **Website Fetches Products** → 
   - API: `/api/products` 
   - Function: `getWooCommerceProducts()` from `lib/wordpress.ts`
   - Uses WooCommerce REST API v3 (with auth) or Store API (public)

3. **Products Displayed** → 
   - Component: `FeaturedProducts.tsx`
   - Pages: Gallery pages, Cocreator pages, etc.

4. **User Clicks "Customize"** → 
   - Links to: `/customize?product_id=XXX&product_name=...&price=...`
   - **Note**: You may need to create this page or have it redirect to editor

5. **Editor Opens** → 
   - Route: `/art-key/editor`
   - Reads: `product_id` from URL params
   - Fetches: Product info from `/api/woocommerce/products/[id]`
   - Checks: If product requires skeleton key/QR

6. **Skeleton Key Section** → 
   - Appears if: `productInfo.requiresQR === true`
   - Required: User must select skeleton key and QR position before saving

## What You Need to Do in WooCommerce

### For Cards, Invitations, Postcards, Announcements:

**Easiest Method - Use Keywords:**
- Include one of these in Product Name, Category, or Tags:
  - "card"
  - "invitation"
  - "postcard"
  - "announcement"

**Example Product Names:**
- ✅ "Wedding Invitation Set"
- ✅ "Holiday Greeting Cards"
- ✅ "Birth Announcement"
- ✅ "Custom Postcard"

### Alternative Methods:

**Custom Meta Field:**
- Key: `_requires_qr_code`
- Value: `yes`

**Minimum Quantity:**
- Key: `_min_quantity`
- Value: `2` (or any number > 1)

## Required WooCommerce API Setup

Add to `.env`:

```env
NEXT_PUBLIC_WOOCOMMERCE_URL=https://your-wordpress-site.com
# OR
NEXT_PUBLIC_WORDPRESS_URL=https://your-wordpress-site.com

WOOCOMMERCE_CONSUMER_KEY=ck_xxxxxxxxxxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxxxxxxxxxx
```

**Get API Keys:**
1. WooCommerce → Settings → Advanced → REST API
2. Add Key → Set permissions to Read/Write
3. Generate → Copy keys to `.env`

## Potential Issue: `/customize` Page

**Current Status:**
- Products link to `/customize?product_id=XXX`
- Editor is at `/art-key/editor`
- `/customize` page may not exist

**Solution Options:**

**Option 1: Create `/customize` Page** (Recommended)
- Create `app/customize/page.tsx`
- Read `product_id` from URL
- Redirect to `/art-key/editor?product_id=XXX&from_customize=true`

**Option 2: Update Product Links**
- Change all product links to go directly to editor
- Update `FeaturedProducts.tsx` and gallery pages
- Change from: `/customize?product_id=XXX`
- Change to: `/art-key/editor?product_id=XXX&from_shop=true`

## Verification

To verify it's working:

1. **Create a test product** in WooCommerce with "card" in the name
2. **Visit your website** - product should appear
3. **Click "Customize"** - should open editor
4. **Check editor** - skeleton key section should appear
5. **Try to save** without selecting skeleton key - should be blocked

## Summary

✅ **Already Working:**
- Product fetching from WooCommerce
- Product display
- Editor integration
- Skeleton key detection
- Validation

⚠️ **May Need:**
- `/customize` page creation (or update links to go directly to editor)

The system is set up correctly - you just need to:
1. Configure WooCommerce API credentials
2. Create products with keywords or meta fields
3. Optionally create `/customize` page if it doesn't exist

