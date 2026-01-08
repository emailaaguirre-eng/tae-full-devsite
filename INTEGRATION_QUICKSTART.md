# Physical Designer Integration - Quick Start Guide

## 🎯 Status: Foundation Complete, Ready for Integration

All foundation code is built. This guide shows you **exactly what to do** to integrate it.

---

## 📁 What's Already Built

### ✅ Foundation Files Created:
- `lib/designer/types.ts` - Internal types (SelectionState, PrintSpec, etc.)
- `lib/designer/providers/ProductProvider.ts` - Provider interface
- `lib/designer/providers/MockProvider.ts` - Mock implementation  
- `components/Designer/OptionsPanel.tsx` - Provider-driven UI
- `app/api/assets/route.ts` - Asset upload endpoint
- `app/api/drafts/route.ts` - Draft persistence
- `app/api/drafts/[id]/route.ts` - Draft get/delete

### ✅ Page Updated:
- `app/project-editor-demo/page.tsx` - Now uses MockProvider

### 📋 Integration Diff Created:
- `docs/PROJECTEDITOR_INTEGRATION_DIFF.md` - **Complete integration guide with all code changes**

---

## 🚀 How to Integrate (Two Options)

### Option 1: Manual Integration (Recommended for Learning)

Follow the **step-by-step diff** in `docs/PROJECTEDITOR_INTEGRATION_DIFF.md`.

Each section has:
- ❌ Code to REMOVE
- ✅ Code to ADD
- Clear line numbers and context

Estimated time: 30-45 minutes

### Option 2: Let Cursor Do It (Faster)

Copy this prompt and send to Cursor:

```
Integrate the provider-based architecture into components/ProjectEditor/ProjectEditor.tsx following the complete diff in docs/PROJECTEDITOR_INTEGRATION_DIFF.md.

Requirements:
1. Add provider prop and SelectionState management
2. Remove all hardcoded Gelato API calls
3. Use provider to generate PrintSpec
4. Update image upload to use /api/assets (asset refs only, no base64)
5. Add Save Draft and Save & Continue buttons
6. Replace sidebar controls with OptionsPanel component
7. Update ImageObject to use assetUrl instead of src
8. Memoize provider in parent to avoid re-renders

Critical rules:
- Do NOT recreate provider on each render (causes infinite loops)
- Only depend on 'selection' in PrintSpec effect, NOT printSpec itself
- Ensure all image objects use assetId + assetUrl, never base64
- Validate drafts reject base64 data

Output the modified ProjectEditor.tsx file.
```

---

## 🧪 Testing After Integration

### 1. Start the Dev Server
```bash
cd C:\Users\email\tae-full-devsite
npm run dev
```

### 2. Navigate to `/project-editor-demo`

### 3. Test Flow:

#### A. Test Options Panel (Provider-Driven)
1. Should see "Product Type", "Orientation", "Size", etc. sections
2. Select different options
3. Price should update dynamically
4. Canvas should regenerate when size/orientation changes

#### B. Test Image Upload (Asset Refs)
1. Click "Upload Images"
2. Select an image
3. Check console - should see `[ProjectEditor] Asset uploaded: asset_xxx`
4. Image should appear in sidebar
5. Click image thumbnail - should add to canvas
6. Check `public/uploads/` - should contain `asset_xxx.jpg`

#### C. Test Save Draft (No Base64)
1. Add images and text to canvas
2. Click "Save Draft"
3. Should save successfully
4. Check `data/drafts/` - should contain `draft_xxx.json`
5. Open draft file - should **NOT** contain `"data:image"` anywhere
6. Should only see `"assetUrl": "/uploads/asset_xxx.jpg"`

