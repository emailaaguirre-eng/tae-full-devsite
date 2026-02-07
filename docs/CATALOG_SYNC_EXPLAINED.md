# Catalog Sync - How It Works

## What's "Hardcoded" vs "Dynamic"

### ✅ Hardcoded (What You Specify)
- **Catalog List Only**: Which Gelato catalogs to sync (cards, postcards, invitations, etc.)
- This is in `RELEVANT_CATALOGS` in `lib/gelato/sync.ts`

### ✅ Dynamic (Updated from Gelato API)
- **ALL Products**: Every product from those catalogs
- **Product Details**: Pricing, dimensions, availability, attributes
- **Availability Status**: `isPrintable`, `productStatus` (activated/deactivated)
- **New Products**: Automatically added when Gelato adds them
- **Changes**: Automatically updated when Gelato changes them

## How the Sync Process Works

### Step 1: Sync Catalogs
```
1. Fetch catalog list from Gelato API
2. Filter to only RELEVANT_CATALOGS (cards, postcards, etc.)
3. For each catalog:
   - Fetch catalog details (attributes, options)
   - Upsert to database (update if exists, create if new)
```

### Step 2: Sync Products
```
For each catalog:
  1. Fetch ALL products from Gelato API (pagination)
  2. For each product:
     - Parse product UID to extract attributes
     - Fetch full product details (dimensions, pricing, availability)
     - UPSERT to database:
       - If product exists: UPDATE all fields
       - If product is new: INSERT new record
     - Updates include:
       * isPrintable (availability)
       * productStatus (activated/deactivated/deprecated)
       * Dimensions (widthMm, heightMm)
       * Pricing (from attributes)
       * Attributes (paper type, coating, etc.)
```

## The `upsert` Operation

The sync uses database `upsert` which means:

```typescript
await prisma.gelatoProduct.upsert({
  where: { productUid: product.productUid },  // Find by unique ID
  create: { /* new product */ },              // Insert if doesn't exist
  update: { /* update all fields */ },        // Update if exists
});
```

**This means:**
- ✅ New products from Gelato → Automatically added
- ✅ Updated products from Gelato → Automatically updated
- ✅ Changed availability → `isPrintable` updated
- ✅ Changed status → `productStatus` updated
- ✅ Changed pricing → Attributes updated
- ✅ Changed dimensions → Dimensions updated

## What Gets Updated

Every sync updates these fields for ALL products:

| Field | What It Updates |
|-------|----------------|
| `isPrintable` | ✅ Availability status from Gelato |
| `productStatus` | ✅ Activated/deactivated/deprecated |
| `widthMm`, `heightMm` | ✅ Product dimensions |
| `weightGrams` | ✅ Product weight |
| `attributesJson` | ✅ All attributes (pricing, options) |
| `dimensionsJson` | ✅ Full dimension details |
| `lastSyncedAt` | ✅ Timestamp of last update |

## Example: What Happens When Gelato Changes a Product

**Scenario:** Gelato discontinues a specific card size

1. **Gelato API**: Sets `isPrintable: false` for that product
2. **Next Sync** (3-4 hours later):
   - Fetches product from Gelato API
   - Sees `isPrintable: false`
   - Updates database: `isPrintable = false`
3. **Your System**:
   - Product no longer shows as available
   - Orders for that product are blocked
   - No hardcoding needed - automatic!

## Example: New Product Added by Gelato

**Scenario:** Gelato adds a new card size

1. **Gelato API**: New product appears in catalog
2. **Next Sync**:
   - Fetches all products (including new one)
   - Product not found in database
   - Creates new record with all details
3. **Your System**:
   - New product automatically available
   - No code changes needed!

## Summary

✅ **Catalog list = Hardcoded** (you choose which categories to sync)  
✅ **Products = Fully Dynamic** (synced from Gelato API)  
✅ **Updates = Automatic** (upsert updates all fields)  
✅ **New Products = Automatic** (added when Gelato adds them)  
✅ **Changes = Automatic** (availability, pricing, dimensions all updated)

**You don't need to hardcode products.** The sync process keeps everything up-to-date automatically!
