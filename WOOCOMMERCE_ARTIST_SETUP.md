# WooCommerce Product-Artist Association Guide

## Overview

To ensure products appear on the correct artist/photographer/co-creator pages, you need to associate WooCommerce products with the appropriate artist in one of the following ways:

## Method 1: Product Categories (Recommended)

1. **Create Product Categories in WooCommerce:**
   - Go to WooCommerce → Products → Categories
   - Create categories matching artist slugs:
     - `deanna-lankin` (for Deanna Lankin's artwork)
     - `bryant-colman` (for Bryant Colman's photography)
     - `kimber-cross` (for Kimber Cross collaboration artwork)

2. **Assign Products to Categories:**
   - When creating/editing a product in WooCommerce
   - In the "Product Categories" section, select the appropriate artist category
   - Products will automatically appear on that artist's page

## Method 2: Product Tags

1. **Create Product Tags in WooCommerce:**
   - Go to Products → Tags
   - Create tags matching artist names or slugs:
     - `Deanna Lankin` or `deanna-lankin`
     - `Bryant Colman` or `bryant-colman`
     - `Kimber Cross` or `kimber-cross`

2. **Assign Tags to Products:**
   - When creating/editing a product
   - In the "Product Tags" section, add the artist tag
   - Products will appear on that artist's page

## Method 3: Custom Meta Fields (Advanced)

1. **Install a Custom Fields Plugin** (if not already installed):
   - Advanced Custom Fields (ACF)
   - Or use WooCommerce's built-in custom fields

2. **Add Custom Field:**
   - Field Name: `_artist_slug` or `artist`
   - Field Value: The artist slug (e.g., `deanna-lankin`, `bryant-colman`, `kimber-cross`)

3. **Set Field Value:**
   - When creating/editing a product
   - Set the custom field value to match the artist slug

## How It Works

The code checks products in this order:
1. **Product Categories** - Checks if category slug/name matches artist slug/name
2. **Product Tags** - Checks if tag slug/name matches artist slug/name  
3. **Custom Meta Fields** - Checks `_artist_slug`, `_artist_name`, or `artist` meta fields
4. **Fallback** - For Deanna Lankin only, checks product name for "first light" or "facing the storm" (temporary)

## Artist Slugs Reference

- **Deanna Lankin**: `deanna-lankin`
- **Bryant Colman**: `bryant-colman`
- **Kimber Cross**: `kimber-cross`

## Best Practice

**Use Product Categories** - This is the most reliable method and integrates well with WooCommerce's built-in features. You can also create sub-categories for different product types (e.g., "deanna-lankin > prints", "deanna-lankin > originals").

## Testing

After setting up products:
1. Visit the artist's page: `/gallery/deanna-lankin` or `/gallery/bryant-colman`
2. Check the "Available Artwork" or "Available Photography" section
3. Products should only appear if they're properly associated

## Troubleshooting

If products aren't showing up:
1. Check that the category/tag slug exactly matches the artist slug (case-insensitive)
2. Verify the product is published (not draft)
3. Check browser console for any API errors
4. Visit `/diagnostics` to test WooCommerce connection

