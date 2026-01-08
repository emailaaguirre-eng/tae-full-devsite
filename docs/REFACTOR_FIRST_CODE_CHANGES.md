# Physical Designer Refactor - First Code Changes

## 📋 Overview

This document provides the **first code changes** to integrate the new provider-based architecture into the existing `ProjectEditor` component.

## 🎯 Current State

**Physical Designer Location:**
- **Component**: `components/ProjectEditor/ProjectEditor.tsx` (1,550 lines)
- **Route**: `/project-editor-demo` → uses `ProjectEditorDemo.tsx` wrapper
- **Current Issues**:
  - ❌ Hardcoded Gelato API calls
  - ❌ Base64 image storage (causes 413 errors on save)
  - ❌ No draft persistence
  - ❌ Tightly coupled to Gelato structure

## ✅ What's Been Built

### 1. **Core Type System** (`lib/designer/types.ts`)
- `SelectionState` - Product options (type, size, paper, foil, envelope)
- `PrintSpec` - Print specifications (mm-based, bleed, safe zones)
- `DesignObject` - **Uses `assetId` + `assetUrl` instead of base64**
- `PhysicalDesignDraft` - Draft structure (validated to reject base64)

### 2. **Provider Interface** (`lib/designer/providers/ProductProvider.ts`)
- Abstract interface for product data sources
- Methods: `getSizes()`, `getPaperTypes()`, `getFoldFormats()`, `getFoilOptions()`, etc.
- Provider-agnostic design (swap Mock → Gelato → Custom)

### 3. **Mock Provider** (`lib/designer/providers/MockProvider.ts`)
- Concrete implementation with greeting card options
- Fully functional without external API
- Pricing, validation, print spec generation

### 4. **Asset Upload API** (`app/api/assets/route.ts`)
- **POST** - Upload images (Sharp optimization → `public/uploads/`)
- Returns `{ assetId, url, width, height }`
- **NO MORE BASE64 STORAGE!**

### 5. **Draft API** (`app/api/drafts/route.ts`)
- **POST** - Save draft (validates: no base64 allowed)
- **GET** - Load draft by ID
- **DELETE** - Delete draft
- Stores in `data/drafts/{id}.json`

### 6. **Options Panel Component** (`components/Designer/OptionsPanel.tsx`)
- Provider-driven UI (dynamically loads options)
- Cascading dependencies (product → orientation → sizes)
- Modern Tailwind design

## 🔧 Integration Steps

### Step 1: Update ProjectEditor Props

**File**: `components/ProjectEditor/ProjectEditor.tsx`

**Add provider prop:**

```typescript
import type { ProductProvider } from '@/lib/designer/providers/ProductProvider';
import type { SelectionState } from '@/lib/designer/types';

interface ProjectEditorRebuildProps {
  // NEW: Provider instance
  provider: ProductProvider;
  
  // NEW: Initial selection (optional)
  initialSelection?: Partial<SelectionState>;
  
  // Existing props...
  printSpecId?: string;
  productSlug?: string;
  onComplete?: (exportData: any) => void;
  onClose?: () => void;
}
```

### Step 2: Replace State with SelectionState

**Before:**
```typescript
const [editorOrientation, setEditorOrientation] = useState('portrait');
const [cardFormat, setCardFormat] = useState('flat');
const [gelatoVariantData, setGelatoVariantData] = useState(null);
```

**After:**
```typescript
const [selection, setSelection] = useState<SelectionState>({
  productType: initialSelection?.productType || 'greeting-card',
  orientation: initialSelection?.orientation || 'portrait',
  size: initialSelection?.size || '5x7',
  paperType: initialSelection?.paperType,
  foldFormat: initialSelection?.foldFormat || 'flat',
  foilOption: initialSelection?.foilOption,
  envelopeOption: initialSelection?.envelopeOption,
});
```

### Step 3: Generate PrintSpec from Provider

**Before:**
```typescript
const printSpec = useMemo(() => {
  if (gelatoVariantData) {
    return generatePrintSpecFromGelatoVariant(...);
  }
  return getSamplePostcardSpec();
}, [gelatoVariantData]);
```

**After:**
```typescript
const [printSpec, setPrintSpec] = useState<PrintSpec | null>(null);

useEffect(() => {
  const hasRequiredFields = 
    selection.productType && 
    selection.orientation && 
    selection.size;
  
  if (hasRequiredFields) {
    provider.generatePrintSpec(selection).then(setPrintSpec);
  }
}, [provider, selection]);
```

