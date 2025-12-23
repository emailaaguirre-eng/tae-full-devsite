# Gelato Paper Options & Foil Accents Integration

## Overview
This document explains how to integrate Gelato's paper options and foil accent capabilities into the design editor and order process.

---

## 1. Gelato API Product Information

### Product UID Structure

Gelato uses Product UIDs that encode product specifications:
```
cards_pf_a5_pt_350-gsm-coated-silk_cl_4-4_ver
│     │  │  │  │                    │  │  │  │
│     │  │  │  │                    │  │  │  └─ Version
│     │  │  │  │                    │  │  └─ Print sides (4-4 = both sides)
│     │  │  │  │                    │  └─ Coating/finish
│     │  │  │  │                    └─ Paper type
│     │  │  │  └─ Paper weight/thickness
│     │  │  └─ Size format
│     │  └─ Product format
│     └─ Product category
└─ Product type
```

### API Endpoints for Product Information

#### Get All Products
```typescript
GET /v4/products
```

**Response includes**:
- Product UIDs
- Product names
- Available sizes
- Paper types
- Finishes
- Options (including foil)

#### Get Specific Product Details
```typescript
GET /v4/products/{productUid}
```

**Response includes**:
- Full product specifications
- Available options/variants
- Pricing
- Paper options
- Foil capabilities (if available)

---

## 2. Gelato Paper Options for Cards

### Common Paper Types (from Gelato Catalog)

#### Standard Card Papers:
1. **Premium Cardstock (350gsm)**
   - Product UID pattern: `cards_*_350-gsm-*`
   - Thick, durable
   - Suitable for greeting cards

2. **Coated Silk (350gsm)**
   - Product UID pattern: `cards_*_350-gsm-coated-silk_*`
   - Smooth, premium finish
   - Good for photos

3. **Matte Cardstock (350gsm)**
   - Product UID pattern: `cards_*_350-gsm-matte_*`
   - Non-reflective finish
   - Elegant appearance

4. **Linen Cardstock (350gsm)**
   - Product UID pattern: `cards_*_350-gsm-linen_*`
   - Textured finish
   - Premium feel

5. **Recycled Cardstock (350gsm)**
   - Product UID pattern: `cards_*_350-gsm-recycled_*`
   - Eco-friendly option

#### Paper Weights Available:
- 250gsm (lighter)
- 300gsm (standard)
- 350gsm (premium, most common for cards)
- 400gsm (extra thick)

#### Finishes:
- Glossy
- Matte
- Silk/Coated
- Linen/Textured
- Uncoated

---

## 3. Foil Accents in Gelato

### Foil Capabilities

Gelato offers **foil stamping** on greeting cards. This is typically:
- **Hot foil stamping** (metallic foil pressed into paper)
- Available in various colors (gold, silver, rose gold, etc.)
- Applied to specific design elements
- Requires special design preparation

### Foil in Design Editor

**Important**: Foil accents need to be:
1. **Designed as separate layer** in the design editor
2. **Marked as "foil"** in the design data
3. **Sent as special instructions** to Gelato API

### Design Editor Implementation

```typescript
interface FoilAccent {
  id: string;
  type: 'foil';
  color: 'gold' | 'silver' | 'rose-gold' | 'copper' | 'holographic';
  elements: Array<{
    shape: 'text' | 'image' | 'path';
    data: string; // Text content, image path, or SVG path
    position: { x: number; y: number };
    size: { width: number; height: number };
  }>;
  surface: 'front' | 'back' | 'inside';
}

// In PersonalizationStudio
const addFoilAccent = (color: FoilColor, surface: 'front' | 'back' | 'inside') => {
  // Create foil layer
  const foilLayer = {
    type: 'foil',
    color: color,
    surface: surface,
    elements: []
  };
  
  // Add to design
  addDesignLayer(foilLayer);
  
  // Visual indicator in editor (e.g., gold overlay)
  showFoilPreview(foilLayer);
};
```

---

## 4. Fetching Product Options from Gelato API

### Enhanced Gelato API Functions

