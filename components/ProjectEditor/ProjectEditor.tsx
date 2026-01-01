"use client";

import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Line, Transformer } from 'react-konva';
import useImage from 'use-image';
import { Download, X, Eye, EyeOff } from 'lucide-react';
import { useAssetStore, type UploadedAsset } from '@/lib/assetStore';
import { getPrintSpecForProduct, getPrintSide, type PrintSpec, type PrintSide } from '@/lib/printSpecs';

interface CanvasImage {
  id: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

interface ProjectEditorProps {
  printSpecId?: string; // Optional: if not provided, will use default
  productSlug?: string; // Product slug for spec lookup
  onComplete?: (exportData: { side: string; dataUrl: string; blob: Blob }[]) => void;
  onClose?: () => void;
}

export default function ProjectEditor({ 
  printSpecId, 
  productSlug,
  onComplete, 
  onClose 
}: ProjectEditorProps) {
  const [images, setImages] = useState<CanvasImage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  // Get print spec
  const printSpec: PrintSpec | undefined = printSpecId
    ? getPrintSpecForProduct(printSpecId)
    : productSlug
    ? getPrintSpecForProduct(productSlug)
    : getPrintSpec('poster_simple'); // Default fallback

  const currentSide: PrintSide | undefined = printSpec
    ? getPrintSide(printSpec, 'front')
    : undefined;

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
  }, [selectedId]);

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

      const newImage: CanvasImage = {
        id: `img-${Date.now()}-${Math.random()}`,
        url: asset.src,
        x,
        y,
        width: scaledWidth,
        height: scaledHeight,
        rotation: 0,
      };

      console.log('[ProjectEditor] Adding image to canvas:', {
        id: newImage.id,
        assetId: asset.id,
        position: { x, y },
        size: { width: scaledWidth, height: scaledHeight },
      });

      setImages((prev) => [...prev, newImage]);
      setSelectedId(newImage.id);
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
    setImages((prev) =>
      prev.map((img) =>
        img.id === imageId
          ? {
              ...img,
              x: node.x(),
              y: node.y(),
            }
          : img
      )
    );
  };

  // Handle image transform end
  const handleTransformEnd = (imageId: string, e: any) => {
    const node = e.target;
    setImages((prev) =>
      prev.map((img) =>
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
      )
    );

    // Reset scale after transform
    node.scaleX(1);
    node.scaleY(1);
  };

  // Export PNG
  const handleExport = async () => {
    if (!stageRef.current || !currentSide) {
      alert('Stage not ready or invalid print spec');
      return;
    }

    try {
      const stage = stageRef.current.getStage();
      const layer = stage.getLayers()[0]; // Get the first layer
      
      // Temporarily hide guides if not including in export
      const guideObjects: any[] = [];
      if (!includeGuidesInExport && layer) {
        // Find all guide overlays by name
        layer.find((node: any) => {
          return node.name() === 'guide-overlay';
        }).forEach((node: any) => {
          node.visible(false);
          guideObjects.push(node);
        });
        layer.draw();
      }

      const dataUrl = stage.toDataURL({
        pixelRatio: 1, // Use 1 for exact spec dimensions
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

      if (onComplete) {
        onComplete([
          {
            side: 'front',
            dataUrl,
            blob,
          },
        ]);
      } else {
        // Fallback: download directly
        const link = document.createElement('a');
        link.download = `design-${Date.now()}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      console.log('[ProjectEditor] Export complete:', {
        dimensions: { width: currentSide.canvasPx.w, height: currentSide.canvasPx.h },
        includesGuides: includeGuidesInExport,
      });
    } catch (error) {
      console.error('[ProjectEditor] Export error:', error);
      alert('Failed to export image');
    }
  };

  // Image Component
  const ImageComponent = ({ image }: { image: CanvasImage }) => {
    // Only set crossOrigin for external URLs, not for blob: or data: URLs
    const crossOrigin = image.url.startsWith('blob:') || image.url.startsWith('data:')
      ? undefined
      : 'anonymous';
    const [img, status] = useImage(image.url, crossOrigin);
    const imageRef = useRef<any>(null);

    useEffect(() => {
      if (imageRef.current) {
        imageRefs.current[image.id] = imageRef.current;
      }
      return () => {
        delete imageRefs.current[image.id];
      };
    }, [image.id]);

    if (status === 'loading') {
      return (
        <KonvaImage
          ref={imageRef}
          x={image.x}
          y={image.y}
          width={image.width}
          height={image.height}
          fill="#e5e7eb"
          opacity={0.5}
        />
      );
    }

    if (status === 'failed' || !img) {
      return (
        <KonvaImage
          ref={imageRef}
          x={image.x}
          y={image.y}
          width={image.width}
          height={image.height}
          fill="#fee2e2"
          opacity={0.5}
        />
      );
    }

    return (
      <KonvaImage
        ref={imageRef}
        image={img}
        x={image.x}
        y={image.y}
        width={image.width}
        height={image.height}
        rotation={image.rotation}
        draggable
        onClick={() => {
          console.log('[ProjectEditor] Image clicked:', image.id);
          setSelectedId(image.id);
        }}
        onTap={() => {
          setSelectedId(image.id);
        }}
        onDragEnd={(e) => handleDragEnd(image.id, e)}
        onTransformEnd={(e) => handleTransformEnd(image.id, e)}
      />
    );
  };

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

        <div className="flex items-center gap-4">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export PNG
          </button>
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

                {/* Images */}
                {images.map((image) => (
                  <ImageComponent key={image.id} image={image} />
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
