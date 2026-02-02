# Product Options by Type

## Overview
Different product types have different customization options available through Gelato. This document outlines all options for each product category.

---

## 1. Cards (Greeting Cards, Invitations, Announcements)

### Available Options:

#### Paper Type
- Premium Cardstock (350gsm)
- Coated Silk (350gsm)
- Matte Cardstock (350gsm)
- Linen Cardstock (350gsm)
- Recycled Cardstock (350gsm)

#### Foil Accents
- Gold foil
- Silver foil
- Rose gold foil
- Copper foil
- Holographic foil (if available)

#### Size Options
- 4" x 6" (folded)
- 5" x 7" (folded)
- 6" x 9" (folded)

#### Surfaces
- Front (editable)
- Back (editable)
- Inside (editable)

**Gelato Product UID**: `cards_cl_dtc_prt_pt` or variations

---

## 2. Wall Art / Art Prints

### Available Options:

#### Paper/Canvas Type
- **Glossy Paper** (standard prints)
- **Matte Paper** (non-reflective)
- **Canvas** (gallery-wrapped)
- **Metal Print** (aluminum)
- **Acrylic Print** (if available)
- **Wood Print** (if available)

#### Framing Options
- **Unframed** (print only)
- **Framed** (with frame)
  - Frame colors: Black, White, Silver, Natural Wood
  - Frame styles: Modern, Classic, Ornate
  - Matting options (if available)

#### Size Options
- 5" x 7"
- 8" x 10"
- 11" x 14"
- 16" x 20"
- 20" x 24"
- 24" x 36"
- Custom sizes (if available)

#### Finish Options
- Standard finish
- UV protection (if available)
- Lamination (if available)

**Gelato Product UIDs**:
- Paper prints: `prints_pt_cl`
- Canvas: `canvas_print_gallery_wrap`
- Metal: `metal_prints`

---

## 3. Postcards

### Available Options:

#### Paper Type
- Standard postcard stock
- Premium postcard stock
- Recycled postcard stock

#### Finish
- Glossy
- Matte

#### Size Options
- 4" x 6" (standard)
- 5" x 7" (oversized)
- 6" x 9" (jumbo)

#### Surfaces
- Front only (single-sided)
- Front + Back (double-sided, if available)

**Gelato Product UID**: `postcards_pt`

---

## 4. Product Options Interface Structure

### Type-Safe Options Interface

```typescript
type ProductType = 'card' | 'invitation' | 'announcement' | 'postcard' | 'print' | 'canvas' | 'metal';

interface ProductOptions {
  card: {
    paperType: PaperOption[];
    foil: FoilOption[];
    size: SizeOption[];
    surfaces: ('front' | 'back' | 'inside')[];
  };
  invitation: {
    paperType: PaperOption[];
    foil: FoilOption[];
    size: SizeOption[];
    surfaces: ('front' | 'back' | 'inside')[];
  };
  announcement: {
    paperType: PaperOption[];
    foil: FoilOption[];
    size: SizeOption[];
    surfaces: ('front' | 'back' | 'inside')[];
  };
  postcard: {
    paperType: PaperOption[];
    finish: FinishOption[];
    size: SizeOption[];
    surfaces: ('front' | 'back')[];
  };
  print: {
    paperType: PaperOption[];
    size: SizeOption[];
    frame: FrameOption[];
    finish: FinishOption[];
  };
  canvas: {
    size: SizeOption[];
    frame: FrameOption[];
    wrapStyle: WrapStyleOption[];
  };
  metal: {
    size: SizeOption[];
    finish: MetalFinishOption[];
  };
}

interface PaperOption {
  id: string;
  name: string;
  weight: string; // e.g., "350gsm"
  finish: string; // e.g., "coated-silk", "matte"
  productUid: string;
  price: number;
}

interface FrameOption {
  id: string;
  name: string;
  color: string;
  style: string;
  price: number;
  includesMatting: boolean;
}

interface FoilOption {
  id: string;
  name: string;
  color: string;
  price: number;
}
```

---

## 5. Design Editor Options Panel

### Dynamic Options Based on Product Type

