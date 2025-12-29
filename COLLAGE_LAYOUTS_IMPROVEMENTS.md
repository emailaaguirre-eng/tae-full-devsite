# Collage Layouts Improvements

## Current Collage Layouts Analysis

### Existing Layouts:
1. **Single** - 1 image (full)
2. **2 Horizontal** - 2 images side by side
3. **2 Vertical** - 2 images stacked
4. **3 Left Focus** - 1 large left, 2 small right
5. **4 Grid** - 2x2 grid
6. **6 Grid** - 3x2 grid
7. **9 Grid** - 3x3 grid

### Assessment:
✅ **Good basics** but missing modern popular layouts
❌ **Missing**: Instagram-style, magazine-style, asymmetric layouts
❌ **Not optimized** for different product aspect ratios

---

## Modern Collage Layouts to Add

### Popular Modern Layouts:

1. **Instagram Style (1+2)**
   - 1 large image (top) + 2 small images (bottom)
   - Very popular on social media

2. **Instagram Style (2+1)**
   - 2 small images (top) + 1 large image (bottom)

3. **Magazine Style (Asymmetric)**
   - 1 large image + 1 medium + 1 small
   - Creates visual hierarchy

4. **Story Layout (Vertical)**
   - 3-4 images stacked vertically
   - Perfect for Instagram stories, cards

5. **Polaroid Style**
   - Overlapping images with white borders
   - Nostalgic, trendy

6. **Masonry Layout**
   - Irregular grid with varying sizes
   - Modern, Pinterest-style

7. **Center Focus**
   - 1 large center image + smaller images around
   - Great for hero images

8. **Split Diagonal**
   - Diagonal split with images
   - Dynamic, modern

9. **Bento Box Style**
   - Multiple small images in organized grid
   - Very trendy (2024)

10. **Photo Strip**
    - Horizontal strip of 3-4 images
    - Classic, clean

---

## Product-Specific Layout Adaptations

### The Problem:
Current layouts use **percentage-based slots** (0-100%), which works for square/standard ratios but:
- ❌ Doesn't account for different product aspect ratios
- ❌ Cards (5x7) have different ratio than prints (8x10)
- ❌ Layouts may look distorted on different products

### The Solution:
**Adaptive Layouts** that adjust based on product dimensions

---

## Implementation: Product-Aware Collage Layouts

### 1. Calculate Product Aspect Ratio

```typescript
interface ProductDimensions {
  width: number;  // In inches
  height: number; // In inches
  aspectRatio: number; // width / height
}

const getProductAspectRatio = (productSize: { width: number; height: number }): number => {
  return productSize.width / productSize.height;
};

// Examples:
// 5x7 card: 5/7 = 0.714 (portrait)
// 8x10 print: 8/10 = 0.8 (portrait)
// 11x14 print: 11/14 = 0.786 (portrait)
// 16x20 print: 16/20 = 0.8 (portrait)
// Square: 1.0
```

### 2. Adaptive Collage Templates

```typescript
interface AdaptiveCollageTemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
  // Base layout (for square/standard ratio)
  baseSlots: Array<{ x: number; y: number; width: number; height: number }>;
  // Adapt function that adjusts slots based on aspect ratio
  adapt: (aspectRatio: number, productWidth: number, productHeight: number) => 
    Array<{ x: number; y: number; width: number; height: number }>;
}

// Example: Instagram Style (1+2) - adapts to product ratio
const instagramStyle1Plus2: AdaptiveCollageTemplate = {
  id: 'instagram-1+2',
  name: 'Instagram Style',
  icon: <LayoutGrid className="w-4 h-4" />,
  baseSlots: [
    { x: 0, y: 0, width: 100, height: 60 },      // Large top
    { x: 0, y: 60, width: 50, height: 40 },     // Small bottom left
    { x: 50, y: 60, width: 50, height: 40 }     // Small bottom right
  ],
  adapt: (aspectRatio, width, height) => {
    // For portrait products (cards, most prints)
    if (aspectRatio < 1) {
      return [
        { x: 0, y: 0, width: 100, height: 60 },
        { x: 0, y: 60, width: 50, height: 40 },
        { x: 50, y: 60, width: 50, height: 40 }
      ];
    }
    // For landscape products
    else if (aspectRatio > 1) {
      return [
        { x: 0, y: 0, width: 60, height: 100 },
        { x: 60, y: 0, width: 40, height: 50 },
        { x: 60, y: 50, width: 40, height: 50 }
      ];
    }
    // For square products
    return baseSlots;
  }
};
```

### 3. Enhanced Collage Templates

