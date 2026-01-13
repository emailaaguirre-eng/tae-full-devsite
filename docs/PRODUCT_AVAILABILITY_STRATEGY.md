# Product Availability Strategy

This document outlines how to ensure product availability accuracy and prevent orders for unavailable products.

## Overview

To prevent orders for products that are no longer available from Gelato, we use a **multi-layer validation approach**:

1. **Database Validation** - Fast check against cached `isPrintable` status
2. **Real-time API Check** - Live availability check via Gelato API
3. **Pre-submission Validation** - Final check before order submission

## Validation Layers

### 1. Database Validation (Fast Check)

The database caches product availability via the `GelatoProduct` model:
- `isPrintable`: Boolean indicating if product can be printed
- `productStatus`: 'activated' | 'deactivated' | 'deprecated'

**When to use:**
- Quick filtering in product listings
- Pre-checkout validation (fast response)
- Fallback if Gelato API is unavailable

**How to update:**
- Run catalog sync regularly (see "Catalog Sync Strategy" below)
- Updates automatically when `isPrintable` changes in Gelato

### 2. Real-time API Validation (Accurate Check)

Use the Gelato Stock Availability API for real-time checks:
- Endpoint: `POST /api/products/validate-availability`
- Checks both database AND live Gelato API status
- Returns specific unavailable products with reasons

**When to use:**
- Before checkout (critical validation)
- Before order submission to Gelato
- When showing real-time stock status

### 3. Pre-submission Validation (Final Check)

Orders are validated one final time before submission:
- Automatic check in `/api/orders/[orderId]/submit-gelato`
- Validates all products in the order
- Blocks submission if any product is unavailable

## API Endpoints

### Validate Product Availability

```typescript
POST /api/products/validate-availability

Body: {
  items: Array<{
    productUid: string;
    variantUid?: string;
    quantity: number;
  }>;
  country?: string;  // ISO country code (default: 'US')
}

Response: {
  valid: boolean;
  unavailableProducts?: string[];
  errors?: Array<{
    productUid: string;
    reason: string;
  }>;
  warning?: string;  // If API check failed, using DB only
}
```

**Example:**
```javascript
const response = await fetch('/api/products/validate-availability', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    items: [
      { productUid: 'product-123', quantity: 1 },
      { productUid: 'product-456', quantity: 2 },
    ],
    country: 'US',
  }),
});

const result = await response.json();
if (!result.valid) {
  console.error('Unavailable products:', result.unavailableProducts);
  // Handle unavailable products
}
```

## Catalog Sync Strategy

### Regular Sync Schedule

**Recommended:** Sync catalog once daily during low traffic hours (e.g., 1 AM).

Since we're using database-only validation (no real-time API calls), syncing once daily is sufficient. Availability data may be up to 24 hours old, which is acceptable for print-on-demand products.

**Options:**
1. **Cron Job** (Recommended for production)
   - Set up daily cron: `0 1 * * *` (1 AM daily)
   - Run: `npm run sync-gelato-catalog`
   - Or use the API endpoint in a cron: `curl -X POST https://yoursite.com/api/gelato/sync`
   
2. **Manual Sync** (For development/testing)
   ```bash
   npm run sync-gelato-catalog
   ```

3. **API Endpoint** (For admin-triggered syncs or cron jobs)
   ```bash
   POST /api/gelato/sync
   ```
   
4. **More Frequent Syncs** (Optional, if needed)
   - If you need more up-to-date availability, sync 2-3x daily
   - Example cron: `0 1,9,17 * * *` (1 AM, 9 AM, 5 PM)

### Sync Process

The sync process:
1. Fetches all catalogs from Gelato API
2. Updates `GelatoCatalog` records
3. Syncs all products and updates:
   - `isPrintable` status
   - `productStatus` (activated/deactivated/deprecated)
   - Dimensions, attributes, pricing
4. Removes products that are no longer available

### Monitoring Sync Health

Check sync status:
```bash
# Check synced products count
npm run check-products

# View sync logs
# Check your application logs for [GelatoSync] messages
```

