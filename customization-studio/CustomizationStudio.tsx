// customization-studio/CustomizationStudio.tsx
// theAE Customization Studio - Greeting Card Design Editor
// 
// NOTE: Requires Playfair Display font. Add to your layout or _app:
// <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet" />
//
// Features:
// - Image editing: drag/move, resize, rotate, crop
// - Text tool: add/edit text boxes, font, size, bold/italic/underline, alignment, color
// - Background: adjustable colored background layer per surface
// - Decorative elements: Borders, Labels, Accents (SVG assets)
// - Layouts: Single, 2-Up, 3-Up, 4 Grid, Collage
// - Layer ordering: bring to front, send to back
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
// FONT OPTIONS
// ============================================================================
const FONT_OPTIONS = [
  { name: "Playfair Display", family: "'Playfair Display', Georgia, serif" },
  { name: "Georgia", family: "Georgia, serif" },
  { name: "Times New Roman", family: "'Times New Roman', serif" },
  { name: "Arial", family: "Arial, sans-serif" },
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
  gold: "#C9A962",
} as const;

// ============================================================================
// COLOR PRESETS for backgrounds
// ============================================================================
const COLOR_PRESETS = [
  "#ffffff", "#f8f8f8", "#f3f3f3", "#ded8d3", "#918c86", "#475569", "#000000",
  "#fef3c7", "#fde68a", "#fbbf24", "#fecaca", "#fca5a5", "#ef4444",
  "#dbeafe", "#bfdbfe", "#93c5fd", "#3b82f6", "#dcfce7", "#bbf7d0", "#22c55e",
  "#fce7f3", "#fbcfe8", "#f472b6", "#e9d5ff", "#c4b5fd", "#8b5cf6",
];

// ============================================================================
// DECORATIVE ELEMENTS (SVG assets from /assets/labels/)
// ============================================================================
const DECORATIVE_ELEMENTS = {
  borders: [
    { id: "border-01", name: "Classic", src: "/assets/labels/tae_label_1.svg" },
    { id: "border-02", name: "Ornate", src: "/assets/labels/tae_label_2.svg" },
    { id: "border-03", name: "Simple", src: "/assets/labels/tae_label_3.svg" },
    { id: "border-04", name: "Art Deco", src: "/assets/labels/tae_label_4.svg" },
    { id: "border-05", name: "Elegant", src: "/assets/labels/tae_label_5.svg" },
    { id: "border-06", name: "Modern", src: "/assets/labels/tae_label_6.svg" },
    { id: "border-07", name: "Vintage", src: "/assets/labels/tae_label_7.svg" },
    { id: "border-08", name: "Minimal", src: "/assets/labels/tae_label_8.svg" },
    { id: "border-09", name: "Decorative", src: "/assets/labels/tae_label_9.svg" },
    { id: "border-10", name: "Flourish", src: "/assets/labels/tae_label_10.svg" },
    { id: "border-11", name: "Corner", src: "/assets/labels/tae_label_11.svg" },
    { id: "border-12", name: "Double", src: "/assets/labels/tae_label_12.svg" },
  ],
  labels: [
    { id: "label-01", name: "Ticket", src: "/assets/labels/tae_label_1.svg" },
    { id: "label-02", name: "Banner", src: "/assets/labels/tae_label_2.svg" },
    { id: "label-03", name: "Ribbon", src: "/assets/labels/tae_label_3.svg" },
    { id: "label-04", name: "Shield", src: "/assets/labels/tae_label_4.svg" },
    { id: "label-05", name: "Oval", src: "/assets/labels/tae_label_5.svg" },
    { id: "label-06", name: "Rectangle", src: "/assets/labels/tae_label_6.svg" },
    { id: "label-07", name: "Scalloped", src: "/assets/labels/tae_label_7.svg" },
    { id: "label-08", name: "Pointed", src: "/assets/labels/tae_label_8.svg" },
    { id: "label-09", name: "Rounded", src: "/assets/labels/tae_label_9.svg" },
    { id: "label-10", name: "Bracket", src: "/assets/labels/tae_label_10.svg" },
    { id: "label-11", name: "Tag", src: "/assets/labels/tae_label_11.svg" },
    { id: "label-12", name: "Stamp", src: "/assets/labels/tae_label_12.svg" },
    { id: "label-13", name: "Seal", src: "/assets/labels/tae_label_13.svg" },
    { id: "label-14", name: "Emblem", src: "/assets/labels/tae_label_14.svg" },
    { id: "label-15", name: "Badge", src: "/assets/labels/tae_label_15.svg" },
    { id: "label-16", name: "Plaque", src: "/assets/labels/tae_label_16.svg" },
  ],
  accents: [
    { id: "accent-01", name: "Floral", src: "/assets/labels/tae_label_1.svg" },
    { id: "accent-02", name: "Corner", src: "/assets/labels/tae_label_3.svg" },
    { id: "accent-03", name: "Vine", src: "/assets/labels/tae_label_5.svg" },
    { id: "accent-04", name: "Leaf", src: "/assets/labels/tae_label_7.svg" },
    { id: "accent-05", name: "Star", src: "/assets/labels/tae_label_9.svg" },
    { id: "accent-06", name: "Heart", src: "/assets/labels/tae_label_11.svg" },
    { id: "accent-07", name: "Divider", src: "/assets/labels/tae_label_13.svg" },
    { id: "accent-08", name: "Arrow", src: "/assets/labels/tae_label_14.svg" },
    { id: "accent-09", name: "Scroll", src: "/assets/labels/tae_label_15.svg" },
    { id: "accent-10", name: "Ornament", src: "/assets/labels/tae_label_16.svg" },
  ],
};

