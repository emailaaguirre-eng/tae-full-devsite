# Complete Order Flow: 10-Card Package Example

## Scenario
Customer orders **1 package** containing **10 cards** (e.g., "Holiday Greeting Card Set - 10 Pack")

---

## Step-by-Step Flow

### Step 1: Product Setup in WooCommerce

**Product Configuration:**
- **Product Name**: "Holiday Greeting Card Set - 10 Pack"
- **Product Type**: Simple Product
- **Price**: $24.99
- **Stock**: Manage stock = Yes
- **Quantity**: 10 (cards per package)
- **Categories**: "Cards", "Holiday"
- **Tags**: "artkey-enabled", "customizable"

**Why This Triggers Skeleton Key Requirement:**
- ✅ Product name contains "card" → `requiresQR = true`
- ✅ Product has quantity > 1 (10 cards) → bulk product
- ✅ System detects: "This product needs skeleton key and QR code"

**Result**: Product is flagged as requiring skeleton key/QR setup

---

### Step 2: Customer Browses Website

**What Happens:**
1. Customer visits your website
2. `FeaturedProducts` component fetches products from `/api/products`
3. Product appears in the product list with:
   - Image
   - Name: "Holiday Greeting Card Set - 10 Pack"
   - Price: $24.99
   - "Customize" button

**Customer Sees:**
```
┌─────────────────────────────────┐
│  [Product Image]                │
│  Holiday Greeting Card Set      │
│  10 Pack                        │
│  $24.99                         │
│  [Customize Button]             │
└─────────────────────────────────┘
```

---

### Step 3: Customer Clicks "Customize"

**What Happens:**
1. Customer clicks "Customize" button
2. Browser navigates to: `/customize?product_id=123&product_name=Holiday%20Greeting%20Card%20Set&price=24.99`
3. `/customize` page redirects to: `/art-key/editor?product_id=123&from_customize=true`

**URL Flow:**
```
/customize?product_id=123
    ↓ (redirects)
/art-key/editor?product_id=123&from_customize=true
```

---

### Step 4: ArtKey Editor Loads

**What Happens:**
1. Editor component (`ArtKeyEditor`) loads
2. Reads `product_id=123` from URL params
3. Fetches product info: `GET /api/woocommerce/products/123`
4. API detects product requires QR (has "card" keyword)
5. Sets `productInfo.requiresQR = true`
6. Shows skeleton key section (Step 8)

**Editor Displays:**
- All normal editor sections (templates, colors, features, etc.)
- **Step 8: QR Code Placement** section appears (because `requiresQR = true`)

---

### Step 5: Customer Designs ArtKey

**Customer Actions:**
1. Selects template/design
2. Chooses colors, fonts, background
3. Configures features (guestbook, gallery, etc.)
4. Adds content (images, links, Spotify, etc.)

**Then:**
5. **Must complete Step 8: QR Code Placement**
   - Selects skeleton key template (e.g., "Classic Corner")
   - Selects QR code position (e.g., "bottom-right")
   - **Cannot save until both are selected**

**Editor State:**
```javascript
skeletonKey: 'template-1'  // Selected
qrPosition: 'bottom-right'  // Selected
productInfo.requiresQR: true
```

---

### Step 6: Customer Saves ArtKey

**What Happens:**
1. Customer clicks "Save" button
2. Editor validates:
   - ✅ `skeletonKey` is set → `'template-1'`
   - ✅ `qrPosition` is set → `'bottom-right'`
   - ✅ Validation passes

3. Editor calls: `POST /api/artkey/save`
   - Sends ArtKey data including:
     ```json
     {
       "data": {
         "title": "Holiday Greeting",
         "theme": {...},
         "features": {...},
         "customizations": {
           "skeleton_key": "template-1",
           "qr_position": "bottom-right"
         }
       },
       "product_id": "123"
     }
     ```

4. API creates ArtKey in database:
   - Generates `public_token`: `"abc123xy"`
   - Generates `owner_token`: `"XyZ9aBc..."`
   - Saves all data including customizations

5. Returns response:
   ```json
   {
     "id": "artkey_123",
     "public_token": "abc123xy",
     "owner_token": "XyZ9aBc...",
     "share_url": "https://yoursite.com/artkey/abc123xy"
   }
   ```

**ArtKey Saved:**
- ✅ ArtKey portal is live at `/artkey/abc123xy`
- ✅ Owner can manage at `/manage/artkey/XyZ9aBc...`
- ✅ Customizations include skeleton key and QR position

---

### Step 7: Customer Adds to Cart / Places Order

**What Happens:**
1. After saving, customer may:
   - Add to cart (if coming from shop)
   - Continue to checkout
   - Place order

2. **Cart/Order Contains:**
   - Product ID: 123
   - Quantity: 1 (one package)
   - ArtKey ID: `artkey_123`
   - ArtKey URL: `/artkey/abc123xy`
   - Customizations: `{ skeleton_key: "template-1", qr_position: "bottom-right" }`

3. **Order Data Structure:**
   ```json
   {
     "product_id": "123",
     "quantity": 1,
     "artkey_id": "artkey_123",
     "artkey_url": "https://yoursite.com/artkey/abc123xy",
     "customizations": {
       "skeleton_key": "template-1",
       "qr_position": "bottom-right"
     }
   }
   ```

---

### Step 8: Order Processing - Generate Composite Image

**When Order is Placed:**

