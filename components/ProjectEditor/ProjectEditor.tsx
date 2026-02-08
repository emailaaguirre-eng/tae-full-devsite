"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Rect, Line, Transformer, Group, Ellipse } from 'react-konva';
import useImage from 'use-image';
import { Download, X, Type, Upload, Undo, Redo, Trash2, Save, Sparkles, FlipHorizontal, FlipVertical, Copy, ArrowUp, ArrowDown, Minus, Plus, ZoomIn, Palette } from 'lucide-react';
import { useAssetStore, type UploadedAsset } from '@/lib/assetStore';
import { generatePrintSpecForSize, getSamplePostcardSpec, type PrintSpec, type PrintSide, mmToPx, DEFAULT_DPI } from '@/lib/printSpecs';
import { DEFAULT_FONT, DEFAULT_FONT_WEIGHT } from '@/lib/editorFonts';
import { LABEL_SHAPES, type LabelShape } from '@/lib/labelShapes';
import LabelInspector from './LabelInspector';
import SizePicker from './SizePicker';
import type { EditorObject, SideState } from './types';

interface ProjectEditorRebuildProps {
  printSpecId?: string;
  productSlug?: string;
  config?: any;
  printfulVariantId?: number;
  selectedVariant?: {
    id?: number;
    size?: string | null;
    orientation?: 'portrait' | 'landscape';
    material?: string | null;
    paper?: string | null;
    frame?: string | null;
    foil?: string | null;
    fold?: string | null;
    price?: number;
  };
  onComplete?: (exportData: {
    productSlug?: string;
    printSpecId?: string;
    exports: Array<{ sideId: string; dataUrl: string; width: number; height: number }>;
  }) => void;
  onClose?: () => void;
}

// History for undo/redo
interface HistoryState {
  sideStates: Record<string, SideState>;
  timestamp: number;
}