### Step 4: Replace Sidebar Options with OptionsPanel

**Find this section (around line 820-860):**
```typescript
{/* Design Controls: Orientation & Card Format */}
<div className="flex items-center gap-4">
  {/* Orientation Toggle */}
  <button onClick={() => setEditorOrientation('portrait')}>
    Portrait
  </button>
  <button onClick={() => setEditorOrientation('landscape')}>
    Landscape
  </button>
  
  {/* Card Format Toggle */}
  {isCardProduct && (
    <button onClick={() => setCardFormat('flat')}>Flat</button>
    <button onClick={() => setCardFormat('bifold')}>Bifold</button>
  )}
</div>
```

**Replace with:**
```typescript
import { OptionsPanel } from '@/components/Designer/OptionsPanel';

{/* Product Options */}
<div className="p-4 border-b border-gray-200">
  <OptionsPanel
    provider={provider}
    selection={selection}
    onSelectionChange={(updates) => {
      setSelection(prev => ({ ...prev, ...updates }));
    }}
  />
</div>
```

### Step 5: Update Image Upload to Use Asset API

**Find `handleFileUpload` function (around line 520-550):**

**Before:**
```typescript
const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files) return;
  
  Array.from(files).forEach((file) => {
    const objectUrl = URL.createObjectURL(file);
    // ... adds to assets with blob: URL
  });
};
```

**After:**
```typescript
const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files) return;
  
  for (const file of Array.from(files)) {
    // Upload to API
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error('Upload failed');
      }
      
      const asset = await res.json(); // UploadedAssetMetadata
      
      // Add to asset store with asset ID
      useAssetStore.getState().addAsset({
        id: asset.assetId,
        name: file.name,
        mimeType: asset.mimeType,
        width: asset.width,
        height: asset.height,
        src: asset.url, // /uploads/asset_xxx.jpg
        assetId: asset.assetId,
        assetUrl: asset.url,
        origin: 'uploaded',
      });
      
      // Auto-add to canvas
      handleAddImage({
        id: asset.assetId,
        src: asset.url,
        assetId: asset.assetId,
        assetUrl: asset.url,
        width: asset.width,
        height: asset.height,
      } as any);
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Failed to upload ${file.name}`);
    }
  }
  
  // Reset input
  if (fileInputRef.current) {
    fileInputRef.current.value = '';
  }
};
```

### Step 6: Update DesignObject to Use assetId/assetUrl

**Find `handleAddImage` function (around line 350-410):**

**Before:**
```typescript
const newObject: EditorObject = {
  id: `img-${Date.now()}`,
  type: 'image',
  src: asset.src, // ❌ May be blob: or data: URL
  x, y, width, height,
  // ...
};
```

**After:**
```typescript
import type { DesignObject } from '@/lib/designer/types';

