"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Rect, Line, Transformer, Group, Ellipse } from 'react-konva';
import useImage from 'use-image';
import { Download, X, Type, Upload, Undo, Redo, Trash2 } from 'lucide-react';
import { useAssetStore, type UploadedAsset } from '@/lib/assetStore';
import { generatePrintSpecForSize, type PrintSpec, type PrintSide } from '@/lib/printSpecs';
import { DEFAULT_FONT, DEFAULT_FONT_WEIGHT } from '@/lib/editorFonts';
import { LABEL_SHAPES, type LabelShape } from '@/lib/labelShapes';
import type { EditorObject, SideState } from './types';

interface ProjectEditorRebuildProps {
  productSlug?: string;
  gelatoVariantUid?: string;
  selectedVariant?: {
    uid: string;
    size?: string | null;
    orientation?: 'portrait' | 'landscape';
    fold?: string | null;
    foil?: string | null;
  };
  onComplete?: (exportData: {
    productSlug?: string;
    exports: Array<{ sideId: string; dataUrl: string; width: number; height: number }>;
  }) => void;
  onClose?: () => void;
}

// History for undo/redo
interface HistoryState {
  sideStates: Record<string, SideState>;
  timestamp: number;
}

export default function ProjectEditorRebuild({
  productSlug = 'card',
  gelatoVariantUid,
  selectedVariant,
  onComplete,
  onClose,
}: ProjectEditorRebuildProps) {
  // Core state
  const [sideStates, setSideStates] = useState<Record<string, SideState>>({});
  const [activeSideId, setActiveSideId] = useState<string>('front');
  const [selectedId, setSelectedId] = useState<string | undefined>();
  
  // History for undo/redo
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const maxHistory = 50;
  
  // Refs
  const transformerRef = useRef<any>(null);
  const nodeRefs = useRef<Record<string, any>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<any>(null);
  
  // Get print spec from Gelato API or generate dynamically
  const printSpec = useMemo<PrintSpec | null>(() => {
    if (!selectedVariant?.size) return null;
    
    const productType = productSlug as 'card' | 'postcard' | 'invitation' | 'announcement' | 'print';
    const orientation = selectedVariant.orientation || 'portrait';
    const foldOption = (selectedVariant.fold === 'bifold' ? 'bifold' : 'flat') as 'bifold' | 'flat';
    
    try {
      const spec = generatePrintSpecForSize(productType, selectedVariant.size, orientation, foldOption);
      return spec;
    } catch (e) {
      console.error('[ProjectEditor] Failed to generate print spec:', e);
      return null;
    }
  }, [productSlug, selectedVariant?.size, selectedVariant?.orientation, selectedVariant?.fold]);
  
  // Initialize side states
  useEffect(() => {
    if (printSpec && Object.keys(sideStates).length === 0) {
      const initialStates: Record<string, SideState> = {};
      printSpec.sides.forEach((side) => {
        initialStates[side.id] = {
          objects: [],
          selectedId: undefined,
        };
      });
      setSideStates(initialStates);
      setActiveSideId(printSpec.sides[0].id);
      saveToHistory(initialStates);
    }
  }, [printSpec]);
  
  // Save state to history
  const saveToHistory = useCallback((states: Record<string, SideState>) => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({
        sideStates: JSON.parse(JSON.stringify(states)), // Deep clone
        timestamp: Date.now(),
      });
      // Limit history size
      if (newHistory.length > maxHistory) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, maxHistory - 1));
  }, [historyIndex]);
  
  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setSideStates(JSON.parse(JSON.stringify(history[newIndex].sideStates)));
    }
  }, [history, historyIndex]);
  
  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setSideStates(JSON.parse(JSON.stringify(history[newIndex].sideStates)));
    }
  }, [history, historyIndex]);
  
  // Get current side
  const currentSide = printSpec?.sides.find(s => s.id === activeSideId);
  const currentState = sideStates[activeSideId] || { objects: [], selectedId: undefined };
  const objects = currentState.objects;
  const selectedObject = selectedId ? objects.find(o => o.id === selectedId) : null;
  
  // Update transformer when selection changes
  useEffect(() => {
    if (!transformerRef.current) return;
    
    const selectedNode = selectedId ? nodeRefs.current[selectedId] : null;
    
    if (selectedNode) {
      transformerRef.current.nodes([selectedNode]);
      transformerRef.current.getLayer()?.batchDraw();
    } else {
      transformerRef.current.nodes([]);
    }
  }, [selectedId, activeSideId]);
  
  // Update object
  const updateObject = useCallback((id: string, updates: Partial<EditorObject>) => {
    setSideStates((prev) => {
      const newStates = { ...prev };
      const sideState = { ...newStates[activeSideId] };
      sideState.objects = sideState.objects.map((obj) =>
        obj.id === id ? { ...obj, ...updates } : obj
      );
      newStates[activeSideId] = sideState;
      saveToHistory(newStates);
      return newStates;
    });
  }, [activeSideId, saveToHistory]);
  
  // Delete object
  const deleteObject = useCallback((id: string) => {
    setSideStates((prev) => {
      const newStates = { ...prev };
      const sideState = { ...newStates[activeSideId] };
      sideState.objects = sideState.objects.filter((obj) => obj.id !== id);
      if (sideState.selectedId === id) {
        sideState.selectedId = undefined;
      }
      newStates[activeSideId] = sideState;
      saveToHistory(newStates);
      return newStates;
    });
    setSelectedId(undefined);
  }, [activeSideId, saveToHistory]);
  
  // Add image
  const handleAddImage = useCallback((asset: UploadedAsset) => {
    if (!currentSide) return;
    
    const img = new window.Image();
    img.onload = () => {
      const imgWidth = asset.width || img.naturalWidth;
      const imgHeight = asset.height || img.naturalHeight;
      
      // Scale to fit in safe zone
      const safeW = currentSide.canvasPx.w - currentSide.safePx * 2;
      const safeH = currentSide.canvasPx.h - currentSide.safePx * 2;
      const scale = Math.min(safeW / imgWidth * 0.8, safeH / imgHeight * 0.8);
      
      const newObject: EditorObject = {
        id: `img-${Date.now()}`,
        type: 'image',
        src: asset.src,
        x: currentSide.safePx + (safeW - imgWidth * scale) / 2,
        y: currentSide.safePx + (safeH - imgHeight * scale) / 2,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        width: imgWidth * scale,
        height: imgHeight * scale,
      };
      
      setSideStates((prev) => {
        const newStates = { ...prev };
        const sideState = { ...newStates[activeSideId] };
        sideState.objects = [...sideState.objects, newObject];
        sideState.selectedId = newObject.id;
        newStates[activeSideId] = sideState;
        saveToHistory(newStates);
        return newStates;
      });
      setSelectedId(newObject.id);
    };
    img.src = asset.src;
  }, [currentSide, activeSideId, saveToHistory]);
  
  // Add text label
  const handleAddText = useCallback(() => {
    if (!currentSide) return;
    
    const newObject: EditorObject = {
      id: `text-${Date.now()}`,
      type: 'text',
      text: 'Your text here',
      x: currentSide.canvasPx.w / 2,
      y: currentSide.canvasPx.h / 2,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      fontFamily: DEFAULT_FONT,
      fontSize: 24,
      fontWeight: DEFAULT_FONT_WEIGHT,
      fill: '#000000',
    };
    
    setSideStates((prev) => {
      const newStates = { ...prev };
      const sideState = { ...newStates[activeSideId] };
      sideState.objects = [...sideState.objects, newObject];
      sideState.selectedId = newObject.id;
      newStates[activeSideId] = sideState;
      saveToHistory(newStates);
      return newStates;
    });
    setSelectedId(newObject.id);
  }, [currentSide, activeSideId, saveToHistory]);
  
  // Add label shape
  const handleAddLabelShape = useCallback((shape: LabelShape) => {
    if (!currentSide) return;
    
    const newObject: EditorObject = {
      id: `label-${Date.now()}`,
      type: 'label-shape',
      text: 'Your text here',
      x: currentSide.canvasPx.w / 2 - shape.width / 2,
      y: currentSide.canvasPx.h / 2 - shape.height / 2,
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
      borderWidth: 2,
      borderColor: '#000000',
    };
    
    setSideStates((prev) => {
      const newStates = { ...prev };
      const sideState = { ...newStates[activeSideId] };
      sideState.objects = [...sideState.objects, newObject];
      sideState.selectedId = newObject.id;
      newStates[activeSideId] = sideState;
      saveToHistory(newStates);
      return newStates;
    });
    setSelectedId(newObject.id);
  }, [currentSide, activeSideId, saveToHistory]);
  
  // File upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      
      const objectUrl = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        const asset: UploadedAsset = {
          id: `asset-${Date.now()}`,
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
        handleAddImage(asset);
      };
      img.src = objectUrl;
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleAddImage]);
  
  // Export
  const handleExport = useCallback(async () => {
    if (!printSpec || !stageRef.current) return;
    
    const exports: Array<{ sideId: string; dataUrl: string; width: number; height: number }> = [];
    
    for (const side of printSpec.sides) {
      setActiveSideId(side.id);
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      const stage = stageRef.current;
      const dataUrl = stage.toDataURL({ pixelRatio: 2 });
      exports.push({
        sideId: side.id,
        dataUrl,
        width: side.canvasPx.w,
        height: side.canvasPx.h,
      });
    }
    
    if (onComplete) {
      onComplete({ productSlug, exports });
    }
  }, [printSpec, onComplete, productSlug]);
  
  if (!printSpec || !currentSide) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600">Loading print specifications...</p>
        </div>
      </div>
    );
  }
  
  const assets = useAssetStore((state) => state.assets);
  const STAGE_WIDTH = currentSide.canvasPx.w;
  const STAGE_HEIGHT = currentSide.canvasPx.h;
  const displayScale = Math.min(800 / STAGE_WIDTH, 600 / STAGE_HEIGHT, 1);
  
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">Project Editor</h1>
          {printSpec.sides.length > 1 && (
            <div className="flex gap-2">
              {printSpec.sides.map((side) => (
                <button
                  key={side.id}
                  onClick={() => {
                    setActiveSideId(side.id);
                    setSelectedId(undefined);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeSideId === side.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {side.id.charAt(0).toUpperCase() + side.id.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
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
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Tools */}
          <div className="p-4 border-b border-gray-200 space-y-2">
            <label className="block w-full">
              <div className="px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold text-center cursor-pointer hover:bg-blue-700 flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Images
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            
            <button
              onClick={handleAddText}
              className="w-full px-4 py-3 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 flex items-center justify-center gap-2"
            >
              <Type className="w-4 h-4" />
              Add Text
            </button>
          </div>
          
          {/* Label Shapes */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Label Shapes</h3>
            <div className="grid grid-cols-2 gap-2">
              {LABEL_SHAPES.map((shape) => (
                <button
                  key={shape.id}
                  onClick={() => handleAddLabelShape(shape)}
                  className="p-2 border border-gray-200 rounded hover:border-blue-400 hover:bg-blue-50 text-left"
                >
                  <div className="text-xs font-medium text-gray-900">{shape.name}</div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Assets */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Your Images</h3>
              {assets.length === 0 ? (
                <p className="text-sm text-gray-500">No images uploaded</p>
              ) : (
                <div className="space-y-2">
                  {assets.map((asset) => (
                    <div key={asset.id} className="relative group">
                      <button
                        onClick={() => handleAddImage(asset)}
                        className="w-full aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400"
                      >
                        <img src={asset.src} alt={asset.name} className="w-full h-full object-cover" />
                      </button>
                      <button
                        onClick={() => useAssetStore.getState().removeAsset(asset.id)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Label Inspector for selected text/label */}
            {selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'label-shape') && (
              <div className="p-4">
                <LabelInspector
                  selectedObject={selectedObject}
                  onUpdate={(updates) => updateObject(selectedObject.id, updates)}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Canvas */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto bg-gray-100">
          <div style={{ transform: `scale(${displayScale})`, transformOrigin: 'center' }}>
            <Stage
              ref={stageRef}
              width={STAGE_WIDTH}
              height={STAGE_HEIGHT}
              onClick={(e) => {
                const clickedOnEmpty = e.target === e.target.getStage();
                if (clickedOnEmpty) {
                  setSelectedId(undefined);
                }
              }}
            >
              <Layer>
                {/* Print Area Guides - Always Visible */}
                {currentSide && (
                  <>
                    {/* Trim Guide - Print Area Boundary */}
                    <Rect
                      x={0}
                      y={0}
                      width={currentSide.canvasPx.w}
                      height={currentSide.canvasPx.h}
                      fill="transparent"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dash={[5, 5]}
                      listening={false}
                    />
                    
                    {/* Safe Zone Guide */}
                    <Rect
                      x={currentSide.safePx}
                      y={currentSide.safePx}
                      width={currentSide.canvasPx.w - currentSide.safePx * 2}
                      height={currentSide.canvasPx.h - currentSide.safePx * 2}
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth={2}
                      dash={[5, 5]}
                      listening={false}
                    />
                    
                    {/* Fold Lines */}
                    {currentSide.foldLines && currentSide.foldLines.map((fold, idx) => (
                      <Line
                        key={`fold-${idx}`}
                        points={[fold.x1, fold.y1, fold.x2, fold.y2]}
                        stroke="#ef4444"
                        strokeWidth={4}
                        dash={[20, 10]}
                        listening={false}
                      />
                    ))}
                  </>
                )}
                
                {/* Objects */}
                {objects.map((object) => {
                  if (object.type === 'image') {
                    return (
                      <ImageObject
                        key={object.id}
                        object={object}
                        isSelected={selectedId === object.id}
                        onSelect={() => setSelectedId(object.id)}
                        onUpdate={(updates) => updateObject(object.id, updates)}
                        onDelete={() => deleteObject(object.id)}
                        nodeRef={(ref) => {
                          if (ref) nodeRefs.current[object.id] = ref;
                        }}
                      />
                    );
                  }
                  
                  if (object.type === 'text' || object.type === 'label-shape') {
                    return (
                      <TextObject
                        key={object.id}
                        object={object}
                        isSelected={selectedId === object.id}
                        onSelect={() => setSelectedId(object.id)}
                        onUpdate={(updates) => updateObject(object.id, updates)}
                        onDelete={() => deleteObject(object.id)}
                        nodeRef={(ref) => {
                          if (ref) nodeRefs.current[object.id] = ref;
                        }}
                      />
                    );
                  }
                  
                  return null;
                })}
                
                {/* Transformer */}
                <Transformer
                  ref={transformerRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    // Limit resize to reasonable bounds
                    if (Math.abs(newBox.width) < 20 || Math.abs(newBox.height) < 20) {
                      return oldBox;
                    }
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

// Image Component
function ImageObject({
  object,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  nodeRef,
}: {
  object: EditorObject;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<EditorObject>) => void;
  onDelete: () => void;
  nodeRef: (ref: any) => void;
}) {
  const [img] = useImage(object.src || '');
  
  if (!img) return null;
  
  return (
    <Group
      ref={nodeRef}
      x={object.x}
      y={object.y}
      scaleX={object.scaleX || 1}
      scaleY={object.scaleY || 1}
      rotation={object.rotation || 0}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        const node = e.target;
        onUpdate({
          x: node.x(),
          y: node.y(),
        });
      }}
      onTransformEnd={(e) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        
        // Apply scale to dimensions
        if (object.width && object.height) {
          onUpdate({
            x: node.x(),
            y: node.y(),
            width: object.width * scaleX,
            height: object.height * scaleY,
            rotation: node.rotation(),
            scaleX: 1,
            scaleY: 1,
          });
          
          // Reset node scale
          node.scaleX(1);
          node.scaleY(1);
        } else {
          onUpdate({
            x: node.x(),
            y: node.y(),
            scaleX,
            scaleY,
            rotation: node.rotation(),
          });
        }
      }}
    >
      <KonvaImage
        image={img}
        x={0}
        y={0}
        width={object.width || 100}
        height={object.height || 100}
      />
      {isSelected && (
        <Group
          x={(object.width || 100) - 15}
          y={-15}
          onClick={(e) => {
            e.cancelBubble = true;
            onDelete();
          }}
        >
          <Rect x={0} y={0} width={30} height={30} fill="red" cornerRadius={15} />
          <KonvaText x={8} y={5} text="X" fontSize={16} fill="white" fontStyle="bold" />
        </Group>
      )}
    </Group>
  );
}

// Text Component
function TextObject({
  object,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  nodeRef,
}: {
  object: EditorObject;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<EditorObject>) => void;
  onDelete: () => void;
  nodeRef: (ref: any) => void;
}) {
  const isLabelShape = object.type === 'label-shape';
  const shapeType = object.labelShapeType;
  
  return (
    <Group
      ref={nodeRef}
      x={object.x}
      y={object.y}
      scaleX={object.scaleX || 1}
      scaleY={object.scaleY || 1}
      rotation={object.rotation || 0}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        const node = e.target;
        onUpdate({
          x: node.x(),
          y: node.y(),
        });
      }}
      onTransformEnd={(e) => {
        const node = e.target;
        onUpdate({
          x: node.x(),
          y: node.y(),
          scaleX: node.scaleX(),
          scaleY: node.scaleY(),
          rotation: node.rotation(),
        });
      }}
    >
      {/* Background shape for label shapes */}
      {isLabelShape && object.width && object.height && (
        <>
          {(shapeType === 'circle' || shapeType === 'oval') ? (
            <Ellipse
              x={object.width / 2}
              y={object.height / 2}
              radiusX={object.width / 2}
              radiusY={object.height / 2}
              fill={object.backgroundColor || '#ffffff'}
              stroke={object.borderEnabled ? (object.borderColor || '#000000') : undefined}
              strokeWidth={object.borderWidth || 2}
            />
          ) : (
            <Rect
              x={0}
              y={0}
              width={object.width}
              height={object.height}
              fill={object.backgroundColor || '#ffffff'}
              cornerRadius={object.cornerRadius || 0}
              stroke={object.borderEnabled ? (object.borderColor || '#000000') : undefined}
              strokeWidth={object.borderWidth || 2}
            />
          )}
        </>
      )}
      
      {/* Text */}
      <KonvaText
        x={isLabelShape && object.width ? object.width / 2 : 0}
        y={isLabelShape && object.height ? object.height / 2 : 0}
        text={object.text || 'Text'}
        fontSize={object.fontSize || 24}
        fontFamily={object.fontFamily || DEFAULT_FONT}
        fontStyle={object.fontWeight && object.fontWeight >= 600 ? 'bold' : 'normal'}
        fill={object.fill || '#000000'}
        align="center"
        verticalAlign="middle"
        width={isLabelShape && object.width ? object.width : undefined}
        height={isLabelShape && object.height ? object.height : undefined}
        offsetX={isLabelShape && object.width ? object.width / 2 : 0}
        offsetY={isLabelShape && object.height ? object.height / 2 : 0}
      />
      
      {isSelected && (
        <Group
          x={isLabelShape && object.width ? object.width - 15 : 100}
          y={-15}
          onClick={(e) => {
            e.cancelBubble = true;
            onDelete();
          }}
        >
          <Rect x={0} y={0} width={30} height={30} fill="red" cornerRadius={15} />
          <KonvaText x={8} y={5} text="X" fontSize={16} fill="white" fontStyle="bold" />
        </Group>
      )}
    </Group>
  );
}

