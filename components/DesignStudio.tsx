"use client";

/**
 * Design Center - Full-Featured Image Editor
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
  Layers, Upload, ChevronLeft, Bold, Italic, Underline,
  Copy, Undo2, Redo2, FlipHorizontal, FlipVertical,
  RotateCw, AlignLeft, AlignCenter, AlignRight,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  Triangle, Star, Heart, Minus, ArrowRightCircle, MoveVertical,
  Hexagon, Diamond, Grid3X3, Palette, SlidersHorizontal,
  Lock, Unlock, Eye, EyeOff, LayoutGrid, Sparkles, Save,
  FolderOpen, ChevronUp, ChevronDown, Maximize2, Settings,
  ArrowUpRight, CornerDownRight, Spline, PenTool
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
// GRAPHICS LIBRARY (Lines, Arrows, Decorative Elements)
// =============================================================================

interface GraphicItem {
  id: string;
  name: string;
  category: 'lines' | 'arrows' | 'dividers' | 'frames' | 'decorative';
  type: 'line' | 'path' | 'group';
  data: any; // Line coords or path data
}

const GRAPHICS_LIBRARY: GraphicItem[] = [
  // LINES
  { id: 'line-solid', name: 'Solid Line', category: 'lines', type: 'line', data: { x1: 0, y1: 0, x2: 150, y2: 0, strokeWidth: 3 } },
  { id: 'line-thick', name: 'Thick Line', category: 'lines', type: 'line', data: { x1: 0, y1: 0, x2: 150, y2: 0, strokeWidth: 8 } },
  { id: 'line-thin', name: 'Thin Line', category: 'lines', type: 'line', data: { x1: 0, y1: 0, x2: 150, y2: 0, strokeWidth: 1 } },
  { id: 'line-dashed', name: 'Dashed Line', category: 'lines', type: 'line', data: { x1: 0, y1: 0, x2: 150, y2: 0, strokeWidth: 3, strokeDashArray: [10, 5] } },
  { id: 'line-dotted', name: 'Dotted Line', category: 'lines', type: 'line', data: { x1: 0, y1: 0, x2: 150, y2: 0, strokeWidth: 3, strokeDashArray: [3, 3] } },
  { id: 'line-diagonal', name: 'Diagonal', category: 'lines', type: 'line', data: { x1: 0, y1: 0, x2: 100, y2: 100, strokeWidth: 3 } },
  
  // ARROWS
  { id: 'arrow-right', name: 'Arrow Right', category: 'arrows', type: 'path', data: 'M 0,15 L 80,15 L 80,5 L 100,20 L 80,35 L 80,25 L 0,25 Z' },
  { id: 'arrow-left', name: 'Arrow Left', category: 'arrows', type: 'path', data: 'M 100,15 L 20,15 L 20,5 L 0,20 L 20,35 L 20,25 L 100,25 Z' },
  { id: 'arrow-up', name: 'Arrow Up', category: 'arrows', type: 'path', data: 'M 15,100 L 15,20 L 5,20 L 20,0 L 35,20 L 25,20 L 25,100 Z' },
  { id: 'arrow-down', name: 'Arrow Down', category: 'arrows', type: 'path', data: 'M 15,0 L 15,80 L 5,80 L 20,100 L 35,80 L 25,80 L 25,0 Z' },
  { id: 'arrow-double', name: 'Double Arrow', category: 'arrows', type: 'path', data: 'M 0,20 L 15,5 L 15,15 L 85,15 L 85,5 L 100,20 L 85,35 L 85,25 L 15,25 L 15,35 Z' },
  { id: 'arrow-curved', name: 'Curved Arrow', category: 'arrows', type: 'path', data: 'M 10,80 Q 10,10 80,10 L 80,0 L 100,15 L 80,30 L 80,20 Q 20,20 20,80 Z' },
  
  // DIVIDERS
  { id: 'divider-dots', name: 'Dot Divider', category: 'dividers', type: 'path', data: 'M 0,5 A 5,5 0 1,1 10,5 A 5,5 0 1,1 0,5 M 30,5 A 5,5 0 1,1 40,5 A 5,5 0 1,1 30,5 M 60,5 A 5,5 0 1,1 70,5 A 5,5 0 1,1 60,5 M 90,5 A 5,5 0 1,1 100,5 A 5,5 0 1,1 90,5' },
  { id: 'divider-wave', name: 'Wave Divider', category: 'dividers', type: 'path', data: 'M 0,10 Q 12.5,0 25,10 Q 37.5,20 50,10 Q 62.5,0 75,10 Q 87.5,20 100,10' },
  { id: 'divider-zigzag', name: 'Zigzag', category: 'dividers', type: 'path', data: 'M 0,0 L 10,15 L 20,0 L 30,15 L 40,0 L 50,15 L 60,0 L 70,15 L 80,0 L 90,15 L 100,0' },
  
  // FRAMES
  { id: 'frame-simple', name: 'Simple Frame', category: 'frames', type: 'path', data: 'M 0,0 L 100,0 L 100,100 L 0,100 Z M 10,10 L 10,90 L 90,90 L 90,10 Z' },
  { id: 'frame-double', name: 'Double Frame', category: 'frames', type: 'path', data: 'M 0,0 L 100,0 L 100,100 L 0,100 Z M 5,5 L 5,95 L 95,95 L 95,5 Z M 10,10 L 10,90 L 90,90 L 90,10 Z M 15,15 L 15,85 L 85,85 L 85,15 Z' },
  { id: 'frame-rounded', name: 'Rounded Frame', category: 'frames', type: 'path', data: 'M 10,0 L 90,0 Q 100,0 100,10 L 100,90 Q 100,100 90,100 L 10,100 Q 0,100 0,90 L 0,10 Q 0,0 10,0 Z M 20,10 Q 10,10 10,20 L 10,80 Q 10,90 20,90 L 80,90 Q 90,90 90,80 L 90,20 Q 90,10 80,10 Z' },
  
  // DECORATIVE
  { id: 'deco-flourish', name: 'Flourish', category: 'decorative', type: 'path', data: 'M 0,50 Q 25,0 50,50 Q 75,100 100,50 M 0,50 Q 25,100 50,50 Q 75,0 100,50' },
  { id: 'deco-scroll', name: 'Scroll', category: 'decorative', type: 'path', data: 'M 0,50 C 10,20 20,20 30,50 C 40,80 50,80 50,50 C 50,20 60,20 70,50 C 80,80 90,80 100,50' },
  { id: 'deco-corner', name: 'Corner', category: 'decorative', type: 'path', data: 'M 0,100 L 0,0 L 100,0 M 10,90 Q 10,10 90,10' },
  { id: 'deco-bracket', name: 'Bracket', category: 'decorative', type: 'path', data: 'M 20,0 Q 0,0 0,20 L 0,80 Q 0,100 20,100 M 80,0 Q 100,0 100,20 L 100,80 Q 100,100 80,100' },
];

// =============================================================================
// COMPOSITION TEMPLATES (Original layouts - not copied from any source)
// =============================================================================

interface CompositionSlot {
  x: number;      // percentage from left (0-100)
  y: number;      // percentage from top (0-100)
  width: number;  // percentage width (0-100)
  height: number; // percentage height (0-100)
  type: 'image' | 'text';
}

interface CompositionTemplate {
  id: string;
  name: string;
  category: string;
  slots: CompositionSlot[];
}

const COMPOSITION_TEMPLATES: CompositionTemplate[] = [
  // === SINGLE IMAGE ===
  {
    id: 'full-bleed',
    name: 'Full Canvas',
    category: 'single',
    slots: [{ x: 0, y: 0, width: 100, height: 100, type: 'image' }],
  },
  {
    id: 'centered-frame',
    name: 'Centered Frame',
    category: 'single',
    slots: [{ x: 10, y: 10, width: 80, height: 80, type: 'image' }],
  },
  {
    id: 'classic-caption',
    name: 'With Caption',
    category: 'single',
    slots: [
      { x: 5, y: 5, width: 90, height: 75, type: 'image' },
      { x: 5, y: 82, width: 90, height: 13, type: 'text' },
    ],
  },
  {
    id: 'polaroid',
    name: 'Polaroid Style',
    category: 'single',
    slots: [
      { x: 8, y: 5, width: 84, height: 70, type: 'image' },
      { x: 8, y: 78, width: 84, height: 17, type: 'text' },
    ],
  },
  // === DUAL LAYOUTS ===
  {
    id: 'split-vertical',
    name: 'Side by Side',
    category: 'dual',
    slots: [
      { x: 2, y: 5, width: 47, height: 90, type: 'image' },
      { x: 51, y: 5, width: 47, height: 90, type: 'image' },
    ],
  },
  {
    id: 'split-horizontal',
    name: 'Stacked',
    category: 'dual',
    slots: [
      { x: 5, y: 2, width: 90, height: 47, type: 'image' },
      { x: 5, y: 51, width: 90, height: 47, type: 'image' },
    ],
  },
  {
    id: 'feature-right',
    name: 'Feature Right',
    category: 'dual',
    slots: [
      { x: 3, y: 5, width: 35, height: 90, type: 'image' },
      { x: 40, y: 5, width: 57, height: 90, type: 'image' },
    ],
  },
  {
    id: 'feature-left',
    name: 'Feature Left',
    category: 'dual',
    slots: [
      { x: 3, y: 5, width: 57, height: 90, type: 'image' },
      { x: 62, y: 5, width: 35, height: 90, type: 'image' },
    ],
  },
  {
    id: 'duo-caption',
    name: 'Duo + Caption',
    category: 'dual',
    slots: [
      { x: 3, y: 3, width: 46, height: 72, type: 'image' },
      { x: 51, y: 3, width: 46, height: 72, type: 'image' },
      { x: 3, y: 78, width: 94, height: 19, type: 'text' },
    ],
  },
  // === TRIPLE LAYOUTS ===
  {
    id: 'triptych',
    name: 'Triptych',
    category: 'triple',
    slots: [
      { x: 2, y: 5, width: 31, height: 90, type: 'image' },
      { x: 34.5, y: 5, width: 31, height: 90, type: 'image' },
      { x: 67, y: 5, width: 31, height: 90, type: 'image' },
    ],
  },
  {
    id: 'hero-duo',
    name: 'Hero + Two',
    category: 'triple',
    slots: [
      { x: 3, y: 3, width: 60, height: 94, type: 'image' },
      { x: 65, y: 3, width: 32, height: 46, type: 'image' },
      { x: 65, y: 51, width: 32, height: 46, type: 'image' },
    ],
  },
  {
    id: 'row-feature',
    name: 'Row + Feature',
    category: 'triple',
    slots: [
      { x: 3, y: 3, width: 46, height: 45, type: 'image' },
      { x: 51, y: 3, width: 46, height: 45, type: 'image' },
      { x: 3, y: 50, width: 94, height: 47, type: 'image' },
    ],
  },
  {
    id: 'l-shape',
    name: 'L-Shape',
    category: 'triple',
    slots: [
      { x: 3, y: 3, width: 64, height: 60, type: 'image' },
      { x: 69, y: 3, width: 28, height: 94, type: 'image' },
      { x: 3, y: 65, width: 64, height: 32, type: 'image' },
    ],
  },
  // === GRID LAYOUTS ===
  {
    id: 'grid-2x2',
    name: 'Grid 2×2',
    category: 'grid',
    slots: [
      { x: 3, y: 3, width: 46, height: 46, type: 'image' },
      { x: 51, y: 3, width: 46, height: 46, type: 'image' },
      { x: 3, y: 51, width: 46, height: 46, type: 'image' },
      { x: 51, y: 51, width: 46, height: 46, type: 'image' },
    ],
  },
  {
    id: 'grid-1-3',
    name: 'One + Three',
    category: 'grid',
    slots: [
      { x: 3, y: 3, width: 60, height: 94, type: 'image' },
      { x: 65, y: 3, width: 32, height: 30, type: 'image' },
      { x: 65, y: 35, width: 32, height: 30, type: 'image' },
      { x: 65, y: 67, width: 32, height: 30, type: 'image' },
    ],
  },
  {
    id: 'mosaic-5',
    name: 'Mosaic',
    category: 'grid',
    slots: [
      { x: 3, y: 3, width: 48, height: 55, type: 'image' },
      { x: 53, y: 3, width: 44, height: 35, type: 'image' },
      { x: 53, y: 40, width: 44, height: 57, type: 'image' },
      { x: 3, y: 60, width: 23, height: 37, type: 'image' },
      { x: 28, y: 60, width: 23, height: 37, type: 'image' },
    ],
  },
  {
    id: 'grid-3x2',
    name: 'Grid 3×2',
    category: 'grid',
    slots: [
      { x: 2, y: 3, width: 31, height: 46, type: 'image' },
      { x: 34.5, y: 3, width: 31, height: 46, type: 'image' },
      { x: 67, y: 3, width: 31, height: 46, type: 'image' },
      { x: 2, y: 51, width: 31, height: 46, type: 'image' },
      { x: 34.5, y: 51, width: 31, height: 46, type: 'image' },
      { x: 67, y: 51, width: 31, height: 46, type: 'image' },
    ],
  },
  // === WITH TEXT ===
  {
    id: 'headline-image',
    name: 'Headline + Image',
    category: 'text',
    slots: [
      { x: 5, y: 3, width: 90, height: 18, type: 'text' },
      { x: 5, y: 23, width: 90, height: 74, type: 'image' },
    ],
  },
  {
    id: 'side-text',
    name: 'Side Text',
    category: 'text',
    slots: [
      { x: 3, y: 5, width: 55, height: 90, type: 'image' },
      { x: 60, y: 5, width: 37, height: 90, type: 'text' },
    ],
  },
  {
    id: 'overlay-text',
    name: 'Overlay',
    category: 'text',
    slots: [
      { x: 0, y: 0, width: 100, height: 100, type: 'image' },
      { x: 5, y: 70, width: 90, height: 25, type: 'text' },
    ],
  },
  {
    id: 'magazine',
    name: 'Magazine',
    category: 'text',
    slots: [
      { x: 5, y: 3, width: 90, height: 12, type: 'text' },
      { x: 5, y: 17, width: 44, height: 55, type: 'image' },
      { x: 51, y: 17, width: 44, height: 55, type: 'image' },
      { x: 5, y: 74, width: 90, height: 23, type: 'text' },
    ],
  },
];

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
  const [activePanel, setActivePanel] = useState<'images' | 'text' | 'shapes' | 'graphics' | 'compositions' | 'layers' | 'adjust'>('images');
  const [compositionCategory, setCompositionCategory] = useState<string>('single');
  const [savedDesigns, setSavedDesigns] = useState<Array<{ id: string; name: string; data: string; thumbnail: string }>>([]);
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
  // COMPOSITION TEMPLATES
  // =============================================================================

  const applyComposition = (template: CompositionTemplate) => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;
    const cw = canvas.width!;
    const ch = canvas.height!;
    const gap = 4; // Small gap between slots

    // Create placeholder shapes for each slot
    template.slots.forEach((slot, index) => {
      const left = (slot.x / 100) * cw + gap;
      const top = (slot.y / 100) * ch + gap;
      const width = (slot.width / 100) * cw - gap * 2;
      const height = (slot.height / 100) * ch - gap * 2;

      if (slot.type === 'image') {
        // Create an image placeholder rectangle
        const placeholder = new fabric.Rect({
          left,
          top,
          width,
          height,
          fill: BRAND.light,
          stroke: BRAND.medium,
          strokeWidth: 2,
          strokeDashArray: [8, 4],
          rx: 4,
          ry: 4,
          selectable: true,
          evented: true,
        });
        
        // Add a "+" icon in center using text
        const plusIcon = new fabric.Text('+', {
          left: left + width / 2,
          top: top + height / 2,
          originX: 'center',
          originY: 'center',
          fontSize: Math.min(width, height) * 0.3,
          fill: BRAND.medium,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          selectable: false,
          evented: false,
        });

        canvas.add(placeholder);
        canvas.add(plusIcon);
      } else {
        // Create text placeholder
        const textPlaceholder = new fabric.IText('Add text here', {
          left: left + width / 2,
          top: top + height / 2,
          originX: 'center',
          originY: 'center',
          width: width,
          fontSize: Math.min(24, height * 0.4) * displayScale,
          fill: BRAND.dark,
          fontFamily: 'Georgia',
          textAlign: 'center',
          selectable: true,
          evented: true,
        });
        canvas.add(textPlaceholder);
      }
    });

    canvas.requestRenderAll();
    saveToHistory();
  };

  const clearCanvas = () => {
    if (!fabricCanvasRef.current) return;
    if (!confirm('Clear all objects from canvas?')) return;
    
    const canvas = fabricCanvasRef.current;
    const objects = canvas.getObjects();
    
    // Remove all except the safe zone guide
    objects.forEach(obj => {
      if (obj.selectable !== false) {
        canvas.remove(obj);
      }
    });
    
    canvas.requestRenderAll();
    saveToHistory();
  };

  // =============================================================================
  // GRAPHICS
  // =============================================================================

  const addGraphic = (graphic: GraphicItem) => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;

    let obj: fabric.FabricObject;
    const centerX = canvas.width! / 2;
    const centerY = canvas.height! / 2;

    if (graphic.type === 'line') {
      const { x1, y1, x2, y2, strokeWidth, strokeDashArray } = graphic.data;
      obj = new fabric.Line([x1, y1, x2, y2], {
        left: centerX - 75,
        top: centerY,
        stroke: BRAND.dark,
        strokeWidth: strokeWidth * displayScale,
        strokeDashArray: strokeDashArray?.map((v: number) => v * displayScale),
        selectable: true,
        evented: true,
      });
    } else {
      // Path
      obj = new fabric.Path(graphic.data, {
        left: centerX,
        top: centerY,
        originX: 'center',
        originY: 'center',
        fill: graphic.category === 'arrows' ? BRAND.dark : 'transparent',
        stroke: graphic.category === 'arrows' ? 'transparent' : BRAND.dark,
        strokeWidth: 2 * displayScale,
        scaleX: displayScale * 0.8,
        scaleY: displayScale * 0.8,
        selectable: true,
        evented: true,
      });
    }

    canvas.add(obj);
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    saveToHistory();
  };

  // =============================================================================
  // LAYERS MANAGEMENT
  // =============================================================================

  const getLayerObjects = () => {
    if (!fabricCanvasRef.current) return [];
    return fabricCanvasRef.current.getObjects().filter(obj => obj.selectable !== false);
  };

  const selectLayer = (obj: fabric.FabricObject) => {
    if (!fabricCanvasRef.current) return;
    fabricCanvasRef.current.setActiveObject(obj);
    fabricCanvasRef.current.requestRenderAll();
    setSelectedObject(obj);
  };

  const toggleLayerVisibility = (obj: fabric.FabricObject) => {
    if (!fabricCanvasRef.current) return;
    obj.set('visible', !obj.visible);
    fabricCanvasRef.current.requestRenderAll();
  };

  const toggleLayerLock = (obj: fabric.FabricObject) => {
    if (!fabricCanvasRef.current) return;
    const isLocked = obj.lockMovementX && obj.lockMovementY;
    obj.set({
      lockMovementX: !isLocked,
      lockMovementY: !isLocked,
      lockScalingX: !isLocked,
      lockScalingY: !isLocked,
      lockRotation: !isLocked,
      selectable: isLocked, // Toggle selectable
    });
    fabricCanvasRef.current.requestRenderAll();
  };

  const moveLayerUp = (obj: fabric.FabricObject) => {
    if (!fabricCanvasRef.current) return;
    fabricCanvasRef.current.bringObjectForward(obj);
    fabricCanvasRef.current.requestRenderAll();
  };

  const moveLayerDown = (obj: fabric.FabricObject) => {
    if (!fabricCanvasRef.current) return;
    fabricCanvasRef.current.sendObjectBackwards(obj);
    fabricCanvasRef.current.requestRenderAll();
  };

  const getObjectLabel = (obj: fabric.FabricObject): string => {
    if (obj instanceof fabric.IText || obj instanceof fabric.Text) {
      const text = (obj as fabric.IText).text || '';
      return `Text: "${text.substring(0, 15)}${text.length > 15 ? '...' : ''}"`;
    }
    if (obj instanceof fabric.Image) return 'Image';
    if (obj instanceof fabric.Rect) return 'Rectangle';
    if (obj instanceof fabric.Circle) return 'Circle';
    if (obj instanceof fabric.Triangle) return 'Triangle';
    if (obj instanceof fabric.Line) return 'Line';
    if (obj instanceof fabric.Path) return 'Shape';
    if (obj instanceof fabric.Polygon) return 'Polygon';
    return 'Object';
  };

  // =============================================================================
  // SAVE/LOAD DESIGNS
  // =============================================================================

  const saveDesign = () => {
    if (!fabricCanvasRef.current) return;
    
    const name = prompt('Enter a name for this design:', `Design ${savedDesigns.length + 1}`);
    if (!name) return;

    const json = JSON.stringify(fabricCanvasRef.current.toJSON());
    const thumbnail = fabricCanvasRef.current.toDataURL({ format: 'png', quality: 0.3, multiplier: 0.2 });
    
    const newDesign = {
      id: `design-${Date.now()}`,
      name,
      data: json,
      thumbnail,
    };

    const updated = [...savedDesigns, newDesign];
    setSavedDesigns(updated);
    
    // Save to localStorage
    try {
      localStorage.setItem('designCenter_savedDesigns', JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save to localStorage');
    }

    alert(`Design "${name}" saved!`);
  };

  const loadDesign = (design: typeof savedDesigns[0]) => {
    if (!fabricCanvasRef.current) return;
    if (!confirm(`Load "${design.name}"? This will replace your current work.`)) return;

    fabricCanvasRef.current.loadFromJSON(JSON.parse(design.data)).then(() => {
      fabricCanvasRef.current?.requestRenderAll();
      saveToHistory();
    });
  };

  const deleteDesign = (id: string) => {
    const updated = savedDesigns.filter(d => d.id !== id);
    setSavedDesigns(updated);
    try {
      localStorage.setItem('designCenter_savedDesigns', JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save to localStorage');
    }
  };

  // Load saved designs from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('designCenter_savedDesigns');
      if (saved) {
        setSavedDesigns(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Could not load saved designs');
    }
  }, []);

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
              Design Center
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
          <div className="flex flex-wrap border-b" style={{ borderColor: BRAND.light }}>
            {[
              { id: 'images', icon: ImageIcon, label: 'Files' },
              { id: 'compositions', icon: LayoutGrid, label: 'Layouts' },
              { id: 'text', icon: Type, label: 'Text' },
              { id: 'graphics', icon: PenTool, label: 'Graphics' },
              { id: 'shapes', icon: Square, label: 'Shapes' },
              { id: 'layers', icon: Layers, label: 'Layers' },
              { id: 'adjust', icon: Settings, label: 'Settings' },
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

            {/* Compositions Panel */}
            {activePanel === 'compositions' && (
              <div className="space-y-3">
                <p className="text-xs" style={{ color: BRAND.medium }}>
                  Click a layout to add placeholders to your canvas
                </p>
                
                {/* Category tabs */}
                <div className="flex flex-wrap gap-1">
                  {[
                    { id: 'single', label: '1 Image' },
                    { id: 'dual', label: '2 Images' },
                    { id: 'triple', label: '3 Images' },
                    { id: 'grid', label: 'Grids' },
                    { id: 'text', label: '+ Text' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCompositionCategory(cat.id)}
                      className="px-2 py-1 rounded text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: compositionCategory === cat.id ? BRAND.dark : BRAND.lightest,
                        color: compositionCategory === cat.id ? BRAND.white : BRAND.dark,
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Layout thumbnails */}
                <div className="grid grid-cols-2 gap-2">
                  {COMPOSITION_TEMPLATES.filter(t => t.category === compositionCategory).map((template) => (
                    <button
                      key={template.id}
                      onClick={() => applyComposition(template)}
                      className="group relative aspect-[4/3] rounded-lg border-2 transition-all hover:border-gray-900 hover:shadow-md"
                      style={{ borderColor: BRAND.light, backgroundColor: BRAND.white }}
                      title={template.name}
                    >
                      {/* Mini preview of layout */}
                      <div className="absolute inset-1">
                        {template.slots.map((slot, i) => (
                          <div
                            key={i}
                            className="absolute rounded-sm transition-colors"
                            style={{
                              left: `${slot.x}%`,
                              top: `${slot.y}%`,
                              width: `${slot.width}%`,
                              height: `${slot.height}%`,
                              backgroundColor: slot.type === 'image' ? BRAND.light : 'transparent',
                              border: slot.type === 'text' ? `1px dashed ${BRAND.medium}` : 'none',
                            }}
                          >
                            {slot.type === 'text' && (
                              <span className="absolute inset-0 flex items-center justify-center text-[8px]" style={{ color: BRAND.medium }}>
                                T
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      {/* Label on hover */}
                      <div className="absolute inset-x-0 bottom-0 bg-black/70 text-white text-[10px] py-0.5 text-center opacity-0 group-hover:opacity-100 transition-opacity rounded-b-md">
                        {template.name}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Clear canvas button */}
                <button
                  onClick={clearCanvas}
                  className="w-full py-2 rounded-lg text-xs font-medium transition-colors"
                  style={{ backgroundColor: BRAND.lightest, color: BRAND.dark }}
                >
                  Clear Canvas
                </button>
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

            {/* Graphics Panel */}
            {activePanel === 'graphics' && (
              <div className="space-y-3">
                {/* Category tabs */}
                <div className="flex flex-wrap gap-1">
                  {[
                    { id: 'lines', label: 'Lines' },
                    { id: 'arrows', label: 'Arrows' },
                    { id: 'dividers', label: 'Dividers' },
                    { id: 'frames', label: 'Frames' },
                    { id: 'decorative', label: 'Decor' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCompositionCategory(cat.id)}
                      className="px-2 py-1 rounded text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: compositionCategory === cat.id ? BRAND.dark : BRAND.lightest,
                        color: compositionCategory === cat.id ? BRAND.white : BRAND.dark,
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Graphics grid */}
                <div className="grid grid-cols-3 gap-2">
                  {GRAPHICS_LIBRARY.filter(g => g.category === compositionCategory).map((graphic) => (
                    <button
                      key={graphic.id}
                      onClick={() => addGraphic(graphic)}
                      className="aspect-square rounded-lg border-2 transition-all hover:border-gray-900 hover:shadow-md flex items-center justify-center p-2"
                      style={{ borderColor: BRAND.light, backgroundColor: BRAND.white }}
                      title={graphic.name}
                    >
                      {/* Preview SVG */}
                      <svg viewBox="0 0 100 100" className="w-full h-full" style={{ stroke: BRAND.dark, fill: graphic.category === 'arrows' ? BRAND.dark : 'none', strokeWidth: 3 }}>
                        {graphic.type === 'line' ? (
                          <line 
                            x1={graphic.data.x1} 
                            y1={graphic.data.y1 + 50} 
                            x2={graphic.data.x2 * 0.66} 
                            y2={graphic.data.y2 + 50}
                            strokeDasharray={graphic.data.strokeDashArray?.join(' ') || 'none'}
                          />
                        ) : (
                          <path d={graphic.data} transform="translate(0, 25) scale(1)" />
                        )}
                      </svg>
                    </button>
                  ))}
                </div>

                {GRAPHICS_LIBRARY.filter(g => g.category === compositionCategory).length === 0 && (
                  <p className="text-xs text-center py-4" style={{ color: BRAND.medium }}>
                    Select a category above
                  </p>
                )}
              </div>
            )}

            {/* Layers Panel */}
            {activePanel === 'layers' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold" style={{ color: BRAND.dark }}>Layers</h3>
                  <span className="text-xs" style={{ color: BRAND.medium }}>
                    {getLayerObjects().length} objects
                  </span>
                </div>

                {getLayerObjects().length === 0 ? (
                  <p className="text-xs text-center py-4" style={{ color: BRAND.medium }}>
                    No objects on canvas
                  </p>
                ) : (
                  <div className="space-y-1">
                    {getLayerObjects().slice().reverse().map((obj, idx) => {
                      const isSelected = selectedObject === obj;
                      const isLocked = obj.lockMovementX && obj.lockMovementY;
                      
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-1 p-1.5 rounded transition-colors"
                          style={{ 
                            backgroundColor: isSelected ? BRAND.lightest : 'transparent',
                            border: `1px solid ${isSelected ? BRAND.dark : BRAND.light}`,
                          }}
                        >
                          {/* Select button */}
                          <button
                            onClick={() => selectLayer(obj)}
                            className="flex-1 text-left text-xs truncate px-1"
                            style={{ color: obj.visible ? BRAND.dark : BRAND.medium }}
                          >
                            {getObjectLabel(obj)}
                          </button>
                          
                          {/* Layer controls */}
                          <button
                            onClick={() => toggleLayerVisibility(obj)}
                            className="p-1 rounded hover:bg-gray-200"
                            title={obj.visible ? 'Hide' : 'Show'}
                          >
                            {obj.visible ? (
                              <Eye className="w-3 h-3" style={{ color: BRAND.medium }} />
                            ) : (
                              <EyeOff className="w-3 h-3" style={{ color: BRAND.medium }} />
                            )}
                          </button>
                          <button
                            onClick={() => toggleLayerLock(obj)}
                            className="p-1 rounded hover:bg-gray-200"
                            title={isLocked ? 'Unlock' : 'Lock'}
                          >
                            {isLocked ? (
                              <Lock className="w-3 h-3" style={{ color: BRAND.medium }} />
                            ) : (
                              <Unlock className="w-3 h-3" style={{ color: BRAND.medium }} />
                            )}
                          </button>
                          <button
                            onClick={() => moveLayerUp(obj)}
                            className="p-1 rounded hover:bg-gray-200"
                            title="Move Up"
                          >
                            <ChevronUp className="w-3 h-3" style={{ color: BRAND.medium }} />
                          </button>
                          <button
                            onClick={() => moveLayerDown(obj)}
                            className="p-1 rounded hover:bg-gray-200"
                            title="Move Down"
                          >
                            <ChevronDown className="w-3 h-3" style={{ color: BRAND.medium }} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Saved Designs Section */}
                <div className="pt-3 border-t" style={{ borderColor: BRAND.light }}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold" style={{ color: BRAND.dark }}>Saved Designs</h3>
                    <button
                      onClick={saveDesign}
                      className="text-xs px-2 py-1 rounded font-medium flex items-center gap-1"
                      style={{ backgroundColor: BRAND.dark, color: BRAND.white }}
                    >
                      <Save className="w-3 h-3" />
                      Save
                    </button>
                  </div>

                  {savedDesigns.length === 0 ? (
                    <p className="text-xs text-center py-2" style={{ color: BRAND.medium }}>
                      No saved designs yet
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-1">
                      {savedDesigns.map((design) => (
                        <div
                          key={design.id}
                          className="relative group rounded-lg border overflow-hidden"
                          style={{ borderColor: BRAND.light }}
                        >
                          <img 
                            src={design.thumbnail} 
                            alt={design.name} 
                            className="w-full aspect-square object-cover cursor-pointer"
                            onClick={() => loadDesign(design)}
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-black/70 text-white text-[9px] p-1 truncate">
                            {design.name}
                          </div>
                          <button
                            onClick={() => deleteDesign(design.id)}
                            className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
