# Multi-Surface Card Editor & Skeleton Key Implementation

## Overview
Enhanced PersonalizationStudio to support:
1. **Multi-surface card editing** (front, back, inside)
2. **Multiple Skeleton Key options** (different styles/sizes)
3. **Invitations, announcements, postcards** with Gelato dimensions
4. **Placeable Skeleton Keys** on any surface

---

## 1. Gelato Product Dimensions

### Cards (Folded)
**Gelato Product UID**: `cards_cl_dtc_prt_pt`

Standard folded card dimensions (when unfolded for printing):
- **5" x 7" Card**: Unfolded = 10" x 7" (front + back + inside)
- **4" x 6" Card**: Unfolded = 8" x 6"
- **6" x 9" Card**: Unfolded = 12" x 9"

**Card Structure** (when unfolded):
```
┌─────────┬─────────┬─────────┐
│  BACK   │  INSIDE │  FRONT  │
│  (left) │ (center)│ (right) │
└─────────┴─────────┴─────────┘
```

### Invitations
**Gelato Product UID**: `cards_cl_dtc_prt_pt` (same as cards)

Common invitation sizes:
- **5" x 7" Invitation**: Unfolded = 10" x 7"
- **6" x 9" Invitation**: Unfolded = 12" x 9"
- **A6 Invitation**: Unfolded = 11.7" x 8.3"

### Announcements
**Gelato Product UID**: `cards_cl_dtc_prt_pt`

Common announcement sizes:
- **5" x 7" Announcement**: Unfolded = 10" x 7"
- **4" x 6" Announcement**: Unfolded = 8" x 6"

### Postcards
**Gelato Product UID**: `postcards_pt` or `prints_pt_cl`

Postcards are single-sided (no fold):
- **4" x 6" Postcard**: 4" x 6" (single surface)
- **5" x 7" Postcard**: 5" x 7" (single surface)
- **6" x 9" Postcard**: 6" x 9" (single surface)

---

## 2. Multi-Surface Editor Structure

### Interface Design

```typescript
interface CardEditorProps {
  productType: 'card' | 'invitation' | 'announcement' | 'postcard';
  gelatoProductUid: string;
  dimensions: {
    unfolded: { width: number; height: number }; // Full unfolded size
    folded: { width: number; height: number };   // Folded size
    surfaces: {
      front: { x: number; y: number; width: number; height: number };
      back: { x: number; y: number; width: number; height: number };
      inside?: { x: number; y: number; width: number; height: number }; // Optional for postcards
    };
  };
  onComplete: (designData: MultiSurfaceDesignOutput) => void;
}

interface MultiSurfaceDesignOutput {
  surfaces: {
    front: DesignSurface;
    back: DesignSurface;
    inside?: DesignSurface; // Optional for postcards
  };
  skeletonKeys: Array<{
    surface: 'front' | 'back' | 'inside';
    keyType: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
  }>;
  gelatoProductUid: string;
  dimensions: CardDimensions;
}

interface DesignSurface {
  canvasData: string; // Fabric.js JSON or image data
  elements: Array<FabricObject>;
}
```

### Editor Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Multi-Surface Card Editor                                  │
├─────────────────────────────────────────────────────────────┤
│  [Surface Tabs]  Front | Back | Inside                      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  [Current Surface Canvas]                             │ │
│  │                                                        │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │ │
│  │  │   BACK   │  │  INSIDE  │  │  FRONT   │          │ │
│  │  │          │  │          │  │          │          │ │
│  │  │          │  │          │  │          │          │ │
│  │  └──────────┘  └──────────┘  └──────────┘          │ │
│  │                                                        │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                              │
│  [Toolbar]  Images | Text | Skeleton Keys | Filters | ...   │
│                                                              │
│  [Skeleton Key Options Panel]                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Key 1    │ │ Key 2    │ │ Key 3    │ │ Key 4    │      │
│  │ [Icon]   │ │ [Icon]   │ │ [Icon]   │ │ [Icon]   │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Skeleton Key Options

### Key Variations

