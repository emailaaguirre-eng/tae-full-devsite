# WooCommerce REST API Setup Guide
## Complete Configuration for The Artful Experience

This guide will help you configure the WooCommerce REST API integration for your Next.js website.

---

## 📋 Prerequisites

1. **WooCommerce Installed** on your WordPress site
2. **WooCommerce REST API Enabled** (enabled by default in WooCommerce 2.6+)
3. **HTTPS Enabled** on your WordPress site (required for API)
4. **Admin Access** to WordPress dashboard

---

## 🔑 Step 1: Generate WooCommerce API Keys

### In WordPress Admin:

1. **Navigate to WooCommerce Settings:**
   - Go to: `https://theartfulexperience.com/wp-admin`
   - Click: **WooCommerce → Settings → Advanced → REST API**

2. **Create New API Key:**
   - Click **"Add Key"** button
   - **Description:** `Next.js Website Integration`
   - **User:** Select your admin user (or create a dedicated API user)
   - **Permissions:** Select **Read/Write** (needed for orders)
   - Click **"Generate API Key"**

3. **Copy Your Credentials:**
   - **Consumer Key:** `ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Consumer Secret:** `cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - ⚠️ **Important:** Copy these immediately - the secret won't be shown again!

---

## 🔧 Step 2: Configure Environment Variables

### Create `.env.local` file:

In your project root (`F:\Dre_Programs\tAE Full Website`), create or edit `.env.local`:

```env
# WooCommerce REST API Configuration
NEXT_PUBLIC_WOOCOMMERCE_URL=https://theartfulexperience.com
WOOCOMMERCE_CONSUMER_KEY=ck_your_consumer_key_here
WOOCOMMERCE_CONSUMER_SECRET=cs_your_consumer_secret_here

# Gelato API Configuration (add when you get the key)
GELATO_API_KEY=your_gelato_api_key_here
GELATO_API_URL=https://order.gelatoapis.com/v4

# WordPress URL (for content management)
NEXT_PUBLIC_WORDPRESS_URL=https://theartfulexperience.com
```

### ⚠️ Security Notes:

