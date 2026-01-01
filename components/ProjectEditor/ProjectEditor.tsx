"use client";

import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Line, Transformer } from 'react-konva';
import useImage from 'use-image';
import { Download, X, Eye, EyeOff } from 'lucide-react';
import { useAssetStore, type UploadedAsset } from '@/lib/assetStore';
import { getPrintSpecForProduct, getPrintSide, type PrintSpec, type PrintSide, type PrintSpecResult } from '@/lib/printSpecs';

// Editor object type matching requirements
interface EditorObject {
  id: string;
  type: 'image';
  src: string;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  width?: number; // Optional: original width for reference
  height?: number; // Optional: original height for reference
}

interface SideState {
  objects: EditorObject[];
  selectedId?: string;
}

interface ProjectEditorProps {
  printSpecId?: string; // Optional: if not provided, will use default
  productSlug?: string; // Product slug for spec lookup
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
  onComplete, 
  onClose 
}: ProjectEditorProps) {
  // Per-side scene state: Record<SideId, SideState>
  const [sideStateById, setSideStateById] = useState<Record<string, SideState>>({});
  const [activeSideId, setActiveSideId] = useState<string>('front');
  const [showBleed, setShowBleed] = useState(false);
  const [showTrim, setShowTrim] = useState(false);
  const [showSafe, setShowSafe] = useState(true);
  const [showFold, setShowFold] = useState(false);
  const [includeGuidesInExport, setIncludeGuidesInExport] = useState(false);
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const imageRefs = useRef<Record<string, any>>({});

  // Get assets from shared store
  const assets = useAssetStore((state) => state.assets);

  // Get print spec with error handling
  const printSpecResult: PrintSpecResult = printSpecId
    ? getPrintSpecForProduct(printSpecId)
    : productSlug
    ? getPrintSpecForProduct(productSlug)
    : { spec: getPrintSpec('poster_simple') }; // Default fallback for posters

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
        };
      });
      setSideStateById(initialStates);
      // Set active side to first side
      if (printSpec.sides.length > 0) {
        setActiveSideId(printSpec.sides[0].id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printSpec]); // Only depend on printSpec, not sideStateById to avoid re-initialization

  const currentSide: PrintSide | undefined = printSpec
    ? getPrintSide(printSpec, activeSideId as 'front' | 'inside' | 'back')
    : undefined;

  // Get current side's state
  const currentSideState = sideStateById[activeSideId] || { objects: [], selectedId: undefined };
  const objects = currentSideState.objects;
  const selectedId = currentSideState.selectedId;

  // Stage dimensions from print spec
  const STAGE_WIDTH = currentSide?.canvasPx.w || 1800;
  const STAGE_HEIGHT = currentSide?.canvasPx.h || 2400;
  
  // Calculate display scale to fit viewport
  const [displayScale, setDisplayScale] = useState(0.3);
  
  useEffect(() => {
    if (!currentSide) return;
    
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

  // Handle thumbnail click - add image to canvas
  const handleThumbnailClick = (asset: UploadedAsset) => {
    console.log('[ProjectEditor] Thumbnail clicked:', asset.id, asset.name);

    // Create a temporary image to get dimensions (use asset dimensions if available)
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
      setSideStateById((prev) => ({
        ...prev,
        [activeSideId]: {
          ...prev[activeSideId] || { objects: [], selectedId: undefined },
          objects: [...(prev[activeSideId]?.objects || []), newObject],
          selectedId: newObject.id,
        },
      }));
    };
    img.onerror = () => {
      console.error('[ProjectEditor] Failed to load image:', asset.src);
      alert(`Failed to load image: ${asset.name}`);
    };
    img.src = asset.src;
  };

  // Handle image drag end
  const handleDragEnd = (imageId: string, e: any) => {
    const node = e.target;
    setSideScenes((prev) => ({
      ...prev,
      [activeSideId]: {
        ...prev[activeSideId],
        images: (prev[activeSideId]?.images || []).map((img) =>
          img.id === imageId
            ? {
                ...img,
                x: node.x(),
                y: node.y(),
              }
            : img
        ),
      },
    }));
  };

  // Handle image transform end
  const handleTransformEnd = (imageId: string, e: any) => {
    const node = e.target;
    setSideScenes((prev) => ({
      ...prev,
      [activeSideId]: {
        ...prev[activeSideId],
        images: (prev[activeSideId]?.images || []).map((img) =>
          img.id === imageId
            ? {
                ...img,
                x: node.x(),
                y: node.y(),
                width: node.width() * node.scaleX(),
                height: node.height() * node.scaleY(),
                rotation: node.rotation(),
              }
            : img
        ),
      },
    }));

    // Reset scale after transform
    node.scaleX(1);
    node.scaleY(1);
  };

  // Handle side switch
  const handleSideSwitch = (sideId: string) => {
    // Clear selection on current side before switching
    setSideStateById((prev) => ({
      ...prev,
      [activeSideId]: {
        ...prev[activeSideId] || { objects: [], selectedId: undefined },
        selectedId: undefined,
      },
    }));
    
    // Switch to new side
    setActiveSideId(sideId);
    
    // Ensure new side has state
    setSideStateById((prev) => ({
      ...prev,
      [sideId]: prev[sideId] || { objects: [], selectedId: undefined },
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

  // Export active side
  const handleExportActiveSide = async () => {
    if (printSpecError || !printSpec) {
      alert(printSpecError || 'Print spec not available');
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
        const link = document.createElement('a');
        link.download = `${productSlug || printSpec.id}_${result.sideId}_${Date.now()}.png`;
        link.href = result.dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
    // Only set crossOrigin for external URLs, not for blob: or data: URLs
    const crossOrigin = image.url.startsWith('blob:') || image.url.startsWith('data:')
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

  // Show error state if PrintSpec is missing for card products
  if (printSpecError) {
    return (
      <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
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
              <p className="text-gray-700 mb-6">{printSpecError}</p>
              <div className="text-sm text-gray-500 mb-6">
                <p className="font-semibold mb-2">What this means:</p>
                <p>This product format requires a specific print specification that hasn't been configured yet.</p>
                <p className="mt-2">Export and continue actions are disabled until this is resolved.</p>
              </div>
              {productSlug && (
                <div className="text-xs text-gray-400 bg-gray-100 p-3 rounded mb-4">
                  <p className="font-mono">Product: {productSlug}</p>
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
          {printSpec && printSpec.sides.length > 1 ? (
            <>
              <button
                onClick={handleExportActiveSide}
                disabled={!!printSpecError}
                className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${
                  printSpecError
                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
                title={printSpecError || `Export ${activeSideId} side`}
              >
                <Download className="w-4 h-4" />
                Export {activeSideId.charAt(0).toUpperCase() + activeSideId.slice(1)}
              </button>
              <button
                onClick={handleExportAllSides}
                disabled={!!printSpecError}
                className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${
                  printSpecError
                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                title={printSpecError || 'Export all sides'}
              >
                <Download className="w-4 h-4" />
                Export All
              </button>
            </>
          ) : (
            <button
              onClick={handleExportActiveSide}
              disabled={!!printSpecError}
              className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${
                printSpecError
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
              title={printSpecError || 'Export PNG'}
            >
              <Download className="w-4 h-4" />
              Export PNG
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Your Images</h3>
          <p className="text-xs text-gray-500 mb-4">Click an image to add it to the canvas</p>

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
              <div>Images on canvas: {images.length}</div>
              <div>Selected: {selectedId || 'none'}</div>
            </div>
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

                {/* Objects */}
                {objects.map((object) => (
                  <ImageComponent key={object.id} object={object} />
                ))}

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
