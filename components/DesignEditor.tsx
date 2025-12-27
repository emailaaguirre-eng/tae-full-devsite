"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import * as fabric from 'fabric';
import {
  LayoutGrid, Image as ImageIcon, Type, Frame, Square, Circle, Heart, Star,
  Undo2, Redo2, Trash2, ZoomIn, ZoomOut, X, Check, Upload, Bold, Italic,
  Layers, Aperture, Palette
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface StudioProps {
  productType: 'canvas' | 'print' | 'card' | 'poster' | 'photobook' | 'invitation' | 'announcement' | 'postcard';
  productSize: { width: number; height: number; name: string };
  onComplete: (designData: DesignOutput) => void;
  onClose?: () => void;
  initialImages?: string[];
  initialMessage?: string;
  frameColor?: string;
}

interface DesignOutput {
  imageDataUrl: string;
  imageBlob: Blob;
  dimensions: { width: number; height: number };
  dpi: number;
  productType: string;
  productSize: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function DesignEditor({
  productType = 'card',
  productSize = { width: 600, height: 900, name: '6x9' },
  onComplete,
  onClose,
  initialImages = [],
  frameColor
}: StudioProps) {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  
  // State
  const [activeTab, setActiveTab] = useState<'images' | 'text' | 'labels' | 'shapes'>('images');
  const [uploadedImages, setUploadedImages] = useState<string[]>(initialImages);
  const [zoom, setZoom] = useState(100);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Text settings
  const [textSettings, setTextSettings] = useState({
    fontFamily: 'Arial',
    fontSize: 24,
    fill: '#000000',
    fontWeight: 'normal',
    fontStyle: 'normal',
  });
  
  // Shape settings
  const [shapeSettings, setShapeSettings] = useState({
    fill: '#ffffff',
    stroke: '#000000',
    strokeWidth: 2,
  });

  // Constants
  const DPI = 300;
  const displayScale = 0.5; // Scale down for display
  const canvasWidth = (productSize.width / 25.4) * DPI; // Convert inches to pixels
  const canvasHeight = (productSize.height / 25.4) * DPI;
  const isFoldedProduct = ['card', 'invitation', 'announcement'].includes(productType);

  // =============================================================================
  // CANVAS INITIALIZATION
  // =============================================================================

  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: canvasWidth * displayScale,
        height: canvasHeight * displayScale,
        backgroundColor: '#ffffff',
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

      // Draw printable area guides
      drawPrintableArea(canvas);

      // Save initial state
      saveState();

      return () => {
        canvas.dispose();
      };
    } catch (error) {
      console.error('Error initializing canvas:', error);
    }
  }, [canvasWidth, canvasHeight]);

  // Draw printable area guides
  const drawPrintableArea = (canvas: fabric.Canvas) => {
    const bleed = 0.125 * DPI * displayScale;
    const safeArea = 0.25 * DPI * displayScale;

    if (isFoldedProduct) {
      // Cards: 4 regions
      const regionWidth = canvas.width! / 2;
      const regionHeight = canvas.height! / 2;

      // Front
      const frontRect = new fabric.Rect({
        left: bleed,
        top: bleed,
        width: regionWidth - (bleed * 2),
        height: regionHeight - (bleed * 2),
        fill: 'transparent',
        stroke: '#3b82f6',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
      });
      canvas.add(frontRect);

      // Back
      const backRect = new fabric.Rect({
        left: regionWidth + bleed,
        top: bleed,
        width: regionWidth - (bleed * 2),
        height: regionHeight - (bleed * 2),
        fill: 'transparent',
        stroke: '#3b82f6',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
      });
      canvas.add(backRect);

      // Inside Left
      const insideLeft = new fabric.Rect({
        left: bleed,
        top: regionHeight + bleed,
        width: regionWidth - (bleed * 2),
        height: regionHeight - (bleed * 2),
        fill: 'transparent',
        stroke: '#3b82f6',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
      });
      canvas.add(insideLeft);

      // Inside Right
      const insideRight = new fabric.Rect({
        left: regionWidth + bleed,
        top: regionHeight + bleed,
        width: regionWidth - (bleed * 2),
        height: regionHeight - (bleed * 2),
        fill: 'transparent',
        stroke: '#3b82f6',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
      });
      canvas.add(insideRight);

      // Labels
      const frontLabel = new fabric.Text('Front', {
        left: 10,
        top: 10,
        fontSize: 12,
        fill: '#3b82f6',
        fontFamily: 'Arial',
        selectable: false,
        evented: false,
      });
      canvas.add(frontLabel);

      const backLabel = new fabric.Text('Back', {
        left: regionWidth + 10,
        top: 10,
        fontSize: 12,
        fill: '#3b82f6',
        fontFamily: 'Arial',
        selectable: false,
        evented: false,
      });
      canvas.add(backLabel);
    } else {
      // Single printable area
      const printableRect = new fabric.Rect({
        left: bleed,
        top: bleed,
        width: canvas.width! - (bleed * 2),
        height: canvas.height! - (bleed * 2),
        fill: 'transparent',
        stroke: '#3b82f6',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
      });
      canvas.add(printableRect);

      // Safe area
      const safeRect = new fabric.Rect({
        left: safeArea,
        top: safeArea,
        width: canvas.width! - (safeArea * 2),
        height: canvas.height! - (safeArea * 2),
        fill: 'transparent',
        stroke: '#10b981',
        strokeWidth: 1,
        strokeDashArray: [3, 3],
        selectable: false,
        evented: false,
      });
      canvas.add(safeRect);
    }

    // Frame visualization (if applicable)
    if (frameColor && productType === 'print') {
      const frameWidth = 20 * displayScale;
      const frameColorMap: Record<string, string> = {
        'Black': '#1a1a1a',
        'White': '#f5f5f5',
        'Silver': '#c0c0c0'
      };
      const frameFill = frameColorMap[frameColor] || '#888888';

      const outerFrame = new fabric.Rect({
        left: -frameWidth,
        top: -frameWidth,
        width: canvas.width! + (frameWidth * 2),
        height: canvas.height! + (frameWidth * 2),
        fill: frameFill,
        stroke: '#000000',
        strokeWidth: 2,
        selectable: false,
        evented: false,
      });
      canvas.add(outerFrame);
    }

    canvas.renderAll();
  };

  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================

  const saveState = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    const state = JSON.stringify(fabricCanvasRef.current.toJSON());
    setHistory(prev => [...prev.slice(0, historyIndex + 1), state]);
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const undo = () => {
    if (!fabricCanvasRef.current || historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    const state = history[newIndex];
    fabricCanvasRef.current.loadFromJSON(state, () => {
      fabricCanvasRef.current?.renderAll();
      setHistoryIndex(newIndex);
    });
  };

  const redo = () => {
    if (!fabricCanvasRef.current || historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    const state = history[newIndex];
    fabricCanvasRef.current.loadFromJSON(state, () => {
      fabricCanvasRef.current?.renderAll();
      setHistoryIndex(newIndex);
    });
  };

  // =============================================================================
  // IMAGE HANDLING
  // =============================================================================

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          setUploadedImages(prev => [...prev, dataUrl]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const addImageToCanvas = async (imageUrl: string) => {
    if (!fabricCanvasRef.current) {
      alert('Canvas not ready. Please wait a moment.');
      return;
    }

    try {
      const canvas = fabricCanvasRef.current;
      const img = await fabric.Image.fromURL(imageUrl, { crossOrigin: 'anonymous' });
      
      const scale = Math.min(
        (canvas.width! * 0.4) / (img.width || 100),
        (canvas.height! * 0.4) / (img.height || 100)
      );

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
      canvas.renderAll();
      saveState();
    } catch (error) {
      console.error('Error adding image:', error);
      alert('Failed to add image to canvas.');
    }
  };

  // =============================================================================
  // TEXT HANDLING
  // =============================================================================

  const addText = () => {
    if (!fabricCanvasRef.current) return;

    const text = new fabric.Text('Double click to edit', {
      left: fabricCanvasRef.current.width! / 2,
      top: fabricCanvasRef.current.height! / 2,
      originX: 'center',
      originY: 'center',
      fontFamily: textSettings.fontFamily,
      fontSize: textSettings.fontSize,
      fill: textSettings.fill,
      fontWeight: textSettings.fontWeight,
      fontStyle: textSettings.fontStyle,
    });

    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);
    fabricCanvasRef.current.renderAll();
    saveState();
  };

  // =============================================================================
  // SHAPES HANDLING
  // =============================================================================

  const addShape = (shapeType: 'rect' | 'circle' | 'heart' | 'star') => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    let shape: fabric.Object;

    switch (shapeType) {
      case 'rect':
        shape = new fabric.Rect({
          width: 100,
          height: 100,
          left: canvas.width! / 2,
          top: canvas.height! / 2,
          originX: 'center',
          originY: 'center',
          fill: shapeSettings.fill,
          stroke: shapeSettings.stroke,
          strokeWidth: shapeSettings.strokeWidth,
        });
        break;
      case 'circle':
        shape = new fabric.Circle({
          radius: 50,
          left: canvas.width! / 2,
          top: canvas.height! / 2,
          originX: 'center',
          originY: 'center',
          fill: shapeSettings.fill,
          stroke: shapeSettings.stroke,
          strokeWidth: shapeSettings.strokeWidth,
        });
        break;
      case 'heart':
        // Simple heart using path
        const heartPath = 'M 0,20 C 0,10 10,0 20,0 C 30,0 40,10 40,20 C 40,30 20,50 20,50 C 20,50 0,30 0,20 Z';
        shape = new fabric.Path(heartPath, {
          left: canvas.width! / 2,
          top: canvas.height! / 2,
          originX: 'center',
          originY: 'center',
          scaleX: 2,
          scaleY: 2,
          fill: shapeSettings.fill,
          stroke: shapeSettings.stroke,
          strokeWidth: shapeSettings.strokeWidth,
        });
        break;
      case 'star':
        // Simple star using path
        const starPath = 'M 50,5 L 61,35 L 95,35 L 68,55 L 79,85 L 50,65 L 21,85 L 32,55 L 5,35 L 39,35 Z';
        shape = new fabric.Path(starPath, {
          left: canvas.width! / 2,
          top: canvas.height! / 2,
          originX: 'center',
          originY: 'center',
          scaleX: 0.5,
          scaleY: 0.5,
          fill: shapeSettings.fill,
          stroke: shapeSettings.stroke,
          strokeWidth: shapeSettings.strokeWidth,
        });
        break;
    }

    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
    saveState();
  };

  // =============================================================================
  // LABELS HANDLING
  // =============================================================================

  const addLabel = (labelType: string) => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    const labelPaths: Record<string, string> = {
      'classic': 'M 5 10 L 15 2 L 85 2 L 95 10 L 95 40 L 85 48 L 15 48 L 5 40 Z',
      'rounded': 'M 8 5 Q 5 5 5 8 L 5 42 Q 5 45 8 45 L 92 45 Q 95 45 95 42 L 95 8 Q 95 5 92 5 Z',
      'scalloped': 'M 5 5 Q 10 10 15 5 Q 20 10 25 5 Q 30 10 35 5 Q 40 10 45 5 Q 50 10 55 5 Q 60 10 65 5 Q 70 10 75 5 Q 80 10 85 5 Q 90 10 95 5 L 95 45 Q 90 40 85 45 Q 80 40 75 45 Q 70 40 65 45 Q 60 40 55 45 Q 50 40 45 45 Q 40 40 35 45 Q 30 40 25 45 Q 20 40 15 45 Q 10 40 5 45 Z',
      'bracket': 'M 5 3 L 20 3 L 20 10 L 10 10 L 10 40 L 20 40 L 20 47 L 5 47 Z M 95 3 L 80 3 L 80 10 L 90 10 L 90 40 L 80 40 L 80 47 L 95 47 Z',
    };

    const path = labelPaths[labelType] || labelPaths['classic'];
    const label = new fabric.Path(path, {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: 'center',
      originY: 'center',
      scaleX: 2,
      scaleY: 2,
      fill: 'transparent',
      stroke: shapeSettings.stroke,
      strokeWidth: shapeSettings.strokeWidth,
    });

    // Add text inside label
    const text = new fabric.Text('Your Text', {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: 'center',
      originY: 'center',
      fontFamily: textSettings.fontFamily,
      fontSize: textSettings.fontSize,
      fill: textSettings.fill,
    });

    canvas.add(label);
    canvas.add(text);
    canvas.setActiveObject(label);
    canvas.renderAll();
    saveState();
  };

  // =============================================================================
  // DELETE SELECTED
  // =============================================================================

  const deleteSelected = () => {
    if (!fabricCanvasRef.current || !selectedObject) return;
    fabricCanvasRef.current.remove(selectedObject);
    fabricCanvasRef.current.renderAll();
    setSelectedObject(null);
    saveState();
  };

  // =============================================================================
  // EXPORT
  // =============================================================================

  const exportDesign = async () => {
    if (!fabricCanvasRef.current) return;

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
      dimensions: { width: canvasWidth, height: canvasHeight },
      dpi: DPI,
      productType,
      productSize: productSize.name,
    });
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">Design Editor</h2>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={undo} disabled={historyIndex <= 0} className="p-2 hover:bg-gray-700 rounded disabled:opacity-50">
            <Undo2 className="w-5 h-5" />
          </button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 hover:bg-gray-700 rounded disabled:opacity-50">
            <Redo2 className="w-5 h-5" />
          </button>
          <div className="text-sm">
            {zoom}%
          </div>
          <button onClick={deleteSelected} disabled={!selectedObject} className="p-2 hover:bg-gray-700 rounded disabled:opacity-50">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={onClose} className="px-4 py-2 text-gray-300 hover:text-white">
            Cancel
          </button>
          <button onClick={exportDesign} className="px-6 py-2 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 flex items-center gap-2">
            <Check className="w-4 h-4" />
            Save and Design the ArtKey™
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <div className="text-sm text-gray-600 mb-4">
              <div>{productSize.name} {productType}</div>
              <div>{Math.round(canvasWidth)}" x {Math.round(canvasHeight)}"</div>
              <div>@ {DPI} DPI</div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('images')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'images' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
                }`}
              >
                <ImageIcon className="w-4 h-4 inline mr-2" />
                Images
              </button>
              <button
                onClick={() => setActiveTab('text')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'text' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
                }`}
              >
                <Type className="w-4 h-4 inline mr-2" />
                Text
              </button>
              <button
                onClick={() => setActiveTab('labels')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'labels' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
                }`}
              >
                <Frame className="w-4 h-4 inline mr-2" />
                Labels
              </button>
              <button
                onClick={() => setActiveTab('shapes')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'shapes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
                }`}
              >
                <Square className="w-4 h-4 inline mr-2" />
                Shapes
              </button>
            </div>

            {/* Images Tab */}
            {activeTab === 'images' && (
              <div className="space-y-4">
                <div>
                  <label className="block w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors text-center">
                    <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                    <span className="text-sm text-gray-600">Upload Images</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">JPG, PNG, BMP</p>
                </div>

                {uploadedImages.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Your Images</h3>
                    <p className="text-xs text-gray-500 mb-2">Click an image to add it to the canvas</p>
                    <div className="grid grid-cols-2 gap-2">
                      {uploadedImages.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => addImageToCanvas(img)}
                          className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-all hover:shadow-md relative group"
                        >
                          <img src={img} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-2 py-1 rounded">
                              Add to Canvas
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Text Tab */}
            {activeTab === 'text' && (
              <div className="space-y-4">
                <button
                  onClick={addText}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Add Text
                </button>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Font Family</label>
                    <select
                      value={textSettings.fontFamily}
                      onChange={(e) => setTextSettings(p => ({ ...p, fontFamily: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option>Arial</option>
                      <option>Times New Roman</option>
                      <option>Courier New</option>
                      <option>Georgia</option>
                      <option>Verdana</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Font Size: {textSettings.fontSize}px</label>
                    <input
                      type="range"
                      min="12"
                      max="72"
                      value={textSettings.fontSize}
                      onChange={(e) => setTextSettings(p => ({ ...p, fontSize: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Color</label>
                    <input
                      type="color"
                      value={textSettings.fill}
                      onChange={(e) => setTextSettings(p => ({ ...p, fill: e.target.value }))}
                      className="w-full h-10 rounded cursor-pointer border border-gray-300"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTextSettings(p => ({ ...p, fontWeight: p.fontWeight === 'bold' ? 'normal' : 'bold' }))}
                      className={`flex-1 py-2 border-2 rounded-lg ${textSettings.fontWeight === 'bold' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}
                    >
                      <Bold className="w-4 h-4 mx-auto" />
                    </button>
                    <button
                      onClick={() => setTextSettings(p => ({ ...p, fontStyle: p.fontStyle === 'italic' ? 'normal' : 'italic' }))}
                      className={`flex-1 py-2 border-2 rounded-lg ${textSettings.fontStyle === 'italic' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}
                    >
                      <Italic className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Labels Tab */}
            {activeTab === 'labels' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {['classic', 'rounded', 'scalloped', 'bracket'].map((label) => (
                    <button
                      key={label}
                      onClick={() => addLabel(label)}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 text-sm capitalize"
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="space-y-3 pt-3 border-t border-gray-200">
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Stroke Color</label>
                    <input
                      type="color"
                      value={shapeSettings.stroke}
                      onChange={(e) => setShapeSettings(p => ({ ...p, stroke: e.target.value }))}
                      className="w-full h-10 rounded cursor-pointer border border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Stroke Width: {shapeSettings.strokeWidth}px</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={shapeSettings.strokeWidth}
                      onChange={(e) => setShapeSettings(p => ({ ...p, strokeWidth: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Shapes Tab */}
            {activeTab === 'shapes' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => addShape('rect')} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                    <Square className="w-6 h-6 mx-auto mb-1" />
                    <span className="text-xs">Rectangle</span>
                  </button>
                  <button onClick={() => addShape('circle')} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                    <Circle className="w-6 h-6 mx-auto mb-1" />
                    <span className="text-xs">Circle</span>
                  </button>
                  <button onClick={() => addShape('heart')} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                    <Heart className="w-6 h-6 mx-auto mb-1" />
                    <span className="text-xs">Heart</span>
                  </button>
                  <button onClick={() => addShape('star')} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                    <Star className="w-6 h-6 mx-auto mb-1" />
                    <span className="text-xs">Star</span>
                  </button>
                </div>
                <div className="space-y-3 pt-3 border-t border-gray-200">
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Fill Color</label>
                    <input
                      type="color"
                      value={shapeSettings.fill}
                      onChange={(e) => setShapeSettings(p => ({ ...p, fill: e.target.value }))}
                      className="w-full h-10 rounded cursor-pointer border border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Stroke Color</label>
                    <input
                      type="color"
                      value={shapeSettings.stroke}
                      onChange={(e) => setShapeSettings(p => ({ ...p, stroke: e.target.value }))}
                      className="w-full h-10 rounded cursor-pointer border border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Stroke Width: {shapeSettings.strokeWidth}px</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={shapeSettings.strokeWidth}
                      onChange={(e) => setShapeSettings(p => ({ ...p, strokeWidth: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center bg-gray-100 p-8 overflow-auto">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <canvas ref={canvasRef} className="shadow-lg rounded-lg bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
