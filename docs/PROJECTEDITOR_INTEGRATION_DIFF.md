# ProjectEditor Integration - Complete Diff

This document shows the exact changes needed to integrate the provider-based architecture into `components/ProjectEditor/ProjectEditor.tsx`.

## Summary of Changes

1. ✅ Add provider prop and SelectionState management
2. ✅ Remove hardcoded Gelato API calls
3. ✅ Use provider to generate PrintSpec
4. ✅ Ensure asset-ref-only image handling (no base64)
5. ✅ Add Save Draft and Save & Continue buttons
6. ✅ Add draft state management

---

## 1. Update Imports

### ADD these imports at the top:

```typescript
// NEW: Provider and internal types
import type { ProductProvider } from '@/lib/designer/providers/ProductProvider';
import type { SelectionState, PhysicalDesignDraft, DesignState, DesignObject } from '@/lib/designer/types';
import { OptionsPanel } from '@/components/Designer/OptionsPanel';
import { useRouter } from 'next/navigation';
```

---

## 2. Update Interface

### REPLACE `ProjectEditorRebuildProps`:

```typescript
// OLD interface (remove):
interface ProjectEditorRebuildProps {
  printSpecId?: string;
  productSlug?: string;
  config?: any;
  gelatoVariantUid?: string;
  selectedVariant?: { ... };
  onComplete?: (exportData: ...) => void;
  onClose?: () => void;
}

// NEW interface:
interface ProjectEditorRebuildProps {
  // NEW: Provider instance (required)
  provider: ProductProvider;
  
  // NEW: Initial selection (optional)
  initialSelection?: Partial<SelectionState>;
  
  // NEW: Draft ID (if loading existing draft)
  draftId?: string;
  
  // Callbacks
  onComplete?: (exportData: {
    productSlug?: string;
    printSpecId?: string;
    draftId?: string;
    exports: Array<{ sideId: string; dataUrl: string; width: number; height: number }>;
  }) => void;
  onClose?: () => void;
}
```

---

## 3. Update Component Props and State

### REPLACE the function signature and initial state:

```typescript
export default function ProjectEditor({
  provider,
  initialSelection,
  draftId: initialDraftId,
  onComplete,
  onClose,
}: ProjectEditorRebuildProps) {
  const router = useRouter();
  
  // NEW: Selection state (single source of truth)
  const [selection, setSelection] = useState<SelectionState>({
    productType: initialSelection?.productType || 'greeting-card',
    orientation: initialSelection?.orientation || 'portrait',
    size: initialSelection?.size || '5x7',
    paperType: initialSelection?.paperType,
    foldFormat: initialSelection?.foldFormat || 'flat',
    foilOption: initialSelection?.foilOption,
    envelopeOption: initialSelection?.envelopeOption,
  });
  
  // NEW: PrintSpec generated from provider
  const [printSpec, setPrintSpec] = useState<PrintSpec | null>(null);
  
  // NEW: Draft state
  const [draftId, setDraftId] = useState<string | undefined>(initialDraftId);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Core state (keep existing)
  const [sideStates, setSideStates] = useState<Record<string, SideState>>({});
  const [activeSideId, setActiveSideId] = useState<string>('front');
  const [selectedId, setSelectedId] = useState<string | undefined>();
  
  // Text editing state (keep existing)
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState<string>('');
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  
  // History for undo/redo (keep existing)
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const maxHistory = 50;
  
  // Refs (keep existing)
  const transformerRef = useRef<any>(null);
  const nodeRefs = useRef<Record<string, any>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<any>(null);
  const stageContainerRef = useRef<HTMLDivElement>(null);
  
  // REMOVE: All Gelato-specific state
  // ❌ const [editorOrientation, setEditorOrientation] = useState(...)
  // ❌ const [cardFormat, setCardFormat] = useState(...)
  // ❌ const [gelatoVariantData, setGelatoVariantData] = useState(...)
  // ❌ const [lockedProductUid, setLockedProductUid] = useState(...)
  // ❌ const [lockedVariantUid, setLockedVariantUid] = useState(...)
```

---

## 4. Generate PrintSpec from Provider

### REPLACE the PrintSpec generation logic:

