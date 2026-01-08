# Physical Designer Refactor - Implementation Summary

## ✅ Completed Phase 1: Foundation

### Created Files

#### 1. Core Type System
**File:** `lib/designer/types.ts`

Defines provider-agnostic internal types:
- ✅ `SelectionState` - Product selection (type, size, orientation, paper, foil, envelope)
- ✅ `PrintSpec` - Print specifications (mm-based dimensions, bleed, safe zones, sides)
- ✅ `PrintSide` - Individual print side with fold lines
- ✅ `DesignState` - Canvas design state (sides → objects)
- ✅ `DesignObject` - **NO BASE64!** Uses `assetId` + `assetUrl` references
- ✅ `PhysicalDesignDraft` - Draft persistence structure (validated to exclude base64)
- ✅ `ExportData` - Export structure for print production
- ✅ `UploadedAssetMetadata` - Asset upload response

#### 2. Provider Interface
**File:** `lib/designer/providers/ProductProvider.ts`

Defines abstract interface for product data sources:
- ✅ `ProductProvider` interface with methods:
  - `getProductTypes()` - List available product types
  - `getOrientations()` - Get orientations for product
  - `getSizes()` - Get sizes for product + orientation
  - `getPaperTypes()` - Get paper options
  - `getFoldFormats()` - Get fold options (flat, bifold)
  - `getFoilOptions()` - Get foil options
  - `getEnvelopeOptions()` - Get envelope options
  - `generatePrintSpec()` - Create PrintSpec from SelectionState
  - `getPrice()` - Calculate price for selection
  - `validateSelection()` - Validate selection is valid
- ✅ `ProductOption` - Standard option structure
- ✅ `ValidationResult` - Validation response structure

#### 3. Mock Provider Implementation
**File:** `lib/designer/providers/MockProvider.ts`

Concrete implementation with hardcoded greeting card data:
- ✅ **Product Types**: Greeting Card, Postcard, Print
- ✅ **Orientations**: Portrait, Landscape
- ✅ **Sizes**: 5x7, A5, 4x6 (with mm dimensions)
- ✅ **Papers**: Matte, Glossy (+$0.50), Premium (+$1.00)
- ✅ **Folds**: Flat, Bifold (+$0.50) - generates 4 sides for bifold
- ✅ **Foils**: None, Gold (+$2.00), Silver (+$2.00), Rose Gold (+$2.50)
- ✅ **Envelopes**: White, Kraft (+$0.25), Black (+$0.50)
- ✅ **Print Spec Generation**: 
  - Converts size selection to mm dimensions
  - Handles orientation (portrait/landscape)
  - Generates sides based on fold format
  - Calculates fold lines for bifold cards
  - Returns PrintSpec with bleed (3mm), safe (5mm), DPI (300)
- ✅ **Pricing**: Base + add-ons calculation

#### 4. Asset Upload API
**File:** `app/api/assets/route.ts`