- **Never commit `.env.local` to Git** (it's already in `.gitignore`)
- **Use different keys for development and production**
- **Rotate keys periodically** for security

---

## ✅ Step 3: Test the Connection

### Option 1: Test via API Route

Once your dev server is running, visit:
```
http://localhost:3000/api/woocommerce/test
```

You should see:
```json
{
  "success": true,
  "message": "WooCommerce API connection successful"
}
```

### Option 2: Test via Terminal

```bash
# Test connection
curl -X GET "http://localhost:3000/api/woocommerce/test"
```

### Option 3: Test Products Endpoint

```bash
# Get products (uses public store API, no auth needed)
curl -X GET "http://localhost:3000/api/products"
```

---

## 🛠️ Available WooCommerce Functions

Your website now has these WooCommerce functions available:

### Product Functions (`lib/woocommerce.ts`):

```typescript
// Get all products
const products = await getProducts({
  per_page: 20,
  status: 'publish',
  featured: true,
});

// Get single product
const product = await getProduct(123);

// Get categories
const categories = await getCategories({
  hide_empty: true,
});
```

### Order Functions:

```typescript
// Create order
const order = await createOrder({
  payment_method: 'bacs',
  payment_method_title: 'Direct Bank Transfer',
  billing: { /* ... */ },
  shipping: { /* ... */ },
  line_items: [ /* ... */ ],
});

// Get order
const order = await getOrder(123);

// Update order status
await updateOrderStatus(123, 'processing');

// Add order note
await addOrderNote(123, 'Order sent to Gelato for printing', false);

// Update order meta
await updateOrderMeta(123, [
  { key: 'gelato_order_id', value: 'gelato-12345' },
]);
```

---

## 📡 Available API Routes

### Products:
- `GET /api/products` - Get products (uses public store API)
- `GET /api/woocommerce/products` - Get products (uses REST API with auth)

### Orders:
- `POST /api/orders/create` - Create order (WooCommerce + Gelato)
- `GET /api/woocommerce/orders?id=123` - Get order
- `PUT /api/woocommerce/orders?id=123` - Update order

### Testing:
- `GET /api/woocommerce/test` - Test API connection

---

## 🔍 Troubleshooting

### Issue: "WooCommerce API credentials not configured"

**Solution:**
1. Check `.env.local` exists in project root
2. Verify variable names are correct (no typos)
3. Restart your dev server after adding env variables
4. Check for extra spaces in your keys

### Issue: "API connection failed: 401 Unauthorized"

**Solution:**
1. Verify Consumer Key and Secret are correct
2. Check key has **Read/Write** permissions
3. Ensure HTTPS is enabled on WordPress site
4. Try regenerating API keys

### Issue: "API connection failed: 404 Not Found"

**Solution:**
1. Verify WooCommerce is installed and activated
2. Check REST API is enabled: `https://theartfulexperience.com/wp-json/wc/v3/`
3. Verify URL in `.env.local` is correct (no trailing slash)

### Issue: "CORS errors"

**Solution:**
1. Install CORS plugin in WordPress
2. Or add CORS headers in WordPress `functions.php`:
```php
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Credentials: true');
        return $value;
    });
}, 15);
```

---

## 🔐 Security Best Practices

1. **Use Read/Write keys only when necessary**
   - For read-only operations, create separate keys with Read permissions

2. **Rotate keys regularly**
   - Change API keys every 90 days
   - Revoke old keys immediately

3. **Use environment-specific keys**
   - Different keys for development and production
   - Never use production keys in development

4. **Monitor API usage**
   - Check WooCommerce → Settings → Advanced → REST API
   - Review key usage and revoke unused keys

5. **Limit key permissions**
   - Only grant permissions needed for your use case
   - Don't use admin user keys if possible

---

## 📊 Integration Flow

### Current Integration:

```
Customer Order Flow:
1. Customer selects product → FeaturedProducts component
2. Customize product → /customize page
3. ArtKey Editor → /artkey/editor
4. Checkout → POST /api/orders/create
5. Order created in WooCommerce → createOrder()
6. Order sent to Gelato → createGelatoOrder()
7. Order status synced → updateOrderStatus()
```

### Order Creation Example:

```typescript
// In your checkout component
const orderData = {
  payment_method: 'bacs',
  payment_method_title: 'Bank Transfer',
  set_paid: false,
  billing: {
    first_name: 'John',
    last_name: 'Doe',
    address_1: '123 Main St',
    city: 'New York',
    postcode: '10001',
    country: 'US',
    email: 'john@example.com',
  },
  shipping: {
    first_name: 'John',
    last_name: 'Doe',
    address_1: '123 Main St',
    city: 'New York',
    postcode: '10001',
    country: 'US',
  },
  line_items: [
    {
      product_id: 123,
      quantity: 1,
      meta_data: [
        { key: 'artkey_data', value: JSON.stringify(artKeyData) },
        { key: 'gelato_product_uid', value: 'canvas_print_gallery_wrap' },
      ],
    },
  ],
  meta_data: [
    { key: 'customization', value: JSON.stringify(customizationData) },
  ],
};

const order = await createOrder(orderData);
```

---

## ✅ Verification Checklist

- [ ] API keys generated in WooCommerce
- [ ] `.env.local` file created with credentials
- [ ] Dev server restarted after adding env variables
- [ ] Test connection: `/api/woocommerce/test` returns success
- [ ] Products endpoint works: `/api/products`
- [ ] Can create test order (in development)
- [ ] Order appears in WooCommerce admin

---

## 🚀 Next Steps

1. **Get Gelato API Key:**
   - Follow `GELATO-API-INTEGRATION-GUIDE.md`
   - Add to `.env.local`

2. **Test Complete Flow:**
   - Product selection → Customize → ArtKey → Checkout
   - Verify order in WooCommerce
   - Verify order in Gelato

3. **Set Up Webhooks:**
   - Configure Gelato webhooks for order status
   - Configure WooCommerce webhooks if needed

4. **Production Deployment:**
   - Use production API keys
   - Set up environment variables in hosting platform
   - Test end-to-end in production

---

## 📚 Additional Resources

- **WooCommerce REST API Docs:** https://woocommerce.github.io/woocommerce-rest-api-docs/
- **WooCommerce API Reference:** https://woocommerce.github.io/woocommerce-rest-api-docs/#introduction
- **Your Integration:** `lib/woocommerce.ts` for all available functions

---

**Your WooCommerce REST API is now configured and ready to use!** 🎉

Once you add your API keys to `.env.local`, the integration will be fully functional.