const newObject: DesignObject = {
  id: `img-${Date.now()}`,
  type: 'image',
  assetId: asset.assetId,     // ✅ Reference to uploaded asset
  assetUrl: asset.assetUrl,   // ✅ /uploads/asset_xxx.jpg
  // NO src field!
  x, y, width, height, rotation: 0, scaleX: 1, scaleY: 1,
};
```

### Step 7: Add Save Draft Button

**Find header buttons (around line 800-820):**

**Add this function before the return statement:**
```typescript
const handleSaveDraft = async () => {
  // Check for unuploaded assets
  const hasUnuploadedAssets = Object.values(sideStates).some(side =>
    side.objects.some(obj => {
      const objAssetUrl = (obj as any).assetUrl || (obj as any).src;
      return objAssetUrl?.startsWith('blob:') || objAssetUrl?.startsWith('data:');
    })
  );
  
  if (hasUnuploadedAssets) {
    alert('Please wait for all images to finish uploading.');
    return;
  }
  
  if (!printSpec) {
    alert('Please select product options first.');
    return;
  }
  
  // Build draft
  const draft: PhysicalDesignDraft = {
    id: '', // Generated by API
    productType: selection.productType,
    selection,
    printSpecId: printSpec.id,
    design: {
      sides: sideStates as any, // Type conversion needed
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
    providerType: provider.type,
  };
  
  // Save via API
  try {
    const res = await fetch('/api/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    
    if (!res.ok) {
      const { error, details } = await res.json();
      throw new Error(`${error}\n${details?.join('\n') || ''}`);
    }
    
    const { draftId, url } = await res.json();
    
    // Navigate to draft URL
    window.location.href = url;
  } catch (error) {
    console.error('Save draft error:', error);
    alert(`Failed to save draft:\n${error instanceof Error ? error.message : error}`);
  }
};
```

**Add buttons in header:**
```typescript
<div className="flex items-center gap-2">
  <button
    onClick={handleSaveDraft}
    className="px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700"
  >
    Save Draft
  </button>
  <button
    onClick={async () => {
      // Save and navigate to checkout/next step
      await handleSaveDraft();
      // Add navigation logic here
    }}
    className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
  >
    Save & Continue
  </button>
  <button
    onClick={handleExport}
    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2"
  >
    <Download className="w-4 h-4" />
    Export
  </button>
  {onClose && (
    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
      <X className="w-5 h-5" />
    </button>
  )}
</div>
```

### Step 8: Update ImageObject Component

**Find `ImageObject` component (around line 1227-1317):**

**Before:**
```typescript
const [img] = useImage(object.src || '');
```

**After:**
```typescript
// Use assetUrl instead of src
const imageUrl = (object as any).assetUrl || (object as any).src;
const [img] = useImage(imageUrl || '');
```

### Step 9: Update Page to Pass Provider

**File**: `app/project-editor-demo/page.tsx`

**Before:**
```typescript
export default function ProjectEditorDemoPage() {
  return <ProjectEditorDemo />;
}
```

**After:**
```typescript
'use client';

import ProjectEditor from '@/components/ProjectEditor/ProjectEditor';
import { MockProvider } from '@/lib/designer/providers/MockProvider';

export default function ProjectEditorDemoPage() {
  const provider = new MockProvider();
  
  return (
    <ProjectEditor
      provider={provider}
      initialSelection={{
        productType: 'greeting-card',
        orientation: 'portrait',
        size: '5x7',
      }}
      onComplete={(exportData) => {
        console.log('Design complete:', exportData);
      }}
      onClose={() => {
        window.location.href = '/';
      }}
    />
  );
}
```

## 🧪 Testing the Changes

### 1. Test Asset Upload
1. Go to `/project-editor-demo`
2. Click "Upload Images"
3. Select an image
4. Check browser console - should show upload progress
5. Check `public/uploads/` - should contain `asset_xxx.jpg`
6. Image should appear in sidebar

### 2. Test Options Panel
1. Options panel should appear in left sidebar
2. Select different product types, orientations, sizes
3. Price should update dynamically
4. PrintSpec should regenerate (check console logs)

### 3. Test Save Draft
1. Add some images and text to canvas
2. Click "Save Draft"
3. Should navigate to `/designer/draft/{id}`
4. Check `data/drafts/` - should contain `{id}.json`
5. Verify no base64 in draft file

### 4. Test Draft Validation
1. Try saving with blob: URL (should fail with alert)
2. Wait for uploads to complete
3. Save should succeed

## 📁 Files Modified

- ✅ `components/ProjectEditor/ProjectEditor.tsx` - Main refactor
- ✅ `app/project-editor-demo/page.tsx` - Provider initialization

## 📁 Files Created

- ✅ `lib/designer/types.ts`
- ✅ `lib/designer/providers/ProductProvider.ts`
- ✅ `lib/designer/providers/MockProvider.ts`
- ✅ `components/Designer/OptionsPanel.tsx`
- ✅ `app/api/assets/route.ts`
- ✅ `app/api/drafts/route.ts`
- ✅ `app/api/drafts/[id]/route.ts`

## 🎯 Next Steps

After these changes are working:
1. **Test thoroughly** - Upload images, select options, save drafts
2. **Implement GelatoProvider** - Map Gelato API to internal types
3. **Add draft loading** - Create `/designer/draft/[id]` route
4. **Add caching** - Cache Gelato API responses
5. **Error handling** - Improve error messages and recovery

## ⚠️ Common Issues

### Issue: 413 Payload Too Large
**Cause**: Base64 still in draft  
**Fix**: Ensure all images use `/api/assets` upload

### Issue: Images not showing
**Cause**: Using `object.src` instead of `object.assetUrl`  
**Fix**: Update all image rendering to use `assetUrl`

### Issue: Options not loading
**Cause**: Provider not passed to component  
**Fix**: Ensure provider is initialized in page component

### Issue: Draft save fails validation
**Cause**: Base64 data in draft  
**Fix**: Check for `blob:` or `data:` URLs before saving

## 🚀 You're Ready!

All the foundational code is in place. Follow the integration steps above to wire the provider system into the existing ProjectEditor. This will fix the 413 error, enable dynamic product options, and allow draft persistence.