```typescript
// lib/gelato.ts

/**
 * Get product details including all options
 */
export async function getGelatoProductDetails(productUid: string) {
  try {
    const response = await fetch(`${GELATO_API_URL}/products/${productUid}`, {
      headers: {
        'X-API-KEY': GELATO_API_KEY || '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch product details');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching product details:', error);
    throw error;
  }
}

/**
 * Get all available paper options for a product category
 */
export async function getGelatoPaperOptions(category: 'cards' | 'invitations' | 'announcements') {
  try {
    // Fetch all products in category
    const products = await getGelatoProducts();
    
    // Filter by category and extract paper options
    const cardProducts = products.filter(p => 
      p.productUid.startsWith('cards_') || 
      p.productUid.startsWith('invitations_')
    );
    
    // Extract unique paper options
    const paperOptions = new Set<string>();
    cardProducts.forEach(product => {
      // Parse Product UID to extract paper type
      const paperMatch = product.productUid.match(/(\d+)-gsm-([^-]+)/);
      if (paperMatch) {
        paperOptions.add(`${paperMatch[1]}gsm ${paperMatch[2]}`);
      }
    });
    
    return Array.from(paperOptions).map(option => ({
      name: option,
      productUids: cardProducts
        .filter(p => p.productUid.includes(option.replace(' ', '-')))
        .map(p => p.productUid)
    }));
  } catch (error) {
    console.error('Error fetching paper options:', error);
    return [];
  }
}

/**
 * Get foil options for a product
 */
export async function getGelatoFoilOptions(productUid: string) {
  try {
    const productDetails = await getGelatoProductDetails(productUid);
    
    // Check if product supports foil
    if (productDetails.options && productDetails.options.foil) {
      return productDetails.options.foil.colors || [];
    }
    
    // Alternative: Check product UID for foil indicator
    if (productUid.includes('_foil_')) {
      // Extract foil colors from product name or metadata
      return ['gold', 'silver', 'rose-gold', 'copper'];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching foil options:', error);
    return [];
  }
}
```

---

## 5. Product Options Interface

### Enhanced Product Configuration

```typescript
interface GelatoProductOption {
  paperType: {
    name: string;
    weight: string; // e.g., "350gsm"
    finish: string; // e.g., "coated-silk", "matte", "linen"
    productUid: string;
    price: number;
  };
  foil?: {
    available: boolean;
    colors: Array<{
      name: string;
      value: string; // API value
      price: number;
    }>;
  };
  size: {
    folded: { width: number; height: number };
    unfolded: { width: number; height: number };
  };
}

// Example product options structure
const cardProductOptions: GelatoProductOption[] = [
  {
    paperType: {
      name: "Premium Cardstock",
      weight: "350gsm",
      finish: "coated-silk",
      productUid: "cards_pf_a5_pt_350-gsm-coated-silk_cl_4-4_ver",
      price: 0 // Base price
    },
    foil: {
      available: true,
      colors: [
        { name: "Gold", value: "gold", price: 5.00 },
        { name: "Silver", value: "silver", price: 5.00 },
        { name: "Rose Gold", value: "rose-gold", price: 6.00 },
        { name: "Copper", value: "copper", price: 5.00 }
      ]
    },
    size: {
      folded: { width: 5, height: 7 },
      unfolded: { width: 10, height: 7 }
    }
  },
  {
    paperType: {
      name: "Matte Cardstock",
      weight: "350gsm",
      finish: "matte",
      productUid: "cards_pf_a5_pt_350-gsm-matte_cl_4-4_ver",
      price: 0
    },
    foil: {
      available: true,
      colors: [
        { name: "Gold", value: "gold", price: 5.00 },
        { name: "Silver", value: "silver", price: 5.00 }
      ]
    },
    size: {
      folded: { width: 5, height: 7 },
      unfolded: { width: 10, height: 7 }
    }
  }
  // ... more paper options
];
```

---

## 6. Design Editor Integration

### Paper Selection UI