```typescript
interface SkeletonKeyOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  preview: string; // Preview image/data URL
  dimensions: {
    width: number;  // In inches
    height: number; // In inches
  };
  style: 'minimal' | 'decorative' | 'corner' | 'centered' | 'custom';
  description: string;
}

const skeletonKeyOptions: SkeletonKeyOption[] = [
  {
    id: 'key-minimal-small',
    name: 'Minimal (Small)',
    icon: <QrCode className="w-5 h-5" />,
    dimensions: { width: 0.75, height: 0.75 }, // 0.75" x 0.75"
    style: 'minimal',
    description: 'Small, subtle QR placeholder'
  },
  {
    id: 'key-minimal-medium',
    name: 'Minimal (Medium)',
    icon: <QrCode className="w-6 h-6" />,
    dimensions: { width: 1, height: 1 }, // 1" x 1"
    style: 'minimal',
    description: 'Standard size QR placeholder'
  },
  {
    id: 'key-minimal-large',
    name: 'Minimal (Large)',
    icon: <QrCode className="w-8 h-8" />,
    dimensions: { width: 1.5, height: 1.5 }, // 1.5" x 1.5"
    style: 'minimal',
    description: 'Large QR placeholder'
  },
  {
    id: 'key-decorative-corner',
    name: 'Decorative Corner',
    icon: <CornerDownRight className="w-5 h-5" />,
    dimensions: { width: 1, height: 1 },
    style: 'decorative',
    description: 'Ornate corner design with QR space'
  },
  {
    id: 'key-decorative-center',
    name: 'Decorative Center',
    icon: <CircleDot className="w-5 h-5" />,
    dimensions: { width: 1.25, height: 1.25 },
    style: 'decorative',
    description: 'Centered decorative frame'
  },
  {
    id: 'key-artistic',
    name: 'Artistic Frame',
    icon: <Frame className="w-5 h-5" />,
    dimensions: { width: 1.5, height: 1.5 },
    style: 'decorative',
    description: 'Artistic border with QR space'
  },
  {
    id: 'key-custom',
    name: 'Custom Size',
    icon: <Square className="w-5 h-5" />,
    dimensions: { width: 1, height: 1 }, // Default, user can resize
    style: 'custom',
    description: 'Fully customizable size and position'
  }
];
```

### Skeleton Key Placement

```typescript
// In PersonalizationStudio
const addSkeletonKey = (keyOption: SkeletonKeyOption, surface: 'front' | 'back' | 'inside') => {
  // Get current surface canvas
  const canvas = getSurfaceCanvas(surface);
  
  // Create placeholder QR based on key option
  const placeholderQR = createPlaceholderQRCode(keyOption);
  
  // Add to canvas
  fabric.Image.fromURL(placeholderQR, (img) => {
    // Convert inches to pixels (at 300 DPI)
    const widthPx = keyOption.dimensions.width * 300;
    const heightPx = keyOption.dimensions.height * 300;
    
    img.set({
      left: canvas.width / 2 - widthPx / 2, // Center by default
      top: canvas.height / 2 - heightPx / 2,
      scaleX: 1,
      scaleY: 1,
      // Mark as skeleton key
      name: 'skeleton-key',
      type: 'skeleton-key',
      metadata: {
        isPlaceholder: true,
        placeholderType: 'qr-code',
        keyOptionId: keyOption.id,
        keyStyle: keyOption.style,
        surface: surface,
        size: {
          width: keyOption.dimensions.width,
          height: keyOption.dimensions.height
        }
      }
    });
    
    // Make it draggable and resizable
    img.setControlsVisibility({
      mt: true, // Top
      mb: true, // Bottom
      ml: true, // Left
      mr: true, // Right
      mtr: true // Rotate
    });
    
    canvas.add(img);
    canvas.setActiveObject(img);
    canvas.renderAll();
  });
};
```

---

## 4. Gelato Product Configuration

### Product Type Definitions