```typescript
// In customize page or design editor
const ProductOptionsPanel = ({ 
  productType, 
  onOptionSelect 
}: { 
  productType: ProductType;
  onOptionSelect: (option: any) => void;
}) => {
  const [options, setOptions] = useState<ProductOptions[typeof productType] | null>(null);
  
  useEffect(() => {
    // Fetch options for this product type
    fetchProductOptions(productType).then(setOptions);
  }, [productType]);
  
  if (!options) return <div>Loading options...</div>;
  
  return (
    <div className="product-options-panel">
      {/* Cards/Invitations/Announcements */}
      {(productType === 'card' || productType === 'invitation' || productType === 'announcement') && (
        <>
          <PaperTypeSelector 
            options={options.paperType}
            onSelect={(paper) => onOptionSelect({ paperType: paper })}
          />
          <FoilAccentSelector
            options={options.foil}
            onSelect={(foil) => onOptionSelect({ foil: foil })}
          />
        </>
      )}
      
      {/* Postcards */}
      {productType === 'postcard' && (
        <>
          <PaperTypeSelector 
            options={options.paperType}
            onSelect={(paper) => onOptionSelect({ paperType: paper })}
          />
          <FinishSelector
            options={options.finish}
            onSelect={(finish) => onOptionSelect({ finish: finish })}
          />
        </>
      )}
      
      {/* Art Prints */}
      {productType === 'print' && (
        <>
          <PaperTypeSelector 
            options={options.paperType}
            onSelect={(paper) => onOptionSelect({ paperType: paper })}
          />
          <FrameSelector
            options={options.frame}
            onSelect={(frame) => onOptionSelect({ frame: frame })}
          />
          <FinishSelector
            options={options.finish}
            onSelect={(finish) => onOptionSelect({ finish: finish })}
          />
        </>
      )}
      
      {/* Canvas Prints */}
      {productType === 'canvas' && (
        <>
          <FrameSelector
            options={options.frame}
            onSelect={(frame) => onOptionSelect({ frame: frame })}
          />
          <WrapStyleSelector
            options={options.wrapStyle}
            onSelect={(wrap) => onOptionSelect({ wrapStyle: wrap })}
          />
        </>
      )}
      
      {/* Metal Prints */}
      {productType === 'metal' && (
        <>
          <MetalFinishSelector
            options={options.finish}
            onSelect={(finish) => onOptionSelect({ finish: finish })}
          />
        </>
      )}
    </div>
  );
};
```

---

## 6. Frame Options for Art Prints

### Frame Configuration

```typescript
const frameOptions: FrameOption[] = [
  {
    id: 'unframed',
    name: 'Unframed',
    color: 'none',
    style: 'none',
    price: 0,
    includesMatting: false
  },
  {
    id: 'black-modern',
    name: 'Black Modern Frame',
    color: 'black',
    style: 'modern',
    price: 25.00,
    includesMatting: false
  },
  {
    id: 'white-modern',
    name: 'White Modern Frame',
    color: 'white',
    style: 'modern',
    price: 25.00,
    includesMatting: false
  },
  {
    id: 'silver-modern',
    name: 'Silver Modern Frame',
    color: 'silver',
    style: 'modern',
    price: 28.00,
    includesMatting: false
  },
  {
    id: 'black-classic',
    name: 'Black Classic Frame',
    color: 'black',
    style: 'classic',
    price: 30.00,
    includesMatting: true
  },
  {
    id: 'natural-wood',
    name: 'Natural Wood Frame',
    color: 'natural',
    style: 'classic',
    price: 35.00,
    includesMatting: true
  }
];
```

### Frame Selection UI

```typescript
const FrameSelector = ({ 
  options, 
  selected, 
  onSelect 
}: {
  options: FrameOption[];
  selected: string;
  onSelect: (frameId: string) => void;
}) => {
  return (
    <div className="frame-selector">
      <h3>Framing Options</h3>
      <div className="frame-grid">
        {options.map(frame => (
          <div
            key={frame.id}
            className={`frame-option ${selected === frame.id ? 'selected' : ''}`}
            onClick={() => onSelect(frame.id)}
          >
            <div className="frame-preview">
              {/* Show frame preview */}
              <div className={`frame-swatch frame-${frame.color} frame-${frame.style}`}>
                {frame.id === 'unframed' ? (
                  <span>No Frame</span>
                ) : (
                  <>
                    <div className="frame-border"></div>
                    {frame.includesMatting && <div className="matting"></div>}
                  </>
                )}
              </div>
            </div>
            <div className="frame-name">{frame.name}</div>
            <div className="frame-price">
              {frame.price === 0 ? 'Included' : `+$${frame.price.toFixed(2)}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 7. Gelato Product Mapping

### Product Type → Gelato Product UID Mapping

