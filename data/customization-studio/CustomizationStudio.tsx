// customization-studio/CustomizationStudio.tsx
// Customization Studio editor for Printful-style product design
// Features:
// - Image editing: drag/move, resize, rotate, crop
// - Text tool: add/edit text boxes, font, size, bold/italic/underline, alignment, color
// - Layouts: 1, 2, 3, 4 grid + collage (slot-based with clip + swap)
// - Delete: Delete/Backspace, toolbar button, right-click context menu
// - Canvas behavior: print-space pixel coords stay constant (no stage scaling)
// - ArtKey + QR: template + embedded QR renders at consistent print size via DPI mapping

"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Group, Image as KonvaImage, Layer, Rect, Stage, Text as KonvaText, Transformer } from "react-konva";
import Konva from "konva";

import type {
  DesignState,
  ImageItem,
  Placement,
  ProductSpec,
  TextAlign,
  TextItem,
} from "./types";
import { COLLAGE_LAYOUTS, getLayoutById } from "./layouts";
import {
  PLACEMENT_LABELS,
  clamp,
  coverImageToSlot,
  fitImageToSlot,
  centerInSlot,
  generateId,
  getDisplayScale,
  downloadDataURL,
} from "./utils";

// ============================================================================
// FONT OPTIONS (safe defaults, no external loading required)
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
  { name: "Impact", family: "Impact, sans-serif" },
];

// ============================================================================
// BRAND PALETTE (must be used in the editor UI)
// ============================================================================
const BRAND = {
  lightest: "#f3f3f3",
  light: "#ded8d3",
  medium: "#918c86",
  dark: "#000000",
  accent: "#475569",
  white: "#ffffff",
} as const;

// ============================================================================
// QR TEMPLATE MATH
// - QR is rendered inside the ArtKey template at ~24% of template size
// - The internal offsets are tuned to the canonical template SVG
// ============================================================================
const QR_IN_TEMPLATE_FRACTION = 0.24;
const QR_IN_TEMPLATE_X_FRACTION = 0.7033;
const QR_IN_TEMPLATE_Y_FRACTION = 0.2933;
const TARGET_QR_INCHES = 1; // enforce ~1in QR unless caller uses a larger template

// ============================================================================
// ZOOM LEVELS (multiplier on top of "fit" scale)
// ============================================================================
const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3];
// Default slightly zoomed-out so the canvas doesn't crowd the UI.
const DEFAULT_ZOOM_INDEX = 2; // 0.75
// "Fit" should mean "100% of fit scale".
const FIT_ZOOM_INDEX = 3; // 1.0

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
// CROP MODAL (simple, dependency-free)
// ============================================================================
type CropModalProps = {
  loadedImage: HTMLImageElement;
  onCrop: (croppedImageData: string, cropArea: { x: number; y: number; width: number; height: number }) => void;
  onCancel: () => void;
};