```typescript
interface GelatoProductConfig {
  productUid: string;
  type: 'card' | 'invitation' | 'announcement' | 'postcard';
  name: string;
  dimensions: {
    folded: { width: number; height: number };
    unfolded: { width: number; height: number };
  };
  surfaces: ('front' | 'back' | 'inside')[];
  dpi: number; // Usually 300
}

const gelatoProducts: GelatoProductConfig[] = [
  // Cards
  {
    productUid: 'cards_cl_dtc_prt_pt',
    type: 'card',
    name: '5" x 7" Folded Card',
    dimensions: {
      folded: { width: 5, height: 7 },
      unfolded: { width: 10, height: 7 }
    },
    surfaces: ['front', 'back', 'inside'],
    dpi: 300
  },
  {
    productUid: 'cards_cl_dtc_prt_pt',
    type: 'card',
    name: '4" x 6" Folded Card',
    dimensions: {
      folded: { width: 4, height: 6 },
      unfolded: { width: 8, height: 6 }
    },
    surfaces: ['front', 'back', 'inside'],
    dpi: 300
  },
  {
    productUid: 'cards_cl_dtc_prt_pt',
    type: 'card',
    name: '6" x 9" Folded Card',
    dimensions: {
      folded: { width: 6, height: 9 },
      unfolded: { width: 12, height: 9 }
    },
    surfaces: ['front', 'back', 'inside'],
    dpi: 300
  },
  
  // Invitations
  {
    productUid: 'cards_cl_dtc_prt_pt',
    type: 'invitation',
    name: '5" x 7" Invitation',
    dimensions: {
      folded: { width: 5, height: 7 },
      unfolded: { width: 10, height: 7 }
    },
    surfaces: ['front', 'back', 'inside'],
    dpi: 300
  },
  {
    productUid: 'cards_cl_dtc_prt_pt',
    type: 'invitation',
    name: '6" x 9" Invitation',
    dimensions: {
      folded: { width: 6, height: 9 },
      unfolded: { width: 12, height: 9 }
    },
    surfaces: ['front', 'back', 'inside'],
    dpi: 300
  },
  
  // Announcements
  {
    productUid: 'cards_cl_dtc_prt_pt',
    type: 'announcement',
    name: '5" x 7" Announcement',
    dimensions: {
      folded: { width: 5, height: 7 },
      unfolded: { width: 10, height: 7 }
    },
    surfaces: ['front', 'back', 'inside'],
    dpi: 300
  },
  {
    productUid: 'cards_cl_dtc_prt_pt',
    type: 'announcement',
    name: '4" x 6" Announcement',
    dimensions: {
      folded: { width: 4, height: 6 },
      unfolded: { width: 8, height: 6 }
    },
    surfaces: ['front', 'back', 'inside'],
    dpi: 300
  },
  
  // Postcards (single surface)
  {
    productUid: 'postcards_pt',
    type: 'postcard',
    name: '4" x 6" Postcard',
    dimensions: {
      folded: { width: 4, height: 6 },
      unfolded: { width: 4, height: 6 } // Same, no fold
    },
    surfaces: ['front'], // Only front for postcards
    dpi: 300
  },
  {
    productUid: 'postcards_pt',
    type: 'postcard',
    name: '5" x 7" Postcard',
    dimensions: {
      folded: { width: 5, height: 7 },
      unfolded: { width: 5, height: 7 }
    },
    surfaces: ['front'],
    dpi: 300
  },
  {
    productUid: 'postcards_pt',
    type: 'postcard',
    name: '6" x 9" Postcard',
    dimensions: {
      folded: { width: 6, height: 9 },
      unfolded: { width: 6, height: 9 }
    },
    surfaces: ['front'],
    dpi: 300
  }
];
```

---

## 5. Implementation Structure

### Updated PersonalizationStudio Component

```typescript
interface StudioProps {
  productType: 'canvas' | 'print' | 'card' | 'invitation' | 'announcement' | 'postcard';
  gelatoProductUid: string;
  productSize: { width: number; height: number; name: string };
  onComplete: (designData: MultiSurfaceDesignOutput) => void;
  onClose?: () => void;
  initialImages?: string[];
  initialMessage?: string;
}

// State management
const [activeSurface, setActiveSurface] = useState<'front' | 'back' | 'inside'>('front');
const [surfaces, setSurfaces] = useState<{
  front: fabric.Canvas | null;
  back: fabric.Canvas | null;
  inside?: fabric.Canvas | null;
}>({
  front: null,
  back: null,
  inside: null
});
const [skeletonKeys, setSkeletonKeys] = useState<Array<SkeletonKeyData>>([]);
```

### Surface Tab Navigation

```typescript
const SurfaceTabs = () => {
  const productConfig = gelatoProducts.find(p => 
    p.productUid === gelatoProductUid && 
    p.dimensions.folded.width === productSize.width &&
    p.dimensions.folded.height === productSize.height
  );
  
  const availableSurfaces = productConfig?.surfaces || ['front'];
  
  return (
    <div className="surface-tabs">
      {availableSurfaces.includes('back') && (
        <button 
          onClick={() => setActiveSurface('back')}
          className={activeSurface === 'back' ? 'active' : ''}
        >
          Back
        </button>
      )}
      {availableSurfaces.includes('inside') && (
        <button 
          onClick={() => setActiveSurface('inside')}
          className={activeSurface === 'inside' ? 'active' : ''}
        >
          Inside
        </button>
      )}
      <button 
        onClick={() => setActiveSurface('front')}
        className={activeSurface === 'front' ? 'active' : ''}
      >
        Front
      </button>
    </div>
  );
};
```

### Canvas Setup for Each Surface