#### D. Test Save & Continue
1. Click "Save & Continue"
2. Should navigate to `/artkey/edit/[draftId]`
3. (That route doesn't exist yet, so you'll get 404 - that's OK)

### 4. Check for Common Issues:

#### Issue: Infinite Re-render Loop
**Symptom**: Console floods with "PrintSpec generated" messages  
**Cause**: Provider recreated on each render or PrintSpec in dependency array  
**Fix**: 
```typescript
// In page.tsx:
const provider = useMemo(() => new MockProvider(), []); // ✅ Memoized

// In ProjectEditor.tsx:
useEffect(() => {
  provider.generatePrintSpec(selection).then(setPrintSpec);
}, [provider, selection]); // ✅ Only selection, not printSpec
```

#### Issue: 413 Payload Too Large
**Symptom**: Save Draft fails with "413 Request Entity Too Large"  
**Cause**: Base64 still in draft  
**Fix**: Ensure `handleFileUpload` uses `/api/assets` and objects use `assetUrl`

#### Issue: Images Not Showing
**Symptom**: Images don't appear on canvas after upload  
**Cause**: Using `object.src` instead of `object.assetUrl`  
**Fix**: Update ImageObject component to use `assetUrl`

#### Issue: Options Not Loading
**Symptom**: Sidebar is empty or shows "Loading..."  
**Cause**: Provider not passed to component  
**Fix**: Ensure `provider={provider}` prop is passed

---

## 📊 Expected Results

### Before Integration:
```typescript
// ProjectEditor.tsx (current):
- Hardcoded Gelato API calls
- Base64 image storage
- No draft persistence
- Tightly coupled to Gelato
```

### After Integration:
```typescript
// ProjectEditor.tsx (integrated):
✅ Provider-driven options (MockProvider by default)
✅ Asset-ref-only storage (/uploads/asset_xxx.jpg)
✅ Draft persistence with validation
✅ Decoupled from Gelato
✅ Save Draft + Save & Continue buttons
```

---

## 🎯 Next Steps After Integration Works

### Phase 3: Implement GelatoProvider
1. Create `lib/designer/providers/GelatoProvider.ts`
2. Map Gelato API responses to internal types
3. Add caching layer
4. Test with real Gelato products

### Phase 4: Draft Loading Route
1. Create `app/designer/draft/[id]/page.tsx`
2. Load draft from `/api/drafts/[id]`
3. Initialize ProjectEditor with loaded state

### Phase 5: Production Enhancements
1. Move uploads to S3/CDN
2. Add image editing (crop, rotate, filters)
3. Add templates/layouts
4. Add collaboration features

---

## 📚 Documentation Reference

- **Architecture**: `docs/PHYSICAL_DESIGNER_REFACTOR_PLAN.md`
- **What's Built**: `docs/DESIGNER_IMPLEMENTATION_SUMMARY.md`
- **Integration Steps**: `docs/REFACTOR_FIRST_CODE_CHANGES.md`
- **Complete Diff**: `docs/PROJECTEDITOR_INTEGRATION_DIFF.md` ⭐ **USE THIS**
- **Summary**: `DESIGNER_REFACTOR_COMPLETE.md`

---

## 🆘 If You Get Stuck

### Common Fixes:

1. **Provider undefined**: Make sure page passes `provider={provider}` prop
2. **TypeScript errors**: Install types: `npm install --save-dev @types/node`
3. **Sharp errors**: Reinstall: `npm install sharp --force`
4. **404 on /api/assets**: Restart dev server
5. **Infinite loop**: Check provider is memoized and effect deps are correct

### Debug Checklist:

```bash
# 1. Check provider is passed
console.log('Provider:', provider.type); // Should log "mock"

# 2. Check selection state
console.log('Selection:', selection); // Should show productType, size, etc.

# 3. Check PrintSpec generated
console.log('PrintSpec:', printSpec?.id); // Should show "mock-greeting-card-..."

# 4. Check asset upload works
# Upload image, check:
ls public/uploads/ # Should show asset_xxx.jpg files

# 5. Check draft saved
# Save draft, check:
ls data/drafts/ # Should show draft_xxx.json files
cat data/drafts/draft_xxx.json # Should NOT contain "data:image"
```

---

## ✅ Success Criteria

You've successfully integrated when:

1. ✅ Options panel loads and shows greeting card options
2. ✅ Selecting different sizes regenerates the canvas
3. ✅ Image upload saves to `public/uploads/`
4. ✅ Canvas shows images with assetUrl references
5. ✅ Save Draft creates JSON file in `data/drafts/`
6. ✅ Draft file contains NO base64 data
7. ✅ Save & Continue navigates to draft URL
8. ✅ No infinite re-render loops
9. ✅ No 413 errors on save
10. ✅ Console shows no errors

---

## 🎉 You're Ready!

All the code is written. The diff is complete. The foundation is solid.

**Next action**: Open `docs/PROJECTEDITOR_INTEGRATION_DIFF.md` and start integrating! 🚀

Good luck! 🍀

