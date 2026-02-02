# WooCommerce Product Integration Guide

## How Products Connect to the Website

### Current Flow

1. **WooCommerce Product** → Stored in WordPress/WooCommerce
2. **Website Display** → Products shown via `FeaturedProducts` component
3. **User Clicks "Customize"** → Redirects to `/customize?product_id=XXX`
4. **ArtKey Editor** → Opens with product context
5. **Product Info Fetched** → Via `/api/woocommerce/products/[id]`

## Setting Up Products in WooCommerce

### Step 1: Create/Edit Product in WooCommerce

1. Go to **WooCommerce → Products → Add New** (or edit existing)
2. Fill in basic product information:
   - **Product Name**: e.g., "Wedding Invitation Set"
   - **Description**: Product description
   - **Price**: Product price
   - **Images**: Product images

### Step 2: Configure Product for ArtKey Integration

#### For Products Requiring Skeleton Keys (Cards, Invitations, etc.)

**Option A: Use Keywords** (Easiest)
- Include one of these keywords in **Product Name**, **Category**, or **Tags**:
  - `card`
  - `invitation`
  - `postcard`
  - `announcement`

**Option B: Use Custom Meta Field**
1. Scroll to **Product Data** section
2. Click **Custom Fields** (if not visible, enable in Screen Options)
3. Add new custom field:
   - **Name**: `_requires_qr_code`
   - **Value**: `yes`
4. Click **Add Custom Field**

**Option C: Set Minimum Quantity**
1. In **Product Data** → **General** tab
2. Set **Minimum Quantity** to `2` or higher
3. OR add custom field:
   - **Name**: `_min_quantity`
   - **Value**: `2` (or any number > 1)

#### For Regular Products (No Skeleton Key Required)
- No special configuration needed
- Just create the product normally

### Step 3: Product Categories & Tags (Optional but Recommended)

**Categories:**
- Create categories like:
  - "Cards & Invitations"
  - "Postcards"
  - "Announcements"
  - "Prints"
  - "Artwork"

**Tags:**
- Add relevant tags for better organization:
  - "artkey-enabled"
  - "customizable"
  - "qr-code"

### Step 4: Product Images

- Upload high-quality product images
- First image is used as the main product image
- Images are displayed in the `FeaturedProducts` component

## How Products Appear on the Website

### Product Display

Products are fetched and displayed via:
- **Component**: `components/FeaturedProducts.tsx`
- **API Route**: `/api/products` (fetches from WooCommerce)
- **Display Location**: Various pages (home, gallery, etc.)

### Product Linking

When a user clicks **"Customize"** on a product:

```javascript
// Current implementation
window.location.href = `/customize?product_id=${productId}&product_type=${type}&product_name=${name}&price=${price}`;
```

This redirects to the customize page with product context.

## Product-to-Editor Flow

### URL Parameters

The ArtKey editor reads these URL parameters:

- `product_id`: WooCommerce product ID (required)
- `from_shop`: Set to `"true"` when coming from shop
- `from_customize`: Set to `"true"` when coming from customize page

### Editor Access

The editor can be accessed via:
- `/art-key/editor?product_id=XXX&from_shop=true`
- `/artkey-editor?product_id=XXX&from_customize=true`

### Product Info Fetching

When the editor loads with a `product_id`:

1. **Fetches Product**: `GET /api/woocommerce/products/[id]`
2. **Checks Requirements**: Determines if skeleton key/QR is required
3. **Loads Product Info**: Sets `productInfo` state
4. **Shows QR Section**: If `productInfo.requiresQR === true`

## WooCommerce API Configuration

### Required Environment Variables

Add these to your `.env` file:

```env
# WooCommerce API Credentials
NEXT_PUBLIC_WOOCOMMERCE_URL=https://your-wordpress-site.com
# OR
NEXT_PUBLIC_WORDPRESS_URL=https://your-wordpress-site.com

# WooCommerce REST API Keys
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxxxxxxxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxxxxxxxxxx
```

