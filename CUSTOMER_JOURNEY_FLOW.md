# ArtKey Customer Journey: Customize to Post-Sale

## Complete Flow from Product Selection to Portal Access

---

## **STEP 1: Product Selection** 
*Location: Next.js Site*

### What Happens:
1. Customer browses products on Next.js site
   - Product pages (`/products`)
   - Gallery (`/gallery`)
   - Featured products on homepage
2. Customer clicks "Customize" or "Add to Cart" on a product
3. Navigates to `/customize` page with product parameters

### Data Passed:
- `product_id`: WooCommerce product ID
- `product_type`: "print", "card", "canvas", etc.
- `product_name`: Product name
- `price`: Base price
- `images`: Initial images (if from hero section)
- `message`: Initial message (if from hero section)

---

## **STEP 2: Physical Product Design** 
*Location: Next.js Site - PersonalizationStudio*

### What Happens:
1. Customer lands on `/customize` page
2. **Step 1: Choose Image Source**
   - Upload image from device
   - OR choose from gallery/library
3. **Step 2: Design the Physical Product**
   - PersonalizationStudio opens (Fabric.js editor)
   - Customer can:
     - Upload/edit images
     - Add text
     - Apply filters/effects
     - Create collages
     - Adjust colors, brightness, contrast
     - Add AI effects
     - Arrange elements
   - Design is created at print-ready resolution (300 DPI)
4. Customer clicks "Save Design" or "Continue"
5. Design data is saved:
   - `imageDataUrl`: Final design as data URL
   - `imageBlob`: Blob for upload
   - `dimensions`: Width/height in inches
   - `dpi`: 300 for print quality
   - `productType`: Type of product
   - `productSize`: Selected size

### Technical Details:
- Uses Fabric.js for canvas editing
- Design happens client-side in browser
- Final design exported as high-resolution image
- Ready for Gelato printing

---

## **STEP 3: Product Options Selection**
*Location: Next.js Site - Customize Page*

### What Happens:
1. After design is complete, customer selects product options:
   - **For Prints**:
     - Size: 5x7, 8x10, 11x14, 16x20, 20x24, 24x36
     - Material: Glossy Paper, Matte Paper, Canvas, Metal
     - Frame: Yes/No
     - Frame Color: Black, White, Silver (if framed)
   - **For Cards**:
     - Card Type: Holiday, Birthday, Thank You
   - Quantity: 1 or more
2. Price updates dynamically based on selections
3. Customer reviews total price

### Gelato Product Mapping:
- Each size/material combination maps to Gelato product UID:
  - `prints_pt_cl`: Paper prints
  - `canvas_print_gallery_wrap`: Canvas prints
  - `metal_prints`: Metal prints
  - `cards_cl_dtc_prt_pt`: Cards
4. Design data + product options stored in `sessionStorage`

---

## **STEP 4: ArtKey Editor** 
*Location: Next.js Site - `/art-key/editor`*

### What Happens:
1. Customer clicks "Continue to ArtKey" or "Add ArtKey"
2. Navigates to ArtKey Editor (`/art-key/editor`)
3. **ArtKey Customization**:
   - Upload images/videos for portal
   - Add links (Spotify playlists, websites, etc.)
   - Add "Share Your Interests" PDF
   - Add interests links
   - Customize colors, themes, fonts
   - Preview portal
4. ArtKey ID generated (or reused if option selected)
5. ArtKey payload created with all customization data

### Technical Details:
- ArtKey data stored in browser/localStorage
- Can reuse existing ArtKey or create new one
- All customization happens client-side
- No WordPress interaction yet

---

## **STEP 5: Add to Cart**
*Location: Next.js Site → WooCommerce*

### What Happens:
1. Customer finishes ArtKey customization
2. Clicks "Add to Cart" or "Buy Now"
3. Next.js collects all data:
   - Physical product design (from Step 2)
   - Product options (from Step 3)
   - ArtKey payload (from Step 4)
4. Sends to WooCommerce cart

### Data Sent to WooCommerce:
```javascript
POST /wp-json/wc/store/v1/cart/add-item
{
  id: 123, // Product ID
  quantity: 1,
  artkey_payload: {
    title: "My Custom ArtKey",
    description: "...",
    images: [...],
    videos: [...],
    links: [...],
    interests_pdf_url: "...",
    interests_links: [...],
    background_color: "#000000",
    text_color: "#ffffff"
  },
  // Physical product data (stored separately)
  design_data: {
    imageDataUrl: "...",
    dimensions: { width: 8, height: 10 },
    dpi: 300,
    productType: "print",
    productSize: "8x10"
  },
  product_options: {
    size: "8x10",
    material: "Canvas",
    frame: "Black",
    isFramed: true,
    quantity: 1
  },
  gelato_product_uid: "canvas_print_gallery_wrap"
}
```

