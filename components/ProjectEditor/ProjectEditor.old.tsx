"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Rect, Line, Transformer, Group, Circle, Ellipse } from 'react-konva';
import useImage from 'use-image';
import { Download, X, Eye, EyeOff, Type, Upload } from 'lucide-react';
import { useAssetStore, type UploadedAsset } from '@/lib/assetStore';
import { getPrintSpecForProduct, getPrintSide, generatePrintSpecForSize, type PrintSpec, type PrintSide, type PrintSpecResult } from '@/lib/printSpecs';
import { DEFAULT_FONT, DEFAULT_FONT_WEIGHT } from '@/lib/editorFonts';
import LabelInspector from './LabelInspector';
import ArtKeyPanel from './ArtKeyPanel';
import TemplatesPanel from './TemplatesPanel';
import DraftBanner from './DraftBanner';
import LabelShapesPanel from './LabelShapesPanel';
import { LABEL_SHAPES, type LabelShape } from '@/lib/labelShapes';
import { getAllSkeletonKeys, getSkeletonKey, type SkeletonKeyDefinition } from '@/lib/skeletonKeys';
import { generateQRCode, getDefaultArtKeyUrl } from '@/lib/qr';
import { getCollageTemplate, getAllCollageTemplates, type CollageTemplate } from '@/lib/collageTemplates';
import { saveDraft, loadDraft, deleteDraft, getDraftKey, type DraftData, type PersistedAsset, DRAFT_ASSETS_SIZE_CAP } from '@/lib/draftStore';

// Import types from shared types file to avoid circular dependencies
import type { EditorObject, ProjectEditorConfig } from './types';

// Re-export for backward compatibility
export type { EditorObject, ProjectEditorConfig, FrameFillState, TemplateState, SideState } from './types';

// Import additional types
import type { FrameFillState, TemplateState, SideState } from './types';

// ProjectEditorConfig is now imported from ./types

interface ProjectEditorProps {
  printSpecId?: string; // Optional: if not provided, will use default
  productSlug?: string; // Product slug for spec lookup
  config?: Partial<ProjectEditorConfig>; // ArtKey configuration
  gelatoVariantUid?: string; // Gelato variant UID from Sprint 2A
  selectedVariant?: { // Selected variant data
    uid: string;
    size?: string | null;
    orientation?: 'portrait' | 'landscape';
    material?: string | null;
    paper?: string | null;
    frame?: string | null;
    foil?: string | null;
    fold?: string | null; // 'bifold' or 'flat'
    price?: number;
  };
  onComplete?: (exportData: { 
    productSlug?: string;
    printSpecId?: string;
    exports: Array<{ sideId: string; dataUrl: string; width: number; height: number }>;
  }) => void;
  onClose?: () => void;
}