```typescript
const gelatoProductMapping: Record<ProductType, GelatoProductConfig[]> = {
  card: [
    {
      productUid: 'cards_cl_dtc_prt_pt',
      paperType: '350gsm-coated-silk',
      size: { folded: { width: 5, height: 7 } },
      foilAvailable: true
    },
    {
      productUid: 'cards_cl_dtc_prt_pt',
      paperType: '350gsm-matte',
      size: { folded: { width: 5, height: 7 } },
      foilAvailable: true
    }
    // ... more card options
  ],
  
  print: [
    {
      productUid: 'prints_pt_cl',
      paperType: 'glossy',
      size: { width: 8, height: 10 },
      frameAvailable: true
    },
    {
      productUid: 'prints_pt_cl',
      paperType: 'matte',
      size: { width: 8, height: 10 },
      frameAvailable: true
    }
    // ... more print options
  ],
  
  canvas: [
    {
      productUid: 'canvas_print_gallery_wrap',
      size: { width: 16, height: 20 },
      frameAvailable: true,
      wrapStyle: 'gallery-wrap'
    }
    // ... more canvas options
  ],
  
  metal: [
    {
      productUid: 'metal_prints',
      size: { width: 16, height: 20 },
      finish: 'glossy'
    }
    // ... more metal options
  ]
};
```

---

## 8. Order Submission with Product-Specific Options

### Enhanced Order Interface

```typescript
interface GelatoOrderItem {
  productUid: string;
  quantity: number;
  files: Array<{ url: string; type: string }>;
  options: {
    // Card options
    paperType?: string;
    foil?: {
      enabled: boolean;
      color?: string;
      elements?: any[];
    };
    
    // Print options
    frame?: {
      enabled: boolean;
      color?: string;
      style?: string;
      includesMatting?: boolean;
    };
    finish?: string;
    
    // Canvas options
    wrapStyle?: string;
    
    // Metal options
    metalFinish?: string;
  };
}

// When creating order
const createOrderWithOptions = async (
  productType: ProductType,
  selectedOptions: any
) => {
  // Map options to Gelato format
  const gelatoOptions: any = {};
  
  if (productType === 'card' || productType === 'invitation' || productType === 'announcement') {
    gelatoOptions.paperType = selectedOptions.paperType?.productUid;
    if (selectedOptions.foil?.enabled) {
      gelatoOptions.foil = {
        enabled: true,
        color: selectedOptions.foil.color,
        elements: selectedOptions.foil.elements
      };
    }
  }
  
  if (productType === 'print' || productType === 'canvas') {
    if (selectedOptions.frame?.enabled) {
      gelatoOptions.frame = {
        enabled: true,
        color: selectedOptions.frame.color,
        style: selectedOptions.frame.style
      };
    }
    if (selectedOptions.finish) {
      gelatoOptions.finish = selectedOptions.finish;
    }
  }
  
  // Create Gelato order
  await createGelatoOrder({
    ...orderData,
    items: [{
      productUid: getProductUid(productType, selectedOptions),
      quantity: selectedOptions.quantity,
      files: designFiles,
      options: gelatoOptions
    }]
  });
};
```

---

## 9. Options Flow in Design Editor

### Step-by-Step Options Selection

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Product Type Selection                               │
│ Customer selects: Card, Print, Canvas, etc.                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Size Selection                                       │
│ Based on product type, show available sizes                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Product-Specific Options                            │
│                                                              │
│ Cards/Invitations:                                           │
│  - Paper type selection                                     │
│  - Foil accent selection                                    │
│                                                              │
│ Prints/Canvas:                                              │
│  - Paper/canvas type                                        │
│  - Frame selection (framed/unframed)                        │
│  - Frame color/style                                        │
│  - Finish options                                           │
│                                                              │
│ Metal Prints:                                                │
│  - Finish selection                                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Design Creation                                      │
│ Open design editor with selected options                     │
│ Options affect available tools (e.g., foil tool for cards)   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Add to Cart                                          │
│ All options saved with product                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Summary

### Cards/Invitations/Announcements
- ✅ Paper type options
- ✅ Foil accent options
- ✅ Multi-surface editing
- ✅ Size options

### Art Prints
- ✅ Paper type options
- ✅ Frame options (framed/unframed)
- ✅ Frame colors/styles
- ✅ Finish options
- ✅ Size options

### Canvas Prints
- ✅ Frame options
- ✅ Wrap style options
- ✅ Size options

### Metal Prints
- ✅ Finish options
- ✅ Size options

### Postcards
- ✅ Paper type options
- ✅ Finish options
- ✅ Size options
- ✅ Single or double-sided

**Key Point**: Each product type shows only its relevant options in the design editor, ensuring a clean, focused user experience.

