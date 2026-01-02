"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Rect, Line, Transformer, Group, Circle } from 'react-konva';
import useImage from 'use-image';
import { Download, X, Eye, EyeOff, Type } from 'lucide-react';
import { useAssetStore, type UploadedAsset } from '@/lib/assetStore';
import { getPrintSpecForProduct, getPrintSide, generatePrintSpecForSize, type PrintSpec, type PrintSide, type PrintSpecResult } from '@/lib/printSpecs';
import { DEFAULT_FONT, DEFAULT_FONT_WEIGHT } from '@/lib/editorFonts';
import LabelInspector from './LabelInspector';
import ArtKeyPanel from './ArtKeyPanel';
import TemplatesPanel from './TemplatesPanel';
import DraftBanner from './DraftBanner';
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
  const [showTrim, setShowTrim] = useState(false);
  const [showSafe, setShowSafe] = useState(true);
  const [showFold, setShowFold] = useState(true); // Default to showing fold lines for cards
  const [includeGuidesInExport, setIncludeGuidesInExport] = useState(false);
  const [showQRTarget, setShowQRTarget] = useState(true);
  const [selectedSkeletonKeyId, setSelectedSkeletonKeyId] = useState<string | null>(
    editorConfig.defaultSkeletonKeyId || null
  );
  const [templateMode, setTemplateMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'assets' | 'templates'>('assets');
  const [draftFound, setDraftFound] = useState(false);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [assetsPartial, setAssetsPartial] = useState(false);
  const [restoredGelatoVariantUid, setRestoredGelatoVariantUid] = useState<string | null>(null);
  const [restoredSelectedVariant, setRestoredSelectedVariant] = useState<any>(null);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const imageRefs = useRef<Record<string, any>>({});

  // Get assets from shared store
  const assets = useAssetStore((state) => state.assets);

  // Get print spec with error handling
  // Priority: 
  // 1. If selectedVariant has size, generate dynamic spec based on size
  // 2. gelatoVariantUid > printSpecId > productSlug (legacy fallback)
  const printSpecResult: PrintSpecResult = useMemo(() => {
    // NEW: Dynamic spec based on selected size and orientation
    if (selectedVariant?.size && productSlug) {
      // Determine product type for spec generation
      const productType = productSlug as 'card' | 'postcard' | 'invitation' | 'announcement' | 'print';
      const sizeId = selectedVariant.size;
      // Use orientation from variant or default to portrait
      const orientation: 'portrait' | 'landscape' = selectedVariant.orientation || 'portrait';
      
      try {
        const dynamicSpec = generatePrintSpecForSize(productType, sizeId, orientation);
        return { spec: dynamicSpec };
      } catch (e) {
        console.error('[ProjectEditor] Failed to generate dynamic spec:', e);
        // Fall through to legacy resolution
      }
    }
    
    // Legacy fallback: gelatoVariantUid > printSpecId > productSlug
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
  }, [selectedVariant?.size, selectedVariant?.orientation, productSlug, gelatoVariantUid, printSpecId]);

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
  const [displayScale, setDisplayScale] = useState(0.3);
  
  useEffect(() => {
    if (!currentSide || typeof window === 'undefined') return;
    
    const maxDisplayWidth = window.innerWidth * 0.7;
    const maxDisplayHeight = window.innerHeight * 0.8;
    
    const scaleX = maxDisplayWidth / currentSide.canvasPx.w;
    const scaleY = maxDisplayHeight / currentSide.canvasPx.h;
    const scale = Math.min(scaleX, scaleY, 1); // Don't scale up
    
    setDisplayScale(scale);
  }, [currentSide]);

  // Update transformer when selection changes
  useEffect(() => {
    if (!transformerRef.current) return;

    const selectedNode = selectedId ? imageRefs.current[selectedId] : null;

    if (selectedNode) {
      transformerRef.current.nodes([selectedNode]);
      transformerRef.current.getLayer()?.batchDraw();
    } else {
      transformerRef.current.nodes([]);
    }
  }, [selectedId, activeSideId]); // Include activeSideId to update when switching sides

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
                  scaleX: node.scaleX(),
                  scaleY: node.scaleY(),
                  rotation: node.rotation(),
                  // Update width/height if stored (for images)
                  width: obj.width ? obj.width * node.scaleX() : undefined,
                  height: obj.height ? obj.height * node.scaleY() : undefined,
                  // Update fontSize for text objects
                  fontSize: obj.type === 'text' && obj.fontSize ? obj.fontSize * node.scaleX() : obj.fontSize,
                }
              : obj
          ),
        },
      };
      scheduleAutosave();
      return newState;
    });

    // Reset scale after transform (Konva stores transform in scaleX/Y)
    node.scaleX(1);
    node.scaleY(1);
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

  // Add skeleton key to canvas
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

    // Scale skeleton key to fit print spec dimensions
    // SVG is 500x700, but we need to scale it to match currentSide dimensions
    const svgAspectRatio = 500 / 700; // width/height
    const sideAspectRatio = currentSide.canvasPx.w / currentSide.canvasPx.h;
    
    let scaledWidth: number;
    let scaledHeight: number;
    
    if (svgAspectRatio > sideAspectRatio) {
      // SVG is wider - fit to width
      scaledWidth = currentSide.canvasPx.w * 0.9; // 90% of print area width
      scaledHeight = scaledWidth / svgAspectRatio;
    } else {
      // SVG is taller - fit to height
      scaledHeight = currentSide.canvasPx.h * 0.9; // 90% of print area height
      scaledWidth = scaledHeight * svgAspectRatio;
    }

    // Calculate position from percentage (centered)
    const x = (currentSide.canvasPx.w * keyDef.defaultPositionPct.xPct) - (scaledWidth / 2);
    const y = (currentSide.canvasPx.h * keyDef.defaultPositionPct.yPct) - (scaledHeight / 2);

    // Remove existing skeleton key on this side if any (only one skeleton key per side)
    const existingKey = objects.find(obj => obj.type === 'skeletonKey');
    const filteredObjects = existingKey 
      ? objects.filter(obj => obj.id !== existingKey.id)
      : objects;
      
    // Clean up old object URL if exists
    if (existingKey && existingKey.src && existingKey.src.startsWith('blob:')) {
      URL.revokeObjectURL(existingKey.src);
    }

    const newSkeletonKey: EditorObject = {
      id: `skeleton-${Date.now()}-${Math.random()}`,
      type: 'skeletonKey',
      keyId: keyId,
      src: svgUrl,
      x: Math.max(0, Math.min(x, currentSide.canvasPx.w - scaledWidth)),
      y: Math.max(0, Math.min(y, currentSide.canvasPx.h - scaledHeight)),
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      width: scaledWidth,
      height: scaledHeight,
      opacity: 0.3,
      locked: false,
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

  // Add QR code to canvas
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
      // Get skeleton key to find target position (use targetSideId)
      const skeletonKey = targetSideObjects.find(obj => obj.type === 'skeletonKey');
      let qrX = targetSide.canvasPx.w / 2;
      let qrY = targetSide.canvasPx.h / 2;

      if (skeletonKey && skeletonKey.keyId) {
        const keyDef = getSkeletonKey(skeletonKey.keyId);
        if (keyDef) {
          // Calculate QR target position relative to skeleton key
          const keyLeft = skeletonKey.x;
          const keyTop = skeletonKey.y;
          const keyWidth = (skeletonKey.width || 500) * skeletonKey.scaleX;
          const keyHeight = (skeletonKey.height || 700) * skeletonKey.scaleY;
          
          const targetX = keyLeft + (keyWidth * keyDef.qrTargetPct.xPct);
          const targetY = keyTop + (keyHeight * keyDef.qrTargetPct.yPct);
          const targetW = keyWidth * keyDef.qrTargetPct.wPct;
          const targetH = keyHeight * keyDef.qrTargetPct.hPct;
          
          // Size QR to fit 90% of target box
          const targetSize = Math.min(targetW, targetH) * 0.9;
          qrX = targetX + (targetW / 2) - (targetSize / 2);
          qrY = targetY + (targetH / 2) - (targetSize / 2);
          // Update QR size to match target
          qrSize = targetSize;
        }
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

  // Snap QR to skeleton key target
  const handleSnapQRToTarget = () => {
    if (!currentSide) return;

    const skeletonKey = objects.find(obj => obj.type === 'skeletonKey');
    const qr = objects.find(obj => obj.type === 'qr' && obj.sideId === activeSideId);
    
    if (!skeletonKey || !qr || !skeletonKey.keyId) return;

    const keyDef = getSkeletonKey(skeletonKey.keyId);
    if (!keyDef) return;

    // Calculate target position
    const keyLeft = skeletonKey.x;
    const keyTop = skeletonKey.y;
    const keyWidth = (skeletonKey.width || 500) * skeletonKey.scaleX;
    const keyHeight = (skeletonKey.height || 700) * skeletonKey.scaleY;
    
    const targetX = keyLeft + (keyWidth * keyDef.qrTargetPct.xPct);
    const targetY = keyTop + (keyHeight * keyDef.qrTargetPct.yPct);
    const targetW = keyWidth * keyDef.qrTargetPct.wPct;
    const targetH = keyHeight * keyDef.qrTargetPct.hPct;
    
    const targetSize = Math.min(targetW, targetH) * 0.9;
    const newX = targetX + (targetW / 2) - (targetSize / 2);
    const newY = targetY + (targetH / 2) - (targetSize / 2);

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
      
      // Temporarily hide guides if not including in export
      const guideObjects: any[] = [];
      if (!includeGuidesInExport && layer) {
        const allNodes = layer.getChildren();
        allNodes.forEach((node: any) => {
          if (node.name() === 'guide-overlay') {
            node.visible(false);
            guideObjects.push(node);
          }
        });
        layer.draw();
      }

      const dataUrl = stage.toDataURL({
        pixelRatio: 1,
        width: currentSide.canvasPx.w,
        height: currentSide.canvasPx.h,
      });

      // Restore guide visibility
      if (!includeGuidesInExport && layer) {
        guideObjects.forEach((node) => {
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

  // Image Component
  const ImageComponent = ({ object }: { object: EditorObject }) => {
    if (!object.src) return null;
    
    // Only set crossOrigin for external URLs, not for blob: or data: URLs
    const crossOrigin = object.src.startsWith('blob:') || object.src.startsWith('data:')
      ? undefined
      : 'anonymous';
    const [img, status] = useImage(object.src, crossOrigin);
    const imageRef = useRef<any>(null);

    useEffect(() => {
      if (imageRef.current) {
        imageRefs.current[object.id] = imageRef.current;
      }
      return () => {
        delete imageRefs.current[object.id];
      };
    }, [object.id]);

    // Calculate display dimensions from scale and original width/height
    const displayWidth = object.width ? object.width * object.scaleX : 100;
    const displayHeight = object.height ? object.height * object.scaleY : 100;

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
      <KonvaImage
        ref={imageRef}
        image={img}
        x={object.x}
        y={object.y}
        width={displayWidth}
        height={displayHeight}
        scaleX={object.scaleX}
        scaleY={object.scaleY}
        rotation={object.rotation}
        draggable
        onClick={() => {
          console.log('[ProjectEditor] Image clicked:', object.id);
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

  // Skeleton Key Component
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

    return (
      <KonvaImage
        ref={keyRef}
        image={img}
        x={object.x}
        y={object.y}
        width={object.width || 500}
        height={object.height || 700}
        scaleX={object.scaleX}
        scaleY={object.scaleY}
        rotation={object.rotation}
        opacity={object.opacity ?? 0.3}
        draggable={!object.locked}
        onClick={() => {
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
          {/* Guide Toggles */}
          <button
            onClick={() => setShowBleed(!showBleed)}
            className={`p-2 rounded ${showBleed ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
            title="Toggle Bleed Guide"
          >
            {showBleed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setShowTrim(!showTrim)}
            className={`p-2 rounded ${showTrim ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
            title="Toggle Trim Guide"
          >
            {showTrim ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setShowSafe(!showSafe)}
            className={`p-2 rounded ${showSafe ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
            title="Toggle Safe Zone Guide"
          >
            {showSafe ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          {currentSide?.foldLines && currentSide.foldLines.length > 0 && (
            <button
              onClick={() => setShowFold(!showFold)}
              className={`p-2 rounded ${showFold ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
              title="Toggle Fold Lines"
            >
              {showFold ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          )}
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

          {/* Label Inspector */}
          {selectedObject && selectedObject.type === 'text' && (
            <LabelInspector
              selectedObject={selectedObject}
              onUpdate={handleLabelUpdate}
            />
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
          />

          {activeTab === 'assets' && (
            <div className="p-4 flex-1 overflow-y-auto">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Your Images</h3>
              <p className="text-xs text-gray-500 mb-4">
                {templateMode && templateState?.activeFrameId
                  ? 'Click an image to fill the active frame'
                  : 'Click an image to add it to the canvas'}
              </p>

              {assets.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">Upload images above to start</p>
                  <p className="text-xs mt-2">Go back to Step 1 and upload images first</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assets.map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => handleThumbnailClick(asset)}
                      className="w-full aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-all hover:shadow-md relative group"
                    >
                      <img src={asset.src} alt={asset.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-2 py-1 rounded">
                          Add to Canvas
                        </span>
                      </div>
                    </button>
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
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center bg-gray-100 p-8 overflow-auto">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <Stage
              ref={stageRef}
              width={STAGE_WIDTH}
              height={STAGE_HEIGHT}
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
                {/* Background */}
                <Rect
                  x={0}
                  y={0}
                  width={STAGE_WIDTH}
                  height={STAGE_HEIGHT}
                  fill="#ffffff"
                  stroke="#e5e7eb"
                  strokeWidth={1}
                />

                {/* Print Area Guides */}
                {currentSide && (
                  <>
                    {/* Bleed Guide */}
                    {showBleed && (
                      <Rect
                        name="guide-overlay"
                        x={-currentSide.bleedPx}
                        y={-currentSide.bleedPx}
                        width={currentSide.canvasPx.w + currentSide.bleedPx * 2}
                        height={currentSide.canvasPx.h + currentSide.bleedPx * 2}
                        fill="transparent"
                        stroke="#ef4444"
                        strokeWidth={1}
                        dash={[5, 5]}
                      />
                    )}

                    {/* Trim Guide */}
                    {showTrim && (
                      <Rect
                        name="guide-overlay"
                        x={-currentSide.trimPx}
                        y={-currentSide.trimPx}
                        width={currentSide.canvasPx.w + currentSide.trimPx * 2}
                        height={currentSide.canvasPx.h + currentSide.trimPx * 2}
                        fill="transparent"
                        stroke="#f59e0b"
                        strokeWidth={1}
                        dash={[3, 3]}
                      />
                    )}

                    {/* Safe Zone Guide */}
                    {showSafe && (
                      <Rect
                        name="guide-overlay"
                        x={currentSide.safePx}
                        y={currentSide.safePx}
                        width={currentSide.canvasPx.w - currentSide.safePx * 2}
                        height={currentSide.canvasPx.h - currentSide.safePx * 2}
                        fill="transparent"
                        stroke="#10b981"
                        strokeWidth={1}
                        dash={[2, 2]}
                      />
                    )}

                    {/* Fold Lines */}
                    {showFold && currentSide.foldLines && currentSide.foldLines.map((fold, idx) => (
                      <Line
                        key={`fold-${idx}`}
                        name="guide-overlay"
                        points={[fold.x1, fold.y1, fold.x2, fold.y2]}
                        stroke="#6366f1"
                        strokeWidth={2}
                        dash={[10, 5]}
                      />
                    ))}
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

                {/* Transformer */}
                <Transformer
                  ref={transformerRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    // Allow any resize
                    return newBox;
                  }}
                />
              </Layer>
            </Stage>
          </div>
        </div>
      </div>
    </div>
  );
}
