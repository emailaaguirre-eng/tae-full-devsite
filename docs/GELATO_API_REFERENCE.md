# Gelato API Reference

## Overview

Gelato uses **two separate API endpoints**:

| API | Base URL | Purpose |
|-----|----------|---------|
| **Order API** | `https://order.gelatoapis.com/v4` | Orders, quotes, shipment |
| **Product API** | `https://product.gelatoapis.com/v3` | Catalogs, products, attributes |

Both APIs use the same `X-API-KEY` header for authentication.

## Environment Variables

```env
GELATO_API_KEY=your-api-key-here
GELATO_API_URL=https://order.gelatoapis.com/v4
GELATO_PRODUCT_API_URL=https://product.gelatoapis.com/v3
```

---

## Product Catalog API

### List Catalogs
```
GET https://product.gelatoapis.com/v3/catalogs
```

**Response:**
```json
[
  { "catalogUid": "cards", "title": "cards" },
  { "catalogUid": "posters", "title": "Posters" }
]
```

### Get Catalog Info
```
GET https://product.gelatoapis.com/v3/catalogs/{catalogUid}
```

**Response:**
```json
{
  "catalogUid": "posters",
  "title": "Posters",
  "productAttributes": [
    {
      "productAttributeUid": "Orientation",
      "title": "Orientation",
      "values": [
        { "productAttributeValueUid": "hor", "title": "Landscape" },
        { "productAttributeValueUid": "ver", "title": "Portrait" }
      ]
    },
    {
      "productAttributeUid": "PaperFormat",
      "title": "Paper Format",
      "values": [
        { "productAttributeValueUid": "A1", "title": "A1" },
        { "productAttributeValueUid": "A2", "title": "A2" }
      ]
    }
  ]
}
```

### Search Products in Catalog
```
POST https://product.gelatoapis.com/v3/catalogs/{catalogUid}/products:search
```

**Request:**
```json
{
  "attributeFilters": {
    "Orientation": ["hor", "ver"],
    "CoatingType": ["none"]
  },
  "limit": 50,
  "offset": 0
}
```

**Response:**
```json
{
  "products": [
    {
      "productUid": "cards_pf_5r_pt_100-lb-cover-coated-silk_cl_4-4_hor",
      "attributes": {
        "CoatingType": "none",
        "ColorType": "4-4",
        "Orientation": "hor",
        "PaperFormat": "5R",
        "PaperType": "100-lb-cover-coated-silk"
      },
      "dimensions": {
        "Width": { "value": 127, "measureUnit": "mm" },
        "Height": { "value": 178, "measureUnit": "mm" }
      }
    }
  ],
  "hits": {
    "attributeHits": { ... }
  }
}
```

### Get Single Product
```
GET https://product.gelatoapis.com/v3/products/{productUid}
```

**Response:**
```json
{
  "productUid": "cards_pf_5r_pt_100-lb-cover-coated-silk_cl_4-4_hor",
  "attributes": { ... },
  "weight": { "value": 12.5, "measureUnit": "grams" },
  "supportedCountries": ["US", "CA"],
  "notSupportedCountries": ["BR"],
  "isStockable": false,
  "isPrintable": true,
  "validPageCounts": [4, 8, 12]
}
```

---

## Order API

### Create Order
```
POST https://order.gelatoapis.com/v4/orders
```

**Request:**
```json
{
  "orderType": "order",
  "orderReferenceId": "my-order-123",
  "customerReferenceId": "customer-456",
  "currency": "USD",
  "items": [
    {
      "itemReferenceId": "item-1",
      "productUid": "cards_pf_5r_pt_100-lb-cover-coated-silk_cl_4-4_hor",
      "files": [
        { "type": "default", "url": "https://example.com/front-back.pdf" },
        { "type": "inside", "url": "https://example.com/inside.pdf" }
      ],
      "quantity": 25
    }
  ],
  "shipmentMethodUid": "standard",
  "shippingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "addressLine1": "123 Main St",
    "city": "New York",
    "postCode": "10001",
    "state": "NY",
    "country": "US",
    "email": "john@example.com"
  }
}
```

### File Types for Cards

| Type | Description |
|------|-------------|
| `default` | Cover + back pages (can be multipage PDF for all areas) |
| `front` | Front of product |
| `back` | Back of product |
| `inside` | Inner pages of folded cards |

### Get Order
```
GET https://order.gelatoapis.com/v4/orders/{orderId}
```

### Search Orders
```
POST https://order.gelatoapis.com/v4/orders:search
```

### Cancel Order
```
POST https://order.gelatoapis.com/v4/orders/{orderId}:cancel
```

### Get Quote (for pricing & shipping)
```
POST https://order.gelatoapis.com/v4/orders:quote
```

**Request:**
```json
{
  "orderReferenceId": "quote-123",
  "customerReferenceId": "customer-456",
  "currency": "USD",
  "recipient": {
    "firstName": "John",
    "lastName": "Doe",
    "addressLine1": "123 Main St",
    "city": "New York",
    "postCode": "10001",
    "state": "NY",
    "country": "US",
    "email": "john@example.com"
  },
  "products": [
    {
      "itemReferenceId": "item-1",
      "productUid": "cards_pf_5r_pt_100-lb-cover-coated-silk_cl_4-4_hor",
      "quantity": 25
    }
  ]
}
```