## Implementation in Checkout Flow

### Recommended Flow

1. **Product Selection**
   - Filter products by `isPrintable = true` and `productStatus = 'activated'`
   - Only show available products to customers

2. **Add to Cart**
   - Optional: Validate availability before adding
   - Store `productUid` with cart items

3. **Before Checkout**
   - Call `/api/products/validate-availability` with cart items
   - If invalid: Show error, remove unavailable items, or block checkout
   - If valid: Proceed to payment

4. **After Payment (Before Gelato Submission)**
   - Automatic validation in `/api/orders/[orderId]/submit-gelato`
   - If unavailable: Refund payment, notify customer, log error
   - If available: Submit to Gelato

### Example Checkout Validation

```typescript
// In your checkout component
async function validateBeforeCheckout(cartItems: CartItem[]) {
  const items = cartItems.map(item => ({
    productUid: item.productUid,
    quantity: item.quantity,
  }));

  const response = await fetch('/api/products/validate-availability', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, country: shippingCountry }),
  });

  const result = await response.json();

  if (!result.valid) {
    // Handle unavailable products
    setError(`Some products are no longer available: ${result.unavailableProducts.join(', ')}`);
    // Remove unavailable items from cart
    removeUnavailableItems(result.unavailableProducts);
    return false;
  }

  return true;
}

// Before processing payment
if (!await validateBeforeCheckout(cartItems)) {
  return; // Stop checkout
}

// Proceed with payment...
```

## Error Handling

### If Availability Check Fails

1. **Gelato API Unavailable**
   - Falls back to database check only
   - Returns `warning` in response
   - Order can proceed (Gelato will validate on submission)

2. **Product Unavailable**
   - Returns `valid: false` with `unavailableProducts`
   - Order submission is blocked
   - Customer should be notified before payment

3. **Database Out of Date**
   - Real-time API check will catch it
   - Consider more frequent catalog syncs
   - Monitor sync logs for failures

## Best Practices

1. **Sync Once Daily**
   - **Recommended:** Once daily at 1 AM (low traffic hours)
   - Sufficient for print-on-demand products (availability doesn't change hourly)
   - Reduces API calls and server load
   - Monitor sync logs for errors
   - Set up alerts for sync failures

2. **Validate Early**
   - Check availability before adding to cart (optional)
   - **Always** validate before checkout
   - **Always** validate before Gelato submission

3. **Handle Errors Gracefully**
   - Show clear error messages to customers
   - Automatically remove unavailable items
   - Offer alternatives if available

4. **Monitor Availability**
   - Track unavailable product patterns
   - Alert if sync fails for >24 hours
   - Review catalog sync logs weekly

5. **Customer Communication**
   - Clear messaging when products unavailable
   - Explain if product was available when added to cart
   - Offer to notify when product becomes available again

## Troubleshooting

### Products Showing as Available but Order Fails

1. Check catalog sync timestamp - may be out of date
2. Run manual sync: `npm run sync-gelato-catalog`
3. Check Gelato API status
4. Review order submission logs for Gelato error messages

### Sync Failing

1. Check `GELATO_API_KEY` environment variable
2. Verify API key permissions in Gelato dashboard
3. Check network connectivity
4. Review sync logs for specific error messages

### False Positives (Products Available but Marked Unavailable)

1. Check `isPrintable` field in database
2. Verify `productStatus` is 'activated'
3. Run real-time API check to confirm
4. Update database if Gelato API shows available

## Summary

- **Database sync**: Once daily sync (1 AM recommended) keeps `isPrintable` status current
- **Database validation**: Use `/api/products/validate-availability` before checkout (no real-time API calls)
- **Pre-submission check**: Automatic database validation before Gelato submission
- **Efficient**: Only syncs relevant catalogs (cards, postcards, invitations, announcements, wall art)
- **Monitoring**: Track sync health and availability patterns

This approach ensures customers cannot order unavailable products while maintaining good performance, low server load, and reliable operation.
