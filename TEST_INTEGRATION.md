# Test Integration - Quick Verification Guide

## 🧪 5-Minute Test Ritual

Follow these steps to verify the integration works correctly.

---

## Step 1: Start Dev Server

```bash
cd C:\Users\email\tae-full-devsite
npm run dev
```

Expected output:
```
✓ Ready in 2.5s
○ Local: http://localhost:3000
```

---

## Step 2: Open Project Editor

Navigate to: **http://localhost:3000/project-editor-demo**

### ✅ Check Console (should see):
```
[ProjectEditor] Generating PrintSpec for selection: {productType: "greeting-card", orientation: "portrait", size: "5x7", ...}
[ProjectEditor] PrintSpec generated: mock-greeting-card-5x7-portrait-flat
[ProjectEditor] PrintSpec changed, initializing sides
```

### ❌ Should NOT see:
- Continuous "Generating PrintSpec" messages (infinite loop)
- Any errors about missing provider or undefined variables

---

## Step 3: Test Options Panel

### A. Product Type
- Should see "Product Type" section with buttons
- Click "Postcard" → canvas should regenerate
- Console should show new PrintSpec ID

### B. Orientation  
- Select "Landscape"
- Canvas should flip orientation
- Console: "Generating PrintSpec... PrintSpec generated: mock-..."

### C. Size
- Try different sizes (5x7, A5, 4x6)
- Each change should regenerate canvas
- Console should show PrintSpec ID changing

### D. Paper Type
- Select "Premium Matte"
- Price should update (+$1.00)

### E. Fold Format
- Select "Bifold"
- Canvas should show 4 sides (Front, Back, Inside Left, Inside Right)
- Fold lines should appear (red dashed lines)
- Price should update (+$0.50)

### F. Foil & Envelope
- Select "Gold Foil" → price +$2.00
- Select "Kraft Envelope" → price +$0.25

---

## Step 4: Test Image Upload

### A. Upload Image
1. Click "Upload Images" button
2. Select a test image (2-5MB JPEG/PNG)

### ✅ Expected console output:
```
[ProjectEditor] Uploading 1 files...
[ProjectEditor] Uploading: test.jpg (2.45MB)
[ProjectEditor] Asset uploaded: asset_1234567890_abcdef /uploads/asset_1234567890_abcdef.jpg
[ProjectEditor] Asset added to store.
```

### B. Verify Upload
```bash
# Check uploads directory
ls public/uploads/
# Should see: asset_1234567890_abcdef.jpg
```

### C. Add to Canvas
- Click the uploaded image thumbnail in sidebar
- Image should appear on canvas
- You should be able to drag/resize/rotate it

---

## Step 5: Test Save Draft (CRITICAL TEST!)

### A. Create Design
1. Upload 2-3 images
2. Add them to canvas
3. Add some text ("Add Text" button)
4. Position elements

### B. Save Draft
1. Click "Save Draft" button
2. Should see "Saving..." state
3. Console should show:
```
[ProjectEditor] Starting draft save...
[ProjectEditor] Draft payload size: 12.4 KB
[ProjectEditor] Saving draft via POST /api/drafts
[ProjectEditor] Draft saved successfully: draft_1234567890_xyz
```
4. Alert: "Draft saved successfully!"

### C. Verify Draft File
```bash
# Check drafts directory
ls data/drafts/
# Should see: draft_1234567890_xyz.json

# Open and inspect draft
cat data/drafts/draft_1234567890_xyz.json
```

### ✅ Draft JSON should contain:
```json
{
  "id": "draft_1234567890_xyz",
  "productType": "greeting-card",
  "selection": {
    "productType": "greeting-card",
    "orientation": "portrait",
    "size": "5x7",
    "foldFormat": "bifold",
    "paperType": "premium",
    ...
  },
  "design": {
    "sides": {
      "front": {
        "objects": [
          {
            "id": "img-...",
            "type": "image",
            "assetId": "asset_...",
            "assetUrl": "/uploads/asset_....jpg",  ✅ NOT base64!
            "x": 100,
            "y": 150,
            ...
          }
        ]
      }
    }
  },
  "providerType": "mock",
  ...
}
```

