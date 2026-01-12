"use client";

/**
 * Design Studio - Full-Featured Image Editor
 * Uses Fabric.js for canvas manipulation
 * All features work without external API keys
 * 
 * © 2026 B&D Servicing LLC. All rights reserved.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import * as fabric from 'fabric';
import {
  Image as ImageIcon, Type, Square, Circle, Trash2, 
  ZoomIn, ZoomOut, Download, ArrowRight, X,
  Layers, Upload, ChevronLeft, Bold, Italic,
  Copy, Undo2, Redo2, FlipHorizontal, FlipVertical,
  RotateCw, AlignLeft, AlignCenter, AlignRight,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  Triangle, Star, Heart, Minus, ArrowRightCircle,
  Hexagon, Diamond, Grid3X3, Palette, SlidersHorizontal,
  Lock, Unlock, Eye, EyeOff
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface ProductSpec {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  category: string;
  requiresQR?: boolean;
}

interface DesignStudioProps {
  product: ProductSpec;
  onComplete: (designData: DesignOutput) => void;
  onClose?: () => void;
  onBack?: () => void;
}

interface DesignOutput {
  imageDataUrl: string;
  imageBlob: Blob;
  dimensions: { width: number; height: number };
  dpi: number;
  productId: string;
  productName: string;
}

interface HistoryState {
  json: string;
  timestamp: number;
}

// =============================================================================
// BRAND COLORS
// =============================================================================

const BRAND = {
  lightest: '#f3f3f3',
  light: '#ded8d3',
  medium: '#918c86',
  dark: '#000000',
  accent: '#e0c9af',
  white: '#ffffff',
};

// Preset colors for quick selection
const COLOR_PRESETS = [
  '#ffffff', '#000000', '#f3f3f3', '#ded8d3', '#918c86', '#e0c9af',
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6',
  '#ec4899', '#14b8a6', '#6366f1', '#a855f7', '#f43f5e', '#0ea5e9',
];

// =============================================================================
// SHAPE PATHS (SVG paths for custom shapes)
// =============================================================================

const SHAPE_PATHS = {
  heart: 'M 50,30 C 50,20 40,10 25,10 C 10,10 0,25 0,40 C 0,60 25,80 50,100 C 75,80 100,60 100,40 C 100,25 90,10 75,10 C 60,10 50,20 50,30 Z',
  star: 'M 50,0 L 61,35 L 98,35 L 68,57 L 79,91 L 50,70 L 21,91 L 32,57 L 2,35 L 39,35 Z',
  diamond: 'M 50,0 L 100,50 L 50,100 L 0,50 Z',
  hexagon: 'M 25,0 L 75,0 L 100,50 L 75,100 L 25,100 L 0,50 Z',
  arrow: 'M 0,40 L 60,40 L 60,20 L 100,50 L 60,80 L 60,60 L 0,60 Z',
  pentagon: 'M 50,0 L 100,38 L 81,100 L 19,100 L 0,38 Z',
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function DesignStudio({
  product,
  onComplete,
  onClose,
  onBack,
}: DesignStudioProps) {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [activePanel, setActivePanel] = useState<'images' | 'text' | 'shapes' | 'adjust'>('images');
  const [zoom, setZoom] = useState(100);
  const [selectedObject, setSelectedObject] = useState<fabric.FabricObject | null>(null);
  const [uploadedImages, setUploadedImages] = useState<Array<{ id: string; src: string; name: string }>>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState(BRAND.white);
  
  // History for undo/redo
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedo = useRef(false);
  
  // Text settings
  const [textSettings, setTextSettings] = useState({
    fontFamily: 'Georgia',
    fontSize: 32,
    fill: BRAND.dark,
    fontWeight: 'normal' as 'normal' | 'bold',
    fontStyle: 'normal' as 'normal' | 'italic',
  });
  
  // Shape settings (default: white, no border)
  const [shapeSettings, setShapeSettings] = useState({
    fill: BRAND.white,
    stroke: 'transparent',
    strokeWidth: 0,
  });

  // Constants
  const DPI = 300;
  const displayScale = 0.35;
  const canvasWidthPx = Math.round((product.widthMm / 25.4) * DPI);
  const canvasHeightPx = Math.round((product.heightMm / 25.4) * DPI);

  // =============================================================================
  // CANVAS INITIALIZATION
  // =============================================================================

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: canvasWidthPx * displayScale,
      height: canvasHeightPx * displayScale,
      backgroundColor: backgroundColor,
      selection: true,
      preserveObjectStacking: true,
    });

    fabricCanvasRef.current = canvas;

    // Event handlers
    canvas.on('selection:created', (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });
    canvas.on('selection:updated', (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });
    canvas.on('selection:cleared', () => {
      setSelectedObject(null);
    });
    
    // Save to history after modifications
    canvas.on('object:modified', () => saveToHistory());
    canvas.on('object:added', () => {
      if (!isUndoRedo.current) saveToHistory();
    });
    canvas.on('object:removed', () => {
      if (!isUndoRedo.current) saveToHistory();
    });

    // Draw guides
    drawGuides(canvas);
    
    // Initial history state
    saveToHistory();

    return () => {
      canvas.dispose();
    };
  }, [canvasWidthPx, canvasHeightPx]);

  // Update background color
  useEffect(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.backgroundColor = backgroundColor;
      fabricCanvasRef.current.requestRenderAll();
    }
  }, [backgroundColor]);

  // Draw guides
  const drawGuides = (canvas: fabric.Canvas) => {
    const safePx = Math.round((5 / 25.4) * DPI * displayScale);

    const safeRect = new fabric.Rect({
      left: safePx,
      top: safePx,
      width: canvas.width! - (safePx * 2),
      height: canvas.height! - (safePx * 2),
      fill: 'transparent',
      stroke: BRAND.medium,
      strokeWidth: 1,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
      excludeFromExport: true,
    });
    canvas.add(safeRect);
    canvas.sendObjectToBack(safeRect);
  };

  // =============================================================================
  // HISTORY (UNDO/REDO)
  // =============================================================================

  const saveToHistory = useCallback(() => {
    if (!fabricCanvasRef.current || isUndoRedo.current) return;
    
    const json = JSON.stringify(fabricCanvasRef.current.toJSON());
    
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ json, timestamp: Date.now() });
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex <= 0 || !fabricCanvasRef.current) return;
    
    isUndoRedo.current = true;
    const newIndex = historyIndex - 1;
    const state = history[newIndex];
    
    fabricCanvasRef.current.loadFromJSON(JSON.parse(state.json)).then(() => {
      fabricCanvasRef.current?.requestRenderAll();
      setHistoryIndex(newIndex);
      setSelectedObject(null);
      isUndoRedo.current = false;
    });
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1 || !fabricCanvasRef.current) return;
    
    isUndoRedo.current = true;
    const newIndex = historyIndex + 1;
    const state = history[newIndex];
    
    fabricCanvasRef.current.loadFromJSON(JSON.parse(state.json)).then(() => {
      fabricCanvasRef.current?.requestRenderAll();
      setHistoryIndex(newIndex);
      setSelectedObject(null);
      isUndoRedo.current = false;
    });
  }, [historyIndex, history]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        redo();
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedObject) {
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          deleteSelected();
        }
      }
      if (e.ctrlKey && e.key === 'd' && selectedObject) {
        e.preventDefault();
        duplicateSelected();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedObject]);

  // =============================================================================
  // IMAGE HANDLING
  // =============================================================================

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const id = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setUploadedImages(prev => [...prev, { id, src: dataUrl, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
    
    e.target.value = '';
  };

  const addImageToCanvas = async (src: string) => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;

    try {
      const img = await fabric.Image.fromURL(src);
      
      const maxWidth = canvas.width! * 0.7;
      const maxHeight = canvas.height! * 0.7;
      const scale = Math.min(maxWidth / (img.width || 100), maxHeight / (img.height || 100));
      
      img.set({
        left: canvas.width! / 2,
        top: canvas.height! / 2,
        originX: 'center',
        originY: 'center',
        scaleX: scale,
        scaleY: scale,
      });

      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.requestRenderAll();
    } catch (error) {
      console.error('Failed to add image:', error);
    }
  };

  // =============================================================================
  // TEXT
  // =============================================================================

  const addText = () => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;

    const text = new fabric.IText('Your text here', {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: 'center',
      originY: 'center',
      fontFamily: textSettings.fontFamily,
      fontSize: textSettings.fontSize * displayScale,
      fill: textSettings.fill,
      fontWeight: textSettings.fontWeight,
      fontStyle: textSettings.fontStyle,
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.requestRenderAll();
  };

  // =============================================================================
  // SHAPES
  // =============================================================================

  const addShape = (type: string) => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;

    let shape: fabric.FabricObject;
    const size = Math.min(canvas.width!, canvas.height!) * 0.2;
    const baseProps = {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: 'center' as const,
      originY: 'center' as const,
      fill: shapeSettings.fill,
      stroke: shapeSettings.stroke,
      strokeWidth: shapeSettings.strokeWidth,
    };

    switch (type) {
      case 'rect':
        shape = new fabric.Rect({ ...baseProps, width: size, height: size * 0.75 });
        break;
      case 'circle':
        shape = new fabric.Circle({ ...baseProps, radius: size / 2 });
        break;
      case 'triangle':
        shape = new fabric.Triangle({ ...baseProps, width: size, height: size });
        break;
      case 'line':
        shape = new fabric.Line([0, 0, size * 1.5, 0], {
          ...baseProps,
          stroke: BRAND.dark,
          strokeWidth: 3,
          fill: undefined,
        });
        break;
      case 'heart':
      case 'star':
      case 'diamond':
      case 'hexagon':
      case 'arrow':
      case 'pentagon':
        const pathData = SHAPE_PATHS[type as keyof typeof SHAPE_PATHS];
        shape = new fabric.Path(pathData, {
          ...baseProps,
          scaleX: size / 100,
          scaleY: size / 100,
        });
        break;
      default:
        return;
    }

    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.requestRenderAll();
  };

  // =============================================================================
  // OBJECT ACTIONS
  // =============================================================================

  const deleteSelected = () => {
    if (!fabricCanvasRef.current || !selectedObject) return;
    fabricCanvasRef.current.remove(selectedObject);
    fabricCanvasRef.current.requestRenderAll();
    setSelectedObject(null);
  };

  const duplicateSelected = () => {
    if (!fabricCanvasRef.current || !selectedObject) return;
    const canvas = fabricCanvasRef.current;

    selectedObject.clone().then((cloned: fabric.FabricObject) => {
      cloned.set({ left: (cloned.left || 0) + 20, top: (cloned.top || 0) + 20 });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.requestRenderAll();
    });
  };

  const flipHorizontal = () => {
    if (!selectedObject || !fabricCanvasRef.current) return;
    selectedObject.set('flipX', !selectedObject.flipX);
    fabricCanvasRef.current.requestRenderAll();
    saveToHistory();
  };

  const flipVertical = () => {
    if (!selectedObject || !fabricCanvasRef.current) return;
    selectedObject.set('flipY', !selectedObject.flipY);
    fabricCanvasRef.current.requestRenderAll();
    saveToHistory();
  };

  const rotate90 = () => {
    if (!selectedObject || !fabricCanvasRef.current) return;
    selectedObject.rotate((selectedObject.angle || 0) + 90);
    fabricCanvasRef.current.requestRenderAll();
    saveToHistory();
  };

  const alignObject = (alignment: string) => {
    if (!selectedObject || !fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;
    const obj = selectedObject;

    switch (alignment) {
      case 'left':
        obj.set('left', (obj.width! * (obj.scaleX || 1)) / 2);
        break;
      case 'center':
        obj.set('left', canvas.width! / 2);
        break;
      case 'right':
        obj.set('left', canvas.width! - (obj.width! * (obj.scaleX || 1)) / 2);
        break;
      case 'top':
        obj.set('top', (obj.height! * (obj.scaleY || 1)) / 2);
        break;
      case 'middle':
        obj.set('top', canvas.height! / 2);
        break;
      case 'bottom':
        obj.set('top', canvas.height! - (obj.height! * (obj.scaleY || 1)) / 2);
        break;
    }
    
    obj.setCoords();
    canvas.requestRenderAll();
    saveToHistory();
  };

  const bringForward = () => {
    if (!fabricCanvasRef.current || !selectedObject) return;
    fabricCanvasRef.current.bringObjectForward(selectedObject);
    fabricCanvasRef.current.requestRenderAll();
  };

  const sendBackward = () => {
    if (!fabricCanvasRef.current || !selectedObject) return;
    fabricCanvasRef.current.sendObjectBackwards(selectedObject);
    fabricCanvasRef.current.requestRenderAll();
  };

  const setOpacity = (value: number) => {
    if (!selectedObject || !fabricCanvasRef.current) return;
    selectedObject.set('opacity', value);
    fabricCanvasRef.current.requestRenderAll();
  };

  // =============================================================================
  // IMAGE FILTERS
  // =============================================================================

  const applyFilter = (filterType: string) => {
    if (!selectedObject || !fabricCanvasRef.current) return;
    if (!(selectedObject instanceof fabric.Image)) return;

    const img = selectedObject as fabric.Image;
    
    // Clear existing filters
    img.filters = [];
    
    switch (filterType) {
      case 'grayscale':
        img.filters.push(new fabric.filters.Grayscale());
        break;
      case 'sepia':
        img.filters.push(new fabric.filters.Sepia());
        break;
      case 'brightness':
        img.filters.push(new fabric.filters.Brightness({ brightness: 0.2 }));
        break;
      case 'contrast':
        img.filters.push(new fabric.filters.Contrast({ contrast: 0.2 }));
        break;
      case 'blur':
        img.filters.push(new fabric.filters.Blur({ blur: 0.2 }));
        break;
      case 'none':
      default:
        // No filter
        break;
    }
    
    img.applyFilters();
    fabricCanvasRef.current.requestRenderAll();
    saveToHistory();
  };

  // =============================================================================
  // ZOOM
  // =============================================================================

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.max(25, Math.min(200, prev + delta)));
  };

  // =============================================================================
  // EXPORT
  // =============================================================================

  const handleSaveAndContinue = async () => {
    if (!fabricCanvasRef.current) return;
    setIsSaving(true);

    try {
      const multiplier = 1 / displayScale;
      const dataUrl = fabricCanvasRef.current.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: multiplier,
      });

      const response = await fetch(dataUrl);
      const blob = await response.blob();

      onComplete({
        imageDataUrl: dataUrl,
        imageBlob: blob,
        dimensions: { width: canvasWidthPx, height: canvasHeightPx },
        dpi: DPI,
        productId: product.id,
        productName: product.name,
      });
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to save design. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  const isImageSelected = selectedObject instanceof fabric.Image;

  return (
    <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: BRAND.lightest }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b" style={{ backgroundColor: BRAND.white, borderColor: BRAND.light }}>
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 rounded-lg transition-colors hover:bg-gray-100">
              <ChevronLeft className="w-5 h-5" style={{ color: BRAND.medium }} />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold" style={{ color: BRAND.dark, fontFamily: 'Georgia, serif' }}>
              Design Studio
            </h1>
            <p className="text-xs" style={{ color: BRAND.medium }}>
              {product.name} • {product.widthMm}×{product.heightMm}mm
            </p>
          </div>
        </div>

        {/* Center toolbar */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ backgroundColor: BRAND.lightest }}>
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-2 rounded transition-colors disabled:opacity-30"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-5 h-5" style={{ color: BRAND.dark }} />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 rounded transition-colors disabled:opacity-30"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-5 h-5" style={{ color: BRAND.dark }} />
          </button>
          <div className="w-px h-6 mx-1" style={{ backgroundColor: BRAND.light }} />
          <button onClick={() => handleZoom(-10)} className="p-2 rounded transition-colors hover:bg-white">
            <ZoomOut className="w-5 h-5" style={{ color: BRAND.medium }} />
          </button>
          <span className="text-sm font-medium w-12 text-center" style={{ color: BRAND.dark }}>{zoom}%</span>
          <button onClick={() => handleZoom(10)} className="p-2 rounded transition-colors hover:bg-white">
            <ZoomIn className="w-5 h-5" style={{ color: BRAND.medium }} />
          </button>
          <div className="w-px h-6 mx-1" style={{ backgroundColor: BRAND.light }} />
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded transition-colors ${showGrid ? 'bg-white' : ''}`}
            title="Toggle Grid"
          >
            <Grid3X3 className="w-5 h-5" style={{ color: showGrid ? BRAND.dark : BRAND.medium }} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button onClick={onClose} className="px-3 py-2 rounded-lg text-sm" style={{ color: BRAND.medium }}>
              Cancel
            </button>
          )}
          <button
            onClick={handleSaveAndContinue}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all text-sm"
            style={{ backgroundColor: BRAND.dark, color: BRAND.white, opacity: isSaving ? 0.7 : 1 }}
          >
            {isSaving ? 'Saving...' : 'Save & Continue'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-64 border-r overflow-y-auto flex flex-col" style={{ backgroundColor: BRAND.white, borderColor: BRAND.light }}>
          {/* Panel Tabs */}
          <div className="flex border-b" style={{ borderColor: BRAND.light }}>
            {[
              { id: 'images', icon: ImageIcon, label: 'Images' },
              { id: 'text', icon: Type, label: 'Text' },
              { id: 'shapes', icon: Square, label: 'Shapes' },
              { id: 'adjust', icon: SlidersHorizontal, label: 'Adjust' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivePanel(tab.id as typeof activePanel)}
                className="flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors text-xs"
                style={{ 
                  backgroundColor: activePanel === tab.id ? BRAND.lightest : 'transparent',
                  color: activePanel === tab.id ? BRAND.dark : BRAND.medium,
                  borderBottom: activePanel === tab.id ? `2px solid ${BRAND.dark}` : '2px solid transparent',
                }}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="p-3 flex-1 overflow-y-auto">
            {/* Images Panel */}
            {activePanel === 'images' && (
              <div className="space-y-3">
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed transition-colors text-sm"
                  style={{ borderColor: BRAND.medium, color: BRAND.medium }}
                >
                  <Upload className="w-5 h-5" />
                  <span className="font-medium">Upload Images</span>
                </button>

                {uploadedImages.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold mb-2" style={{ color: BRAND.dark }}>Your Images</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {uploadedImages.map((img) => (
                        <button
                          key={img.id}
                          onClick={() => addImageToCanvas(img.src)}
                          className="aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105"
                          style={{ borderColor: BRAND.light }}
                        >
                          <img src={img.src} alt={img.name} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Text Panel */}
            {activePanel === 'text' && (
              <div className="space-y-3">
                <button
                  onClick={addText}
                  className="w-full py-2.5 rounded-lg font-semibold transition-colors text-sm"
                  style={{ backgroundColor: BRAND.dark, color: BRAND.white }}
                >
                  + Add Text
                </button>

                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: BRAND.medium }}>Font</label>
                    <select
                      value={textSettings.fontFamily}
                      onChange={(e) => setTextSettings(p => ({ ...p, fontFamily: e.target.value }))}
                      className="w-full px-2 py-1.5 rounded border text-sm"
                      style={{ borderColor: BRAND.light }}
                    >
                      <option value="Georgia">Georgia</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Arial">Arial</option>
                      <option value="Verdana">Verdana</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Impact">Impact</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: BRAND.medium }}>Size</label>
                      <input
                        type="number"
                        value={textSettings.fontSize}
                        onChange={(e) => setTextSettings(p => ({ ...p, fontSize: parseInt(e.target.value) || 32 }))}
                        className="w-full px-2 py-1.5 rounded border text-sm"
                        style={{ borderColor: BRAND.light }}
                        min={8}
                        max={200}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: BRAND.medium }}>Color</label>
                      <input
                        type="color"
                        value={textSettings.fill}
                        onChange={(e) => setTextSettings(p => ({ ...p, fill: e.target.value }))}
                        className="w-full h-8 rounded cursor-pointer border"
                        style={{ borderColor: BRAND.light }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => setTextSettings(p => ({ ...p, fontWeight: p.fontWeight === 'bold' ? 'normal' : 'bold' }))}
                      className="flex-1 py-1.5 rounded border-2 transition-colors"
                      style={{ 
                        borderColor: textSettings.fontWeight === 'bold' ? BRAND.dark : BRAND.light,
                        backgroundColor: textSettings.fontWeight === 'bold' ? BRAND.lightest : 'transparent',
                      }}
                    >
                      <Bold className="w-4 h-4 mx-auto" />
                    </button>
                    <button
                      onClick={() => setTextSettings(p => ({ ...p, fontStyle: p.fontStyle === 'italic' ? 'normal' : 'italic' }))}
                      className="flex-1 py-1.5 rounded border-2 transition-colors"
                      style={{ 
                        borderColor: textSettings.fontStyle === 'italic' ? BRAND.dark : BRAND.light,
                        backgroundColor: textSettings.fontStyle === 'italic' ? BRAND.lightest : 'transparent',
                      }}
                    >
                      <Italic className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Shapes Panel */}
            {activePanel === 'shapes' && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold" style={{ color: BRAND.dark }}>Basic Shapes</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'rect', icon: Square, label: 'Rectangle' },
                    { type: 'circle', icon: Circle, label: 'Circle' },
                    { type: 'triangle', icon: Triangle, label: 'Triangle' },
                    { type: 'line', icon: Minus, label: 'Line' },
                    { type: 'star', icon: Star, label: 'Star' },
                    { type: 'heart', icon: Heart, label: 'Heart' },
                    { type: 'diamond', icon: Diamond, label: 'Diamond' },
                    { type: 'hexagon', icon: Hexagon, label: 'Hexagon' },
                    { type: 'arrow', icon: ArrowRightCircle, label: 'Arrow' },
                  ].map((shape) => (
                    <button
                      key={shape.type}
                      onClick={() => addShape(shape.type)}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors hover:bg-gray-50"
                      style={{ borderColor: BRAND.light }}
                    >
                      <shape.icon className="w-5 h-5" style={{ color: BRAND.dark }} />
                      <span className="text-[10px]" style={{ color: BRAND.medium }}>{shape.label}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t" style={{ borderColor: BRAND.light }}>
                  <h3 className="text-xs font-semibold mb-2" style={{ color: BRAND.dark }}>Shape Style</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs" style={{ color: BRAND.medium }}>Fill Color</label>
                      <div className="flex gap-1 flex-wrap mt-1">
                        {COLOR_PRESETS.slice(0, 12).map((color) => (
                          <button
                            key={color}
                            onClick={() => setShapeSettings(p => ({ ...p, fill: color }))}
                            className="w-6 h-6 rounded border-2 transition-transform hover:scale-110"
                            style={{ 
                              backgroundColor: color,
                              borderColor: shapeSettings.fill === color ? BRAND.dark : BRAND.light,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={shapeSettings.strokeWidth > 0}
                        onChange={(e) => setShapeSettings(p => ({ 
                          ...p, 
                          strokeWidth: e.target.checked ? 2 : 0,
                          stroke: e.target.checked ? BRAND.dark : 'transparent',
                        }))}
                        className="rounded"
                      />
                      <label className="text-xs" style={{ color: BRAND.medium }}>Add Border</label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Adjust Panel */}
            {activePanel === 'adjust' && (
              <div className="space-y-3">
                {/* Background Color */}
                <div>
                  <h3 className="text-xs font-semibold mb-2" style={{ color: BRAND.dark }}>Background</h3>
                  <div className="flex gap-1 flex-wrap">
                    {COLOR_PRESETS.slice(0, 12).map((color) => (
                      <button
                        key={color}
                        onClick={() => setBackgroundColor(color)}
                        className="w-6 h-6 rounded border-2 transition-transform hover:scale-110"
                        style={{ 
                          backgroundColor: color,
                          borderColor: backgroundColor === color ? BRAND.dark : BRAND.light,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Selected Object Controls */}
                {selectedObject && (
                  <>
                    <div className="pt-2 border-t" style={{ borderColor: BRAND.light }}>
                      <h3 className="text-xs font-semibold mb-2" style={{ color: BRAND.dark }}>Transform</h3>
                      <div className="grid grid-cols-4 gap-1">
                        <button onClick={flipHorizontal} className="p-2 rounded hover:bg-gray-100" title="Flip Horizontal">
                          <FlipHorizontal className="w-4 h-4 mx-auto" style={{ color: BRAND.dark }} />
                        </button>
                        <button onClick={flipVertical} className="p-2 rounded hover:bg-gray-100" title="Flip Vertical">
                          <FlipVertical className="w-4 h-4 mx-auto" style={{ color: BRAND.dark }} />
                        </button>
                        <button onClick={rotate90} className="p-2 rounded hover:bg-gray-100" title="Rotate 90°">
                          <RotateCw className="w-4 h-4 mx-auto" style={{ color: BRAND.dark }} />
                        </button>
                        <button onClick={duplicateSelected} className="p-2 rounded hover:bg-gray-100" title="Duplicate">
                          <Copy className="w-4 h-4 mx-auto" style={{ color: BRAND.dark }} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-semibold mb-2" style={{ color: BRAND.dark }}>Align</h3>
                      <div className="grid grid-cols-3 gap-1 mb-1">
                        <button onClick={() => alignObject('left')} className="p-2 rounded hover:bg-gray-100" title="Align Left">
                          <AlignLeft className="w-4 h-4 mx-auto" style={{ color: BRAND.dark }} />
                        </button>
                        <button onClick={() => alignObject('center')} className="p-2 rounded hover:bg-gray-100" title="Align Center">
                          <AlignCenter className="w-4 h-4 mx-auto" style={{ color: BRAND.dark }} />
                        </button>
                        <button onClick={() => alignObject('right')} className="p-2 rounded hover:bg-gray-100" title="Align Right">
                          <AlignRight className="w-4 h-4 mx-auto" style={{ color: BRAND.dark }} />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <button onClick={() => alignObject('top')} className="p-2 rounded hover:bg-gray-100" title="Align Top">
                          <AlignStartVertical className="w-4 h-4 mx-auto" style={{ color: BRAND.dark }} />
                        </button>
                        <button onClick={() => alignObject('middle')} className="p-2 rounded hover:bg-gray-100" title="Align Middle">
                          <AlignCenterVertical className="w-4 h-4 mx-auto" style={{ color: BRAND.dark }} />
                        </button>
                        <button onClick={() => alignObject('bottom')} className="p-2 rounded hover:bg-gray-100" title="Align Bottom">
                          <AlignEndVertical className="w-4 h-4 mx-auto" style={{ color: BRAND.dark }} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-semibold mb-2" style={{ color: BRAND.dark }}>Layers</h3>
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          onClick={bringForward}
                          className="py-1.5 px-2 rounded text-xs hover:bg-gray-100"
                          style={{ backgroundColor: BRAND.lightest, color: BRAND.dark }}
                        >
                          ↑ Forward
                        </button>
                        <button
                          onClick={sendBackward}
                          className="py-1.5 px-2 rounded text-xs hover:bg-gray-100"
                          style={{ backgroundColor: BRAND.lightest, color: BRAND.dark }}
                        >
                          ↓ Backward
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold" style={{ color: BRAND.dark }}>
                        Opacity: {Math.round((selectedObject.opacity || 1) * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={selectedObject.opacity || 1}
                        onChange={(e) => setOpacity(parseFloat(e.target.value))}
                        className="w-full mt-1"
                      />
                    </div>

                    {/* Image Filters */}
                    {isImageSelected && (
                      <div>
                        <h3 className="text-xs font-semibold mb-2" style={{ color: BRAND.dark }}>Filters</h3>
                        <div className="grid grid-cols-3 gap-1">
                          {['none', 'grayscale', 'sepia', 'brightness', 'contrast', 'blur'].map((filter) => (
                            <button
                              key={filter}
                              onClick={() => applyFilter(filter)}
                              className="py-1.5 px-1 rounded text-[10px] capitalize hover:bg-gray-100"
                              style={{ backgroundColor: BRAND.lightest, color: BRAND.dark }}
                            >
                              {filter}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={deleteSelected}
                      className="w-full py-2 rounded-lg text-sm font-medium"
                      style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
                    >
                      <Trash2 className="w-4 h-4 inline mr-2" />
                      Delete
                    </button>
                  </>
                )}

                {!selectedObject && (
                  <p className="text-xs text-center py-4" style={{ color: BRAND.medium }}>
                    Select an object to adjust
                  </p>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Canvas Area */}
        <main className="flex-1 flex items-center justify-center overflow-auto p-6" style={{ backgroundColor: '#e5e5e5' }}>
          <div 
            className="shadow-2xl rounded-lg overflow-hidden relative"
            style={{ 
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'center center',
            }}
          >
            {showGrid && (
              <div 
                className="absolute inset-0 pointer-events-none z-10"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px',
                }}
              />
            )}
            <canvas ref={canvasRef} />
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-between px-4 py-2 border-t text-xs" style={{ backgroundColor: BRAND.white, borderColor: BRAND.light, color: BRAND.medium }}>
        <div className="flex items-center gap-4">
          <span>Safe Zone: Keep important content inside the dashed line</span>
        </div>
        <div>
          {canvasWidthPx} × {canvasHeightPx} px @ {DPI} DPI
        </div>
      </footer>
    </div>
  );
}