```typescript
const setupSurfaceCanvas = (surface: 'front' | 'back' | 'inside') => {
  const productConfig = getProductConfig();
  const canvasId = `canvas-${surface}`;
  
  // Calculate surface position in unfolded layout
  const surfaceLayout = calculateSurfaceLayout(productConfig);
  const surfacePos = surfaceLayout[surface];
  
  const canvas = new fabric.Canvas(canvasId, {
    width: surfacePos.width * 300, // Convert inches to pixels at 300 DPI
    height: surfacePos.height * 300,
    backgroundColor: '#ffffff'
  });
  
  // Add guidelines for fold lines (if applicable)
  if (productConfig.type !== 'postcard') {
    addFoldGuidelines(canvas, surfaceLayout);
  }
  
  return canvas;
};

const calculateSurfaceLayout = (config: GelatoProductConfig) => {
  const unfoldedWidth = config.dimensions.unfolded.width;
  const surfaceWidth = unfoldedWidth / 3; // Each surface is 1/3 of unfolded width
  
  return {
    back: {
      x: 0,
      y: 0,
      width: surfaceWidth,
      height: config.dimensions.unfolded.height
    },
    inside: {
      x: surfaceWidth,
      y: 0,
      width: surfaceWidth,
      height: config.dimensions.unfolded.height
    },
    front: {
      x: surfaceWidth * 2,
      y: 0,
      width: surfaceWidth,
      height: config.dimensions.unfolded.height
    }
  };
};
```

### Skeleton Key Toolbar

```typescript
const SkeletonKeyToolbar = () => {
  return (
    <div className="skeleton-key-toolbar">
      <h3>Add Skeleton Key</h3>
      <div className="key-options-grid">
        {skeletonKeyOptions.map((keyOption) => (
          <button
            key={keyOption.id}
            onClick={() => addSkeletonKey(keyOption, activeSurface)}
            className="key-option-button"
          >
            <div className="key-preview">
              {keyOption.icon}
            </div>
            <div className="key-name">{keyOption.name}</div>
            <div className="key-size">
              {keyOption.dimensions.width}" × {keyOption.dimensions.height}"
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
```

---

## 6. Design Export

### Multi-Surface Export

```typescript
const exportMultiSurfaceDesign = async (): Promise<MultiSurfaceDesignOutput> => {
  const surfaces: {
    front: DesignSurface;
    back: DesignSurface;
    inside?: DesignSurface;
  } = {
    front: await exportSurface('front'),
    back: await exportSurface('back')
  };
  
  if (surfaces.inside !== undefined) {
    surfaces.inside = await exportSurface('inside');
  }
  
  // Collect all skeleton keys from all surfaces
  const allSkeletonKeys = collectSkeletonKeys();
  
  // Create final unfolded design (for Gelato)
  const unfoldedDesign = await createUnfoldedDesign(surfaces);
  
  return {
    surfaces,
    skeletonKeys: allSkeletonKeys,
    gelatoProductUid,
    dimensions: productConfig.dimensions,
    unfoldedDesign: {
      imageDataUrl: unfoldedDesign.dataUrl,
      imageBlob: unfoldedDesign.blob
    }
  };
};

const createUnfoldedDesign = async (surfaces: DesignSurfaces) => {
  // Create canvas for full unfolded size
  const canvas = document.createElement('canvas');
  const config = getProductConfig();
  canvas.width = config.dimensions.unfolded.width * 300;
  canvas.height = config.dimensions.unfolded.height * 300;
  const ctx = canvas.getContext('2d');
  
  // Draw each surface in correct position
  const layout = calculateSurfaceLayout(config);
  
  // Draw back (left)
  const backImg = await loadImage(surfaces.back.canvasData);
  ctx.drawImage(backImg, layout.back.x * 300, layout.back.y * 300);
  
  // Draw inside (center)
  if (surfaces.inside) {
    const insideImg = await loadImage(surfaces.inside.canvasData);
    ctx.drawImage(insideImg, layout.inside.x * 300, layout.inside.y * 300);
  }
  
  // Draw front (right)
  const frontImg = await loadImage(surfaces.front.canvasData);
  ctx.drawImage(frontImg, layout.front.x * 300, layout.front.y * 300);
  
  // Export as blob
  return new Promise<{ dataUrl: string; blob: Blob }>((resolve) => {
    canvas.toBlob((blob) => {
      resolve({
        dataUrl: canvas.toDataURL('image/png'),
        blob: blob!
      });
    }, 'image/png', 1.0);
  });
};
```

---

## 7. Integration with Existing Flow

### Update Customize Page