export default function ProjectEditor({ 
  printSpecId, 
  productSlug,
  config,
  gelatoVariantUid,
  selectedVariant,
  onComplete, 
  onClose 
}: ProjectEditorProps) {
  // Log Gelato variant in dev mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[GELATO_VARIANT]', { gelatoVariantUid, selectedVariant });
    }
  }, [gelatoVariantUid, selectedVariant]);

  // Merge config with defaults
  const editorConfig: ProjectEditorConfig = {
    productSlug: productSlug || config?.productSlug || 'unknown',
    printSpecId: printSpecId || config?.printSpecId,
    qrRequired: config?.qrRequired || false,
    allowedSidesForQR: config?.allowedSidesForQR || ['front'],
    qrPlacementMode: config?.qrPlacementMode || 'flexible',
    defaultSkeletonKeyId: config?.defaultSkeletonKeyId,
    artKeyUrlPlaceholder: config?.artKeyUrlPlaceholder,
  };

  // Per-side scene state: Record<SideId, SideState>
  const [sideStateById, setSideStateById] = useState<Record<string, SideState>>({});
  const [activeSideId, setActiveSideId] = useState<string>('front');
  const [showBleed, setShowBleed] = useState(false);
  const [showTrim, setShowTrim] = useState(true); // Show trim by default to see print area
  const [showSafe, setShowSafe] = useState(true); // Show safe zone by default
  const [showFold, setShowFold] = useState(true); // Default to showing fold lines for cards
  const [includeGuidesInExport, setIncludeGuidesInExport] = useState(false);
  const [showQRTarget, setShowQRTarget] = useState(true);
  const [selectedSkeletonKeyId, setSelectedSkeletonKeyId] = useState<string | null>(
    editorConfig.defaultSkeletonKeyId || null
  );
  const [templateMode, setTemplateMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'assets' | 'templates'>('assets');
  // Orientation: default to portrait, but can be changed in editor
  // If variant has orientation, use it; otherwise default to portrait
  const [editorOrientation, setEditorOrientation] = useState<'portrait' | 'landscape'>(
    selectedVariant?.orientation || 'portrait'
  );
  
  // Update orientation when variant changes (but allow user override)
  useEffect(() => {
    if (selectedVariant?.orientation) {
      setEditorOrientation(selectedVariant.orientation);
    }
  }, [selectedVariant?.orientation]);
  const [draftFound, setDraftFound] = useState(false);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [assetsPartial, setAssetsPartial] = useState(false);
  const [restoredGelatoVariantUid, setRestoredGelatoVariantUid] = useState<string | null>(null);
  const [restoredSelectedVariant, setRestoredSelectedVariant] = useState<any>(null);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Store foil selection from shop page to apply as default to new text labels
  const defaultFoilColor = selectedVariant?.foil && selectedVariant.foil !== 'none' 
    ? (selectedVariant.foil as 'gold' | 'silver' | 'rose-gold' | 'copper')
    : null;
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const imageRefs = useRef<Record<string, any>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get assets from shared store
  const assets = useAssetStore((state) => state.assets);

  // State for Gelato print spec
  const [gelatoPrintSpec, setGelatoPrintSpec] = useState<PrintSpec | null>(null);
  const [gelatoSpecLoading, setGelatoSpecLoading] = useState(false);
  const [gelatoSpecError, setGelatoSpecError] = useState<string | null>(null);

  // Fetch Gelato print spec when gelatoVariantUid is available
  useEffect(() => {
    if (!gelatoVariantUid) {
      setGelatoPrintSpec(null);
      setGelatoSpecError(null);
      return;
    }

    setGelatoSpecLoading(true);
    setGelatoSpecError(null);

    // Fetch Gelato product data and convert to PrintSpec
    fetch(`/api/gelato/product?uid=${encodeURIComponent(gelatoVariantUid)}`)
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch Gelato product: ${res.statusText}`);
        }
        const response = await res.json();
        
        if (response.printSpec) {
          setGelatoPrintSpec(response.printSpec);
          setGelatoSpecError(null);
          console.log('[ProjectEditor] Loaded Gelato print spec:', response.printSpec);
        } else {
          throw new Error(response.error || 'Could not parse Gelato product data into PrintSpec');
        }
      })
      .catch((error) => {
        console.warn('[ProjectEditor] Failed to fetch Gelato print spec, using fallback:', error);
        setGelatoSpecError(error.message);
        setGelatoPrintSpec(null);
      })
      .finally(() => {
        setGelatoSpecLoading(false);
      });
  }, [gelatoVariantUid]);

  // Get print spec with error handling
  // Priority: 
  // 1. Gelato print spec (if available from API)
  // 2. If selectedVariant has size, generate dynamic spec based on size
  // 3. gelatoVariantUid > printSpecId > productSlug (legacy fallback)
  const printSpecResult: PrintSpecResult = useMemo(() => {
    // Priority 1: Use Gelato print spec if available (but only if we don't have fold option)
    // If we have a fold option, prefer dynamic spec to respect user's fold choice
    // Also, if Gelato spec doesn't have fold lines and we need bifold, use dynamic spec
    if (gelatoPrintSpec) {
      const needsFold = selectedVariant?.fold === 'bifold' || (!selectedVariant?.fold && productSlug === 'card');
      const hasFoldLines = gelatoPrintSpec.sides.some(side => side.foldLines && side.foldLines.length > 0);
      
      // If we need fold lines but Gelato spec doesn't have them, use dynamic spec
      if (needsFold && !hasFoldLines) {
        console.log('[ProjectEditor] Gelato spec missing fold lines, using dynamic spec');
      } else if (!selectedVariant?.fold) {
        return { spec: gelatoPrintSpec };
      }
    }

    // Priority 2: Dynamic spec based on selected size, orientation, and fold option
    if (selectedVariant?.size && productSlug) {
      // Determine product type for spec generation
      const productType = productSlug as 'card' | 'postcard' | 'invitation' | 'announcement' | 'print';
      const sizeId = selectedVariant.size;
      // Use editor orientation state (can be toggled by user)
      const orientation: 'portrait' | 'landscape' = editorOrientation;
      // Get fold option (bifold or flat) - default to bifold for cards
      const foldOption = (selectedVariant.fold === 'flat' ? 'flat' : 'bifold') as 'bifold' | 'flat';
      
      try {
        const dynamicSpec = generatePrintSpecForSize(productType, sizeId, orientation, foldOption);
        console.log('[ProjectEditor] Generated dynamic spec:', {
          id: dynamicSpec.id,
          folded: dynamicSpec.folded,
          foldOption,
          frontFoldLines: dynamicSpec.sides.find(s => s.id === 'front')?.foldLines?.length || 0,
          insideFoldLines: dynamicSpec.sides.find(s => s.id === 'inside')?.foldLines?.length || 0,
        });
        return { spec: dynamicSpec };
      } catch (e) {
        console.error('[ProjectEditor] Failed to generate dynamic spec:', e);
        // Fall through to legacy resolution
      }
    }
    
    // Priority 3: Legacy fallback: gelatoVariantUid > printSpecId > productSlug
    if (gelatoVariantUid) {
      return getPrintSpecForProduct(productSlug || 'unknown', undefined, gelatoVariantUid);
    }
    if (printSpecId) {
      return getPrintSpecForProduct(printSpecId);
    }
    if (productSlug) {
      return getPrintSpecForProduct(productSlug);
    }
    return { spec: undefined, error: 'No print specification available.' };
  }, [gelatoPrintSpec, selectedVariant?.size, selectedVariant?.fold, editorOrientation, productSlug, gelatoVariantUid, printSpecId]);

  const printSpec = printSpecResult.spec;
  const printSpecError = printSpecResult.error;

  // Initialize side states if not already initialized
  useEffect(() => {
    if (printSpec && Object.keys(sideStateById).length === 0) {
      const initialStates: Record<string, SideState> = {};
      printSpec.sides.forEach((side) => {
        initialStates[side.id] = {
          objects: [],
          selectedId: undefined,
          template: undefined,
        };
      });
      setSideStateById(initialStates);
      // Set active side to first side (ensure it matches a valid side)
      if (printSpec.sides.length > 0) {
        const firstSideId = printSpec.sides[0].id;
        setActiveSideId(firstSideId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printSpec]); // Only depend on printSpec, not sideStateById to avoid re-initialization

  // Ensure activeSideId matches a valid side in printSpec
  useEffect(() => {
    if (printSpec && printSpec.sides.length > 0) {
      const validSideIds = printSpec.sides.map(s => s.id);
      if (!validSideIds.includes(activeSideId)) {
        // activeSideId doesn't match any side, reset to first side
        setActiveSideId(printSpec.sides[0].id);
      }
    }
  }, [printSpec, activeSideId]);

  const currentSide: PrintSide | undefined = printSpec
    ? getPrintSide(printSpec, activeSideId as 'front' | 'inside' | 'back')
    : undefined;

  // Debug: Log fold lines
  useEffect(() => {
    if (currentSide && process.env.NODE_ENV === 'development') {
      console.log('[ProjectEditor] Current side:', {
        id: currentSide.id,
        foldLines: currentSide.foldLines,
        foldLinesLength: currentSide.foldLines?.length || 0,
        printSpec: printSpec?.id,
        folded: printSpec?.folded,
        selectedVariantFold: selectedVariant?.fold,
      });
    }
  }, [currentSide, printSpec, selectedVariant?.fold]);

  // Get current side's state
  const currentSideState = sideStateById[activeSideId] || { objects: [], selectedId: undefined, template: undefined };
  const objects = currentSideState.objects;
  const selectedId = currentSideState.selectedId;
  const selectedObject = selectedId ? objects.find(obj => obj.id === selectedId) : null;
  const templateState = currentSideState.template;

  // Debounced autosave function
  const scheduleAutosave = () => {
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    autosaveTimeoutRef.current = setTimeout(async () => {
      await performAutosave();
    }, 750);
  };

  // Perform autosave
  const performAutosave = async () => {
    if (!printSpec || !productSlug) return;

    try {
      // Get assets from store and convert to persisted format
      const currentAssets = assets;
      
      let persistedAssets: PersistedAsset[] = [];
      let assetsPartial = false;
      let totalBytes = 0;

      for (const asset of currentAssets) {
        // Skip if already a data URL (from restore) or if we can't persist it
        if (!asset.dataUrl) {
          // This asset wasn't converted to data URL (shouldn't happen, but handle gracefully)
          assetsPartial = true;
          continue;
        }

        const assetBytes = asset.bytesApprox || 0;
        
        // Check size cap
        if (totalBytes + assetBytes > DRAFT_ASSETS_SIZE_CAP) {
          assetsPartial = true;
          console.warn(`[ProjectEditor] Asset ${asset.name} exceeds size cap, skipping persistence`);
          continue;
        }

        persistedAssets.push({
          id: asset.id,
          name: asset.name,
          mimeType: asset.mimeType,
          width: asset.width,
          height: asset.height,
          dataUrl: asset.dataUrl,
          bytesApprox: assetBytes,
        });

        totalBytes += assetBytes;
      }

      const draftData: DraftData = {
        version: 1,
        productSlug,
        printSpecId: printSpec.id,
        activeSideId,
        includeGuides: includeGuidesInExport,
        guideVisibility: {
          showBleed,
          showTrim,
          showSafe,
          showFold,
          showQRTarget,
        },
        sideStateById: JSON.parse(JSON.stringify(sideStateById)), // Deep clone to remove refs
        persistedAssets,
        assetsPartial,
        gelatoVariantUid: gelatoVariantUid || undefined,
        selectedVariant: selectedVariant ? {
          uid: selectedVariant.uid,
          size: selectedVariant.size,
          material: selectedVariant.material,
          paper: selectedVariant.paper,
          frame: selectedVariant.frame,
          foil: selectedVariant.foil,
          price: selectedVariant.price,
        } : undefined,
        updatedAt: Date.now(),
      };

      const draftKey = getDraftKey(productSlug);
      await saveDraft(draftKey, draftData);

      // Update assetsPartial state if needed
      if (assetsPartial && persistedAssets.length < currentAssets.length) {
        setAssetsPartial(true);
        console.warn('[ProjectEditor] Some assets were too large to persist locally');
      } else {
        setAssetsPartial(false);
      }
    } catch (error) {
      console.warn('[ProjectEditor] Autosave failed:', error);
      // Fail gracefully - editor continues to work
    }
  };

  // Load draft on mount
  useEffect(() => {
    const loadDraftOnMount = async () => {
      if (!productSlug) return;

      try {
        const draftKey = getDraftKey(productSlug);
        const draft = await loadDraft(draftKey);
        
        if (draft) {
          setDraftFound(true);
          setShowDraftBanner(true);
          setAssetsPartial(draft.assetsPartial || false);
          setRestoredGelatoVariantUid(draft.gelatoVariantUid || null);
          setRestoredSelectedVariant(draft.selectedVariant || null);
        }
      } catch (error) {
        console.warn('[ProjectEditor] Failed to check for draft:', error);
        // Fail gracefully - editor continues to work
      }
    };

    loadDraftOnMount();
  }, [productSlug]);

  // Restore draft
  const handleRestoreDraft = async () => {
    if (!productSlug) return;

    try {
      const draftKey = getDraftKey(productSlug);
      const draft = await loadDraft(draftKey);
      
      if (draft && printSpec) {
        // Restore assets first (so they're available when state is restored)
        if (draft.persistedAssets && draft.persistedAssets.length > 0) {
          const { clearAssets, addAssetFromPersisted } = useAssetStore.getState();
          
          // Clear existing assets
          clearAssets();
          
          // Restore persisted assets
          draft.persistedAssets.forEach((persisted) => {
            addAssetFromPersisted(persisted);
          });
        }

        // Restore state
        setActiveSideId(draft.activeSideId);
        setIncludeGuidesInExport(draft.includeGuides);
        setShowBleed(draft.guideVisibility.showBleed);
        setShowTrim(draft.guideVisibility.showTrim);
        setShowSafe(draft.guideVisibility.showSafe);
        setShowFold(draft.guideVisibility.showFold);
        setShowQRTarget(draft.guideVisibility.showQRTarget);
        setSideStateById(draft.sideStateById);
        
        // Update assetsPartial state
        setAssetsPartial(draft.assetsPartial || false);
        
        // Restore Gelato variant data (for reference, not state - props come from parent)
        setRestoredGelatoVariantUid(draft.gelatoVariantUid || null);
        setRestoredSelectedVariant(draft.selectedVariant || null);
        
        setShowDraftBanner(false);
        console.log('[ProjectEditor] Draft restored', {
          gelatoVariantUid: draft.gelatoVariantUid,
          selectedVariant: draft.selectedVariant,
        });
      }
    } catch (error) {
      console.warn('[ProjectEditor] Failed to restore draft:', error);
      alert('Failed to restore draft. Please try again.');
    }
  };

  // Clear draft
  const handleClearDraft = async () => {
    if (!productSlug) return;

    try {
      const draftKey = getDraftKey(productSlug);
      await deleteDraft(draftKey);
      
      // Reset editor state
      if (printSpec) {
        const initialStates: Record<string, SideState> = {};
        printSpec.sides.forEach((side) => {
          initialStates[side.id] = {
            objects: [],
            selectedId: undefined,
            template: undefined,
          };
        });
        setSideStateById(initialStates);
        setActiveSideId(printSpec.sides[0]?.id || 'front');
      }
      
      setShowDraftBanner(false);
      setDraftFound(false);
      console.log('[ProjectEditor] Draft cleared');
    } catch (error) {
      console.warn('[ProjectEditor] Failed to clear draft:', error);
      alert('Failed to clear draft. Please try again.');
    }
  };

  // Check if restored variant matches current props (dev mode warning only)
  const hasVariantMismatch = process.env.NODE_ENV === 'development' && 
    restoredGelatoVariantUid && 
    gelatoVariantUid && 
    restoredGelatoVariantUid !== gelatoVariantUid;

  // Stage dimensions from print spec
  const STAGE_WIDTH = currentSide?.canvasPx.w || 1800;
  const STAGE_HEIGHT = currentSide?.canvasPx.h || 2400;
  
  // Calculate display scale to fit viewport
  const [displayScale, setDisplayScale] = useState(0.5);
  
  useEffect(() => {
    if (!currentSide || typeof window === 'undefined') return;
    
    // Calculate available space (accounting for sidebar ~200px and padding)
    const sidebarWidth = 220;
    const padding = 64; // 32px on each side
    const availableWidth = window.innerWidth - sidebarWidth - padding;
    const availableHeight = window.innerHeight - 120; // Account for header and padding
    
    const scaleX = availableWidth / currentSide.canvasPx.w;
    const scaleY = availableHeight / currentSide.canvasPx.h;
    // Use the smaller scale to fit, but allow up to 1.0 for smaller canvases
    const scale = Math.min(scaleX, scaleY, 1.0);
    
    // Ensure minimum visibility
    setDisplayScale(Math.max(scale, 0.3));
  }, [currentSide]);

  // Update transformer when selection changes
  useEffect(() => {
    if (!transformerRef.current) return;

    const selectedNode = selectedId ? imageRefs.current[selectedId] : null;

    if (selectedNode) {
      // Use requestAnimationFrame for better timing
      const rafId = requestAnimationFrame(() => {
        if (transformerRef.current && selectedNode) {
          try {
            transformerRef.current.nodes([selectedNode]);
            transformerRef.current.getLayer()?.batchDraw();
            console.log('[ProjectEditor] Transformer attached to:', selectedId, 'Node type:', selectedNode.getType?.());
          } catch (error) {
            console.error('[ProjectEditor] Error attaching transformer:', error);
          }
        }
      });
      
      return () => cancelAnimationFrame(rafId);
    } else {
      transformerRef.current.nodes([]);
    }
  }, [selectedId, activeSideId, objects]); // Include objects to update when objects change

  // Handle keyboard delete
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        handleDeleteObject(selectedId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedId, activeSideId, objects, editorConfig]);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const objectUrl = URL.createObjectURL(file);
      
      // Load image to get dimensions
      const img = new window.Image();
      img.onload = () => {
        const asset: UploadedAsset = {
          id: `asset-${Date.now()}-${Math.random()}`,
          name: file.name,
          mimeType: file.type,
          width: img.naturalWidth,
          height: img.naturalHeight,
          src: objectUrl,
          origin: 'editor',
          objectUrl,
          file,
        };

        useAssetStore.getState().addAsset(asset);
      };
      img.src = objectUrl;
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle thumbnail click - add image to canvas
  const handleThumbnailClick = (asset: UploadedAsset) => {
    console.log('[ProjectEditor] Thumbnail clicked:', asset.id, asset.name);

    // Create a temporary image to get dimensions (use asset dimensions if available)
    if (typeof window === 'undefined') return;
    const img = new window.Image();

    // Set crossOrigin only for external URLs, not for blob: URLs
    if (!asset.src.startsWith('blob:') && !asset.src.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      // Use asset dimensions if available, otherwise use loaded image dimensions
      const imgWidth = asset.width || img.naturalWidth;
      const imgHeight = asset.height || img.naturalHeight;

      // Calculate scale to fit within SAFE zone (default) or TRIM zone
      // Use safe zone by default to ensure content is not cut off
      const safeAreaWidth = currentSide
        ? currentSide.canvasPx.w - currentSide.safePx * 2
        : STAGE_WIDTH * 0.9;
      const safeAreaHeight = currentSide
        ? currentSide.canvasPx.h - currentSide.safePx * 2
        : STAGE_HEIGHT * 0.9;
      
      const maxWidth = safeAreaWidth * 0.8; // 80% of safe area
      const maxHeight = safeAreaHeight * 0.8;
      const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);

      const scaledWidth = imgWidth * scale;
      const scaledHeight = imgHeight * scale;

      // Center in safe area
      const x = currentSide
        ? currentSide.safePx + (safeAreaWidth - scaledWidth) / 2
        : (STAGE_WIDTH - scaledWidth) / 2;
      const y = currentSide
        ? currentSide.safePx + (safeAreaHeight - scaledHeight) / 2
        : (STAGE_HEIGHT - scaledHeight) / 2;

      const newObject: EditorObject = {
        id: `img-${Date.now()}-${Math.random()}`,
        type: 'image',
        src: asset.src,
        x,
        y,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        width: scaledWidth, // Store original scaled dimensions
        height: scaledHeight,
      };

      console.log('[ProjectEditor] Adding image to canvas:', {
        id: newObject.id,
        assetId: asset.id,
        side: activeSideId,
        position: { x, y },
        size: { width: scaledWidth, height: scaledHeight },
      });

      // Add object to current side's state
      setSideStateById((prev) => {
        const newState = {
          ...prev,
          [activeSideId]: {
            ...prev[activeSideId] || { objects: [], selectedId: undefined, template: undefined },
            objects: [...(prev[activeSideId]?.objects || []), newObject],
            selectedId: newObject.id,
          },
        };
        scheduleAutosave();
        return newState;
      });
    };
    img.onerror = () => {
      console.error('[ProjectEditor] Failed to load image:', asset.src);
      alert(`Failed to load image: ${asset.name}`);
    };
    img.src = asset.src;
  };

  // Handle object drag end
  const handleDragEnd = (objectId: string, e: any) => {
    const node = e.target;
    setSideStateById((prev) => {
      const newState = {
        ...prev,
        [activeSideId]: {
          ...prev[activeSideId] || { objects: [], selectedId: undefined, template: undefined },
          objects: (prev[activeSideId]?.objects || []).map((obj) =>
            obj.id === objectId
              ? {
                  ...obj,
                  x: node.x(),
                  y: node.y(),
                }
              : obj
          ),
        },
      };
      scheduleAutosave();
      return newState;
    });
  };

  // Handle object transform end
  const handleTransformEnd = (objectId: string, e: any) => {
    const node = e.target;
    setSideStateById((prev) => {
      const currentObj = (prev[activeSideId]?.objects || []).find(obj => obj.id === objectId);
      if (!currentObj) return prev;

      // Get transform values from the node
      const newScaleX = node.scaleX();
      const newScaleY = node.scaleY();
      const newRotation = node.rotation();
      const newX = node.x();
      const newY = node.y();

      // For images and label shapes: apply scale to width/height, then reset scale to 1
      // For text: keep scale values for transformer to work
      const isImage = currentObj.type === 'image';
      const isLabelShape = currentObj.type === 'label-shape';
      
      let updatedObj: EditorObject;
      if ((isImage || isLabelShape) && currentObj.width && currentObj.height) {
        // Calculate new dimensions based on scale
        const newWidth = currentObj.width * newScaleX;
        const newHeight = currentObj.height * newScaleY;
        
        updatedObj = {
          ...currentObj,
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
          scaleX: 1, // Reset scale after applying to dimensions
          scaleY: 1,
          rotation: newRotation,
        };
        
        // Reset the node's scale to 1 immediately after updating state
        // Use requestAnimationFrame to ensure it happens after React state update
        requestAnimationFrame(() => {
          if (node && node.getLayer()) {
            node.scaleX(1);
            node.scaleY(1);
            node.getLayer()?.batchDraw();
          }
        });
      } else {
        // For text and other objects, keep scale values
        updatedObj = {
          ...currentObj,
          x: newX,
          y: newY,
          scaleX: newScaleX,
          scaleY: newScaleY,
          rotation: newRotation,
          // For text objects, update fontSize based on scale
          fontSize: currentObj.type === 'text' && currentObj.fontSize 
            ? currentObj.fontSize * newScaleX 
            : currentObj.fontSize,
        };
      }

      const newState = {
        ...prev,
        [activeSideId]: {
          ...prev[activeSideId] || { objects: [], selectedId: undefined, template: undefined },
          objects: (prev[activeSideId]?.objects || []).map((obj) =>
            obj.id === objectId ? updatedObj : obj
          ),
        },
      };
      scheduleAutosave();
      return newState;
    });
  };

  // Handle adding label shape
  const handleAddLabelShape = (shape: LabelShape) => {
    if (!currentSide) return;

    // Center the shape in the safe zone
    const safeAreaWidth = currentSide.canvasPx.w - currentSide.safePx * 2;
    const safeAreaHeight = currentSide.canvasPx.h - currentSide.safePx * 2;
    
    const x = currentSide.safePx + (safeAreaWidth - shape.width) / 2;
    const y = currentSide.safePx + (safeAreaHeight - shape.height) / 2;

    const newObject: EditorObject = {
      id: `label-${Date.now()}-${Math.random()}`,
      type: 'label-shape',
      text: 'Your text here',
      x,
      y,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      width: shape.width,
      height: shape.height,
      labelShapeId: shape.id,
      labelShapeType: shape.type,
      cornerRadius: shape.cornerRadius,
      fontFamily: DEFAULT_FONT,
      fontSize: 24,
      fontWeight: DEFAULT_FONT_WEIGHT,
      fill: '#000000',
      backgroundColor: '#ffffff',
      borderEnabled: true,
      borderStyle: 'solid',
      borderWidth: 2,
      borderColor: '#000000',
      borderPadding: 10,
    };

    setSideStateById((prev) => {
      const newState = {
        ...prev,
        [activeSideId]: {
          ...prev[activeSideId] || { objects: [], selectedId: undefined, template: undefined },
          objects: [...(prev[activeSideId]?.objects || []), newObject],
          selectedId: newObject.id,
        },
      };
      scheduleAutosave();
      return newState;
    });
  };

  // Handle object deletion
  const handleDeleteObject = (objectId: string) => {
    setSideStateById((prev) => {
      const newState = {
        ...prev,
        [activeSideId]: {
          ...prev[activeSideId] || { objects: [], selectedId: undefined, template: undefined },
          objects: (prev[activeSideId]?.objects || []).filter((obj) => obj.id !== objectId),
          selectedId: prev[activeSideId]?.selectedId === objectId ? undefined : prev[activeSideId]?.selectedId,
        },
      };
      scheduleAutosave();
      return newState;
    });
  };

  // Handle label inspector updates
  const handleLabelUpdate = (updates: Partial<EditorObject>) => {
    if (!selectedId) return;
    
    setSideStateById((prev) => {
      const newState = {
        ...prev,
        [activeSideId]: {
          ...prev[activeSideId] || { objects: [], selectedId: undefined, template: undefined },
          objects: (prev[activeSideId]?.objects || []).map((obj) =>
            obj.id === selectedId ? { ...obj, ...updates } : obj
          ),
        },
      };
      scheduleAutosave();
      return newState;
    });
  };

  // Add text label to canvas
  const handleAddTextLabel = () => {
    if (!currentSide) return;

    const centerX = currentSide.canvasPx.w / 2;
    const centerY = currentSide.canvasPx.h / 2;

    const newTextObject: EditorObject = {
      id: `text-${Date.now()}-${Math.random()}`,
      type: 'text',
      text: 'New Label',
      x: centerX,
      y: centerY,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      fontFamily: DEFAULT_FONT,
      fontSize: 24,
      fontWeight: DEFAULT_FONT_WEIGHT,
      fill: '#000000',
      // Apply foil from shop page selection if available
      ...(defaultFoilColor ? {
        foilEnabled: true,
        foilColor: defaultFoilColor,
        foilTarget: 'text', // Default to text, user can change
      } : {}),
    };

    setSideStateById((prev) => {
      const newState = {
        ...prev,
        [activeSideId]: {
          ...prev[activeSideId] || { objects: [], selectedId: undefined, template: undefined },
          objects: [...(prev[activeSideId]?.objects || []), newTextObject],
          selectedId: newTextObject.id,
        },
      };
      scheduleAutosave();
      return newState;
    });
  };

  // Add QR target to canvas (simple draggable target)
  const handleAddSkeletonKey = async (keyId: string) => {
    if (!currentSide) return;

    const keyDef = getSkeletonKey(keyId);
    if (!keyDef) return;

    // Convert SVG to data URL
    const svgBlob = new Blob([keyDef.svg], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    // Load SVG as image to get dimensions
    if (typeof window === 'undefined') return;
    const img = new window.Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = svgUrl;
    });

    // QR target size - make it a reasonable size (180x180px from SVG, scale to canvas)
    const targetSize = Math.min(currentSide.canvasPx.w, currentSide.canvasPx.h) * 0.25; // 25% of smaller dimension
    const scaledWidth = targetSize;
    const scaledHeight = targetSize;

    // Default position - bottom center, but user can drag it anywhere
    const x = (currentSide.canvasPx.w - scaledWidth) / 2;
    const y = currentSide.canvasPx.h - scaledHeight - currentSide.safePx;

    // Remove existing QR target on this side if any (only one per side)
    const existingKey = objects.find(obj => obj.type === 'skeletonKey');
    const filteredObjects = existingKey 
      ? objects.filter(obj => obj.id !== existingKey.id)
      : objects;
      
    // Clean up old object URL if exists
    if (existingKey && existingKey.src && existingKey.src.startsWith('blob:')) {
      URL.revokeObjectURL(existingKey.src);
    }

    const newSkeletonKey: EditorObject = {
      id: `qr-target-${Date.now()}-${Math.random()}`,
      type: 'skeletonKey',
      keyId: keyId,
      src: svgUrl,
      x: Math.max(currentSide.safePx, Math.min(x, currentSide.canvasPx.w - scaledWidth - currentSide.safePx)),
      y: Math.max(currentSide.safePx, Math.min(y, currentSide.canvasPx.h - scaledHeight - currentSide.safePx)),
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      width: scaledWidth,
      height: scaledHeight,
      opacity: 0.5, // Semi-transparent so it's clear it's a guide
      locked: false, // Allow dragging
    };

    setSideStateById((prev) => {
      const newState = {
        ...prev,
        [activeSideId]: {
          ...prev[activeSideId] || { objects: [], selectedId: undefined, template: undefined },
          objects: [...filteredObjects, newSkeletonKey],
          selectedId: newSkeletonKey.id,
        },
      };
      scheduleAutosave();
      return newState;
    });
  };

  // Add QR code to canvas - places it at the QR target's position
  const handleAddQR = async () => {
    if (!printSpec) return;

    // Check if QR already exists on active side
    const existingQR = objects.find(obj => obj.type === 'qr' && obj.sideId === activeSideId);
    
    // Determine target side (default to active side, or switch to default if no QR exists anywhere)
    let targetSideId = activeSideId;
    
    // If no QR exists on any allowed side, switch to default side
    if (!existingQR) {
      const qrOnAnyAllowedSide = editorConfig.allowedSidesForQR.some(sideId => {
        const sideState = sideStateById[sideId] || { objects: [], selectedId: undefined };
        return sideState.objects.some(obj => obj.type === 'qr' && obj.sideId === sideId);
      });

      if (!qrOnAnyAllowedSide) {
        // Switch to default QR side
        const defaultSide = getDefaultQrSide();
        if (defaultSide !== activeSideId) {
          targetSideId = defaultSide;
          handleSideSwitch(defaultSide);
          // Wait for side switch to complete (React state update)
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }

    // Get current side (use targetSideId to avoid race condition)
    const targetSide = printSpec.sides.find(s => s.id === targetSideId);
    if (!targetSide) return;
    
    // Get objects for the target side (after potential switch)
    const targetSideObjects = sideStateById[targetSideId]?.objects || [];

    const qrUrl = getDefaultArtKeyUrl(editorConfig.artKeyUrlPlaceholder);
    let qrSize = 100; // Default QR size in pixels
    
    try {
      // Find QR target (skeleton key) to get position
      const qrTarget = targetSideObjects.find(obj => obj.type === 'skeletonKey');
      let qrX = targetSide.canvasPx.w / 2;
      let qrY = targetSide.canvasPx.h / 2;

      if (qrTarget) {
        // Place QR at the target's position (center of target)
        const targetWidth = (qrTarget.width || 180) * qrTarget.scaleX;
        const targetHeight = (qrTarget.height || 180) * qrTarget.scaleY;
        
        // Center QR in the target area
        qrX = qrTarget.x + (targetWidth / 2);
        qrY = qrTarget.y + (targetHeight / 2);
        
        // Size QR to fit within target (90% of smaller dimension)
        qrSize = Math.min(targetWidth, targetHeight) * 0.9;
        
        // Adjust position to center QR (QR is positioned by top-left corner)
        qrX = qrX - (qrSize / 2);
        qrY = qrY - (qrSize / 2);
      } else {
        // No target found - use default center position
        qrX = (targetSide.canvasPx.w / 2) - (qrSize / 2);
        qrY = (targetSide.canvasPx.h / 2) - (qrSize / 2);
      }

      const qrDataUrl = await generateQRCode(qrUrl, qrSize, 4);

      // Remove existing QR on this side if any (regenerating)
      const existingQROnSide = targetSideObjects.find(obj => obj.type === 'qr' && obj.sideId === targetSideId);
      const filteredObjects = existingQROnSide
        ? targetSideObjects.filter(obj => obj.id !== existingQROnSide.id)
        : targetSideObjects;

      const newQR: EditorObject = {
        id: `qr-${Date.now()}-${Math.random()}`,
        type: 'qr',
        sideId: targetSideId as 'front' | 'inside' | 'back',
        url: qrUrl,
        src: qrDataUrl,
        x: qrX,
        y: qrY,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        size: qrSize,
        locked: editorConfig.qrRequired && editorConfig.qrPlacementMode === 'fixed',
      };

      setSideStateById((prev) => {
        const newState = {
          ...prev,
          [targetSideId]: {
            ...prev[targetSideId] || { objects: [], selectedId: undefined, template: undefined },
            objects: [...filteredObjects, newQR],
            selectedId: newQR.id,
          },
        };
        scheduleAutosave();
        return newState;
      });
    } catch (error) {
      console.error('[ProjectEditor] Failed to generate QR code:', error);
      alert('Failed to generate QR code. Please try again.');
    }
  };

  // Snap QR to QR target position
  const handleSnapQRToTarget = () => {
    if (!currentSide) return;

    const qrTarget = objects.find(obj => obj.type === 'skeletonKey');
    const qr = objects.find(obj => obj.type === 'qr' && obj.sideId === activeSideId);
    
    if (!qrTarget || !qr) return;

    // Calculate target position (center of target)
    const targetWidth = (qrTarget.width || 180) * qrTarget.scaleX;
    const targetHeight = (qrTarget.height || 180) * qrTarget.scaleY;
    
    // Center QR in the target area
    const targetCenterX = qrTarget.x + (targetWidth / 2);
    const targetCenterY = qrTarget.y + (targetHeight / 2);
    
    // Size QR to fit within target (90% of smaller dimension)
    const targetSize = Math.min(targetWidth, targetHeight) * 0.9;
    
    // Adjust position to center QR (QR is positioned by top-left corner)
    const newX = targetCenterX - (targetSize / 2);
    const newY = targetCenterY - (targetSize / 2);

    setSideStateById((prev) => {
      const newState = {
        ...prev,
        [activeSideId]: {
          ...prev[activeSideId] || { objects: [], selectedId: undefined, template: undefined },
          objects: (prev[activeSideId]?.objects || []).map((obj) =>
            obj.id === qr.id
              ? { ...obj, x: newX, y: newY, size: targetSize, scaleX: 1, scaleY: 1 }
              : obj
          ),
        },
      };
      scheduleAutosave();
      return newState;
    });
  };

  // Template handlers
  const handleSelectTemplate = (templateId: string) => {
    const template = getCollageTemplate(templateId);
    if (!template || !currentSide) return;

    const frames: FrameFillState[] = template.frames.map(frame => ({
      frameId: frame.id,
      assetSrc: undefined,
      offsetX: 0,
      offsetY: 0,
      zoom: 1.0,
      rotation: 0,
    }));

    setSideStateById((prev) => ({
      ...prev,
      [activeSideId]: {
        ...prev[activeSideId] || { objects: [], selectedId: undefined, template: undefined },
        template: {
          templateId,
          activeFrameId: frames[0]?.frameId,
          frames,
        },
      },
    }));
  };

  const handleClearTemplate = () => {
    setSideStateById((prev) => {
      const newState = {
        ...prev,
        [activeSideId]: {
          ...prev[activeSideId] || { objects: [], selectedId: undefined, template: undefined },
          template: undefined,
        },
      };
      scheduleAutosave();
      return newState;
    });
  };

  const handleSelectFrame = (frameId: string) => {
    if (!templateState) return;

    setSideStateById((prev) => {
      const newState = {
        ...prev,
        [activeSideId]: {
          ...prev[activeSideId] || { objects: [], selectedId: undefined, template: undefined },
          template: {
            ...templateState,
            activeFrameId: frameId,
          },
        },
      };
      scheduleAutosave();
      return newState;
    });
  };

  const handleFillFrame = (assetSrc: string) => {
    if (!templateState?.activeFrameId) return;
    handleThumbnailClick({ id: '', name: '', mimeType: '', width: 0, height: 0, src: assetSrc, origin: 'uploader' });
  };

  const onUpdateFrameFill = (frameId: string, updates: Partial<FrameFillState>) => {
    if (!templateState) return;

    setSideStateById((prev) => {
      const newState = {
        ...prev,
        [activeSideId]: {
          ...prev[activeSideId] || { objects: [], selectedId: undefined, template: undefined },
          template: {
            ...templateState,
            frames: templateState.frames.map(f =>
              f.frameId === frameId ? { ...f, ...updates } : f
            ),
          },
        },
      };
      scheduleAutosave();
      return newState;
    });
  };

  // Handle side switch
  const handleSideSwitch = (sideId: string) => {
    // Clear selection on current side before switching
    setSideStateById((prev) => ({
      ...prev,
      [activeSideId]: {
        ...prev[activeSideId] || { objects: [], selectedId: undefined, template: undefined },
        selectedId: undefined,
      },
    }));
    
    // Switch to new side
    setActiveSideId(sideId);
    
    // Ensure new side has state
    setSideStateById((prev) => ({
      ...prev,
      [sideId]: prev[sideId] || { objects: [], selectedId: undefined, template: undefined },
    }));
  };

  // Export single side (must be called when that side is active)
  const exportCurrentSide = async (): Promise<{ 
    sideId: string; 
    dataUrl: string; 
    blob: Blob;
    width: number;
    height: number;
  } | null> => {
    if (!stageRef.current || !currentSide) return null;

    try {
      const stage = stageRef.current.getStage();
      const layer = stage.getLayers()[0];
      
      // Temporarily hide guides and QR targets if not including in export
      const guideObjects: any[] = [];
      const qrTargetObjects: any[] = [];
      if (layer) {
        const allNodes = layer.getChildren();
        allNodes.forEach((node: any) => {
          // Hide guides if not including in export
          if (!includeGuidesInExport && node.name() === 'guide-overlay') {
            node.visible(false);
            guideObjects.push(node);
          }
          // Always hide QR targets during export (they're just placeholders, not part of final design)
          const nodeId = node.id?.() || node.attrs?.id;
          if (nodeId && objects.find(obj => obj.id === nodeId && obj.type === 'skeletonKey')) {
            node.visible(false);
            qrTargetObjects.push(node);
          }
        });
        layer.draw();
      }

      const dataUrl = stage.toDataURL({
        pixelRatio: 1,
        width: currentSide.canvasPx.w,
        height: currentSide.canvasPx.h,
      });

      // Restore guide and QR target visibility
      if (layer) {
        guideObjects.forEach((node) => {
          node.visible(true);
        });
        qrTargetObjects.forEach((node) => {
          node.visible(true);
        });
        layer.draw();
      }

      const response = await fetch(dataUrl);
      const blob = await response.blob();

      return {
        sideId: activeSideId,
        dataUrl,
        blob,
        width: currentSide.canvasPx.w,
        height: currentSide.canvasPx.h,
      };
    } catch (error) {
      console.error(`[ProjectEditor] Export error for side ${activeSideId}:`, error);
      return null;
    }
  };

  // Get default QR side (inside > back > front > first side)
  const getDefaultQrSide = (): string => {
    if (!printSpec) return 'front';
    
    if (editorConfig.allowedSidesForQR.includes('inside')) {
      return 'inside';
    }
    if (editorConfig.allowedSidesForQR.includes('back')) {
      return 'back';
    }
    if (editorConfig.allowedSidesForQR.includes('front')) {
      return 'front';
    }
    
    // Fallback to first side in printSpec
    return printSpec.sides[0]?.id || 'front';
  };

  // Check if QR is required and missing (QR must exist on AT LEAST ONE allowed side)
  const checkQRRequired = (): { isValid: boolean; missingSides: string[] } => {
    if (!editorConfig.qrRequired || !printSpec) {
      return { isValid: true, missingSides: [] };
    }

    // Check if QR exists on ANY allowed side
    let hasQROnAnyAllowedSide = false;
    const allowedSides = editorConfig.allowedSidesForQR;
    
    for (const sideId of allowedSides) {
      const sideState = sideStateById[sideId] || { objects: [], selectedId: undefined };
      const hasQR = sideState.objects.some(obj => obj.type === 'qr' && obj.sideId === sideId);
      if (hasQR) {
        hasQROnAnyAllowedSide = true;
        break; // Found QR on at least one allowed side, that's enough
      }
    }

    if (hasQROnAnyAllowedSide) {
      return { isValid: true, missingSides: [] };
    }

    // QR is missing on all allowed sides
    return { isValid: false, missingSides: allowedSides };
  };

  // Export active side
  const handleExportActiveSide = async () => {
    if (printSpecError || !printSpec) {
      alert(printSpecError || 'Print spec not available');
      return;
    }

    // Check QR requirement
    const qrCheck = checkQRRequired();
    if (!qrCheck.isValid) {
      const sideNames = qrCheck.missingSides.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ');
      alert(`ArtKey QR is required on at least one of: ${sideNames} before exporting.`);
      return;
    }

    const result = await exportCurrentSide();
    if (result) {
      if (onComplete) {
        onComplete({
          productSlug,
          printSpecId: printSpec.id,
          exports: [{
            sideId: result.sideId,
            dataUrl: result.dataUrl,
            width: result.width,
            height: result.height,
          }],
        });
      } else {
        // Fallback: download directly
        if (typeof document !== 'undefined') {
          const link = document.createElement('a');
          link.download = `${productSlug || printSpec.id}_${result.sideId}_${Date.now()}.png`;
          link.href = result.dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
      console.log('[ProjectEditor] Export complete:', {
        sideId: result.sideId,
        dimensions: { width: result.width, height: result.height },
        includesGuides: includeGuidesInExport,
      });
    } else {
      alert('Failed to export image');
    }
  };

  // Export all sides
  const handleExportAllSides = async () => {
    if (printSpecError || !printSpec) {
      alert(printSpecError || 'No print spec available');
      return;
    }

    // Check QR requirement
    const qrCheck = checkQRRequired();
    if (!qrCheck.isValid) {
      const sideNames = qrCheck.missingSides.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ');
      alert(`ArtKey QR is required on at least one of: ${sideNames} before exporting.`);
      return;
    }

    const exports: Array<{ sideId: string; dataUrl: string; width: number; height: number }> = [];
    const originalActiveSide = activeSideId;
    
    // Export each side by switching to it
    for (const side of printSpec.sides) {
      // Switch to this side
      setActiveSideId(side.id);
      
      // Wait for render to complete
      await new Promise((resolve) => setTimeout(resolve, 200));
      
      // Export current side
      const result = await exportCurrentSide();
      if (result) {
        exports.push({
          sideId: result.sideId,
          dataUrl: result.dataUrl,
          width: result.width,
          height: result.height,
        });
      }
    }

    // Restore original active side
    setActiveSideId(originalActiveSide);
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (exports.length > 0) {
      if (onComplete) {
        onComplete({
          productSlug,
          printSpecId: printSpec.id,
          exports,
        });
      } else {
        // Fallback: download all
        if (typeof document !== 'undefined') {
          exports.forEach((exportItem) => {
            const link = document.createElement('a');
            link.download = `${productSlug || printSpec.id}_${exportItem.sideId}_${Date.now()}.png`;
            // Convert dataUrl to blob for download
            fetch(exportItem.dataUrl).then(res => res.blob()).then(blob => {
              const url = URL.createObjectURL(blob);
              link.href = url;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            });
          });
        }
      }
      console.log('[ProjectEditor] Export all sides complete:', {
        sides: exports.map((e) => e.sideId),
        includesGuides: includeGuidesInExport,
      });
    } else {
      alert('Failed to export images');
    }
  };

  // Text Component with Border and Foil support
  const TextComponent = ({ object }: { object: EditorObject }) => {
    const groupRef = useRef<any>(null);
    const textRef = useRef<any>(null);
    const [textWidth, setTextWidth] = useState(0);
    const [textHeight, setTextHeight] = useState(0);

    useEffect(() => {
      if (groupRef.current) {
        imageRefs.current[object.id] = groupRef.current;
      }
    }, [object.id]);

    // Separate effect to update transformer when this text is selected
    useEffect(() => {
      if (selectedId === object.id && groupRef.current && transformerRef.current) {
        // Use requestAnimationFrame for better timing
        const rafId = requestAnimationFrame(() => {
          if (transformerRef.current && groupRef.current) {
            try {
              transformerRef.current.nodes([groupRef.current]);
              transformerRef.current.getLayer()?.batchDraw();
              console.log('[ProjectEditor] Transformer attached to text:', object.id);
            } catch (error) {
              console.error('[ProjectEditor] Error attaching transformer:', error);
            }
          }
        });
        return () => cancelAnimationFrame(rafId);
      } else if (selectedId !== object.id && transformerRef.current) {
        // Clear transformer if this text is deselected
        transformerRef.current.nodes([]);
      }
    }, [selectedId, object.id]);

    // Measure text dimensions for border
    useEffect(() => {
      if (textRef.current) {
        setTextWidth(textRef.current.width());
        setTextHeight(textRef.current.height());
      }
    }, [object.text, object.fontSize, object.fontFamily]);

    const padding = object.borderPadding || 10;
    const borderWidth = object.borderWidth || 2;
    const hasBorder = object.borderEnabled;
    const hasFoil = object.foilEnabled;
    const isLabelShape = object.type === 'label-shape';
    const labelShape = isLabelShape && object.labelShapeId ? LABEL_SHAPES.find(s => s.id === object.labelShapeId) : null;
    
    // Get foil color for visual preview
    const getFoilPreviewColor = () => {
      switch (object.foilColor) {
        case 'gold': return '#D4AF37';
        case 'silver': return '#C0C0C0';
        case 'rose-gold': return '#E8B4B8';
        case 'copper': return '#B87333';
        default: return '#D4AF37';
      }
    };

    // Determine fill color based on foil settings
    const textFill = hasFoil && (object.foilTarget === 'text' || object.foilTarget === 'both')
      ? getFoilPreviewColor()
      : (object.fill || '#000000');
    
    const borderStroke = hasFoil && (object.foilTarget === 'border' || object.foilTarget === 'both')
      ? getFoilPreviewColor()
      : (object.borderColor || '#000000');
    
    // For label shapes, use the shape's dimensions
    const shapeWidth = isLabelShape && object.width ? object.width : textWidth + padding * 2;
    const shapeHeight = isLabelShape && object.height ? object.height : textHeight + padding * 2;
    const cornerRadius = isLabelShape ? (object.cornerRadius || labelShape?.cornerRadius || 0) : 0;
    const backgroundColor = object.backgroundColor || '#ffffff';

    return (
      <Group
        ref={groupRef}
        id={object.id}
        x={object.x}
        y={object.y}
        rotation={object.rotation || 0}
        scaleX={object.scaleX || 1}
        scaleY={object.scaleY || 1}
        draggable
        onClick={(e) => {
          e.cancelBubble = true;
          setSideStateById((prev) => ({
            ...prev,
            [activeSideId]: {
              ...prev[activeSideId] || { objects: [], selectedId: undefined },
              selectedId: object.id,
            },
          }));
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          setSideStateById((prev) => ({
            ...prev,
            [activeSideId]: {
              ...prev[activeSideId] || { objects: [], selectedId: undefined },
              selectedId: object.id,
            },
          }));
        }}
        onDragEnd={(e) => {
          const node = e.target;
          setSideStateById((prev) => {
            const newState = {
              ...prev,
              [activeSideId]: {
                ...prev[activeSideId] || { objects: [], selectedId: undefined },
                objects: (prev[activeSideId]?.objects || []).map((obj) =>
                  obj.id === object.id
                    ? {
                        ...obj,
                        x: node.x(),
                        y: node.y(),
                      }
                    : obj
                ),
              },
            };
            scheduleAutosave();
            return newState;
          });
        }}
        onTransformEnd={(e) => handleTransformEnd(object.id, e)}
      >
        {/* Background shape for label shapes */}
        {isLabelShape && (() => {
          const shapeType = object.labelShapeType || 'rectangle';
          const centerX = shapeWidth / 2;
          const centerY = shapeHeight / 2;
          const radiusX = shapeWidth / 2;
          const radiusY = shapeHeight / 2;
          
          // Circle or Oval - use Ellipse
          if (shapeType === 'circle' || shapeType === 'oval') {
            return (
              <Ellipse
                x={centerX}
                y={centerY}
                radiusX={radiusX}
                radiusY={radiusY}
                fill={backgroundColor}
                stroke={hasBorder ? borderStroke : undefined}
                strokeWidth={hasBorder ? borderWidth : 0}
                dash={hasBorder && object.borderStyle === 'dashed' ? [8, 4] : undefined}
              />
            );
          }
          
          // Rectangle, Rounded Rectangle, Speech Bubble, Ribbon - use Rect
          return (
            <Rect
              x={0}
              y={0}
              width={shapeWidth}
              height={shapeHeight}
              fill={backgroundColor}
              cornerRadius={cornerRadius}
              stroke={hasBorder ? borderStroke : undefined}
              strokeWidth={hasBorder ? borderWidth : 0}
              dash={hasBorder && object.borderStyle === 'dashed' ? [8, 4] : undefined}
            />
          );
        })()}
        
        {/* Border Rectangle (behind text) - for regular text labels */}
        {!isLabelShape && hasBorder && (
          <Rect
            x={-padding}
            y={-padding}
            width={textWidth + padding * 2}
            height={textHeight + padding * 2}
            stroke={borderStroke}
            strokeWidth={borderWidth}
            dash={object.borderStyle === 'dashed' ? [8, 4] : undefined}
            fill={object.backgroundColor || 'transparent'}
            cornerRadius={object.borderStyle === 'ornate' ? 8 : 0}
          />
        )}
        {/* Double border inner line */}
        {hasBorder && object.borderStyle === 'double' && (
          <Rect
            x={-padding + borderWidth + 3}
            y={-padding + borderWidth + 3}
            width={textWidth + (padding - borderWidth - 3) * 2}
            height={textHeight + (padding - borderWidth - 3) * 2}
            stroke={borderStroke}
            strokeWidth={borderWidth}
          />
        )}
        {/* Foil indicator shimmer effect */}
        {hasFoil && (
          <Rect
            x={-padding - 2}
            y={-padding - 2}
            width={textWidth + padding * 2 + 4}
            height={textHeight + padding * 2 + 4}
            stroke={getFoilPreviewColor()}
            strokeWidth={1}
            dash={[4, 4]}
            opacity={0.6}
          />
        )}
        {/* Text */}
        <KonvaText
          ref={textRef}
          x={isLabelShape ? shapeWidth / 2 : 0}
          y={isLabelShape ? shapeHeight / 2 : 0}
          text={object.text || 'Text'}
          fontSize={object.fontSize || 24}
          fontFamily={object.fontFamily || 'Arial'}
          fontStyle={object.fontWeight === 700 ? 'bold' : 'normal'}
          fill={textFill}
          align="center"
          verticalAlign="middle"
          width={isLabelShape ? shapeWidth : undefined}
          height={isLabelShape ? shapeHeight : undefined}
          offsetX={isLabelShape ? shapeWidth / 2 : 0}
          offsetY={isLabelShape ? shapeHeight / 2 : 0}
          listening={false}
        />
      </Group>
    );
  };

  // Image Component
  const ImageComponent = ({ object }: { object: EditorObject }) => {
    if (!object.src) return null;
    
    // Only set crossOrigin for external URLs, not for blob: or data: URLs
    const crossOrigin = object.src.startsWith('blob:') || object.src.startsWith('data:')
      ? undefined
      : 'anonymous';
    const [img, status] = useImage(object.src, crossOrigin);
    const imageRef = useRef<any>(null);

    const groupRef = useRef<any>(null);
    
    useEffect(() => {
      if (groupRef.current) {
        imageRefs.current[object.id] = groupRef.current;
      }
      return () => {
        delete imageRefs.current[object.id];
      };
    }, [object.id]);
    
    // Separate effect to update transformer when this image is selected
    useEffect(() => {
      if (selectedId === object.id && groupRef.current && transformerRef.current) {
        // Force transformer to attach to this group - use requestAnimationFrame for better timing
        const rafId = requestAnimationFrame(() => {
          if (transformerRef.current && groupRef.current) {
            try {
              transformerRef.current.nodes([groupRef.current]);
              transformerRef.current.getLayer()?.batchDraw();
              console.log('[ProjectEditor] Transformer attached to image:', object.id);
            } catch (error) {
              console.error('[ProjectEditor] Error attaching transformer:', error);
            }
          }
        });
        return () => cancelAnimationFrame(rafId);
      } else if (selectedId !== object.id && transformerRef.current) {
        // Clear transformer if this image is deselected
        transformerRef.current.nodes([]);
      }
    }, [selectedId, object.id]);

    // Calculate display dimensions from stored width/height and current scale
    // width/height already contain the scaled size, scaleX/Y is for additional transforms
    const displayWidth = object.width || 100;
    const displayHeight = object.height || 100;

    if (status === 'loading') {
      return (
        <KonvaImage
          ref={imageRef}
          x={object.x}
          y={object.y}
          width={displayWidth}
          height={displayHeight}
          fill="#e5e7eb"
          opacity={0.5}
        />
      );
    }

    if (status === 'failed' || !img) {
      return (
        <KonvaImage
          ref={imageRef}
          x={object.x}
          y={object.y}
          width={displayWidth}
          height={displayHeight}
          fill="#fee2e2"
          opacity={0.5}
        />
      );
    }

    return (
      <Group
        ref={groupRef}
        x={object.x}
        y={object.y}
        scaleX={object.scaleX || 1}
        scaleY={object.scaleY || 1}
        rotation={object.rotation || 0}
        draggable
        onClick={(e) => {
          e.cancelBubble = true;
          console.log('[ProjectEditor] Image clicked:', object.id);
          setSideStateById((prev) => ({
            ...prev,
            [activeSideId]: {
              ...prev[activeSideId] || { objects: [], selectedId: undefined },
              selectedId: object.id,
            },
          }));
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          setSideStateById((prev) => ({
            ...prev,
            [activeSideId]: {
              ...prev[activeSideId] || { objects: [], selectedId: undefined },
              selectedId: object.id,
            },
          }));
        }}
        onDragEnd={(e) => {
          const node = e.target;
          setSideStateById((prev) => {
            const newState = {
              ...prev,
              [activeSideId]: {
                ...prev[activeSideId] || { objects: [], selectedId: undefined },
                objects: (prev[activeSideId]?.objects || []).map((obj) =>
                  obj.id === object.id
                    ? {
                        ...obj,
                        x: node.x(),
                        y: node.y(),
                      }
                    : obj
                ),
              },
            };
            scheduleAutosave();
            return newState;
          });
        }}
        onTransformEnd={(e) => handleTransformEnd(object.id, e)}
      >
        <KonvaImage
          ref={imageRef}
          image={img}
          x={0}
          y={0}
          width={displayWidth}
          height={displayHeight}
        />
        {/* Red X delete button in top-right corner */}
        <Group
          x={displayWidth - 20}
          y={0}
          onClick={(e) => {
            e.cancelBubble = true;
            handleDeleteObject(object.id);
          }}
          onTap={(e) => {
            e.cancelBubble = true;
            handleDeleteObject(object.id);
          }}
        >
          <Circle
            x={10}
            y={10}
            radius={10}
            fill="#ef4444"
            opacity={0.9}
          />
          <Line
            points={[5, 5, 15, 15]}
            stroke="#ffffff"
            strokeWidth={2}
            lineCap="round"
          />
          <Line
            points={[15, 5, 5, 15]}
            stroke="#ffffff"
            strokeWidth={2}
            lineCap="round"
          />
        </Group>
      </Group>
    );
  };

  // QR Target Component (formerly Skeleton Key - now just a draggable QR target guide)
  const SkeletonKeyComponent = ({ object }: { object: EditorObject }) => {
    const keyRef = useRef<any>(null);
    const keyDef = object.keyId ? getSkeletonKey(object.keyId) : null;

    useEffect(() => {
      if (keyRef.current) {
        imageRefs.current[object.id] = keyRef.current;
      }
      return () => {
        delete imageRefs.current[object.id];
      };
    }, [object.id]);

    if (!keyDef || !object.src) return null;

    // Convert SVG to image
    const [img, status] = useImage(object.src);

    if (status === 'loading' || !img) {
      return null;
    }

    // Calculate display dimensions
    const displayWidth = object.width || 180;
    const displayHeight = object.height || 180;

    return (
      <KonvaImage
        ref={keyRef}
        image={img}
        x={object.x}
        y={object.y}
        width={displayWidth}
        height={displayHeight}
        scaleX={object.scaleX}
        scaleY={object.scaleY}
        rotation={object.rotation}
        opacity={object.opacity ?? 0.5}
        draggable={!object.locked}
        dragBoundFunc={(pos) => {
          // Constrain to safe zone
          if (currentSide) {
            const safeLeft = currentSide.safePx;
            const safeTop = currentSide.safePx;
            const safeRight = currentSide.canvasPx.w - currentSide.safePx - displayWidth;
            const safeBottom = currentSide.canvasPx.h - currentSide.safePx - displayHeight;
            
            return {
              x: Math.max(safeLeft, Math.min(pos.x, safeRight)),
              y: Math.max(safeTop, Math.min(pos.y, safeBottom)),
            };
          }
          return pos;
        }}
        onClick={() => {
          setSideStateById((prev) => ({
            ...prev,
            [activeSideId]: {
              ...prev[activeSideId] || { objects: [], selectedId: undefined },
              selectedId: object.id,
            },
          }));
        }}
        onTap={() => {
          setSideStateById((prev) => ({
            ...prev,
            [activeSideId]: {
              ...prev[activeSideId] || { objects: [], selectedId: undefined },
              selectedId: object.id,
            },
          }));
        }}
        onDragEnd={(e) => handleDragEnd(object.id, e)}
        onTransformEnd={(e) => handleTransformEnd(object.id, e)}
      />
    );
  };

  // Template Frame Component
  const FrameComponent = ({ frameDef, frameFill, isActive }: { 
    frameDef: any; 
    frameFill: FrameFillState; 
    isActive: boolean;
  }) => {
    if (!currentSide) return null;

    // Calculate frame position and size relative to safe zone
    const safeWidth = currentSide.canvasPx.w - (currentSide.safePx * 2);
    const safeHeight = currentSide.canvasPx.h - (currentSide.safePx * 2);
    const frameX = currentSide.safePx + (safeWidth * frameDef.xPct);
    const frameY = currentSide.safePx + (safeHeight * frameDef.yPct);
    const frameWidth = safeWidth * frameDef.wPct;
    const frameHeight = safeHeight * frameDef.hPct;
    const padding = frameDef.paddingPct ? Math.min(frameWidth, frameHeight) * frameDef.paddingPct : 0;
    const contentX = frameX + padding;
    const contentY = frameY + padding;
    const contentWidth = frameWidth - (padding * 2);
    const contentHeight = frameHeight - (padding * 2);

    // Polaroid: add bottom margin
    const isPolaroid = frameDef.shape === 'polaroid';
    const polaroidBottomMargin = isPolaroid ? frameHeight * 0.15 : 0;
    const imageHeight = isPolaroid ? contentHeight - polaroidBottomMargin : contentHeight;

    return (
      <Group
        x={frameX}
        y={frameY}
        rotation={frameDef.rotation || 0}
      >
        {/* Frame border */}
        {frameDef.shape === 'circle' ? (
          <Circle
            x={frameWidth / 2}
            y={frameHeight / 2}
            radius={Math.min(frameWidth, frameHeight) / 2}
            fill="transparent"
            stroke={isActive ? '#3b82f6' : (frameDef.stroke || '#e5e7eb')}
            strokeWidth={isActive ? 3 : (frameDef.strokeWidth || 2)}
            onClick={() => handleSelectFrame(frameFill.frameId)}
            onTap={() => handleSelectFrame(frameFill.frameId)}
          />
        ) : (
          <Rect
            x={0}
            y={0}
            width={frameWidth}
            height={frameHeight}
            fill={isPolaroid ? '#ffffff' : 'transparent'}
            stroke={isActive ? '#3b82f6' : (frameDef.stroke || '#e5e7eb')}
            strokeWidth={isActive ? 3 : (frameDef.strokeWidth || 2)}
            cornerRadius={frameDef.cornerRadiusPct ? Math.min(frameWidth, frameHeight) * frameDef.cornerRadiusPct : 0}
            onClick={() => handleSelectFrame(frameFill.frameId)}
            onTap={() => handleSelectFrame(frameFill.frameId)}
          />
        )}

        {/* Filled image with clipping */}
        {frameFill.assetSrc && (
          <Group
            clipFunc={(ctx) => {
              if (frameDef.shape === 'circle') {
                const radius = Math.min(contentWidth, imageHeight) / 2;
                ctx.beginPath();
                ctx.arc(
                  contentX - frameX + radius,
                  contentY - frameY + radius,
                  radius,
                  0,
                  Math.PI * 2
                );
                ctx.clip();
              } else {
                ctx.beginPath();
                ctx.rect(
                  contentX - frameX,
                  contentY - frameY,
                  contentWidth,
                  imageHeight
                );
                ctx.clip();
              }
            }}
          >
            <Group
              x={contentX - frameX}
              y={contentY - frameY}
            >
              {(() => {
                const [img, status] = useImage(frameFill.assetSrc);
                if (status !== 'loaded' || !img) return null;

                // Calculate image transform
                const imgAspect = img.width / img.height;
                const frameAspect = contentWidth / imageHeight;
                const baseScale = frameFill.zoom;
                
                // Scale to cover frame
                const scale = imgAspect > frameAspect
                  ? (imageHeight / img.height) * baseScale
                  : (contentWidth / img.width) * baseScale;

                const scaledWidth = img.width * scale;
                const scaledHeight = img.height * scale;

                // Center + offset
                const centerX = contentWidth / 2;
                const centerY = imageHeight / 2;
                const imgX = centerX - (scaledWidth / 2) + frameFill.offsetX;
                const imgY = centerY - (scaledHeight / 2) + frameFill.offsetY;

                return (
                  <KonvaImage
                    image={img}
                    x={imgX}
                    y={imgY}
                    width={scaledWidth}
                    height={scaledHeight}
                    rotation={frameFill.rotation}
                    draggable={isActive && templateMode}
                    onDragEnd={(e) => {
                      const node = e.target;
                      const newOffsetX = node.x() - centerX + (scaledWidth / 2);
                      const newOffsetY = node.y() - centerY + (scaledHeight / 2);
                      onUpdateFrameFill(frameFill.frameId, {
                        offsetX: newOffsetX,
                        offsetY: newOffsetY,
                      });
                    }}
                  />
                );
              })()}
            </Group>
          </Group>
        )}
      </Group>
    );
  };

  // QR Component
  const QRComponent = ({ object }: { object: EditorObject }) => {
    const qrRef = useRef<any>(null);

    useEffect(() => {
      if (qrRef.current) {
        imageRefs.current[object.id] = qrRef.current;
      }
      return () => {
        delete imageRefs.current[object.id];
      };
    }, [object.id]);

    if (!object.src) return null;

    const [img, status] = useImage(object.src);

    if (status === 'loading' || !img) {
      return null;
    }

    const qrSize = object.size || 100;
    const isLocked = object.locked || (editorConfig.qrRequired && editorConfig.qrPlacementMode === 'fixed');
    const isFlexible = editorConfig.qrPlacementMode === 'flexible' && !isLocked;

    return (
      <KonvaImage
        ref={qrRef}
        image={img}
        x={object.x}
        y={object.y}
        width={qrSize}
        height={qrSize}
        scaleX={object.scaleX}
        scaleY={object.scaleY}
        rotation={object.rotation}
        draggable={isFlexible}
        dragBoundFunc={(pos) => {
          // Constrain QR to safe zone when flexible
          if (isFlexible && currentSide) {
            const safeLeft = currentSide.safePx;
            const safeTop = currentSide.safePx;
            const safeRight = currentSide.canvasPx.w - currentSide.safePx - qrSize;
            const safeBottom = currentSide.canvasPx.h - currentSide.safePx - qrSize;
            
            return {
              x: Math.max(safeLeft, Math.min(pos.x, safeRight)),
              y: Math.max(safeTop, Math.min(pos.y, safeBottom)),
            };
          }
          return pos;
        }}
        onClick={() => {
          setSideStateById((prev) => ({
            ...prev,
            [activeSideId]: {
              ...prev[activeSideId] || { objects: [], selectedId: undefined },
              selectedId: object.id,
            },
          }));
        }}
        onDragEnd={(e) => {
          if (isFlexible) {
            handleDragEnd(object.id, e);
          }
        }}
        onTransformEnd={(e) => handleTransformEnd(object.id, e)}
      />
    );
  };

  // Show error state if PrintSpec is missing, has an error, or currentSide is invalid
  if (printSpecError || !printSpec || !currentSide) {
    return (
      <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
        {/* Draft Banner */}
        {showDraftBanner && (
          <DraftBanner
            onRestore={handleRestoreDraft}
            onDismiss={() => setShowDraftBanner(false)}
            onClear={handleClearDraft}
            assetsPartial={assetsPartial}
            variantMismatch={hasVariantMismatch}
          />
        )}

        {/* Header */}
        <div className="bg-gray-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">Project Editor</h2>
            {onClose && (
              <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        <div className="flex-1 flex items-center justify-center bg-gray-100">
          <div className="max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg border-2 border-red-500">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl font-bold text-red-600 mb-4">Print Configuration Error</h3>
              <p className="text-gray-700 mb-6">
                {printSpecError || (!printSpec ? 'Print specification is missing. Unable to initialize editor.' : 'Current side is invalid. Please refresh the page.')}
              </p>
              <div className="text-sm text-gray-500 mb-6">
                <p className="font-semibold mb-2">What this means:</p>
                <p>This product format requires a specific print specification that hasn't been configured yet.</p>
                <p className="mt-2">Export and continue actions are disabled until this is resolved.</p>
              </div>
              {(productSlug || gelatoVariantUid) && (
                <div className="text-xs text-gray-400 bg-gray-100 p-3 rounded mb-4">
                  {productSlug && <p className="font-mono">Product: {productSlug}</p>}
                  {gelatoVariantUid && <p className="font-mono">Variant UID: {gelatoVariantUid}</p>}
                  {printSpecId && <p className="font-mono">Spec ID: {printSpecId}</p>}
                </div>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                >
                  Go Back
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Draft Banner */}
      {showDraftBanner && (
        <DraftBanner
          onRestore={handleRestoreDraft}
          onDismiss={() => setShowDraftBanner(false)}
          onClear={handleClearDraft}
          assetsPartial={assetsPartial}
          variantMismatch={hasVariantMismatch}
        />
      )}

      {/* Header */}
      <div className="bg-gray-800 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">Project Editor</h2>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded">
              <X className="w-5 h-5" />
            </button>
          )}
          
          {/* Side Tabs */}
          {printSpec && printSpec.sides.length > 1 && (
            <div className="flex gap-2 ml-4 border-l border-gray-600 pl-4">
              {printSpec.sides.map((side) => (
                <button
                  key={side.id}
                  onClick={() => handleSideSwitch(side.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeSideId === side.id
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {side.id.charAt(0).toUpperCase() + side.id.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Guides are always visible by default - no toggles needed for simplicity */}
          {/* Orientation Toggle */}
          <button
            onClick={() => setEditorOrientation(prev => prev === 'portrait' ? 'landscape' : 'portrait')}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium flex items-center gap-2"
            title="Toggle Orientation"
          >
            <span className={`inline-block transition-transform ${editorOrientation === 'landscape' ? 'rotate-90' : ''}`}>
              📄
            </span>
            <span>{editorOrientation === 'portrait' ? 'Portrait' : 'Landscape'}</span>
          </button>
          <div className="h-6 w-px bg-gray-600 mx-2" />
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={includeGuidesInExport}
              onChange={(e) => setIncludeGuidesInExport(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Include guides</span>
          </label>
          {(() => {
            const qrCheck = checkQRRequired();
            const isBlocked = !!printSpecError || !qrCheck.isValid;
            const blockReason = printSpecError 
              ? printSpecError 
              : !qrCheck.isValid 
                ? `ArtKey QR required on at least one of: ${qrCheck.missingSides.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}`
                : '';

            return printSpec && printSpec.sides.length > 1 ? (
              <>
                <button
                  onClick={handleExportActiveSide}
                  disabled={isBlocked}
                  className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${
                    isBlocked
                      ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                  title={blockReason || `Export ${activeSideId} side`}
                >
                  <Download className="w-4 h-4" />
                  Export {activeSideId.charAt(0).toUpperCase() + activeSideId.slice(1)}
                </button>
                <button
                  onClick={handleExportAllSides}
                  disabled={isBlocked}
                  className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${
                    isBlocked
                      ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  title={blockReason || 'Export all sides'}
                >
                  <Download className="w-4 h-4" />
                  Export All
                </button>
              </>
            ) : (
              <button
                onClick={handleExportActiveSide}
                disabled={isBlocked}
                className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${
                  isBlocked
                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
                title={blockReason || 'Export PNG'}
              >
                <Download className="w-4 h-4" />
                Export PNG
              </button>
            );
          })()}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto flex flex-col">
          {/* Add Text Label Button */}
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={handleAddTextLabel}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
            >
              <Type className="w-4 h-4" />
              Add Text Label
            </button>
          </div>

          {/* Label Inspector - Always visible when text or label-shape is selected */}
          {selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'label-shape') ? (
            <div className="flex-1 overflow-y-auto">
              <LabelInspector
                selectedObject={selectedObject}
                onUpdate={handleLabelUpdate}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-gray-500">
              <div>
                <p className="text-sm font-medium mb-2">No text label selected</p>
                <p className="text-xs">Click "Add Text Label" above or select an existing text label on the canvas</p>
              </div>
            </div>
          )}

          {/* ArtKey Panel */}
          <ArtKeyPanel
            config={editorConfig}
            activeSideId={activeSideId}
            selectedSkeletonKeyId={selectedSkeletonKeyId}
            objects={objects}
            showQRTarget={showQRTarget}
            onSelectSkeletonKey={setSelectedSkeletonKeyId}
            onAddSkeletonKey={handleAddSkeletonKey}
            onAddQR={handleAddQR}
            onSnapQRToTarget={handleSnapQRToTarget}
            onToggleQRTarget={() => setShowQRTarget(!showQRTarget)}
            onRemoveQRTarget={() => {
              const qrTarget = objects.find(obj => obj.type === 'skeletonKey');
              if (qrTarget) {
                setSideStateById((prev) => {
                  const newState = {
                    ...prev,
                    [activeSideId]: {
                      ...prev[activeSideId] || { objects: [], selectedId: undefined, template: undefined },
                      objects: (prev[activeSideId]?.objects || []).filter(obj => obj.id !== qrTarget.id),
                      selectedId: undefined,
                    },
                  };
                  scheduleAutosave();
                  return newState;
                });
                // Clean up blob URL
                if (qrTarget.src && qrTarget.src.startsWith('blob:')) {
                  URL.revokeObjectURL(qrTarget.src);
                }
                setSelectedSkeletonKeyId(null);
              }
            }}
          />

          {/* Tab Buttons */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('assets')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'assets'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              📷 Your Images
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'templates'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              🖼️ Templates
            </button>
          </div>

          {activeTab === 'assets' && (
            <div className="p-4 flex-1 overflow-y-auto">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Your Images</h3>
              <p className="text-xs text-gray-500 mb-4">
                {templateMode && templateState?.activeFrameId
                  ? 'Click an image to fill the active frame'
                  : 'Click an image to add it to the canvas'}
              </p>

              {/* Prominent Upload Button */}
              <label className="block w-full p-6 border-2 border-dashed border-blue-400 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all text-center mb-4 bg-blue-50/50">
                <Upload className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <span className="text-sm font-semibold text-blue-600 block">Upload More Images</span>
                <span className="text-xs text-gray-500 mt-1 block">JPG, PNG, BMP</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {assets.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">No images uploaded yet</p>
                  <p className="text-xs mt-2">Use the upload button above to add images</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="w-full aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-all hover:shadow-md relative group"
                    >
                      <button
                        onClick={() => handleThumbnailClick(asset)}
                        className="w-full h-full"
                      >
                        <img src={asset.src} alt={asset.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-2 py-1 rounded">
                            Add to Canvas
                          </span>
                        </div>
                      </button>
                      {/* Red X delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          useAssetStore.getState().removeAsset(asset.id);
                        }}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        title="Delete image"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Debug Info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-600">
                  <div>Assets in store: {assets.length}</div>
                  <div>Objects on canvas: {objects.length}</div>
                  <div>Selected: {selectedId || 'none'}</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'shapes' && (
            <LabelShapesPanel onAddLabelShape={handleAddLabelShape} />
          )}

          {activeTab === 'templates' && (
            <TemplatesPanel
              templateMode={templateMode}
              templateState={currentSideState?.template}
              activeSideId={activeSideId}
              onToggleTemplateMode={() => setTemplateMode(!templateMode)}
              onSelectTemplate={handleSelectTemplate}
              onClearTemplate={handleClearTemplate}
              onSelectFrame={handleSelectFrame}
              onFillFrame={handleFillFrame}
              onUpdateFrameFill={onUpdateFrameFill}
            />
          )}
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center bg-gray-100 p-8 overflow-auto">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <Stage
              ref={stageRef}
              width={STAGE_WIDTH * displayScale}
              height={STAGE_HEIGHT * displayScale}
              scaleX={displayScale}
              scaleY={displayScale}
              onClick={(e) => {
                // Deselect if clicking on empty space
                const clickedOnEmpty = e.target === e.target.getStage();
                if (clickedOnEmpty) {
                  setSelectedId(null);
                }
              }}
              onTap={(e) => {
                const tappedOnEmpty = e.target === e.target.getStage();
                if (tappedOnEmpty) {
                  setSelectedId(null);
                }
              }}
            >
              <Layer>
                {/* Background - Print Area */}
                <Rect
                  x={0}
                  y={0}
                  width={STAGE_WIDTH}
                  height={STAGE_HEIGHT}
                  fill="#ffffff"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
                {/* Print Area Label */}
                {currentSide && (
                  <KonvaText
                    x={10}
                    y={10}
                    text={`Print Area: ${Math.round(STAGE_WIDTH / 300)}" × ${Math.round(STAGE_HEIGHT / 300)}"`}
                    fontSize={12}
                    fill="#6b7280"
                    fontFamily="Arial"
                  />
                )}

                {/* Print Area Guides */}
                {currentSide && (
                  <>
                    {/* Trim Guide - Print area boundary (orange) */}
                    <Rect
                      name="guide-overlay"
                      x={-currentSide.trimPx}
                      y={-currentSide.trimPx}
                      width={currentSide.canvasPx.w + currentSide.trimPx * 2}
                      height={currentSide.canvasPx.h + currentSide.trimPx * 2}
                      fill="transparent"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dash={[5, 5]}
                    />

                    {/* Safe Zone Guide - Always visible */}
                    <Rect
                      name="guide-overlay"
                      x={currentSide.safePx}
                      y={currentSide.safePx}
                      width={currentSide.canvasPx.w - currentSide.safePx * 2}
                      height={currentSide.canvasPx.h - currentSide.safePx * 2}
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth={2}
                      dash={[5, 5]}
                    />

                    {/* Fold Lines - Always visible for cards (red, very thick and visible) */}
                    {currentSide.foldLines && currentSide.foldLines.length > 0 && currentSide.foldLines.map((fold, idx) => {
                      // Ensure coordinates are valid
                      const x1 = Math.max(0, Math.min(fold.x1, currentSide.canvasPx.w));
                      const y1 = Math.max(0, Math.min(fold.y1, currentSide.canvasPx.h));
                      const x2 = Math.max(0, Math.min(fold.x2, currentSide.canvasPx.w));
                      const y2 = Math.max(0, Math.min(fold.y2, currentSide.canvasPx.h));
                      
                      // Debug log
                      if (process.env.NODE_ENV === 'development' && idx === 0) {
                        console.log('[ProjectEditor] Rendering fold line:', {
                          side: currentSide.id,
                          original: fold,
                          adjusted: { x1, y1, x2, y2 },
                          canvasW: currentSide.canvasPx.w,
                          canvasH: currentSide.canvasPx.h,
                        });
                      }
                      
                      return (
                        <Line
                          key={`fold-${idx}`}
                          name="guide-overlay"
                          points={[x1, y1, x2, y2]}
                          stroke="#ef4444"
                          strokeWidth={6}
                          dash={[30, 20]}
                          opacity={1}
                          listening={false}
                          perfectDrawEnabled={false}
                          shadowForStrokeEnabled={false}
                          lineCap="round"
                          lineJoin="round"
                        />
                      );
                    })}
                  </>
                )}

                {/* QR Target Guide */}
                {showQRTarget && selectedSkeletonKeyId && (() => {
                  const skeletonKey = objects.find(obj => obj.type === 'skeletonKey' && obj.keyId === selectedSkeletonKeyId);
                  if (!skeletonKey || !skeletonKey.keyId) return null;
                  
                  const keyDef = getSkeletonKey(skeletonKey.keyId);
                  if (!keyDef) return null;

                  const keyLeft = skeletonKey.x;
                  const keyTop = skeletonKey.y;
                  const keyWidth = (skeletonKey.width || 500) * skeletonKey.scaleX;
                  const keyHeight = (skeletonKey.height || 700) * skeletonKey.scaleY;
                  
                  const targetX = keyLeft + (keyWidth * keyDef.qrTargetPct.xPct);
                  const targetY = keyTop + (keyHeight * keyDef.qrTargetPct.yPct);
                  const targetW = keyWidth * keyDef.qrTargetPct.wPct;
                  const targetH = keyHeight * keyDef.qrTargetPct.hPct;

                  return (
                    <Rect
                      name="guide-overlay"
                      x={targetX}
                      y={targetY}
                      width={targetW}
                      height={targetH}
                      fill="transparent"
                      stroke="#0066cc"
                      strokeWidth={2}
                      dash={[5, 5]}
                    />
                  );
                })()}

                {/* Objects */}
                {objects.map((object) => {
                  if (object.type === 'text') {
                    return <TextComponent key={object.id} object={object} />;
                  }
                  if (object.type === 'label-shape') {
                    // Label shapes are rendered as text with shape background
                    return <TextComponent key={object.id} object={object} />;
                  }
                  if (object.type === 'skeletonKey') {
                    return <SkeletonKeyComponent key={object.id} object={object} />;
                  }
                  if (object.type === 'qr') {
                    return <QRComponent key={object.id} object={object} />;
                  }
                  if (object.type === 'image') {
                    return <ImageComponent key={object.id} object={object} />;
                  }
                  return null;
                })}

                {/* Transformer - for resizing and rotating selected objects */}
                <Transformer
                  ref={transformerRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    // Allow any resize - no constraints
                    return newBox;
                  }}
                  borderEnabled={true}
                  borderStroke="#3b82f6"
                  borderStrokeWidth={2}
                  anchorFill="#3b82f6"
                  anchorStroke="#ffffff"
                  anchorStrokeWidth={2}
                  anchorSize={10}
                  rotateEnabled={true}
                  enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center', 'middle-left', 'middle-right']}
                  keepRatio={false}
                />
              </Layer>
            </Stage>
          </div>
        </div>
      </div>
    </div>
  );
}
