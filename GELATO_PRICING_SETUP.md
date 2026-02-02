# Gelato Pricing Integration

## Current Status

**⚠️ IMPORTANT**: The prices currently in the code are **placeholder/hardcoded** values, NOT actual Gelato costs.

### Current Hardcoded Prices:

#### Cards:
- 4x6: $12.99
- 5x7: $15.99
- 6x9: $19.99
- Paper types: $0-$2.00 (mostly included)
- Foil: $5.00-$6.00

#### Prints:
- 5x7: $9.99
- 8x10: $14.99
- 11x14: $24.99
- 16x20: $39.99
- 20x24: $59.99
- 24x36: $89.99
- Materials: $0-$35.00
- Frames: $0-$6.00

## Gelato API Pricing

The Gelato API **should** provide pricing information, but you need to:

1. **Check Gelato API Documentation** for pricing endpoints
2. **Fetch real prices** from Gelato API
3. **Update hardcoded values** with actual costs

### Possible Gelato API Endpoints for Pricing:

1. **Product Details** (`GET /v4/products/{productUid}`)
   - May include base price
   - May include option pricing

2. **Quote Endpoint** (`POST /v4/quotes` or similar)
   - Calculate price with options
   - May require product UID + options

3. **Product Catalog** (`GET /v4/products`)
   - May include pricing in product list
   - May need to parse Product UID for pricing tier

## Implementation Steps

### Step 1: Test Gelato API for Pricing

```typescript
// Test what Gelato API returns
const testGelatoPricing = async () => {
  // Get a product
  const products = await getGelatoProducts();
  console.log('Products:', products);
  
  // Get product details
  const productUid = 'cards_cl_dtc_prt_pt';
  const details = await getGelatoProductDetails(productUid);
  console.log('Product Details:', details);
  
  // Check for pricing fields
  console.log('Price fields:', {
    price: details.price,
    pricing: details.pricing,
    cost: details.cost,
    basePrice: details.basePrice,
    options: details.options
  });
};
```

### Step 2: Create Pricing Cache/Config

**Option A: Fetch from API (Recommended)**
- Fetch prices on app load or product selection
- Cache prices to reduce API calls
- Update periodically

**Option B: Manual Configuration**
- Get actual prices from Gelato dashboard
- Update hardcoded values
- Set up periodic review process

### Step 3: Update Price Display

```typescript
// Instead of hardcoded prices, fetch from API or config
const [productPrices, setProductPrices] = useState<Record<string, number>>({});

useEffect(() => {
  // Fetch prices from Gelato API or config
  fetchGelatoPrices().then(prices => {
    setProductPrices(prices);
  });
}, []);
```

## Action Required

**Before going live, you MUST:**

1. ✅ **Get actual Gelato prices** for all products
2. ✅ **Update hardcoded prices** in `app/customize/page.tsx`
3. ✅ **Or implement API pricing** to fetch dynamically
4. ✅ **Test pricing accuracy** before launch

## Current Price Locations

All prices are hardcoded in:
- `app/customize/page.tsx`:
  - `printSizes` array (lines ~105-110)
  - `materials` array (lines ~113-117)
  - `frameColors` array (lines ~120-124)
  - `cardSizes` array (lines ~126-130)
  - `cardPaperTypes` array (lines ~132-137)
  - `foilColors` array (lines ~139-144)

## Next Steps

1. **Contact Gelato** to get:
   - Actual product pricing
   - Pricing API documentation
   - Pricing structure (base + options)

2. **Update prices** in code with real values

3. **Consider** implementing dynamic pricing from API if available

4. **Add margin** to Gelato costs if needed for your business model

