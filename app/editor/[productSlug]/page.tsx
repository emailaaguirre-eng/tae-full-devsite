'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface PrintSpec {
  id: string;
  name: string;
  gelatoProductUid: string;
  dpi: number;
  trimWidthMm: number;
  trimHeightMm: number;
  exportWidthMm: number;
  exportHeightMm: number;
  exportWidthPx: number;
  exportHeightPx: number;
  folded: boolean;
  doubleSided: boolean;
  sides: Array<{
    id: string;
    name: string;
    trimMm: { w: number; h: number };
    bleedMm: number;
    safeMm: number;
    foldLines?: Array<{ x1: number; y1: number; x2: number; y2: number }>;
  }>;
}

interface GelatoProduct {
  productUid: string;
  paperFormat: string;
  paperType: string;
  orientation: string;
  foldingType: string;
  widthMm: number;
  heightMm: number;
}

// Design object types
interface DesignObject {
  id: string;
  type: 'image' | 'text' | 'shape';
  x: number;  // position in mm from canvas origin (includes bleed)
  y: number;
  width: number;  // in mm
  height: number; // in mm
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  side: string;  // which side this object belongs to
  // Type-specific properties
  src?: string;  // for images
  text?: string; // for text
  fontSize?: number; // in mm
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  shapeType?: 'rectangle' | 'circle' | 'line' | 'triangle' | 'star';
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  // Image filters
  filter?: 'none' | 'grayscale' | 'sepia' | 'blur';
  // Foil effect
  foilEffect?: 'none' | 'gold' | 'silver' | 'rose-gold';
}

// Available fonts (web-safe + Google fonts)
const AVAILABLE_FONTS = [
  { name: 'Playfair Display', family: 'var(--font-playfair), serif' },
  { name: 'Nunito', family: 'var(--font-nunito), sans-serif' },
  { name: 'Arial', family: 'Arial, sans-serif' },
  { name: 'Georgia', family: 'Georgia, serif' },
  { name: 'Times New Roman', family: '"Times New Roman", serif' },
  { name: 'Courier New', family: '"Courier New", monospace' },
  { name: 'Verdana', family: 'Verdana, sans-serif' },
  { name: 'Trebuchet MS', family: '"Trebuchet MS", sans-serif' },
  { name: 'Impact', family: 'Impact, sans-serif' },
  { name: 'Comic Sans MS', family: '"Comic Sans MS", cursive' },
];

// Preset templates
const TEMPLATES = [
  { id: 'blank', name: 'Blank', objects: [] },
  { id: 'centered-text', name: 'Centered Text', objects: [
    { type: 'text', text: 'Your Message Here', x: 0.5, y: 0.5, fontSize: 8, color: '#000000', textAlign: 'center' }
  ]},
  { id: 'photo-card', name: 'Photo Card', objects: [
    { type: 'shape', shapeType: 'rectangle', x: 0.1, y: 0.1, width: 0.8, height: 0.6, fill: '#f3f3f3' },
    { type: 'text', text: 'Add Your Photo', x: 0.5, y: 0.35, fontSize: 4, color: '#918c86', textAlign: 'center' },
    { type: 'text', text: 'Your Caption', x: 0.5, y: 0.8, fontSize: 5, color: '#000000', textAlign: 'center' }
  ]},
  { id: 'border-frame', name: 'Border Frame', objects: [
    { type: 'shape', shapeType: 'rectangle', x: 0.05, y: 0.05, width: 0.9, height: 0.9, fill: 'transparent', stroke: '#000000', strokeWidth: 2 }
  ]},
];

// Background presets
const BACKGROUND_COLORS = [
  '#ffffff', '#f3f3f3', '#ded8d3', '#475569', '#918c86', '#000000',
  '#fee2e2', '#fef3c7', '#d1fae5', '#dbeafe', '#ede9fe', '#fce7f3',
];

const BACKGROUND_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
];

// Basic clipart/graphics (emoji-based for simplicity)
const GRAPHICS = [
  { category: 'Hearts', items: ['❤️', '💜', '💙', '💚', '💛', '🧡', '🖤', '🤍', '💕', '💗'] },
  { category: 'Celebrations', items: ['🎉', '🎊', '🎈', '🎁', '🎂', '🍾', '🥂', '✨', '🎆', '🎇'] },
  { category: 'Nature', items: ['🌸', '🌺', '🌹', '🌷', '🌻', '🌼', '🍀', '🌿', '🌳', '🌲'] },
  { category: 'Symbols', items: ['⭐', '🌟', '💫', '☀️', '🌙', '⚡', '🔥', '💧', '❄️', '☁️'] },
  { category: 'Animals', items: ['🦋', '🐦', '🐝', '🦜', '🦚', '🦢', '🕊️', '🦩', '🐞', '🐌'] },
  { category: 'Arrows', items: ['➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↔️', '↕️'] },
];

function EditorPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const productSlug = params.productSlug as string;
  const gelatoProductUid = searchParams.get('product');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printSpec, setPrintSpec] = useState<PrintSpec | null>(null);
  const [gelatoProduct, setGelatoProduct] = useState<GelatoProduct | null>(null);
  const [activeSide, setActiveSide] = useState<string>('front');
  const [showPreview, setShowPreview] = useState(false);
  
  // Canvas state
  const [canvasScale, setCanvasScale] = useState(1);
  const [showGuides, setShowGuides] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const gridSize = 5; // 5mm grid
  
  // Design state
  const [objects, setObjects] = useState<DesignObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string>('select');
  const [uploadedImages, setUploadedImages] = useState<Array<{ id: string; src: string; name: string }>>([]);
  
  // Text editing state
  const [isAddingText, setIsAddingText] = useState(false);
  const [newText, setNewText] = useState('Your text here');
  
  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string | null>(null);
  
  // Drag & Resize state
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null); // 'nw', 'ne', 'sw', 'se'
  const [dragStart, setDragStart] = useState<{ x: number; y: number; objX: number; objY: number; objW: number; objH: number } | null>(null);
  const canvasDisplayRef = useRef<{ displayRatio: number; scale: number } | null>(null);
  
  // Undo/Redo history
  const [history, setHistory] = useState<DesignObject[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoRedo = useRef(false);
  
  // Draft saving state
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Image cache and loader (defined early for export functions)
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());
  
  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    if (imageCache.current.has(src)) {
      return Promise.resolve(imageCache.current.get(src)!);
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        imageCache.current.set(src, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }, []);
  
  // Get objects for current side
  const currentSideObjects = objects.filter(obj => obj.side === activeSide);
  const selectedObject = objects.find(obj => obj.id === selectedObjectId);
  
  // Track history when objects change (but not during undo/redo)
  useEffect(() => {
    if (isUndoRedo.current) {
      isUndoRedo.current = false;
      return;
    }
    
    // Don't track empty initial state or during drag
    if (isDragging || isResizing) return;
    
    // Only add to history if objects actually changed
    const currentState = JSON.stringify(objects);
    const lastState = JSON.stringify(history[historyIndex] || []);
    
    if (currentState !== lastState) {
      // Remove any future history (if we made changes after undoing)
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push([...objects]);
      
      // Limit history to 50 states
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [objects, isDragging, isResizing]);
  
  // Undo function
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedo.current = true;
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setObjects([...history[newIndex]]);
      setSelectedObjectId(null);
    }
  }, [historyIndex, history]);
  
  // Redo function
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedo.current = true;
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setObjects([...history[newIndex]]);
      setSelectedObjectId(null);
    }
  }, [historyIndex, history]);

  // Delete selected object (defined early for keyboard shortcuts)
  const deleteSelectedObject = useCallback(() => {
    if (!selectedObjectId) return;
    setObjects(prev => prev.filter(obj => obj.id !== selectedObjectId));
    setSelectedObjectId(null);
  }, [selectedObjectId]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        redo();
      }
      // Delete: Delete or Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedObjectId) {
        // Don't delete if typing in an input
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
          return;
        }
        e.preventDefault();
        deleteSelectedObject();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedObjectId, deleteSelectedObject]);

  // Fetch product and generate PrintSpec
  useEffect(() => {
    async function loadEditor() {
      if (!gelatoProductUid) {
        setError('No product selected');
        setLoading(false);
        return;
      }

      try {
        // Fetch the Gelato product details and generate PrintSpec
        const response = await fetch(`/api/editor/print-spec?productUid=${gelatoProductUid}`);
        const data = await response.json();
        
        if (!data.success) {
          setError(data.error || 'Failed to load print specifications');
          setLoading(false);
          return;
        }
        
        setPrintSpec(data.printSpec);
        setGelatoProduct(data.product);
        setActiveSide(data.printSpec.sides[0]?.id || 'front');
      } catch (err) {
        console.error('Error loading editor:', err);
        setError('Failed to load editor');
      } finally {
        setLoading(false);
      }
    }
    
    loadEditor();
  }, [gelatoProductUid]);

  // Get current side spec
  const currentSide = printSpec?.sides.find(s => s.id === activeSide);

  // Handle image upload
  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;

      const reader = new FileReader();
      reader.onload = (event) => {
        const src = event.target?.result as string;
        const id = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Add to uploaded images library
        setUploadedImages(prev => [...prev, { id, src, name: file.name }]);
      };
      reader.readAsDataURL(file);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Add image to canvas
  const addImageToCanvas = useCallback((src: string) => {
    if (!currentSide) return;
    
    const img = new Image();
    img.onload = () => {
      // Calculate size to fit in safe zone (in mm)
      const safeW = currentSide.trimMm.w - (currentSide.safeMm * 2);
      const safeH = currentSide.trimMm.h - (currentSide.safeMm * 2);
      
      const imgAspect = img.width / img.height;
      let width = safeW * 0.8;
      let height = width / imgAspect;
      
      if (height > safeH * 0.8) {
        height = safeH * 0.8;
        width = height * imgAspect;
      }
      
      // Center in safe zone
      const x = currentSide.bleedMm + currentSide.safeMm + (safeW - width) / 2;
      const y = currentSide.bleedMm + currentSide.safeMm + (safeH - height) / 2;
      
      const newObject: DesignObject = {
        id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'image',
        x,
        y,
        width,
        height,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        side: activeSide,
        src,
      };
      
      setObjects(prev => [...prev, newObject]);
      setSelectedObjectId(newObject.id);
    };
    img.src = src;
  }, [currentSide, activeSide]);

  // Add text to canvas
  const addTextToCanvas = useCallback(() => {
    if (!currentSide || !newText.trim()) return;
    
    const safeW = currentSide.trimMm.w - (currentSide.safeMm * 2);
    const x = currentSide.bleedMm + currentSide.safeMm + safeW / 2;
    const y = currentSide.bleedMm + currentSide.trimMm.h / 2;
    
    const newObject: DesignObject = {
      id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'text',
      x,
      y,
      width: 50, // Auto-size based on text
      height: 10,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      side: activeSide,
      text: newText,
      fontSize: 5, // 5mm font size
      fontFamily: 'Arial',
      fontWeight: 'normal',
      color: '#000000',
      textAlign: 'center',
    };
    
    setObjects(prev => [...prev, newObject]);
    setSelectedObjectId(newObject.id);
    setIsAddingText(false);
    setNewText('Your text here');
  }, [currentSide, activeSide, newText]);

  // Add graphic (emoji) to canvas
  const addGraphicToCanvas = useCallback((emoji: string) => {
    if (!currentSide) return;
    
    const safeW = currentSide.trimMm.w - (currentSide.safeMm * 2);
    const safeH = currentSide.trimMm.h - (currentSide.safeMm * 2);
    
    const x = currentSide.bleedMm + currentSide.safeMm + safeW / 2;
    const y = currentSide.bleedMm + currentSide.safeMm + safeH / 2;
    
    const newObject: DesignObject = {
      id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'text',
      x,
      y,
      width: 20,
      height: 20,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      side: activeSide,
      text: emoji,
      fontSize: 15,
      fontFamily: 'Arial',
      fontWeight: 'normal',
      color: '#000000',
      textAlign: 'center',
    };
    
    setObjects(prev => [...prev, newObject]);
    setSelectedObjectId(newObject.id);
  }, [currentSide, activeSide]);

  // Add shape to canvas
  const addShapeToCanvas = useCallback((shapeType: 'rectangle' | 'circle' | 'line' | 'triangle' | 'star') => {
    if (!currentSide) return;
    
    const safeW = currentSide.trimMm.w - (currentSide.safeMm * 2);
    const safeH = currentSide.trimMm.h - (currentSide.safeMm * 2);
    const size = Math.min(safeW, safeH) * 0.3;
    
    const x = currentSide.bleedMm + currentSide.safeMm + (safeW - size) / 2;
    const y = currentSide.bleedMm + currentSide.safeMm + (safeH - size) / 2;
    
    const newObject: DesignObject = {
      id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'shape',
      x,
      y,
      width: size,
      height: shapeType === 'line' ? 2 : size,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      side: activeSide,
      shapeType,
      fill: shapeType === 'line' ? 'transparent' : '#ded8d3',
      stroke: '#000000',
      strokeWidth: 2,
    };
    
    setObjects(prev => [...prev, newObject]);
    setSelectedObjectId(newObject.id);
  }, [currentSide, activeSide]);

  // Duplicate selected object
  const duplicateObject = useCallback(() => {
    if (!selectedObjectId) return;
    const obj = objects.find(o => o.id === selectedObjectId);
    if (!obj) return;
    
    const newObject: DesignObject = {
      ...obj,
      id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      x: obj.x + 5,
      y: obj.y + 5,
    };
    
    setObjects(prev => [...prev, newObject]);
    setSelectedObjectId(newObject.id);
  }, [selectedObjectId, objects]);

  // Align selected object
  const alignObject = useCallback((alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (!selectedObjectId || !currentSide) return;
    const obj = objects.find(o => o.id === selectedObjectId);
    if (!obj) return;

    const trimX = currentSide.bleedMm;
    const trimY = currentSide.bleedMm;
    const trimW = currentSide.trimMm.w;
    const trimH = currentSide.trimMm.h;

    let newX = obj.x;
    let newY = obj.y;

    switch (alignment) {
      case 'left': newX = trimX + currentSide.safeMm; break;
      case 'center': newX = trimX + (trimW - obj.width) / 2; break;
      case 'right': newX = trimX + trimW - obj.width - currentSide.safeMm; break;
      case 'top': newY = trimY + currentSide.safeMm; break;
      case 'middle': newY = trimY + (trimH - obj.height) / 2; break;
      case 'bottom': newY = trimY + trimH - obj.height - currentSide.safeMm; break;
    }

    // Inline update to avoid circular dependency with updateObject
    setObjects(prev => prev.map(o =>
      o.id === selectedObjectId ? { ...o, x: newX, y: newY } : o
    ));
  }, [selectedObjectId, currentSide, objects]);

  // Set canvas background
  const [canvasBackground, setCanvasBackground] = useState<string>('#ffffff');

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (!template || !currentSide) return;
    
    // Clear current objects for this side
    setObjects(prev => prev.filter(obj => obj.side !== activeSide));
    
    // Add template objects (convert relative positions to absolute)
    const trimW = currentSide.trimMm.w;
    const trimH = currentSide.trimMm.h;
    const bleed = currentSide.bleedMm;
    
    const newObjects = template.objects.map((tObj: any) => ({
      id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: tObj.type,
      x: bleed + (tObj.x * trimW),
      y: bleed + (tObj.y * trimH),
      width: tObj.width ? tObj.width * trimW : 40,
      height: tObj.height ? tObj.height * trimH : 10,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      side: activeSide,
      ...tObj,
    }));
    
    setObjects(prev => [...prev, ...newObjects]);
  }, [currentSide, activeSide]);

  // Move object in layer order
  const moveObjectLayer = useCallback((direction: 'up' | 'down' | 'top' | 'bottom') => {
    if (!selectedObjectId) return;
    
    setObjects(prev => {
      const index = prev.findIndex(obj => obj.id === selectedObjectId);
      if (index === -1) return prev;
      
      const newObjects = [...prev];
      const [obj] = newObjects.splice(index, 1);
      
      switch (direction) {
        case 'up':
          newObjects.splice(Math.min(index + 1, newObjects.length), 0, obj);
          break;
        case 'down':
          newObjects.splice(Math.max(index - 1, 0), 0, obj);
          break;
        case 'top':
          newObjects.push(obj);
          break;
        case 'bottom':
          newObjects.unshift(obj);
          break;
      }
      
      return newObjects;
    });
  }, [selectedObjectId]);

  // Update object property
  const updateObject = useCallback((id: string, updates: Partial<DesignObject>) => {
    setObjects(prev => prev.map(obj => 
      obj.id === id ? { ...obj, ...updates } : obj
    ));
  }, []);

  // ============================================
  // HIGH-RES EXPORT ENGINE - 300 DPI
  // ============================================
  
  // Export a single side at print resolution
  const exportSideAtPrintResolution = useCallback(async (sideId: string): Promise<Blob | null> => {
    if (!printSpec) return null;
    
    const side = printSpec.sides.find(s => s.id === sideId);
    if (!side) return null;
    
    // Calculate export dimensions at 300 DPI
    const DPI = printSpec.dpi; // 300
    const MM_TO_INCH = 1 / 25.4;
    
    // Full export size includes bleed
    const exportWidthMm = side.trimMm.w + (side.bleedMm * 2);
    const exportHeightMm = side.trimMm.h + (side.bleedMm * 2);
    
    const exportWidthPx = Math.round(exportWidthMm * MM_TO_INCH * DPI);
    const exportHeightPx = Math.round(exportHeightMm * MM_TO_INCH * DPI);
    
    // Create high-res canvas
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = exportWidthPx;
    exportCanvas.height = exportHeightPx;
    
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return null;
    
    // Calculate mm to pixel ratio for this export
    const mmToPx = exportWidthPx / exportWidthMm;
    
    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, exportWidthPx, exportHeightPx);
    
    // Get objects for this side
    const sideObjects = objects.filter(obj => obj.side === sideId && obj.visible);
    
    // Draw each object at high resolution
    for (const obj of sideObjects) {
      ctx.save();
      ctx.globalAlpha = obj.opacity;
      
      const x = obj.x * mmToPx;
      const y = obj.y * mmToPx;
      const w = obj.width * mmToPx;
      const h = obj.height * mmToPx;
      
      // Apply rotation around center
      if (obj.rotation !== 0) {
        ctx.translate(x + w / 2, y + h / 2);
        ctx.rotate((obj.rotation * Math.PI) / 180);
        ctx.translate(-(x + w / 2), -(y + h / 2));
      }
      
      if (obj.type === 'image' && obj.src) {
        try {
          const img = await loadImage(obj.src);
          ctx.drawImage(img, x, y, w, h);
        } catch (e) {
          console.error('Failed to load image for export:', e);
        }
      } else if (obj.type === 'text' && obj.text) {
        const fontSize = (obj.fontSize || 5) * mmToPx;
        ctx.font = `${obj.fontWeight || 'normal'} ${fontSize}px ${obj.fontFamily || 'Arial'}`;
        ctx.fillStyle = obj.color || '#000000';
        ctx.textAlign = obj.textAlign || 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(obj.text, x, y + fontSize / 2);
      } else if (obj.type === 'shape') {
        ctx.fillStyle = obj.fill || '#000000';
        if (obj.shapeType === 'rectangle') {
          ctx.fillRect(x, y, w, h);
        } else if (obj.shapeType === 'circle') {
          ctx.beginPath();
          ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      ctx.restore();
    }
    
    // Convert to blob
    return new Promise((resolve) => {
      exportCanvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png', 1.0);
    });
  }, [printSpec, objects, loadImage]);

  // Export all sides
  const exportAllSides = useCallback(async () => {
    if (!printSpec) return;
    
    setIsExporting(true);
    const exportedFiles: { sideId: string; sideName: string; blob: Blob; dimensions: { w: number; h: number } }[] = [];
    
    try {
      for (let i = 0; i < printSpec.sides.length; i++) {
        const side = printSpec.sides[i];
        setExportProgress(`Exporting ${side.name} (${i + 1}/${printSpec.sides.length})...`);
        
        const blob = await exportSideAtPrintResolution(side.id);
        if (blob) {
          const DPI = printSpec.dpi;
          const MM_TO_INCH = 1 / 25.4;
          const exportWidthMm = side.trimMm.w + (side.bleedMm * 2);
          const exportHeightMm = side.trimMm.h + (side.bleedMm * 2);
          
          exportedFiles.push({
            sideId: side.id,
            sideName: side.name,
            blob,
            dimensions: {
              w: Math.round(exportWidthMm * MM_TO_INCH * DPI),
              h: Math.round(exportHeightMm * MM_TO_INCH * DPI),
            },
          });
        }
      }
      
      // Download files
      setExportProgress('Preparing download...');
      
      for (const file of exportedFiles) {
        const url = URL.createObjectURL(file.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${printSpec.name.replace(/\s+/g, '_')}_${file.sideId}_${file.dimensions.w}x${file.dimensions.h}px_300dpi.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Small delay between downloads
        await new Promise(r => setTimeout(r, 300));
      }
      
      setExportProgress(`Exported ${exportedFiles.length} file(s) at 300 DPI`);
      setTimeout(() => setExportProgress(null), 3000);
    } catch (error) {
      console.error('Export failed:', error);
      setExportProgress('Export failed. Please try again.');
      setTimeout(() => setExportProgress(null), 3000);
    } finally {
      setIsExporting(false);
    }
  }, [printSpec, exportSideAtPrintResolution]);

  // ============================================
  // CANVAS MOUSE INTERACTIONS - Drag & Resize
  // ============================================
  
  // Convert screen coordinates to mm coordinates
  const screenToMm = useCallback((screenX: number, screenY: number): { x: number; y: number } | null => {
    if (!canvasRef.current || !canvasDisplayRef.current) return null;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const { displayRatio, scale } = canvasDisplayRef.current;
    
    // Get position relative to canvas
    const canvasX = (screenX - rect.left) / scale;
    const canvasY = (screenY - rect.top) / scale;
    
    // Convert to mm
    const mmX = canvasX / displayRatio;
    const mmY = canvasY / displayRatio;
    
    return { x: mmX, y: mmY };
  }, []);

  // Check if point is near a resize handle
  const getResizeHandle = useCallback((obj: DesignObject, mmX: number, mmY: number): string | null => {
    const handleSize = 3; // mm
    const handles = [
      { id: 'nw', x: obj.x, y: obj.y },
      { id: 'ne', x: obj.x + obj.width, y: obj.y },
      { id: 'sw', x: obj.x, y: obj.y + obj.height },
      { id: 'se', x: obj.x + obj.width, y: obj.y + obj.height },
    ];
    
    for (const handle of handles) {
      if (Math.abs(mmX - handle.x) < handleSize && Math.abs(mmY - handle.y) < handleSize) {
        return handle.id;
      }
    }
    return null;
  }, []);

  // Check if point is inside an object
  const getObjectAtPoint = useCallback((mmX: number, mmY: number): DesignObject | null => {
    // Check objects in reverse order (top to bottom in layer order)
    for (let i = currentSideObjects.length - 1; i >= 0; i--) {
      const obj = currentSideObjects[i];
      if (!obj.visible || obj.locked) continue;
      
      if (mmX >= obj.x && mmX <= obj.x + obj.width &&
          mmY >= obj.y && mmY <= obj.y + obj.height) {
        return obj;
      }
    }
    return null;
  }, [currentSideObjects]);

  // Mouse down handler
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = screenToMm(e.clientX, e.clientY);
    if (!pos) return;
    
    // Check if clicking on a resize handle of selected object
    if (selectedObject && !selectedObject.locked) {
      const handle = getResizeHandle(selectedObject, pos.x, pos.y);
      if (handle) {
        setIsResizing(true);
        setResizeHandle(handle);
        setDragStart({
          x: pos.x,
          y: pos.y,
          objX: selectedObject.x,
          objY: selectedObject.y,
          objW: selectedObject.width,
          objH: selectedObject.height,
        });
        return;
      }
    }
    
    // Check if clicking on an object
    const clickedObject = getObjectAtPoint(pos.x, pos.y);
    
    if (clickedObject) {
      setSelectedObjectId(clickedObject.id);
      if (!clickedObject.locked) {
        setIsDragging(true);
        setDragStart({
          x: pos.x,
          y: pos.y,
          objX: clickedObject.x,
          objY: clickedObject.y,
          objW: clickedObject.width,
          objH: clickedObject.height,
        });
      }
    } else {
      // Clicked on empty space - deselect
      setSelectedObjectId(null);
    }
  }, [screenToMm, selectedObject, getResizeHandle, getObjectAtPoint]);

  // Mouse move handler
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = screenToMm(e.clientX, e.clientY);
    if (!pos || !dragStart || !selectedObjectId) return;
    
    const deltaX = pos.x - dragStart.x;
    const deltaY = pos.y - dragStart.y;
    
    if (isDragging) {
      // Move object with optional snap-to-grid
      let newX = dragStart.objX + deltaX;
      let newY = dragStart.objY + deltaY;
      
      if (snapToGrid) {
        newX = Math.round(newX / gridSize) * gridSize;
        newY = Math.round(newY / gridSize) * gridSize;
      }
      
      updateObject(selectedObjectId, { x: newX, y: newY });
    } else if (isResizing && resizeHandle) {
      // Resize object based on which handle is being dragged
      let newX = dragStart.objX;
      let newY = dragStart.objY;
      let newW = dragStart.objW;
      let newH = dragStart.objH;
      
      switch (resizeHandle) {
        case 'se':
          newW = Math.max(5, dragStart.objW + deltaX);
          newH = Math.max(5, dragStart.objH + deltaY);
          break;
        case 'sw':
          newX = dragStart.objX + deltaX;
          newW = Math.max(5, dragStart.objW - deltaX);
          newH = Math.max(5, dragStart.objH + deltaY);
          break;
        case 'ne':
          newY = dragStart.objY + deltaY;
          newW = Math.max(5, dragStart.objW + deltaX);
          newH = Math.max(5, dragStart.objH - deltaY);
          break;
        case 'nw':
          newX = dragStart.objX + deltaX;
          newY = dragStart.objY + deltaY;
          newW = Math.max(5, dragStart.objW - deltaX);
          newH = Math.max(5, dragStart.objH - deltaY);
          break;
      }
      
      updateObject(selectedObjectId, { x: newX, y: newY, width: newW, height: newH });
    }
  }, [screenToMm, dragStart, selectedObjectId, isDragging, isResizing, resizeHandle, updateObject]);

  // Mouse up handler
  const handleCanvasMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    setDragStart(null);
  }, []);

  // Update cursor based on hover
  const getCanvasCursor = useCallback((): string => {
    if (isDragging) return 'grabbing';
    if (isResizing) {
      if (resizeHandle === 'nw' || resizeHandle === 'se') return 'nwse-resize';
      if (resizeHandle === 'ne' || resizeHandle === 'sw') return 'nesw-resize';
    }
    return 'crosshair';
  }, [isDragging, isResizing, resizeHandle]);

  // ============================================
  // SAVE DRAFT
  // ============================================
  
  const saveDraft = useCallback(async (): Promise<string | null> => {
    if (!printSpec || !gelatoProductUid) return null;
    
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: draftId, // If exists, update; otherwise create
          gelatoProductUid,
          printSpecId: printSpec.id,
          dpi: printSpec.dpi,
          designObjects: objects,
          sessionId: typeof window !== 'undefined' ? sessionStorage.getItem('editorSessionId') || crypto.randomUUID() : null,
          status: 'draft',
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setDraftId(result.data.id);
        setLastSaved(new Date());
        
        // Store session ID if new
        if (typeof window !== 'undefined' && !sessionStorage.getItem('editorSessionId')) {
          sessionStorage.setItem('editorSessionId', crypto.randomUUID());
        }
        
        return result.data.id;
      } else {
        console.error('Failed to save draft:', result.error);
        return null;
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [printSpec, gelatoProductUid, draftId, objects]);
  
  // Save and continue to checkout
  const handleSaveAndContinue = useCallback(async () => {
    // Save draft first
    const savedDraftId = await saveDraft();
    
    if (savedDraftId) {
      // Redirect to checkout
      router.push(`/checkout/${savedDraftId}`);
    } else {
      alert('Please save your design before continuing');
    }
  }, [saveDraft, router]);

  // Export current side only
  const exportCurrentSide = useCallback(async () => {
    if (!printSpec || !currentSide) return;
    
    setIsExporting(true);
    setExportProgress(`Exporting ${currentSide.name}...`);
    
    try {
      const blob = await exportSideAtPrintResolution(activeSide);
      
      if (blob) {
        const DPI = printSpec.dpi;
        const MM_TO_INCH = 1 / 25.4;
        const exportWidthMm = currentSide.trimMm.w + (currentSide.bleedMm * 2);
        const exportHeightMm = currentSide.trimMm.h + (currentSide.bleedMm * 2);
        const w = Math.round(exportWidthMm * MM_TO_INCH * DPI);
        const h = Math.round(exportHeightMm * MM_TO_INCH * DPI);
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${printSpec.name.replace(/\s+/g, '_')}_${activeSide}_${w}x${h}px_300dpi.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setExportProgress(`Exported ${currentSide.name} at ${w}×${h}px (300 DPI)`);
        setTimeout(() => setExportProgress(null), 3000);
      }
    } catch (error) {
      console.error('Export failed:', error);
      setExportProgress('Export failed. Please try again.');
      setTimeout(() => setExportProgress(null), 3000);
    } finally {
      setIsExporting(false);
    }
  }, [printSpec, currentSide, activeSide, exportSideAtPrintResolution]);

  // Calculate canvas display dimensions
  const getCanvasDisplaySize = useCallback(() => {
    if (!currentSide) return { width: 800, height: 600, scale: 1 };
    
    const maxWidth = 700;
    const maxHeight = 500;
    
    // Calculate full size with bleed (in mm, converted to conceptual pixels)
    const fullWidthMm = currentSide.trimMm.w + (currentSide.bleedMm * 2);
    const fullHeightMm = currentSide.trimMm.h + (currentSide.bleedMm * 2);
    
    // Use a display ratio (not actual DPI, just for screen display)
    const displayRatio = 3; // 3 pixels per mm for display
    const fullWidthPx = fullWidthMm * displayRatio;
    const fullHeightPx = fullHeightMm * displayRatio;
    
    // Scale to fit
    const scaleX = maxWidth / fullWidthPx;
    const scaleY = maxHeight / fullHeightPx;
    const scale = Math.min(scaleX, scaleY, 1);
    
    return {
      width: Math.round(fullWidthPx * scale),
      height: Math.round(fullHeightPx * scale),
      scale,
      displayRatio,
    };
  }, [currentSide]);

  // Draw canvas with guides and objects
  useEffect(() => {
    if (!canvasRef.current || !currentSide) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height, displayRatio, scale } = getCanvasDisplaySize();
    
    // Store display info for mouse coordinate conversion
    canvasDisplayRef.current = { displayRatio, scale };
    
    // Set canvas size
    canvas.width = width;
    canvas.height = height;
    
    // Scale context
    ctx.scale(scale, scale);
    
    const bleed = currentSide.bleedMm * displayRatio;
    const safe = currentSide.safeMm * displayRatio;
    const trimW = currentSide.trimMm.w * displayRatio;
    const trimH = currentSide.trimMm.h * displayRatio;
    
    // Clear canvas with background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale);
    
    // Draw bleed area background
    if (showGuides && !showPreview) {
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(0, 0, trimW + bleed * 2, trimH + bleed * 2);
    }
    
    // Draw trim area with user-selected background
    if (canvasBackground.startsWith('linear-gradient')) {
      // Parse gradient and create canvas gradient
      const gradient = ctx.createLinearGradient(bleed, bleed, bleed + trimW, bleed + trimH);
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(1, '#764ba2');
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = canvasBackground;
    }
    ctx.fillRect(bleed, bleed, trimW, trimH)
    
    // Draw design objects
    const drawObjects = async () => {
      for (const obj of currentSideObjects) {
        if (!obj.visible) continue;
        
        ctx.save();
        ctx.globalAlpha = obj.opacity;
        
        const x = obj.x * displayRatio;
        const y = obj.y * displayRatio;
        const w = obj.width * displayRatio;
        const h = obj.height * displayRatio;
        
        // Apply rotation around center
        if (obj.rotation !== 0) {
          ctx.translate(x + w / 2, y + h / 2);
          ctx.rotate((obj.rotation * Math.PI) / 180);
          ctx.translate(-(x + w / 2), -(y + h / 2));
        }
        
        if (obj.type === 'image' && obj.src) {
          try {
            const img = await loadImage(obj.src);
            
            // Apply filter if set
            if (obj.filter && obj.filter !== 'none') {
              ctx.save();
              if (obj.filter === 'grayscale') ctx.filter = 'grayscale(100%)';
              else if (obj.filter === 'sepia') ctx.filter = 'sepia(100%)';
              else if (obj.filter === 'blur') ctx.filter = 'blur(2px)';
            }
            
            ctx.drawImage(img, x, y, w, h);
            
            if (obj.filter && obj.filter !== 'none') {
              ctx.restore();
            }
          } catch (e) {
            // Draw placeholder for failed images
            ctx.fillStyle = '#e5e7eb';
            ctx.fillRect(x, y, w, h);
            ctx.fillStyle = '#9ca3af';
            ctx.font = '12px system-ui';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Image', x + w / 2, y + h / 2);
          }
        } else if (obj.type === 'text' && obj.text) {
          const fontSize = (obj.fontSize || 5) * displayRatio;
          ctx.font = `${obj.fontWeight || 'normal'} ${fontSize}px ${obj.fontFamily || 'Arial'}`;
          ctx.fillStyle = obj.color || '#000000';
          ctx.textAlign = obj.textAlign || 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(obj.text, x, y + fontSize / 2);
        } else if (obj.type === 'shape') {
          const fillColor = obj.fill || '#ded8d3';
          const strokeColor = obj.stroke || '#000000';
          const strokeWidth = (obj.strokeWidth || 2) * displayRatio * 0.1;
          
          // Apply foil effect (shimmer gradient)
          if (obj.foilEffect && obj.foilEffect !== 'none') {
            const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
            if (obj.foilEffect === 'gold') {
              gradient.addColorStop(0, '#FFD700');
              gradient.addColorStop(0.5, '#FFF8DC');
              gradient.addColorStop(1, '#DAA520');
            } else if (obj.foilEffect === 'silver') {
              gradient.addColorStop(0, '#C0C0C0');
              gradient.addColorStop(0.5, '#FFFFFF');
              gradient.addColorStop(1, '#A9A9A9');
            } else if (obj.foilEffect === 'rose-gold') {
              gradient.addColorStop(0, '#B76E79');
              gradient.addColorStop(0.5, '#E8C4C4');
              gradient.addColorStop(1, '#8B5A5A');
            }
            ctx.fillStyle = gradient;
          } else {
            ctx.fillStyle = fillColor;
          }
          
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = strokeWidth;
          
          if (obj.shapeType === 'rectangle') {
            if (fillColor !== 'transparent') ctx.fillRect(x, y, w, h);
            if (strokeWidth > 0) ctx.strokeRect(x, y, w, h);
          } else if (obj.shapeType === 'circle') {
            ctx.beginPath();
            ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
            if (fillColor !== 'transparent') ctx.fill();
            if (strokeWidth > 0) ctx.stroke();
          } else if (obj.shapeType === 'triangle') {
            ctx.beginPath();
            ctx.moveTo(x + w / 2, y);
            ctx.lineTo(x + w, y + h);
            ctx.lineTo(x, y + h);
            ctx.closePath();
            if (fillColor !== 'transparent') ctx.fill();
            if (strokeWidth > 0) ctx.stroke();
          } else if (obj.shapeType === 'star') {
            const cx = x + w / 2;
            const cy = y + h / 2;
            const outerR = Math.min(w, h) / 2;
            const innerR = outerR * 0.4;
            const spikes = 5;
            ctx.beginPath();
            for (let i = 0; i < spikes * 2; i++) {
              const r = i % 2 === 0 ? outerR : innerR;
              const angle = (i * Math.PI) / spikes - Math.PI / 2;
              const px = cx + Math.cos(angle) * r;
              const py = cy + Math.sin(angle) * r;
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            if (fillColor !== 'transparent') ctx.fill();
            if (strokeWidth > 0) ctx.stroke();
          } else if (obj.shapeType === 'line') {
            ctx.beginPath();
            ctx.moveTo(x, y + h / 2);
            ctx.lineTo(x + w, y + h / 2);
            ctx.stroke();
          }
        }
        
        // Draw selection box
        if (obj.id === selectedObjectId && !showPreview) {
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
          ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
          
          // Draw resize handles
          const handleSize = 8;
          ctx.fillStyle = '#3b82f6';
          // Corners
          ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
          ctx.fillRect(x + w - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
          ctx.fillRect(x - handleSize / 2, y + h - handleSize / 2, handleSize, handleSize);
          ctx.fillRect(x + w - handleSize / 2, y + h - handleSize / 2, handleSize, handleSize);
        }
        
        ctx.restore();
      }
    };
    
    drawObjects();
    
    // Draw fold lines
    if (showGuides && !showPreview && currentSide.foldLines) {
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      
      currentSide.foldLines.forEach(line => {
        ctx.beginPath();
        ctx.moveTo(line.x1 * displayRatio + bleed, line.y1 * displayRatio + bleed);
        ctx.lineTo(line.x2 * displayRatio + bleed, line.y2 * displayRatio + bleed);
        ctx.stroke();
      });
      
      ctx.setLineDash([]);
    }
    
    // Draw guides
    if (showGuides && !showPreview) {
      // Bleed line (purple/magenta)
      ctx.strokeStyle = '#9333ea';
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, trimW + bleed * 2 - 1, trimH + bleed * 2 - 1);
      
      // Trim line (gray dashed)
      ctx.strokeStyle = '#666666';
      ctx.setLineDash([6, 3]);
      ctx.strokeRect(bleed + 0.5, bleed + 0.5, trimW - 1, trimH - 1);
      ctx.setLineDash([]);
      
      // Safe zone (green)
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1;
      ctx.strokeRect(bleed + safe + 0.5, bleed + safe + 0.5, trimW - safe * 2 - 1, trimH - safe * 2 - 1);
    }
    
    // Draw placeholder if no objects
    if (currentSideObjects.length === 0 && !showPreview) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        'Drop your design here',
        (trimW + bleed * 2) / 2,
        (trimH + bleed * 2) / 2 - 20
      );
      ctx.font = '12px system-ui';
      ctx.fillText(
        'Or use the tools on the left',
        (trimW + bleed * 2) / 2,
        (trimH + bleed * 2) / 2 + 10
      );
    }
    
  }, [currentSide, showGuides, showPreview, getCanvasDisplaySize, currentSideObjects, selectedObjectId, loadImage, canvasBackground]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-lightest text-brand-darkest flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark mx-auto mb-4"></div>
          <p>Loading editor...</p>
        </div>
      </div>
    );
  }

  if (error || !printSpec) {
    return (
      <div className="min-h-screen bg-brand-lightest text-brand-darkest flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-brand-medium mb-6">{error || 'Failed to load editor'}</p>
          <Link 
            href={`/shop/${productSlug}`}
            className="text-brand-dark hover:underline"
          >
            ← Back to product
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-lightest text-brand-darkest flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-brand-light px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href={`/shop/${productSlug}`}
            className="text-brand-medium hover:text-brand-dark"
          >
            ← Back
          </Link>
          <div className="h-6 w-px bg-brand-light" />
          <h1 className="font-semibold">{printSpec.name}</h1>
          <span className="text-sm text-brand-medium">
            {printSpec.trimWidthMm}mm × {printSpec.trimHeightMm}mm
          </span>
          
          {/* Undo/Redo buttons */}
          <div className="h-6 w-px bg-brand-light" />
          <div className="flex items-center gap-1">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-2 rounded hover:bg-brand-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Undo (Ctrl+Z)"
            >
              ↩️
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 rounded hover:bg-brand-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Redo (Ctrl+Y)"
            >
              ↪️
            </button>
          </div>
          
          {/* Zoom controls */}
          <div className="h-6 w-px bg-brand-light" />
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCanvasScale(s => Math.max(0.25, s - 0.25))}
              className="p-2 rounded hover:bg-brand-light transition-colors"
              title="Zoom Out"
            >
              ➖
            </button>
            <span className="text-sm w-14 text-center text-brand-medium">{Math.round(canvasScale * 100)}%</span>
            <button
              onClick={() => setCanvasScale(s => Math.min(2, s + 0.25))}
              className="p-2 rounded hover:bg-brand-light transition-colors"
              title="Zoom In"
            >
              ➕
            </button>
            <button
              onClick={() => setCanvasScale(1)}
              className="p-2 rounded hover:bg-brand-light transition-colors text-xs"
              title="Reset Zoom"
            >
              100%
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              showPreview ? 'bg-brand-dark text-white' : 'bg-brand-light hover:bg-brand-medium'
            }`}
          >
            👁️ Preview
          </button>
          
          {/* Export Dropdown */}
          <div className="relative group">
            <button
              disabled={isExporting}
              className="px-4 py-2 rounded-lg bg-brand-light hover:bg-brand-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isExporting ? '⏳' : '📤'} Export
            </button>
            <div className="absolute right-0 mt-1 w-56 bg-white border border-brand-light rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <button
                onClick={exportCurrentSide}
                disabled={isExporting}
                className="w-full px-4 py-3 text-left hover:bg-brand-light rounded-t-lg flex items-center gap-2 disabled:opacity-50"
              >
                <span>📄</span>
                <div>
                  <div className="font-medium">Export Current Side</div>
                  <div className="text-xs text-brand-medium">300 DPI PNG</div>
                </div>
              </button>
              <button
                onClick={exportAllSides}
                disabled={isExporting}
                className="w-full px-4 py-3 text-left hover:bg-brand-light rounded-b-lg flex items-center gap-2 border-t border-brand-light disabled:opacity-50"
              >
                <span>📦</span>
                <div>
                  <div className="font-medium">Export All Sides</div>
                  <div className="text-xs text-brand-medium">All {printSpec?.sides.length} surfaces at 300 DPI</div>
                </div>
              </button>
            </div>
          </div>
          
          <button
            onClick={saveDraft}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg bg-brand-light hover:bg-brand-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <span className="animate-spin">⏳</span>
                Saving...
              </>
            ) : lastSaved ? (
              <>
                ✓ Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </>
            ) : (
              'Save Draft'
            )}
          </button>
          <button
            onClick={handleSaveAndContinue}
            disabled={objects.length === 0}
            className="px-6 py-2 rounded-lg bg-brand-dark hover:bg-brand-medium text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save & Continue
          </button>
        </div>
      </header>
      
      {/* Export Progress Toast */}
      {exportProgress && (
        <div className="fixed top-20 right-4 z-50 bg-white border border-brand-light rounded-lg shadow-xl px-4 py-3 flex items-center gap-3 animate-in slide-in-from-right">
          {isExporting ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-dark"></div>
          ) : (
            <span className="text-green-500">✓</span>
          )}
          <span className="text-sm">{exportProgress}</span>
        </div>
      )}
      
      <div className="flex-1 flex">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          multiple
          className="hidden"
        />
        
        {/* Left Sidebar - Tools */}
        <aside className="w-72 bg-white border-r border-brand-light flex flex-col">
          {/* Tool Tabs - Two rows */}
          <div className="border-b border-brand-light">
            <div className="grid grid-cols-5 gap-0">
              {[
                { id: 'files', icon: '📁', label: 'Files' },
                { id: 'text', icon: 'T', label: 'Text' },
                { id: 'shapes', icon: '◻️', label: 'Shapes' },
                { id: 'graphics', icon: '🎯', label: 'Graphics' },
                { id: 'templates', icon: '📋', label: 'Layout' },
              ].map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className={`py-2 flex flex-col items-center gap-0.5 transition-colors border-b-2 ${
                    activeTool === tool.id
                      ? 'bg-brand-light text-brand-darkest border-brand-dark'
                      : 'text-brand-medium hover:text-brand-dark hover:bg-brand-light/50 border-transparent'
                  }`}
                >
                  <span className="text-sm">{tool.icon}</span>
                  <span className="text-[9px]">{tool.label}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-0">
              {[
                { id: 'backgrounds', icon: '🎨', label: 'BG' },
                { id: 'layers', icon: '☰', label: 'Layers' },
                { id: 'align', icon: '⊞', label: 'Align' },
                { id: 'effects', icon: '✨', label: 'Effects' },
                { id: 'settings', icon: '⚙️', label: 'More' },
              ].map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className={`py-2 flex flex-col items-center gap-0.5 transition-colors border-b-2 ${
                    activeTool === tool.id
                      ? 'bg-brand-light text-brand-darkest border-brand-dark'
                      : 'text-brand-medium hover:text-brand-dark hover:bg-brand-light/50 border-transparent'
                  }`}
                >
                  <span className="text-sm">{tool.icon}</span>
                  <span className="text-[9px]">{tool.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Tool Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Files Panel */}
            {activeTool === 'files' && (
              <div className="space-y-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 rounded-lg border-2 border-dashed border-brand-light hover:border-brand-medium text-brand-medium hover:text-brand-dark transition-colors"
                >
                  + Upload Images
                </button>
                
                {uploadedImages.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-brand-medium">Your Images</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {uploadedImages.map((img) => (
                        <button
                          key={img.id}
                          onClick={() => addImageToCanvas(img.src)}
                          className="relative aspect-square rounded-lg overflow-hidden border-2 border-brand-light hover:border-brand-dark transition-colors group"
                        >
                          <img 
                            src={img.src} 
                            alt={img.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-brand-darkest text-xs">Add</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Text Panel */}
            {activeTool === 'text' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-brand-medium mb-2">Add Text</label>
                  <textarea
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-brand-light border border-brand-light text-brand-darkest text-sm resize-none"
                    rows={3}
                    placeholder="Enter your text..."
                  />
                  <button
                    onClick={addTextToCanvas}
                    className="w-full mt-2 py-2 rounded-lg bg-brand-dark hover:bg-brand-medium text-white font-semibold transition-colors"
                  >
                    Add Text to Canvas
                  </button>
                </div>
                
                {selectedObject?.type === 'text' && (
                  <div className="space-y-3 pt-4 border-t border-brand-light">
                    <h4 className="text-sm font-semibold text-brand-darkest">Edit Selected Text</h4>
                    <textarea
                      value={selectedObject.text || ''}
                      onChange={(e) => updateObject(selectedObject.id, { text: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-brand-light border border-brand-light text-brand-darkest text-sm resize-none"
                      rows={2}
                    />
                    <div className="space-y-2">
                      <label className="text-xs text-brand-medium">Font Family</label>
                      <select
                        value={selectedObject.fontFamily || 'Arial'}
                        onChange={(e) => updateObject(selectedObject.id, { fontFamily: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-brand-light border border-brand-light text-brand-darkest text-sm"
                      >
                        {AVAILABLE_FONTS.map((font) => (
                          <option key={font.name} value={font.family}>{font.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs text-brand-medium">Color</label>
                        <input
                          type="color"
                          value={selectedObject.color || '#000000'}
                          onChange={(e) => updateObject(selectedObject.id, { color: e.target.value })}
                          className="w-full h-10 rounded cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-brand-medium">Size (mm)</label>
                        <input
                          type="number"
                          value={selectedObject.fontSize || 5}
                          onChange={(e) => updateObject(selectedObject.id, { fontSize: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 rounded-lg bg-brand-light border border-brand-light text-brand-darkest text-sm"
                          min={1}
                          max={50}
                          step={0.5}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-brand-medium">Alignment</label>
                      <div className="grid grid-cols-3 gap-1">
                        {(['left', 'center', 'right'] as const).map((align) => (
                          <button
                            key={align}
                            onClick={() => updateObject(selectedObject.id, { textAlign: align })}
                            className={`py-2 rounded text-sm transition-colors ${
                              selectedObject.textAlign === align
                                ? 'bg-brand-dark text-white'
                                : 'bg-brand-light hover:bg-brand-medium'
                            }`}
                          >
                            {align === 'left' ? '⬅' : align === 'center' ? '↔' : '➡'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-brand-medium">Weight</label>
                      <div className="grid grid-cols-2 gap-1">
                        {(['normal', 'bold'] as const).map((weight) => (
                          <button
                            key={weight}
                            onClick={() => updateObject(selectedObject.id, { fontWeight: weight })}
                            className={`py-2 rounded text-sm transition-colors ${
                              (selectedObject.fontWeight || 'normal') === weight
                                ? 'bg-brand-dark text-white'
                                : 'bg-brand-light hover:bg-brand-medium'
                            }`}
                          >
                            {weight === 'normal' ? 'Normal' : 'Bold'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Layers Panel */}
            {activeTool === 'layers' && (
              <div className="space-y-2">
                {currentSideObjects.length === 0 ? (
                  <p className="text-sm text-brand-medium text-center py-4">No objects yet</p>
                ) : (
                  [...currentSideObjects].reverse().map((obj, index) => (
                    <button
                      key={obj.id}
                      onClick={() => setSelectedObjectId(obj.id)}
                      className={`w-full px-3 py-2 rounded-lg text-left text-sm flex items-center gap-2 transition-colors ${
                        selectedObjectId === obj.id
                          ? 'bg-brand-dark text-white'
                          : 'bg-brand-light text-brand-darkest hover:bg-brand-medium'
                      }`}
                    >
                      <span>{obj.type === 'image' ? '🖼️' : obj.type === 'text' ? 'T' : '◻️'}</span>
                      <span className="flex-1 truncate">
                        {obj.type === 'text' ? obj.text : `${obj.type} ${index + 1}`}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateObject(obj.id, { visible: !obj.visible });
                        }}
                        className="opacity-60 hover:opacity-100"
                      >
                        {obj.visible ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </button>
                  ))
                )}
                
                {selectedObjectId && (
                  <div className="pt-4 border-t border-brand-light space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => moveObjectLayer('up')}
                        className="py-2 rounded bg-brand-light hover:bg-brand-medium text-sm"
                      >
                        ↑ Up
                      </button>
                      <button
                        onClick={() => moveObjectLayer('down')}
                        className="py-2 rounded bg-brand-light hover:bg-brand-medium text-sm"
                      >
                        ↓ Down
                      </button>
                    </div>
                    <button
                      onClick={duplicateObject}
                      className="w-full py-2 rounded bg-brand-light hover:bg-brand-medium text-sm"
                    >
                      📋 Duplicate
                    </button>
                    <button
                      onClick={deleteSelectedObject}
                      className="w-full py-2 rounded bg-red-100 hover:bg-red-200 text-red-600 text-sm"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Shapes Panel */}
            {activeTool === 'shapes' && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-brand-darkest">Add Shape</h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'rectangle', icon: '◻️', label: 'Rectangle' },
                    { type: 'circle', icon: '⭕', label: 'Circle' },
                    { type: 'triangle', icon: '△', label: 'Triangle' },
                    { type: 'line', icon: '—', label: 'Line' },
                    { type: 'star', icon: '⭐', label: 'Star' },
                  ].map((shape) => (
                    <button
                      key={shape.type}
                      onClick={() => addShapeToCanvas(shape.type as any)}
                      className="py-3 rounded bg-brand-light hover:bg-brand-medium text-center transition-colors"
                    >
                      <div className="text-2xl">{shape.icon}</div>
                      <div className="text-[10px] text-brand-medium mt-1">{shape.label}</div>
                    </button>
                  ))}
                </div>
                
                {selectedObject?.type === 'shape' && (
                  <div className="pt-4 border-t border-brand-light space-y-3">
                    <h4 className="text-sm font-semibold text-brand-darkest">Shape Properties</h4>
                    <div className="space-y-2">
                      <label className="text-xs text-brand-medium">Fill Color</label>
                      <input
                        type="color"
                        value={selectedObject.fill || '#ded8d3'}
                        onChange={(e) => updateObject(selectedObject.id, { fill: e.target.value })}
                        className="w-full h-10 rounded cursor-pointer"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-brand-medium">Stroke Color</label>
                      <input
                        type="color"
                        value={selectedObject.stroke || '#000000'}
                        onChange={(e) => updateObject(selectedObject.id, { stroke: e.target.value })}
                        className="w-full h-10 rounded cursor-pointer"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-brand-medium">Stroke Width</label>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={selectedObject.strokeWidth || 2}
                        onChange={(e) => updateObject(selectedObject.id, { strokeWidth: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Graphics Panel */}
            {activeTool === 'graphics' && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-brand-darkest">Graphics & Clipart</h4>
                <p className="text-xs text-brand-medium">Click to add to canvas</p>
                {GRAPHICS.map((category) => (
                  <div key={category.category} className="space-y-2">
                    <h5 className="text-xs font-medium text-brand-medium">{category.category}</h5>
                    <div className="grid grid-cols-5 gap-1">
                      {category.items.map((emoji, idx) => (
                        <button
                          key={idx}
                          onClick={() => addGraphicToCanvas(emoji)}
                          className="aspect-square rounded bg-brand-light hover:bg-brand-medium text-xl flex items-center justify-center transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Templates Panel */}
            {activeTool === 'templates' && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-brand-darkest">Templates</h4>
                <p className="text-xs text-brand-medium">Choose a template to start with</p>
                <div className="space-y-2">
                  {TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => applyTemplate(template.id)}
                      className="w-full py-3 px-3 rounded bg-brand-light hover:bg-brand-medium text-left transition-colors"
                    >
                      <div className="font-medium text-brand-darkest">{template.name}</div>
                      <div className="text-xs text-brand-medium">{template.objects.length} elements</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Backgrounds Panel */}
            {activeTool === 'backgrounds' && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-brand-darkest">Solid Colors</h4>
                <div className="grid grid-cols-4 gap-2">
                  {BACKGROUND_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setCanvasBackground(color)}
                      className={`aspect-square rounded border-2 transition-all ${
                        canvasBackground === color ? 'border-brand-dark scale-110' : 'border-brand-light'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                
                <h4 className="text-sm font-semibold text-brand-darkest pt-2">Gradients</h4>
                <div className="grid grid-cols-2 gap-2">
                  {BACKGROUND_GRADIENTS.map((gradient) => (
                    <button
                      key={gradient}
                      onClick={() => setCanvasBackground(gradient)}
                      className={`h-12 rounded border-2 transition-all ${
                        canvasBackground === gradient ? 'border-brand-dark scale-105' : 'border-brand-light'
                      }`}
                      style={{ background: gradient }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Align Panel */}
            {activeTool === 'align' && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-brand-darkest">Align Object</h4>
                {!selectedObjectId ? (
                  <p className="text-xs text-brand-medium">Select an object to align</p>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs text-brand-medium">Horizontal</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => alignObject('left')} className="py-2 rounded bg-brand-light hover:bg-brand-medium text-sm">⬅️ Left</button>
                        <button onClick={() => alignObject('center')} className="py-2 rounded bg-brand-light hover:bg-brand-medium text-sm">↔️ Center</button>
                        <button onClick={() => alignObject('right')} className="py-2 rounded bg-brand-light hover:bg-brand-medium text-sm">➡️ Right</button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-brand-medium">Vertical</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => alignObject('top')} className="py-2 rounded bg-brand-light hover:bg-brand-medium text-sm">⬆️ Top</button>
                        <button onClick={() => alignObject('middle')} className="py-2 rounded bg-brand-light hover:bg-brand-medium text-sm">↕️ Middle</button>
                        <button onClick={() => alignObject('bottom')} className="py-2 rounded bg-brand-light hover:bg-brand-medium text-sm">⬇️ Bottom</button>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-brand-light space-y-2">
                      <label className="text-xs text-brand-medium">Rotation: {selectedObject?.rotation || 0}°</label>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        step="1"
                        value={selectedObject?.rotation || 0}
                        onChange={(e) => updateObject(selectedObjectId, { rotation: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                      <div className="grid grid-cols-4 gap-1">
                        {[0, 90, 180, 270].map((deg) => (
                          <button
                            key={deg}
                            onClick={() => updateObject(selectedObjectId, { rotation: deg })}
                            className="py-1 text-xs rounded bg-brand-light hover:bg-brand-medium"
                          >
                            {deg}°
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="pt-4 border-t border-brand-light space-y-2">
                      <label className="text-xs text-brand-medium">Opacity: {Math.round((selectedObject?.opacity || 1) * 100)}%</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={selectedObject?.opacity || 1}
                        onChange={(e) => updateObject(selectedObjectId, { opacity: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Effects Panel */}
            {activeTool === 'effects' && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-brand-darkest">Image Filters</h4>
                {selectedObject?.type !== 'image' ? (
                  <p className="text-xs text-brand-medium">Select an image to apply filters</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'none', label: 'None', style: {} },
                      { id: 'grayscale', label: 'B&W', style: { filter: 'grayscale(100%)' } },
                      { id: 'sepia', label: 'Sepia', style: { filter: 'sepia(100%)' } },
                      { id: 'blur', label: 'Blur', style: { filter: 'blur(2px)' } },
                    ].map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => updateObject(selectedObject.id, { filter: filter.id as any })}
                        className={`py-3 rounded text-center transition-colors ${
                          (selectedObject.filter || 'none') === filter.id
                            ? 'bg-brand-dark text-white'
                            : 'bg-brand-light hover:bg-brand-medium'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Settings Panel */}
            {activeTool === 'settings' && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-brand-darkest">Canvas Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-brand-medium">Show Guides</span>
                    <button
                      onClick={() => setShowGuides(!showGuides)}
                      className={`w-12 h-6 rounded-full transition-colors ${showGuides ? 'bg-brand-dark' : 'bg-brand-light'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${showGuides ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-brand-medium">Snap to Grid ({gridSize}mm)</span>
                    <button
                      onClick={() => setSnapToGrid(!snapToGrid)}
                      className={`w-12 h-6 rounded-full transition-colors ${snapToGrid ? 'bg-brand-dark' : 'bg-brand-light'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${snapToGrid ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-brand-medium">Zoom: {Math.round(canvasScale * 100)}%</label>
                    <input
                      type="range"
                      min="0.25"
                      max="2"
                      step="0.05"
                      value={canvasScale}
                      onChange={(e) => setCanvasScale(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="grid grid-cols-4 gap-1">
                      {[0.5, 0.75, 1, 1.5].map((zoom) => (
                        <button
                          key={zoom}
                          onClick={() => setCanvasScale(zoom)}
                          className="py-1 text-xs rounded bg-brand-light hover:bg-brand-medium"
                        >
                          {zoom * 100}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Foil options moved here */}
                <div className="pt-4 border-t border-brand-light">
                  <h4 className="text-sm font-semibold text-brand-darkest mb-2">Foil Effects</h4>
                  <p className="text-xs text-brand-medium mb-2">Apply metallic foil to shapes</p>
                  {selectedObject?.type === 'shape' ? (
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'none', label: 'None', color: '#ffffff' },
                        { id: 'gold', label: 'Gold', color: '#FFD700' },
                        { id: 'silver', label: 'Silver', color: '#C0C0C0' },
                        { id: 'rose-gold', label: 'Rose', color: '#B76E79' },
                      ].map((foil) => (
                        <button
                          key={foil.id}
                          onClick={() => updateObject(selectedObject.id, { foilEffect: foil.id as any })}
                          className={`py-2 rounded text-xs text-center transition-colors border-2 ${
                            (selectedObject.foilEffect || 'none') === foil.id
                              ? 'border-brand-dark'
                              : 'border-transparent'
                          }`}
                          style={{ backgroundColor: foil.color }}
                        >
                          {foil.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-brand-medium italic">Select a shape first</p>
                  )}
                </div>
                
                <div className="pt-4 border-t border-brand-light">
                  <h4 className="text-sm font-semibold text-brand-darkest mb-2">Product Info</h4>
                  <div className="text-xs text-brand-medium space-y-1">
                    <p>Size: {printSpec?.trimWidthMm}mm × {printSpec?.trimHeightMm}mm</p>
                    <p>Export: {printSpec?.exportWidthPx} × {printSpec?.exportHeightPx}px</p>
                    <p>DPI: {printSpec?.dpi}</p>
                    <p>Bleed: {currentSide?.bleedMm}mm</p>
                    <p>Safe Zone: {currentSide?.safeMm}mm</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
        
        {/* Main Canvas Area */}
        <main className="flex-1 flex flex-col">
          {/* Side Tabs (for multi-surface products) */}
          {printSpec.sides.length > 1 && (
            <div className="bg-white/50 px-4 py-2 flex gap-2 border-b border-brand-light">
              {printSpec.sides.map((side) => (
                <button
                  key={side.id}
                  onClick={() => setActiveSide(side.id)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeSide === side.id
                      ? 'bg-brand-dark text-white font-semibold'
                      : 'bg-brand-light text-brand-medium hover:bg-brand-medium'
                  }`}
                >
                  {side.name}
                </button>
              ))}
            </div>
          )}
          
          {/* Canvas Container */}
          <div className="flex-1 flex items-center justify-center p-8 bg-brand-lightest/50 overflow-auto">
            <div 
              className="relative transition-transform duration-200"
              style={{ transform: `scale(${canvasScale})`, transformOrigin: 'center center' }}
            >
              <canvas
                ref={canvasRef}
                className="shadow-2xl"
                style={{ cursor: getCanvasCursor() }}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
              />
              
              {/* Guide Legend */}
              {showGuides && (
                <div className="absolute -bottom-16 left-0 right-0 flex justify-center gap-6 text-xs text-brand-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-0.5 bg-brand-dark"></span>
                    <span>Bleed (extends past cut)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-0.5 bg-brand-medium" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #666 0, #666 4px, transparent 4px, transparent 7px)' }}></span>
                    <span>Trim (cut line)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-0.5 bg-green-500"></span>
                    <span>Safe Zone (keep text here)</span>
                  </div>
                  {printSpec.folded && (
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-0.5 bg-red-400" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #f87171 0, #f87171 4px, transparent 4px, transparent 7px)' }}></span>
                      <span>Fold Line</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Bottom Bar - Side Thumbnails */}
          <div className="bg-white border-t border-brand-light p-4 flex justify-center gap-4">
            {printSpec.sides.map((side) => (
              <button
                key={side.id}
                onClick={() => setActiveSide(side.id)}
                className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                  activeSide === side.id
                    ? 'border-brand-dark shadow-lg'
                    : 'border-brand-light hover:border-brand-medium'
                }`}
              >
                <div 
                  className="w-16 h-20 bg-white flex items-center justify-center text-brand-medium text-xs"
                  style={{
                    aspectRatio: `${side.trimMm.w} / ${side.trimMm.h}`,
                  }}
                >
                  {side.id === 'front' ? '📄' : side.id === 'inside' ? '📖' : '📋'}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-brand-lightest/80 text-xs text-center py-1">
                  {side.name}
                </div>
              </button>
            ))}
          </div>
        </main>
        
        {/* Right Sidebar - Properties */}
        <aside className="w-72 bg-white border-l border-brand-light p-4 space-y-6 overflow-y-auto">
          {/* Selected Object Properties */}
          {selectedObject && (
            <div>
              <h3 className="text-sm font-semibold text-brand-medium mb-3">SELECTED OBJECT</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-brand-medium mb-1">X (mm)</label>
                    <input
                      type="number"
                      value={selectedObject.x.toFixed(1)}
                      onChange={(e) => updateObject(selectedObject.id, { x: parseFloat(e.target.value) })}
                      className="w-full px-2 py-1 rounded bg-brand-light border border-brand-light text-brand-darkest text-sm"
                      step={0.5}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-brand-medium mb-1">Y (mm)</label>
                    <input
                      type="number"
                      value={selectedObject.y.toFixed(1)}
                      onChange={(e) => updateObject(selectedObject.id, { y: parseFloat(e.target.value) })}
                      className="w-full px-2 py-1 rounded bg-brand-light border border-brand-light text-brand-darkest text-sm"
                      step={0.5}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-brand-medium mb-1">Width (mm)</label>
                    <input
                      type="number"
                      value={selectedObject.width.toFixed(1)}
                      onChange={(e) => updateObject(selectedObject.id, { width: parseFloat(e.target.value) })}
                      className="w-full px-2 py-1 rounded bg-brand-light border border-brand-light text-brand-darkest text-sm"
                      step={0.5}
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-brand-medium mb-1">Height (mm)</label>
                    <input
                      type="number"
                      value={selectedObject.height.toFixed(1)}
                      onChange={(e) => updateObject(selectedObject.id, { height: parseFloat(e.target.value) })}
                      className="w-full px-2 py-1 rounded bg-brand-light border border-brand-light text-brand-darkest text-sm"
                      step={0.5}
                      min={1}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-brand-medium mb-1">Rotation (°)</label>
                    <input
                      type="number"
                      value={selectedObject.rotation}
                      onChange={(e) => updateObject(selectedObject.id, { rotation: parseFloat(e.target.value) })}
                      className="w-full px-2 py-1 rounded bg-brand-light border border-brand-light text-brand-darkest text-sm"
                      step={1}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-brand-medium mb-1">Opacity</label>
                    <input
                      type="range"
                      value={selectedObject.opacity}
                      onChange={(e) => updateObject(selectedObject.id, { opacity: parseFloat(e.target.value) })}
                      className="w-full"
                      min={0}
                      max={1}
                      step={0.1}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div>
            <h3 className="text-sm font-semibold text-brand-medium mb-3">PRODUCT INFO</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-brand-medium">Size:</span>
                <span>{printSpec.trimWidthMm} × {printSpec.trimHeightMm}mm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-medium">DPI:</span>
                <span>{printSpec.dpi}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-medium">Bleed:</span>
                <span>{currentSide?.bleedMm}mm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-medium">Export:</span>
                <span>{printSpec.exportWidthPx} × {printSpec.exportHeightPx}px</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-brand-medium mb-3">DISPLAY</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showGuides}
                  onChange={(e) => setShowGuides(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Show Guides</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPreview}
                  onChange={(e) => setShowPreview(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Preview Mode (trimmed)</span>
              </label>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-brand-medium mb-3">EXPORT</h3>
            <div className="space-y-2">
              <button
                onClick={exportCurrentSide}
                disabled={isExporting}
                className="w-full py-2 rounded-lg bg-green-600 hover:bg-green-700 text-brand-darkest font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isExporting ? '⏳ Exporting...' : '📤 Export Current Side'}
              </button>
              <button
                onClick={exportAllSides}
                disabled={isExporting}
                className="w-full py-2 rounded-lg bg-brand-light hover:bg-brand-medium text-brand-darkest text-sm transition-colors disabled:opacity-50"
              >
                Export All ({printSpec?.sides.length}) Sides
              </button>
              <p className="text-xs text-brand-medium text-center mt-2">
                High-resolution 300 DPI PNG files ready for print
              </p>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-brand-medium mb-3">ARTKEY™</h3>
            <button className="w-full py-3 rounded-lg bg-brand-dark font-semibold hover:bg-brand-medium text-white transition-all">
              + Add ArtKey
            </button>
            <p className="text-xs text-brand-medium mt-2 text-center">
              Add a QR code that links to a digital experience
            </p>
          </div>
          
          {/* Object count */}
          <div className="pt-4 border-t border-brand-light">
            <p className="text-xs text-brand-medium text-center">
              {objects.length} object{objects.length !== 1 ? 's' : ''} on {printSpec.sides.length} side{printSpec.sides.length !== 1 ? 's' : ''}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

// Wrapper component with Suspense for useSearchParams
export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-lightest text-brand-darkest flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark mx-auto mb-4"></div>
          <p>Loading editor...</p>
        </div>
      </div>
    }>
      <EditorPageContent />
    </Suspense>
  );
}
