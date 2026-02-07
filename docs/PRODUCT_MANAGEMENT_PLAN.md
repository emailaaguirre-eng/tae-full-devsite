# Product Management Plan - Gelato API Integration

## Overview

Moving product customization from WooCommerce to the website, with product creation and management in the admin portal using Gelato API.

## Current Flow (WooCommerce)

1. Product in WooCommerce
2. Customer clicks "Customize"
3. Redirects to `/customize?product_id=...`
4. Goes to ArtKey editor
5. Saves ArtKey
6. Adds to cart
7. Checkout (WooCommerce)

## New Flow (Website-Based)

1. **Admin creates product** (using Gelato API) → Admin Portal
2. **Product displayed** on website → Custom product pages
3. **Customer clicks "Customize"** → `/customize?product_id=...`
4. **ArtKey editor** → Design ArtKey
5. **Saves ArtKey** → Database
6. **Adds to cart** → Cart
7. **Checkout** → Payment** (website, not WooCommerce)

## What Needs to Be Built

### 1. Admin Portal - Product Management

**Location:** `/b_d_admn_tae/products` (new page)

**Features:**
- List all products
- Create new product (using Gelato API)
- Edit product
- Delete product
- View product details

**Product Creation Form:**
- Product name
- Description
- Product type (card, print, poster, etc.)
- Size/dimensions
- Price
- Gelato product ID/catalog reference
- Images
- Skeleton key requirements (if applicable)
- QR code requirements (if applicable)

**Gelato API Integration:**
- Fetch available products from Gelato
- Create product in Gelato catalog
- Get product specifications
- Pricing information

### 2. Product Pages

**Location:** `/products` (product listing)
**Location:** `/products/[slug]` (product detail page)

**Features:**
- Display all products
- Product cards with images
- Filter by category/type
- Search functionality
- "Customize" button → `/customize?product_id=...`

**Product Detail Page:**
- Product images
- Description
- Specifications
- Pricing
- Size options
- "Customize" button
- Related products

### 3. Customization Flow (Already Exists)

**Current:** `/customize` → `/art-key/editor`
**Status:** ✅ Already working
**Needs:** Update to use website products instead of WooCommerce

### 4. Cart & Checkout

**Current:** Cart context exists
**Needs:**
- Update to work with website products
- Checkout page (up to payment)
- Payment integration (later)

## Implementation Plan

### Phase 1: Admin Product Management

1. **Create Admin Products Page**
   - `/app/b_d_admn_tae/products/page.tsx`
   - List products
   - Create product button

2. **Create Product Form**
   - `/app/b_d_admn_tae/products/new/page.tsx`
   - Form with Gelato API integration
   - Save to database (new Product model)

3. **Gelato API Integration**
   - Update `lib/gelato.ts`
   - Functions to:
     - Fetch Gelato products
     - Create product in Gelato
     - Get product details
     - Get pricing

4. **Database Model**
   - Add Product model to Prisma schema
   - Fields: name, description, type, size, price, gelatoId, images, etc.

### Phase 2: Product Pages

1. **Product Listing Page**
   - `/app/products/page.tsx`
   - Display all products
   - Filter/search

2. **Product Detail Page**
   - `/app/products/[slug]/page.tsx`
   - Product details
   - Customize button
   - Add to cart

3. **Update Customize Flow**
   - Update `/app/customize/page.tsx`
   - Use website products instead of WooCommerce

### Phase 3: Cart & Checkout

1. **Update Cart Context**
   - Work with website products
   - Store product + ArtKey data

2. **Checkout Page**
   - `/app/checkout/page.tsx`
   - Review order
   - Shipping info
   - Payment (placeholder for now)

## Database Schema Addition

```prisma
model Product {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  description String?
  type        String   // card, print, poster, etc.
  category    String?
  price       Float
  images      String   // JSON array of image URLs
  specifications String? // JSON: size, dimensions, etc.
  gelatoId    String?  // Gelato product ID
  gelatoData  String?  // JSON: Gelato product data
  requiresQR  Boolean  @default(false)
  requiresSkeletonKey Boolean @default(false)
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  cartItems   CartItem[]
  orderItems  OrderItem[]
}
```

## Gelato API Integration

### Functions Needed:

```typescript
// lib/gelato.ts

// Fetch available products from Gelato catalog
export async function getGelatoProducts()

// Get product details from Gelato
export async function getGelatoProduct(productId: string)

// Create product in Gelato (if needed)
export async function createGelatoProduct(productData)

// Get pricing for product
export async function getGelatoPricing(productId, quantity, options)
```

## File Structure

```
app/
  products/
    page.tsx              # Product listing
    [slug]/
      page.tsx            # Product detail
  b_d_admn_tae/
    products/
      page.tsx            # Admin product list
      new/
        page.tsx          # Create product
      [id]/
        page.tsx          # Edit product
  customize/
    page.tsx              # Already exists, update to use website products
  checkout/
    page.tsx              # Checkout (up to payment)
```

## Testing Flow

1. **Admin creates product** → `/b_d_admn_tae/products/new`
2. **Product appears** → `/products`
3. **Customer views product** → `/products/[slug]`
4. **Customer clicks "Customize"** → `/customize?product_id=...`
5. **Designs ArtKey** → `/art-key/editor`
6. **Saves ArtKey** → Database
7. **Adds to cart** → Cart context
8. **Goes to checkout** → `/checkout`
9. **Reviews order** → (payment placeholder)

## Next Steps

1. ✅ Confirm deployment is safe (it is!)
2. ✅ Test current flow up to checkout
3. ⏳ Build admin product management
4. ⏳ Build product pages
5. ⏳ Update customization flow
6. ⏳ Update cart/checkout
7. ⏳ Add payment integration (later)

## Questions to Confirm

1. **Product data source:**
   - Store products in database?
   - Or fetch from Gelato API each time?
   - Or both (cache in database, sync with Gelato)?

2. **Product creation:**
   - Admin creates in website, then syncs to Gelato?
   - Or admin selects from Gelato catalog?

3. **Pricing:**
   - Fixed price per product?
   - Or dynamic from Gelato API?

4. **Product images:**
   - Upload to website?
   - Or use Gelato product images?

Let me know your preferences and I'll implement accordingly!