Handles image uploads (replaces base64 storage):
- ✅ **POST**: Upload image file
  - Validates file type (image/*) and size (<10MB)
  - Optimizes with Sharp (resize to max 4000px, convert to JPEG 90% quality)
  - Saves to `public/uploads/` with unique ID
  - Returns `UploadedAssetMetadata` (assetId, url, width, height, size)
- ✅ **GET**: Retrieve asset metadata by ID
  - Checks if asset exists
  - Returns asset info

#### 5. Draft Persistence API
**Files:** 
- `app/api/drafts/route.ts`
- `app/api/drafts/[id]/route.ts`

Handles draft saving/loading with base64 validation:
- ✅ **POST /api/drafts**: Save draft
  - Validates draft structure
  - **CRITICAL**: Rejects drafts with base64 data URLs (returns 400 error)
  - Generates unique draft ID
  - Saves to `data/drafts/{id}.json`
  - Returns `{ draftId, url: "/designer/draft/{id}" }`
- ✅ **GET /api/drafts/[id]**: Load draft by ID
  - Reads draft from filesystem
  - Returns `PhysicalDesignDraft`
- ✅ **DELETE /api/drafts/[id]**: Delete draft

Validation ensures:
- No `assetUrl` starting with `data:`
- No legacy `src` fields with base64
- No background images with base64

#### 6. Options Panel Component
**File:** `components/Designer/OptionsPanel.tsx`

Provider-driven UI component:
- ✅ Dynamically loads options from `ProductProvider`
- ✅ Cascading dependencies (product → orientation → sizes/papers/etc.)
- ✅ Updates price when selection changes
- ✅ **OptionGroup** sub-component (label + required indicator)
- ✅ **OptionButton** sub-component (selected state + price display)
- ✅ Clean, modern UI with Tailwind CSS

---

## 📋 Next Steps: Wiring the Designer

### Phase 2: Update ProjectEditor to Use Providers

**File to Modify:** `components/ProjectEditor/ProjectEditor.tsx`

#### Changes Needed:

1. **Add Provider Props**
```typescript
interface ProjectEditorProps {
  provider: ProductProvider; // NEW: Provider instance
  initialSelection?: Partial<SelectionState>; // NEW: Initial selection
  onSave?: (draft: PhysicalDesignDraft) => void; // NEW: Save callback
  onCancel?: () => void;
}
```

2. **Replace Hardcoded State with SelectionState**
```typescript
// OLD: Individual useState for each option
const [editorOrientation, setEditorOrientation] = useState('portrait');
const [cardFormat, setCardFormat] = useState('flat');

// NEW: Unified selection state
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

3. **Generate PrintSpec from Provider**
```typescript
// OLD: Hardcoded spec generation
const printSpec = useMemo(() => {
  if (gelatoVariantData) {
    return generatePrintSpecFromGelatoVariant(...);
  }
  return getSamplePostcardSpec();
}, [gelatoVariantData]);

// NEW: Provider-based spec generation
const [printSpec, setPrintSpec] = useState<PrintSpec | null>(null);

useEffect(() => {
  if (selection.productType && selection.orientation && selection.size) {
    provider.generatePrintSpec(selection).then(setPrintSpec);
  }
}, [provider, selection]);
```

4. **Replace Sidebar with OptionsPanel**
```typescript
// In sidebar section:
<OptionsPanel
  provider={provider}
  selection={selection}
  onSelectionChange={(updates) => {
    setSelection(prev => ({ ...prev, ...updates }));
  }}
  disabled={!!lockedProductUid}
/>
```

5. **Update Image Upload to Use Asset API**
```typescript
// OLD: Store base64 in state
const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    const asset = { src: event.target.result as string }; // ❌ base64
    setUploadedAssets(prev => [...prev, asset]);
  };
  reader.readAsDataURL(file);
};

// NEW: Upload to /api/assets, store asset reference
const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files) return;
  
  for (const file of Array.from(files)) {
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch('/api/assets', {
      method: 'POST',
      body: formData,
    });
    
    if (res.ok) {
      const asset = await res.json(); // UploadedAssetMetadata
      useAssetStore.getState().addAsset({
        id: asset.assetId,
        name: file.name,
        mimeType: asset.mimeType,
        width: asset.width,
        height: asset.height,
        src: asset.url, // ✅ /uploads/asset_xxx.jpg
        assetId: asset.assetId,
        assetUrl: asset.url,
      });
    }
  }
};
```

6. **Update DesignObject to Use assetUrl**
```typescript
// When adding image to canvas:
const newObject: DesignObject = {
  id: `img-${Date.now()}`,
  type: 'image',
  assetId: asset.assetId,     // ✅ Reference to uploaded asset
  assetUrl: asset.url,         // ✅ /uploads/asset_xxx.jpg
  // NO src field with base64!
  x, y, width, height, rotation, scaleX, scaleY,
};
```

7. **Implement Save Draft Button**
```typescript
const handleSaveDraft = async () => {
  // Ensure all assets are uploaded (no blob: URLs)
  const hasUnuploadedAssets = Object.values(sideStates).some(side =>
    side.objects.some(obj => 
      obj.assetUrl?.startsWith('blob:') || obj.assetUrl?.startsWith('data:')
    )
  );
  
  if (hasUnuploadedAssets) {
    alert('Please wait for all images to finish uploading.');
    return;
  }
  
  // Build draft
  const draft: PhysicalDesignDraft = {
    id: draftId || '', // Generated by API if empty
    productType: selection.productType,
    selection,
    printSpecId: printSpec!.id,
    design: {
      sides: sideStates,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
    providerType: provider.type,
    providerProductId: printSpec?.providerProductId,
    providerVariantId: printSpec?.providerVariantId,
  };
  
  // Save via API
  const res = await fetch('/api/drafts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft),
  });
  
  if (res.ok) {
    const { draftId, url } = await res.json();
    // Navigate to draft URL
    window.location.href = url; // or use Next.js router
  } else {
    const { error, details } = await res.json();
    alert(`Failed to save: ${error}\n${details?.join('\n')}`);
  }
};
```

8. **Add Save Buttons to Header**
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
      await handleSaveDraft();
      // Navigate to next step (e.g., checkout)
    }}
    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
  >
    Save & Continue
  </button>
</div>
```

---

## 🔍 Testing the Changes

### 1. Test Asset Upload
```bash
# In browser console:
const formData = new FormData();
formData.append('file', fileInput.files[0]);
const res = await fetch('/api/assets', { method: 'POST', body: formData });
const asset = await res.json();
console.log(asset); // Should show assetId, url, width, height
```

### 2. Test OptionsPanel
```typescript
// In a test page:
import { MockProvider } from '@/lib/designer/providers/MockProvider';
import { OptionsPanel } from '@/components/Designer/OptionsPanel';

const provider = new MockProvider();
const [selection, setSelection] = useState({});

<OptionsPanel
  provider={provider}
  selection={selection}
  onSelectionChange={(updates) => setSelection(prev => ({ ...prev, ...updates }))}
/>
```

### 3. Test Draft Saving
```bash
# Test POST /api/drafts with valid draft (no base64):
curl -X POST http://localhost:3000/api/drafts \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test_draft_1",
    "productType": "greeting-card",
    "selection": { "productType": "greeting-card", "orientation": "portrait", "size": "5x7" },
    "printSpecId": "mock-greeting-card-5x7-portrait-flat",
    "design": { "sides": {} },
    "createdAt": 1234567890,
    "updatedAt": 1234567890,
    "version": 1,
    "providerType": "mock"
  }'

# Should return: { "success": true, "draftId": "test_draft_1", "url": "/designer/draft/test_draft_1" }
```

### 4. Test Draft Validation (Should Reject Base64)
```bash
# Test with base64 (should fail):
curl -X POST http://localhost:3000/api/drafts \
  -H "Content-Type: application/json" \
  -d '{
    "productType": "greeting-card",
    "design": {
      "sides": {
        "front": {
          "objects": [{
            "id": "img1",
            "type": "image",
            "assetUrl": "data:image/png;base64,iVBORw0KGgoAAAANS..."
          }]
        }
      }
    }
  }'

# Should return 400: { "error": "Draft validation failed", "details": [...] }
```

---

## 📁 File Structure

```
tae-full-devsite/
├── lib/
│   └── designer/
│       ├── types.ts                      ✅ Internal type system
│       └── providers/
│           ├── ProductProvider.ts        ✅ Provider interface
│           ├── MockProvider.ts           ✅ Mock implementation
│           └── GelatoProvider.ts         🔄 TODO: Gelato implementation
├── components/
│   ├── Designer/
│   │   └── OptionsPanel.tsx              ✅ Provider-driven options UI
│   └── ProjectEditor/
│       ├── ProjectEditor.tsx             🔄 TODO: Update to use providers
│       └── types.ts                      🔄 TODO: Update EditorObject
├── app/
│   └── api/
│       ├── assets/
│       │   └── route.ts                  ✅ Asset upload endpoint
│       └── drafts/
│           ├── route.ts                  ✅ Draft save/list endpoints
│           └── [id]/
│               └── route.ts              ✅ Draft get/delete endpoints
├── public/
│   └── uploads/                          ✅ Asset storage directory
└── data/
    └── drafts/                           ✅ Draft storage directory
```

---

## ⚠️ Breaking Changes & Migration

### For Existing Code

1. **EditorObject.src → assetUrl**
   - Old: `{ type: 'image', src: 'data:image/png;base64,...' }`
   - New: `{ type: 'image', assetId: 'asset_123', assetUrl: '/uploads/asset_123.jpg' }`

2. **Hardcoded Size Selection → Provider**
   - Old: Gelato API calls in component
   - New: `provider.getSizes(productType, orientation)`

3. **Draft Saving**
   - Old: Saved with base64 (causes 413 errors)
   - New: Upload assets first, then save with references

### Backward Compatibility

- ✅ Old drafts can be migrated by detecting base64 and uploading to /api/assets
- ✅ Provider pattern allows gradual migration (start with MockProvider, then add GelatoProvider)

---

## 🎯 Remaining TODOs

### Phase 3: Integration
- [ ] Update `ProjectEditor.tsx` to use provider pattern
- [ ] Update `EditorObject` type to use `assetId`/`assetUrl`
- [ ] Wire up OptionsPanel in ProjectEditor sidebar
- [ ] Implement image upload with /api/assets
- [ ] Implement Save Draft button
- [ ] Implement Save & Continue button with navigation

### Phase 4: Gelato Provider
- [ ] Create `lib/designer/providers/GelatoProvider.ts`
- [ ] Map Gelato API responses to internal types
- [ ] Implement caching layer
- [ ] Test with real Gelato products

### Phase 5: Draft Routes
- [ ] Create `/designer/draft/[id]` route
- [ ] Load draft and initialize editor
- [ ] Handle draft not found errors

---

## 💡 Key Insights

### Why Provider Pattern?

- ✅ **Decouples UI from data source** - Can swap Mock → Gelato → Custom API
- ✅ **Testable** - Mock provider for tests, no API calls needed
- ✅ **Type-safe** - Internal types ensure consistency
- ✅ **Cacheable** - Provider can cache responses

### Why No Base64?

- ❌ **413 errors** - Base64 inflates JSON size by ~33%
- ❌ **Performance** - Slow to serialize/deserialize
- ✅ **Asset references** - Clean, small, reusable
- ✅ **CDN-ready** - Can move to S3/CDN later

### Why mm-based Specs?

- ✅ **Print-accurate** - Print specs are in mm
- ✅ **DPI-agnostic** - Convert to screen (96 DPI) or print (300 DPI) as needed
- ✅ **Gelato-compatible** - Gelato API uses mm

---

## 🚀 Ready to Wire It Up!

All the foundational pieces are in place. Next: integrate into ProjectEditor and test the full flow.