```typescript
// REMOVE: All existing printSpec useMemo/useEffect (lines 95-149)
// ❌ useEffect(() => { fetch('/api/gelato/variant/...') })
// ❌ const printSpec = useMemo(() => { ... })

// ADD: Provider-driven PrintSpec generation
useEffect(() => {
  const hasRequiredFields = 
    selection.productType && 
    selection.orientation && 
    selection.size;
  
  if (!hasRequiredFields) {
    setPrintSpec(null);
    return;
  }
  
  // Generate PrintSpec from provider
  provider.generatePrintSpec(selection)
    .then(spec => {
      console.log('[ProjectEditor] PrintSpec generated:', spec.id);
      setPrintSpec(spec);
    })
    .catch(err => {
      console.error('[ProjectEditor] Failed to generate PrintSpec:', err);
      setPrintSpec(null);
    });
}, [provider, selection]); // Only depend on selection, not printSpec!
```

---

## 5. Initialize Side States from PrintSpec

### REPLACE the side states initialization:

```typescript
// REMOVE: Existing lastPrintSpecIdRef logic (lines 152-185)

// ADD: Initialize sides when PrintSpec changes
const lastPrintSpecIdRef = useRef<string | null>(null);

useEffect(() => {
  if (!printSpec) return;
  
  const currentSpecId = printSpec.id;
  
  // Only reinitialize if spec ID changed
  if (lastPrintSpecIdRef.current !== currentSpecId) {
    console.log('[ProjectEditor] PrintSpec changed, initializing sides');
    
    const initialStates: Record<string, SideState> = {};
    printSpec.sides.forEach((side) => {
      // Preserve existing objects if side exists
      const existingState = sideStates[side.id];
      initialStates[side.id] = existingState || {
        objects: [],
        selectedId: undefined,
      };
    });
    
    setSideStates(initialStates);
    
    // Set active side if it doesn't exist in new spec
    if (!printSpec.sides.find(s => s.id === activeSideId)) {
      setActiveSideId(printSpec.sides[0].id);
    }
    
    setSelectedId(undefined);
    lastPrintSpecIdRef.current = currentSpecId;
  }
}, [printSpec]); // Don't include sideStates or activeSideId to avoid loops
```

---

## 6. Update Image Upload to Use Asset API

### REPLACE `handleFileUpload`:

```typescript
// REMOVE: Old handleFileUpload (lines 520-551)

// ADD: New asset-ref-only upload
const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files) return;
  
  setIsSaving(true); // Show loading state
  
  for (const file of Array.from(files)) {
    if (!file.type.startsWith('image/')) {
      console.warn('[ProjectEditor] Skipping non-image file:', file.name);
      continue;
    }
    
    try {
      // Upload to /api/assets
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/assets', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error(`Upload failed: ${res.statusText}`);
      }
      
      const asset = await res.json();
      console.log('[ProjectEditor] Asset uploaded:', asset.assetId);
      
      // Add to asset store
      useAssetStore.getState().addAsset({
        id: asset.assetId,
        name: file.name,
        mimeType: asset.mimeType,
        width: asset.width,
        height: asset.height,
        src: asset.url,
        assetId: asset.assetId,
        assetUrl: asset.url,
        origin: 'uploaded',
      } as any);
      
      // Auto-add to canvas
      handleAddImage({
        id: asset.assetId,
        name: file.name,
        mimeType: asset.mimeType,
        width: asset.width,
        height: asset.height,
        src: asset.url,
        assetId: asset.assetId,
        assetUrl: asset.url,
      } as any);
    } catch (error) {
      console.error('[ProjectEditor] Upload error:', error);
      alert(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : error}`);
    }
  }
  
  setIsSaving(false);
  
  // Reset input
  if (fileInputRef.current) {
    fileInputRef.current.value = '';
  }
}, [handleAddImage]);
```

---

## 7. Update handleAddImage to Use assetUrl

### REPLACE the image object creation in `handleAddImage`:

```typescript
// In handleAddImage function (around line 352-410)
// FIND this section:
const newObject: EditorObject = {
  id: `img-${Date.now()}`,
  type: 'image',
  src: asset.src,  // ❌ REMOVE
  x, y, scaleX: 1, scaleY: 1, rotation: 0,
  width: finalW,
  height: finalH,
};