function CropModal({ loadedImage, onCrop, onCancel }: CropModalProps) {
  // Calculate display size (fit image within max bounds)
  const maxW = 700;
  const maxH = 460;
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
    mode: "move" | "nw" | "ne" | "sw" | "se";
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

  const onMouseDown = (e: React.MouseEvent, mode: "move" | "nw" | "ne" | "sw" | "se") => {
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
    const min = 10;

    let nx = s.x, ny = s.y, nw = s.w, nh = s.h;

    if (d.mode === "move") {
      nx = clamp(s.x + dx, 0, 100 - s.w);
      ny = clamp(s.y + dy, 0, 100 - s.h);
    } else if (d.mode === "se") {
      nw = clamp(s.w + dx, min, 100 - s.x);
      nh = clamp(s.h + dy, min, 100 - s.y);
    } else if (d.mode === "sw") {
      const newX = clamp(s.x + dx, 0, s.x + s.w - min);
      nx = newX;
      nw = s.w + (s.x - newX);
      nh = clamp(s.h + dy, min, 100 - s.y);
    } else if (d.mode === "ne") {
      nw = clamp(s.w + dx, min, 100 - s.x);
      const newY = clamp(s.y + dy, 0, s.y + s.h - min);
      ny = newY;
      nh = s.h + (s.y - newY);
    } else if (d.mode === "nw") {
      const newX = clamp(s.x + dx, 0, s.x + s.w - min);
      const newY = clamp(s.y + dy, 0, s.y + s.h - min);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyCrop = () => {
    const cx = (cropPct.x / 100) * imgW;
    const cy = (cropPct.y / 100) * imgH;
    const cw = (cropPct.w / 100) * imgW;
    const ch = (cropPct.h / 100) * imgH;

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(cw));
    canvas.height = Math.max(1, Math.round(ch));

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(loadedImage, cx, cy, cw, ch, 0, 0, cw, ch);
    onCrop(canvas.toDataURL("image/png"), { x: cx, y: cy, width: cw, height: ch });
  };

  const reset = () => setCropPct({ x: 0, y: 0, w: 100, h: 100 });
  const hs = 18; // handle size

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.7)", userSelect: "none" }}>
      <div className="rounded-lg p-6 max-w-4xl w-full mx-4" style={{ background: BRAND.white, color: BRAND.dark }}>
        <h3 className="text-lg font-semibold mb-1">Crop Image</h3>
        <p className="text-sm mb-4" style={{ color: BRAND.medium }}>
          Drag to move. Drag corners to resize.
        </p>

        <div className="relative mx-auto mb-4" style={{ width: dispW, height: dispH }}>
          <img src={loadedImage.src} style={{ width: dispW, height: dispH, display: "block" }} draggable={false} />

          {/* Dark overlay with a cutout */}
          <svg className="absolute inset-0" style={{ width: dispW, height: dispH }}>
            <defs>
              <mask id="cropMask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                <rect x={cropPx.x} y={cropPx.y} width={cropPx.w} height={cropPx.h} fill="black" />
              </mask>
            </defs>
            <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask="url(#cropMask)" />
          </svg>

          {/* Crop box */}
          <div
            className="absolute border-2"
            style={{
              left: cropPx.x,
              top: cropPx.y,
              width: cropPx.w,
              height: cropPx.h,
              cursor: "move",
              borderColor: BRAND.accent,
            }}
            onMouseDown={(e) => onMouseDown(e, "move")}
          >
            {/* Grid */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-1/3 top-0 bottom-0 w-px" style={{ background: "rgba(255,255,255,0.5)" }} />
              <div className="absolute left-2/3 top-0 bottom-0 w-px" style={{ background: "rgba(255,255,255,0.5)" }} />
              <div className="absolute top-1/3 left-0 right-0 h-px" style={{ background: "rgba(255,255,255,0.5)" }} />
              <div className="absolute top-2/3 left-0 right-0 h-px" style={{ background: "rgba(255,255,255,0.5)" }} />
            </div>
          </div>

          {/* Corner handles */}
          {[
            { mode: "nw" as const, x: cropPx.x - hs / 2, y: cropPx.y - hs / 2, cursor: "nwse-resize" },
            { mode: "ne" as const, x: cropPx.x + cropPx.w - hs / 2, y: cropPx.y - hs / 2, cursor: "nesw-resize" },
            { mode: "sw" as const, x: cropPx.x - hs / 2, y: cropPx.y + cropPx.h - hs / 2, cursor: "nesw-resize" },
            { mode: "se" as const, x: cropPx.x + cropPx.w - hs / 2, y: cropPx.y + cropPx.h - hs / 2, cursor: "nwse-resize" },
          ].map((h) => (
            <div
              key={h.mode}
              className="absolute border-2"
              style={{
                left: h.x,
                top: h.y,
                width: hs,
                height: hs,
                cursor: h.cursor,
                zIndex: 10,
                background: BRAND.white,
                borderColor: BRAND.accent,
              }}
              onMouseDown={(e) => onMouseDown(e, h.mode)}
            />
          ))}
        </div>

        <p className="text-center text-sm mb-4" style={{ color: BRAND.medium }}>
          {Math.round((cropPct.w / 100) * imgW)} × {Math.round((cropPct.h / 100) * imgH)} px
        </p>

        <div className="flex justify-between items-center">
          <button onClick={reset} className="px-4 py-2 rounded" style={{ color: BRAND.accent }}>
            Reset
          </button>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded"
              style={{ background: BRAND.light, color: BRAND.dark }}
            >
              Cancel
            </button>
            <button
              onClick={applyCrop}
              className="px-4 py-2 rounded"
              style={{ background: BRAND.accent, color: BRAND.white }}
            >
              Apply Crop
            </button>
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
  // BASIC STATE
  // -------------------------------------------------------------------------
  const [activePlacement, setActivePlacement] = useState<Placement>(
    productSpec.placements[0] || "front"
  );

  const [qrPlacement, setQrPlacement] = useState<Placement>(
    productSpec.qrDefaultPosition?.placement || productSpec.placements[0] || "front"
  );

  // Enforce a minimum ArtKey template size so the embedded QR prints ~1 inch.
  const normalizedQrDefault = useMemo(() => {
    if (!productSpec.qrDefaultPosition) return undefined;

    const dpi = productSpec.printDpi || 300;
    const expectedQrPx = dpi * TARGET_QR_INCHES;

    let width = productSpec.qrDefaultPosition.width;
    let height = productSpec.qrDefaultPosition.height;

    // Heuristic: if caller accidentally passed QR size instead of template size, upscale it.
    if (Math.max(width, height) <= expectedQrPx * 1.5) {
      width = Math.round(width / QR_IN_TEMPLATE_FRACTION);
      height = Math.round(height / QR_IN_TEMPLATE_FRACTION);
    }

    // Ensure template is never smaller than what would make the embedded QR ~1 inch.
    const minTemplate = Math.round(expectedQrPx / QR_IN_TEMPLATE_FRACTION);
    width = Math.max(width, minTemplate);
    height = Math.max(height, minTemplate);

    // Clamp top/left to keep within the canvas
    const left = clamp(productSpec.qrDefaultPosition.left, 0, Math.max(0, productSpec.printWidth - width));
    const top = clamp(productSpec.qrDefaultPosition.top, 0, Math.max(0, productSpec.printHeight - height));

    return {
      ...productSpec.qrDefaultPosition,
      left,
      top,
      width,
      height,
    };
  }, [productSpec]);

  const [designs, setDesigns] = useState<DesignState>(() => {
    const initial: any = {};
    for (const p of productSpec.placements) {
      initial[p] = { images: [], texts: [], layoutId: "single" };
    }
    if (productSpec.requiresQrCode && normalizedQrDefault) {
      initial[normalizedQrDefault.placement] = {
        ...(initial[normalizedQrDefault.placement] || { images: [], texts: [] }),
        layoutId: "single",
        qrCode: {
          x: normalizedQrDefault.left,
          y: normalizedQrDefault.top,
          width: normalizedQrDefault.width,
          height: normalizedQrDefault.height,
        },
      };
    }
    return initial as DesignState;
  });

  // Selection (images/texts)
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<"image" | "text" | null>(null);

  // Loaded resources
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map());
  const [qrImageObj, setQrImageObj] = useState<HTMLImageElement | null>(null);
  const [templateImageObj, setTemplateImageObj] = useState<HTMLImageElement | null>(null);

  // Text tool state
  const [isAddingText, setIsAddingText] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [textFont, setTextFont] = useState(FONT_OPTIONS[0].family);
  const [textSize, setTextSize] = useState(48);
  const [textColor, setTextColor] = useState(BRAND.dark);
  const [textBold, setTextBold] = useState(false);
  const [textItalic, setTextItalic] = useState(false);
  const [textUnderline, setTextUnderline] = useState(false);
  const [textAlign, setTextAlign] = useState<TextAlign>("left");

  // Undo/redo
  const [history, setHistory] = useState<DesignState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUndoRedo, setIsUndoRedo] = useState(false);

  // Zoom
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const zoomLevel = ZOOM_LEVELS[zoomIndex];

  // Crop
  const [cropImageId, setCropImageId] = useState<string | null>(null);

  // Context menu
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number }>({
    visible: false,
    x: 0,
    y: 0,
  });

  // -------------------------------------------------------------------------
  // REFS
  // -------------------------------------------------------------------------
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const designGroupRef = useRef<Konva.Group>(null);
  const guidesLayerRef = useRef<Konva.Layer>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // -------------------------------------------------------------------------
  // MEASURE CANVAS AREA (for "fit" scale)
  // -------------------------------------------------------------------------
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 1000,
    height: 700,
  });

  useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return;

    const update = () => {
      setContainerSize({
        width: el.clientWidth,
        height: el.clientHeight,
      });
    };

    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  // -------------------------------------------------------------------------
  // COMPUTED VALUES
  // -------------------------------------------------------------------------
  const canvasWidth = productSpec.printWidth;
  const canvasHeight = productSpec.printHeight;

  // "Fit" scale uses the available container size (minus padding)
  const fitMaxW = Math.max(1, containerSize.width - 64);
  const fitMaxH = Math.max(1, containerSize.height - 64);
  const baseDisplayScale = getDisplayScale(canvasWidth, canvasHeight, fitMaxW, fitMaxH);
  const displayScale = baseDisplayScale * zoomLevel;

  const stageWidth = Math.max(1, Math.round(canvasWidth * displayScale));
  const stageHeight = Math.max(1, Math.round(canvasHeight * displayScale));

  const currentDesign = designs[activePlacement] || { images: [], texts: [], layoutId: "single" };
  const currentLayoutId = currentDesign.layoutId || "single";
  const currentLayout = useMemo(() => getLayoutById(currentLayoutId) || getLayoutById("single")!, [currentLayoutId]);

  const slotRects = useMemo(() => {
    return (currentLayout.slots || [{ x: 0, y: 0, width: 1, height: 1 }]).map((s) => ({
      x: s.x * canvasWidth,
      y: s.y * canvasHeight,
      width: s.width * canvasWidth,
      height: s.height * canvasHeight,
    }));
  }, [currentLayout, canvasWidth, canvasHeight]);

  const hasQrOnCurrentSurface = productSpec.requiresQrCode && qrPlacement === activePlacement;

  const selectedTextItem =
    selectedType === "text" && selectedId
      ? (currentDesign.texts || []).find((t) => t.id === selectedId) || null
      : null;

  const selectedImageItem =
    selectedType === "image" && selectedId
      ? (currentDesign.images || []).find((img) => img.id === selectedId) || null
      : null;

  const cropImageItem = cropImageId ? (currentDesign.images || []).find((img) => img.id === cropImageId) : null;
  const cropLoadedImage = cropImageId ? loadedImages.get(cropImageId) : null;

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // -------------------------------------------------------------------------
  // LOAD STATIC ASSETS (QR placeholder + template)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!productSpec.requiresQrCode || !placeholderQrCodeUrl) return;

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = placeholderQrCodeUrl;
    img.onload = () => setQrImageObj(img);
    img.onerror = () => console.error("Failed to load QR placeholder:", placeholderQrCodeUrl);
  }, [placeholderQrCodeUrl, productSpec.requiresQrCode]);

  useEffect(() => {
    if (!productSpec.requiresQrCode || !artKeyTemplateUrl) return;

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = artKeyTemplateUrl;
    img.onload = () => setTemplateImageObj(img);
    img.onerror = () => console.error("Failed to load ArtKey template:", artKeyTemplateUrl);
  }, [artKeyTemplateUrl, productSpec.requiresQrCode]);

  // -------------------------------------------------------------------------
  // TRANSFORMER SYNC (selection -> transformer)
  // -------------------------------------------------------------------------
  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    if (!transformer || !stage) return;

    const clear = () => {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
    };

    if (!selectedId) {
      clear();
      return;
    }

    // Konva uses CSS-like selectors for `findOne('#id')`. IDs that start with digits
    // can fail selector parsing. We try CSS.escape when available and fall back to
    // a manual node scan.
    let node: Konva.Node | null = null;
    const cssEscape = (globalThis as any)?.CSS?.escape as ((s: string) => string) | undefined;

    const trySelectors: string[] = [];
    if (cssEscape) trySelectors.push(`#${cssEscape(selectedId)}`);
    trySelectors.push(`#${selectedId}`);

    for (const sel of trySelectors) {
      try {
        const found = stage.findOne(sel) as Konva.Node | undefined;
        if (found) {
          node = found;
          break;
        }
      } catch {
        // ignore
      }
    }

    if (!node) {
      try {
        const images = (stage.find("Image") as any)?.toArray?.() || [];
        const texts = (stage.find("Text") as any)?.toArray?.() || [];
        const candidates = [...images, ...texts];
        node =
          (candidates.find((n: any) => typeof n?.id === "function" && n.id() === selectedId) as Konva.Node) ||
          null;
      } catch {
        // ignore
      }
    }

    if (!node) {
      clear();
      return;
    }

    transformer.nodes([node]);
    transformer.getLayer()?.batchDraw();
  }, [selectedId, activePlacement, currentDesign.images, currentDesign.texts]);

  // Keep text controls in sync when selecting a text item
  useEffect(() => {
    if (!selectedTextItem) return;

    setTextInput(selectedTextItem.text);
    setTextFont(selectedTextItem.fontFamily);
    setTextSize(selectedTextItem.fontSize);
    setTextColor(selectedTextItem.fill);
    setTextBold(selectedTextItem.fontStyle?.includes("bold") || false);
    setTextItalic(selectedTextItem.fontStyle?.includes("italic") || false);
    setTextUnderline(selectedTextItem.textDecoration === "underline");
    setTextAlign(selectedTextItem.align || "left");
  }, [selectedTextItem]);

  // -------------------------------------------------------------------------
  // UNDO / REDO (push history when designs change)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (isUndoRedo) {
      setIsUndoRedo(false);
      return;
    }

    const designsCopy = JSON.parse(JSON.stringify(designs));

    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      trimmed.push(designsCopy);

      if (trimmed.length > 50) {
        trimmed.shift();
        return trimmed;
      }
      return trimmed;
    });

    setHistoryIndex((prev) => Math.min(prev + 1, 49));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designs]);

  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;
    setIsUndoRedo(true);
    const prevState = history[historyIndex - 1];
    setDesigns(JSON.parse(JSON.stringify(prevState)));
    setHistoryIndex(historyIndex - 1);
    setSelectedId(null);
    setSelectedType(null);
    setContextMenu((cm) => ({ ...cm, visible: false }));
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    setIsUndoRedo(true);
    const nextState = history[historyIndex + 1];
    setDesigns(JSON.parse(JSON.stringify(nextState)));
    setHistoryIndex(historyIndex + 1);
    setSelectedId(null);
    setSelectedType(null);
    setContextMenu((cm) => ({ ...cm, visible: false }));
  }, [history, historyIndex]);

  // Save callback (optional)
  useEffect(() => {
    onSave?.(designs);
  }, [designs, onSave]);

  // -------------------------------------------------------------------------
  // COMMON ACTIONS
  // -------------------------------------------------------------------------
  const deleteSelected = useCallback(() => {
    if (!selectedId || !selectedType) return;

    if (selectedType === "image") {
      setDesigns((prev) => ({
        ...prev,
        [activePlacement]: {
          ...prev[activePlacement],
          images: (prev[activePlacement]?.images || []).filter((img) => img.id !== selectedId),
        },
      }));

      setLoadedImages((prev) => {
        const next = new Map(prev);
        next.delete(selectedId);
        return next;
      });
    }

    if (selectedType === "text") {
      setDesigns((prev) => ({
        ...prev,
        [activePlacement]: {
          ...prev[activePlacement],
          texts: (prev[activePlacement]?.texts || []).filter((t) => t.id !== selectedId),
        },
      }));
    }

    setSelectedId(null);
    setSelectedType(null);
    setContextMenu((cm) => ({ ...cm, visible: false }));
  }, [activePlacement, selectedId, selectedType]);

  const rotateSelected = useCallback(
    (degrees: number) => {
      if (!selectedId || !selectedType) return;

      if (selectedType === "image") {
        setDesigns((prev) => ({
          ...prev,
          [activePlacement]: {
            ...prev[activePlacement],
            images: (prev[activePlacement]?.images || []).map((img) =>
              img.id === selectedId ? { ...img, rotation: (img.rotation + degrees) % 360 } : img
            ),
          },
        }));
      }

      if (selectedType === "text") {
        setDesigns((prev) => ({
          ...prev,
          [activePlacement]: {
            ...prev[activePlacement],
            texts: (prev[activePlacement]?.texts || []).map((t) =>
              t.id === selectedId ? { ...t, rotation: (t.rotation + degrees) % 360 } : t
            ),
          },
        }));
      }
    },
    [activePlacement, selectedId, selectedType]
  );

  const bringToFront = useCallback(() => {
    if (!selectedId || !selectedType) return;
    const key = selectedType === "image" ? "images" : "texts";

    setDesigns((prev) => {
      const items: any[] = prev[activePlacement]?.[key] || [];
      const index = items.findIndex((it) => it.id === selectedId);
      if (index === -1 || index === items.length - 1) return prev;

      const nextItems = [...items];
      const [item] = nextItems.splice(index, 1);
      nextItems.push(item);

      return {
        ...prev,
        [activePlacement]: {
          ...prev[activePlacement],
          [key]: nextItems,
        },
      };
    });
  }, [activePlacement, selectedId, selectedType]);

  const sendToBack = useCallback(() => {
    if (!selectedId || !selectedType) return;
    const key = selectedType === "image" ? "images" : "texts";

    setDesigns((prev) => {
      const items: any[] = prev[activePlacement]?.[key] || [];
      const index = items.findIndex((it) => it.id === selectedId);
      if (index <= 0) return prev;

      const nextItems = [...items];
      const [item] = nextItems.splice(index, 1);
      nextItems.unshift(item);

      return {
        ...prev,
        [activePlacement]: {
          ...prev[activePlacement],
          [key]: nextItems,
        },
      };
    });
  }, [activePlacement, selectedId, selectedType]);

  // -------------------------------------------------------------------------
  // KEYBOARD SHORTCUTS
  // -------------------------------------------------------------------------
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl/Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Redo: Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Delete
      if (e.key === "Delete" || e.key === "Backspace") {
        const tag = (document.activeElement?.tagName || "").toUpperCase();
        if (tag !== "INPUT" && tag !== "TEXTAREA" && selectedId) {
          e.preventDefault();
          deleteSelected();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteSelected, handleRedo, handleUndo, selectedId]);

  // -------------------------------------------------------------------------
  // LAYOUT HELPERS
  // -------------------------------------------------------------------------
  const applyLayout = useCallback(
    (layoutId: string) => {
      const layout = getLayoutById(layoutId);
      if (!layout) return;

      const nextSlotRects = (layout.slots || [{ x: 0, y: 0, width: 1, height: 1 }]).map((s) => ({
        x: s.x * canvasWidth,
        y: s.y * canvasHeight,
        width: s.width * canvasWidth,
        height: s.height * canvasHeight,
      }));

      setDesigns((prev) => {
        const current = prev[activePlacement] || { images: [], texts: [], layoutId: "single" };
        const images = [...(current.images || [])];

        const slotCount = nextSlotRects.length;
        const used = new Set<number>();

        // Keep valid unique assignments, clear the rest
        let normalized = images.map((img) => {
          const idx = typeof img.slotIndex === "number" ? img.slotIndex : undefined;
          if (idx !== undefined && idx >= 0 && idx < slotCount && !used.has(idx)) {
            used.add(idx);
            return img;
          }
          return { ...img, slotIndex: undefined };
        });

        // Assign unassigned images into free slots (first-come)
        const nextFreeSlot = () => {
          for (let i = 0; i < slotCount; i++) {
            if (!used.has(i)) return i;
          }
          return null;
        };

        normalized = normalized.map((img) => {
          if (typeof img.slotIndex === "number") return img;
          const slotIndex = nextFreeSlot();
          if (slotIndex === null) return img; // stays "free"
          used.add(slotIndex);

          const slot = nextSlotRects[slotIndex];

          const srcW = img.originalWidth || img.width;
          const srcH = img.originalHeight || img.height;

          const fitted = coverImageToSlot(srcW, srcH, slot.width, slot.height);
          const centered = centerInSlot(fitted.width, fitted.height, slot.x, slot.y, slot.width, slot.height);

          return {
            ...img,
            slotIndex,
            x: centered.x,
            y: centered.y,
            width: fitted.width,
            height: fitted.height,
          };
        });

        return {
          ...prev,
          [activePlacement]: {
            ...current,
            layoutId,
            images: normalized,
          },
        };
      });

      setSelectedId(null);
      setSelectedType(null);
    },
    [activePlacement, canvasWidth, canvasHeight]
  );

  const moveSelectedImageToSlot = useCallback(
    (targetSlotIndex: number | undefined) => {
      if (!selectedId || selectedType !== "image") return;

      const slotCount = slotRects.length;
      const safeTarget =
        typeof targetSlotIndex === "number" && targetSlotIndex >= 0 && targetSlotIndex < slotCount
          ? targetSlotIndex
          : undefined;

      setDesigns((prev) => {
        const current = prev[activePlacement];
        if (!current) return prev;

        const images = current.images || [];
        const selected = images.find((i) => i.id === selectedId);
        if (!selected) return prev;

        const from = typeof selected.slotIndex === "number" ? selected.slotIndex : undefined;

        const occupying = safeTarget !== undefined ? images.find((i) => i.slotIndex === safeTarget) : undefined;

        const nextImages = images.map((img) => {
          if (img.id === selectedId) return { ...img, slotIndex: safeTarget };
          if (occupying && img.id === occupying.id) return { ...img, slotIndex: from };
          return img;
        });

        // Re-fit both images to their new slots (keeps things tidy)
        const refit = (img: ImageItem): ImageItem => {
          if (typeof img.slotIndex !== "number") return img;
          const slot = slotRects[img.slotIndex];
          if (!slot) return { ...img, slotIndex: undefined };

          const srcW = img.originalWidth || img.width;
          const srcH = img.originalHeight || img.height;
          const fitted = coverImageToSlot(srcW, srcH, slot.width, slot.height);
          const centered = centerInSlot(fitted.width, fitted.height, slot.x, slot.y, slot.width, slot.height);

          return {
            ...img,
            x: centered.x,
            y: centered.y,
            width: fitted.width,
            height: fitted.height,
          };
        };

        return {
          ...prev,
          [activePlacement]: {
            ...current,
            images: nextImages.map(refit),
          },
        };
      });
    },
    [activePlacement, selectedId, selectedType, slotRects]
  );

  // -------------------------------------------------------------------------
  // IMAGE HANDLERS
  // -------------------------------------------------------------------------
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const slotCount = slotRects.length;

      // Precompute used slots on the current surface
      const used = new Set<number>();
      for (const img of currentDesign.images || []) {
        if (typeof img.slotIndex === "number") used.add(img.slotIndex);
      }

      const nextFreeSlot = () => {
        for (let i = 0; i < slotCount; i++) {
          if (!used.has(i)) return i;
        }
        return null;
      };

      Array.from(files).forEach((file) => {
        const reader = new FileReader();

        reader.onload = (event) => {
          const src = event.target?.result as string;

          const img = new window.Image();
          img.crossOrigin = "anonymous";

          img.onload = () => {
            const id = generateId();

            // Prefer filling empty layout slots first
            const slotIndex = nextFreeSlot();
            if (slotIndex !== null) used.add(slotIndex);

            let newImage: ImageItem;

            if (slotIndex !== null) {
              const slot = slotRects[slotIndex];

              const fitted = coverImageToSlot(img.width, img.height, slot.width, slot.height);
              const centered = centerInSlot(fitted.width, fitted.height, slot.x, slot.y, slot.width, slot.height);

              newImage = {
                id,
                src,
                slotIndex,
                x: centered.x,
                y: centered.y,
                width: fitted.width,
                height: fitted.height,
                rotation: 0,
                originalWidth: img.width,
                originalHeight: img.height,
              };
            } else {
              // No slots left: add as a free-floating image centered
              const maxW = canvasWidth * 0.8;
              const maxH = canvasHeight * 0.8;
              const fitted = fitImageToSlot(img.width, img.height, maxW, maxH);
              const centered = centerInSlot(fitted.width, fitted.height, 0, 0, canvasWidth, canvasHeight);

              newImage = {
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
            }

            setLoadedImages((prev) => new Map(prev).set(id, img));

            setDesigns((prev) => ({
              ...prev,
              [activePlacement]: {
                ...(prev[activePlacement] || { images: [], texts: [], layoutId: "single" }),
                images: [...((prev[activePlacement]?.images || []) as ImageItem[]), newImage],
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
    [activePlacement, canvasHeight, canvasWidth, currentDesign.images, slotRects]
  );

  const constrainImageToSlot = useCallback((img: ImageItem): ImageItem => {
    if (typeof img.slotIndex !== "number") return img;
    const slot = slotRects[img.slotIndex];
    if (!slot) return { ...img, slotIndex: undefined };

    // Clamp position:
    // - If the image is bigger than the slot, keep it covering the slot (no empty gaps).
    // - If the image is smaller than the slot (user resized down), keep it within the slot.
    // Axis-aligned; ignores rotation.
    const minX = slot.x + slot.width - img.width;
    const maxX = slot.x;
    const minY = slot.y + slot.height - img.height;
    const maxY = slot.y;

    const nextX = clamp(img.x, Math.min(minX, maxX), Math.max(minX, maxX));
    const nextY = clamp(img.y, Math.min(minY, maxY), Math.max(minY, maxY));

    return { ...img, x: nextX, y: nextY };
  }, [slotRects]);

  const handleImageDragEnd = useCallback(
    (id: string, node: Konva.Node) => {
      setDesigns((prev) => ({
        ...prev,
        [activePlacement]: {
          ...prev[activePlacement],
          images: (prev[activePlacement]?.images || []).map((img) => {
            if (img.id !== id) return img;
            return constrainImageToSlot({ ...img, x: node.x(), y: node.y() });
          }),
        },
      }));
    },
    [activePlacement, constrainImageToSlot]
  );

  const handleImageTransformEnd = useCallback(
    (id: string, node: Konva.Node) => {
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      const next = {
        x: node.x(),
        y: node.y(),
        width: Math.max(5, node.width() * scaleX),
        height: Math.max(5, node.height() * scaleY),
        rotation: node.rotation(),
      };

      node.scaleX(1);
      node.scaleY(1);

      setDesigns((prev) => ({
        ...prev,
        [activePlacement]: {
          ...prev[activePlacement],
          images: (prev[activePlacement]?.images || []).map((img) =>
            img.id === id ? constrainImageToSlot({ ...img, ...next }) : img
          ),
        },
      }));
    },
    [activePlacement, constrainImageToSlot]
  );

  // -------------------------------------------------------------------------
  // TEXT HANDLERS
  // -------------------------------------------------------------------------
  const addText = useCallback(
    (rawText: string) => {
      const trimmed = rawText.trim();
      if (!trimmed) return;

      const id = generateId();
      const fontStyle = `${textBold ? "bold " : ""}${textItalic ? "italic" : ""}`.trim() || "normal";
      const width = Math.max(200, Math.round(canvasWidth * 0.6));

      const newText: TextItem = {
        id,
        text: trimmed,
        x: (canvasWidth - width) / 2,
        y: canvasHeight / 2 - textSize / 2,
        fontSize: textSize,
        fontFamily: textFont,
        fill: textColor,
        fontStyle,
        rotation: 0,
        width,
        align: textAlign,
        textDecoration: textUnderline ? "underline" : "",
      };

      setDesigns((prev) => ({
        ...prev,
        [activePlacement]: {
          ...(prev[activePlacement] || { images: [], texts: [], layoutId: "single" }),
          texts: [...((prev[activePlacement]?.texts || []) as TextItem[]), newText],
        },
      }));

      setSelectedId(id);
      setSelectedType("text");
      setTextInput(trimmed);
      setIsAddingText(false);
    },
    [
      activePlacement,
      canvasHeight,
      canvasWidth,
      textAlign,
      textBold,
      textColor,
      textFont,
      textItalic,
      textSize,
      textUnderline,
    ]
  );

  const handleAddText = useCallback(() => addText(textInput), [addText, textInput]);

  const updateSelectedText = useCallback(
    (updates: Partial<TextItem>) => {
      if (!selectedId || selectedType !== "text") return;

      setDesigns((prev) => ({
        ...prev,
        [activePlacement]: {
          ...prev[activePlacement],
          texts: (prev[activePlacement]?.texts || []).map((t) => (t.id === selectedId ? { ...t, ...updates } : t)),
        },
      }));
    },
    [activePlacement, selectedId, selectedType]
  );

  // Apply style controls to selected text
  useEffect(() => {
    if (!selectedTextItem) return;
    const fontStyle = `${textBold ? "bold " : ""}${textItalic ? "italic" : ""}`.trim() || "normal";

    updateSelectedText({
      text: textInput,
      fontSize: textSize,
      fontFamily: textFont,
      fill: textColor,
      fontStyle,
      align: textAlign,
      textDecoration: textUnderline ? "underline" : "",
    });
  }, [selectedTextItem, textAlign, textBold, textColor, textFont, textInput, textItalic, textSize, textUnderline, updateSelectedText]);

  const handleTextDragEnd = useCallback(
    (id: string, node: Konva.Node) => {
      setDesigns((prev) => ({
        ...prev,
        [activePlacement]: {
          ...prev[activePlacement],
          texts: (prev[activePlacement]?.texts || []).map((t) => (t.id === id ? { ...t, x: node.x(), y: node.y() } : t)),
        },
      }));
    },
    [activePlacement]
  );

  const handleTextTransformEnd = useCallback(
    (id: string, node: Konva.Node) => {
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      setDesigns((prev) => ({
        ...prev,
        [activePlacement]: {
          ...prev[activePlacement],
          texts: (prev[activePlacement]?.texts || []).map((t) => {
            if (t.id !== id) return t;

            const nextFontSize = Math.max(8, t.fontSize * scaleY);
            const currentWidth = typeof t.width === "number" ? t.width : node.width();
            const nextWidth = Math.max(40, currentWidth * scaleX);

            return {
              ...t,
              x: node.x(),
              y: node.y(),
              rotation: node.rotation(),
              fontSize: nextFontSize,
              width: nextWidth,
            };
          }),
        },
      }));

      node.scaleX(1);
      node.scaleY(1);
    },
    [activePlacement]
  );

  // -------------------------------------------------------------------------
  // CROP HANDLERS
  // -------------------------------------------------------------------------
  const handleStartCrop = useCallback(() => {
    if (selectedId && selectedType === "image") setCropImageId(selectedId);
  }, [selectedId, selectedType]);

  const handleCropComplete = useCallback(
    (croppedDataUrl: string, cropArea: { x: number; y: number; width: number; height: number }) => {
      if (!cropImageId) return;

      const newImg = new window.Image();
      newImg.crossOrigin = "anonymous";
      newImg.src = croppedDataUrl;

      newImg.onload = () => {
        setLoadedImages((prev) => new Map(prev).set(cropImageId, newImg));

        setDesigns((prev) => ({
          ...prev,
          [activePlacement]: {
            ...prev[activePlacement],
            images: (prev[activePlacement]?.images || []).map((img) => {
              if (img.id !== cropImageId) return img;

              const updated: ImageItem = {
                ...img,
                src: croppedDataUrl,
                originalWidth: cropArea.width,
                originalHeight: cropArea.height,
              };

              // Keep display size (width) but update height to match new aspect
              const aspect = cropArea.width / cropArea.height;
              const nextW = img.width;
              const nextH = nextW / aspect;

              return constrainImageToSlot({
                ...updated,
                width: nextW,
                height: nextH,
              });
            }),
          },
        }));

        setCropImageId(null);
      };
    },
    [activePlacement, constrainImageToSlot, cropImageId]
  );

  const handleCropCancel = useCallback(() => setCropImageId(null), []);

  // -------------------------------------------------------------------------
  // QR HANDLERS
  // -------------------------------------------------------------------------
  const handleQrPlacementChange = useCallback(
    (newPlacement: Placement) => {
      setDesigns((prev) => {
        const oldPlacement = qrPlacement;
        const qrData = prev[oldPlacement]?.qrCode;

        const fallback = normalizedQrDefault
          ? {
              x: normalizedQrDefault.left,
              y: normalizedQrDefault.top,
              width: normalizedQrDefault.width,
              height: normalizedQrDefault.height,
            }
          : {
              x: 100,
              y: 100,
              width: 200,
              height: 200,
            };

        return {
          ...prev,
          [oldPlacement]: {
            ...prev[oldPlacement],
            qrCode: undefined,
          },
          [newPlacement]: {
            ...prev[newPlacement],
            qrCode: qrData || fallback,
          },
        };
      });

      setQrPlacement(newPlacement);
    },
    [normalizedQrDefault, qrPlacement]
  );

  const handleQrDragEnd = useCallback(
    (node: Konva.Node) => {
      setDesigns((prev) => ({
        ...prev,
        [activePlacement]: {
          ...prev[activePlacement],
          qrCode: prev[activePlacement]?.qrCode
            ? { ...prev[activePlacement]!.qrCode!, x: node.x(), y: node.y() }
            : undefined,
        },
      }));
    },
    [activePlacement]
  );

  // -------------------------------------------------------------------------
  // STAGE EVENTS (click + right-click)
  // -------------------------------------------------------------------------
  const handleStageClick = useCallback((e: any) => {
    // Any left click hides context menu
    setContextMenu((cm) => ({ ...cm, visible: false }));

    const stage = e.target.getStage();
    const clickedOnEmpty = e.target === stage;

    if (clickedOnEmpty) {
      setSelectedId(null);
      setSelectedType(null);
    }
  }, []);

  const handleStageContextMenu = useCallback((e: any) => {
    e.evt.preventDefault();

    const stage = e.target.getStage();
    const target = e.target;

    // Clicked on blank space
    if (target === stage) {
      setContextMenu((cm) => ({ ...cm, visible: false }));
      return;
    }

    const className = target.getClassName?.() as string | undefined;
    const id = target.id?.() as string | undefined;

    // Ignore ArtKey template/QR nodes (not part of the editable selection set)
    if (id === "artkey-template" || id === "qr-code") {
      setContextMenu((cm) => ({ ...cm, visible: false }));
      return;
    }

    if (!id) return;

    if (className === "Image") {
      setSelectedId(id);
      setSelectedType("image");
    } else if (className === "Text") {
      setSelectedId(id);
      setSelectedType("text");
    } else {
      // Not a selectable thing
      setContextMenu((cm) => ({ ...cm, visible: false }));
      return;
    }

    setContextMenu({
      visible: true,
      x: e.evt.clientX,
      y: e.evt.clientY,
    });
  }, []);

  // Hide context menu on outside click
  useEffect(() => {
    if (!contextMenu.visible) return;

    const hide = () => setContextMenu((cm) => ({ ...cm, visible: false }));
    window.addEventListener("mousedown", hide);
    window.addEventListener("scroll", hide, true);

    return () => {
      window.removeEventListener("mousedown", hide);
      window.removeEventListener("scroll", hide, true);
    };
  }, [contextMenu.visible]);

  // -------------------------------------------------------------------------
  // EXPORT
  // -------------------------------------------------------------------------
  const snapshotCurrentStage = useCallback((): string | null => {
    const stage = stageRef.current;
    const group = designGroupRef.current;
    if (!stage || !group) return null;

    // Hide guides + clear transformer
    transformerRef.current?.nodes([]);
    const guidesLayer = guidesLayerRef.current;
    const prevGuidesVisible = guidesLayer?.visible() ?? true;

    const prevStage = { w: stage.width(), h: stage.height() };
    const prevGroup = { x: group.x(), y: group.y(), sx: group.scaleX(), sy: group.scaleY() };

    try {
      guidesLayer?.visible(false);

      stage.width(canvasWidth);
      stage.height(canvasHeight);
      group.position({ x: 0, y: 0 });
      group.scale({ x: 1, y: 1 });

      stage.batchDraw();

      return stage.toDataURL({ mimeType: "image/png", pixelRatio: 1 });
    } finally {
      // Restore
      group.position({ x: prevGroup.x, y: prevGroup.y });
      group.scale({ x: prevGroup.sx, y: prevGroup.sy });
      stage.width(prevStage.w);
      stage.height(prevStage.h);
      guidesLayer?.visible(prevGuidesVisible);

      stage.batchDraw();
    }
  }, [canvasHeight, canvasWidth]);

  const exportCurrentPlacement = useCallback(() => {
    // Clear selection and context menu
    setSelectedId(null);
    setSelectedType(null);
    setContextMenu((cm) => ({ ...cm, visible: false }));

    // A short timeout gives React-Konva a beat to remove transformer visuals
    return new Promise<string | null>((resolve) => {
      setTimeout(() => resolve(snapshotCurrentStage()), 50);
    });
  }, [snapshotCurrentStage]);

  const handleExport = useCallback(async () => {
    const dataUrl = await exportCurrentPlacement();
    if (!dataUrl) return;

    if (onExport) {
      onExport([{ placement: activePlacement, dataUrl }]);
      return;
    }

    downloadDataURL(dataUrl, `${productSpec.name}-${activePlacement}.png`);
  }, [activePlacement, exportCurrentPlacement, onExport, productSpec.name]);

  const handleExportAll = useCallback(async () => {
    const originalPlacement = activePlacement;

    const outputs: { placement: Placement; dataUrl: string }[] = [];

    for (const placement of productSpec.placements) {
      setActivePlacement(placement);

      // Wait a tick for placement render
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 80));

      // eslint-disable-next-line no-await-in-loop
      const dataUrl = await exportCurrentPlacement();
      if (dataUrl) outputs.push({ placement, dataUrl });
    }

    setActivePlacement(originalPlacement);

    if (onExport) {
      onExport(outputs);
      return;
    }

    outputs.forEach((o) => downloadDataURL(o.dataUrl, `${productSpec.name}-${o.placement}.png`));
  }, [activePlacement, exportCurrentPlacement, onExport, productSpec.name, productSpec.placements]);

  // -------------------------------------------------------------------------
  // UI HELPERS
  // -------------------------------------------------------------------------
  const switchPlacement = useCallback((p: Placement) => {
    setActivePlacement(p);
    setSelectedId(null);
    setSelectedType(null);
    setContextMenu((cm) => ({ ...cm, visible: false }));
  }, []);

  const handleZoomIn = useCallback(() => setZoomIndex((i) => Math.min(i + 1, ZOOM_LEVELS.length - 1)), []);
  const handleZoomOut = useCallback(() => setZoomIndex((i) => Math.max(i - 1, 0)), []);
  const handleZoomReset = useCallback(() => setZoomIndex(DEFAULT_ZOOM_INDEX), []);
  const handleZoomFit = useCallback(() => setZoomIndex(FIT_ZOOM_INDEX), []);

  // -------------------------------------------------------------------------
  // RENDER HELPERS (slot + drag bound)
  // -------------------------------------------------------------------------
  const getImageDragBoundFunc = useCallback(
    (img: ImageItem) => {
      if (typeof img.slotIndex !== "number") return undefined;
      const slot = slotRects[img.slotIndex];
      if (!slot) return undefined;

      // Bound within slot so it continues to cover it (ignores rotation)
      const minX = slot.x + slot.width - img.width;
      const maxX = slot.x;
      const minY = slot.y + slot.height - img.height;
      const maxY = slot.y;

      return (pos: { x: number; y: number }) => ({
        x: clamp(pos.x, Math.min(minX, maxX), Math.max(minX, maxX)),
        y: clamp(pos.y, Math.min(minY, maxY), Math.max(minY, maxY)),
      });
    },
    [slotRects]
  );

  // -------------------------------------------------------------------------
  // JSX
  // -------------------------------------------------------------------------
  return (
    <div className="w-full h-full flex flex-col" style={{ background: BRAND.lightest, color: BRAND.dark }}>
      {/* Top Bar */}
      <div
        className="p-4 border-b flex items-center justify-between"
        style={{ background: BRAND.white, borderColor: BRAND.light }}
      >
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold" style={{ color: BRAND.dark }}>
            Customization Studio
          </h1>
          <span className="text-sm px-2 py-1 rounded" style={{ background: BRAND.light, color: BRAND.dark }}>
            {productSpec.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Undo / Redo */}
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className="px-3 py-2 rounded text-sm disabled:opacity-50"
            style={{ background: BRAND.light, color: BRAND.dark }}
            title="Undo (Ctrl/Cmd+Z)"
          >
            ↶ Undo
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className="px-3 py-2 rounded text-sm disabled:opacity-50"
            style={{ background: BRAND.light, color: BRAND.dark }}
            title="Redo (Ctrl/Cmd+Y)"
          >
            ↷ Redo
          </button>

          {/* Quick add text */}
          <button
            onClick={() => addText("Text")}
            className="px-3 py-2 rounded text-sm"
            style={{ background: BRAND.light, color: BRAND.dark }}
            title="Add a text label"
          >
            ＋ Text
          </button>

          {/* Zoom */}
          <div className="mx-2 h-6 w-px" style={{ background: BRAND.light }} />
          <button
            onClick={handleZoomOut}
            className="px-3 py-2 rounded text-sm"
            style={{ background: BRAND.light, color: BRAND.dark }}
            title="Zoom out"
          >
            −
          </button>
          <button
            onClick={handleZoomReset}
            className="px-3 py-2 rounded text-sm"
            style={{ background: BRAND.light, color: BRAND.dark }}
            title="Reset zoom"
          >
            {Math.round(zoomLevel * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            className="px-3 py-2 rounded text-sm"
            style={{ background: BRAND.light, color: BRAND.dark }}
            title="Zoom in"
          >
            +
          </button>
          <button
            onClick={handleZoomFit}
            className="px-3 py-2 rounded text-sm"
            style={{ background: BRAND.light, color: BRAND.dark }}
            title="Fit"
          >
            Fit
          </button>

          {/* Export */}
          <div className="mx-2 h-6 w-px" style={{ background: BRAND.light }} />
          <button
            onClick={handleExport}
            className="px-3 py-2 rounded text-sm font-medium"
            style={{ background: BRAND.accent, color: BRAND.white }}
          >
            Export PNG
          </button>
          <button
            onClick={handleExportAll}
            className="px-3 py-2 rounded text-sm font-medium"
            style={{ background: BRAND.accent, color: BRAND.white }}
          >
            Export All
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 border-r flex flex-col" style={{ background: BRAND.white, borderColor: BRAND.light }}>
          <div className="flex-1 overflow-auto">
          {/* Image Tools */}
          <div className="p-4 border-b" style={{ borderColor: BRAND.light }}>
            <h3 className="font-semibold mb-3">Images</h3>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={openFilePicker}
              className="w-full px-4 py-2 rounded font-medium"
              style={{ background: BRAND.accent, color: BRAND.white }}
            >
              Upload Images
            </button>

            <p className="text-xs mt-2" style={{ color: BRAND.medium }}>
              Tip: In layouts, images are clipped to slots. Drag inside a slot to adjust the crop.
            </p>
          </div>

          {/* Layouts */}
          <div className="p-4 border-b" style={{ borderColor: BRAND.light }}>
            <h3 className="font-semibold mb-3">Layouts</h3>
            <div className="grid grid-cols-2 gap-2">
              {COLLAGE_LAYOUTS.map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => applyLayout(layout.id)}
                  className="px-3 py-2 rounded text-sm border"
                  style={{
                    borderColor: currentLayoutId === layout.id ? BRAND.accent : BRAND.light,
                    background: currentLayoutId === layout.id ? BRAND.lightest : BRAND.white,
                    color: BRAND.dark,
                  }}
                >
                  {layout.name}
                </button>
              ))}
            </div>
            <p className="text-xs mt-2" style={{ color: BRAND.medium }}>
              Active layout: <span style={{ color: BRAND.dark }}>{currentLayout.name}</span>
            </p>
          </div>

          {/* Text Tool */}
          <div className="p-4 border-b" style={{ borderColor: BRAND.light }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Text</h3>
              <button
                onClick={() => {
                  // Enter add-text mode. Clear selection so the panel doesn't stay stuck
                  // in "Editing selected text" mode.
                  if (!isAddingText) {
                    setSelectedId(null);
                    setSelectedType(null);
                    setTextInput("");
                  }
                  setIsAddingText((v) => !v);
                }}
                className="px-3 py-1 rounded text-sm"
                style={{ background: BRAND.light, color: BRAND.dark }}
              >
                {isAddingText ? "Close" : "Add"}
              </button>
            </div>

            {/* Add/Edit Panel */}
            {(isAddingText || selectedType === "text") && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs block mb-1" style={{ color: BRAND.medium }}>
                    Text
                  </label>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    rows={3}
                    className="w-full border rounded px-3 py-2 text-sm"
                    style={{ borderColor: BRAND.light }}
                    placeholder="Type your message…"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs block mb-1" style={{ color: BRAND.medium }}>
                      Font
                    </label>
                    <select
                      value={textFont}
                      onChange={(e) => setTextFont(e.target.value)}
                      className="w-full border rounded px-2 py-2 text-sm"
                      style={{ borderColor: BRAND.light }}
                    >
                      {FONT_OPTIONS.map((f) => (
                        <option key={f.family} value={f.family}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs block mb-1" style={{ color: BRAND.medium }}>
                      Size
                    </label>
                    <input
                      type="number"
                      min={8}
                      max={300}
                      value={textSize}
                      onChange={(e) => setTextSize(parseInt(e.target.value || "48", 10))}
                      className="w-full border rounded px-2 py-2 text-sm"
                      style={{ borderColor: BRAND.light }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 items-center">
                  <div className="flex items-center gap-2">
                    <label className="text-xs" style={{ color: BRAND.medium }}>
                      Color
                    </label>
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-10 h-8 border rounded"
                      style={{ borderColor: BRAND.light }}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => setTextBold((v) => !v)}
                      className="px-2 py-1 rounded text-sm border"
                      style={{
                        borderColor: BRAND.light,
                        background: textBold ? BRAND.lightest : BRAND.white,
                        color: BRAND.dark,
                      }}
                      title="Bold"
                    >
                      B
                    </button>
                    <button
                      onClick={() => setTextItalic((v) => !v)}
                      className="px-2 py-1 rounded text-sm border italic"
                      style={{
                        borderColor: BRAND.light,
                        background: textItalic ? BRAND.lightest : BRAND.white,
                        color: BRAND.dark,
                      }}
                      title="Italic"
                    >
                      I
                    </button>
                    <button
                      onClick={() => setTextUnderline((v) => !v)}
                      className="px-2 py-1 rounded text-sm border underline"
                      style={{
                        borderColor: BRAND.light,
                        background: textUnderline ? BRAND.lightest : BRAND.white,
                        color: BRAND.dark,
                      }}
                      title="Underline"
                    >
                      U
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-xs" style={{ color: BRAND.medium }}>
                    Align
                  </label>
                  <div className="flex gap-1">
                    {(["left", "center", "right"] as TextAlign[]).map((a) => (
                      <button
                        key={a}
                        onClick={() => setTextAlign(a)}
                        className="px-2 py-1 rounded text-xs border"
                        style={{
                          borderColor: BRAND.light,
                          background: textAlign === a ? BRAND.lightest : BRAND.white,
                          color: BRAND.dark,
                        }}
                      >
                        {a === "left" ? "⟸" : a === "center" ? "≡" : "⟹"}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedType !== "text" ? (
                  <button
                    onClick={handleAddText}
                    className="w-full px-4 py-2 rounded font-medium"
                    style={{ background: BRAND.accent, color: BRAND.white }}
                  >
                    Add Text
                  </button>
                ) : (
                  <p className="text-xs" style={{ color: BRAND.medium }}>
                    Editing selected text. Drag it on the canvas, or resize with handles.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Selected Item Tools */}
          {selectedId && selectedType && (
            <div className="p-4 border-b" style={{ borderColor: BRAND.light }}>
              <h3 className="font-semibold mb-3">Selection</h3>

              {selectedType === "image" && (
                <div className="mb-3">
                  <label className="text-xs block mb-1" style={{ color: BRAND.medium }}>
                    Slot
                  </label>
                  <select
                    value={
                      typeof selectedImageItem?.slotIndex === "number"
                        ? String(selectedImageItem.slotIndex)
                        : "free"
                    }
                    onChange={(e) => {
                      const v = e.target.value;
                      moveSelectedImageToSlot(v === "free" ? undefined : parseInt(v, 10));
                    }}
                    className="w-full border rounded px-2 py-2 text-sm"
                    style={{ borderColor: BRAND.light }}
                  >
                    <option value="free">Free</option>
                    {slotRects.map((_, i) => (
                      <option key={i} value={String(i)}>
                        Slot {i + 1}
                      </option>
                    ))}
                  </select>

                  {typeof selectedImageItem?.slotIndex === "number" && (
                    <button
                      onClick={() => moveSelectedImageToSlot(selectedImageItem.slotIndex)}
                      className="mt-2 w-full px-3 py-2 rounded text-sm"
                      style={{ background: BRAND.light, color: BRAND.dark }}
                      title="Re-fit the selected image to fully cover its slot"
                    >
                      Fill Slot
                    </button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => rotateSelected(-15)}
                  className="px-3 py-2 rounded text-sm"
                  style={{ background: BRAND.light, color: BRAND.dark }}
                >
                  ↺ Rotate
                </button>
                <button
                  onClick={() => rotateSelected(15)}
                  className="px-3 py-2 rounded text-sm"
                  style={{ background: BRAND.light, color: BRAND.dark }}
                >
                  ↻ Rotate
                </button>
                <button
                  onClick={bringToFront}
                  className="px-3 py-2 rounded text-sm"
                  style={{ background: BRAND.light, color: BRAND.dark }}
                >
                  ↑ Front
                </button>
                <button
                  onClick={sendToBack}
                  className="px-3 py-2 rounded text-sm"
                  style={{ background: BRAND.light, color: BRAND.dark }}
                >
                  ↓ Back
                </button>

                {selectedType === "image" && (
                  <button
                    onClick={handleStartCrop}
                    className="col-span-2 px-3 py-2 rounded text-sm font-medium"
                    style={{ background: BRAND.lightest, color: BRAND.accent, border: `1px solid ${BRAND.light}` }}
                  >
                    ✂️ Crop Image
                  </button>
                )}

                <button
                  onClick={deleteSelected}
                  className="col-span-2 px-3 py-2 rounded text-sm font-medium"
                  style={{ background: "#fee2e2", color: "#991b1b" }}
                >
                  🗑 Delete
                </button>
              </div>

              <p className="text-xs mt-3" style={{ color: BRAND.medium }}>
                Tip: Right-click an item for quick delete. Keyboard: Delete/Backspace.
              </p>
            </div>
          )}

          {/* ArtKey QR Code Section */}
          {productSpec.requiresQrCode && (
            <div className="p-4 border-b" style={{ borderColor: BRAND.light }}>
              <h3 className="font-semibold mb-2">ArtKey QR Code</h3>

              <div className="mb-3">
                <label className="text-xs block mb-1" style={{ color: BRAND.medium }}>
                  Place ArtKey on
                </label>
                <select
                  value={qrPlacement}
                  onChange={(e) => handleQrPlacementChange(e.target.value as Placement)}
                  className="w-full border rounded px-2 py-2 text-sm"
                  style={{ borderColor: BRAND.light }}
                >
                  {productSpec.placements.map((p) => (
                    <option key={p} value={p}>
                      {PLACEMENT_LABELS[p]}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-xs" style={{ color: BRAND.medium }}>
                {hasQrOnCurrentSurface ? "Drag the ArtKey to position it." : `Switch to ${PLACEMENT_LABELS[qrPlacement]} to see the ArtKey.`}
              </p>

              <div className="mt-2 text-xs" style={{ color: BRAND.medium }}>
                QR target: ~{TARGET_QR_INCHES} inch at {productSpec.printDpi} DPI
              </div>
            </div>
          )}

          {/* Surfaces */}
          <div className="p-4">
            <h3 className="font-semibold mb-3">Surfaces</h3>
            <div className="space-y-2">
              {productSpec.placements.map((p) => (
                <button
                  key={p}
                  onClick={() => switchPlacement(p)}
                  className="w-full text-left px-4 py-3 rounded border"
                  style={{
                    borderColor: activePlacement === p ? BRAND.accent : BRAND.light,
                    background: activePlacement === p ? BRAND.lightest : BRAND.white,
                    color: BRAND.dark,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {PLACEMENT_LABELS[p]}
                      {qrPlacement === p && productSpec.requiresQrCode && (
                        <span className="ml-2 text-xs px-2 py-0.5 rounded" style={{ background: "#ede9fe", color: "#6d28d9" }}>
                          ArtKey
                        </span>
                      )}
                    </span>
                    <span className="text-xs" style={{ color: BRAND.medium }}>
                      {(designs[p]?.images?.length || 0) + (designs[p]?.texts?.length || 0)} items
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 p-3 rounded" style={{ background: BRAND.lightest, border: `1px solid ${BRAND.light}` }}>
              <h4 className="text-xs font-semibold mb-2" style={{ color: BRAND.dark }}>
                Shortcuts
              </h4>
              <div className="text-xs space-y-1" style={{ color: BRAND.medium }}>
                <div>
                  <kbd className="px-1 rounded" style={{ background: BRAND.light }}>Ctrl/Cmd+Z</kbd> Undo
                </div>
                <div>
                  <kbd className="px-1 rounded" style={{ background: BRAND.light }}>Ctrl/Cmd+Y</kbd> Redo
                </div>
                <div>
                  <kbd className="px-1 rounded" style={{ background: BRAND.light }}>Del</kbd> Delete
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div ref={canvasContainerRef} className="flex-1 overflow-auto p-8 flex items-center justify-center">
          <div className="inline-block rounded-lg shadow-xl overflow-hidden" style={{ background: BRAND.white, border: `1px solid ${BRAND.light}` }}>
            <Stage
              ref={stageRef}
              width={stageWidth}
              height={stageHeight}
              onClick={handleStageClick}
              onTap={handleStageClick}
              onContextMenu={handleStageContextMenu}
            >
              {/* Guides layer (not exported) */}
              <Layer ref={guidesLayerRef} listening={false}>
                <Group scaleX={displayScale} scaleY={displayScale}>
                  {/* Slot guides */}
                  {slotRects.map((s, i) => (
                    <Rect
                      key={`slot-guide-${i}`}
                      x={s.x}
                      y={s.y}
                      width={s.width}
                      height={s.height}
                      stroke={BRAND.accent}
                      strokeWidth={2}
                      dash={[10, 6]}
                      opacity={0.35}
                      listening={false}
                    />
                  ))}
                </Group>
              </Layer>

              {/* Design layer */}
              <Layer>
                <Group ref={designGroupRef} scaleX={displayScale} scaleY={displayScale}>
                  {/* Background (non-interactive; allows click-through to stage for deselect) */}
                  <Rect x={0} y={0} width={canvasWidth} height={canvasHeight} fill={BRAND.white} listening={false} />

                  {/* Images */}
                  {(currentDesign.images || []).map((img) => {
                    const loaded = loadedImages.get(img.id);
                    if (!loaded) return null;

                    // Slot clipping (if assigned)
                    if (typeof img.slotIndex === "number" && slotRects[img.slotIndex]) {
                      const slot = slotRects[img.slotIndex];
                      return (
                        <Group
                          key={img.id}
                          clipX={slot.x}
                          clipY={slot.y}
                          clipWidth={slot.width}
                          clipHeight={slot.height}
                        >
                          <KonvaImage
                            id={img.id}
                            image={loaded}
                            x={img.x}
                            y={img.y}
                            width={img.width}
                            height={img.height}
                            rotation={img.rotation}
                            draggable
                            dragBoundFunc={getImageDragBoundFunc(img)}
                            onClick={() => {
                              setSelectedId(img.id);
                              setSelectedType("image");
                            }}
                            onTap={() => {
                              setSelectedId(img.id);
                              setSelectedType("image");
                            }}
                            onDragEnd={(e) => handleImageDragEnd(img.id, e.target)}
                            onTransformEnd={(e) => handleImageTransformEnd(img.id, e.target)}
                          />
                        </Group>
                      );
                    }

                    // Free image
                    return (
                      <KonvaImage
                        key={img.id}
                        id={img.id}
                        image={loaded}
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
                        onDragEnd={(e) => handleImageDragEnd(img.id, e.target)}
                        onTransformEnd={(e) => handleImageTransformEnd(img.id, e.target)}
                      />
                    );
                  })}

                  {/* Text */}
                  {(currentDesign.texts || []).map((t) => (
                    <KonvaText
                      key={t.id}
                      id={t.id}
                      text={t.text}
                      x={t.x}
                      y={t.y}
                      width={t.width}
                      fontSize={t.fontSize}
                      fontFamily={t.fontFamily}
                      fill={t.fill}
                      fontStyle={t.fontStyle}
                      align={t.align}
                      textDecoration={t.textDecoration}
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
                      onDragEnd={(e) => handleTextDragEnd(t.id, e.target)}
                      onTransformEnd={(e) => handleTextTransformEnd(t.id, e.target)}
                    />
                  ))}

                  {/* ArtKey template with QR */}
                  {hasQrOnCurrentSurface && currentDesign.qrCode && (
                    <>
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
                        />
                      )}

                      {qrImageObj && (
                        <KonvaImage
                          id="qr-code"
                          image={qrImageObj}
                          x={currentDesign.qrCode.x + currentDesign.qrCode.width * QR_IN_TEMPLATE_X_FRACTION}
                          y={currentDesign.qrCode.y + currentDesign.qrCode.height * QR_IN_TEMPLATE_Y_FRACTION}
                          width={currentDesign.qrCode.width * QR_IN_TEMPLATE_FRACTION}
                          height={currentDesign.qrCode.height * QR_IN_TEMPLATE_FRACTION}
                          listening={false}
                        />
                      )}
                    </>
                  )}
                </Group>

                {/* Transformer on top (NOT inside scaled group) to keep handle sizes consistent */}
                <Transformer
                  ref={transformerRef}
                  anchorSize={14}
                  anchorCornerRadius={3}
                  borderStroke={BRAND.accent}
                  borderStrokeWidth={1.5}
                  anchorStroke={BRAND.accent}
                  anchorFill={BRAND.white}
                  rotateEnabled={true}
                  keepRatio={selectedType === "text"} // text behaves nicer with uniform scaling
                  boundBoxFunc={(oldBox, newBox) => {
                    // Prevent extremely tiny objects
                    if (newBox.width < 20 || newBox.height < 20) return oldBox;
                    return newBox;
                  }}
                />
              </Layer>
            </Stage>
          </div>
        </div>

        {/* Right Sidebar - simple preview */}
        <div className="w-56 border-l p-4" style={{ background: BRAND.white, borderColor: BRAND.light }}>
          <h3 className="font-semibold mb-3">Preview</h3>

          <div className="space-y-3">
            {productSpec.placements.map((p) => (
              <button
                key={p}
                onClick={() => switchPlacement(p)}
                className="w-full rounded-lg overflow-hidden border-2"
                style={{
                  borderColor: activePlacement === p ? BRAND.accent : BRAND.light,
                  background: BRAND.lightest,
                }}
              >
                <div className="p-2">
                  <div
                    className="bg-white mx-auto flex items-center justify-center text-xs"
                    style={{
                      width: "100%",
                      aspectRatio: `${canvasWidth} / ${canvasHeight}`,
                      color: BRAND.medium,
                    }}
                  >
                    {qrPlacement === p && productSpec.requiresQrCode ? (
                      <span style={{ color: "#6d28d9" }}>🔑 ArtKey</span>
                    ) : (designs[p]?.images?.length || 0) + (designs[p]?.texts?.length || 0) > 0 ? (
                      <span style={{ color: "#16a34a" }}>
                        {(designs[p]?.images?.length || 0) + (designs[p]?.texts?.length || 0)} items
                      </span>
                    ) : (
                      <span>Empty</span>
                    )}
                  </div>
                </div>
                <div className="py-1 text-xs text-center" style={{ background: BRAND.lightest, color: BRAND.dark }}>
                  {PLACEMENT_LABELS[p]}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Crop modal */}
      {cropImageItem && cropLoadedImage && (
        <CropModal
          loadedImage={cropLoadedImage}
          onCancel={handleCropCancel}
          onCrop={handleCropComplete}
        />
      )}

      {/* Right-click context menu */}
      {contextMenu.visible && selectedId && (
        <div
          className="fixed z-50 rounded-md shadow-lg border"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            background: BRAND.white,
            borderColor: BRAND.light,
            color: BRAND.dark,
            minWidth: 160,
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            className="w-full text-left px-3 py-2 text-sm"
            style={{ background: BRAND.white }}
            onClick={() => deleteSelected()}
          >
            🗑 Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default CustomizationStudio;