1. **System calls compose route:**
   ```
   POST /api/artkey/compose
   {
     "public_token": "abc123xy",
     "skeleton_key": "template-1",
     "qr_position": "bottom-right",
     "artkey_content_position": {
       "x": 50,
       "y": 100,
       "width": 400,
       "height": 600
     }
   }
   ```

2. **Compose route process:**
   - ✅ Loads skeleton key template image (`template-1.png`)
   - ✅ Generates QR code for ArtKey URL (`/artkey/abc123xy`)
   - ✅ Renders ArtKey portal content as image
   - ✅ Composites ArtKey content onto skeleton key at specified position
   - ✅ Composites QR code onto skeleton key at `bottom-right` position
   - ✅ Uploads final composite to WordPress media library
   - ✅ Returns final image URL

3. **Result:**
   ```json
   {
     "success": true,
     "composite_url": "https://yoursite.com/wp-content/uploads/2024/01/card-abc123xy.png",
     "qr_code_url": "https://yoursite.com/wp-content/uploads/2024/01/qr-abc123xy.png"
   }
   ```

**Final Composite Image Contains:**
- ✅ Skeleton key template (base card design)
- ✅ ArtKey portal content (title, buttons, etc.) positioned correctly
- ✅ QR code in bottom-right corner
- ✅ QR code links to: `https://yoursite.com/artkey/abc123xy`

---

### Step 9: Send to Gelato

**Order Data Sent to Gelato:**
```json
{
  "product_id": "gelato_product_123",
  "quantity": 1,  // 1 package
  "design_file": "https://yoursite.com/wp-content/uploads/2024/01/card-abc123xy.png",
  "quantity_per_package": 10,  // 10 cards in this package
  "metadata": {
    "artkey_id": "artkey_123",
    "artkey_url": "https://yoursite.com/artkey/abc123xy",
    "skeleton_key": "template-1",
    "qr_position": "bottom-right"
  }
}
```

**Gelato Receives:**
- ✅ 1 order for 10 cards
- ✅ Design file with everything composited:
  - Skeleton key template
  - ArtKey content
  - QR code in correct position
- ✅ QR code is functional and links to ArtKey portal

---

### Step 10: Gelato Prints & Ships

**Gelato Process:**
1. Receives order with composite design file
2. Prints 10 cards (all identical)
3. Each card has:
   - ✅ Skeleton key design
   - ✅ ArtKey portal content
   - ✅ QR code in bottom-right corner
4. Ships package to customer

---

### Step 11: Customer Receives Cards

**What Customer Gets:**
- 📦 Package of 10 cards
- 🎴 Each card has:
  - Beautiful design (skeleton key template)
  - ArtKey portal content (title, buttons, etc.)
  - QR code in bottom-right corner

**When Recipients Scan QR Code:**
1. QR code links to: `https://yoursite.com/artkey/abc123xy`
2. Opens ArtKey portal on their phone
3. They can:
   - View guestbook
   - See gallery
   - Watch videos
   - Listen to Spotify playlist
   - Leave messages
   - Upload photos/videos

---

## Key Points

### ✅ What Works Automatically

1. **Product Detection**: System automatically detects cards/invitations need skeleton keys
2. **Validation**: Editor blocks save until skeleton key/QR are selected
3. **Data Storage**: All customizations saved with ArtKey
4. **QR Generation**: QR code generated pointing to correct portal URL
5. **Composite Creation**: Final image ready for printing

### ⚠️ What Needs Implementation

1. **Compose Route**: Currently a stub - needs full implementation
2. **ArtKey Content Rendering**: Need to render portal content as image
3. **Skeleton Key Templates**: Need actual image files for templates
4. **Gelato Integration**: Need to send composite image with order

### 📋 Data Flow Summary

```
WooCommerce Product (10-card package)
    ↓
Customer designs ArtKey
    ↓
Selects skeleton key + QR position
    ↓
Saves ArtKey (with customizations)
    ↓
Places order
    ↓
System generates composite (skeleton + content + QR)
    ↓
Composite sent to Gelato
    ↓
Gelato prints 10 cards
    ↓
Customer receives cards
    ↓
Recipients scan QR → ArtKey portal
```

---

## Testing This Flow

### Test Checklist

1. **Create Product in WooCommerce:**
   - [ ] Name: "Holiday Card Set - 10 Pack"
   - [ ] Price: $24.99
   - [ ] Quantity: 10
   - [ ] Category: "Cards"

2. **Test Product Detection:**
   - [ ] Visit website
   - [ ] Product appears in list
   - [ ] Click "Customize"
   - [ ] Editor opens
   - [ ] Skeleton key section appears

3. **Test Design Flow:**
   - [ ] Design ArtKey
   - [ ] Select skeleton key template
   - [ ] Select QR position
   - [ ] Try to save without selections → blocked
   - [ ] Save with selections → succeeds

4. **Test Order Flow:**
   - [ ] Add to cart
   - [ ] Place order
   - [ ] Verify order includes ArtKey data
   - [ ] Verify composite generation (when implemented)

---

## Next Steps for Full Implementation

1. **Implement Compose Route** (`/api/artkey/compose`)
   - Generate QR code
   - Render ArtKey content as image
   - Composite everything together
   - Upload to WordPress media

2. **Create Skeleton Key Template Images**
   - Design 5 template images
   - Store in `public/skeleton-keys/` or WordPress media

3. **Integrate with Gelato Order Flow**
   - Call compose route when order placed
   - Send composite image to Gelato
   - Include ArtKey metadata

4. **Test End-to-End**
   - Create test product
   - Complete full flow
   - Verify QR code works
   - Verify composite is correct