// ============================================================================
// QR TEMPLATE MATH (compact template — artkey-template-compact.svg)
// - QR is rendered inside the ArtKey template at 55% of template size
// - Positioned centered below the "ArtKey" branding text
// - These fractions are the QR top-left offset within the template
// ============================================================================
const QR_IN_TEMPLATE_FRACTION = 0.55;
const QR_IN_TEMPLATE_X_FRACTION = 0.225;
const QR_IN_TEMPLATE_Y_FRACTION = 0.30;
const TARGET_QR_INCHES = 0.4; // minimum ~0.4in QR for reliable scannability

// ============================================================================
// INLINE SVG ICON COMPONENTS (cross-platform safe, no Unicode/emoji issues)
// ============================================================================
const IconUndo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M3 13a9 9 0 0 1 15.36-6.36L21 9"/></svg>
);
const IconRedo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M21 13a9 9 0 0 0-15.36-6.36L3 9"/></svg>
);
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);
const IconMinus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
);
const IconRotateCCW = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
);
const IconRotateCW = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/></svg>
);
const IconBringForward = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="4" y="4" width="10" height="10" rx="1" opacity="0.4"/><rect x="10" y="10" width="10" height="10" rx="1"/></svg>
);
const IconSendBack = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="10" y="10" width="10" height="10" rx="1" opacity="0.4"/><rect x="4" y="4" width="10" height="10" rx="1"/></svg>
);
const IconCrop = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2v4h12v12h4"/><path d="M18 22v-4H6V6H2"/></svg>
);
const IconAlignLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
);
const IconAlignCenter = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
);
const IconAlignRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
);
const IconExport = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
);
const IconText = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="4" x2="20" y2="4"/><line x1="12" y1="4" x2="12" y2="20"/><line x1="8" y1="20" x2="16" y2="20"/></svg>
);
const IconFit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3m10 0h3a2 2 0 0 0 2-2v-3"/></svg>
);

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
type ArtKeyTemplatePosition = {
  placement: Placement;
  x: number;
  y: number;
  width: number;
  height: number;
};