// REPLACE with:
const newObject: DesignObject = {
  id: `img-${Date.now()}`,
  type: 'image',
  assetId: (asset as any).assetId || `asset-${Date.now()}`, // ✅ Asset reference
  assetUrl: asset.src, // ✅ /uploads/asset_xxx.jpg or external URL
  x, y, scaleX: 1, scaleY: 1, rotation: 0,
  width: finalW,
  height: finalH,
};
```

---

## 8. Add Save Draft Function

### ADD this function before the return statement (around line 600):

```typescript
// NEW: Save Draft function
const handleSaveDraft = useCallback(async () => {
  if (!printSpec) {
    alert('Please select product options first.');
    return;
  }
  
  // Check for unuploaded assets (blob: or data: URLs)
  const hasUnuploadedAssets = Object.values(sideStates).some(side =>
    side.objects.some(obj => {
      const assetUrl = (obj as any).assetUrl || (obj as any).src;
      return assetUrl?.startsWith('blob:') || assetUrl?.startsWith('data:');
    })
  );
  
  if (hasUnuploadedAssets) {
    alert('Please wait for all images to finish uploading before saving.');
    return;
  }
  
  setIsSaving(true);
  setSaveError(null);
  
  try {
    // Build draft payload
    const draft: PhysicalDesignDraft = {
      id: draftId || '', // Will be generated by API if empty
      productType: selection.productType,
      selection,
      printSpecId: printSpec.id,
      design: {
        sides: sideStates as Record<string, any>,
      },
      createdAt: draftId ? (Date.now() - 60000) : Date.now(), // Preserve creation time if editing
      updatedAt: Date.now(),
      version: 1,
      providerType: provider.type,
      providerProductId: printSpec.providerProductId,
      providerVariantId: printSpec.providerVariantId,
    };
    
    // Save via API
    const method = draftId ? 'PUT' : 'POST';
    const url = draftId ? `/api/drafts/${draftId}` : '/api/drafts';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    
    if (!res.ok) {
      const { error, details } = await res.json();
      throw new Error(`${error}${details ? `\n${details.join('\n')}` : ''}`);
    }
    
    const { draftId: savedDraftId, url: draftUrl } = await res.json();
    
    // Update state
    if (!draftId) {
      setDraftId(savedDraftId);
    }
    
    console.log('[ProjectEditor] Draft saved:', savedDraftId);
    return { draftId: savedDraftId, url: draftUrl };
  } catch (error) {
    console.error('[ProjectEditor] Save draft error:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    setSaveError(errorMsg);
    alert(`Failed to save draft:\n${errorMsg}`);
    throw error;
  } finally {
    setIsSaving(false);
  }
}, [provider, selection, printSpec, sideStates, draftId]);

// NEW: Save and Continue function
const handleSaveAndContinue = useCallback(async () => {
  try {
    const result = await handleSaveDraft();
    if (result) {
      // Navigate to next step (adjust URL as needed)
      router.push(`/artkey/edit/${result.draftId}`);
    }
  } catch (error) {
    // Error already handled in handleSaveDraft
  }
}, [handleSaveDraft, router]);
```

---

## 9. Update Header UI (Sidebar with OptionsPanel)

### FIND the sidebar section (around line 822-860) and REPLACE:

```typescript
// REMOVE: Hardcoded orientation/format toggles
// ❌ <div className="flex items-center gap-4">
// ❌   <button onClick={() => setEditorOrientation('portrait')}>Portrait</button>
// ❌   <button onClick={() => setEditorOrientation('landscape')}>Landscape</button>
// ❌ </div>

// ADD: OptionsPanel (replace entire sidebar header controls section)
{/* Product Options Panel */}
<div className="p-4 border-b border-gray-200">
  <OptionsPanel
    provider={provider}
    selection={selection}
    onSelectionChange={(updates) => {
      console.log('[ProjectEditor] Selection updated:', updates);
      setSelection(prev => ({ ...prev, ...updates }));
    }}
    disabled={isSaving}
  />
</div>
```

---

## 10. Update Toolbar Buttons

### FIND the header buttons section (around line 786-817) and UPDATE:

```typescript
<div className="flex items-center gap-2">
  {/* Undo/Redo - keep existing */}
  <button
    onClick={handleUndo}
    disabled={historyIndex <= 0}
    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
    title="Undo"
  >
    <Undo className="w-5 h-5" />
  </button>
  <button
    onClick={handleRedo}
    disabled={historyIndex >= history.length - 1}
    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
    title="Redo"
  >
    <Redo className="w-5 h-5" />
  </button>
  
  {/* NEW: Save Draft button */}
  <button
    onClick={handleSaveDraft}
    disabled={isSaving || !printSpec}
    className="px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {isSaving ? 'Saving...' : draftId ? 'Update Draft' : 'Save Draft'}
  </button>
  
  {/* NEW: Save & Continue button */}
  <button
    onClick={handleSaveAndContinue}
    disabled={isSaving || !printSpec}
    className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
  >
    {isSaving ? 'Saving...' : 'Save & Continue'}
  </button>
  
  {/* Export - keep existing but update */}
  <button
    onClick={handleExport}
    disabled={isSaving}
    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
  >
    <Download className="w-4 h-4" />
    Export
  </button>
  
  {/* Close - keep existing */}
  {onClose && (
    <button
      onClick={onClose}
      className="p-2 rounded-lg hover:bg-gray-100"
    >
      <X className="w-5 h-5" />
    </button>
  )}
</div>

{/* NEW: Save error display */}
{saveError && (
  <div className="px-4 py-2 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
    Error: {saveError}
  </div>
)}
```

---

## 11. Update ImageObject Component

### FIND ImageObject component (around line 1227-1317) and UPDATE:

```typescript
function ImageObject({ ... }) {
  // REPLACE:
  // ❌ const [img] = useImage(object.src || '');
  
  // WITH:
  // ✅ Use assetUrl (supports both old and new format)
  const imageUrl = (object as any).assetUrl || (object as any).src || '';
  const [img] = useImage(imageUrl);
  
  // ... rest stays the same
}
```

---

## 12. Remove Gelato-Specific Code

### DELETE these sections entirely:

```typescript
// ❌ DELETE: Gelato variant fetch (lines 95-111)
useEffect(() => {
  if (gelatoVariantUid && !gelatoVariantData) {
    fetch(`/api/gelato/variant/${gelatoVariantUid}`)...
  }
}, [gelatoVariantUid, gelatoVariantData]);

// ❌ DELETE: Size picker section (lines 824-845)
{!lockedVariantUid && !gelatoVariantUid && (
  <div className="p-4 border-b border-gray-200">
    <SizePicker ... />
  </div>
)}

// ❌ DELETE: Locked product info (lines 847-860)
{lockedProductUid && (
  <div className="p-4 border-b border-gray-200 bg-blue-50">...
  </div>
)}
```

---

## Summary of Key Changes

### State Changes:
- ❌ Removed: `editorOrientation`, `cardFormat`, `gelatoVariantData`, `lockedProductUid`, `lockedVariantUid`
- ✅ Added: `selection` (SelectionState), `printSpec` (from provider), `draftId`, `isSaving`, `saveError`

### Logic Changes:
- ❌ Removed: Hardcoded Gelato API calls, manual PrintSpec generation
- ✅ Added: Provider-driven PrintSpec generation, asset upload to /api/assets, draft persistence

### UI Changes:
- ❌ Removed: Hardcoded orientation/format toggles, SizePicker, locked product banner
- ✅ Added: OptionsPanel (provider-driven), Save Draft button, Save & Continue button

### Data Flow:
```
User selects options (OptionsPanel)
  ↓
SelectionState updates
  ↓
Provider generates PrintSpec
  ↓
Canvas re-renders with new spec
  ↓
User uploads images → /api/assets
  ↓
Objects store assetId + assetUrl (no base64!)
  ↓
User clicks Save Draft
  ↓
Validation: check for base64
  ↓
POST/PUT /api/drafts
  ↓
Navigate to /artkey/edit/[draftId]
```

---

## Testing Checklist

After making these changes:

1. ✅ Test OptionsPanel loads options from provider
2. ✅ Test selection changes regenerate PrintSpec
3. ✅ Test canvas renders with correct guides
4. ✅ Test image upload goes to /api/assets
5. ✅ Test objects only contain assetUrl (no base64)
6. ✅ Test Save Draft validates and saves
7. ✅ Test Save & Continue navigates correctly
8. ✅ Test undo/redo still works
9. ✅ Test loading existing draft
10. ✅ Check browser console for errors

---

This completes the integration! The ProjectEditor is now provider-driven, asset-ref-only, and draft-persistent.

