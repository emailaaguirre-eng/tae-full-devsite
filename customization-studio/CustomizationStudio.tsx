// customization-studio/CustomizationStudio.tsx
// Complete Customization Studio for Printful product design
// Features: Multiple images, resize, rotate, collage layouts, QR positioning, TEXT TOOL
// Phase 1: UNDO/REDO, IMAGE CROP, ZOOM CONTROLS

"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo, useId } from "react";
import { Stage, Layer, Image as KonvaImage, Rect, Transformer, Text, Group, Line } from "react-konva";
import Konva from "konva";

import {
  Placement,
  ProductSpec,
  ImageItem,
  TextItem,
  DesignState,
} from "./types";
import { COLLAGE_LAYOUTS, getLayoutById } from "./layouts";
import {
  getDisplayScale,
  generateId,
  fitImageToSlot,
  centerInSlot,
  PLACEMENT_LABELS,
} from "./utils";

// ============================================================================
// GOOGLE FONTS - Popular choices for cards
// ============================================================================

const FONT_OPTIONS = [
  { name: "Arial", family: "Arial, sans-serif" },
  { name: "Georgia", family: "Georgia, serif" },
  { name: "Times New Roman", family: "Times New Roman, serif" },
  { name: "Courier New", family: "Courier New, monospace" },
  { name: "Verdana", family: "Verdana, sans-serif" },
  { name: "Trebuchet MS", family: "Trebuchet MS, sans-serif" },
  { name: "Palatino", family: "Palatino Linotype, serif" },
  { name: "Garamond", family: "Garamond, serif" },
  { name: "Comic Sans MS", family: "Comic Sans MS, cursive" },
  { name: "Impact", family: "Impact, sans-serif" },
];

// ============================================================================
// ZOOM LEVELS
// ============================================================================

const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3];
const DEFAULT_ZOOM_INDEX = 3; // 100%

// ============================================================================
// COMPONENT PROPS
// ============================================================================

type Props = {
  productSpec: ProductSpec;
  placeholderQrCodeUrl?: string;
  artKeyTemplateUrl?: string;
  onExport?: (files: { placement: Placement; dataUrl: string }[]) => void;
  onSave?: (designs: DesignState) => void;
};

// ============================================================================

// ============================================================================
// CROP MODAL COMPONENT - Using react-image-crop library
// ============================================================================
// NOTE: You need to install: npm install react-image-crop
// And import the CSS in your app: import 'react-image-crop/dist/ReactCrop.css'

// For now, we'll use a simpler Canvas-based approach that definitely works
type CropModalProps = {
  imageItem: ImageItem;
  loadedImage: HTMLImageElement;
  onCrop: (croppedImageData: string, cropArea: { x: number; y: number; width: number; height: number }) => void;
  onCancel: () => void;
};