### WordPress Plugin Action:
- **artkey-woo.php** intercepts cart item
- Stores `artkey_payload` in cart item data
- Displays "ArtKey Included" badge in cart
- Physical product data stored separately (for Gelato)

---

## **STEP 6: Checkout Process**
*Location: Next.js Site → WooCommerce*

### What Happens:
1. Customer reviews cart (sees "ArtKey Included" badge)
2. Proceeds to checkout
3. Enters shipping/billing information
4. Selects payment method
5. Completes payment

### WordPress Plugin Action:
- **artkey-woo.php** copies `artkey_payload` from cart to order item meta
- Order is created in WooCommerce
- Order status: "Processing" or "Pending Payment"
- Physical product design data stored in order meta (for Gelato)

### Data Stored:
- Order created with item meta: `_artkey_payload`
- Order meta: `_design_data` (physical product design)
- Order meta: `_product_options` (size, material, frame, etc.)
- Order meta: `_gelato_product_uid` (Gelato product identifier)
- ArtKey data is now permanently associated with the order

---

## **STEP 7: Payment Completion & Gelato Order**
*Location: WooCommerce → WordPress Plugins → Gelato API*

### What Happens:
1. Payment gateway confirms payment
2. WooCommerce updates order status to "Processing" or "Completed"
3. **Two things happen simultaneously:**

### A. Gelato Order Creation (Physical Product)
**Next.js API Route** (`/api/orders/create`) or **WooCommerce Hook**:
1. Retrieves design data from order meta
2. Uploads design image to Gelato API (`/api/gelato/upload`)
3. Creates Gelato order with:
   - Design file (uploaded image)
   - Product UID (from product options)
   - Quantity
   - Shipping address (from order)
4. Gelato order ID saved to WooCommerce order meta
5. Gelato handles printing and fulfillment

### B. ArtKey Portal Creation (Digital Experience)
**artkey-woo.php** `artkey_woo_create_portal()` function runs:

1. **Checks if portal already exists** (idempotency - won't create duplicate)
2. **Generates unique token**:
   - Format: `ak-{order_id}-{item_id}-{hash}`
   - Example: `ak-1234-5678-a1b2c3d4`
   - Uses secure token generation from **artkey-security.php**

3. **Creates `artkey_portal` post**:
   - Post type: `artkey_portal`
   - Status: `publish`
   - Meta fields:
     - `artkey_token`: The unique token
     - `artkey_payload`: Full JSON payload
     - `_order_id`: Order reference
     - `_order_item_id`: Item reference

4. **Generates QR Code**:
   - Calls `artkey_generate_qr_code()` from **artkey-core.php**
   - Uses Endroid QR Code library
   - QR code points to: `https://yoursite.com/a/{token}`
   - Saves QR image to WordPress media library
   - Stores QR URL in portal meta: `qr_image_url`, `qr_attachment_id`

5. **Saves portal info to order**:
   - Order item meta: `_artkey_token`, `_artkey_portal_url`
   - Order meta: `_artkey_tokens` (array of all tokens)
   - Order meta: `_artkey_portals_created: 'yes'` (flag)

### Portal URL Created:
- WordPress route: `/a/{token}` (handled by **artkey-core.php**)
- Next.js route: `/art-key/{token}` (alternative)
- Full URL: `https://yoursite.com/a/ak-1234-5678-a1b2c3d4`

---

## **STEP 8: Order Email Sent**
*Location: WooCommerce → Customer Email*

### What Happens:
1. WooCommerce sends order confirmation email
2. **artkey-woo.php** adds ArtKey portal section to email

### Email Content:
```
Order #1234

Items:
- 8x10 Canvas Print [ArtKey Included]

ArtKey Portals:
• ak-1234-5678-a1b2c3d4
  https://yoursite.com/a/ak-1234-5678-a1b2c3d4

Physical Product:
• Being printed by Gelato
• Tracking information will be sent separately
```

### Customer Receives:
- Order confirmation
- Portal URL (clickable link) - **Can access immediately**
- Gelato order confirmation (if Gelato sends separate email)
- Can access portal even before physical product ships

---

## **STEP 9: Gelato Printing & Fulfillment**
*Location: Gelato Print Network*

### What Happens:
1. Gelato receives order via API
2. Gelato prints physical product:
   - Uses uploaded design file
   - Prints on selected material (paper, canvas, metal, etc.)
   - Applies selected size
   - Adds frame if selected
3. **QR Code Integration**:
   - QR code needs to be added to the design BEFORE sending to Gelato
   - OR: QR code printed separately and attached
   - OR: QR code included in design file sent to Gelato
4. Gelato ships directly to customer
5. Gelato sends tracking information
6. Customer receives physical product

### QR Code on Product:
- Scannable QR code (embedded in design or attached)
- Points to: `https://yoursite.com/a/{token}`
- Customer can scan with any QR reader
- **Important**: QR code must be generated BEFORE sending to Gelato, or added to design file

---

## **STEP 10: Customer Receives Product**
*Location: Customer's Location*

### What Happens:
1. Customer receives physical product from Gelato
2. Sees QR code on product (embedded in design or attached)
3. Scans QR code with smartphone

### QR Code Scan:
- Opens: `https://yoursite.com/a/{token}`
- Redirects to Next.js portal (`/art-key/{token}`) or WordPress portal (`/a/{token}`)

---

## **STEP 11: Portal Display**
*Location: Next.js or WordPress*

### Option A: Next.js Portal (Current Setup)
1. Request goes to: `/art-key/{token}`
2. Next.js route handler: `app/art-key/[token]/page.tsx`
3. Fetches data: `/api/artkey/{token}`
4. API route calls: `GET /wp-json/artkey/v1/get/{token}`
5. **artkey-core.php** looks up portal by token
6. Returns JSON payload
7. Next.js `ArtKeyPortal` component renders portal

### Option B: WordPress Portal (If Using PHP Template)
1. Request goes to: `/a/{token}`
2. **artkey-core.php** rewrite rule catches it
3. Looks up `artkey_portal` post by token
4. Loads `portal.php` template
5. Template renders portal with payload data

### Portal Features Displayed:
- **Title & Description**: From ArtKey payload
- **Background Colors**: Custom colors
- **Image Gallery**: All uploaded images (tap to view fullscreen)
- **Video Gallery**: All uploaded videos (tap to play)
- **Links Section**: Collapsible list of links
- **Share Your Interests**:
  - PDF viewer (if PDF uploaded)
  - "Tap for links" button (if interests links added)
  - Links page with all interest links

### Mobile Optimizations:
- Full-screen layout
- Touch-friendly buttons
- Safe area insets (iPhone notch)
- Prevents zoom on double-tap
- Smooth scrolling

---

## **STEP 12: Customer Interacts with Portal**
*Location: Customer's Device*

### What Customer Can Do:
1. **View Images**: Tap image to view fullscreen overlay
2. **Play Videos**: Tap video to play in overlay
3. **Open Links**: Tap link to open in new tab
4. **View PDF**: Scroll through "Share Your Interests" PDF
5. **Access Interest Links**: Tap "Tap for links" to see interest links page
6. **Share Portal**: Copy URL to share with others

### Portal Persistence:
- Portal URL is permanent
- Can be accessed anytime
- Can be shared with others
- Works on any device

---

## **Complete Technical Flow Diagram**

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: PRODUCT SELECTION (Next.js)                        │
│ Customer browses and selects product                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: PHYSICAL PRODUCT DESIGN (Next.js)                  │
│ PersonalizationStudio - Design print/card                   │
│ Export: High-res image (300 DPI)                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: PRODUCT OPTIONS (Next.js)                          │
│ Select size, material, frame, quantity                     │
│ Map to Gelato product UID                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: ARTKEY EDITOR (Next.js)                            │
│ Customize digital portal content                            │
│ Upload images, videos, links, PDF                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: ADD TO CART (Next.js → WooCommerce)                │
│ POST /wp-json/wc/store/v1/cart/add-item                    │
│ Includes: artkey_payload                                    │
│ Plugin: artkey-woo.php stores in cart item data            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 6: CHECKOUT (Next.js → WooCommerce)                     │
│ Customer completes checkout                                 │
│ Plugin: artkey-woo.php copies payload to order meta        │
│ Design data stored in order meta                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 7: PAYMENT COMPLETE (WooCommerce → Plugins)            │
│ Two parallel processes:                                     │
│ A. Gelato: Upload design, create print order                │
│ B. ArtKey: Generate token, create portal, QR code           │
│ Order status: Processing/Completed                          │
│ Trigger: artkey_woo_create_portal()                          │
│                                                              │
│ Actions:                                                     │
│ 1. Generate token (artkey-security.php)                     │
│ 2. Create artkey_portal post (artkey-core.php)              │
│ 3. Generate QR code (artkey-core.php)                        │
│ 4. Save portal data to order                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: EMAIL SENT (WooCommerce → Customer)                  │
│ Order confirmation email                                     │
│ Plugin: artkey-woo.php adds portal links                    │
│ Customer receives portal URL immediately                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 6: PRODUCT FULFILLMENT (Your Business)                 │
│ Product printed with QR code                                │
│ Product shipped to customer                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 7: CUSTOMER RECEIVES PRODUCT                           │
│ Customer scans QR code                                       │
│ Opens: https://yoursite.com/a/{token}                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 8: PORTAL DISPLAY (Next.js or WordPress)               │
│                                                              │
│ Next.js Path:                                                │
│ /art-key/{token} → /api/artkey/{token} →                    │
│ GET /wp-json/artkey/v1/get/{token} →                        │
│ artkey-core.php returns payload →                           │
│ ArtKeyPortal component renders                              │
│                                                              │
│ WordPress Path:                                              │
│ /a/{token} → artkey-core.php rewrite →                     │
│ portal.php template renders                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 12: CUSTOMER INTERACTS                                 │
│ Views images, videos, links, PDF                            │
│ Portal accessible forever                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## **Key Points**

### Automatic Processes:
- ✅ Portal creation happens **automatically** when order is paid
- ✅ QR code generation happens **automatically**
- ✅ Gelato order creation happens **automatically** (if integrated)
- ✅ Email includes portal link **automatically**
- ✅ No manual intervention needed

### Two-Part Product:
1. **Physical Product** (Card, Print, etc.):
   - Designed in PersonalizationStudio
   - Printed by Gelato
   - Shipped directly to customer
   - QR code embedded/attached

2. **Digital Portal** (ArtKey):
   - Customized in ArtKey Editor
   - Created automatically on order completion
   - Accessible via QR code or direct URL
   - Permanent and shareable

### Data Flow:
- **Product Design**: Next.js PersonalizationStudio (client-side)
- **Product Options**: Next.js (client-side)
- **ArtKey Customization**: Next.js ArtKey Editor (client-side)
- **Cart/Checkout**: Next.js → WooCommerce
- **Gelato Order**: WooCommerce → Gelato API (physical product)
- **Portal Creation**: WooCommerce → WordPress Plugins (digital portal)
- **Portal Display**: WordPress → Next.js (or WordPress template)

### QR Code Integration Challenge:
**Important**: QR code needs to be added to the physical product design. Options:
1. **Generate QR before Gelato**: Add QR code to design file before sending to Gelato
2. **Gelato Template**: Use Gelato's template system to add QR code
3. **Post-Print**: Attach QR code sticker after printing (not ideal)
4. **Design Integration**: Include QR code as part of the design in PersonalizationStudio

### Security:
- **artkey-security.php** ensures secure token generation
- **artkey-logging.php** logs all operations
- Rate limiting prevents abuse
- URL validation prevents XSS attacks

### Idempotency:
- Portal creation checks if portal already exists
- Won't create duplicates if function runs multiple times
- Safe to retry if errors occur

---

## **What Happens If Something Goes Wrong?**

### Portal Creation Fails:
- Error logged to WooCommerce logs
- Error logged to debug.log
- Order still completes
- Admin can manually create portal via admin interface

### QR Code Generation Fails:
- Portal still created
- Portal URL still works
- QR code can be regenerated manually
- Error logged for troubleshooting

### Token Collision (Very Rare):
- System detects collision
- Generates new token automatically
- Logs warning
- Continues normally

---

## **Admin Tools Available**

### WordPress Admin:
- **ArtKey Menu**: View all portals, create demo portals
- **Debug Page**: View logs, system status, test endpoints
- **Order Details**: See portal links for each order item
- **Regenerate QR**: Manually regenerate QR codes

### Monitoring:
- All operations logged
- WooCommerce logs show portal creation
- Debug page shows recent activity
- Can troubleshoot issues easily

---

This entire flow is **automated** - once set up, it runs seamlessly from customization to portal access!

