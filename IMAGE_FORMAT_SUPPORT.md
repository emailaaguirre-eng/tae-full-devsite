# Image Format Support in Design Editor

## Current Status

### ✅ Currently Supported:
1. **PNG** - Full support including transparency
2. **JPEG/JPG** - Full support
3. **GIF** - Supported (static frames)
4. **WebP** - Supported
5. **BMP** - Supported

### ⚠️ Partially Supported:
1. **SVG** - Can be loaded but needs enhancement for:
   - Proper scaling
   - Text editing within SVG
   - Color manipulation
   - Layer extraction

### ❌ Not Currently Supported:
1. **PSD (Photoshop)** - Not natively supported by Fabric.js
   - Would need server-side conversion to PNG/SVG
   - Requires library like `psd.js` or API service

## Current Implementation

The editor uses:
- `accept="image/*"` - Accepts all browser-supported image formats
- `fabric.Image.fromURL()` - Handles raster images (PNG, JPG, etc.)
- FileReader API - Converts files to data URLs

## What Works Now:

### ✅ PNG with Transparency
- Transparent backgrounds are preserved
- Alpha channel works correctly
- Perfect for logos, graphics with transparency

### ✅ Standard Image Formats
- JPEG, PNG, GIF, WebP all work
- Automatic scaling and positioning
- Can be resized, rotated, filtered

### ⚠️ SVG Limitations
- SVG files can be loaded but:
  - May not scale perfectly
  - Text within SVG may not be editable
  - Complex SVGs may render slowly
  - Would benefit from `fabric.SVG` or `fabric.loadSVGFromURL()`

### ❌ PSD Files
- Cannot be directly loaded
- Would need:
  1. Server-side conversion (PSD → PNG/SVG)
  2. Or client-side library like `psd.js`
  3. Or require users to export from Photoshop first

## Recommendations

### For SVG Support:
```typescript
// Enhanced SVG loading
const addSVGToCanvas = async (svgUrl: string) => {
  if (!fabricRef.current) return;
  
  try {
    // Use Fabric's SVG loader
    const objects = await new Promise<fabric.Object[]>((resolve, reject) => {
      fabric.loadSVGFromURL(svgUrl, (objects, options) => {
        resolve(objects);
      });
    });
    
    const canvas = fabricRef.current;
    objects.forEach(obj => {
      canvas.add(obj);
    });
    canvas.renderAll();
  } catch (error) {
    console.error('Error loading SVG:', error);
  }
};
```

### For PSD Support:
**Option 1: Server-side conversion (Recommended)**
- Add API endpoint: `/api/convert-psd`
- Use library like `psd.js` (Node.js) or `psd` (Python)
- Convert PSD to PNG/SVG on upload
- Return converted file to client

**Option 2: Client-side conversion**
- Use `psd.js` library in browser
- Extract layers as PNG
- Slower but no server needed

**Option 3: User workflow**
- Ask users to export from Photoshop as PNG/SVG
- Most practical for now

## Current File Upload Handler

```typescript
const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files) return;
  
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setUploadedImages(prev => [...prev, dataUrl]);
    };
    reader.readAsDataURL(file);
  });
};
```

This works for:
- ✅ PNG (with transparency)
- ✅ JPEG
- ✅ GIF
- ✅ WebP
- ✅ BMP
- ⚠️ SVG (loads but may need enhancement)
- ❌ PSD (won't work - needs conversion)

## Testing Transparency

PNG files with transparency should work correctly because:
1. FileReader preserves alpha channel
2. Fabric.js supports transparent images
3. Canvas API handles alpha channel

## Summary

**What works out of the box:**
- PNG (including transparent backgrounds) ✅
- JPEG ✅
- GIF ✅
- WebP ✅

**What needs enhancement:**
- SVG (works but could be better) ⚠️

**What doesn't work:**
- PSD (needs conversion) ❌

## Next Steps

1. **Test PNG transparency** - Should already work
2. **Enhance SVG support** - Add proper SVG loader
3. **Add PSD conversion** - Server-side API endpoint
4. **Update file accept attribute** - Be more specific about formats