function CropModal({ imageItem, loadedImage, onCrop, onCancel }: CropModalProps) {
  // Unique ID for SVG mask to avoid collisions
  const maskId = useId();
  
  // Calculate display size - fit image within max bounds
  const maxW = 600;
  const maxH = 400;
  const imgW = loadedImage.naturalWidth;
  const imgH = loadedImage.naturalHeight;
  const scale = Math.min(maxW / imgW, maxH / imgH, 1);
  const dispW = Math.round(imgW * scale);
  const dispH = Math.round(imgH * scale);

  // Crop state as percentage of image (0-100)
  const [cropPct, setCropPct] = useState({ x: 10, y: 10, w: 80, h: 80 });
  
  // Drag tracking
  const drag = useRef<{
    active: boolean;
    mode: string;
    startMouse: { x: number; y: number };
    startCrop: { x: number; y: number; w: number; h: number };
  } | null>(null);

  // Convert percentage to pixels for display
  const cropPx = {
    x: (cropPct.x / 100) * dispW,
    y: (cropPct.y / 100) * dispH,
    w: (cropPct.w / 100) * dispW,
    h: (cropPct.h / 100) * dispH,
  };

  // Mouse handlers
  const onMouseDown = (e: React.MouseEvent, mode: string) => {
    e.preventDefault();
    drag.current = {
      active: true,
      mode,
      startMouse: { x: e.clientX, y: e.clientY },
      startCrop: { ...cropPct },
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!drag.current?.active) return;
    const d = drag.current;
    const dx = ((e.clientX - d.startMouse.x) / dispW) * 100;
    const dy = ((e.clientY - d.startMouse.y) / dispH) * 100;
    const s = d.startCrop;
    const min = 10; // minimum 10% size

    let nx = s.x, ny = s.y, nw = s.w, nh = s.h;

    if (d.mode === "move") {
      nx = Math.max(0, Math.min(100 - s.w, s.x + dx));
      ny = Math.max(0, Math.min(100 - s.h, s.y + dy));
    } else if (d.mode === "se") {
      nw = Math.max(min, Math.min(100 - s.x, s.w + dx));
      nh = Math.max(min, Math.min(100 - s.y, s.h + dy));
    } else if (d.mode === "sw") {
      const newX = Math.max(0, Math.min(s.x + s.w - min, s.x + dx));
      nx = newX;
      nw = s.w + (s.x - newX);
      nh = Math.max(min, Math.min(100 - s.y, s.h + dy));
    } else if (d.mode === "ne") {
      nw = Math.max(min, Math.min(100 - s.x, s.w + dx));
      const newY = Math.max(0, Math.min(s.y + s.h - min, s.y + dy));
      ny = newY;
      nh = s.h + (s.y - newY);
    } else if (d.mode === "nw") {
      const newX = Math.max(0, Math.min(s.x + s.w - min, s.x + dx));
      const newY = Math.max(0, Math.min(s.y + s.h - min, s.y + dy));
      nx = newX;
      ny = newY;
      nw = s.w + (s.x - newX);
      nh = s.h + (s.y - newY);
    }

    setCropPct({ x: nx, y: ny, w: nw, h: nh });
  };

  const onMouseUp = () => {
    if (drag.current) drag.current.active = false;
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const applyCrop = () => {
    // Convert percentage to actual image pixels
    const cx = (cropPct.x / 100) * imgW;
    const cy = (cropPct.y / 100) * imgH;
    const cw = (cropPct.w / 100) * imgW;
    const ch = (cropPct.h / 100) * imgH;

    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(loadedImage, cx, cy, cw, ch, 0, 0, cw, ch);
    onCrop(canvas.toDataURL("image/png"), { x: cx, y: cy, width: cw, height: ch });
  };

  const reset = () => setCropPct({ x: 0, y: 0, w: 100, h: 100 });

  const hs = 20; // handle size

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" style={{ userSelect: "none" }}>
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4">
        <h3 className="text-lg font-semibold mb-2">Crop Image</h3>
        <p className="text-sm text-gray-500 mb-4">Drag to move. Drag corners to resize.</p>

        {/* Single image container */}
        <div className="relative mx-auto mb-4" style={{ width: dispW, height: dispH }}>
          {/* The actual image - just one */}
          <img
            src={loadedImage.src}
            style={{ width: dispW, height: dispH, display: "block" }}
            draggable={false}
          />

          {/* Dark overlay with hole cut out for crop area */}
          <svg className="absolute inset-0" style={{ width: dispW, height: dispH }}>
            <defs>
              <mask id={maskId} maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse">
                <rect x="0" y="0" width={dispW} height={dispH} fill="white" />
                <rect x={cropPx.x} y={cropPx.y} width={cropPx.w} height={cropPx.h} fill="black" />
              </mask>
            </defs>
            <rect x="0" y="0" width={dispW} height={dispH} fill="rgba(0,0,0,0.6)" mask={`url(#${maskId})`} />
          </svg>

          {/* Crop border and move area */}
          <div
            className="absolute border-2 border-blue-500"
            style={{ left: cropPx.x, top: cropPx.y, width: cropPx.w, height: cropPx.h, cursor: "move" }}
            onMouseDown={(e) => onMouseDown(e, "move")}
          >
            {/* Grid lines */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/50" />
              <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/50" />
              <div className="absolute top-1/3 left-0 right-0 h-px bg-white/50" />
              <div className="absolute top-2/3 left-0 right-0 h-px bg-white/50" />
            </div>
          </div>

          {/* Corner handles */}
          {[
            { mode: "nw", x: cropPx.x - hs/2, y: cropPx.y - hs/2, cursor: "nwse-resize" },
            { mode: "ne", x: cropPx.x + cropPx.w - hs/2, y: cropPx.y - hs/2, cursor: "nesw-resize" },
            { mode: "sw", x: cropPx.x - hs/2, y: cropPx.y + cropPx.h - hs/2, cursor: "nesw-resize" },
            { mode: "se", x: cropPx.x + cropPx.w - hs/2, y: cropPx.y + cropPx.h - hs/2, cursor: "nwse-resize" },
          ].map((h) => (
            <div
              key={h.mode}
              className="absolute bg-white border-2 border-blue-500"
              style={{ left: h.x, top: h.y, width: hs, height: hs, cursor: h.cursor, zIndex: 10 }}
              onMouseDown={(e) => onMouseDown(e, h.mode)}
            />
          ))}
        </div>

        <p className="text-center text-sm text-gray-600 mb-4">
          {Math.round((cropPct.w / 100) * imgW)} x {Math.round((cropPct.h / 100) * imgH)} px
        </p>

        <div className="flex justify-between">
          <button onClick={reset} className="px-4 py-2 text-gray-600 hover:text-gray-800">Reset</button>
          <div className="flex gap-3">
            <button onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
            <button onClick={applyCrop} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Apply Crop</button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CustomizationStudio({
  productSpec,
  placeholderQrCodeUrl = "/images/placeholder-qr.svg",
  artKeyTemplateUrl = "/images/artkey-template.svg",
  onExport,
  onSave,
}: Props) {
  // -------------------------------------------------------------------------
  // STATE
  // -------------------------------------------------------------------------

  const [activePlacement, setActivePlacement] = useState<Placement>(
    productSpec.placements[0] || "front"
  );

  const [qrPlacement, setQrPlacement] = useState<Placement>(
    productSpec.qrDefaultPosition?.placement || "front"
  );

  const [designs, setDesigns] = useState<DesignState>(() => {
    const initial: DesignState = {};
    for (const p of productSpec.placements) {
      initial[p] = { images: [], texts: [] };
    }
    if (productSpec.requiresQrCode && productSpec.qrDefaultPosition) {
      const defaultPlacement = productSpec.qrDefaultPosition.placement;
      initial[defaultPlacement]!.qrCode = {
        x: productSpec.qrDefaultPosition.left,
        y: productSpec.qrDefaultPosition.top,
        width: productSpec.qrDefaultPosition.width,
        height: productSpec.qrDefaultPosition.height,
      };
    }
    return initial;
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<"image" | "text" | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<string>("single");
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map());
  const [qrImageObj, setQrImageObj] = useState<HTMLImageElement | null>(null);
  const [templateImageObj, setTemplateImageObj] = useState<HTMLImageElement | null>(null);

  // Text editing state
  const [isAddingText, setIsAddingText] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [textFont, setTextFont] = useState(FONT_OPTIONS[0].family);
  const [textSize, setTextSize] = useState(48);
  const [textColor, setTextColor] = useState("#000000");
  const [textBold, setTextBold] = useState(false);
  const [textItalic, setTextItalic] = useState(false);

  // =========================================================================
  // PHASE 1: UNDO/REDO STATE
  // =========================================================================
  const [history, setHistory] = useState<DesignState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUndoRedo, setIsUndoRedo] = useState(false);

  // =========================================================================
  // PHASE 1: ZOOM STATE
  // =========================================================================
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const zoomLevel = ZOOM_LEVELS[zoomIndex];

  // =========================================================================
  // PHASE 1: CROP STATE
  // =========================================================================
  const [cropImageId, setCropImageId] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // REFS
  // -------------------------------------------------------------------------

  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // -------------------------------------------------------------------------
  // COMPUTED VALUES
  // -------------------------------------------------------------------------

  const canvasWidth = productSpec.printWidth;
  const canvasHeight = productSpec.printHeight;
  const baseDisplayScale = getDisplayScale(canvasWidth, canvasHeight);
  const displayScale = baseDisplayScale * zoomLevel;
  const currentDesign = designs[activePlacement] || { images: [], texts: [] };
  const hasQrOnCurrentSurface = productSpec.requiresQrCode && qrPlacement === activePlacement;

  // Get selected text item for editing
  const selectedTextItem = selectedType === "text" && selectedId
    ? currentDesign.texts?.find((t) => t.id === selectedId)
    : null;

  // Get selected image item for cropping
  const selectedImageItem = selectedType === "image" && selectedId
    ? currentDesign.images?.find((img) => img.id === selectedId)
    : null;

  // Crop modal data
  const cropImageItem = cropImageId
    ? currentDesign.images?.find((img) => img.id === cropImageId)
    : null;
  const cropLoadedImage = cropImageId ? loadedImages.get(cropImageId) : null;

  // Can undo/redo
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // -------------------------------------------------------------------------
  // EFFECTS
  // -------------------------------------------------------------------------

  // Load placeholder QR code
  useEffect(() => {
    if (productSpec.requiresQrCode && placeholderQrCodeUrl) {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = placeholderQrCodeUrl;
      img.onload = () => setQrImageObj(img);
      img.onerror = () => console.error("Failed to load QR placeholder");
    }
  }, [placeholderQrCodeUrl, productSpec.requiresQrCode]);

  // Load ArtKey template
  useEffect(() => {
    if (productSpec.requiresQrCode && artKeyTemplateUrl) {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = artKeyTemplateUrl;
      img.onload = () => setTemplateImageObj(img);
      img.onerror = () => console.error("Failed to load ArtKey template");
    }
  }, [artKeyTemplateUrl, productSpec.requiresQrCode]);

  // Update transformer when selection changes
  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    if (!transformer || !stage) return;

    if (selectedId) {
      const node = stage.findOne(`#${selectedId}`);
      if (node) {
        transformer.nodes([node]);
        transformer.getLayer()?.batchDraw();
        return;
      }
    }
    transformer.nodes([]);
    transformer.getLayer()?.batchDraw();
  }, [selectedId, activePlacement, currentDesign.images, currentDesign.texts]);

  // Update text editing controls when text is selected
  useEffect(() => {
    if (selectedTextItem) {
      setTextFont(selectedTextItem.fontFamily);
      setTextSize(selectedTextItem.fontSize);
      setTextColor(selectedTextItem.fill);
      setTextBold(selectedTextItem.fontStyle?.includes("bold") || false);
      setTextItalic(selectedTextItem.fontStyle?.includes("italic") || false);
    }
  }, [selectedTextItem]);

  // =========================================================================
  // PHASE 1: UNDO/REDO - Save history when designs change
  // =========================================================================
  useEffect(() => {
    if (isUndoRedo) {
      setIsUndoRedo(false);
      return;
    }

    // Deep clone the current designs
    const designsCopy = JSON.parse(JSON.stringify(designs));

    setHistory((prev) => {
      // If we're not at the end, remove future states
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(designsCopy);
      
      // Limit history to 50 states
      if (newHistory.length > 50) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 49));
  }, [designs]);

  // =========================================================================
  // PHASE 1: KEYBOARD SHORTCUTS (Ctrl+Z, Ctrl+Y)
  // =========================================================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
      // Delete selected
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
          e.preventDefault();
          deleteSelected();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [historyIndex, history, selectedId]);

  // -------------------------------------------------------------------------
  // UNDO/REDO HANDLERS
  // -------------------------------------------------------------------------

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setIsUndoRedo(true);
      const prevState = history[historyIndex - 1];
      setDesigns(JSON.parse(JSON.stringify(prevState)));
      setHistoryIndex(historyIndex - 1);
      setSelectedId(null);
      setSelectedType(null);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setIsUndoRedo(true);
      const nextState = history[historyIndex + 1];
      setDesigns(JSON.parse(JSON.stringify(nextState)));
      setHistoryIndex(historyIndex + 1);
      setSelectedId(null);
      setSelectedType(null);
    }
  }, [historyIndex, history]);

  // -------------------------------------------------------------------------
  // ZOOM HANDLERS
  // -------------------------------------------------------------------------

  const handleZoomIn = useCallback(() => {
    setZoomIndex((prev) => Math.min(prev + 1, ZOOM_LEVELS.length - 1));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoomIndex(DEFAULT_ZOOM_INDEX);
  }, []);

  const handleZoomFit = useCallback(() => {
    // Find the zoom level that best fits the container
    const container = canvasContainerRef.current;
    if (!container) return;

    const containerWidth = container.clientWidth - 64; // padding
    const containerHeight = container.clientHeight - 64;

    const fitScaleW = containerWidth / canvasWidth;
    const fitScaleH = containerHeight / canvasHeight;
    const fitScale = Math.min(fitScaleW, fitScaleH);

    // Find closest zoom level
    const targetZoom = fitScale / baseDisplayScale;
    let closestIndex = 0;
    let closestDiff = Math.abs(ZOOM_LEVELS[0] - targetZoom);

    ZOOM_LEVELS.forEach((level, index) => {
      const diff = Math.abs(level - targetZoom);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIndex = index;
      }
    });

    setZoomIndex(closestIndex);
  }, [canvasWidth, canvasHeight, baseDisplayScale]);

  // -------------------------------------------------------------------------
  // CROP HANDLERS
  // -------------------------------------------------------------------------

  const handleStartCrop = useCallback(() => {
    if (selectedId && selectedType === "image") {
      setCropImageId(selectedId);
    }
  }, [selectedId, selectedType]);

  const handleCropComplete = useCallback(
    (croppedDataUrl: string, cropArea: { x: number; y: number; width: number; height: number }) => {
      if (!cropImageId) return;

      // Load the cropped image
      const newImg = new window.Image();
      newImg.crossOrigin = "anonymous";
      newImg.src = croppedDataUrl;

      newImg.onload = () => {
        // Update loaded images
        setLoadedImages((prev) => new Map(prev).set(cropImageId, newImg));

        // Update the image item in designs
        setDesigns((prev) => ({
          ...prev,
          [activePlacement]: {
            ...prev[activePlacement],
            images: (prev[activePlacement]?.images || []).map((img) => {
              if (img.id !== cropImageId) return img;

              // Get previous original dimensions (what the user scaled from)
              const prevOrigW = img.originalWidth || img.width;
              const prevOrigH = img.originalHeight || img.height;

              // Calculate the scale factors the user had applied
              const scaleX = img.width / prevOrigW;
              const scaleY = img.height / prevOrigH;

              // Apply same scale factors to new cropped dimensions
              return {
                ...img,
                src: croppedDataUrl,
                originalWidth: cropArea.width,
                originalHeight: cropArea.height,
                // Preserve the user's scaling
                width: cropArea.width * scaleX,
                height: cropArea.height * scaleY,
              };
            }),
          },
        }));

        setCropImageId(null);
      };
    },
    [cropImageId, activePlacement]
  );

  const handleCropCancel = useCallback(() => {
    setCropImageId(null);
  }, []);

  // -------------------------------------------------------------------------
  // QR PLACEMENT CHANGE HANDLER
  // -------------------------------------------------------------------------

  const handleQrPlacementChange = useCallback((newPlacement: Placement) => {
    setDesigns((prev) => {
      const oldPlacement = qrPlacement;
      const qrData = prev[oldPlacement]?.qrCode;

      const defaultQr = {
        x: productSpec.qrDefaultPosition?.left || 100,
        y: productSpec.qrDefaultPosition?.top || 100,
        width: productSpec.qrDefaultPosition?.width || 200,
        height: productSpec.qrDefaultPosition?.height || 200,
      };

      return {
        ...prev,
        [oldPlacement]: {
          ...prev[oldPlacement],
          qrCode: undefined,
        },
        [newPlacement]: {
          ...prev[newPlacement],
          qrCode: qrData || defaultQr,
        },
      };
    });

    setQrPlacement(newPlacement);
  }, [qrPlacement, productSpec.qrDefaultPosition]);

  // -------------------------------------------------------------------------
  // IMAGE HANDLERS
  // -------------------------------------------------------------------------

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const layout = getLayoutById(selectedLayout);
      const slots = layout?.slots || [{ x: 0, y: 0, width: 1, height: 1 }];
      const existingCount = currentDesign.images.length;

      Array.from(files).forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const src = event.target?.result as string;
          const img = new window.Image();

          img.onload = () => {
            const id = generateId();
            const slotIndex = (existingCount + index) % slots.length;
            const slot = slots[slotIndex];

            const slotX = slot.x * canvasWidth;
            const slotY = slot.y * canvasHeight;
            const slotWidth = slot.width * canvasWidth;
            const slotHeight = slot.height * canvasHeight;

            const fitted = fitImageToSlot(img.width, img.height, slotWidth, slotHeight);
            const centered = centerInSlot(fitted.width, fitted.height, slotX, slotY, slotWidth, slotHeight);

            const newImage: ImageItem = {
              id,
              src,
              x: centered.x,
              y: centered.y,
              width: fitted.width,
              height: fitted.height,
              rotation: 0,
              originalWidth: img.width,
              originalHeight: img.height,
            };

            setLoadedImages((prev) => new Map(prev).set(id, img));

            setDesigns((prev) => ({
              ...prev,
              [activePlacement]: {
                ...prev[activePlacement],
                images: [...(prev[activePlacement]?.images || []), newImage],
              },
            }));

            setSelectedId(id);
            setSelectedType("image");
          };

          img.src = src;
        };

        reader.readAsDataURL(file);
      });

      e.target.value = "";
    },
    [activePlacement, canvasWidth, canvasHeight, selectedLayout, currentDesign.images.length]
  );

  // -------------------------------------------------------------------------
  // TEXT HANDLERS
  // -------------------------------------------------------------------------

  const handleAddText = useCallback(() => {
    if (!textInput.trim()) return;

    const id = generateId();
    const fontStyle = `${textBold ? "bold " : ""}${textItalic ? "italic" : ""}`.trim() || "normal";

    const newText: TextItem = {
      id,
      text: textInput,
      x: canvasWidth / 2 - 100,
      y: canvasHeight / 2 - 25,
      fontSize: textSize,
      fontFamily: textFont,
      fill: textColor,
      fontStyle,
      rotation: 0,
    };

    setDesigns((prev) => ({
      ...prev,
      [activePlacement]: {
        ...prev[activePlacement],
        texts: [...(prev[activePlacement]?.texts || []), newText],
      },
    }));

    setSelectedId(id);
    setSelectedType("text");
    setTextInput("");
    setIsAddingText(false);
  }, [activePlacement, canvasWidth, canvasHeight, textInput, textSize, textFont, textColor, textBold, textItalic]);

  const handleUpdateSelectedText = useCallback((updates: Partial<TextItem>) => {
    if (!selectedId || selectedType !== "text") return;

    setDesigns((prev) => ({
      ...prev,
      [activePlacement]: {
        ...prev[activePlacement],
        texts: (prev[activePlacement]?.texts || []).map((t) =>
          t.id === selectedId ? { ...t, ...updates } : t
        ),
      },
    }));
  }, [selectedId, selectedType, activePlacement]);

  const handleTextStyleChange = useCallback(() => {
    if (!selectedId || selectedType !== "text") return;

    const fontStyle = `${textBold ? "bold " : ""}${textItalic ? "italic" : ""}`.trim() || "normal";

    handleUpdateSelectedText({
      fontSize: textSize,
      fontFamily: textFont,
      fill: textColor,
      fontStyle,
    });
  }, [selectedId, selectedType, textSize, textFont, textColor, textBold, textItalic, handleUpdateSelectedText]);

  // Apply style changes when controls change
  useEffect(() => {
    if (selectedTextItem) {
      handleTextStyleChange();
    }
  }, [textSize, textFont, textColor, textBold, textItalic]);

  // -------------------------------------------------------------------------
  // TRANSFORM HANDLERS
  // -------------------------------------------------------------------------

  const handleTransformEnd = useCallback(
    (id: string, type: "image" | "text", node: Konva.Node) => {
      if (type === "image") {
        setDesigns((prev) => ({
          ...prev,
          [activePlacement]: {
            ...prev[activePlacement],
            images: (prev[activePlacement]?.images || []).map((img) =>
              img.id === id
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
      } else {
        setDesigns((prev) => ({
          ...prev,
          [activePlacement]: {
            ...prev[activePlacement],
            texts: (prev[activePlacement]?.texts || []).map((t) =>
              t.id === id
                ? {
                    ...t,
                    x: node.x(),
                    y: node.y(),
                    fontSize: t.fontSize * node.scaleY(),
                    rotation: node.rotation(),
                  }
                : t
            ),
          },
        }));
      }

      node.scaleX(1);
      node.scaleY(1);
    },
    [activePlacement]
  );

  const handleDragEnd = useCallback(
    (id: string, type: "image" | "text", node: Konva.Node) => {
      if (type === "image") {
        setDesigns((prev) => ({
          ...prev,
          [activePlacement]: {
            ...prev[activePlacement],
            images: (prev[activePlacement]?.images || []).map((img) =>
              img.id === id ? { ...img, x: node.x(), y: node.y() } : img
            ),
          },
        }));
      } else {
        setDesigns((prev) => ({
          ...prev,
          [activePlacement]: {
            ...prev[activePlacement],
            texts: (prev[activePlacement]?.texts || []).map((t) =>
              t.id === id ? { ...t, x: node.x(), y: node.y() } : t
            ),
          },
        }));
      }
    },
    [activePlacement]
  );

  // -------------------------------------------------------------------------
  // QR CODE HANDLERS
  // -------------------------------------------------------------------------

  const handleQrDragEnd = useCallback(
    (node: Konva.Node) => {
      setDesigns((prev) => ({
        ...prev,
        [activePlacement]: {
          ...prev[activePlacement],
          qrCode: prev[activePlacement]?.qrCode
            ? {
                ...prev[activePlacement]!.qrCode!,
                x: node.x(),
                y: node.y(),
              }
            : undefined,
        },
      }));
    },
    [activePlacement]
  );

  // -------------------------------------------------------------------------
  // COMMON ACTIONS
  // -------------------------------------------------------------------------

  const rotateSelected = useCallback(
    (degrees: number) => {
      if (!selectedId) return;

      if (selectedType === "image") {
        setDesigns((prev) => ({
          ...prev,
          [activePlacement]: {
            ...prev[activePlacement],
            images: (prev[activePlacement]?.images || []).map((img) =>
              img.id === selectedId
                ? { ...img, rotation: (img.rotation + degrees) % 360 }
                : img
            ),
          },
        }));
      } else if (selectedType === "text") {
        setDesigns((prev) => ({
          ...prev,
          [activePlacement]: {
            ...prev[activePlacement],
            texts: (prev[activePlacement]?.texts || []).map((t) =>
              t.id === selectedId
                ? { ...t, rotation: (t.rotation + degrees) % 360 }
                : t
            ),
          },
        }));
      }
    },
    [selectedId, selectedType, activePlacement]
  );

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;

    if (selectedType === "image") {
      setDesigns((prev) => ({
        ...prev,
        [activePlacement]: {
          ...prev[activePlacement],
          images: (prev[activePlacement]?.images || []).filter(
            (img) => img.id !== selectedId
          ),
        },
      }));
      setLoadedImages((prev) => {
        const next = new Map(prev);
        next.delete(selectedId);
        return next;
      });
    } else if (selectedType === "text") {
      setDesigns((prev) => ({
        ...prev,
        [activePlacement]: {
          ...prev[activePlacement],
          texts: (prev[activePlacement]?.texts || []).filter(
            (t) => t.id !== selectedId
          ),
        },
      }));
    }

    setSelectedId(null);
    setSelectedType(null);
  }, [selectedId, selectedType, activePlacement]);

  const bringToFront = useCallback(() => {
    if (!selectedId || !selectedType) return;

    const key = selectedType === "image" ? "images" : "texts";

    setDesigns((prev) => {
      const items = prev[activePlacement]?.[key] || [];
      const index = items.findIndex((item: any) => item.id === selectedId);
      if (index === -1 || index === items.length - 1) return prev;

      const newItems = [...items];
      const [item] = newItems.splice(index, 1);
      newItems.push(item);

      return {
        ...prev,
        [activePlacement]: { ...prev[activePlacement], [key]: newItems },
      };
    });
  }, [selectedId, selectedType, activePlacement]);

  const sendToBack = useCallback(() => {
    if (!selectedId || !selectedType) return;

    const key = selectedType === "image" ? "images" : "texts";

    setDesigns((prev) => {
      const items = prev[activePlacement]?.[key] || [];
      const index = items.findIndex((item: any) => item.id === selectedId);
      if (index === -1 || index === 0) return prev;

      const newItems = [...items];
      const [item] = newItems.splice(index, 1);
      newItems.unshift(item);

      return {
        ...prev,
        [activePlacement]: { ...prev[activePlacement], [key]: newItems },
      };
    });
  }, [selectedId, selectedType, activePlacement]);

  // -------------------------------------------------------------------------
  // PLACEMENT SWITCH
  // -------------------------------------------------------------------------

  const switchPlacement = useCallback((placement: Placement) => {
    setSelectedId(null);
    setSelectedType(null);
    setActivePlacement(placement);
  }, []);

  // -------------------------------------------------------------------------
  // EXPORT
  // -------------------------------------------------------------------------

  const handleExport = useCallback(async () => {
    const stage = stageRef.current;
    if (!stage) return;

    setSelectedId(null);
    setSelectedType(null);
    transformerRef.current?.nodes([]);

    await new Promise((r) => setTimeout(r, 100));

    const exports: { placement: Placement; dataUrl: string }[] = [];

    // Temporarily reset zoom for export
    const currentZoom = zoomLevel;
    
    stage.scale({ x: 1, y: 1 });
    stage.width(canvasWidth);
    stage.height(canvasHeight);
    stage.batchDraw();

    const dataUrl = stage.toDataURL({
      pixelRatio: 1,
      mimeType: "image/png",
    });

    exports.push({ placement: activePlacement, dataUrl });

    // Restore zoom
    stage.scale({ x: displayScale, y: displayScale });
    stage.width(canvasWidth * displayScale);
    stage.height(canvasHeight * displayScale);
    stage.batchDraw();

    if (onExport) {
      onExport(exports);
    } else {
      const link = document.createElement("a");
      link.download = `${productSpec.name.replace(/\s+/g, "-")}-${activePlacement}.png`;
      link.href = dataUrl;
      link.click();
    }
  }, [activePlacement, canvasWidth, canvasHeight, displayScale, zoomLevel, onExport, productSpec.name]);

  const handleExportAll = useCallback(async () => {
    const stage = stageRef.current;
    if (!stage) return;

    setSelectedId(null);
    setSelectedType(null);
    transformerRef.current?.nodes([]);

    const exports: { placement: Placement; dataUrl: string }[] = [];
    const originalPlacement = activePlacement;

    for (const placement of productSpec.placements) {
      setActivePlacement(placement);
      await new Promise((r) => setTimeout(r, 200));

      stage.scale({ x: 1, y: 1 });
      stage.width(canvasWidth);
      stage.height(canvasHeight);
      stage.batchDraw();

      const dataUrl = stage.toDataURL({
        pixelRatio: 1,
        mimeType: "image/png",
      });

      exports.push({ placement, dataUrl });

      stage.scale({ x: displayScale, y: displayScale });
      stage.width(canvasWidth * displayScale);
      stage.height(canvasHeight * displayScale);
      stage.batchDraw();
    }

    setActivePlacement(originalPlacement);

    if (onExport) {
      onExport(exports);
    } else {
      exports.forEach(({ placement, dataUrl }) => {
        const link = document.createElement("a");
        link.download = `${productSpec.name.replace(/\s+/g, "-")}-${placement}.png`;
        link.href = dataUrl;
        link.click();
      });
    }
  }, [activePlacement, canvasWidth, canvasHeight, displayScale, onExport, productSpec]);

  // -------------------------------------------------------------------------
  // STAGE CLICK HANDLER
  // -------------------------------------------------------------------------

  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedId(null);
      setSelectedType(null);
    }
  }, []);

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Crop Modal */}
      {cropImageItem && cropLoadedImage && (
        <CropModal
          imageItem={cropImageItem}
          loadedImage={cropLoadedImage}
          onCrop={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      {/* Top Bar */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-800">{productSpec.name}</h2>
          <span className="text-sm text-gray-500">
            {productSpec.printWidth} × {productSpec.printHeight} px | {productSpec.printDpi} DPI
          </span>
        </div>
        
        {/* Undo/Redo + Zoom Controls */}
        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <div className="flex items-center gap-1 mr-4">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className={`p-2 rounded ${canUndo ? "hover:bg-gray-100" : "opacity-40 cursor-not-allowed"}`}
              title="Undo (Ctrl+Z)"
            >
              ↶
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className={`p-2 rounded ${canRedo ? "hover:bg-gray-100" : "opacity-40 cursor-not-allowed"}`}
              title="Redo (Ctrl+Y)"
            >
              ↷
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1">
            <button
              onClick={handleZoomOut}
              disabled={zoomIndex === 0}
              className={`p-1 rounded ${zoomIndex > 0 ? "hover:bg-gray-200" : "opacity-40 cursor-not-allowed"}`}
              title="Zoom Out"
            >
              −
            </button>
            <span className="text-sm font-medium w-14 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoomIndex === ZOOM_LEVELS.length - 1}
              className={`p-1 rounded ${zoomIndex < ZOOM_LEVELS.length - 1 ? "hover:bg-gray-200" : "opacity-40 cursor-not-allowed"}`}
              title="Zoom In"
            >
              +
            </button>
            <button
              onClick={handleZoomReset}
              className="p-1 rounded hover:bg-gray-200 text-xs ml-1"
              title="Reset Zoom to 100%"
            >
              100%
            </button>
            <button
              onClick={handleZoomFit}
              className="p-1 rounded hover:bg-gray-200 text-xs"
              title="Fit to Screen"
            >
              Fit
            </button>
          </div>

          {/* Export Buttons */}
          <button
            onClick={handleExport}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium ml-4"
          >
            Export Current
          </button>
          <button
            onClick={handleExportAll}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium"
          >
            Export All Surfaces
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar */}
        <div className="w-72 bg-white border-r flex flex-col overflow-y-auto">
          {/* Upload Section */}
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-700 mb-3">Upload Images</h3>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer"
            >
              <div className="text-2xl mb-1">📷</div>
              <span className="text-gray-600 text-sm">Click to upload</span>
            </button>
          </div>

          {/* Add Text Section */}
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-700 mb-3">Add Text</h3>
            {isAddingText ? (
              <div className="space-y-3">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Enter your text..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddText}
                    disabled={!textInput.trim()}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingText(false);
                      setTextInput("");
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 transition text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingText(true)}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer"
              >
                <div className="text-2xl mb-1">T</div>
                <span className="text-gray-600 text-sm">Click to add text</span>
              </button>
            )}
          </div>

          {/* Text Styling (when text is selected) */}
          {selectedType === "text" && selectedId && (
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-700 mb-3">Text Style</h3>
              <div className="space-y-3">
                {/* Font Family */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Font</label>
                  <select
                    value={textFont}
                    onChange={(e) => setTextFont(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                  >
                    {FONT_OPTIONS.map((font) => (
                      <option key={font.name} value={font.family}>
                        {font.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Font Size */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Size: {textSize}px</label>
                  <input
                    type="range"
                    min="12"
                    max="200"
                    value={textSize}
                    onChange={(e) => setTextSize(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>

                {/* Bold / Italic */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setTextBold(!textBold)}
                    className={`flex-1 px-3 py-2 rounded text-sm font-bold ${
                      textBold ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    B
                  </button>
                  <button
                    onClick={() => setTextItalic(!textItalic)}
                    className={`flex-1 px-3 py-2 rounded text-sm italic ${
                      textItalic ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    I
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Layout Selection */}
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-700 mb-3">Layouts</h3>
            <div className="grid grid-cols-5 gap-1">
              {COLLAGE_LAYOUTS.map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => setSelectedLayout(layout.id)}
                  className={`p-2 rounded border text-xs ${
                    selectedLayout === layout.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                  title={layout.name}
                >
                  <div className="w-6 h-6 mx-auto bg-gray-200 rounded-sm flex items-center justify-center">
                    <span className="text-[8px]">{layout.slots.length}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-2 text-center">
              {getLayoutById(selectedLayout)?.name}
            </div>
          </div>

          {/* Selection Tools */}
          {selectedId && (
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-700 mb-3">
                {selectedType === "image" ? "Image" : "Text"} Tools
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => rotateSelected(-90)}
                  className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm"
                >
                  ↺ Rotate L
                </button>
                <button
                  onClick={() => rotateSelected(90)}
                  className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm"
                >
                  ↻ Rotate R
                </button>
                <button
                  onClick={bringToFront}
                  className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm"
                >
                  ↑ Front
                </button>
                <button
                  onClick={sendToBack}
                  className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm"
                >
                  ↓ Back
                </button>
                {/* Crop button - only for images */}
                {selectedType === "image" && (
                  <button
                    onClick={handleStartCrop}
                    className="col-span-2 px-3 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-sm"
                  >
                    ✂️ Crop Image
                  </button>
                )}
                <button
                  onClick={deleteSelected}
                  className="col-span-2 px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          )}

          {/* ArtKey QR Code Section */}
          {productSpec.requiresQrCode && (
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-700 mb-2">ArtKey QR Code</h3>
              <div className="mb-3">
                <label className="text-sm text-gray-600 block mb-1">Place ArtKey on:</label>
                <select
                  value={qrPlacement}
                  onChange={(e) => handleQrPlacementChange(e.target.value as Placement)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {productSpec.placements.map((p) => (
                    <option key={p} value={p}>
                      {PLACEMENT_LABELS[p]}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-500">
                {hasQrOnCurrentSurface
                  ? "Drag to position the ArtKey."
                  : `Switch to ${PLACEMENT_LABELS[qrPlacement]} to see ArtKey.`}
              </p>
            </div>
          )}

          {/* Surfaces */}
          <div className="p-4 flex-1">
            <h3 className="font-semibold text-gray-700 mb-3">Surfaces</h3>
            <div className="space-y-2">
              {productSpec.placements.map((p) => (
                <button
                  key={p}
                  onClick={() => switchPlacement(p)}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between ${
                    activePlacement === p
                      ? "bg-blue-100 text-blue-700 border border-blue-300"
                      : "bg-gray-50 hover:bg-gray-100 border border-transparent"
                  }`}
                >
                  <span className="font-medium">
                    {PLACEMENT_LABELS[p]}
                    {qrPlacement === p && productSpec.requiresQrCode && (
                      <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                        ArtKey
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-gray-500">
                    {(designs[p]?.images?.length || 0) + (designs[p]?.texts?.length || 0)} items
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div 
          ref={canvasContainerRef}
          className="flex-1 flex items-center justify-center p-8 overflow-auto"
        >
          <div
            className="bg-white shadow-xl rounded-lg overflow-visible"
            style={{
              width: canvasWidth * displayScale,
              height: canvasHeight * displayScale,
            }}
          >
            <Stage
              ref={stageRef}
              width={canvasWidth * displayScale}
              height={canvasHeight * displayScale}
              scaleX={displayScale}
              scaleY={displayScale}
              onClick={handleStageClick}
              onTap={handleStageClick}
            >
              <Layer>
                {/* White background */}
                <Rect
                  x={0}
                  y={0}
                  width={canvasWidth}
                  height={canvasHeight}
                  fill="#ffffff"
                />

                {/* User Images */}
                {currentDesign.images.map((img) => {
                  const loadedImg = loadedImages.get(img.id);
                  if (!loadedImg) return null;

                  return (
                    <KonvaImage
                      key={img.id}
                      id={img.id}
                      image={loadedImg}
                      x={img.x}
                      y={img.y}
                      width={img.width}
                      height={img.height}
                      rotation={img.rotation}
                      draggable
                      onClick={() => {
                        setSelectedId(img.id);
                        setSelectedType("image");
                      }}
                      onTap={() => {
                        setSelectedId(img.id);
                        setSelectedType("image");
                      }}
                      onDragEnd={(e) => handleDragEnd(img.id, "image", e.target)}
                      onTransformEnd={(e) => handleTransformEnd(img.id, "image", e.target)}
                    />
                  );
                })}

                {/* User Texts */}
                {(currentDesign.texts || []).map((t) => (
                  <Text
                    key={t.id}
                    id={t.id}
                    text={t.text}
                    x={t.x}
                    y={t.y}
                    fontSize={t.fontSize}
                    fontFamily={t.fontFamily}
                    fill={t.fill}
                    fontStyle={t.fontStyle}
                    rotation={t.rotation}
                    draggable
                    onClick={() => {
                      setSelectedId(t.id);
                      setSelectedType("text");
                    }}
                    onTap={() => {
                      setSelectedId(t.id);
                      setSelectedType("text");
                    }}
                    onDragEnd={(e) => handleDragEnd(t.id, "text", e.target)}
                    onTransformEnd={(e) => handleTransformEnd(t.id, "text", e.target)}
                  />
                ))}

                {/* ArtKey Template with QR Code */}
                {hasQrOnCurrentSurface && currentDesign.qrCode && (
                  <>
                    {/* Template overlay */}
                    {templateImageObj && (
                      <KonvaImage
                        id="artkey-template"
                        image={templateImageObj}
                        x={currentDesign.qrCode.x}
                        y={currentDesign.qrCode.y}
                        width={currentDesign.qrCode.width}
                        height={currentDesign.qrCode.height}
                        draggable
                        onDragEnd={(e) => handleQrDragEnd(e.target)}
                        onClick={() => {
                          setSelectedId(null);
                          setSelectedType(null);
                        }}
                      />
                    )}
                    {/* QR Code - positioned inside the box on the key */}
                    {/* Calculated from SVG viewBox (1440x810): x=449, y=327.5, size=82x82 */}
                    {/* Converted to percentages: x=31.18%, y=40.43%, w=5.69%, h=10.12% */}
                    {qrImageObj && (
                      <KonvaImage
                        id="qr-code"
                        image={qrImageObj}
                        x={currentDesign.qrCode.x + (currentDesign.qrCode.width * 0.311806)}
                        y={currentDesign.qrCode.y + (currentDesign.qrCode.height * 0.404321)}
                        width={currentDesign.qrCode.width * 0.056944}
                        height={currentDesign.qrCode.height * 0.101235}
                        listening={false}
                      />
                    )}
                  </>
                )}

                {/* Transformer */}
                <Transformer
                  ref={transformerRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    if (newBox.width < 20 || newBox.height < 20) {
                      return oldBox;
                    }
                    return newBox;
                  }}
                  enabledAnchors={[
                    "top-left",
                    "top-right",
                    "bottom-left",
                    "bottom-right",
                    "middle-left",
                    "middle-right",
                    "top-center",
                    "bottom-center",
                  ]}
                  rotateEnabled={true}
                  keepRatio={selectedType === "text" ? true : false}
                  anchorSize={Math.max(8, 14 / displayScale)}
                  borderStrokeWidth={Math.max(1, 2 / displayScale)}
                />
              </Layer>
            </Stage>
          </div>
        </div>

        {/* Right Sidebar - Thumbnails */}
        <div className="w-48 bg-white border-l p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Preview</h3>
          <div className="space-y-3">
            {productSpec.placements.map((p) => (
              <button
                key={p}
                onClick={() => switchPlacement(p)}
                className={`w-full rounded-lg overflow-hidden border-2 ${
                  activePlacement === p
                    ? "border-blue-500"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <div className="bg-gray-100 p-2">
                  <div
                    className="bg-white mx-auto flex items-center justify-center text-xs text-gray-400"
                    style={{
                      width: "100%",
                      aspectRatio: `${canvasWidth} / ${canvasHeight}`,
                    }}
                  >
                    {qrPlacement === p && productSpec.requiresQrCode ? (
                      <span className="text-purple-600">🔑 ArtKey</span>
                    ) : (designs[p]?.images?.length || 0) + (designs[p]?.texts?.length || 0) > 0 ? (
                      <span className="text-green-600">
                        {(designs[p]?.images?.length || 0) + (designs[p]?.texts?.length || 0)} items
                      </span>
                    ) : (
                      <span>Empty</span>
                    )}
                  </div>
                </div>
                <div className="py-1 text-xs text-center bg-gray-50">
                  {PLACEMENT_LABELS[p]}
                </div>
              </button>
            ))}
          </div>

          {/* Keyboard Shortcuts Help */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-xs font-semibold text-gray-600 mb-2">Shortcuts</h4>
            <div className="text-xs text-gray-500 space-y-1">
              <div><kbd className="bg-gray-200 px-1 rounded">Ctrl+Z</kbd> Undo</div>
              <div><kbd className="bg-gray-200 px-1 rounded">Ctrl+Y</kbd> Redo</div>
              <div><kbd className="bg-gray-200 px-1 rounded">Del</kbd> Delete</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomizationStudio;