type Props = {
  productSpec: ProductSpec;
  placeholderQrCodeUrl?: string;
  artKeyTemplateUrl?: string;
  onExport?: (
    files: { placement: Placement; dataUrl: string }[],
    artKeyTemplatePosition?: ArtKeyTemplatePosition
  ) => void;
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

  // Enforce a minimum ArtKey template size so the embedded QR prints at least ~0.4 inch.
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

    // Ensure template is never smaller than what would make the embedded QR ~0.4 inch.
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

  // Selection (images/texts/decoratives)
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<"image" | "text" | "decorative" | null>(null);

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

  // Background settings per placement
  const [backgrounds, setBackgrounds] = useState<Record<Placement, { enabled: boolean; color: string; x: number; y: number; width: number; height: number }>>(() => {
    const initial: any = {};
    for (const p of productSpec.placements) {
      initial[p] = { enabled: false, color: "#f3f3f3", x: 0, y: 0, width: 100, height: 100 };
    }
    return initial;
  });

  // Decorative elements
  const [decoratives, setDecoratives] = useState<Record<Placement, Array<{ id: string; src: string; name: string; x: number; y: number; width: number; height: number; rotation: number; opacity: number }>>>(() => {
    const initial: any = {};
    for (const p of productSpec.placements) {
      initial[p] = [];
    }
    return initial;
  });
  const [loadedDecoratives, setLoadedDecoratives] = useState<Map<string, HTMLImageElement>>(new Map());

  // Sidebar panel collapse states
  const [panelStates, setPanelStates] = useState({
    images: true,
    layouts: true,
    background: true,
    decoratives: false,
    text: true,
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
  const currentBackground = backgrounds[activePlacement] || { enabled: false, color: "#f3f3f3", x: 0, y: 0, width: 100, height: 100 };
  const currentDecoratives = decoratives[activePlacement] || [];
  
  const selectedDecorativeItem = 
    selectedType === "decorative" && selectedId
      ? currentDecoratives.find((d) => d.id === selectedId) || null
      : null;

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
  }, [selectedId, activePlacement, currentDesign.images, currentDesign.texts, currentDecoratives]);

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

    if (selectedType === "decorative") {
      setDecoratives((prev) => ({
        ...prev,
        [activePlacement]: (prev[activePlacement] || []).filter((d) => d.id !== selectedId),
      }));

      setLoadedDecoratives((prev) => {
        const next = new Map(prev);
        next.delete(selectedId);
        return next;
      });
    }

    setSelectedId(null);
    setSelectedType(null);
    setContextMenu((cm) => ({ ...cm, visible: false }));
  }, [activePlacement, selectedId, selectedType]);

  // -------------------------------------------------------------------------
  // BACKGROUND HANDLERS
  // -------------------------------------------------------------------------
  const updateBackground = useCallback((updates: Partial<typeof currentBackground>) => {
    setBackgrounds((prev) => ({
      ...prev,
      [activePlacement]: { ...prev[activePlacement], ...updates },
    }));
  }, [activePlacement]);

  // -------------------------------------------------------------------------
  // DECORATIVE ELEMENT HANDLERS
  // -------------------------------------------------------------------------
  const addDecorativeElement = useCallback((element: { id: string; name: string; src: string }) => {
    const newId = generateId();
    
    // Load the SVG image
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = element.src;
    
    img.onload = () => {
      // Scale to fit nicely on canvas (max 60% of canvas size)
      const maxW = canvasWidth * 0.6;
      const maxH = canvasHeight * 0.6;
      const scale = Math.min(maxW / img.width, maxH / img.height, 1);
      const width = img.width * scale;
      const height = img.height * scale;
      
      const newDecorative = {
        id: newId,
        src: element.src,
        name: element.name,
        x: (canvasWidth - width) / 2,
        y: (canvasHeight - height) / 2,
        width,
        height,
        rotation: 0,
        opacity: 1,
      };

      setLoadedDecoratives((prev) => new Map(prev).set(newId, img));
      setDecoratives((prev) => ({
        ...prev,
        [activePlacement]: [...(prev[activePlacement] || []), newDecorative],
      }));

      setSelectedId(newId);
      setSelectedType("decorative");
    };

    img.onerror = () => console.error("Failed to load decorative:", element.src);
  }, [activePlacement, canvasWidth, canvasHeight]);

  const handleDecorativeDragEnd = useCallback((id: string, node: Konva.Node) => {
    setDecoratives((prev) => ({
      ...prev,
      [activePlacement]: (prev[activePlacement] || []).map((d) =>
        d.id === id ? { ...d, x: node.x(), y: node.y() } : d
      ),
    }));
  }, [activePlacement]);

  const handleDecorativeTransformEnd = useCallback((id: string, node: Konva.Node) => {
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    setDecoratives((prev) => ({
      ...prev,
      [activePlacement]: (prev[activePlacement] || []).map((d) => {
        if (d.id !== id) return d;
        return {
          ...d,
          x: node.x(),
          y: node.y(),
          width: Math.max(20, d.width * scaleX),
          height: Math.max(20, d.height * scaleY),
          rotation: node.rotation(),
        };
      }),
    }));

    node.scaleX(1);
    node.scaleY(1);
  }, [activePlacement]);

  const updateDecorativeOpacity = useCallback((id: string, opacity: number) => {
    setDecoratives((prev) => ({
      ...prev,
      [activePlacement]: (prev[activePlacement] || []).map((d) =>
        d.id === id ? { ...d, opacity } : d
      ),
    }));
  }, [activePlacement]);

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

      if (selectedType === "decorative") {
        setDecoratives((prev) => ({
          ...prev,
          [activePlacement]: (prev[activePlacement] || []).map((d) =>
            d.id === selectedId ? { ...d, rotation: (d.rotation + degrees) % 360 } : d
          ),
        }));
      }
    },
    [activePlacement, selectedId, selectedType]
  );

  const bringToFront = useCallback(() => {
    if (!selectedId || !selectedType) return;
    
    if (selectedType === "decorative") {
      setDecoratives((prev) => {
        const items = prev[activePlacement] || [];
        const index = items.findIndex((it) => it.id === selectedId);
        if (index === -1 || index === items.length - 1) return prev;
        const nextItems = [...items];
        const [item] = nextItems.splice(index, 1);
        nextItems.push(item);
        return { ...prev, [activePlacement]: nextItems };
      });
      return;
    }

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
    
    if (selectedType === "decorative") {
      setDecoratives((prev) => {
        const items = prev[activePlacement] || [];
        const index = items.findIndex((it) => it.id === selectedId);
        if (index <= 0) return prev;
        const nextItems = [...items];
        const [item] = nextItems.splice(index, 1);
        nextItems.unshift(item);
        return { ...prev, [activePlacement]: nextItems };
      });
      return;
    }

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

              const fitted = fitImageToSlot(img.width, img.height, slot.width, slot.height);
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

  const getArtKeyTemplatePosition = useCallback((): ArtKeyTemplatePosition | undefined => {
    if (!productSpec.requiresQrCode) return undefined;
    const qrData = designs[qrPlacement]?.qrCode;
    if (!qrData) return undefined;
    return {
      placement: qrPlacement,
      x: qrData.x,
      y: qrData.y,
      width: qrData.width,
      height: qrData.height,
    };
  }, [designs, productSpec.requiresQrCode, qrPlacement]);

  const handleExport = useCallback(async () => {
    const dataUrl = await exportCurrentPlacement();
    if (!dataUrl) return;

    if (onExport) {
      onExport([{ placement: activePlacement, dataUrl }], getArtKeyTemplatePosition());
      return;
    }

    downloadDataURL(dataUrl, `${productSpec.name}-${activePlacement}.png`);
  }, [activePlacement, exportCurrentPlacement, getArtKeyTemplatePosition, onExport, productSpec.name]);

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
      onExport(outputs, getArtKeyTemplatePosition());
      return;
    }

    outputs.forEach((o) => downloadDataURL(o.dataUrl, `${productSpec.name}-${o.placement}.png`));
  }, [activePlacement, exportCurrentPlacement, getArtKeyTemplatePosition, onExport, productSpec.name, productSpec.placements]);

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
    <div className="w-full min-h-screen flex flex-col" style={{ background: BRAND.lightest, color: BRAND.dark }}>
      {/* Top Bar */}
      <div
        className="p-4 border-b flex items-center justify-between"
        style={{ background: BRAND.white, borderColor: BRAND.light }}
      >
        <div className="flex items-center gap-3">
          <h1 
            className="text-xl font-bold" 
            style={{ 
              color: BRAND.dark,
              fontFamily: "'Playfair Display', Georgia, serif",
              letterSpacing: "0.02em"
            }}
          >
            theAE Customization Studio
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
            className="flex items-center gap-1.5 px-3 py-2 rounded text-sm disabled:opacity-40"
            style={{ background: BRAND.light, color: BRAND.dark }}
            title="Undo (Ctrl+Z)"
          >
            <IconUndo /> Undo
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className="flex items-center gap-1.5 px-3 py-2 rounded text-sm disabled:opacity-40"
            style={{ background: BRAND.light, color: BRAND.dark }}
            title="Redo (Ctrl+Y)"
          >
            <IconRedo /> Redo
          </button>

          {/* Quick add text */}
          <button
            onClick={() => {
              setSelectedId(null);
              setSelectedType(null);
              setTextInput("Your text here");
              setIsAddingText(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded text-sm"
            style={{ background: BRAND.light, color: BRAND.dark }}
            title="Add a text label"
          >
            <IconText /> Add Text
          </button>

          {/* Zoom */}
          <div className="mx-2 h-6 w-px" style={{ background: BRAND.light }} />
          <button
            onClick={handleZoomOut}
            className="flex items-center justify-center w-8 h-8 rounded"
            style={{ background: BRAND.light, color: BRAND.dark }}
            title="Zoom out"
          >
            <IconMinus />
          </button>
          <button
            onClick={handleZoomReset}
            className="px-2 py-2 rounded text-sm font-mono min-w-[3.5rem] text-center"
            style={{ background: BRAND.light, color: BRAND.dark }}
            title="Reset zoom"
          >
            {Math.round(zoomLevel * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            className="flex items-center justify-center w-8 h-8 rounded"
            style={{ background: BRAND.light, color: BRAND.dark }}
            title="Zoom in"
          >
            <IconPlus />
          </button>
          <button
            onClick={handleZoomFit}
            className="flex items-center gap-1.5 px-3 py-2 rounded text-sm"
            style={{ background: BRAND.light, color: BRAND.dark }}
            title="Fit canvas to view"
          >
            <IconFit /> Fit
          </button>

          {/* Export */}
          <div className="mx-2 h-6 w-px" style={{ background: BRAND.light }} />
          {productSpec.placements.length > 1 ? (
            <>
              <button
                onClick={handleExportAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium"
                style={{ background: BRAND.accent, color: BRAND.white }}
                title={onExport ? 'Save all surfaces and continue' : 'Download all surfaces as PNG'}
              >
                <IconExport /> {onExport ? 'Save & Continue' : 'Download All'}
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium"
                style={{ background: BRAND.gold, color: BRAND.dark }}
                title={onExport ? 'Save current surface and continue' : 'Download current surface as PNG'}
              >
                <IconExport /> {onExport ? 'Save Current' : 'Download'}
              </button>
            </>
          ) : (
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium"
              style={{ background: BRAND.accent, color: BRAND.white }}
              title={onExport ? 'Save design and continue' : 'Download design as PNG'}
            >
              <IconExport /> {onExport ? 'Save & Continue' : 'Download PNG'}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 border-r flex flex-col" style={{ background: BRAND.white, borderColor: BRAND.light }}>
          <div className="flex-1 overflow-auto">
          {/* Surface Tabs - at the top so users can find them */}
          {productSpec.placements.length > 1 && (
            <div className="p-4 border-b" style={{ borderColor: BRAND.light }}>
              <h3 className="font-semibold mb-3">Surfaces</h3>
              <div className="grid grid-cols-2 gap-2">
                {productSpec.placements.map((p) => (
                  <button
                    key={p}
                    onClick={() => switchPlacement(p)}
                    className="text-center px-3 py-2 rounded border text-sm font-medium"
                    style={{
                      borderColor: activePlacement === p ? BRAND.accent : BRAND.light,
                      background: activePlacement === p ? BRAND.accent : BRAND.white,
                      color: activePlacement === p ? BRAND.white : BRAND.dark,
                    }}
                  >
                    {PLACEMENT_LABELS[p]}
                    {qrPlacement === p && productSpec.requiresQrCode && (
                      <span className="block text-xs mt-0.5" style={{ color: activePlacement === p ? "#ddd" : "#6d28d9" }}>
                        ArtKey
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

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

          {/* Background */}
          <div className="p-4 border-b" style={{ borderColor: BRAND.light }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Background</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentBackground.enabled}
                  onChange={(e) => updateBackground({ enabled: e.target.checked })}
                  className="rounded"
                />
                <span className="text-xs" style={{ color: BRAND.medium }}>Enable</span>
              </label>
            </div>
            
            {currentBackground.enabled && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs block mb-2" style={{ color: BRAND.medium }}>Color</label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="color"
                      value={currentBackground.color}
                      onChange={(e) => updateBackground({ color: e.target.value })}
                      className="w-10 h-8 rounded border cursor-pointer"
                      style={{ borderColor: BRAND.light }}
                    />
                    <span className="text-xs font-mono" style={{ color: BRAND.medium }}>
                      {currentBackground.color.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {COLOR_PRESETS.map((color) => (
                      <button
                        key={color}
                        onClick={() => updateBackground({ color })}
                        className="w-6 h-6 rounded border-2 transition-transform hover:scale-110"
                        style={{
                          background: color,
                          borderColor: currentBackground.color === color ? BRAND.dark : BRAND.light,
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs block mb-1" style={{ color: BRAND.medium }}>Width %</label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={currentBackground.width}
                      onChange={(e) => updateBackground({ width: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <span className="text-xs" style={{ color: BRAND.medium }}>{currentBackground.width}%</span>
                  </div>
                  <div>
                    <label className="text-xs block mb-1" style={{ color: BRAND.medium }}>Height %</label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={currentBackground.height}
                      onChange={(e) => updateBackground({ height: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <span className="text-xs" style={{ color: BRAND.medium }}>{currentBackground.height}%</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs block mb-1" style={{ color: BRAND.medium }}>X Position %</label>
                    <input
                      type="range"
                      min="0"
                      max={100 - currentBackground.width}
                      value={currentBackground.x}
                      onChange={(e) => updateBackground({ x: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs block mb-1" style={{ color: BRAND.medium }}>Y Position %</label>
                    <input
                      type="range"
                      min="0"
                      max={100 - currentBackground.height}
                      value={currentBackground.y}
                      onChange={(e) => updateBackground({ y: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => updateBackground({ x: 0, y: 0, width: 100, height: 100 })}
                    className="flex-1 px-2 py-1 rounded text-xs"
                    style={{ background: BRAND.light, color: BRAND.dark }}
                  >
                    Full Card
                  </button>
                  <button
                    onClick={() => updateBackground({ x: 0, y: 0, width: 100, height: 50 })}
                    className="flex-1 px-2 py-1 rounded text-xs"
                    style={{ background: BRAND.light, color: BRAND.dark }}
                  >
                    Top Half
                  </button>
                  <button
                    onClick={() => updateBackground({ x: 0, y: 50, width: 100, height: 50 })}
                    className="flex-1 px-2 py-1 rounded text-xs"
                    style={{ background: BRAND.light, color: BRAND.dark }}
                  >
                    Bottom Half
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Decorative Elements */}
          <div className="p-4 border-b" style={{ borderColor: BRAND.light }}>
            <button
              onClick={() => setPanelStates(p => ({ ...p, decoratives: !p.decoratives }))}
              className="w-full flex items-center justify-between mb-2"
            >
              <h3 className="font-semibold">Decorative Elements</h3>
              <span style={{ color: BRAND.medium, transform: panelStates.decoratives ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
            </button>
            
            {panelStates.decoratives && (
              <div className="space-y-4">
                {/* Borders */}
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: BRAND.medium }}>Borders</p>
                  <div className="grid grid-cols-4 gap-1">
                    {DECORATIVE_ELEMENTS.borders.map((el) => (
                      <button
                        key={el.id}
                        onClick={() => addDecorativeElement(el)}
                        className="aspect-square rounded border p-1 hover:border-gray-400 transition-colors"
                        style={{ borderColor: BRAND.light, background: BRAND.lightest }}
                        title={el.name}
                      >
                        <img 
                          src={el.src} 
                          alt={el.name} 
                          className="w-full h-full object-contain opacity-60"
                          style={{ filter: 'brightness(0)' }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Labels */}
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: BRAND.medium }}>Labels</p>
                  <div className="grid grid-cols-4 gap-1">
                    {DECORATIVE_ELEMENTS.labels.map((el) => (
                      <button
                        key={el.id}
                        onClick={() => addDecorativeElement(el)}
                        className="aspect-square rounded border p-1 hover:border-gray-400 transition-colors"
                        style={{ borderColor: BRAND.light, background: BRAND.lightest }}
                        title={el.name}
                      >
                        <img 
                          src={el.src} 
                          alt={el.name} 
                          className="w-full h-full object-contain opacity-60"
                          style={{ filter: 'brightness(0)' }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accents */}
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: BRAND.medium }}>Accents</p>
                  <div className="grid grid-cols-5 gap-1">
                    {DECORATIVE_ELEMENTS.accents.map((el) => (
                      <button
                        key={el.id}
                        onClick={() => addDecorativeElement(el)}
                        className="aspect-square rounded border p-1 hover:border-gray-400 transition-colors"
                        style={{ borderColor: BRAND.light, background: BRAND.lightest }}
                        title={el.name}
                      >
                        <img 
                          src={el.src} 
                          alt={el.name} 
                          className="w-full h-full object-contain opacity-60"
                          style={{ filter: 'brightness(0)' }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-xs" style={{ color: BRAND.medium }}>
                  Click to add. Drag to position, resize with handles.
                </p>
              </div>
            )}
          </div>

          {/* Text Tool */}
          <div className="p-4 border-b" style={{ borderColor: BRAND.light }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Text</h3>
              <button
                onClick={() => {
                  if (!isAddingText) {
                    setSelectedId(null);
                    setSelectedType(null);
                    setTextInput("Your text here");
                    setIsAddingText(true);
                  } else {
                    setIsAddingText(false);
                  }
                }}
                className="px-3 py-1 rounded text-sm"
                style={{ background: isAddingText ? BRAND.accent : BRAND.light, color: isAddingText ? BRAND.white : BRAND.dark }}
              >
                {isAddingText ? "Cancel" : "Add"}
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
                      className="flex items-center justify-center w-8 h-7 rounded text-sm border font-bold"
                      style={{
                        borderColor: textBold ? BRAND.accent : BRAND.light,
                        background: textBold ? BRAND.accent : BRAND.white,
                        color: textBold ? BRAND.white : BRAND.dark,
                      }}
                      title="Bold"
                    >
                      B
                    </button>
                    <button
                      onClick={() => setTextItalic((v) => !v)}
                      className="flex items-center justify-center w-8 h-7 rounded text-sm border italic"
                      style={{
                        borderColor: textItalic ? BRAND.accent : BRAND.light,
                        background: textItalic ? BRAND.accent : BRAND.white,
                        color: textItalic ? BRAND.white : BRAND.dark,
                      }}
                      title="Italic"
                    >
                      I
                    </button>
                    <button
                      onClick={() => setTextUnderline((v) => !v)}
                      className="flex items-center justify-center w-8 h-7 rounded text-sm border underline"
                      style={{
                        borderColor: textUnderline ? BRAND.accent : BRAND.light,
                        background: textUnderline ? BRAND.accent : BRAND.white,
                        color: textUnderline ? BRAND.white : BRAND.dark,
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
                    <button
                      onClick={() => setTextAlign("left")}
                      className="flex items-center justify-center w-8 h-7 rounded border"
                      style={{
                        borderColor: BRAND.light,
                        background: textAlign === "left" ? BRAND.lightest : BRAND.white,
                        color: BRAND.dark,
                      }}
                      title="Align left"
                    >
                      <IconAlignLeft />
                    </button>
                    <button
                      onClick={() => setTextAlign("center")}
                      className="flex items-center justify-center w-8 h-7 rounded border"
                      style={{
                        borderColor: BRAND.light,
                        background: textAlign === "center" ? BRAND.lightest : BRAND.white,
                        color: BRAND.dark,
                      }}
                      title="Align center"
                    >
                      <IconAlignCenter />
                    </button>
                    <button
                      onClick={() => setTextAlign("right")}
                      className="flex items-center justify-center w-8 h-7 rounded border"
                      style={{
                        borderColor: BRAND.light,
                        background: textAlign === "right" ? BRAND.lightest : BRAND.white,
                        color: BRAND.dark,
                      }}
                      title="Align right"
                    >
                      <IconAlignRight />
                    </button>
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

              {/* Decorative Opacity Control */}
              {selectedType === "decorative" && selectedDecorativeItem && (
                <div className="mb-3">
                  <label className="text-xs block mb-1" style={{ color: BRAND.medium }}>
                    Opacity
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round(selectedDecorativeItem.opacity * 100)}
                      onChange={(e) => updateDecorativeOpacity(selectedDecorativeItem.id, parseInt(e.target.value) / 100)}
                      className="flex-1"
                    />
                    <span className="text-xs w-8" style={{ color: BRAND.medium }}>
                      {Math.round(selectedDecorativeItem.opacity * 100)}%
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => rotateSelected(-15)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded text-sm"
                  style={{ background: BRAND.light, color: BRAND.dark }}
                  title="Rotate left 15 degrees"
                >
                  <IconRotateCCW /> Rotate L
                </button>
                <button
                  onClick={() => rotateSelected(15)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded text-sm"
                  style={{ background: BRAND.light, color: BRAND.dark }}
                  title="Rotate right 15 degrees"
                >
                  <IconRotateCW /> Rotate R
                </button>
                <button
                  onClick={bringToFront}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded text-sm"
                  style={{ background: BRAND.light, color: BRAND.dark }}
                  title="Bring to front"
                >
                  <IconBringForward /> To Front
                </button>
                <button
                  onClick={sendToBack}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded text-sm"
                  style={{ background: BRAND.light, color: BRAND.dark }}
                  title="Send to back"
                >
                  <IconSendBack /> To Back
                </button>

                {selectedType === "image" && (
                  <button
                    onClick={handleStartCrop}
                    className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded text-sm font-medium"
                    style={{ background: BRAND.lightest, color: BRAND.accent, border: `1px solid ${BRAND.light}` }}
                    title="Crop this image"
                  >
                    <IconCrop /> Crop Image
                  </button>
                )}

                <button
                  onClick={deleteSelected}
                  className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded text-sm font-medium"
                  style={{ background: "#fee2e2", color: "#991b1b" }}
                  title="Delete selected item"
                >
                  <IconTrash /> Delete
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
        <div ref={canvasContainerRef} className="flex-1 min-h-0 w-full overflow-auto p-8 flex items-center justify-center">
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

                  {/* User Background Color Layer */}
                  {currentBackground.enabled && (
                    <Rect
                      x={(currentBackground.x / 100) * canvasWidth}
                      y={(currentBackground.y / 100) * canvasHeight}
                      width={(currentBackground.width / 100) * canvasWidth}
                      height={(currentBackground.height / 100) * canvasHeight}
                      fill={currentBackground.color}
                      listening={false}
                    />
                  )}

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

                  {/* Decorative Elements */}
                  {currentDecoratives.map((dec) => {
                    const loaded = loadedDecoratives.get(dec.id);
                    if (!loaded) return null;

                    return (
                      <KonvaImage
                        key={dec.id}
                        id={dec.id}
                        image={loaded}
                        x={dec.x}
                        y={dec.y}
                        width={dec.width}
                        height={dec.height}
                        rotation={dec.rotation}
                        opacity={dec.opacity}
                        draggable
                        onClick={() => {
                          setSelectedId(dec.id);
                          setSelectedType("decorative");
                        }}
                        onTap={() => {
                          setSelectedId(dec.id);
                          setSelectedType("decorative");
                        }}
                        onDragEnd={(e) => handleDecorativeDragEnd(dec.id, e.target)}
                        onTransformEnd={(e) => handleDecorativeTransformEnd(dec.id, e.target)}
                      />
                    );
                  })}

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
                  rotateAnchorOffset={30}
                  rotateAnchorCursor="grab"
                  keepRatio={selectedType === "text"}
                  anchorStyleFunc={(anchor) => {
                    if (anchor.hasName("rotater")) {
                      anchor.cornerRadius(20);
                      anchor.fill(BRAND.accent);
                      anchor.stroke(BRAND.white);
                      anchor.strokeWidth(2);
                      anchor.width(20);
                      anchor.height(20);
                      anchor.offsetX(10);
                      anchor.offsetY(10);
                    }
                  }}
                  boundBoxFunc={(oldBox, newBox) => {
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
                      <span className="flex items-center gap-1" style={{ color: "#6d28d9" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        ArtKey
                      </span>
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
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default CustomizationStudio;