```typescript
// In customize page or design editor
const PaperOptionsPanel = ({ onSelect }: { onSelect: (option: GelatoProductOption) => void }) => {
  const [paperOptions, setPaperOptions] = useState<GelatoProductOption[]>([]);
  
  useEffect(() => {
    // Fetch paper options from Gelato API
    getGelatoPaperOptions('cards').then(options => {
      setPaperOptions(options);
    });
  }, []);
  
  return (
    <div className="paper-options-panel">
      <h3>Select Paper Type</h3>
      <div className="paper-grid">
        {paperOptions.map((option, index) => (
          <div 
            key={index}
            className="paper-option-card"
            onClick={() => onSelect(option)}
          >
            <div className="paper-preview">
              {/* Show paper texture/finish preview */}
              <div className={`paper-swatch ${option.paperType.finish}`}>
                <span>{option.paperType.weight}</span>
              </div>
            </div>
            <div className="paper-name">{option.paperType.name}</div>
            <div className="paper-details">
              {option.paperType.weight} • {option.paperType.finish}
            </div>
            {option.foil?.available && (
              <div className="foil-badge">Foil Available</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Foil Accent Toolbar

```typescript
const FoilAccentToolbar = ({ 
  selectedColor, 
  onColorSelect,
  onAddFoil 
}: {
  selectedColor: string;
  onColorSelect: (color: string) => void;
  onAddFoil: () => void;
}) => {
  const foilColors = [
    { name: 'Gold', value: 'gold', icon: '✨', color: '#FFD700' },
    { name: 'Silver', value: 'silver', icon: '⚪', color: '#C0C0C0' },
    { name: 'Rose Gold', value: 'rose-gold', icon: '🌹', color: '#E8B4B8' },
    { name: 'Copper', value: 'copper', icon: '🔶', color: '#B87333' },
    { name: 'Holographic', value: 'holographic', icon: '🌈', color: 'linear-gradient(...)' }
  ];
  
  return (
    <div className="foil-toolbar">
      <h3>Foil Accents</h3>
      <div className="foil-colors">
        {foilColors.map(color => (
          <button
            key={color.value}
            onClick={() => onColorSelect(color.value)}
            className={`foil-color-button ${selectedColor === color.value ? 'active' : ''}`}
            style={{ backgroundColor: color.color }}
          >
            <span>{color.icon}</span>
            <span>{color.name}</span>
          </button>
        ))}
      </div>
      <button onClick={onAddFoil} className="add-foil-button">
        Add Foil Accent
      </button>
      <p className="foil-instructions">
        Select text or elements, then click "Add Foil Accent" to apply foil
      </p>
    </div>
  );
};
```

### Foil Layer in Canvas

```typescript
// In PersonalizationStudio
const addFoilToElement = (element: fabric.Object, foilColor: string) => {
  // Mark element as foil
  element.set('foil', {
    enabled: true,
    color: foilColor,
    type: 'foil'
  });
  
  // Visual preview (overlay with foil color)
  const foilOverlay = new fabric.Rect({
    left: element.left,
    top: element.top,
    width: element.width,
    height: element.height,
    fill: getFoilPreviewColor(foilColor),
    opacity: 0.3,
    selectable: false,
    evented: false
  });
  
  canvas.add(foilOverlay);
  canvas.renderAll();
  
  // Store foil data
  const foilAccent: FoilAccent = {
    id: generateId(),
    type: 'foil',
    color: foilColor,
    elements: [{
      shape: element.type,
      data: element.toJSON(),
      position: { x: element.left, y: element.top },
      size: { width: element.width, height: element.height }
    }],
    surface: activeSurface
  };
  
  addFoilAccent(foilAccent);
};
```

---

## 7. Order Submission with Options

### Enhanced Order Interface

```typescript
interface GelatoProduct {
  productUid: string;
  quantity: number;
  files?: Array<{
    url: string;
    type: string;
  }>;
  options?: {
    paperType?: string;
    foil?: {
      enabled: boolean;
      color?: string;
      elements?: Array<{
        type: string;
        data: any;
        position: { x: number; y: number };
      }>;
    };
  };
}