```typescript
const modernCollageTemplates: AdaptiveCollageTemplate[] = [
  // Existing (updated to be adaptive)
  {
    id: 'single',
    name: 'Single',
    icon: <Square className="w-4 h-4" />,
    baseSlots: [{ x: 0, y: 0, width: 100, height: 100 }],
    adapt: (aspectRatio) => [{ x: 0, y: 0, width: 100, height: 100 }]
  },
  
  // NEW: Instagram Style (1+2)
  {
    id: 'instagram-1+2',
    name: 'Instagram Style',
    icon: <LayoutGrid className="w-4 h-4" />,
    baseSlots: [
      { x: 0, y: 0, width: 100, height: 60 },
      { x: 0, y: 60, width: 50, height: 40 },
      { x: 50, y: 60, width: 50, height: 40 }
    ],
    adapt: (aspectRatio) => {
      if (aspectRatio < 1) {
        // Portrait: large top, 2 small bottom
        return [
          { x: 0, y: 0, width: 100, height: 60 },
          { x: 0, y: 60, width: 50, height: 40 },
          { x: 50, y: 60, width: 50, height: 40 }
        ];
      } else {
        // Landscape: large left, 2 small right
        return [
          { x: 0, y: 0, width: 60, height: 100 },
          { x: 60, y: 0, width: 40, height: 50 },
          { x: 60, y: 50, width: 40, height: 50 }
        ];
      }
    }
  },
  
  // NEW: Instagram Style (2+1)
  {
    id: 'instagram-2+1',
    name: 'Instagram 2+1',
    icon: <LayoutGrid className="w-4 h-4" />,
    baseSlots: [
      { x: 0, y: 0, width: 50, height: 40 },
      { x: 50, y: 0, width: 50, height: 40 },
      { x: 0, y: 40, width: 100, height: 60 }
    ],
    adapt: (aspectRatio) => {
      if (aspectRatio < 1) {
        return [
          { x: 0, y: 0, width: 50, height: 40 },
          { x: 50, y: 0, width: 50, height: 40 },
          { x: 0, y: 40, width: 100, height: 60 }
        ];
      } else {
        return [
          { x: 0, y: 0, width: 40, height: 50 },
          { x: 0, y: 50, width: 40, height: 50 },
          { x: 40, y: 0, width: 60, height: 100 }
        ];
      }
    }
  },
  
  // NEW: Magazine Style (Asymmetric)
  {
    id: 'magazine-asymmetric',
    name: 'Magazine Style',
    icon: <LayoutTemplate className="w-4 h-4" />,
    baseSlots: [
      { x: 0, y: 0, width: 65, height: 70 },      // Large
      { x: 65, y: 0, width: 35, height: 35 },   // Medium
      { x: 65, y: 35, width: 35, height: 35 }   // Small
    ],
    adapt: (aspectRatio) => {
      // Adjusts based on product ratio
      if (aspectRatio < 0.8) {
        // Very portrait (like cards)
        return [
          { x: 0, y: 0, width: 100, height: 50 },
          { x: 0, y: 50, width: 50, height: 25 },
          { x: 50, y: 50, width: 50, height: 25 }
        ];
      }
      return baseSlots;
    }
  },
  
  // NEW: Story Layout (Vertical)
  {
    id: 'story-vertical',
    name: 'Story Layout',
    icon: <Rows3 className="w-4 h-4" />,
    baseSlots: [
      { x: 0, y: 0, width: 100, height: 25 },
      { x: 0, y: 25, width: 100, height: 25 },
      { x: 0, y: 50, width: 100, height: 25 },
      { x: 0, y: 75, width: 100, height: 25 }
    ],
    adapt: (aspectRatio) => baseSlots // Works well for portrait
  },
  
  // NEW: Polaroid Style
  {
    id: 'polaroid',
    name: 'Polaroid Style',
    icon: <Camera className="w-4 h-4" />,
    baseSlots: [
      { x: 10, y: 5, width: 35, height: 40 },    // Overlapping
      { x: 30, y: 20, width: 35, height: 40 },
      { x: 50, y: 35, width: 35, height: 40 }
    ],
    adapt: (aspectRatio) => {
      // Adjust overlap based on product size
      const overlap = aspectRatio < 1 ? 15 : 20;
      return [
        { x: 10, y: 5, width: 35, height: 40 },
        { x: 30, y: 20, width: 35, height: 40 },
        { x: 50, y: 35, width: 35, height: 40 }
      ];
    }
  },
  
  // NEW: Bento Box (Modern Grid)
  {
    id: 'bento-box',
    name: 'Bento Box',
    icon: <LayoutGrid className="w-4 h-4" />,
    baseSlots: [
      { x: 0, y: 0, width: 50, height: 50 },     // Top left
      { x: 50, y: 0, width: 25, height: 25 },   // Top right small
      { x: 75, y: 0, width: 25, height: 25 },   // Top right small
      { x: 50, y: 25, width: 50, height: 25 },  // Middle right
      { x: 0, y: 50, width: 33, height: 50 },   // Bottom left
      { x: 33, y: 50, width: 33, height: 50 },  // Bottom middle
      { x: 66, y: 50, width: 34, height: 50 }  // Bottom right
    ],
    adapt: (aspectRatio) => baseSlots
  },
  
  // Updated existing layouts to be adaptive
  {
    id: '2-horizontal',
    name: '2 Horizontal',
    icon: <Columns3 className="w-4 h-4" />,
    baseSlots: [
      { x: 0, y: 0, width: 50, height: 100 },
      { x: 50, y: 0, width: 50, height: 100 }
    ],
    adapt: (aspectRatio) => {
      if (aspectRatio < 1) {
        // Portrait: side by side works
        return baseSlots;
      } else {
        // Landscape: might want to stack instead
        return [
          { x: 0, y: 0, width: 100, height: 50 },
          { x: 0, y: 50, width: 100, height: 50 }
        ];
      }
    }
  },
  
  // ... more layouts
];
```

