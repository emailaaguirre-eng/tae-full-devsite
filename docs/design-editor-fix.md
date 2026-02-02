# Design Editor - "Add to Canvas" Fix

## Issue
The "Add to Canvas" button in the Design Editor was not working when clicking on uploaded images. Images would upload successfully but clicking them to add to the canvas would fail.

## Root Cause
The `addImageToCanvas` function was using `fabric.Image.fromURL()` with `crossOrigin: 'anonymous'` for all image URLs, including data URLs (which are created when users upload images via `FileReader.readAsDataURL()`). 

**Problem**: Data URLs don't work with `crossOrigin: 'anonymous'` in fabric.js, causing the image loading to fail silently or throw errors.

## Solution
Updated `addImageToCanvas` in `components/DesignEditor.tsx` to:

1. **Detect data URLs**: Check if the image URL starts with `data:`
2. **Handle data URLs separately**: 
   - Create an HTML `<img>` element
   - Load the data URL into it
   - Convert the loaded image element to a fabric.Image
   - No `crossOrigin` needed for data URLs
3. **Handle regular URLs**: Continue using `fabric.Image.fromURL()` with `crossOrigin: 'anonymous'` for external URLs

## Code Changes

**Before:**
```typescript
const img = await fabric.Image.fromURL(imageUrl, { crossOrigin: 'anonymous' });
```

**After:**
```typescript
const isDataUrl = imageUrl.startsWith('data:');

let img: fabric.Image;

if (isDataUrl) {
  // For data URLs, create image element first, then convert to fabric image
  const imgElement = document.createElement('img');
  
  await new Promise<void>((resolve, reject) => {
    imgElement.onload = () => resolve();
    imgElement.onerror = () => reject(new Error('Failed to load image'));
    imgElement.src = imageUrl;
  });
  
  img = new fabric.Image(imgElement);
} else {
  // For regular URLs, use fromURL with CORS
  img = await fabric.Image.fromURL(imageUrl, { 
    crossOrigin: 'anonymous' 
  });
}
```

## Testing Instructions

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to a product customization page** (e.g., `/customize?product_id=123`)

3. **Open the Design Editor:**
   - The Design Editor should open when you click "Customize" or "Design"

4. **Test Image Upload:**
   - Click on the "Images" tab in the sidebar
   - Click "Upload Images"
   - Select one or more image files (JPG, PNG, BMP)
   - Images should appear in the "Your Images" grid

5. **Test Add to Canvas:**
   - Click on any uploaded image
   - The image should:
     - ✅ Appear on the canvas
     - ✅ Be centered
     - ✅ Be scaled to fit 40% of canvas size
     - ✅ Be selectable (you can click and drag it)
     - ✅ Show selection handles when clicked

6. **Test Multiple Images:**
   - Upload multiple images
   - Click each one to add to canvas
   - All should appear and be independently movable/resizable

7. **Test Canvas Interactions:**
   - Click and drag images to reposition
   - Click on an image to select it (should show handles)
   - Use Delete button to remove selected image
   - Test Undo/Redo functionality

## Expected Behavior

✅ **Working:**
- Image uploads successfully
- Clicking image adds it to canvas
- Image appears centered and scaled appropriately
- Image is selectable and movable
- Multiple images can be added
- Undo/Redo works
- Delete works

❌ **If Still Not Working:**
- Check browser console for errors
- Verify fabric.js is loaded: `console.log(fabric)` should show the fabric object
- Check if images are actually uploading (check `uploadedImages` state)
- Verify canvas is initialized (check `fabricCanvasRef.current`)

## Debugging

If the issue persists:

1. **Open browser console** (F12)
2. **Check for errors** when clicking "Add to Canvas"
3. **Verify fabric.js import:**
   ```javascript
   // In browser console
   console.log(typeof fabric);
   console.log(fabric.Image);
   ```
4. **Check image URL format:**
   ```javascript
   // Should start with "data:image/..." for uploaded images
   console.log(imageUrl.substring(0, 20));
   ```
5. **Verify canvas exists:**
   ```javascript
   // In DesignEditor component, add console.log
   console.log('Canvas ref:', fabricCanvasRef.current);
   ```

## Related Files

- `components/DesignEditor.tsx` - Main editor component
- `components/ArtKeyEditor.tsx` - ArtKey editor (different from Design Editor)
- `package.json` - Dependencies (fabric v6.9.0)

## Notes

- The Design Editor is separate from the ArtKey Editor
- Design Editor is for creating physical product designs (cards, prints, etc.)
- ArtKey Editor is for creating digital ArtKey portals
- Both use different canvas systems (fabric.js vs. mobile preview)