### Getting WooCommerce API Keys

1. Go to **WooCommerce → Settings → Advanced → REST API**
2. Click **Add Key**
3. Set:
   - **Description**: "Next.js Website Integration"
   - **User**: Select an admin user
   - **Permissions**: **Read/Write**
4. Click **Generate API Key**
5. Copy **Consumer Key** and **Consumer Secret**
6. Add to `.env` file

## Testing Product Integration

### Test Checklist

1. **Product Creation**:
   - [ ] Create a product in WooCommerce
   - [ ] Add product name with keyword (e.g., "Holiday Card")
   - [ ] Save product

2. **Product Display**:
   - [ ] Visit website page with `FeaturedProducts` component
   - [ ] Verify product appears in the list
   - [ ] Verify product image, name, price display correctly

3. **Product Linking**:
   - [ ] Click "Customize" button on product
   - [ ] Verify redirects to `/customize?product_id=XXX`
   - [ ] Verify product ID is in URL

4. **Editor Integration**:
   - [ ] Editor should load with product context
   - [ ] Product info should be fetched
   - [ ] If product requires QR, skeleton key section should appear
   - [ ] Product ID should be saved with ArtKey

## Common Issues & Solutions

### Issue: Products Not Appearing

**Solution:**
- Check WooCommerce API credentials in `.env`
- Verify API keys have correct permissions
- Check browser console for API errors
- Verify product is published in WooCommerce

### Issue: Skeleton Key Section Not Showing

**Solution:**
- Verify product has required keywords or meta field
- Check product API response includes `requiresQR: true`
- Check browser console for product fetch errors
- Verify product ID is passed correctly in URL

### Issue: Product Info Not Loading

**Solution:**
- Check `/api/woocommerce/products/[id]` route
- Verify WooCommerce API is accessible
- Check network tab for failed requests
- Verify product ID is valid

## Product Meta Fields Reference

### Custom Meta Fields You Can Use

| Meta Key | Value | Purpose |
|----------|-------|---------|
| `_requires_qr_code` | `"yes"` | Force product to require skeleton key/QR |
| `_min_quantity` | `"2"` | Set minimum quantity (triggers QR requirement) |
| `minimum_quantity` | `"2"` | Alternative minimum quantity field |
| `_min_purchase_quantity` | `"2"` | Alternative minimum quantity field |

### Product Data Fields

The product API returns:
- `id`: Product ID
- `name`: Product name
- `price`: Product price
- `description`: Product description
- `images`: Product images array
- `categories`: Product categories
- `tags`: Product tags
- `meta_data`: Custom meta fields array
- `requiresQR`: Boolean (calculated)
- `requiresSkeletonKey`: Boolean (calculated)
- `minQuantity`: Number (if set)
- `canHaveMultipleQuantity`: Boolean

## Best Practices

1. **Product Naming**: Use descriptive names with keywords
   - ✅ "Wedding Invitation Set"
   - ✅ "Holiday Greeting Cards"
   - ❌ "Product 123"

2. **Categories**: Organize products into logical categories
   - Cards & Invitations
   - Postcards
   - Announcements
   - Prints & Artwork

3. **Tags**: Use tags for filtering and organization
   - `artkey-enabled`
   - `customizable`
   - `qr-code-required`

4. **Images**: Use high-quality product images
   - Minimum 800x800px recommended
   - Square or 4:3 aspect ratio works best

5. **Descriptions**: Include clear product descriptions
   - Helps with SEO
   - Helps customers understand the product

## Next Steps

After setting up products:

1. **Test the flow**: Create a test product and verify end-to-end
2. **Configure skeleton keys**: Ensure skeleton key templates are set up
3. **Test QR generation**: Verify QR codes generate correctly
4. **Test order flow**: Ensure orders include ArtKey data

## Support

If you encounter issues:
1. Check browser console for errors
2. Check server logs for API errors
3. Verify WooCommerce API credentials
4. Test API endpoint directly: `/api/woocommerce/products/[id]`