### 4. Apply Layout to Canvas

```typescript
// In PersonalizationStudio
const applyCollageTemplate = (template: AdaptiveCollageTemplate) => {
  if (!fabricRef.current) return;
  
  const canvas = fabricRef.current;
  const aspectRatio = productSize.width / productSize.height;
  
  // Get adapted slots for this product
  const slots = template.adapt(
    aspectRatio,
    productSize.width,
    productSize.height
  );
  
  // Clear canvas
  canvas.clear();
  canvas.backgroundColor = backgroundColor;
  
  // Add slots as guides (optional - can be hidden)
  slots.forEach((slot, index) => {
    const slotRect = new fabric.Rect({
      left: (slot.x / 100) * canvas.width!,
      top: (slot.y / 100) * canvas.height!,
      width: (slot.width / 100) * canvas.width!,
      height: (slot.height / 100) * canvas.height!,
      fill: 'transparent',
      stroke: '#ccc',
      strokeWidth: 1,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
      name: `slot-${index}`
    });
    
    canvas.add(slotRect);
    canvas.sendToBack(slotRect);
  });
  
  canvas.renderAll();
};
```

---

## Canvas Dimension Accuracy

### Current Implementation:
```typescript
const DPI = 300;
const canvasWidth = productSize.width * DPI;
const canvasHeight = productSize.height * DPI;
```

✅ **This is correct!** The canvas is sized to match the product dimensions at 300 DPI.

### Ensuring Accuracy:

1. **Maintain Aspect Ratio**
   - Canvas aspect ratio = Product aspect ratio
   - ✅ Already implemented

2. **Export at Full Resolution**
   - Export at 300 DPI (not display scale)
   - ✅ Need to verify export function

3. **Account for Bleed (if needed)**
   - Some products need bleed area
   - May need to add bleed to canvas

### Export Function Check:

```typescript
const exportDesign = async (): Promise<DesignOutput> => {
  if (!fabricRef.current) throw new Error('No canvas');
  
  const canvas = fabricRef.current;
  
  // Export at FULL resolution (300 DPI), not display scale
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = productSize.width * 300;  // Full DPI
  exportCanvas.height = productSize.height * 300;
  
  const exportCtx = exportCanvas.getContext('2d');
  if (!exportCtx) throw new Error('No context');
  
  // Scale up from display canvas to export canvas
  const scaleX = exportCanvas.width / canvas.width!;
  const scaleY = exportCanvas.height / canvas.height!;
  
  // Draw all objects at full resolution
  canvas.getObjects().forEach(obj => {
    // Export each object at full resolution
    // ... export logic
  });
  
  // Convert to blob
  return new Promise((resolve) => {
    exportCanvas.toBlob((blob) => {
      resolve({
        imageDataUrl: exportCanvas.toDataURL('image/png'),
        imageBlob: blob!,
        dimensions: { width: productSize.width, height: productSize.height },
        dpi: 300,
        productType: productType,
        productSize: productSize.name
      });
    }, 'image/png', 1.0);
  });
};
```

---

## Recommended Layouts by Product Type

### Cards (Portrait, 5x7, 4x6, 6x9):
- ✅ Story Layout (vertical)
- ✅ Instagram Style (1+2)
- ✅ 2 Vertical
- ✅ Polaroid Style
- ✅ Single

### Prints (Portrait, 8x10, 11x14):
- ✅ All layouts work
- ✅ Magazine Style (great for larger prints)
- ✅ Bento Box
- ✅ 4 Grid, 6 Grid, 9 Grid

### Square Products:
- ✅ 4 Grid
- ✅ 9 Grid
- ✅ Instagram Style
- ✅ Bento Box

### Landscape Products:
- ✅ 2 Horizontal
- ✅ Instagram Style (adapted)
- ✅ Photo Strip

---

## Implementation Checklist

- [ ] Add modern collage layouts (Instagram, Magazine, Story, Polaroid, Bento Box)
- [ ] Make layouts adaptive to product aspect ratio
- [ ] Update canvas initialization to match product dimensions exactly
- [ ] Verify export function exports at full 300 DPI
- [ ] Test layouts on different product sizes
- [ ] Add visual guides for collage slots (optional)
- [ ] Ensure aspect ratio is maintained in all layouts

---

## Summary

**Current Layouts**: Basic but functional
**Missing**: Modern popular layouts (Instagram-style, magazine, etc.)
**Issue**: Layouts don't adapt to different product aspect ratios
**Solution**: 
1. Add modern layouts
2. Make layouts adaptive to product dimensions
3. Ensure canvas matches product size exactly
4. Verify export maintains correct dimensions

The canvas is already sized correctly (300 DPI × product dimensions), but layouts should adapt to different aspect ratios for better results.