**Response:**
```json
{
  "orderReferenceId": "quote-123",
  "quotes": [
    {
      "id": "quote-uuid",
      "fulfillmentCountry": "US",
      "shipmentMethods": [
        {
          "name": "Standard",
          "shipmentMethodUid": "standard",
          "price": 5.99,
          "currency": "USD",
          "minDeliveryDays": 5,
          "maxDeliveryDays": 7
        }
      ],
      "products": [
        {
          "itemReferenceId": "item-1",
          "productUid": "cards_pf_5r_pt_100-lb-cover-coated-silk_cl_4-4_hor",
          "quantity": 25,
          "price": 24.99,
          "currency": "USD"
        }
      ]
    }
  ]
}
```

---

## Product UID Format

Gelato product UIDs follow a pattern like:
```
cards_pf_{format}_pt_{paper-type}_cl_{color}_hor
```

Examples:
- `cards_pf_5r_pt_100-lb-cover-coated-silk_cl_4-4_hor`
- `posters_pf_a3_pt_170-gsm-coated-silk_cl_4-0_ver`

---

## Product Pricing API

### Get All Prices for a Product
```
GET https://product.gelatoapis.com/v3/products/{productUid}/prices
```

**Query Parameters:**
- `country` (optional): Country ISO code (e.g., "US")
- `currency` (optional): Currency ISO code (e.g., "USD")
- `pageCount` (optional): Required for multi-page products

**Response:**
```json
[
  {
    "productUid": "cards_pf_5r_pt_100-lb-cover-coated-silk_cl_4-4_hor",
    "country": "US",
    "quantity": 20,
    "price": 87.88,
    "currency": "USD",
    "pageCount": null
  },
  {
    "productUid": "cards_pf_5r_pt_100-lb-cover-coated-silk_cl_4-4_hor",
    "country": "US",
    "quantity": 100,
    "price": 299.99,
    "currency": "USD",
    "pageCount": null
  }
]
```

---

## Stock Availability API

### Check Stock for Products
```
POST https://product.gelatoapis.com/v3/stock/region-availability
```

**Request:**
```json
{
  "products": [
    "cards_pf_5r_pt_100-lb-cover-coated-silk_cl_4-4_hor",
    "frame_and_poster_product_..."
  ]
}
```

**Response:**
```json
{
  "productsAvailability": [
    {
      "productUid": "cards_pf_5r_pt_100-lb-cover-coated-silk_cl_4-4_hor",
      "availability": [
        { "stockRegionUid": "US-CA", "status": "non-stockable", "replenishmentDate": null },
        { "stockRegionUid": "EU", "status": "non-stockable", "replenishmentDate": null }
      ]
    }
  ]
}
```

**Stock Status Values:**
- `in-stock` - Available at Gelato Partners
- `out-of-stock-replenishable` - Temporarily out, replenishment coming
- `out-of-stock` - Currently unavailable
- `non-stockable` - Printable items (cards, posters) - always available
- `not-supported` - Product not recognized

**Stock Regions:**
- `US-CA` - United States & Canada
- `EU` - Europe
- `UK` - United Kingdom
- `OC` - Oceania
- `AS` - Asia
- `SA` - South America
- `ROW` - Rest of World

---

## Webhooks

Configure webhooks in Gelato API Portal to receive order updates.

### Event Types

| Event | Description |
|-------|-------------|
| `order_status_updated` | Order status changed |
| `order_item_status_updated` | Item status changed |
| `order_item_tracking_code_updated` | Tracking code available |
| `order_delivery_estimate_updated` | Delivery estimate changed (Beta) |
| `store_product_created` | Store product created |
| `store_product_updated` | Store product updated |
| `store_product_deleted` | Store product deleted |

### Order Status Updated Example
```json
{
  "id": "os_5e5680ce494f6",
  "event": "order_status_updated",
  "orderId": "a6a1f9ce-2bdd-4a9e-9f8d-0009df0e24d9",
  "orderReferenceId": "my-order-123",
  "fulfillmentStatus": "shipped",
  "items": [
    {
      "itemReferenceId": "item-1",
      "fulfillmentStatus": "shipped",
      "fulfillments": [
        {
          "trackingCode": "1Z999AA10123456784",
          "trackingUrl": "https://tracking.example.com/1Z999AA10123456784",
          "shipmentMethodName": "UPS Ground",
          "fulfillmentCountry": "US"
        }
      ]
    }
  ]
}
```

### Webhook Requirements
- Must use HTTPS (TLS encrypted)
- Return HTTP 2xx for success
- Retries: 3 attempts with 5 second delay

---

## Important Notes

1. **No Print Spec API**: Gelato does NOT provide bleed/trim/safe zone data via API. We maintain our own `PrintSpec` library in `lib/printSpecs.ts`.

2. **Direct Pricing Available**: Use `/products/{productUid}/prices` for pricing. The Quote API is for shipping estimates.

3. **File Requirements**: 
   - Supported formats: PDF, PNG, TIFF, SVG, JPEG
   - PDF files should use PDF/X-1a:2003 or PDF/X-4 standard
   - For folded cards, use `type: "inside"` for inner pages

4. **Currency**: The currency in order requests applies only for wallet/credit card payments.

5. **Shipping**: If `shipmentMethodUid` is not provided, Gelato selects the cheapest available method.

6. **Stock**: Most printable products (cards, posters) are `non-stockable` - they can always be printed on demand. Stock checking is mainly for frames, hangers, etc.