```typescript
// In app/customize/page.tsx
const cardTypes = [
  { 
    name: "Holiday Cards", 
    price: 19.99, 
    gelatoUid: "cards_cl_dtc_prt_pt",
    sizes: [
      { name: "5x7", dimensions: { folded: { width: 5, height: 7 }, unfolded: { width: 10, height: 7 } } },
      { name: "4x6", dimensions: { folded: { width: 4, height: 6 }, unfolded: { width: 8, height: 6 } } }
    ]
  },
  // ... more card types
];

const invitationTypes = [
  {
    name: "Wedding Invitations",
    price: 24.99,
    gelatoUid: "cards_cl_dtc_prt_pt",
    sizes: [
      { name: "5x7", dimensions: { folded: { width: 5, height: 7 }, unfolded: { width: 10, height: 7 } } },
      { name: "6x9", dimensions: { folded: { width: 6, height: 9 }, unfolded: { width: 12, height: 9 } } }
    ]
  }
];

const announcementTypes = [
  {
    name: "Birth Announcements",
    price: 16.99,
    gelatoUid: "cards_cl_dtc_prt_pt",
    sizes: [
      { name: "5x7", dimensions: { folded: { width: 5, height: 7 }, unfolded: { width: 10, height: 7 } } },
      { name: "4x6", dimensions: { folded: { width: 4, height: 6 }, unfolded: { width: 8, height: 6 } } }
    ]
  }
];

const postcardTypes = [
  {
    name: "Postcards",
    price: 4.99,
    gelatoUid: "postcards_pt",
    sizes: [
      { name: "4x6", dimensions: { folded: { width: 4, height: 6 }, unfolded: { width: 4, height: 6 } } },
      { name: "5x7", dimensions: { folded: { width: 5, height: 7 }, unfolded: { width: 5, height: 7 } } },
      { name: "6x9", dimensions: { folded: { width: 6, height: 9 }, unfolded: { width: 6, height: 9 } } }
    ]
  }
];
```

---

## 8. Skeleton Key Replacement Workflow

### After Order Completion

```typescript
// In API route: app/api/orders/update-design/route.ts
async function replaceSkeletonKeysInMultiSurfaceDesign(
  designData: MultiSurfaceDesignOutput,
  qrCodeUrl: string
): Promise<Blob> {
  // For each surface that has skeleton keys
  for (const surfaceName of ['front', 'back', 'inside'] as const) {
    const surface = designData.surfaces[surfaceName];
    if (!surface) continue;
    
    // Find skeleton keys on this surface
    const surfaceKeys = designData.skeletonKeys.filter(
      key => key.surface === surfaceName
    );
    
    if (surfaceKeys.length === 0) continue;
    
    // Replace each skeleton key
    for (const key of surfaceKeys) {
      await replaceSkeletonKeyInSurface(
        surface,
        key,
        qrCodeUrl
      );
    }
  }
  
  // Recreate unfolded design with replaced keys
  return await createUnfoldedDesign(designData.surfaces);
}
```

---

## 9. Files to Modify/Create

### Files to Modify:
1. **`components/PersonalizationStudio.tsx`**
   - Add multi-surface support
   - Add surface tab navigation
   - Add skeleton key toolbar
   - Update export to handle multiple surfaces

2. **`app/customize/page.tsx`**
   - Add product type selection (card, invitation, announcement, postcard)
   - Add size selection based on Gelato products
   - Pass correct dimensions to PersonalizationStudio

3. **`lib/gelato.ts`**
   - Add Gelato product configurations
   - Add function to get product dimensions

### New Files to Create:
1. **`lib/skeleton-keys.ts`**
   - Skeleton key option definitions
   - Placeholder QR generation functions

2. **`lib/card-layouts.ts`**
   - Card layout calculations
   - Surface position calculations

3. **`components/SkeletonKeyToolbar.tsx`**
   - Skeleton key selection UI

4. **`components/SurfaceTabs.tsx`**
   - Surface navigation tabs

---

## 10. Summary

**Features Added**:
- ✅ Multi-surface editing (front, back, inside)
- ✅ Multiple Skeleton Key options (7+ variations)
- ✅ Placeable Skeleton Keys on any surface
- ✅ Support for cards, invitations, announcements, postcards
- ✅ All Gelato product dimensions
- ✅ Proper unfolded layout for printing

**No Plugin Changes Needed**: This is all Next.js/design editor functionality.

**Next Steps**:
1. Implement multi-surface canvas system
2. Add Skeleton Key toolbar
3. Add product type/size selection
4. Update export functions
5. Test with Gelato API

