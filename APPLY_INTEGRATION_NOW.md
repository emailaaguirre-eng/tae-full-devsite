# Apply Integration to ProjectEditor.tsx - COMPLETE INSTRUCTIONS

## 🎯 Goal
Integrate provider-based architecture into `components/ProjectEditor/ProjectEditor.tsx` following the 12-section plan.

## 📋 Send This to Cursor

Copy the entire prompt below and send to Cursor:

---

```
Apply these 12 sections of changes to components/ProjectEditor/ProjectEditor.tsx:

SECTION 1: UPDATE IMPORTS
Add these imports at the top (after existing imports):

import { useRouter } from 'next/navigation';
import type { ProductProvider } from '@/lib/designer/providers/ProductProvider';
import type { SelectionState, PhysicalDesignDraft, PrintSpec as InternalPrintSpec } from '@/lib/designer/types';
import { OptionsPanel } from '@/components/Designer/OptionsPanel';

Keep existing imports. Don't remove anything yet.

---

SECTION 2: UPDATE INTERFACE
Replace the ProjectEditorRebuildProps interface with:

interface ProjectEditorRebuildProps {
  // NEW: Provider instance (required)
  provider: ProductProvider;
  
  // NEW: Initial selection (optional)
  initialSelection?: Partial<SelectionState>;
  
  // NEW: Draft ID (if loading existing draft)
  initialDraftId?: string;
  
  // Callbacks
  onComplete?: (exportData: {
    productSlug?: string;
    printSpecId?: string;
    draftId?: string;
    exports: Array<{ sideId: string; dataUrl: string; width: number; height: number }>;
  }) => void;
  onClose?: () => void;
}

---

SECTION 3: UPDATE FUNCTION SIGNATURE AND ADD NEW STATE
Replace the function signature and add new state at the top:

export default function ProjectEditor({
  provider,
  initialSelection,
  initialDraftId,
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
  
  // NEW: PrintSpec from provider
  const [printSpec, setPrintSpec] = useState<InternalPrintSpec | null>(null);
  const [isSpecLoading, setIsSpecLoading] = useState(false);
  
  // NEW: Draft state
  const [draftId, setDraftId] = useState<string | undefined>(initialDraftId);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Keep all existing state below (sideStates, activeSideId, selectedId, etc.)
  // ... existing state ...

DELETE these old state variables (they're replaced by selection):
- editorOrientation
- cardFormat
- isCardProduct
- gelatoVariantData
- lockedProductUid
- lockedVariantUid

---

SECTION 4: DELETE OLD GELATO FETCH
Delete the entire useEffect that fetches Gelato variant data (lines ~96-111).
Delete the old printSpec useMemo (lines ~115-149).

---

SECTION 5: ADD PRINTSPEC GENERATION FROM PROVIDER
Add this new useEffect after the state declarations:

// Generate PrintSpec from provider when selection changes
useEffect(() => {
  const hasRequiredFields = 
    selection.productType && 
    selection.orientation && 
    selection.size;
  
  if (!hasRequiredFields) {
    console.log('[ProjectEditor] Missing required fields for PrintSpec');
    setPrintSpec(null);
    return;
  }
  
  setIsSpecLoading(true);
  console.log('[ProjectEditor] Generating PrintSpec for selection:', selection);
  
  provider.generatePrintSpec(selection)
    .then(spec => {
      console.log('[ProjectEditor] PrintSpec generated:', spec.id);
      setPrintSpec(spec);
      setIsSpecLoading(false);
    })
    .catch(err => {
      console.error('[ProjectEditor] Failed to generate PrintSpec:', err);
      setPrintSpec(null);
      setIsSpecLoading(false);
    });
}, [provider, selection]); // CRITICAL: Only depend on selection, NOT printSpec!

---

SECTION 6: UPDATE SIDE STATES INITIALIZATION
Keep the existing side states initialization logic but simplify it:

// Track printSpec ID to detect changes
const lastPrintSpecIdRef = useRef<string | null>(null);

// Initialize/reinitialize side states when printSpec changes
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
}, [printSpec]); // Don't include sideStates or activeSideId to avoid loops!

---

SECTION 7: UPDATE IMAGE UPLOAD TO USE /api/assets
Replace the handleFileUpload function with:

const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;
  
  console.log('[ProjectEditor] Uploading', files.length, 'files...');
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
      
      console.log('[ProjectEditor] Uploading:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      
      const res = await fetch('/api/assets', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Upload failed (${res.status}): ${errorText}`);
      }
      
      const asset = await res.json();
      console.log('[ProjectEditor] Asset uploaded:', asset.assetId, asset.url);
      
      // Add to asset store
      useAssetStore.getState().addAsset({
        id: asset.assetId,
        name: file.name,
        mimeType: asset.mimeType,
        width: asset.width,
        height: asset.height,
        src: asset.url, // This is /uploads/asset_xxx.jpg
        assetId: asset.assetId,
        assetUrl: asset.url,
        origin: 'uploaded',
      } as any);
      
      console.log('[ProjectEditor] Asset added to store, triggering canvas add...');
      // handleAddImage will be called from the UI when user clicks thumbnail
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
}, []); // No dependencies needed