### ❌ Draft JSON should NOT contain:
- ❌ `"data:image/png;base64,iVBORw0KGgoAAAANS..."`
- ❌ `"blob:http://localhost:3000/..."`
- ❌ Any base64 encoded strings

### D. Search for Base64
```bash
# This should return NOTHING:
cat data/drafts/draft_*.json | grep -i "data:image"
cat data/drafts/draft_*.json | grep -i "base64"
cat data/drafts/draft_*.json | grep -i "blob:"

# If you find any matches: INTEGRATION FAILED!
```

---

## Step 6: Test Save & Continue

1. Click "Save & Continue" button
2. Should save draft (same as above)
3. Should navigate to: `/artkey/edit/[draftId]`
4. You'll get a 404 (that route doesn't exist yet - this is OK!)
5. Check URL bar - should show the draft ID

---

## Step 7: Test Draft Update

1. Navigate back to `/project-editor-demo`
2. Make changes (add more images, change text)
3. Click "Save Draft" again
4. Button should say "Update Draft" (not "Save Draft")
5. Should update existing draft (not create new one)

---

## Step 8: Verify No Infinite Loops

### Check console:
- ✅ Should see "Generating PrintSpec" ONLY when you change options
- ❌ Should NOT see continuous messages without interaction

### If you see infinite loop:
- Provider is being recreated on each render
- Fix: Check page.tsx has `useMemo(() => new MockProvider(), [])`

---

## 🎯 Success Checklist

After running all tests above:

- [ ] Options panel loads with greeting card options
- [ ] Changing size regenerates canvas (check console logs)
- [ ] Image upload saves to `public/uploads/`
- [ ] Uploaded assets have `assetUrl` (not base64)
- [ ] Save Draft creates file in `data/drafts/`
- [ ] Draft JSON contains **NO** base64 data
- [ ] Draft JSON contains **NO** blob: URLs
- [ ] Draft payload is < 100KB (even with 5 images)
- [ ] Save & Continue navigates to draft URL
- [ ] No infinite re-render loops
- [ ] No 413 errors on save
- [ ] Console shows clear debug messages
- [ ] No critical TypeScript errors

---

## 🐛 Common Issues & Fixes

### Issue: "Cannot find name 'provider'"
**Fix**: Ensure page.tsx passes provider prop

### Issue: Infinite "Generating PrintSpec" loop
**Fix**: Provider must be memoized in parent:
```typescript
const provider = useMemo(() => new MockProvider(), []);
```

### Issue: Options panel is empty
**Fix**: Check console for errors loading options

### Issue: 413 Payload Too Large on save
**Fix**: Draft still contains base64. Check:
1. Upload function uses `/api/assets`
2. Objects use `assetUrl` not `src`
3. Sanitize function is working

### Issue: Images don't appear on canvas
**Fix**: Check ImageObject uses `assetUrl || src`

### Issue: TypeScript errors about missing types
**Fix**: Add missing types to `components/ProjectEditor/types.ts`:
```typescript
type: 'image' | 'text' | 'skeletonKey' | 'qr' | 'border' | 'label-shape';
labelShapeType?: string;
cornerRadius?: number;
```

---

## 📊 Performance Check

### Draft Size Check:
```bash
# Check draft file size
ls -lh data/drafts/*.json

# Should be < 50KB even with 5-10 images
# If > 500KB: base64 leaked in somehow
```

### Upload Performance:
- Upload a 5MB image
- Should complete in 2-5 seconds
- Should optimize to ~300KB JPEG
- Console should show upload progress

---

## 🎉 If All Tests Pass

**CONGRATULATIONS!** 🎊

You've successfully integrated the provider-based architecture:
- ✅ Provider-driven options (Mock → ready for Gelato)
- ✅ Asset-ref-only storage (fixes 413 forever)
- ✅ Draft persistence (Save Draft works)
- ✅ Clean architecture (testable, maintainable)

### Next Phase:
- Implement GelatoProvider
- Create draft loading route
- Deploy to production

---

## 🆘 If Tests Fail

1. Check browser console for errors
2. Check terminal for API errors
3. Verify all 12 sections were applied
4. Check PRE-CHECK #2 (draft routes are correct)
5. Restart dev server: `Ctrl+C` then `npm run dev`

---

**Ready to test!** Run through the checklist above. 🚀