// Updated createGelatoOrder function
export async function createGelatoOrder(orderData: GelatoOrder) {
  try {
    // Build order items with options
    const items = orderData.items.map(item => ({
      productUid: item.productUid,
      quantity: item.quantity,
      files: item.files,
      // Add options if available
      ...(item.options && { options: item.options })
    }));
    
    const response = await fetch(`${GELATO_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'X-API-KEY': GELATO_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...orderData,
        items: items
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gelato API error: ${JSON.stringify(error)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating Gelato order:', error);
    throw error;
  }
}
```

### Foil Design File Preparation

**Important**: Foil elements need to be in a **separate layer/file** for Gelato:

```typescript
const prepareFoilDesignFile = async (
  baseDesign: Blob,
  foilAccents: FoilAccent[]
): Promise<{ baseDesign: Blob; foilDesign: Blob }> => {
  // Base design (normal printing)
  const baseCanvas = await loadImageToCanvas(baseDesign);
  
  // Remove foil elements from base
  foilAccents.forEach(foil => {
    // Remove foil-marked elements from base design
    removeFoilElements(baseCanvas, foil);
  });
  
  // Create foil design file (only foil elements)
  const foilCanvas = document.createElement('canvas');
  foilCanvas.width = baseCanvas.width;
  foilCanvas.height = baseCanvas.height;
  const foilCtx = foilCanvas.getContext('2d');
  
  // Draw only foil elements
  foilAccents.forEach(foil => {
    drawFoilElements(foilCanvas, foil);
  });
  
  return {
    baseDesign: await canvasToBlob(baseCanvas),
    foilDesign: await canvasToBlob(foilCanvas)
  };
};
```

---

## 8. API Response Structure (Expected)

### Product Details Response

```json
{
  "productUid": "cards_pf_a5_pt_350-gsm-coated-silk_cl_4-4_ver",
  "name": "5x7 Premium Greeting Card",
  "category": "cards",
  "sizes": [
    {
      "name": "5x7",
      "folded": { "width": 5, "height": 7 },
      "unfolded": { "width": 10, "height": 7 }
    }
  ],
  "paperOptions": [
    {
      "type": "350gsm-coated-silk",
      "name": "Premium Cardstock",
      "productUid": "cards_pf_a5_pt_350-gsm-coated-silk_cl_4-4_ver",
      "price": 0
    },
    {
      "type": "350gsm-matte",
      "name": "Matte Cardstock",
      "productUid": "cards_pf_a5_pt_350-gsm-matte_cl_4-4_ver",
      "price": 0
    }
  ],
  "options": {
    "foil": {
      "available": true,
      "colors": [
        { "name": "Gold", "value": "gold", "price": 5.00 },
        { "name": "Silver", "value": "silver", "price": 5.00 },
        { "name": "Rose Gold", "value": "rose-gold", "price": 6.00 }
      ],
      "requiresSeparateFile": true
    }
  }
}
```

---

## 9. Implementation Checklist

### Phase 1: API Integration
- [ ] Add `getGelatoProductDetails()` function
- [ ] Add `getGelatoPaperOptions()` function
- [ ] Add `getGelatoFoilOptions()` function
- [ ] Test API responses and parse product data

### Phase 2: Design Editor
- [ ] Add paper selection panel
- [ ] Add foil accent toolbar
- [ ] Implement foil layer system
- [ ] Add foil preview visualization
- [ ] Store foil data in design export

### Phase 3: Order Processing
- [ ] Update order interface to include options
- [ ] Prepare separate foil design file
- [ ] Update Gelato order submission
- [ ] Handle foil pricing

### Phase 4: Testing
- [ ] Test paper option selection
- [ ] Test foil accent creation
- [ ] Test order submission with options
- [ ] Verify Gelato receives correct options

---

## 10. Important Notes

### Foil Implementation Considerations

1. **Separate Design File**: Gelato may require foil elements in a separate file
2. **Design Guidelines**: Foil has minimum size requirements (check Gelato docs)
3. **Color Limitations**: Not all colors available for all products
4. **Pricing**: Foil adds cost (typically $3-6 per card)
5. **Production Time**: Foil may add to production time

### Paper Options

1. **Product UID Mapping**: Each paper type has unique Product UID
2. **Dynamic Loading**: Fetch options from API rather than hardcoding
3. **Price Updates**: Prices may change, fetch from API
4. **Availability**: Some papers may not be available in all regions

### API Limitations

1. **Rate Limits**: Be mindful of API rate limits when fetching products
2. **Caching**: Cache product data to reduce API calls
3. **Error Handling**: Handle API errors gracefully
4. **Fallbacks**: Have fallback options if API fails

---

## 11. Next Steps

1. **Test Gelato API**: Call `/v4/products` to see actual response structure
2. **Verify Foil Support**: Check if your Gelato account has foil enabled
3. **Get Product Catalog**: Fetch all card products and parse options
4. **Implement UI**: Add paper and foil selection to design editor
5. **Test Order Flow**: Submit test order with paper/foil options

---

## Summary

**Yes, the Gelato API provides product information**, but you may need to:
- Parse Product UIDs to extract paper options
- Check product details endpoint for foil capabilities
- Handle foil as separate design layer/file
- Map customer selections to correct Product UIDs

**Key Implementation Points**:
- ✅ Fetch product options from Gelato API
- ✅ Display paper options in design editor
- ✅ Add foil accent tools to editor
- ✅ Prepare separate foil design file
- ✅ Include options in order submission

The API should provide enough information, but you'll need to parse and structure it for your UI.