export default function ProjectEditor({
  printSpecId,
  productSlug = 'card',
  config,
  printfulVariantId,
  selectedVariant,
  onComplete,
  onClose,
}: ProjectEditorRebuildProps) {
  const router = useRouter();
  
  // Core state
  const [sideStates, setSideStates] = useState<Record<string, SideState>>({});
  const [activeSideId, setActiveSideId] = useState<string>('front');
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  
  // Premium Library state
  const [premiumAssets, setPremiumAssets] = useState<any[]>([]);
  const [showPremiumLibrary, setShowPremiumLibrary] = useState(false);
  const [usedPremiumAssets, setUsedPremiumAssets] = useState<Array<{ id: string; fee: number }>>([]);
  
  // Text editing state
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState<string>('');
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  
  // Zoom control
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = auto-fit, user can override
  const [userZoom, setUserZoom] = useState<number | null>(null); // null = auto-fit
  
  // History for undo/redo
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const maxHistory = 50;
  
  // Refs
  const transformerRef = useRef<any>(null);
  const nodeRefs = useRef<Record<string, any>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<any>(null);
  const stageContainerRef = useRef<HTMLDivElement>(null);
  
  // SPRINT 2: State for orientation (can be toggled in editor)
  const [editorOrientation, setEditorOrientation] = useState<'portrait' | 'landscape'>(
    selectedVariant?.orientation || 'portrait'
  );
  
  // Card format: flat or bifold (only for card products)
  const [cardFormat, setCardFormat] = useState<'flat' | 'bifold'>('flat');
  const isCardProduct = productSlug === 'card';
  
  // State for product variant data (print dimensions)
  const [variantData, setVariantData] = useState<{
    id: number;
    trimMm: { w: number; h: number };
    productId: number;
  } | null>(null);
  
  // Lock spec to product once selected (prevents spec changes)
  const [lockedProductId, setLockedProductId] = useState<number | null>(null);
  const [lockedVariantId, setLockedVariantId] = useState<number | null>(null);
  
  // Fetch variant data if printfulVariantId is provided
  useEffect(() => {
    if (printfulVariantId && !variantData) {
      // Fetch product info from local store (not from external API)
      fetch(`/api/shop/product-by-variant?variantId=${printfulVariantId}`)
        .then(res => res.json())
        .then(data => {
          if (data.printWidth && data.printHeight && data.printDpi) {
            // Convert px dimensions to mm using DPI
            const wMm = (data.printWidth / data.printDpi) * 25.4;
            const hMm = (data.printHeight / data.printDpi) * 25.4;
            setVariantData({
              id: printfulVariantId,
              trimMm: { w: wMm, h: hMm },
              productId: data.printfulProductId || 0,
            });
          }
        })
        .catch(err => console.error('[ProjectEditor] Failed to fetch variant:', err));
    }
  }, [printfulVariantId, variantData]);
  
  // Load premium assets when library is opened
  useEffect(() => {
    if (showPremiumLibrary && premiumAssets.length === 0) {
      fetch('/api/catalog/assets/premium')
        .then(res => res.json())
        .then(data => setPremiumAssets(data || []))
        .catch(err => console.error('[ProjectEditor] Failed to fetch premium assets:', err));
    }
  }, [showPremiumLibrary, premiumAssets.length]);
  
  // Check for selected premium asset from sessionStorage (from premium library page)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const selectedAssetStr = sessionStorage.getItem('selectedPremiumAsset');
      if (selectedAssetStr) {
        try {
          const asset = JSON.parse(selectedAssetStr);
          handleAddPremiumAsset(asset);
          sessionStorage.removeItem('selectedPremiumAsset');
        } catch (e) {
          console.error('Failed to parse selected premium asset:', e);
        }
      }
    }
  }, []);
  
  // Get print spec from variant data or generate dynamically
  // Prefer variant dimensions over hardcoded sizes
  const printSpec = useMemo<PrintSpec | null>(() => {
    const productType = productSlug as 'card' | 'postcard' | 'invitation' | 'announcement' | 'print';
    const orientation = editorOrientation;
    // Use cardFormat state (controlled in editor) instead of selectedVariant?.fold
    const foldOption = isCardProduct ? cardFormat : 'flat';
    
    // Use variant dimensions if available (from Printful product data)
    if (variantData) {
      try {
        const spec = generatePrintSpecForSize(
          productType,
          `${variantData.trimMm.w}x${variantData.trimMm.h}mm`,
          orientation,
          foldOption
        );
        return spec;
      } catch (e) {
        console.error('[ProjectEditor] Failed to generate spec from variant data:', e);
      }
    }
    
    // Fallback: Use size-based generation
    if (selectedVariant?.size) {
      try {
        const spec = generatePrintSpecForSize(productType, selectedVariant.size, orientation, foldOption);
        return spec;
      } catch (e) {
        console.error('[ProjectEditor] Failed to generate print spec:', e);
      }
    }
    
    // Final fallback: Sample spec
    return getSamplePostcardSpec();
  }, [productSlug, selectedVariant?.size, cardFormat, isCardProduct, variantData, editorOrientation, lockedVariantId, lockedProductId]);
  
  // Track printSpec ID to detect changes
  const lastPrintSpecIdRef = useRef<string | null>(null);
  
  // Initialize/reinitialize side states when printSpec changes
  useEffect(() => {
    if (!printSpec) return;
    
    const currentSpecId = printSpec.id;
    
    // If this is the first time or spec ID changed, reinitialize
    if (lastPrintSpecIdRef.current !== currentSpecId) {
      console.log('[ProjectEditor] PrintSpec changed from', lastPrintSpecIdRef.current, 'to', currentSpecId);
      
      const initialStates: Record<string, SideState> = {};
      printSpec.sides.forEach((side) => {
        // Try to preserve existing objects if side ID exists
        const existingState = sideStates[side.id];
        initialStates[side.id] = existingState || {
          objects: [],
          selectedId: undefined,
        };
      });
      
      setSideStates(initialStates);
      
      // Only change active side if it doesn't exist in new spec
      if (!printSpec.sides.find(s => s.id === activeSideId)) {
        setActiveSideId(printSpec.sides[0].id);
      }
      
      setSelectedId(undefined);
      lastPrintSpecIdRef.current = currentSpecId;
      // Don't save to history when spec changes - only user actions
    }
  }, [printSpec, activeSideId, sideStates]);
  
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
  
  // Debug: Log objects when they change
  useEffect(() => {
    console.log('[ProjectEditor] Objects on canvas:', objects.length, objects.map(o => ({ id: o.id, type: o.type, x: o.x, y: o.y })));
  }, [objects]);
  
  // Debug: Log fold lines for current side
  useEffect(() => {
    if (currentSide && process.env.NODE_ENV === 'development') {
      console.log('[ProjectEditor] Current side fold lines:', {
        sideId: currentSide.id,
        hasFoldLines: !!currentSide.foldLines,
        foldLinesCount: currentSide.foldLines?.length || 0,
        foldLines: currentSide.foldLines,
        canvasSize: `${currentSide.canvasPx.w}x${currentSide.canvasPx.h}`,
        printSpecId: printSpec?.id,
        printSpecFolded: printSpec?.folded,
      });
    }
  }, [currentSide, printSpec]);
  
  // Update transformer when selection changes
  useEffect(() => {
    if (!transformerRef.current) return;
    
    const selectedNode = selectedId ? nodeRefs.current[selectedId] : null;
    
    if (selectedNode) {
      // Use requestAnimationFrame to ensure node is fully rendered
      const rafId = requestAnimationFrame(() => {
        if (transformerRef.current && selectedNode) {
          try {
            transformerRef.current.nodes([selectedNode]);
            transformerRef.current.getLayer()?.batchDraw();
            console.log('[ProjectEditor] Transformer attached to:', selectedId);
          } catch (error) {
            console.error('[ProjectEditor] Error attaching transformer:', error);
          }
        }
      });
      return () => cancelAnimationFrame(rafId);
    } else {
      transformerRef.current.nodes([]);
    }
  }, [selectedId, activeSideId, objects]);
  
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
  
  // Duplicate object
  const duplicateObject = useCallback((id: string) => {
    setSideStates((prev) => {
      const newStates = { ...prev };
      const sideState = { ...newStates[activeSideId] };
      const obj = sideState.objects.find((o) => o.id === id);
      if (!obj) return prev;
      const clone = { ...obj, id: `${obj.type}-${Date.now()}`, x: obj.x + 20, y: obj.y + 20 };
      sideState.objects = [...sideState.objects, clone];
      sideState.selectedId = clone.id;
      newStates[activeSideId] = sideState;
      saveToHistory(newStates);
      return newStates;
    });
  }, [activeSideId, saveToHistory]);

  // Move layer ordering
  const moveLayer = useCallback((id: string, direction: 'up' | 'down') => {
    setSideStates((prev) => {
      const newStates = { ...prev };
      const sideState = { ...newStates[activeSideId] };
      const objs = [...sideState.objects];
      const idx = objs.findIndex((o) => o.id === id);
      if (idx === -1) return prev;
      if (direction === 'up' && idx < objs.length - 1) {
        [objs[idx], objs[idx + 1]] = [objs[idx + 1], objs[idx]];
      } else if (direction === 'down' && idx > 0) {
        [objs[idx], objs[idx - 1]] = [objs[idx - 1], objs[idx]];
      }
      sideState.objects = objs;
      newStates[activeSideId] = sideState;
      saveToHistory(newStates);
      return newStates;
    });
  }, [activeSideId, saveToHistory]);

  // Set background color for current side
  const setBackgroundColor = useCallback((color: string) => {
    setSideStates((prev) => {
      const newStates = { ...prev };
      const sideState = { ...newStates[activeSideId] };
      sideState.backgroundColor = color;
      newStates[activeSideId] = sideState;
      saveToHistory(newStates);
      return newStates;
    });
  }, [activeSideId, saveToHistory]);

  // Start editing text (double-click on text/label-shape)
  const startEditingText = useCallback((objectId: string) => {
    const obj = objects.find(o => o.id === objectId);
    if (obj && (obj.type === 'text' || obj.type === 'label-shape')) {
      setEditingTextId(objectId);
      setEditingTextValue(obj.text || '');
      // Focus the input after render
      setTimeout(() => textInputRef.current?.focus(), 50);
    }
  }, [objects]);
  
  // Finish editing text
  const finishEditingText = useCallback(() => {
    if (editingTextId && editingTextValue !== undefined) {
      updateObject(editingTextId, { text: editingTextValue });
    }
    setEditingTextId(null);
    setEditingTextValue('');
  }, [editingTextId, editingTextValue, updateObject]);
  
  // Get position for text editing overlay
  const getEditingOverlayStyle = useCallback((): React.CSSProperties => {
    if (!editingTextId || !stageContainerRef.current || !currentSide) return { display: 'none' };
    
    const obj = objects.find(o => o.id === editingTextId);
    if (!obj) return { display: 'none' };
    
    const SCREEN_DPI = 96;
    const stageRect = stageContainerRef.current.getBoundingClientRect();
    
    // Calculate position
    const objX = obj.x || 0;
    const objY = obj.y || 0;
    const objW = (obj.width || 200) * (obj.scaleX || 1);
    const objH = (obj.height || 50) * (obj.scaleY || 1);
    
    return {
      position: 'absolute',
      left: `${objX}px`,
      top: `${objY}px`,
      width: `${Math.max(objW, 150)}px`,
      minHeight: `${Math.max(objH, 40)}px`,
      transform: `rotate(${obj.rotation || 0}deg)`,
      transformOrigin: 'top left',
      zIndex: 1000,
    };
  }, [editingTextId, objects, currentSide]);
  
  // Add image - fit to safe area and center
  const handleAddImage = useCallback((asset: UploadedAsset) => {
    if (!currentSide) return;
    
    const img = new window.Image();
    img.onload = () => {
      const SCREEN_DPI = 96;
      const imgNaturalW = asset.width || img.naturalWidth;
      const imgNaturalH = asset.height || img.naturalHeight;
      
      // Convert mm dimensions to screen pixels for positioning
      const bleedPx = mmToPx(currentSide.bleedMm, SCREEN_DPI);
      const trimW = mmToPx(currentSide.trimMm.w, SCREEN_DPI);
      const trimH = mmToPx(currentSide.trimMm.h, SCREEN_DPI);
      const safePx = mmToPx(currentSide.safeMm, SCREEN_DPI);
      
      // Safe area = trim minus safe margins on each side
      const safeW = trimW - (safePx * 2);
      const safeH = trimH - (safePx * 2);
      
      // Scale to fit in safe area, cap at 1 (don't upscale small images)
      const scale = Math.min(safeW / imgNaturalW, safeH / imgNaturalH, 1);
      
      // Final image dimensions
      const finalW = imgNaturalW * scale;
      const finalH = imgNaturalH * scale;
      
      // Position: center within trim box (accounting for bleed offset)
      // trimBox starts at (bleedPx, bleedPx), safeBox starts at (bleedPx + safePx, bleedPx + safePx)
      const centerX = bleedPx + (trimW / 2);
      const centerY = bleedPx + (trimH / 2);
      const x = centerX - (finalW / 2);
      const y = centerY - (finalH / 2);
      
      const newObject: EditorObject = {
        id: `img-${Date.now()}`,
        type: 'image',
        src: asset.src,
        x,
        y,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        width: finalW,
        height: finalH,
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

  // Add premium asset (similar to handleAddImage but for premium library assets)
  const handleAddPremiumAsset = useCallback((asset: { id?: string; url?: string; src?: string; width?: number; height?: number }) => {
    if (!currentSide) return;
    // Convert premium asset to UploadedAsset format and use handleAddImage logic
    const imageUrl = asset.url || asset.src || '';
    if (!imageUrl) {
      console.warn('[ProjectEditor] Premium asset has no URL');
      return;
    }
    handleAddImage({
      id: asset.id || `premium-${Date.now()}`,
      src: imageUrl,
      width: asset.width,
      height: asset.height,
    });
  }, [currentSide, handleAddImage]);

  // Add text label
  const handleAddText = useCallback(() => {
    if (!currentSide) {
      console.warn('[ProjectEditor] Cannot add text: currentSide is null');
      return;
    }
    
    // Use mm-based dimensions converted to screen pixels
    const SCREEN_DPI = 96;
    const bleedPx = mmToPx(currentSide.bleedMm, SCREEN_DPI);
    const trimW = mmToPx(currentSide.trimMm.w, SCREEN_DPI);
    const trimH = mmToPx(currentSide.trimMm.h, SCREEN_DPI);
    
    // Center position (accounting for bleed offset)
    const centerX = bleedPx + (trimW / 2);
    const centerY = bleedPx + (trimH / 2);
    
    const newObject: EditorObject = {
      id: `text-${Date.now()}`,
      type: 'text',
      text: 'Your text here',
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
    
    console.log('[ProjectEditor] Adding text:', newObject.id, 'at position:', newObject.x, newObject.y);
    
    setSideStates((prev) => {
      const newStates = { ...prev };
      // Ensure sideState exists with default values
      const existingState = newStates[activeSideId] || { objects: [], selectedId: undefined };
      const sideState = { ...existingState };
      sideState.objects = [...(sideState.objects || []), newObject];
      sideState.selectedId = newObject.id;
      newStates[activeSideId] = sideState;
      saveToHistory(newStates);
      console.log('[ProjectEditor] Text added. Total objects:', sideState.objects.length);
      return newStates;
    });
    setSelectedId(newObject.id);
  }, [currentSide, activeSideId, saveToHistory]);
  
  // Add label shape
  const handleAddLabelShape = useCallback((shape: LabelShape) => {
    if (!currentSide) {
      console.warn('[ProjectEditor] Cannot add label shape: currentSide is null');
      return;
    }
    
    // Use mm-based dimensions converted to screen pixels
    const SCREEN_DPI = 96;
    const bleedPx = mmToPx(currentSide.bleedMm, SCREEN_DPI);
    const trimW = mmToPx(currentSide.trimMm.w, SCREEN_DPI);
    const trimH = mmToPx(currentSide.trimMm.h, SCREEN_DPI);
    
    // Center position (accounting for bleed offset)
    const centerX = bleedPx + (trimW / 2);
    const centerY = bleedPx + (trimH / 2);
    
    const newObject: EditorObject = {
      id: `label-${Date.now()}`,
      type: 'label-shape',
      text: 'Your text here',
      x: centerX - shape.width / 2,
      y: centerY - shape.height / 2,
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
    
    console.log('[ProjectEditor] Adding label shape:', newObject.id, 'at position:', newObject.x, newObject.y);
    
    setSideStates((prev) => {
      const newStates = { ...prev };
      // Ensure sideState exists with default values
      const existingState = newStates[activeSideId] || { objects: [], selectedId: undefined };
      const sideState = { ...existingState };
      sideState.objects = [...(sideState.objects || []), newObject];
      sideState.selectedId = newObject.id;
      newStates[activeSideId] = sideState;
      saveToHistory(newStates);
      console.log('[ProjectEditor] Label added. Total objects:', sideState.objects.length);
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
  
  // Preflight check: Block export if text intersects outside safeBox
  // SPRINT 1: Minimal preflight - check text bounding boxes
  const runPreflight = useCallback((sideId: string): { isValid: boolean; errors: string[] } => {
    const side = printSpec?.sides.find(s => s.id === sideId);
    if (!side) return { isValid: false, errors: ['Side not found'] };
    
    const state = sideStates[sideId];
    if (!state) return { isValid: true, errors: [] };
    
    const errors: string[] = [];
    const SCREEN_DPI = 96; // Screen DPI for coordinate conversion
    
    // Convert safe box bounds from mm to screen pixels
    const bleedPx = mmToPx(side.bleedMm, SCREEN_DPI);
    const trimW = mmToPx(side.trimMm.w, SCREEN_DPI);
    const trimH = mmToPx(side.trimMm.h, SCREEN_DPI);
    const safePx = mmToPx(side.safeMm, SCREEN_DPI);
    const trimX = bleedPx;
    const trimY = bleedPx;
    const safeX = trimX + safePx;
    const safeY = trimY + safePx;
    const safeW = trimW - (safePx * 2);
    const safeH = trimH - (safePx * 2);
    
    // Check text objects
    for (const obj of state.objects) {
      if (obj.type === 'text' || obj.type === 'label-shape') {
        if (!obj.text) continue;
        
        // Estimate text bounding box (simplified - uses fontSize for height)
        const fontSize = obj.fontSize || 16;
        const fontWidth = fontSize * 0.6; // Approximate character width
        const textWidth = (obj.text.length * fontWidth) * (obj.scaleX || 1);
        const textHeight = fontSize * (obj.scaleY || 1);
        
        const objX = obj.x;
        const objY = obj.y;
        const objRight = objX + textWidth;
        const objBottom = objY + textHeight;
        
        // Check if text bounding box is outside safe area
        if (objX < safeX || objY < safeY || objRight > safeX + safeW || objBottom > safeY + safeH) {
          errors.push(`Text "${obj.text.substring(0, 20)}..." on ${side.name} is outside the safe area`);
        }
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }, [printSpec, sideStates]);
  
  // Save Draft: Save design to database
  const handleSaveDraft = useCallback(async (shouldContinue: boolean = false) => {
    if (!printSpec || isSaving) return;
    
    setIsSaving(true);
    
    try {
      // Collect design data for all sides
      const designJson: Record<string, any> = {};
      // Don't send previews in save - they're too large (causes 413 error)
      // Previews can be generated on-demand when needed
      const previews: Record<string, string> = {};
      
      // Generate design JSON for each side (skip previews to avoid 413 error)
      // Optimize objects by removing unnecessary properties and data
      for (const side of printSpec.sides) {
        const sideState = sideStates[side.id] || { objects: [], selectedId: undefined };
        
        // Clean objects: only keep essential properties to reduce payload size
        const cleanedObjects = sideState.objects.map(obj => {
          const cleaned: any = {
            id: obj.id,
            type: obj.type,
            x: obj.x,
            y: obj.y,
            scaleX: obj.scaleX ?? 1,
            scaleY: obj.scaleY ?? 1,
            rotation: obj.rotation ?? 0,
          };
          
          // Type-specific properties
          if (obj.type === 'image') {
            // CRITICAL: Skip base64 data URLs - they bloat the payload
            // Only save actual URLs, not embedded image data
            if (obj.src && !obj.src.startsWith('data:')) {
              cleaned.src = obj.src;
            } else {
              // For base64 images, save a placeholder - the image needs to be uploaded first
              cleaned.src = null;
              cleaned.needsUpload = true;
              console.warn(`[ProjectEditor] Image ${obj.id} has base64 data - needs upload before save`);
            }
            cleaned.width = obj.width;
            cleaned.height = obj.height;
          } else if (obj.type === 'text' || obj.type === 'label-shape') {
            cleaned.text = obj.text;
            cleaned.fontFamily = obj.fontFamily;
            cleaned.fontSize = obj.fontSize;
            cleaned.fontWeight = obj.fontWeight;
            cleaned.fill = obj.fill;
            if (obj.type === 'label-shape') {
              cleaned.width = obj.width;
              cleaned.height = obj.height;
              cleaned.labelShapeId = obj.labelShapeId;
              cleaned.labelShapeType = obj.labelShapeType;
              cleaned.cornerRadius = obj.cornerRadius;
              cleaned.backgroundColor = obj.backgroundColor;
              cleaned.borderEnabled = obj.borderEnabled;
              cleaned.borderWidth = obj.borderWidth;
              cleaned.borderColor = obj.borderColor;
            }
          }
          
          return cleaned;
        });
        
        designJson[side.id] = {
          objects: cleanedObjects,
        };
        
        // Skip preview generation - they're too large for API requests
        // Previews can be generated on-demand when viewing draft details
      }
      
      // Collect product/variant information
      const productId = lockedProductId ? String(lockedProductId) : (variantData?.productId ? String(variantData.productId) : null);
      const variantId = lockedVariantId ? String(lockedVariantId) : (printfulVariantId ? String(printfulVariantId) : null);
      
      // Calculate premium fees
      const totalPremiumFees = usedPremiumAssets.reduce((sum, asset) => sum + asset.fee, 0);
      const usedAssetIds = usedPremiumAssets.map(a => a.id);
      
      // Prepare draft data
      const designJsonStr = JSON.stringify(designJson);
      const usedAssetIdsStr = JSON.stringify(usedAssetIds);
      
      // Log payload size for debugging
      const payloadSize = new Blob([designJsonStr, usedAssetIdsStr]).size;
      const payloadSizeKB = (payloadSize / 1024).toFixed(2);
      console.log(`[ProjectEditor] Payload size: ${payloadSizeKB} KB`);
      
      if (payloadSize > 4 * 1024 * 1024) { // 4MB warning
        console.warn(`[ProjectEditor] Large payload detected: ${payloadSizeKB} KB. Consider reducing elements.`);
      }
      
      const draftData = {
        productId,
        variantId,
        productSlug,
        printSpecId: printSpec.id,
        cornerStyle: null, // TODO: Add corner style if available
        cornerRadiusMm: null, // TODO: Add corner radius if available
        designJson: designJsonStr,
        previews: null, // Skip previews to avoid 413 error - generate on-demand when needed
        usedAssetIds: usedAssetIdsStr,
        premiumFees: totalPremiumFees,
      };
      
      // POST to /api/design-drafts
      const response = await fetch('/api/design-drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draftData),
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to save draft';
        
        if (response.status === 413) {
          errorMessage = 'Draft too large to save. Please reduce the number of elements or images.';
        } else if (response.status === 400) {
          const error = await response.json().catch(() => ({ message: 'Invalid draft data' }));
          errorMessage = error.message || 'Invalid draft data';
        } else {
          try {
            const error = await response.json();
            errorMessage = error.message || error.error || 'Failed to save draft';
          } catch (e) {
            errorMessage = `Failed to save draft (${response.status})`;
          }
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      const draftId = result.draftId || result.id || result.draft?.id;
      
      if (!draftId) {
        console.error('[ProjectEditor] Unexpected response format:', result);
        throw new Error('Draft saved but no ID returned in response');
      }
      
      // If "Save & Continue", navigate to ArtKey editor
      if (shouldContinue) {
        router.push(`/artkey/edit/${draftId}`);
      } else {
        // Show success message
        alert('Draft saved successfully!');
      }
      
      return draftId;
    } catch (error) {
      console.error('[ProjectEditor] Failed to save draft:', error);
      alert(`Failed to save draft: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [printSpec, sideStates, activeSideId, stageRef, lockedProductId, lockedVariantId, variantData, printfulVariantId, productSlug, isSaving, router, usedPremiumAssets]);
  
  // Export: PNG with bleed at 300 DPI
  // SPRINT 1: Export one side (current active side) with bleed included at print DPI
  const handleExport = useCallback(async () => {
    if (!printSpec || !stageRef.current || !currentSide) return;
    
    // Run preflight check
    const preflight = runPreflight(activeSideId);
    if (!preflight.isValid) {
      alert(`Export blocked:\n\n${preflight.errors.join('\n')}\n\nPlease move text inside the safe area (green guide).`);
      return;
    }
    
    // Calculate export dimensions in pixels at 300 DPI (print DPI)
    const bleedW = mmToPx(currentSide.trimMm.w + (currentSide.bleedMm * 2), DEFAULT_DPI);
    const bleedH = mmToPx(currentSide.trimMm.h + (currentSide.bleedMm * 2), DEFAULT_DPI);
    
    // Get the stage and export at print DPI
    const stage = stageRef.current;
    
    // Create a temporary stage at print resolution for export
    // Note: Konva's toDataURL uses pixelRatio to scale up
    // We need to scale from screen DPI (96) to print DPI (300)
    const pixelRatio = DEFAULT_DPI / 96; // Scale factor from screen to print DPI
    
    const dataUrl = stage.toDataURL({
      pixelRatio,
      width: bleedW,
      height: bleedH,
    });
    
    // Export data
    const exportData = {
      sideId: activeSideId,
      dataUrl,
      width: bleedW,
      height: bleedH,
      trimWidth: mmToPx(currentSide.trimMm.w, DEFAULT_DPI),
      trimHeight: mmToPx(currentSide.trimMm.h, DEFAULT_DPI),
      bleedMm: currentSide.bleedMm,
    };
    
    if (onComplete) {
      // Include product/variant IDs in export data
      onComplete({
        productSlug,
        printSpecId: printSpec.id,
        productId: lockedProductId || variantData?.productId,
        variantId: lockedVariantId || printfulVariantId,
        exports: [exportData],
      });
    }
  }, [printSpec, currentSide, activeSideId, stageRef, runPreflight, onComplete, productSlug, variantData, printfulVariantId]);
  
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
  
  // Calculate canvas dimensions from mm (bleedBox = trimBox + bleed on all sides)
  // SPRINT 1: Canvas uses mm internally, scaled to screen pixels
  const SCREEN_DPI = 96; // Standard screen DPI for display scaling
  const canvasDimensionsMm = currentSide ? {
    width: currentSide.trimMm.w + (currentSide.bleedMm * 2), // trimBox + bleed on left + right
    height: currentSide.trimMm.h + (currentSide.bleedMm * 2), // trimBox + bleed on top + bottom
  } : { width: 0, height: 0 };
  
  // Convert mm to screen pixels at screen DPI (96 DPI for displays, not print DPI)
  const STAGE_WIDTH = mmToPx(canvasDimensionsMm.width, SCREEN_DPI);
  const STAGE_HEIGHT = mmToPx(canvasDimensionsMm.height, SCREEN_DPI);
  
  // Calculate display scale to fit viewport (800x600 max viewport)
  const autoScale = Math.min(800 / STAGE_WIDTH, 600 / STAGE_HEIGHT, 1);
  const displayScale = userZoom !== null ? userZoom : autoScale;
  
  // Print dimensions for status bar
  const printWidthInches = currentSide ? (currentSide.trimMm.w / 25.4).toFixed(1) : '0';
  const printHeightInches = currentSide ? (currentSide.trimMm.h / 25.4).toFixed(1) : '0';
  const printWidthMm = currentSide ? currentSide.trimMm.w.toFixed(0) : '0';
  const printHeightMm = currentSide ? currentSide.trimMm.h.toFixed(0) : '0';
  const zoomPercent = Math.round(displayScale * 100);
  
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">Project Editor</h1>
          {/* Design Controls: Orientation & Card Format */}
          <div className="flex items-center gap-4">
            {/* Orientation Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Orientation:</span>
              <button
                onClick={() => setEditorOrientation('portrait')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  editorOrientation === 'portrait'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Portrait
              </button>
              <button
                onClick={() => setEditorOrientation('landscape')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  editorOrientation === 'landscape'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Landscape
              </button>
            </div>
            
            {/* Card Format Toggle (only for card products) */}
            {isCardProduct && (
              <div className="flex items-center gap-2 border-l border-gray-300 pl-4">
                <span className="text-sm font-medium text-gray-700">Format:</span>
                <button
                  onClick={() => setCardFormat('flat')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    cardFormat === 'flat'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Flat
                </button>
                <button
                  onClick={() => setCardFormat('bifold')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    cardFormat === 'bifold'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Bifold
                </button>
              </div>
            )}
          </div>
          {printSpec.sides.length > 1 && (
            <div className="flex gap-2">
              {printSpec.sides.map((side) => {
                // Use name property if available, otherwise generate label
                const label = side.name || (
                  side.id === 'inside-left' ? 'Inside Left' :
                  side.id === 'inside-right' ? 'Inside Right' :
                  side.id === 'inside-top' ? 'Inside Top' :
                  side.id === 'inside-bottom' ? 'Inside Bottom' :
                  side.id === 'inside' ? 'Inside' :
                  side.id.charAt(0).toUpperCase() + side.id.slice(1)
                );
                
                return (
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
                    title={
                      side.id === 'front' ? 'Front cover' :
                      side.id === 'inside-left' ? 'Inside left page (portrait cards)' :
                      side.id === 'inside-right' ? 'Inside right page (portrait cards)' :
                      side.id === 'inside-top' ? 'Inside top page (landscape cards)' :
                      side.id === 'inside-bottom' ? 'Inside bottom page (landscape cards)' :
                      side.id === 'back' ? 'Back cover' :
                      'Card side'
                    }
                  >
                    {label}
                  </button>
                );
              })}
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
            onClick={() => handleSaveDraft(false)}
            disabled={isSaving}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Save Draft"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={() => handleSaveDraft(true)}
            disabled={isSaving}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Save & Continue to ArtKey Editor"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save & Continue'}
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
          {/* Size Picker (only show if no variant selected yet) */}
          {!lockedVariantId && !printfulVariantId && (
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Select Product Size</h3>
              <SizePicker
                productSlug={productSlug}
                selectedVariantId={printfulVariantId}
                onVariantSelect={(variant) => {
                  // Update variant data and trigger spec regeneration
                  setVariantData({
                    id: variant.id,
                    trimMm: variant.trimMm,
                    productId: variant.productId,
                  });
                  // Lock to this variant
                  setLockedVariantId(variant.id);
                  setLockedProductId(variant.productId);
                }}
                disabled={!!lockedVariantId}
              />
            </div>
          )}
          
          {/* Show locked product info */}
          {lockedProductId && (
            <div className="p-4 border-b border-gray-200 bg-blue-50">
              <div className="text-xs font-medium text-blue-900">Product Locked</div>
              <div className="text-xs text-blue-700 mt-1">
                Product ID: {lockedProductId}
              </div>
              {lockedVariantId && (
                <div className="text-xs text-blue-700">
                  Variant ID: {lockedVariantId}
                </div>
              )}
            </div>
          )}
          
          {/* Tools */}
          <div className="p-4 border-b border-gray-200 space-y-2">
            <label className="block w-full">
              <div className="px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold text-center cursor-pointer hover:bg-blue-700 flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Your Photo (Free)
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
              onClick={() => setShowPremiumLibrary(true)}
              className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Premium Library
            </button>
            
            <button
              onClick={handleAddText}
              className="w-full px-4 py-3 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 flex items-center justify-center gap-2"
            >
              <Type className="w-4 h-4" />
              Add Text
            </button>
          </div>
          
          {/* Premium Assets Used */}
          {usedPremiumAssets.length > 0 && (
            <div className="p-4 border-b border-gray-200 bg-purple-50">
              <div className="text-xs font-medium text-purple-900 mb-2">Premium Assets Used:</div>
              {usedPremiumAssets.map((asset) => {
                const fullAsset = premiumAssets.find(a => a.id === asset.id);
                return (
                  <div key={asset.id} className="text-xs text-purple-700 mb-1">
                    {fullAsset?.title || asset.id}: +${asset.fee.toFixed(2)}
                  </div>
                );
              })}
              <div className="text-xs font-semibold text-purple-900 mt-2">
                Total Premium Fees: ${usedPremiumAssets.reduce((sum, a) => sum + a.fee, 0).toFixed(2)}
              </div>
            </div>
          )}
          
          {/* Background Color */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Background</h3>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentState.backgroundColor || '#ffffff'}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <span className="text-xs text-gray-500">{currentState.backgroundColor || 'White (default)'}</span>
              {currentState.backgroundColor && (
                <button
                  onClick={() => setBackgroundColor('')}
                  className="text-xs text-red-500 hover:text-red-700 ml-auto"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          
          {/* Label Shapes */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Label Shapes</h3>
            <div className="grid grid-cols-3 gap-2">
              {LABEL_SHAPES.map((shape) => (
                <button
                  key={shape.id}
                  onClick={() => handleAddLabelShape(shape)}
                  className="p-2 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 flex flex-col items-center gap-1"
                  title={shape.description}
                >
                  {/* Shape Preview */}
                  <div className="w-10 h-8 flex items-center justify-center">
                    {shape.type === 'circle' && (
                      <div 
                        className="w-8 h-8 rounded-full border-2" 
                        style={{ borderColor: shape.previewColor, backgroundColor: `${shape.previewColor}20` }}
                      />
                    )}
                    {shape.type === 'oval' && (
                      <div 
                        className="w-10 h-6 rounded-full border-2" 
                        style={{ borderColor: shape.previewColor, backgroundColor: `${shape.previewColor}20` }}
                      />
                    )}
                    {shape.type === 'rounded-rectangle' && (
                      <div 
                        className="w-10 h-6 rounded-lg border-2" 
                        style={{ borderColor: shape.previewColor, backgroundColor: `${shape.previewColor}20` }}
                      />
                    )}
                    {shape.type === 'rectangle' && (
                      <div 
                        className="w-10 h-6 border-2" 
                        style={{ borderColor: shape.previewColor, backgroundColor: `${shape.previewColor}20` }}
                      />
                    )}
                    {shape.type === 'speech-bubble' && (
                      <div className="relative">
                        <div 
                          className="w-10 h-5 rounded-lg border-2" 
                          style={{ borderColor: shape.previewColor, backgroundColor: `${shape.previewColor}20` }}
                        />
                        <div 
                          className="absolute -bottom-1 left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent"
                          style={{ borderTopColor: shape.previewColor }}
                        />
                      </div>
                    )}
                    {shape.type === 'ribbon' && (
                      <div className="relative w-10 h-5 flex items-center">
                        <div 
                          className="absolute left-0 w-0 h-0 border-t-[10px] border-b-[10px] border-r-[6px] border-t-transparent border-b-transparent"
                          style={{ borderRightColor: shape.previewColor }}
                        />
                        <div 
                          className="flex-1 h-5 mx-1" 
                          style={{ backgroundColor: shape.previewColor }}
                        />
                        <div 
                          className="absolute right-0 w-0 h-0 border-t-[10px] border-b-[10px] border-l-[6px] border-t-transparent border-b-transparent"
                          style={{ borderLeftColor: shape.previewColor }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] font-medium text-gray-700 text-center leading-tight">{shape.name}</div>
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
            <div ref={stageContainerRef} style={{ position: 'relative' }}>
              <Stage
                ref={stageRef}
                width={STAGE_WIDTH}
                height={STAGE_HEIGHT}
                onClick={(e) => {
                  const clickedOnEmpty = e.target === e.target.getStage();
                  if (clickedOnEmpty) {
                    setSelectedId(undefined);
                    if (editingTextId) {
                      finishEditingText();
                    }
                  }
                }}
              >
              <Layer>
                {/* Background color fill */}
                {currentSide && currentState.backgroundColor && (
                  <Rect
                    x={mmToPx(currentSide.bleedMm, SCREEN_DPI)}
                    y={mmToPx(currentSide.bleedMm, SCREEN_DPI)}
                    width={mmToPx(currentSide.trimMm.w, SCREEN_DPI)}
                    height={mmToPx(currentSide.trimMm.h, SCREEN_DPI)}
                    fill={currentState.backgroundColor}
                    listening={false}
                  />
                )}
                
                {/* Print Area Guides - Always Visible - CRITICAL FOR PRINT ACCURACY */}
                {/* SPRINT 1: Guides use mm coordinates converted to screen pixels */}
                {currentSide && (() => {
                  // Convert mm coordinates to screen pixels
                  const bleedPx = mmToPx(currentSide.bleedMm, SCREEN_DPI);
                  const trimW = mmToPx(currentSide.trimMm.w, SCREEN_DPI);
                  const trimH = mmToPx(currentSide.trimMm.h, SCREEN_DPI);
                  const safePx = mmToPx(currentSide.safeMm, SCREEN_DPI);
                  
                  // Trim box position (centered in bleed box)
                  const trimX = bleedPx;
                  const trimY = bleedPx;
                  
                  // Safe box position (trim box inset by safeMm)
                  const safeX = trimX + safePx;
                  const safeY = trimY + safePx;
                  const safeW = trimW - (safePx * 2);
                  const safeH = trimH - (safePx * 2);
                  
                  return (
                    <>
                      {/* Bleed Box - Full canvas area (includes bleed) */}
                      <Rect
                        x={0}
                        y={0}
                        width={STAGE_WIDTH}
                        height={STAGE_HEIGHT}
                        fill="transparent"
                        stroke="#9333ea"
                        strokeWidth={2}
                        dash={[4, 4]}
                        listening={false}
                      />
                      
                      {/* Trim Guide - Print Area Boundary (Orange) - Final cut size */}
                      <Rect
                        x={trimX}
                        y={trimY}
                        width={trimW}
                        height={trimH}
                        fill="transparent"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        dash={[8, 4]}
                        listening={false}
                      />
                      
                      {/* Safe Zone Guide (Green) - Keep content inside this area */}
                      <Rect
                        x={safeX}
                        y={safeY}
                        width={safeW}
                        height={safeH}
                        fill="transparent"
                        stroke="#10b981"
                        strokeWidth={2}
                        dash={[5, 5]}
                        listening={false}
                      />
                      
                      {/* Fold Lines - CRITICAL FOR PRINT ACCURACY - RED, VERY VISIBLE */}
                      {currentSide.foldLines && currentSide.foldLines.length > 0 ? (
                        currentSide.foldLines.map((fold, idx) => {
                          // Convert fold line coordinates from mm to screen pixels
                          // Fold lines are relative to trim box (0,0 = top-left of trim box)
                          // We need to add trimX/trimY offset to position them correctly
                          const x1 = mmToPx(fold.x1, SCREEN_DPI) + trimX;
                          const y1 = mmToPx(fold.y1, SCREEN_DPI) + trimY;
                          const x2 = mmToPx(fold.x2, SCREEN_DPI) + trimX;
                          const y2 = mmToPx(fold.y2, SCREEN_DPI) + trimY;
                          
                          if (process.env.NODE_ENV === 'development') {
                            console.log(`[ProjectEditor] Rendering fold line ${idx}:`, {
                              side: currentSide.id,
                              pointsMm: [fold.x1, fold.y1, fold.x2, fold.y2],
                              pointsPx: [x1, y1, x2, y2],
                              trimBox: `${trimW}x${trimH}px (${currentSide.trimMm.w}x${currentSide.trimMm.h}mm)`,
                            });
                          }
                          
                          return (
                            <Line
                              key={`fold-${idx}`}
                              points={[x1, y1, x2, y2]}
                              stroke="#ef4444"
                              strokeWidth={8}
                              dash={[40, 20]}
                              opacity={1}
                              lineCap="round"
                              lineJoin="round"
                              listening={false}
                              shadowColor="rgba(0,0,0,0.3)"
                              shadowBlur={4}
                              shadowOffsetX={1}
                              shadowOffsetY={1}
                            />
                          );
                        })
                      ) : (
                        // Debug: Show message if no fold lines
                        process.env.NODE_ENV === 'development' && (
                          <KonvaText
                            x={10}
                            y={30}
                            text={`No fold lines for ${currentSide.id} side`}
                            fontSize={12}
                            fill="#ff0000"
                            listening={false}
                          />
                        )
                      )}
                    </>
                  );
                })()}
                
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
                        onStartEdit={() => startEditingText(object.id)}
                        nodeRef={(ref) => {
                          if (ref) nodeRefs.current[object.id] = ref;
                        }}
                      />
                    );
                  }
                  
                  return null;
                })}
                
                {/* Transformer - for resizing and rotating objects */}
                <Transformer
                  ref={transformerRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    // Limit resize to reasonable bounds
                    if (Math.abs(newBox.width) < 20 || Math.abs(newBox.height) < 20) {
                      return oldBox;
                    }
                    return newBox;
                  }}
                  borderEnabled={true}
                  borderStroke="#3b82f6"
                  borderStrokeWidth={2}
                  anchorFill="#ffffff"
                  anchorStroke="#3b82f6"
                  anchorStrokeWidth={2}
                  anchorSize={10}
                  rotateAnchorOffset={30}
                  keepRatio={false}
                  enabledAnchors={['top-left', 'top-center', 'top-right', 'middle-right', 'bottom-right', 'bottom-center', 'bottom-left', 'middle-left']}
                />
              </Layer>
            </Stage>
            
            {/* Text Editing Overlay */}
            {editingTextId && (
              <textarea
                ref={textInputRef}
                value={editingTextValue}
                onChange={(e) => setEditingTextValue(e.target.value)}
                onBlur={finishEditingText}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    finishEditingText();
                  }
                  if (e.key === 'Escape') {
                    setEditingTextId(null);
                    setEditingTextValue('');
                  }
                }}
                style={getEditingOverlayStyle()}
                className="bg-white border-2 border-blue-500 rounded p-2 shadow-lg resize-none outline-none text-center"
                placeholder="Enter your text..."
              />
            )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating Object Toolbar */}
      {selectedObject && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-2xl border border-gray-200 px-3 py-2 flex items-center gap-1 z-40">
          {/* Flip controls (images only) */}
          {selectedObject.type === 'image' && (
            <>
              <button
                onClick={() => updateObject(selectedObject.id, { flipX: !selectedObject.flipX })}
                className={`p-2 rounded-lg hover:bg-gray-100 ${selectedObject.flipX ? 'bg-blue-100 text-blue-600' : ''}`}
                title="Flip Horizontal"
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>
              <button
                onClick={() => updateObject(selectedObject.id, { flipY: !selectedObject.flipY })}
                className={`p-2 rounded-lg hover:bg-gray-100 ${selectedObject.flipY ? 'bg-blue-100 text-blue-600' : ''}`}
                title="Flip Vertical"
              >
                <FlipVertical className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-gray-200 mx-1" />
            </>
          )}
          
          {/* Opacity */}
          <div className="flex items-center gap-1 px-1">
            <span className="text-[10px] text-gray-500 w-8">Op:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round((selectedObject.opacity ?? 1) * 100)}
              onChange={(e) => updateObject(selectedObject.id, { opacity: parseInt(e.target.value) / 100 })}
              className="w-16 h-1 accent-blue-600"
              title={`Opacity: ${Math.round((selectedObject.opacity ?? 1) * 100)}%`}
            />
            <span className="text-[10px] text-gray-500 w-6">{Math.round((selectedObject.opacity ?? 1) * 100)}%</span>
          </div>
          
          <div className="w-px h-6 bg-gray-200 mx-1" />
          
          {/* Layer ordering */}
          <button
            onClick={() => moveLayer(selectedObject.id, 'up')}
            className="p-2 rounded-lg hover:bg-gray-100"
            title="Bring Forward"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => moveLayer(selectedObject.id, 'down')}
            className="p-2 rounded-lg hover:bg-gray-100"
            title="Send Backward"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          
          <div className="w-px h-6 bg-gray-200 mx-1" />
          
          {/* Duplicate */}
          <button
            onClick={() => duplicateObject(selectedObject.id)}
            className="p-2 rounded-lg hover:bg-gray-100"
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </button>
          
          {/* Delete */}
          <button
            onClick={() => deleteObject(selectedObject.id)}
            className="p-2 rounded-lg hover:bg-red-50 text-red-600"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* Status Bar — Print dimensions + Zoom */}
      <div className="bg-white border-t border-gray-200 px-6 py-2 flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <span className="font-medium">
            Print Size: {printWidthInches}" x {printHeightInches}" ({printWidthMm} x {printHeightMm} mm)
          </span>
          <span>|</span>
          <span>300 DPI</span>
          <span>|</span>
          <span>{objects.length} object{objects.length !== 1 ? 's' : ''}</span>
          {selectedObject && (
            <>
              <span>|</span>
              <span className="text-blue-600">Selected: {selectedObject.type} ({selectedObject.id.split('-')[0]})</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUserZoom(Math.max(0.1, (userZoom ?? autoScale) - 0.1))}
            className="p-1 hover:bg-gray-100 rounded"
            title="Zoom Out"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <input
            type="range"
            min="10"
            max="200"
            value={zoomPercent}
            onChange={(e) => setUserZoom(parseInt(e.target.value) / 100)}
            className="w-24 h-1 accent-gray-500"
          />
          <button
            onClick={() => setUserZoom(Math.min(2, (userZoom ?? autoScale) + 0.1))}
            className="p-1 hover:bg-gray-100 rounded"
            title="Zoom In"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <span className="w-10 text-center font-mono">{zoomPercent}%</span>
          <button
            onClick={() => setUserZoom(null)}
            className="px-2 py-0.5 text-[10px] bg-gray-100 rounded hover:bg-gray-200"
            title="Fit to screen"
          >
            Fit
          </button>
        </div>
      </div>
      
      {/* Premium Library Modal */}
      {showPremiumLibrary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Premium Library</h2>
              <button
                onClick={() => setShowPremiumLibrary(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {premiumAssets.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Loading premium assets...</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {premiumAssets.map((asset) => {
                    const isUsed = usedPremiumAssets.find(a => a.id === asset.id);
                    return (
                      <div
                        key={asset.id}
                        className={`border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                          isUsed
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                        onClick={() => !isUsed && handleAddPremiumAsset(asset)}
                      >
                        <div className="relative w-full h-32 bg-gray-100">
                          <img
                            src={asset.image}
                            alt={asset.title}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="p-3">
                          <h3 className="font-semibold text-sm mb-1">{asset.title}</h3>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">
                              {asset.artist?.name}
                            </span>
                            <span className="text-sm font-bold text-purple-600">
                              +${asset.premiumFee.toFixed(2)}
                            </span>
                          </div>
                          {isUsed && (
                            <div className="mt-2 text-xs text-purple-600 font-medium">
                              ✓ Added
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Selected: {usedPremiumAssets.length} asset{usedPremiumAssets.length !== 1 ? 's' : ''}
                </p>
                <p className="text-sm font-semibold text-purple-600">
                  Total Premium Fees: ${usedPremiumAssets.reduce((sum, a) => sum + a.fee, 0).toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => setShowPremiumLibrary(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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
        x={object.flipX ? (object.width || 100) : 0}
        y={object.flipY ? (object.height || 100) : 0}
        width={object.width || 100}
        height={object.height || 100}
        scaleX={object.flipX ? -1 : 1}
        scaleY={object.flipY ? -1 : 1}
        opacity={object.opacity ?? 1}
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
  onStartEdit,
  nodeRef,
}: {
  object: EditorObject;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<EditorObject>) => void;
  onDelete: () => void;
  onStartEdit: () => void;
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
      opacity={object.opacity ?? 1}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDblClick={onStartEdit}
      onDblTap={onStartEdit}
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
          {/* Circle */}
          {shapeType === 'circle' && (
            <Ellipse
              x={object.width / 2}
              y={object.height / 2}
              radiusX={Math.min(object.width, object.height) / 2}
              radiusY={Math.min(object.width, object.height) / 2}
              fill={object.backgroundColor || '#ffffff'}
              stroke={object.borderEnabled ? (object.borderColor || '#000000') : undefined}
              strokeWidth={object.borderWidth || 2}
            />
          )}
          
          {/* Oval */}
          {shapeType === 'oval' && (
            <Ellipse
              x={object.width / 2}
              y={object.height / 2}
              radiusX={object.width / 2}
              radiusY={object.height / 2}
              fill={object.backgroundColor || '#ffffff'}
              stroke={object.borderEnabled ? (object.borderColor || '#000000') : undefined}
              strokeWidth={object.borderWidth || 2}
            />
          )}
          
          {/* Rounded Rectangle */}
          {shapeType === 'rounded-rectangle' && (
            <Rect
              x={0}
              y={0}
              width={object.width}
              height={object.height}
              fill={object.backgroundColor || '#ffffff'}
              cornerRadius={object.cornerRadius || 20}
              stroke={object.borderEnabled ? (object.borderColor || '#000000') : undefined}
              strokeWidth={object.borderWidth || 2}
            />
          )}
          
          {/* Rectangle */}
          {shapeType === 'rectangle' && (
            <Rect
              x={0}
              y={0}
              width={object.width}
              height={object.height}
              fill={object.backgroundColor || '#ffffff'}
              cornerRadius={0}
              stroke={object.borderEnabled ? (object.borderColor || '#000000') : undefined}
              strokeWidth={object.borderWidth || 2}
            />
          )}
          
          {/* Speech Bubble */}
          {shapeType === 'speech-bubble' && (
            <>
              <Rect
                x={0}
                y={0}
                width={object.width}
                height={object.height - 15}
                fill={object.backgroundColor || '#ffffff'}
                cornerRadius={object.cornerRadius || 15}
                stroke={object.borderEnabled ? (object.borderColor || '#000000') : undefined}
                strokeWidth={object.borderWidth || 2}
              />
              {/* Pointer/tail */}
              <Line
                points={[
                  object.width * 0.2, object.height - 15,
                  object.width * 0.15, object.height,
                  object.width * 0.35, object.height - 15,
                ]}
                fill={object.backgroundColor || '#ffffff'}
                stroke={object.borderEnabled ? (object.borderColor || '#000000') : undefined}
                strokeWidth={object.borderWidth || 2}
                closed={true}
              />
            </>
          )}
          
          {/* Ribbon */}
          {shapeType === 'ribbon' && (
            <>
              {/* Main ribbon body */}
              <Rect
                x={15}
                y={0}
                width={object.width - 30}
                height={object.height}
                fill={object.backgroundColor || '#ffffff'}
                stroke={object.borderEnabled ? (object.borderColor || '#000000') : undefined}
                strokeWidth={object.borderWidth || 2}
              />
              {/* Left ribbon end */}
              <Line
                points={[
                  0, 0,
                  15, object.height / 2,
                  0, object.height,
                  15, object.height,
                  15, 0,
                ]}
                fill={object.backgroundColor || '#ffffff'}
                stroke={object.borderEnabled ? (object.borderColor || '#000000') : undefined}
                strokeWidth={object.borderWidth || 2}
                closed={true}
              />
              {/* Right ribbon end */}
              <Line
                points={[
                  object.width, 0,
                  object.width - 15, object.height / 2,
                  object.width, object.height,
                  object.width - 15, object.height,
                  object.width - 15, 0,
                ]}
                fill={object.backgroundColor || '#ffffff'}
                stroke={object.borderEnabled ? (object.borderColor || '#000000') : undefined}
                strokeWidth={object.borderWidth || 2}
                closed={true}
              />
            </>
          )}
          
          {/* Fallback for unknown shapes */}
          {!['circle', 'oval', 'rounded-rectangle', 'rectangle', 'speech-bubble', 'ribbon'].includes(shapeType || '') && (
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