---

SECTION 8: UPDATE handleAddImage TO USE assetUrl
In the handleAddImage function, find where newObject is created and update it to:

const newObject = {
  id: `img-${Date.now()}`,
  type: 'image' as const,
  assetId: (asset as any).assetId || `fallback-${Date.now()}`,
  assetUrl: asset.src, // This is /uploads/asset_xxx.jpg or external URL
  x,
  y,
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
  width: finalW,
  height: finalH,
};

Remove any 'src' field. Only use assetId + assetUrl.

---

SECTION 9: ADD SANITIZE AND SAVE DRAFT FUNCTIONS
Add these functions before the return statement:

// Sanitize draft payload (remove base64)
const sanitizeDraftPayload = useCallback((draft: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check for base64 in design objects
  for (const sideId in draft.design?.sides || {}) {
    const side = draft.design.sides[sideId];
    for (const obj of side.objects || []) {
      // Check assetUrl
      if (obj.assetUrl && obj.assetUrl.startsWith('data:')) {
        errors.push(`Object ${obj.id} on side ${sideId} contains base64 data URL`);
      }
      // Check legacy src field
      if (obj.src && obj.src.startsWith('data:')) {
        errors.push(`Object ${obj.id} on side ${sideId} contains base64 in src field`);
      }
      // Check for blob: URLs (unuploaded)
      if (obj.assetUrl && obj.assetUrl.startsWith('blob:')) {
        errors.push(`Object ${obj.id} on side ${sideId} contains blob: URL (not uploaded)`);
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}, []);

// Save Draft function
const handleSaveDraft = useCallback(async () => {
  if (!printSpec) {
    alert('Please select product options first.');
    return;
  }
  
  console.log('[ProjectEditor] Starting draft save...');
  setIsSaving(true);
  setSaveError(null);
  
  try {
    // Build draft payload
    const draft: PhysicalDesignDraft = {
      id: draftId || '',
      productType: selection.productType,
      selection,
      printSpecId: printSpec.id,
      design: {
        sides: sideStates as any,
      },
      createdAt: draftId ? (Date.now() - 60000) : Date.now(),
      updatedAt: Date.now(),
      version: 1,
      providerType: provider.type,
      providerProductId: printSpec.providerProductId,
      providerVariantId: printSpec.providerVariantId,
    };
    
    // Sanitize (check for base64)
    const validation = sanitizeDraftPayload(draft);
    if (!validation.valid) {
      const errorMsg = 'Draft contains base64 data. Please wait for uploads to complete.\n\n' + 
                      validation.errors.join('\n');
      console.error('[ProjectEditor] Draft validation failed:', validation.errors);
      alert(errorMsg);
      setIsSaving(false);
      return;
    }
    
    // Calculate payload size
    const payloadSize = JSON.stringify(draft).length;
    console.log('[ProjectEditor] Draft payload size:', (payloadSize / 1024).toFixed(2), 'KB');
    
    if (payloadSize > 500000) { // 500KB warning
      console.warn('[ProjectEditor] Large draft payload:', (payloadSize / 1024).toFixed(2), 'KB');
    }
    
    // Save via API
    const method = draftId ? 'PUT' : 'POST';
    const url = draftId ? `/api/drafts/${draftId}` : '/api/drafts';
    
    console.log('[ProjectEditor] Saving draft via', method, url);
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(`${errorData.error || 'Save failed'}${errorData.details ? '\n' + errorData.details.join('\n') : ''}`);
    }
    
    const { draftId: savedDraftId, url: draftUrl } = await res.json();
    
    // Update state
    if (!draftId) {
      setDraftId(savedDraftId);
    }
    
    console.log('[ProjectEditor] Draft saved successfully:', savedDraftId);
    alert('Draft saved successfully!');
    
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
}, [provider, selection, printSpec, sideStates, draftId, sanitizeDraftPayload]);

// Save and Continue function
const handleSaveAndContinue = useCallback(async () => {
  try {
    console.log('[ProjectEditor] Save and continue...');
    const result = await handleSaveDraft();
    if (result) {
      console.log('[ProjectEditor] Navigating to:', `/artkey/edit/${result.draftId}`);
      router.push(`/artkey/edit/${result.draftId}`);
    }
  } catch (error) {
    // Error already handled in handleSaveDraft
    console.error('[ProjectEditor] Save and continue failed');
  }
}, [handleSaveDraft, router]);

---

SECTION 10: UPDATE HEADER UI
In the header section (around line 680-820), make these changes:

1. DELETE the hardcoded orientation/format toggle buttons
2. DELETE the SizePicker section
3. DELETE the locked product info banner

REPLACE the sidebar header controls section with:

{/* Product Options Panel */}
<div className="p-4 border-b border-gray-200 bg-white">
  <h3 className="text-sm font-semibold text-gray-900 mb-3">Product Options</h3>
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

---

SECTION 11: UPDATE TOOLBAR BUTTONS
In the toolbar buttons section, UPDATE the buttons:

<div className="flex items-center gap-2">
  {/* Keep Undo/Redo buttons */}
  <button
    onClick={handleUndo}
    disabled={historyIndex <= 0}
    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
    title="Undo"
  >
    <Undo className="w-5 h-5" />
  </button>
  <button
    onClick={handleRedo}
    disabled={historyIndex >= history.length - 1}
    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
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
    className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {isSaving ? 'Saving...' : 'Save & Continue'}
  </button>
  
  {/* Keep Export and Close buttons */}
  <button
    onClick={handleExport}
    disabled={isSaving}
    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
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

{/* NEW: Error display */}
{saveError && (
  <div className="px-4 py-2 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm mt-2">
    Error: {saveError}
  </div>
)}

---

SECTION 12: UPDATE ImageObject COMPONENT
In the ImageObject component (near the end of the file), update the image URL handling:

function ImageObject({ object, ... }) {
  // CHANGE THIS LINE:
  // OLD: const [img] = useImage(object.src || '');
  // NEW:
  const imageUrl = (object as any).assetUrl || (object as any).src || '';
  const [img] = useImage(imageUrl);
  
  // Keep rest of component the same
  ...
}

---

CRITICAL RULES:
1. Do NOT recreate provider on each render (it's passed as prop)
2. PrintSpec useEffect should ONLY depend on [provider, selection], NOT printSpec
3. All image objects must use assetId + assetUrl, never base64
4. Sanitize draft before saving to catch any base64
5. Add console.log statements for debugging as shown above

After making changes, verify:
- No TypeScript errors
- No infinite render loops (check console)
- Options panel renders
- Save buttons appear in toolbar
```

---

## ✅ Verification Checklist

After Cursor applies the changes, verify:

1. File compiles with no TypeScript errors
2. Options panel appears in left sidebar
3. Save Draft and Save & Continue buttons in toolbar
4. Console shows "Generating PrintSpec" when size changes
5. No infinite "Generating PrintSpec" loops

## 🧪 Quick Test

```bash
npm run dev
# Go to /project-editor-demo
# Check console for:
# - "Generating PrintSpec for selection"
# - "PrintSpec generated: mock-greeting-card-..."
# - No repeated messages (no loop)
```

## 🎯 Success Criteria

- ✅ Options panel loads
- ✅ Changing size regenerates canvas
- ✅ Image upload shows console message
- ✅ Save Draft button appears and is clickable
- ✅ No infinite loops

---

**Copy the prompt above and send to Cursor now!** 🚀

