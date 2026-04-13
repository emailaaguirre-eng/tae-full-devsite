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
// - Layouts: Single (default), Side by Side, 2x2 Grid
// - Layer ordering: bring to front, send to back
// - Delete: Delete/Backspace, toolbar button, right-click context menu
// - Canvas behavior: print-space pixel coords stay constant (no stage scaling)
// - ArtKey + QR: template + embedded QR renders at consistent print size via DPI mapping

"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Circle, Group, Image as KonvaImage, Layer, Rect, Stage, Text as KonvaText, Transformer, Line } from "react-konva";
import Konva from "konva";

import type {
  DesignState,
  ImageItem,
  Placement,
  ProductSpec,
  TextAlign,
  TextLabelShape,
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
  downloadDataURL,
} from "./utils";
import {
  ARTKEY_TEMPLATES,
  DEFAULT_ARTKEY_TEMPLATE,
  getArtKeyTemplateById,
  type ArtKeyTemplateDefinition,
} from "@/lib/artkeyTemplates";
import { AdvancedColorPickerPopover } from "@/components/artkey/AdvancedColorPickerPopover";

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

function parseCssAlpha(color: string | undefined): number {
  if (!color) return 1;
  const raw = String(color).trim();
  const rgbaMatch = raw.match(
    /^rgba?\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})(?:\s*,\s*(0|0?\.\d+|1(?:\.0+)?)\s*)?\)$/i
  );
  if (!rgbaMatch) return 1;
  return Math.max(0, Math.min(1, rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1));
}

function nearlyEqual(a: number, b: number, epsilon = 0.01): boolean {
  return Math.abs(a - b) <= epsilon;
}

// ============================================================================
// DECORATIVE ELEMENTS (SVG assets from /assets/labels/)
// ============================================================================
type DecorativeKind = "border" | "label" | "accent";

type DecorativeElementOption = {
  id: string;
  name: string;
  src: string;
  kind: DecorativeKind;
};

type DecorativeItem = {
  id: string;
  src: string;
  name: string;
  kind: DecorativeKind;
  linkedTextId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
};


type UploadedImageAsset = {
  id: string;
  name: string;
  src: string;
  width: number;
  height: number;
};

const DECORATIVE_ELEMENTS: {
  borders: DecorativeElementOption[];
  labels: DecorativeElementOption[];
  accents: DecorativeElementOption[];
} = {
  borders: [
    { id: "border-01", name: "Classic", src: "/assets/borders/tae_border_1.svg", kind: "border" },
    { id: "border-02", name: "Ornate", src: "/assets/borders/tae_border_2.svg", kind: "border" },
    { id: "border-03", name: "Simple", src: "/assets/borders/tae_border_3.svg", kind: "border" },
    { id: "border-04", name: "Art Deco", src: "/assets/borders/tae_border_4.svg", kind: "border" },
    { id: "border-05", name: "Elegant", src: "/assets/borders/tae_border_5.svg", kind: "border" },
    { id: "border-06", name: "Modern", src: "/assets/borders/tae_border_6.svg", kind: "border" },
    { id: "border-07", name: "Vintage", src: "/assets/borders/tae_border_7.svg", kind: "border" },
    { id: "border-08", name: "Minimal", src: "/assets/borders/tae_border_8.svg", kind: "border" },
    { id: "border-09", name: "Decorative", src: "/assets/borders/tae_border_9.svg", kind: "border" },
    { id: "border-10", name: "Flourish", src: "/assets/borders/tae_border_10.svg", kind: "border" },
    { id: "border-11", name: "Corner", src: "/assets/borders/tae_border_11.svg", kind: "border" },
    { id: "border-12", name: "Double", src: "/assets/borders/tae_border_12.svg", kind: "border" },
  ],
  labels: [
    { id: "label-01", name: "Ticket", src: "/assets/labels/tae_label_1.svg", kind: "label" },
    { id: "label-02", name: "Banner", src: "/assets/labels/tae_label_2.svg", kind: "label" },
    { id: "label-03", name: "Ribbon", src: "/assets/labels/tae_label_3.svg", kind: "label" },
    { id: "label-04", name: "Shield", src: "/assets/labels/tae_label_4.svg", kind: "label" },
    { id: "label-05", name: "Oval", src: "/assets/labels/tae_label_5.svg", kind: "label" },
    { id: "label-06", name: "Rectangle", src: "/assets/labels/tae_label_6.svg", kind: "label" },
    { id: "label-07", name: "Scalloped", src: "/assets/labels/tae_label_7.svg", kind: "label" },
    { id: "label-08", name: "Pointed", src: "/assets/labels/tae_label_8.svg", kind: "label" },
    { id: "label-09", name: "Rounded", src: "/assets/labels/tae_label_9.svg", kind: "label" },
    { id: "label-10", name: "Bracket", src: "/assets/labels/tae_label_10.svg", kind: "label" },
    { id: "label-11", name: "Tag", src: "/assets/labels/tae_label_11.svg", kind: "label" },
    { id: "label-12", name: "Stamp", src: "/assets/labels/tae_label_12.svg", kind: "label" },
    { id: "label-13", name: "Seal", src: "/assets/labels/tae_label_13.svg", kind: "label" },
    { id: "label-14", name: "Emblem", src: "/assets/labels/tae_label_14.svg", kind: "label" },
    { id: "label-15", name: "Badge", src: "/assets/labels/tae_label_15.svg", kind: "label" },
    { id: "label-16", name: "Plaque", src: "/assets/labels/tae_label_16.svg", kind: "label" },
  ],
  accents: [],
};


function getDecorativeKind(item: { id?: string; src?: string; kind?: DecorativeKind }): DecorativeKind {
  if (item.kind) return item.kind;
  if (item.id?.startsWith("border-") || item.src?.includes("/borders/")) return "border";
  if (item.id?.startsWith("accent-") || item.src?.includes("/accents/")) return "accent";
  return "label";
}

// ============================================================================
// ArtKey template behavior
// - Template-specific QR placement fractions are sourced from lib/artkeyTemplates.ts
// - Template box keeps its visual size while template aspect ratio is normalized
// ============================================================================
const TARGET_QR_INCHES = 0.5; // enforce minimum 0.5in printed QR for scannability
const MIN_TEMPLATE_CANVAS_FRACTION = 0.22;
const MAX_TEMPLATE_CANVAS_FRACTION = 0.75;
const DEFAULT_LAYOUT_ID = "single";
const ROTATION_SNAP_STEP = 15;
const ROTATION_SNAP_TOLERANCE = 4;
const ROTATION_STRONG_SNAP_TOLERANCE = 8;

function normalizeDegrees(value: number): number {
  const normalized = value % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function snapRotationDegrees(raw: number): number {
  const normalized = normalizeDegrees(raw);
  const nearestStep = Math.round(normalized / ROTATION_SNAP_STEP) * ROTATION_SNAP_STEP;
  const nearestNormalized = normalizeDegrees(nearestStep);
  const isCardinal = nearestNormalized % 90 === 0;
  const diff = Math.min(
    Math.abs(normalized - nearestNormalized),
    360 - Math.abs(normalized - nearestNormalized)
  );
  const tolerance = isCardinal ? ROTATION_STRONG_SNAP_TOLERANCE : ROTATION_SNAP_TOLERANCE;
  return diff <= tolerance ? nearestNormalized : normalized;
}

function getRotationSnapInfo(raw: number): {
  snapped: boolean;
  strong: boolean;
  target: number;
} {
  const normalized = normalizeDegrees(raw);
  const nearestStep = Math.round(normalized / ROTATION_SNAP_STEP) * ROTATION_SNAP_STEP;
  const target = normalizeDegrees(nearestStep);
  const strong = target % 90 === 0;
  const diff = Math.min(
    Math.abs(normalized - target),
    360 - Math.abs(normalized - target)
  );
  const tolerance = strong ? ROTATION_STRONG_SNAP_TOLERANCE : ROTATION_SNAP_TOLERANCE;
  return { snapped: diff <= tolerance, strong, target };
}

function getLabelBoxHeight(item: TextItem): number {
  if (typeof item.labelBoxHeight === "number") return Math.max(40, item.labelBoxHeight);
  return Math.max(56, Math.round(item.fontSize * 2.1));
}

// ============================================================================
// PER-PLACEMENT CANVAS DIMENSIONS
// Uses surfacePlacementMap (from SurfaceMap) to resolve the Printful placement,
// then looks up the dimensions. Split width only when exportRules composite
// merges multiple UX surfaces into one Printful file.
// ============================================================================

function resolvePrintfulPlacement(spec: ProductSpec, uxSurfaceId: string): string {
  if (spec.surfacePlacementMap?.[uxSurfaceId]) {
    return spec.surfacePlacementMap[uxSurfaceId];
  }
  // Legacy fallback (568-style cards use inside1/inside2, not "inside")
  if (uxSurfaceId === "inside1" || uxSurfaceId === "inside2") return uxSurfaceId;
  if (uxSurfaceId === "inside_left") return "inside1";
  if (uxSurfaceId === "inside_right") return "inside2";
  return uxSurfaceId;
}

function isSplitSurface(spec: ProductSpec, uxSurfaceId: string): boolean {
  if (!spec.exportRules) {
    return uxSurfaceId === "inside1" || uxSurfaceId === "inside2" ||
           uxSurfaceId === "inside_left" || uxSurfaceId === "inside_right";
  }
  const pfPlacement = resolvePrintfulPlacement(spec, uxSurfaceId);
  const rule = spec.exportRules.find((r) => r.printfulPlacement === pfPlacement);
  return !!rule?.composite && rule.uxSurfaceIds.length > 1;
}

function getSplitCount(spec: ProductSpec, uxSurfaceId: string): number {
  if (!spec.exportRules) return 2;
  const pfPlacement = resolvePrintfulPlacement(spec, uxSurfaceId);
  const rule = spec.exportRules.find((r) => r.printfulPlacement === pfPlacement);
  return rule?.uxSurfaceIds.length || 2;
}

function getPlacementCanvasSize(
  spec: ProductSpec,
  placement: Placement
): { width: number; height: number } {
  if (!spec.placementDimensions) {
    return { width: spec.printWidth, height: spec.printHeight };
  }

  const pfPlacement = resolvePrintfulPlacement(spec, placement);
  const dims = spec.placementDimensions[pfPlacement];
  if (!dims) {
    return { width: spec.printWidth, height: spec.printHeight };
  }

  if (isSplitSurface(spec, placement)) {
    const count = getSplitCount(spec, placement);
    return { width: Math.round(dims.width / count), height: dims.height };
  }

  return { width: dims.width, height: dims.height };
}

/**
 * Returns the full Printful print area dimensions for a given placement.
 */
function getFullPlacementSize(
  spec: ProductSpec,
  printfulPlacement: string
): { width: number; height: number } | null {
  if (!spec.placementDimensions?.[printfulPlacement]) return null;
  const dims = spec.placementDimensions[printfulPlacement];
  return { width: dims.width, height: dims.height };
}

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

function LayoutPreview({ slots }: { slots: { x: number; y: number; width: number; height: number }[] }) {
  return (
    <div className="w-full aspect-[4/3] rounded border bg-white p-1.5" style={{ borderColor: "#d8d8d6" }}>
      <div className="relative w-full h-full rounded-sm bg-[#f8fafc] overflow-hidden">
        {slots.map((slot, idx) => (
          <div
            key={`slot-preview-${idx}`}
            className="absolute rounded-[3px] border"
            style={{
              left: `${slot.x * 100}%`,
              top: `${slot.y * 100}%`,
              width: `${slot.width * 100}%`,
              height: `${slot.height * 100}%`,
              borderColor: "#94a3b8",
              background: "rgba(148,163,184,0.14)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// ZOOM LEVELS (multiplier on top of "fit" scale)
// ============================================================================
const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3];
// Default slightly zoomed-out so the canvas doesn't crowd the UI.
const DEFAULT_ZOOM_INDEX = 3; // 1.0 (fit-first)
// "Fit" should mean "100% of fit scale".
const FIT_ZOOM_INDEX = 3; // 1.0

// ============================================================================
// COMPONENT PROPS
// ============================================================================
const LAYOUT_OUTER_PADDING_RATIO = 0.02;
const LAYOUT_SLOT_INSET_RATIO = 0.008;
const LAYOUT_OUTER_PADDING_MIN = 8;
const LAYOUT_OUTER_PADDING_MAX = 48;
const LAYOUT_SLOT_INSET_MIN = 2;
const LAYOUT_SLOT_INSET_MAX = 24;
const SLOT_SNAP_DISTANCE = 36;

type ArtKeyTemplatePosition = {
  placement: Placement;
  x: number;
  y: number;
  width: number;
  height: number;
  templateId: string;
};

type Props = {
  productSpec: ProductSpec;
  placeholderQrCodeUrl?: string;
  artKeyTemplates?: ArtKeyTemplateDefinition[];
  initialDesigns?: DesignState;
  onExport?: (
    files: { placement: string; dataUrl: string }[],
    artKeyTemplatePosition?: ArtKeyTemplatePosition
  ) => void;
  onSave?: (designs: DesignState) => void;
  onPreviewPrintProof?: (files: { placement: string; dataUrl: string }[]) => void | Promise<void>;
  /** When set, proof preview is disabled (internal / dev diagnostics). */
  proofBlockedReason?: string | null;
  /** Shown to customers in tooltips and errors instead of internal proofBlockedReason. */
  proofBlockedUserHint?: string | null;
};

function buildSlotRects(
  layout: { slots: { x: number; y: number; width: number; height: number }[] },
  canvasWidth: number,
  canvasHeight: number
) {
  const base = Math.min(canvasWidth, canvasHeight);
  const outerPad = clamp(
    Math.round(base * LAYOUT_OUTER_PADDING_RATIO),
    LAYOUT_OUTER_PADDING_MIN,
    LAYOUT_OUTER_PADDING_MAX
  );
  const inset = clamp(
    Math.round(base * LAYOUT_SLOT_INSET_RATIO),
    LAYOUT_SLOT_INSET_MIN,
    LAYOUT_SLOT_INSET_MAX
  );

  const availableWidth = Math.max(1, canvasWidth - outerPad * 2);
  const availableHeight = Math.max(1, canvasHeight - outerPad * 2);

  return (layout.slots || [{ x: 0, y: 0, width: 1, height: 1 }]).map((s) => {
    const x = outerPad + s.x * availableWidth;
    const y = outerPad + s.y * availableHeight;
    const width = s.width * availableWidth;
    const height = s.height * availableHeight;
    return {
      x: x + inset,
      y: y + inset,
      width: Math.max(1, width - inset * 2),
      height: Math.max(1, height - inset * 2),
    };
  });
}

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
  artKeyTemplates = ARTKEY_TEMPLATES,
  initialDesigns,
  onExport,
  onSave,
  onPreviewPrintProof,
  proofBlockedReason = null,
  proofBlockedUserHint = null,
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
  const availableArtKeyTemplates = useMemo(
    () => (artKeyTemplates.length > 0 ? artKeyTemplates : [DEFAULT_ARTKEY_TEMPLATE]),
    [artKeyTemplates]
  );
  const [selectedArtKeyTemplateId, setSelectedArtKeyTemplateId] = useState<string>(
    availableArtKeyTemplates[0]?.id || DEFAULT_ARTKEY_TEMPLATE.id
  );
  useEffect(() => {
    if (!availableArtKeyTemplates.some((template) => template.id === selectedArtKeyTemplateId)) {
      setSelectedArtKeyTemplateId(availableArtKeyTemplates[0]?.id || DEFAULT_ARTKEY_TEMPLATE.id);
    }
  }, [availableArtKeyTemplates, selectedArtKeyTemplateId]);
  const selectedArtKeyTemplate = useMemo(
    () =>
      availableArtKeyTemplates.find((template) => template.id === selectedArtKeyTemplateId) ||
      getArtKeyTemplateById(selectedArtKeyTemplateId),
    [availableArtKeyTemplates, selectedArtKeyTemplateId]
  );
  const qrSizeFraction = selectedArtKeyTemplate.qr.sizeFraction;
  const qrXFraction = selectedArtKeyTemplate.qr.xFraction;
  const qrYFraction = selectedArtKeyTemplate.qr.yFraction;
  const templateAspectRatio = selectedArtKeyTemplate.displayAspectRatio || 1;
  const templateMinCanvasFraction =
    selectedArtKeyTemplate.minCanvasFraction ?? MIN_TEMPLATE_CANVAS_FRACTION;
  const templateMaxCanvasFraction =
    selectedArtKeyTemplate.maxCanvasFraction ?? MAX_TEMPLATE_CANVAS_FRACTION;

  // Normalize default template geometry so each template renders with the
  // correct aspect ratio and keeps a usable visual size.
  const normalizedQrDefault = useMemo(() => {
    if (!productSpec.qrDefaultPosition) return undefined;

    const dpi = productSpec.printDpi || 300;
    const expectedQrPx = dpi * TARGET_QR_INCHES;

    let width = productSpec.qrDefaultPosition.width;
    let height = productSpec.qrDefaultPosition.height;
    const minTemplateFromQr = Math.round(expectedQrPx / Math.max(0.01, qrSizeFraction));
    const minTemplateFromCanvas = Math.round(
      Math.min(productSpec.printWidth, productSpec.printHeight * templateAspectRatio) *
        templateMinCanvasFraction
    );
    const minTemplate = Math.max(minTemplateFromQr, minTemplateFromCanvas);
    const maxTemplate = Math.round(
      Math.min(productSpec.printWidth, productSpec.printHeight * templateAspectRatio) *
        templateMaxCanvasFraction
    );

    // Heuristic: if caller accidentally passed QR size instead of template size, upscale it.
    if (Math.max(width, height) <= expectedQrPx * 1.5) {
      width = Math.round(width / qrSizeFraction);
      height = Math.round(width / templateAspectRatio);
    }

    // Keep template visible (not tiny), but bounded.
    width = clamp(width, Math.max(1, minTemplate), Math.max(1, maxTemplate));
    height = Math.max(1, Math.round(width / templateAspectRatio));
    if (height > productSpec.printHeight) {
      height = productSpec.printHeight;
      width = Math.max(1, Math.round(height * templateAspectRatio));
    }

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
  }, [productSpec, qrSizeFraction, templateAspectRatio, templateMinCanvasFraction, templateMaxCanvasFraction]);

  const [designs, setDesigns] = useState<DesignState>(() => {
    const initial: any = {};
    for (const p of productSpec.placements) {
      initial[p] = { images: [], texts: [], layoutId: DEFAULT_LAYOUT_ID };
    }
    if (productSpec.requiresQrCode && normalizedQrDefault) {
      initial[normalizedQrDefault.placement] = {
        ...(initial[normalizedQrDefault.placement] || { images: [], texts: [] }),
        layoutId: DEFAULT_LAYOUT_ID,
        qrCode: {
          x: normalizedQrDefault.left,
          y: normalizedQrDefault.top,
          width: normalizedQrDefault.width,
          height: normalizedQrDefault.height,
        },
      };
    }
    if (initialDesigns) {
      const restored: any = {};
      for (const p of productSpec.placements) {
        const src = initialDesigns[p];
        restored[p] = {
          images: src?.images ? JSON.parse(JSON.stringify(src.images)) : [],
          texts: src?.texts ? JSON.parse(JSON.stringify(src.texts)) : [],
          layoutId: src?.layoutId || DEFAULT_LAYOUT_ID,
        };
        if (src?.qrCode) restored[p].qrCode = JSON.parse(JSON.stringify(src.qrCode));
      }
      if (productSpec.requiresQrCode && normalizedQrDefault) {
        const hasQr = restored?.[normalizedQrDefault.placement]?.qrCode;
        if (!hasQr) {
          restored[normalizedQrDefault.placement] = {
            ...(restored[normalizedQrDefault.placement] || { images: [], texts: [] }),
            layoutId: restored[normalizedQrDefault.placement]?.layoutId || DEFAULT_LAYOUT_ID,
            qrCode: {
              x: normalizedQrDefault.left,
              y: normalizedQrDefault.top,
              width: normalizedQrDefault.width,
              height: normalizedQrDefault.height,
            },
          };
        }
      }
      return restored as DesignState;
    }
    return initial as DesignState;
  });

  // Selection (images/texts/decoratives)
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<"image" | "text" | "decorative" | null>(null);

  // Loaded resources
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map());
  const [uploadedAssets, setUploadedAssets] = useState<UploadedImageAsset[]>([]);
  const [surfacePreviews, setSurfacePreviews] = useState<Record<Placement, string>>(() => {
    const initial: Record<Placement, string> = {} as Record<Placement, string>;
    for (const p of productSpec.placements) initial[p] = "";
    return initial;
  });
  const [qrImageObj, setQrImageObj] = useState<HTMLImageElement | null>(null);
  const [templateImageObj, setTemplateImageObj] = useState<HTMLImageElement | null>(null);
  const templateCrop = useMemo(() => {
    const crop = selectedArtKeyTemplate.contentCrop;
    if (!crop || !templateImageObj) return undefined;

    const sourceW = templateImageObj.naturalWidth || templateImageObj.width || 0;
    const sourceH = templateImageObj.naturalHeight || templateImageObj.height || 0;
    if (sourceW <= 0 || sourceH <= 0) return undefined;

    const x = Math.round(clamp(crop.xFraction, 0, 1) * sourceW);
    const y = Math.round(clamp(crop.yFraction, 0, 1) * sourceH);
    const width = Math.round(clamp(crop.widthFraction, 0.01, 1) * sourceW);
    const height = Math.round(clamp(crop.heightFraction, 0.01, 1) * sourceH);

    return { x, y, width, height };
  }, [selectedArtKeyTemplate.contentCrop, templateImageObj]);

  // Text tool state
  const [textInput, setTextInput] = useState("");
  const [textFont, setTextFont] = useState(FONT_OPTIONS[0].family);
  const [textSize, setTextSize] = useState(48);
  const [textColor, setTextColor] = useState(BRAND.dark);
  const [textBold, setTextBold] = useState(false);
  const [textItalic, setTextItalic] = useState(false);
  const [textUnderline, setTextUnderline] = useState(false);
  const [textAlign, setTextAlign] = useState<TextAlign>("left");
  const [textLineHeight, setTextLineHeight] = useState(1.2);
  const [textLetterSpacing, setTextLetterSpacing] = useState(0);
  const [rotationInput, setRotationInput] = useState("0");
  const [activeColorPicker, setActiveColorPicker] = useState<"text" | "background" | null>(null);
  const [activeColorAlpha, setActiveColorAlpha] = useState(1);
  const [recentTextColors, setRecentTextColors] = useState<string[]>([]);

  // Undo/redo
  const [history, setHistory] = useState<DesignState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUndoRedo, setIsUndoRedo] = useState(false);

  // Zoom
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const zoomLevel = ZOOM_LEVELS[zoomIndex];
  const [isExporting, setIsExporting] = useState(false);
  const [isPreviewingProof, setIsPreviewingProof] = useState(false);
  const [exportStatus, setExportStatus] = useState<{ tone: "info" | "success" | "error"; message: string } | null>(null);
  /** When set, a fixed-position textarea is shown over the canvas for inline typing. */
  const [canvasTextEditId, setCanvasTextEditId] = useState<string | null>(null);
  const [inlineTextDraft, setInlineTextDraft] = useState("");
  const [inlineEditLayout, setInlineEditLayout] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
    fontSizePx: number;
    fontFamily: string;
    color: string;
    fontWeight: string;
    fontStyle: string;
    textAlign: string;
    lineHeight: number;
    letterSpacingPx: number;
    textDecoration: string;
  } | null>(null);
  const canvasInlineTextRef = useRef<HTMLTextAreaElement | null>(null);

  // Crop
  const [cropImageId, setCropImageId] = useState<string | null>(null);
  const [hoverSlotIndex, setHoverSlotIndex] = useState<number | null>(null);

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
  const [decoratives, setDecoratives] = useState<Record<Placement, DecorativeItem[]>>(() => {
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
    background: false,
    decoratives: false,
    text: false,
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

  // Resolve label for a placement, using productSpec.placementLabels (from
  // SurfaceMap) first, then the static PLACEMENT_LABELS fallback.
  const getLabel = useCallback(
    (p: Placement): string =>
      productSpec.placementLabels?.[p] || PLACEMENT_LABELS[p] || p,
    [productSpec.placementLabels]
  );

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

  // Dev-only: log per-placement dimensions when print specs are available
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (!productSpec.placementDimensions) return;
    const entries = Object.entries(productSpec.placementDimensions);
    if (entries.length === 0) return;
    console.log(
      "[Studio] Per-placement dimensions from Printful:",
      Object.fromEntries(entries.map(([k, v]) => [k, `${v.width}×${v.height} @ ${v.dpi}dpi`]))
    );
    for (const p of productSpec.placements) {
      const dims = getPlacementCanvasSize(productSpec, p);
      console.log(`[Studio]   ${p} → canvas ${dims.width}×${dims.height}`);
    }
  }, [productSpec]);

  // -------------------------------------------------------------------------
  // COMPUTED VALUES
  // -------------------------------------------------------------------------
  const { width: canvasWidth, height: canvasHeight } = useMemo(
    () => getPlacementCanvasSize(productSpec, activePlacement),
    [productSpec, activePlacement]
  );

  // "Fit" scale uses the available container size (minus padding)
  const fitMaxW = Math.max(1, containerSize.width - 64);
  const fitMaxH = Math.max(1, containerSize.height - 64);
  // Keep perceived canvas footprint consistent across portrait/landscape by
  // fitting against the long edge, not whichever side happens to be limiting.
  const longEdgeTarget = Math.max(1, Math.min(fitMaxW, fitMaxH));
  const baseDisplayScale = Math.min(longEdgeTarget / Math.max(canvasWidth, canvasHeight), 1);
  const displayScale = baseDisplayScale * zoomLevel;

  const stageWidth = Math.max(1, Math.round(canvasWidth * displayScale));
  const stageHeight = Math.max(1, Math.round(canvasHeight * displayScale));

  // Sync draft when opening inline editor (not on every designs keystroke).
  useEffect(() => {
    if (!canvasTextEditId) {
      setInlineTextDraft("");
      return;
    }
    const item = (designs[activePlacement]?.texts || []).find((t) => t.id === canvasTextEditId);
    setInlineTextDraft(item?.text ?? "");
  }, [canvasTextEditId, activePlacement]);

  useLayoutEffect(() => {
    if (!canvasTextEditId) {
      setInlineEditLayout(null);
      return;
    }
    const updateLayout = () => {
      const stage = stageRef.current;
      if (!stage) return;
      const node = stage.findOne(`#${canvasTextEditId}`);
      if (!node) return;
      const texts = designs[activePlacement]?.texts || [];
      const item = texts.find((t) => t.id === canvasTextEditId);
      if (!item) {
        setCanvasTextEditId(null);
        return;
      }
      const container = stage.container();
      const cr = container.getBoundingClientRect();
      const rect = node.getClientRect({ relativeTo: stage });
      const sw = stage.width();
      const sh = stage.height();
      if (sw <= 0 || sh <= 0) return;
      const scaleX = cr.width / sw;
      const scaleY = cr.height / sh;
      const fs = Math.max(10, item.fontSize * (cr.width / canvasWidth));
      setInlineEditLayout({
        left: cr.left + rect.x * scaleX,
        top: cr.top + rect.y * scaleY,
        width: Math.max(48, rect.width * scaleX),
        height: Math.max(28, rect.height * scaleY),
        fontSizePx: fs,
        fontFamily: item.fontFamily,
        color: item.fill,
        fontWeight: item.fontStyle?.includes("bold") ? "700" : "400",
        fontStyle: item.fontStyle?.includes("italic") ? "italic" : "normal",
        textAlign: item.align || "left",
        lineHeight: item.lineHeight ?? 1.2,
        letterSpacingPx: (item.letterSpacing ?? 0) * (cr.width / canvasWidth),
        textDecoration: item.textDecoration || "none",
      });
    };
    updateLayout();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateLayout) : null;
    const wrap = canvasContainerRef.current;
    if (ro && wrap) ro.observe(wrap);
    window.addEventListener("resize", updateLayout);
    window.addEventListener("scroll", updateLayout, true);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", updateLayout);
      window.removeEventListener("scroll", updateLayout, true);
    };
  }, [canvasTextEditId, designs, activePlacement, canvasWidth, zoomIndex, displayScale]);

  useEffect(() => {
    if (!canvasTextEditId) return;
    const raf = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const el = canvasInlineTextRef.current;
        if (!el) return;
        el.focus();
        const len = el.value.length;
        el.setSelectionRange(len, len);
      });
    });
    return () => window.cancelAnimationFrame(raf);
  }, [canvasTextEditId]);

  const currentDesign = designs[activePlacement] || { images: [], texts: [], layoutId: DEFAULT_LAYOUT_ID };
  const currentLayoutId = currentDesign.layoutId || DEFAULT_LAYOUT_ID;
  const currentLayout = useMemo(
    () => (currentLayoutId === DEFAULT_LAYOUT_ID ? null : getLayoutById(currentLayoutId) || null),
    [currentLayoutId]
  );
  const basicLayouts = useMemo(
    () => COLLAGE_LAYOUTS.filter((l) => (l.category || "basic") === "basic"),
    []
  );
  const currentBackground = backgrounds[activePlacement] || { enabled: false, color: "#f3f3f3", x: 0, y: 0, width: 100, height: 100 };
  const currentDecoratives = decoratives[activePlacement] || [];
  const borderDecoratives = currentDecoratives.filter((d) => getDecorativeKind(d) === "border");
  const frontDecoratives = currentDecoratives.filter((d) => getDecorativeKind(d) === "label");
  const findLinkedTextForDecorative = useCallback(
    (decorative: DecorativeItem): TextItem | null => {
      const texts = currentDesign.texts || [];
      if (decorative.linkedTextId) {
        return texts.find((t) => t.id === decorative.linkedTextId) || null;
      }
      if (texts.length === 0) return null;

      const decCx = decorative.x + decorative.width / 2;
      const decCy = decorative.y + decorative.height / 2;
      let best: TextItem | null = null;
      let bestDist = Number.POSITIVE_INFINITY;
      for (const t of texts) {
        const textW = Math.max(1, t.width || 120);
        const textH = Math.max(1, Math.round(t.fontSize * (t.lineHeight ?? 1.2)));
        const textCx = t.x + textW / 2;
        const textCy = t.y + textH / 2;
        const inside =
          textCx >= decorative.x &&
          textCx <= decorative.x + decorative.width &&
          textCy >= decorative.y &&
          textCy <= decorative.y + decorative.height;
        if (!inside) continue;
        const dist = Math.hypot(textCx - decCx, textCy - decCy);
        if (dist < bestDist) {
          best = t;
          bestDist = dist;
        }
      }
      return best;
    },
    [currentDesign.texts]
  );
  const linkedDecorativeTextIds = useMemo(() => {
    const ids = new Set<string>();
    for (const dec of currentDecoratives) {
      const linked = findLinkedTextForDecorative(dec);
      if (linked) ids.add(linked.id);
    }
    return ids;
  }, [currentDecoratives, findLinkedTextForDecorative]);
  
  const selectedDecorativeItem = 
    selectedType === "decorative" && selectedId
      ? currentDecoratives.find((d) => d.id === selectedId) || null
      : null;
  const selectedDecorativeLinkedText = selectedDecorativeItem
    ? findLinkedTextForDecorative(selectedDecorativeItem)
    : null;

  const slotRects = useMemo(() => {
    if (!currentLayout) return [];
    return buildSlotRects(currentLayout, canvasWidth, canvasHeight);
  }, [currentLayout, canvasWidth, canvasHeight]);
  const occupiedLayoutSlots = useMemo(() => {
    const used = new Set<number>();
    for (const img of currentDesign.images || []) {
      if (typeof img.slotIndex === "number" && img.slotIndex >= 0) {
        used.add(img.slotIndex);
      }
    }
    return used;
  }, [currentDesign.images]);

  // Keep slot guides above the design/background layer so photo containers stay visible.
  useEffect(() => {
    guidesLayerRef.current?.moveToTop();
    guidesLayerRef.current?.getStage()?.batchDraw();
  }, [activePlacement, currentLayoutId, slotRects.length, displayScale]);

  const getSlotIndexForPoint = useCallback(
    (x: number, y: number): number | undefined => {
      // First pass: direct hit inside a slot.
      for (let i = 0; i < slotRects.length; i++) {
        const s = slotRects[i];
        if (x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height) {
          return i;
        }
      }

      // Second pass: near-slot snap zone for friendlier drag/drop behavior.
      for (let i = 0; i < slotRects.length; i++) {
        const s = slotRects[i];
        if (
          x >= s.x - SLOT_SNAP_DISTANCE &&
          x <= s.x + s.width + SLOT_SNAP_DISTANCE &&
          y >= s.y - SLOT_SNAP_DISTANCE &&
          y <= s.y + s.height + SLOT_SNAP_DISTANCE
        ) {
          return i;
        }
      }

      return undefined;
    },
    [slotRects]
  );

  // When template type changes, normalize size/aspect so the template stays
  // visible and QR remains physically scannable.
  useEffect(() => {
    if (!productSpec.requiresQrCode) return;
    const expectedQrPx = (productSpec.printDpi || 300) * TARGET_QR_INCHES;
    const minTemplateFromQr = Math.round(expectedQrPx / Math.max(0.01, qrSizeFraction));
    const minTemplateFromCanvas = Math.round(
      Math.min(canvasWidth, canvasHeight * templateAspectRatio) *
        templateMinCanvasFraction
    );
    const minTemplate = Math.max(minTemplateFromQr, minTemplateFromCanvas);
    const maxTemplate = Math.max(
      1,
      Math.round(
        Math.min(canvasWidth, canvasHeight * templateAspectRatio) *
          templateMaxCanvasFraction
      )
    );

    setDesigns((prev) => {
      const current = prev[qrPlacement];
      if (!current?.qrCode) return prev;
      const { qrCode } = current;
      // Keep QR size physically consistent across templates by deriving
      // container width directly from the target QR pixel size.
      const widthFromTargetQr = expectedQrPx / Math.max(0.01, qrSizeFraction);
      const widthFromQrRatio = widthFromTargetQr;

      let nextWidth = clamp(widthFromQrRatio, Math.max(1, minTemplate), maxTemplate);
      let nextHeight = Math.max(1, Math.round(nextWidth / templateAspectRatio));

      // Fit to canvas if the aspect-adjusted box overflows.
      if (nextHeight > canvasHeight) {
        nextHeight = canvasHeight;
        nextWidth = Math.max(1, Math.round(nextHeight * templateAspectRatio));
      }
      if (nextWidth > canvasWidth) {
        nextWidth = canvasWidth;
        nextHeight = Math.max(1, Math.round(nextWidth / templateAspectRatio));
      }

      const currentAspect =
        qrCode.height > 0 ? qrCode.width / qrCode.height : templateAspectRatio;
      const needsResize =
        Math.abs(currentAspect - templateAspectRatio) > 0.01 ||
        qrCode.width !== nextWidth ||
        qrCode.height !== nextHeight;
      if (!needsResize) return prev;

      const nextX = clamp(
        qrCode.x - (nextWidth - qrCode.width) / 2,
        0,
        Math.max(0, canvasWidth - nextWidth)
      );
      const nextY = clamp(
        qrCode.y - (nextHeight - qrCode.height) / 2,
        0,
        Math.max(0, canvasHeight - nextHeight)
      );
      return {
        ...prev,
        [qrPlacement]: {
          ...current,
          qrCode: {
            ...qrCode,
            x: nextX,
            y: nextY,
            width: nextWidth,
            height: nextHeight,
          },
        },
      };
    });
  }, [
    productSpec.requiresQrCode,
    productSpec.printDpi,
    qrPlacement,
    selectedArtKeyTemplate.id,
    qrSizeFraction,
    templateAspectRatio,
    templateMinCanvasFraction,
    templateMaxCanvasFraction,
    canvasWidth,
    canvasHeight,
  ]);

  const hasQrOnCurrentSurface = productSpec.requiresQrCode && qrPlacement === activePlacement;

  const selectedTextItem =
    selectedType === "text" && selectedId
      ? (currentDesign.texts || []).find((t) => t.id === selectedId) || null
      : null;

  const selectedImageItem =
    selectedType === "image" && selectedId
      ? (currentDesign.images || []).find((img) => img.id === selectedId) || null
      : null;
  const getColorValueForTarget = useCallback(
    (target: "text" | "background"): string => {
      if (target === "text") return textColor || BRAND.dark;
      return currentBackground.color || BRAND.white;
    },
    [currentBackground.color, textColor]
  );

  const rememberRecentTextColor = useCallback((value: string) => {
    if (!value) return;
    setRecentTextColors((prev) => {
      const next = [value, ...prev.filter((c) => c !== value)];
      return next.slice(0, 10);
    });
  }, []);

  const closeActiveColorPicker = useCallback(() => {
    if (activeColorPicker) {
      rememberRecentTextColor(getColorValueForTarget(activeColorPicker));
    }
    setActiveColorPicker(null);
  }, [activeColorPicker, getColorValueForTarget, rememberRecentTextColor]);

  const openColorPickerFor = useCallback(
    (target: "text" | "background") => {
      const current = getColorValueForTarget(target);
      setActiveColorAlpha(parseCssAlpha(current));
      setActiveColorPicker(target);
    },
    [getColorValueForTarget]
  );

  const selectedRotationDegrees = useMemo(() => {
    if (!selectedId || !selectedType) return 0;
    if (selectedType === "image") return normalizeDegrees(selectedImageItem?.rotation ?? 0);
    if (selectedType === "text") return normalizeDegrees(selectedTextItem?.rotation ?? 0);
    if (selectedType === "decorative") return normalizeDegrees(selectedDecorativeItem?.rotation ?? 0);
    return 0;
  }, [selectedDecorativeItem, selectedId, selectedImageItem, selectedTextItem, selectedType]);
  const rotationSnapInfo = useMemo(
    () => getRotationSnapInfo(selectedRotationDegrees),
    [selectedRotationDegrees]
  );
  const rotationSnaps = useMemo(
    () => Array.from({ length: 360 / ROTATION_SNAP_STEP }, (_, i) => i * ROTATION_SNAP_STEP),
    []
  );

  const cropImageItem = cropImageId ? (currentDesign.images || []).find((img) => img.id === cropImageId) : null;
  const cropLoadedImage = cropImageId ? loadedImages.get(cropImageId) : null;

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  useEffect(() => {
    if (!exportStatus) return;
    const timer = window.setTimeout(() => setExportStatus(null), 3500);
    return () => window.clearTimeout(timer);
  }, [exportStatus]);

  useEffect(() => {
    if (!selectedId || !selectedType) {
      setRotationInput("0");
      return;
    }
    setRotationInput(String(Math.round(selectedRotationDegrees)));
  }, [selectedId, selectedRotationDegrees, selectedType]);

  useEffect(() => {
    if (
      activeColorPicker === "text" &&
      (selectedType !== "text" || !selectedTextItem)
    ) {
      setActiveColorPicker(null);
    }
  }, [activeColorPicker, selectedTextItem, selectedType]);

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
    if (!productSpec.requiresQrCode || !selectedArtKeyTemplate.assetUrl) return;

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = selectedArtKeyTemplate.assetUrl;
    img.onload = () => setTemplateImageObj(img);
    img.onerror = () =>
      console.error("Failed to load ArtKey template:", selectedArtKeyTemplate.assetUrl);
  }, [productSpec.requiresQrCode, selectedArtKeyTemplate.assetUrl]);

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

    // Transformer handles are currently unstable for text/decorative groups
    // in this editor. Keep selection active, but suppress handles to avoid jitter.
    if (selectedType === "text" || selectedType === "decorative") {
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
        const groups = (stage.find("Group") as any)?.toArray?.() || [];
        const candidates = [...images, ...texts, ...groups];
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
  }, [selectedId, selectedType, activePlacement, currentDesign.images, currentDesign.texts, currentDecoratives]);

  // Keep text controls in sync when selecting a text item
  useEffect(() => {
    if (!selectedTextItem) return;

    const nextText = selectedTextItem.text;
    const nextFont = selectedTextItem.fontFamily;
    const nextSize = selectedTextItem.fontSize;
    const nextColor = selectedTextItem.fill;
    const nextBold = selectedTextItem.fontStyle?.includes("bold") || false;
    const nextItalic = selectedTextItem.fontStyle?.includes("italic") || false;
    const nextUnderline = selectedTextItem.textDecoration === "underline";
    const nextAlign = selectedTextItem.align || "left";
    const nextLineHeight = Math.max(0.8, Math.min(3, selectedTextItem.lineHeight ?? 1.2));
    const nextLetterSpacing = Math.max(-5, Math.min(40, selectedTextItem.letterSpacing ?? 0));

    if (textInput !== nextText) setTextInput(nextText);
    if (textFont !== nextFont) setTextFont(nextFont);
    if (!nearlyEqual(textSize, nextSize, 0.1)) setTextSize(nextSize);
    if (textColor !== nextColor) setTextColor(nextColor);
    if (textBold !== nextBold) setTextBold(nextBold);
    if (textItalic !== nextItalic) setTextItalic(nextItalic);
    if (textUnderline !== nextUnderline) setTextUnderline(nextUnderline);
    if (textAlign !== nextAlign) setTextAlign(nextAlign);
    if (!nearlyEqual(textLineHeight, nextLineHeight, 0.005)) setTextLineHeight(nextLineHeight);
    if (!nearlyEqual(textLetterSpacing, nextLetterSpacing, 0.005)) setTextLetterSpacing(nextLetterSpacing);
  }, [selectedId, selectedType, selectedTextItem]);

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
      const linkedTextId = currentDecoratives.find((d) => d.id === selectedId)?.linkedTextId;
      setDecoratives((prev) => ({
        ...prev,
        [activePlacement]: (prev[activePlacement] || []).filter((d) => d.id !== selectedId),
      }));
      if (linkedTextId) {
        setDesigns((prev) => ({
          ...prev,
          [activePlacement]: {
            ...prev[activePlacement],
            texts: (prev[activePlacement]?.texts || []).filter((t) => t.id !== linkedTextId),
          },
        }));
      }

      setLoadedDecoratives((prev) => {
        const next = new Map(prev);
        next.delete(selectedId);
        return next;
      });
    }

    setSelectedId(null);
    setSelectedType(null);
    setContextMenu((cm) => ({ ...cm, visible: false }));
  }, [activePlacement, currentDecoratives, selectedId, selectedType]);

  const centerSelected = useCallback(
    (axis: "x" | "y" | "both") => {
      if (!selectedId || !selectedType) return;

      const resolveCentered = (
        x: number,
        y: number,
        width: number,
        height: number,
        target: { x: number; y: number; width: number; height: number }
      ) => {
        let nextX = x;
        let nextY = y;
        if (axis === "x" || axis === "both") {
          nextX = target.x + (target.width - width) / 2;
        }
        if (axis === "y" || axis === "both") {
          nextY = target.y + (target.height - height) / 2;
        }
        return { x: nextX, y: nextY };
      };

      if (selectedType === "decorative") {
        setDecoratives((prev) => ({
          ...prev,
          [activePlacement]: (prev[activePlacement] || []).map((d) => {
            if (d.id !== selectedId) return d;
            const next = resolveCentered(
              d.x,
              d.y,
              d.width,
              d.height,
              { x: 0, y: 0, width: canvasWidth, height: canvasHeight }
            );
            return { ...d, ...next };
          }),
        }));
        return;
      }

      if (selectedType === "image") {
        setDesigns((prev) => ({
          ...prev,
          [activePlacement]: {
            ...prev[activePlacement],
            images: (prev[activePlacement]?.images || []).map((img) => {
              if (img.id !== selectedId) return img;
              const slot =
                typeof img.slotIndex === "number" ? slotRects[img.slotIndex] : undefined;
              const target = slot || { x: 0, y: 0, width: canvasWidth, height: canvasHeight };
              const next = resolveCentered(img.x, img.y, img.width, img.height, target);
              return { ...img, ...next };
            }),
          },
        }));
        return;
      }

      if (selectedType === "text") {
        setDesigns((prev) => ({
          ...prev,
          [activePlacement]: {
            ...prev[activePlacement],
            texts: (prev[activePlacement]?.texts || []).map((t) => {
              if (t.id !== selectedId) return t;
              const approxTextHeight = Math.max(1, Math.round(t.fontSize * 1.2));
              const next = resolveCentered(
                t.x,
                t.y,
                Math.max(1, t.width),
                approxTextHeight,
                { x: 0, y: 0, width: canvasWidth, height: canvasHeight }
              );
              return { ...t, ...next };
            }),
          },
        }));
      }
    },
    [activePlacement, canvasHeight, canvasWidth, selectedId, selectedType, slotRects]
  );

  // -------------------------------------------------------------------------
  // BACKGROUND HANDLERS
  // -------------------------------------------------------------------------
  const updateBackground = useCallback((updates: Partial<typeof currentBackground>) => {
    setBackgrounds((prev) => ({
      ...prev,
      [activePlacement]: { ...prev[activePlacement], ...updates },
    }));
  }, [activePlacement, currentDecoratives, currentDesign.texts]);

  // -------------------------------------------------------------------------
  // DECORATIVE ELEMENT HANDLERS
  // -------------------------------------------------------------------------
  const addDecorativeElement = useCallback((element: DecorativeElementOption) => {
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
        kind: getDecorativeKind(element),
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

      if (getDecorativeKind(element) === "label") {
        const textId = generateId("txt");
        const fontStyle = `${textBold ? "bold " : ""}${textItalic ? "italic" : ""}`.trim() || "normal";
        const textWidth = Math.max(90, Math.round(width * 0.72));
        const textX = newDecorative.x + (newDecorative.width - textWidth) / 2;
        const textY = newDecorative.y + (newDecorative.height - textSize) / 2;
        const defaultText = "Your text here";

        const newText: TextItem = {
          id: textId,
          text: defaultText,
          x: textX,
          y: textY,
          width: textWidth,
          fontSize: textSize,
          fontFamily: textFont,
          fill: textColor,
          fontStyle,
          align: "center",
          textDecoration: textUnderline ? "underline" : "",
          lineHeight: textLineHeight,
          letterSpacing: textLetterSpacing,
          labelShape: "none",
          rotation: 0,
        };

        setDesigns((prev) => ({
          ...prev,
          [activePlacement]: {
            ...(prev[activePlacement] || { images: [], texts: [], layoutId: DEFAULT_LAYOUT_ID }),
            texts: [...((prev[activePlacement]?.texts || []) as TextItem[]), newText],
          },
        }));

        setDecoratives((prev) => ({
          ...prev,
          [activePlacement]: (prev[activePlacement] || []).map((d) =>
            d.id === newId ? { ...d, linkedTextId: textId } : d
          ),
        }));

        setSelectedId(textId);
        setSelectedType("text");
        setTextInput(defaultText);
      } else {
        setSelectedId(newId);
        setSelectedType("decorative");
      }
    };

    img.onerror = () => console.error("Failed to load decorative:", element.src);
  }, [
    activePlacement,
    canvasWidth,
    canvasHeight,
    textBold,
    textColor,
    textFont,
    textItalic,
    textLetterSpacing,
    textLineHeight,
    textSize,
    textUnderline,
  ]);

  const handleDecorativeDragEnd = useCallback((id: string, node: Konva.Node) => {
    let nextDecorative: DecorativeItem | null = null;
    setDecoratives((prev) => ({
      ...prev,
      [activePlacement]: (prev[activePlacement] || []).map((d) => {
        if (d.id !== id) return d;
        nextDecorative = { ...d, x: node.x(), y: node.y() };
        return nextDecorative;
      }),
    }));

    if (!nextDecorative?.linkedTextId) return;
    const linkedTextId = nextDecorative.linkedTextId;
    const previous = currentDesign.texts.find((t) => t.id === linkedTextId);
    if (!previous) return;
    const source = currentDecoratives.find((d) => d.id === id);
    if (!source) return;
    const xRatio = (previous.x - source.x) / Math.max(1, source.width);
    const yRatio = (previous.y - source.y) / Math.max(1, source.height);

    setDesigns((prev) => ({
      ...prev,
      [activePlacement]: {
        ...prev[activePlacement],
        texts: (prev[activePlacement]?.texts || []).map((t) =>
          t.id === linkedTextId
            ? {
                ...t,
                x: nextDecorative!.x + nextDecorative!.width * xRatio,
                y: nextDecorative!.y + nextDecorative!.height * yRatio,
                rotation: nextDecorative!.rotation,
              }
            : t
        ),
      },
    }));
  }, [activePlacement]);

  const handleDecorativeTransformEnd = useCallback((id: string, node: Konva.Node) => {
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const source = currentDecoratives.find((d) => d.id === id);
    let nextDecorative: DecorativeItem | null = null;

    setDecoratives((prev) => ({
      ...prev,
      [activePlacement]: (prev[activePlacement] || []).map((d) => {
        if (d.id !== id) return d;
        nextDecorative = {
          ...d,
          x: node.x(),
          y: node.y(),
          width: Math.max(20, d.width * scaleX),
          height: Math.max(20, d.height * scaleY),
          rotation: snapRotationDegrees(node.rotation()),
        };
        return nextDecorative;
      }),
    }));

    if (source?.linkedTextId && nextDecorative) {
      const previous = currentDesign.texts.find((t) => t.id === source.linkedTextId);
      if (previous) {
        const widthRatio = (previous.width || Math.max(90, source.width * 0.72)) / Math.max(1, source.width);
        const xRatio = (previous.x - source.x) / Math.max(1, source.width);
        const yRatio = (previous.y - source.y) / Math.max(1, source.height);
        const fontRatio = previous.fontSize / Math.max(1, Math.min(source.width, source.height));
        setDesigns((prev) => ({
          ...prev,
          [activePlacement]: {
            ...prev[activePlacement],
            texts: (prev[activePlacement]?.texts || []).map((t) =>
              t.id === source.linkedTextId
                ? {
                    ...t,
                    x: nextDecorative!.x + nextDecorative!.width * xRatio,
                    y: nextDecorative!.y + nextDecorative!.height * yRatio,
                    width: Math.max(60, nextDecorative!.width * widthRatio),
                    fontSize: Math.max(10, Math.round(Math.min(nextDecorative!.width, nextDecorative!.height) * fontRatio)),
                    rotation: nextDecorative!.rotation,
                  }
                : t
            ),
          },
        }));
      }
    }

    node.scaleX(1);
    node.scaleY(1);
  }, [activePlacement, currentDecoratives, currentDesign.texts]);

  const updateDecorativeOpacity = useCallback((id: string, opacity: number) => {
    setDecoratives((prev) => ({
      ...prev,
      [activePlacement]: (prev[activePlacement] || []).map((d) =>
        d.id === id ? { ...d, opacity } : d
      ),
    }));
  }, [activePlacement]);

  const setSelectedRotation = useCallback(
    (degrees: number) => {
      if (!selectedId || !selectedType) return;
      const normalized = normalizeDegrees(degrees);

      if (selectedType === "image") {
        setDesigns((prev) => ({
          ...prev,
          [activePlacement]: {
            ...prev[activePlacement],
            images: (prev[activePlacement]?.images || []).map((img) =>
              img.id === selectedId ? { ...img, rotation: normalized } : img
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
              t.id === selectedId ? { ...t, rotation: normalized } : t
            ),
          },
        }));
      }

      if (selectedType === "decorative") {
        setDecoratives((prev) => ({
          ...prev,
          [activePlacement]: (prev[activePlacement] || []).map((d) =>
            d.id === selectedId ? { ...d, rotation: normalized } : d
          ),
        }));
      }
    },
    [activePlacement, selectedId, selectedType]
  );

  const rotateSelected = useCallback(
    (degrees: number) => {
      if (!selectedId || !selectedType) return;

      if (selectedType === "image") {
        setDesigns((prev) => ({
          ...prev,
          [activePlacement]: {
            ...prev[activePlacement],
            images: (prev[activePlacement]?.images || []).map((img) =>
              img.id === selectedId ? { ...img, rotation: normalizeDegrees(img.rotation + degrees) } : img
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
              t.id === selectedId ? { ...t, rotation: normalizeDegrees(t.rotation + degrees) } : t
            ),
          },
        }));
      }

      if (selectedType === "decorative") {
        setDecoratives((prev) => ({
          ...prev,
          [activePlacement]: (prev[activePlacement] || []).map((d) =>
            d.id === selectedId ? { ...d, rotation: normalizeDegrees(d.rotation + degrees) } : d
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
      const tag = (document.activeElement?.tagName || "").toUpperCase();
      const isTyping = tag === "INPUT" || tag === "TEXTAREA";

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
        if (!isTyping && selectedId) {
          e.preventDefault();
          deleteSelected();
        }
      }

      // Center shortcuts (only when not typing in a field)
      // Shift+H => center horizontally
      // Shift+V => center vertically
      // Shift+C => center both axes
      if (!isTyping && e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && selectedId) {
        const k = e.key.toLowerCase();
        if (k === "h") {
          e.preventDefault();
          centerSelected("x");
          return;
        }
        if (k === "v") {
          e.preventDefault();
          centerSelected("y");
          return;
        }
        if (k === "c") {
          e.preventDefault();
          centerSelected("both");
          return;
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [centerSelected, deleteSelected, handleRedo, handleUndo, selectedId]);

  // -------------------------------------------------------------------------
  // LAYOUT HELPERS
  // -------------------------------------------------------------------------
  const fitImageToSlotFrame = useCallback(
    (img: ImageItem, slotIndex: number): ImageItem => {
      const slot = slotRects[slotIndex];
      if (!slot) return { ...img, slotIndex: undefined };
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
    },
    [slotRects]
  );

  const applyLayout = useCallback(
    (layoutId: string) => {
      const layout = getLayoutById(layoutId);
      if (!layout) return;

      const nextSlotRects = buildSlotRects(layout, canvasWidth, canvasHeight);

      setDesigns((prev) => {
        const current = prev[activePlacement] || { images: [], texts: [], layoutId: DEFAULT_LAYOUT_ID };
        const images = [...(current.images || [])];
        const slotCount = nextSlotRects.length;

        // Deterministic placement: first N images always occupy first N slots.
        const normalized = images.map((img, idx) => {
          if (idx >= slotCount || slotCount === 0) {
            return { ...img, slotIndex: undefined };
          }
          const slot = nextSlotRects[idx];
          const srcW = img.originalWidth || img.width;
          const srcH = img.originalHeight || img.height;
          const fitted = coverImageToSlot(srcW, srcH, slot.width, slot.height);
          const centered = centerInSlot(fitted.width, fitted.height, slot.x, slot.y, slot.width, slot.height);
          return { ...img, slotIndex: idx, x: centered.x, y: centered.y, width: fitted.width, height: fitted.height };
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
      setHoverSlotIndex(null);
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

  const addImageToCanvas = useCallback(
    (src: string, img: HTMLImageElement, forcedSlotIndex?: number) => {
      const slotIndex = typeof forcedSlotIndex === "number" ? forcedSlotIndex : undefined;
      const id = generateId();
      let newImage: ImageItem;

      if (typeof slotIndex === "number" && slotRects[slotIndex]) {
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
        // Keep free images safely inside the visible canvas workspace.
        const maxW = canvasWidth * 0.9;
        const maxH = canvasHeight * 0.9;
        const fitted = fitImageToSlot(img.width, img.height, maxW, maxH);
        const width = Math.min(fitted.width, canvasWidth * 0.9);
        const height = Math.min(fitted.height, canvasHeight * 0.9);
        const centered = centerInSlot(width, height, 0, 0, canvasWidth, canvasHeight);

        newImage = {
          id,
          src,
          x: clamp(centered.x, 0, Math.max(0, canvasWidth - width)),
          y: clamp(centered.y, 0, Math.max(0, canvasHeight - height)),
          width,
          height,
          rotation: 0,
          originalWidth: img.width,
          originalHeight: img.height,
        };
      }

      setLoadedImages((prev) => new Map(prev).set(id, img));
      setDesigns((prev) => ({
        ...prev,
        [activePlacement]: {
          ...(prev[activePlacement] || { images: [], texts: [], layoutId: DEFAULT_LAYOUT_ID }),
          images: [...((prev[activePlacement]?.images || []) as ImageItem[]), newImage],
        },
      }));

      setSelectedId(id);
      setSelectedType("image");
    },
    [activePlacement, canvasHeight, canvasWidth, slotRects]
  );

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
            // Default to freeform image mode. Only auto-slot when a non-default layout is active.
            const slotIndex =
              currentLayoutId !== DEFAULT_LAYOUT_ID ? nextFreeSlot() : null;
            if (slotIndex !== null) used.add(slotIndex);
            setUploadedAssets((prev) => {
              if (prev.some((a) => a.src === src)) return prev;
              return [
                ...prev,
                {
                  id: generateId("asset"),
                  name: file.name,
                  src,
                  width: img.width,
                  height: img.height,
                },
              ];
            });
            addImageToCanvas(src, img, slotIndex ?? undefined);
          };

          img.src = src;
        };

        reader.readAsDataURL(file);
      });

      e.target.value = "";
    },
    [addImageToCanvas, currentDesign.images, slotRects]
  );

  const addUploadedAssetToCanvas = useCallback(
    (asset: UploadedImageAsset) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => addImageToCanvas(asset.src, img);
      img.src = asset.src;
    },
    [addImageToCanvas]
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

  const handleImageDragMove = useCallback(
    (id: string, node: Konva.Node) => {
      const current = (designs[activePlacement]?.images || []).find((img) => img.id === id);
      if (!current || slotRects.length === 0) {
        setHoverSlotIndex(null);
        return;
      }
      const centerX = node.x() + current.width / 2;
      const centerY = node.y() + current.height / 2;
      const nextSlot = getSlotIndexForPoint(centerX, centerY);
      setHoverSlotIndex(typeof nextSlot === "number" ? nextSlot : null);
    },
    [activePlacement, designs, getSlotIndexForPoint, slotRects.length]
  );

  const handleImageDragEnd = useCallback(
    (id: string, node: Konva.Node) => {
      setHoverSlotIndex(null);
      setDesigns((prev) => ({
        ...prev,
        [activePlacement]: {
          ...prev[activePlacement],
          images: (prev[activePlacement]?.images || []).map((img) => {
            if (img.id !== id) return img;
            const dropped = { ...img, x: node.x(), y: node.y() };
            const centerX = dropped.x + dropped.width / 2;
            const centerY = dropped.y + dropped.height / 2;
            const slotIndex = getSlotIndexForPoint(centerX, centerY);

            if (typeof slotIndex === "number") {
              return fitImageToSlotFrame({ ...dropped, slotIndex }, slotIndex);
            }

            if (currentLayoutId === DEFAULT_LAYOUT_ID) {
              return { ...dropped, slotIndex: undefined };
            }

            return constrainImageToSlot(dropped);
          }),
        },
      }));
    },
    [activePlacement, constrainImageToSlot, currentLayoutId, fitImageToSlotFrame, getSlotIndexForPoint, slotRects]
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
        rotation: snapRotationDegrees(node.rotation()),
      };

      node.scaleX(1);
      node.scaleY(1);

      setDesigns((prev) => ({
        ...prev,
        [activePlacement]: {
          ...prev[activePlacement],
          images: (prev[activePlacement]?.images || []).map((img) =>
            img.id === id ? { ...img, ...next, slotIndex: undefined } : img
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
      const baseWidth = Math.max(200, Math.round(canvasWidth * 0.6));
      const width = baseWidth;

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
        lineHeight: textLineHeight,
        letterSpacing: textLetterSpacing,
        labelShape: "none",
        labelBoxHeight: undefined,
        labelPadding: 0,
        labelOuterStrokeWidth: 0,
        labelInnerStrokeWidth: 0,
        labelOuterStrokeColor: undefined,
        labelInnerStrokeColor: undefined,
        labelFillEnabled: false,
        labelFillColor: BRAND.white,
        labelBorderEnabled: false,
        labelBorderColor: BRAND.dark,
        labelBorderWidth: 0,
        labelCornerRadius: 0,
      };

      setDesigns((prev) => ({
        ...prev,
        [activePlacement]: {
          ...(prev[activePlacement] || { images: [], texts: [], layoutId: DEFAULT_LAYOUT_ID }),
          texts: [...((prev[activePlacement]?.texts || []) as TextItem[]), newText],
        },
      }));

      setSelectedId(id);
      setSelectedType("text");
      setTextInput(trimmed);
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
      textLetterSpacing,
      textLineHeight,
      textSize,
      textUnderline,
    ]
  );

  /** Insert an empty text box on the active surface, select it, and focus the sidebar editor. */
  const addTextBox = useCallback(() => {
    const id = generateId();
    const fontStyle = `${textBold ? "bold " : ""}${textItalic ? "italic " : ""}`.trim() || "normal";
    const baseWidth = Math.max(200, Math.round(canvasWidth * 0.6));
    const width = baseWidth;

    const newText: TextItem = {
      id,
      text: "",
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
      lineHeight: textLineHeight,
      letterSpacing: textLetterSpacing,
      labelShape: "none",
      labelBoxHeight: undefined,
      labelPadding: 0,
      labelOuterStrokeWidth: 0,
      labelInnerStrokeWidth: 0,
      labelOuterStrokeColor: undefined,
      labelInnerStrokeColor: undefined,
      labelFillEnabled: false,
      labelFillColor: BRAND.white,
      labelBorderEnabled: false,
      labelBorderColor: BRAND.dark,
      labelBorderWidth: 0,
      labelCornerRadius: 0,
    };

    setDesigns((prev) => ({
      ...prev,
      [activePlacement]: {
        ...(prev[activePlacement] || { images: [], texts: [], layoutId: DEFAULT_LAYOUT_ID }),
        texts: [...((prev[activePlacement]?.texts || []) as TextItem[]), newText],
      },
    }));

    setSelectedId(id);
    setSelectedType("text");
    setTextInput("");
    setCanvasTextEditId(id);
  }, [
    activePlacement,
    canvasHeight,
    canvasWidth,
    textAlign,
    textBold,
    textColor,
    textFont,
    textItalic,
    textLetterSpacing,
    textLineHeight,
    textSize,
    textUnderline,
  ]);

  const updateTextById = useCallback(
    (id: string, updates: Partial<TextItem>) => {
      setDesigns((prev) => {
        const placement = prev[activePlacement];
        if (!placement) return prev;

        let changed = false;
        const nextTexts = (placement.texts || []).map((t) => {
          if (t.id !== id) return t;
          const hasRealChange = Object.entries(updates).some(([key, value]) => {
            const current = (t as any)[key];
            return !Object.is(current, value);
          });
          if (!hasRealChange) return t;
          changed = true;
          return { ...t, ...updates };
        });

        if (!changed) return prev;
        return {
          ...prev,
          [activePlacement]: {
            ...placement,
            texts: nextTexts,
          },
        };
      });
    },
    [activePlacement]
  );

  const updateSelectedText = useCallback(
    (updates: Partial<TextItem>) => {
      if (!selectedId || selectedType !== "text") return;
      updateTextById(selectedId, updates);
    },
    [selectedId, selectedType, updateTextById]
  );

  // Apply style controls to selected text
  useEffect(() => {
    if (!selectedTextItem) return;
    const fontStyle = `${textBold ? "bold " : ""}${textItalic ? "italic" : ""}`.trim() || "normal";
    const nextTextDecoration = textUnderline ? "underline" : "";
    const nextLineHeight = textLineHeight;
    const nextLetterSpacing = textLetterSpacing;

    const unchanged =
      selectedTextItem.text === textInput &&
      nearlyEqual(selectedTextItem.fontSize, textSize, 0.1) &&
      selectedTextItem.fontFamily === textFont &&
      selectedTextItem.fill === textColor &&
      selectedTextItem.fontStyle === fontStyle &&
      selectedTextItem.align === textAlign &&
      (selectedTextItem.textDecoration || "") === nextTextDecoration &&
      nearlyEqual(selectedTextItem.lineHeight ?? 1.2, nextLineHeight, 0.005) &&
      nearlyEqual(selectedTextItem.letterSpacing ?? 0, nextLetterSpacing, 0.005);
    if (unchanged) return;

    updateSelectedText({
      text: textInput,
      fontSize: textSize,
      fontFamily: textFont,
      fill: textColor,
      fontStyle,
      align: textAlign,
      textDecoration: nextTextDecoration,
      lineHeight: nextLineHeight,
      letterSpacing: nextLetterSpacing,
    });
  }, [selectedTextItem, textAlign, textBold, textColor, textFont, textInput, textItalic, textSize, textUnderline, textLineHeight, textLetterSpacing, updateSelectedText]);

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

            const currentWidth = typeof t.width === "number" ? t.width : node.width();
            const nextWidth = Math.max(40, currentWidth * scaleX);
            const isSquareLike = t.labelShape === "square" || t.labelShape === "circle";
            const baseHeight = getLabelBoxHeight(t);
            const uniformScale = Math.max(Math.abs(scaleX), Math.abs(scaleY));
            const nextLabelHeight =
              t.labelShape && t.labelShape !== "none"
                ? Math.max(40, (isSquareLike ? baseHeight * uniformScale : baseHeight * Math.abs(scaleY)))
                : t.labelBoxHeight;
            const normalizedWidth = isSquareLike ? Math.max(nextWidth, nextLabelHeight || 0) : nextWidth;

            return {
              ...t,
              x: node.x(),
              y: node.y(),
              rotation: snapRotationDegrees(node.rotation()),
              // Keep font size stable; resize changes box dimensions for text reflow.
              width: normalizedWidth,
              labelBoxHeight: nextLabelHeight,
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
      setCanvasTextEditId(null);
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
  const snapshotStage = useCallback((
    exportWidth: number,
    exportHeight: number
  ): string | null => {
    const stage = stageRef.current;
    const group = designGroupRef.current;
    if (!stage || !group) return null;

    transformerRef.current?.nodes([]);
    const guidesLayer = guidesLayerRef.current;
    const prevGuidesVisible = guidesLayer?.visible() ?? true;

    const prevStage = { w: stage.width(), h: stage.height() };
    const prevGroup = { x: group.x(), y: group.y(), sx: group.scaleX(), sy: group.scaleY() };

    try {
      guidesLayer?.visible(false);

      stage.width(exportWidth);
      stage.height(exportHeight);
      group.position({ x: 0, y: 0 });
      group.scale({ x: 1, y: 1 });

      stage.batchDraw();

      return stage.toDataURL({ mimeType: "image/png", pixelRatio: 1 });
    } finally {
      group.position({ x: prevGroup.x, y: prevGroup.y });
      group.scale({ x: prevGroup.sx, y: prevGroup.sy });
      stage.width(prevStage.w);
      stage.height(prevStage.h);
      guidesLayer?.visible(prevGuidesVisible);

      stage.batchDraw();
    }
  }, []);

  const exportCurrentPlacement = useCallback(() => {
    setSelectedId(null);
    setSelectedType(null);
    setContextMenu((cm) => ({ ...cm, visible: false }));

    return new Promise<string | null>((resolve) => {
      setTimeout(() => resolve(snapshotStage(canvasWidth, canvasHeight)), 50);
    });
  }, [snapshotStage, canvasWidth, canvasHeight]);

  // Keep a lightweight thumbnail cache for the right preview rail.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const preview = snapshotStage(canvasWidth, canvasHeight);
      if (!preview) return;
      setSurfacePreviews((prev) => ({ ...prev, [activePlacement]: preview }));
    }, 90);
    return () => window.clearTimeout(timer);
  }, [
    activePlacement,
    canvasWidth,
    canvasHeight,
    snapshotStage,
    currentDesign.images,
    currentDesign.texts,
    currentDecoratives,
    currentBackground,
    hasQrOnCurrentSurface,
    currentDesign.qrCode,
    qrImageObj,
    templateImageObj,
  ]);

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
      templateId: selectedArtKeyTemplate.id,
    };
  }, [designs, productSpec.requiresQrCode, qrPlacement, selectedArtKeyTemplate.id]);

  const handleExport = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportStatus({ tone: "info", message: onExport ? "Saving design..." : "Preparing download..." });
    try {
      const dataUrl = await exportCurrentPlacement();
      if (!dataUrl) {
        setExportStatus({ tone: "error", message: "Export failed. Please try again." });
        return;
      }

      if (onExport) {
        const pfPlacement = resolvePrintfulPlacement(productSpec, activePlacement);
        await Promise.resolve(onExport([{ placement: pfPlacement, dataUrl }], getArtKeyTemplatePosition()));
        setExportStatus({ tone: "success", message: "Design saved successfully." });
        return;
      }

      downloadDataURL(dataUrl, `${productSpec.name}-${activePlacement}.png`);
      setExportStatus({ tone: "success", message: "Download started." });
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : "Export failed. Please try again.";
      setExportStatus({ tone: "error", message: msg });
    } finally {
      setIsExporting(false);
    }
  }, [activePlacement, exportCurrentPlacement, getArtKeyTemplatePosition, isExporting, onExport, productSpec]);

  const handlePreviewPrintProof = useCallback(async () => {
    if (!onPreviewPrintProof || isPreviewingProof || isExporting) return;
    if (proofBlockedReason) {
      setExportStatus({
        tone: "error",
        message: proofBlockedUserHint || proofBlockedReason,
      });
      return;
    }
    setIsPreviewingProof(true);
    setExportStatus({ tone: "info", message: "Creating your print preview…" });
    try {
      const dataUrl = await exportCurrentPlacement();
      if (!dataUrl) {
        setExportStatus({ tone: "error", message: "Preview export failed. Please try again." });
        return;
      }
      const pfPlacement = resolvePrintfulPlacement(productSpec, activePlacement);
      await Promise.resolve(onPreviewPrintProof([{ placement: pfPlacement, dataUrl }]));
      setExportStatus({ tone: "success", message: "Preview ready — see panel above the canvas." });
    } catch (err: any) {
      setExportStatus({
        tone: "error",
        message: err?.message || "Couldn’t create the print preview. Try again.",
      });
    } finally {
      setIsPreviewingProof(false);
    }
  }, [
    activePlacement,
    exportCurrentPlacement,
    isExporting,
    isPreviewingProof,
    onPreviewPrintProof,
    productSpec,
    proofBlockedReason,
    proofBlockedUserHint,
  ]);

  /**
   * Generic compositor: loads N images and composites them into a single
   * canvas using the specified strategy. Driven by ExportRule.composite.
   */
  const compositeImages = useCallback(
    (
      dataUrls: string[],
      compositeType: string,
      targetSize: { width: number; height: number } | null
    ): Promise<string> => {
      return new Promise((resolve, reject) => {
        const images: HTMLImageElement[] = [];
        let loadedCount = 0;

        const onAllLoaded = () => {
          const canvas = document.createElement("canvas");

          if (compositeType === "horizontalSpread") {
            if (targetSize) {
              canvas.width = targetSize.width;
              canvas.height = targetSize.height;
            } else {
              canvas.width = images.reduce((sum, img) => sum + img.width, 0);
              canvas.height = Math.max(...images.map((img) => img.height));
            }

            const ctx = canvas.getContext("2d");
            if (!ctx) { reject(new Error("Canvas context unavailable")); return; }
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const sliceW = canvas.width / images.length;
            images.forEach((img, idx) => {
              ctx.drawImage(img, 0, 0, img.width, img.height, sliceW * idx, 0, sliceW, canvas.height);
            });
          } else if (compositeType === "verticalSpread") {
            if (targetSize) {
              canvas.width = targetSize.width;
              canvas.height = targetSize.height;
            } else {
              canvas.width = Math.max(...images.map((img) => img.width));
              canvas.height = images.reduce((sum, img) => sum + img.height, 0);
            }

            const ctx = canvas.getContext("2d");
            if (!ctx) { reject(new Error("Canvas context unavailable")); return; }
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const sliceH = canvas.height / images.length;
            images.forEach((img, idx) => {
              ctx.drawImage(img, 0, 0, img.width, img.height, 0, sliceH * idx, canvas.width, sliceH);
            });
          } else {
            reject(new Error(`Unknown composite type: ${compositeType}`));
            return;
          }

          resolve(canvas.toDataURL("image/png"));
        };

        for (let i = 0; i < dataUrls.length; i++) {
          const img = new window.Image();
          images[i] = img;
          img.onload = () => { loadedCount++; if (loadedCount === dataUrls.length) onAllLoaded(); };
          img.onerror = () => reject(new Error(`Failed to load composite image ${i}`));
          img.src = dataUrls[i];
        }
      });
    },
    []
  );

  const handleExportAll = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportStatus({ tone: "info", message: onExport ? "Saving all surfaces..." : "Preparing downloads..." });
    const originalPlacement = activePlacement;

    setSelectedId(null);
    setSelectedType(null);
    setContextMenu((cm) => ({ ...cm, visible: false }));

    // Step 1: Snapshot each UX surface at its own canvas dimensions
    const surfaceExports = new Map<string, string>();

    for (const placement of productSpec.placements) {
      setActivePlacement(placement);

      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 120));

      const dims = getPlacementCanvasSize(productSpec, placement);
      const dataUrl = snapshotStage(dims.width, dims.height);
      if (dataUrl) surfaceExports.set(placement, dataUrl);
    }

    setActivePlacement(originalPlacement);

    // Step 2: Apply export rules (or legacy fallback)
    let finalOutputs: { placement: string; dataUrl: string }[] = [];

    if (productSpec.exportRules && productSpec.exportRules.length > 0) {
      // Driven by SurfaceMap export rules
      for (const rule of productSpec.exportRules) {
        if (rule.composite && rule.uxSurfaceIds.length > 1) {
          const panelDataUrls = rule.uxSurfaceIds
            .map((id) => surfaceExports.get(id))
            .filter(Boolean) as string[];

          if (panelDataUrls.length === rule.uxSurfaceIds.length) {
            try {
              const targetSize = getFullPlacementSize(productSpec, rule.printfulPlacement);
              // eslint-disable-next-line no-await-in-loop
              const composited = await compositeImages(panelDataUrls, rule.composite.type, targetSize);
              finalOutputs.push({ placement: rule.printfulPlacement, dataUrl: composited });
            } catch (err) {
              if (process.env.NODE_ENV === "development") {
                console.error(`[Studio Export] Composite failed for ${rule.printfulPlacement}:`, err);
              }
              panelDataUrls.forEach((url, idx) => {
                finalOutputs.push({ placement: `${rule.printfulPlacement}_${idx}`, dataUrl: url });
              });
            }
          }
        } else {
          const surfaceId = rule.uxSurfaceIds[0];
          const dataUrl = surfaceExports.get(surfaceId);
          if (dataUrl) {
            finalOutputs.push({ placement: rule.printfulPlacement, dataUrl });
          }
        }
      }
    } else {
      // Legacy fallback: hardcoded inside1+inside2 composite
      const hasInside1 = surfaceExports.get("inside1");
      const hasInside2 = surfaceExports.get("inside2");

      if (hasInside1 && hasInside2) {
        try {
          const targetSize = getFullPlacementSize(productSpec, "inside");
          const insideDataUrl = await compositeImages([hasInside1, hasInside2], "horizontalSpread", targetSize);
          for (const [id, dataUrl] of surfaceExports) {
            if (id !== "inside1" && id !== "inside2") {
              const pfPlacement = resolvePrintfulPlacement(productSpec, id);
              finalOutputs.push({ placement: pfPlacement, dataUrl });
            }
          }
          finalOutputs.push({ placement: "inside", dataUrl: insideDataUrl });
        } catch {
          for (const [id, dataUrl] of surfaceExports) {
            const pfPlacement = resolvePrintfulPlacement(productSpec, id);
            finalOutputs.push({ placement: pfPlacement, dataUrl });
          }
        }
      } else {
        for (const [id, dataUrl] of surfaceExports) {
          const pfPlacement = resolvePrintfulPlacement(productSpec, id);
          finalOutputs.push({ placement: pfPlacement, dataUrl });
        }
      }
    }

    // Dev-only: validate export dimensions match Printful specs
    if (process.env.NODE_ENV === "development" && productSpec.placementDimensions) {
      for (const output of finalOutputs) {
        const expected = productSpec.placementDimensions[output.placement];
        if (expected) {
          const img = new window.Image();
          img.src = output.dataUrl;
          img.onload = () => {
            if (img.width !== expected.width || img.height !== expected.height) {
              console.warn(
                `[Studio Export] Dimension mismatch for "${output.placement}": ` +
                `exported ${img.width}×${img.height}, ` +
                `Printful expects ${expected.width}×${expected.height}`
              );
            }
          };
        }
      }
    }

    try {
      if (onExport) {
        await Promise.resolve(onExport(finalOutputs, getArtKeyTemplatePosition()));
        setExportStatus({ tone: "success", message: "All surfaces saved successfully." });
        return;
      }

      finalOutputs.forEach((o) => downloadDataURL(o.dataUrl, `${productSpec.name}-${o.placement}.png`));
      setExportStatus({ tone: "success", message: `Download started (${finalOutputs.length} files).` });
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : "Export failed. Please try again.";
      setExportStatus({ tone: "error", message: msg });
    } finally {
      setIsExporting(false);
    }
  }, [activePlacement, compositeImages, getArtKeyTemplatePosition, isExporting, onExport, productSpec, snapshotStage]);

  // -------------------------------------------------------------------------
  // UI HELPERS
  // -------------------------------------------------------------------------
  const switchPlacement = useCallback((p: Placement) => {
    setActivePlacement(p);
    setSelectedId(null);
    setSelectedType(null);
    setCanvasTextEditId(null);
    setHoverSlotIndex(null);
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
    <div className="w-full h-screen max-h-screen overflow-hidden flex flex-col" style={{ background: BRAND.lightest, color: BRAND.dark }}>
      {/* Top Bar */}
      <div
        className="px-3 py-2 lg:px-4 lg:py-2.5 border-b flex flex-wrap items-center gap-2"
        style={{ background: BRAND.white, borderColor: BRAND.light }}
      >
        <div className="flex items-center gap-2 lg:gap-3 min-w-0 flex-1">
          <h1 
            className="text-base sm:text-lg lg:text-xl font-normal truncate" 
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
          <button
            type="button"
            onClick={() => addTextBox()}
            className="flex items-center gap-1.5 px-3 py-2 rounded text-sm"
            style={{ background: BRAND.light, color: BRAND.dark }}
            title="Add text on this surface — then use the bar below the header for font, size, and color"
          >
            <IconText /> Add Text
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-start lg:justify-end">
          {exportStatus && (
            <span
              className="text-xs px-2 py-1 rounded"
              style={{
                background:
                  exportStatus.tone === "success"
                    ? "#ecfdf5"
                    : exportStatus.tone === "error"
                    ? "#fef2f2"
                    : BRAND.lightest,
                color:
                  exportStatus.tone === "success"
                    ? "#166534"
                    : exportStatus.tone === "error"
                    ? "#991b1b"
                    : BRAND.medium,
                border: `1px solid ${
                  exportStatus.tone === "success"
                    ? "#86efac"
                    : exportStatus.tone === "error"
                    ? "#fecaca"
                    : BRAND.light
                }`,
              }}
            >
              {exportStatus.message}
            </span>
          )}
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
          {selectedId && selectedType !== "text" && (
            <span
              className="text-xs px-2 py-1 rounded"
              style={{
                background: rotationSnapInfo.snapped ? "#ecfdf5" : BRAND.lightest,
                color: rotationSnapInfo.snapped ? "#166534" : BRAND.medium,
                border: `1px solid ${rotationSnapInfo.snapped ? "#86efac" : BRAND.light}`,
              }}
              title="Current selected item rotation"
            >
              {Math.round(selectedRotationDegrees)}°
              {rotationSnapInfo.snapped ? ` • snap ${rotationSnapInfo.target}°` : ""}
            </span>
          )}

          {/* Zoom (label clarifies this only changes on-screen view, not export size) */}
          <div className="mx-1 h-6 w-px hidden sm:block" style={{ background: BRAND.light }} />
          <div className="flex items-center gap-1" role="group" aria-label="Canvas zoom">
            <span
              className="hidden sm:inline text-[10px] font-semibold uppercase tracking-wide pr-0.5"
              style={{ color: BRAND.medium }}
            >
              Zoom
            </span>
            <button
              type="button"
              onClick={handleZoomOut}
              className="flex items-center justify-center w-8 h-8 rounded"
              style={{ background: BRAND.light, color: BRAND.dark }}
              title="Zoom out (view only)"
              aria-label="Zoom out"
            >
              <IconMinus />
            </button>
            <button
              type="button"
              onClick={handleZoomReset}
              className="px-2 py-2 rounded text-sm font-mono min-w-[3.5rem] text-center"
              style={{ background: BRAND.light, color: BRAND.dark }}
              title="Reset zoom to 100%"
              aria-label={`Zoom ${Math.round(zoomLevel * 100)} percent, click to reset`}
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              className="flex items-center justify-center w-8 h-8 rounded"
              style={{ background: BRAND.light, color: BRAND.dark }}
              title="Zoom in (view only)"
              aria-label="Zoom in"
            >
              <IconPlus />
            </button>
            <button
              type="button"
              onClick={handleZoomFit}
              className="flex items-center gap-1.5 px-3 py-2 rounded text-sm"
              style={{ background: BRAND.light, color: BRAND.dark }}
              title="Fit the canvas to your screen"
              aria-label="Fit canvas to view"
            >
              <IconFit /> Fit
            </button>
          </div>

          {/* Export */}
          <div className="mx-1 h-6 w-px hidden sm:block" style={{ background: BRAND.light }} />
          {onPreviewPrintProof && (
            <button
              type="button"
              onClick={handlePreviewPrintProof}
              disabled={isExporting || isPreviewingProof || !!proofBlockedReason}
              className="flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium disabled:opacity-60"
              style={{ background: BRAND.light, color: BRAND.dark }}
              title={
                proofBlockedUserHint ||
                proofBlockedReason ||
                "See how this surface may look when printed (preview only)"
              }
            >
              {isPreviewingProof ? "Generating…" : "Print preview"}
            </button>
          )}
          {productSpec.placements.length > 1 ? (
            <>
              <button
                onClick={handleExportAll}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium disabled:opacity-60"
                style={{ background: BRAND.accent, color: BRAND.white }}
                title={onExport ? 'Save all surfaces and continue' : 'Download all surfaces as PNG'}
              >
                <IconExport /> {isExporting ? "Working..." : onExport ? 'Save & Continue' : 'Download All'}
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium disabled:opacity-60"
                style={{ background: BRAND.gold, color: BRAND.dark }}
                title={onExport ? 'Save current surface and continue' : 'Download current surface as PNG'}
              >
                <IconExport /> {isExporting ? "Working..." : onExport ? 'Save Current' : 'Download'}
              </button>
            </>
          ) : (
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium disabled:opacity-60"
              style={{ background: BRAND.accent, color: BRAND.white }}
              title={onExport ? 'Save design and continue' : 'Download design as PNG'}
            >
              <IconExport /> {isExporting ? "Working..." : onExport ? 'Save & Continue' : 'Download PNG'}
            </button>
          )}
        </div>
      </div>

      {selectedType === "text" && selectedTextItem && (
        <div
          className="relative px-3 py-2 border-b flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center"
          style={{ background: BRAND.lightest, borderColor: BRAND.light }}
        >
          <p className="text-[11px] leading-snug lg:max-w-[220px]" style={{ color: BRAND.medium }}>
            <span className="font-semibold" style={{ color: BRAND.dark }}>
              Text
            </span>
            : double-click on the canvas to type. Drag the box to position. Use the controls here for font and color.
          </p>
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => openColorPickerFor("text")}
              className="h-8 px-2 rounded border flex items-center gap-2 shrink-0"
              style={{ borderColor: BRAND.light, background: BRAND.white }}
              title="Text color"
            >
              <span
                className="w-4 h-4 rounded border shrink-0"
                style={{ background: textColor, borderColor: BRAND.light }}
              />
              <span className="text-[11px] font-mono truncate max-w-[4.5rem]" style={{ color: BRAND.medium }}>
                {textColor}
              </span>
            </button>
            <select
              value={textFont}
              onChange={(e) => setTextFont(e.target.value)}
              className="border rounded px-2 py-1.5 text-xs min-w-0 max-w-[10rem] sm:max-w-[14rem]"
              style={{ borderColor: BRAND.light, background: BRAND.white, color: BRAND.dark }}
              title="Font"
            >
              {FONT_OPTIONS.map((option) => (
                <option key={option.family} value={option.family}>
                  {option.name}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1 text-[11px] shrink-0" style={{ color: BRAND.medium }}>
              Size
              <input
                type="number"
                min={8}
                max={300}
                step={1}
                value={textSize}
                onChange={(e) => setTextSize(Math.max(8, Math.min(300, Number(e.target.value) || 48)))}
                className="w-14 border rounded px-1 py-1 text-xs"
                style={{ borderColor: BRAND.light, background: BRAND.white }}
              />
            </label>
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setTextBold((prev) => !prev)}
                className="w-8 h-8 rounded text-xs font-bold"
                style={{
                  background: textBold ? BRAND.accent : BRAND.light,
                  color: textBold ? BRAND.white : BRAND.dark,
                }}
                title="Bold"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => setTextItalic((prev) => !prev)}
                className="w-8 h-8 rounded text-xs italic"
                style={{
                  background: textItalic ? BRAND.accent : BRAND.light,
                  color: textItalic ? BRAND.white : BRAND.dark,
                }}
                title="Italic"
              >
                I
              </button>
              <button
                type="button"
                onClick={() => setTextUnderline((prev) => !prev)}
                className="w-8 h-8 rounded text-xs underline"
                style={{
                  background: textUnderline ? BRAND.accent : BRAND.light,
                  color: textUnderline ? BRAND.white : BRAND.dark,
                }}
                title="Underline"
              >
                U
              </button>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              {(["left", "center", "right"] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setTextAlign(a)}
                  className="px-2 py-1 rounded text-[11px] capitalize"
                  style={{
                    background: textAlign === a ? BRAND.accent : BRAND.light,
                    color: textAlign === a ? BRAND.white : BRAND.dark,
                  }}
                  title={`Align ${a}`}
                >
                  {a.slice(0, 1)}
                </button>
              ))}
            </div>
            <label
              className="flex items-center gap-1 text-[11px] shrink-0"
              style={{ color: BRAND.medium }}
              title="Line height (spacing between lines)"
            >
              <span className="hidden sm:inline">Line</span>
              <span className="sm:hidden">Ln</span>
              <input
                type="number"
                min={0.8}
                max={3}
                step={0.05}
                value={textLineHeight}
                onChange={(e) => setTextLineHeight(Math.max(0.8, Math.min(3, Number(e.target.value) || 1.2)))}
                className="w-12 border rounded px-1 py-1 text-xs"
                style={{ borderColor: BRAND.light, background: BRAND.white }}
                aria-label="Line height"
              />
            </label>
            <label
              className="flex items-center gap-1 text-[11px] shrink-0"
              style={{ color: BRAND.medium }}
              title="Letter spacing (tracking)"
            >
              <span className="hidden sm:inline">Space</span>
              <span className="sm:hidden">Sp</span>
              <input
                type="number"
                min={-5}
                max={40}
                step={0.5}
                value={textLetterSpacing}
                onChange={(e) => setTextLetterSpacing(Math.max(-5, Math.min(40, Number(e.target.value) || 0)))}
                className="w-12 border rounded px-1 py-1 text-xs"
                style={{ borderColor: BRAND.light, background: BRAND.white }}
                aria-label="Letter spacing"
              />
            </label>
          </div>
          {activeColorPicker === "text" && (
            <AdvancedColorPickerPopover
              title="Text Color"
              value={getColorValueForTarget(activeColorPicker)}
              alpha={activeColorAlpha}
              recentColors={recentTextColors}
              palette={{
                primary: BRAND.white,
                alt: BRAND.lightest,
                accent: BRAND.accent,
              }}
              onChange={(value, alpha) => {
                setActiveColorAlpha(alpha);
                setTextColor(value);
              }}
              onSelectRecent={(value) => {
                rememberRecentTextColor(value);
                setTextColor(value);
              }}
              onClose={closeActiveColorPicker}
            />
          )}
        </div>
      )}

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64 xl:w-72 2xl:w-80 flex-shrink-0 border-r flex flex-col" style={{ background: BRAND.white, borderColor: BRAND.light }}>
          <div className="flex-1 overflow-auto">
          {/* Image Tools */}
          <div className="p-4 border-b" style={{ borderColor: BRAND.light }}>
            <h3 className="font-semibold mb-1">Images</h3>
            <p className="text-[11px] mb-3 leading-snug" style={{ color: BRAND.medium }}>
              For side:{" "}
              <span className="font-medium" style={{ color: BRAND.dark }}>
                {getLabel(activePlacement)}
              </span>
              . Uploads stay in this list; use <span className="font-medium" style={{ color: BRAND.dark }}>Add</span>{" "}
              to place on the canvas.
            </p>
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

            {uploadedAssets.length > 0 && (
              <div className="mt-3 pt-3 border-t" style={{ borderColor: BRAND.light }}>
                <p className="text-xs font-medium mb-2" style={{ color: BRAND.medium }}>
                  Uploaded Images ({uploadedAssets.length})
                </p>
                <div className="max-h-40 overflow-auto space-y-2 pr-1">
                  {uploadedAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center gap-2 rounded border p-2"
                      style={{ borderColor: BRAND.light, background: BRAND.lightest }}
                    >
                      <img
                        src={asset.src}
                        alt={asset.name}
                        className="w-10 h-10 rounded object-cover bg-white"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs truncate" style={{ color: BRAND.dark }}>
                          {asset.name}
                        </p>
                        <p className="text-[10px]" style={{ color: BRAND.medium }}>
                          {asset.width}x{asset.height}
                        </p>
                      </div>
                      <button
                        onClick={() => addUploadedAssetToCanvas(asset)}
                        className="px-2 py-1 rounded text-xs"
                        style={{ background: BRAND.accent, color: BRAND.white }}
                        title="Add this uploaded image to canvas"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Layouts */}
          <div className="p-4 border-b" style={{ borderColor: BRAND.light }}>
            <h3 className="font-semibold mb-3">Layouts</h3>
            <p className="text-xs mb-2" style={{ color: BRAND.medium }}>
              Choose a layout style, then drag images to adjust.
            </p>
            <p className="text-xs mb-2" style={{ color: BRAND.medium }}>
              Default mode is Single image.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {basicLayouts.map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => applyLayout(layout.id)}
                  className="rounded border p-1 transition-colors"
                  style={{
                    borderColor: currentLayoutId === layout.id ? BRAND.accent : BRAND.light,
                    background: currentLayoutId === layout.id ? BRAND.lightest : BRAND.white,
                  }}
                  title={layout.name}
                >
                  <LayoutPreview slots={layout.slots} />
                </button>
              ))}
            </div>
            <p className="text-xs mt-2" style={{ color: BRAND.medium }}>
              Active layout: <span style={{ color: BRAND.dark }}>{currentLayout ? currentLayout.name : "Freeform"}</span>
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
                    <button
                      type="button"
                      onClick={() => openColorPickerFor("background")}
                      className="h-8 rounded border px-2 flex items-center gap-2"
                      style={{ borderColor: BRAND.light, background: BRAND.white }}
                      title="Open background color picker"
                    >
                      <span
                        className="w-5 h-5 rounded border"
                        style={{ background: currentBackground.color, borderColor: BRAND.light }}
                      />
                      <span className="text-xs font-mono" style={{ color: BRAND.medium }}>
                        {currentBackground.color.toUpperCase()}
                      </span>
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {COLOR_PRESETS.map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          rememberRecentTextColor(color);
                          updateBackground({ color });
                        }}
                        className="w-6 h-6 rounded border-2 transition-transform hover:scale-110"
                        style={{
                          background: color,
                          borderColor: currentBackground.color === color ? BRAND.dark : BRAND.light,
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                  {activeColorPicker === "background" && (
                    <AdvancedColorPickerPopover
                      title="Background Color"
                      value={currentBackground.color}
                      alpha={activeColorAlpha}
                      recentColors={recentTextColors}
                      palette={{
                        primary: BRAND.white,
                        alt: BRAND.lightest,
                        accent: BRAND.accent,
                      }}
                      onChange={(value, alpha) => {
                        setActiveColorAlpha(alpha);
                        updateBackground({ color: value });
                      }}
                      onSelectRecent={(value) => {
                        rememberRecentTextColor(value);
                        updateBackground({ color: value });
                      }}
                      onClose={closeActiveColorPicker}
                    />
                  )}
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
              type="button"
              onClick={() => setPanelStates(p => ({ ...p, decoratives: !p.decoratives }))}
              className="w-full flex items-center justify-between mb-2"
            >
              <div className="text-left">
                <h3 className="font-semibold">Decorative Elements</h3>
                <p className="text-[10px] font-normal mt-0.5" style={{ color: BRAND.medium }}>
                  Borders & overlays for {getLabel(activePlacement)}
                </p>
              </div>
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

                <p className="text-xs" style={{ color: BRAND.medium }}>
                  Borders can be moved, resized, rotated, and layered.
                </p>

                {/* Active decoratives layer list */}
                {currentDecoratives.length > 0 && (
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: BRAND.light }}>
                    <p className="text-xs font-medium mb-2" style={{ color: BRAND.medium }}>Active Layers</p>
                    <div className="space-y-1">
                      {currentDecoratives.map((dec) => (
                        <button
                          key={dec.id}
                          onClick={() => {
                            setSelectedId(dec.id);
                            setSelectedType("decorative");
                          }}
                          className="w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between"
                          style={{
                            background: selectedId === dec.id ? BRAND.accent : BRAND.lightest,
                            color: selectedId === dec.id ? BRAND.white : BRAND.dark,
                          }}
                        >
                          <span>{dec.name}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const linkedTextId = dec.linkedTextId;
                              setDecoratives((prev) => ({
                                ...prev,
                                [activePlacement]: (prev[activePlacement] || []).filter((d) => d.id !== dec.id),
                              }));
                              if (linkedTextId) {
                                setDesigns((prev) => ({
                                  ...prev,
                                  [activePlacement]: {
                                    ...prev[activePlacement],
                                    texts: (prev[activePlacement]?.texts || []).filter((t) => t.id !== linkedTextId),
                                  },
                                }));
                              }
                              if (selectedId === dec.id) {
                                setSelectedId(null);
                                setSelectedType(null);
                              }
                            }}
                            className="opacity-60 hover:opacity-100"
                            title="Remove"
                          >
                            &times;
                          </button>
                        </button>
                      ))}
                    </div>
                  </div>
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
                    <option value="free">Full canvas (not in a layout slot)</option>
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
                <div className="mb-3 space-y-3">
                  {selectedDecorativeLinkedText && (
                    <div>
                      <label className="text-xs block mb-1" style={{ color: BRAND.medium }}>
                        Label Text
                      </label>
                      <input
                        type="text"
                        value={selectedDecorativeLinkedText.text}
                        onChange={(e) =>
                          setDesigns((prev) => ({
                            ...prev,
                            [activePlacement]: {
                              ...prev[activePlacement],
                              texts: (prev[activePlacement]?.texts || []).map((t) =>
                                t.id === selectedDecorativeLinkedText.id ? { ...t, text: e.target.value } : t
                              ),
                            },
                          }))
                        }
                        className="w-full border rounded px-2 py-2 text-sm"
                        style={{ borderColor: BRAND.light }}
                        placeholder="Type label text..."
                      />
                    </div>
                  )}
                  <div>
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
                </div>
              )}

              {selectedType === "text" && selectedTextItem && (
                <div className="mb-3 space-y-2">
                  <p className="text-xs" style={{ color: BRAND.medium }}>
                    Font, size, color, and alignment are in the <strong>top bar</strong> above the canvas (appears when
                    text is selected).
                  </p>
                  <textarea
                    readOnly
                    tabIndex={-1}
                    value={textInput}
                    rows={2}
                    className="w-full border rounded px-2 py-2 text-sm resize-y bg-gray-50 cursor-default"
                    style={{ borderColor: BRAND.light }}
                    placeholder="Double-click text on the canvas to edit here."
                  />
                </div>
              )}

              <div className="mb-3">
                <label className="text-xs block mb-1" style={{ color: BRAND.medium }}>
                  Rotation (deg)
                </label>
                <input
                  type="number"
                  step={1}
                  value={rotationInput}
                  onChange={(e) => {
                    setRotationInput(e.target.value);
                  }}
                  onBlur={() => {
                    const parsed = Number.parseFloat(rotationInput);
                    if (Number.isNaN(parsed)) {
                      setRotationInput(String(Math.round(selectedRotationDegrees)));
                      return;
                    }
                    const normalized = normalizeDegrees(parsed);
                    setSelectedRotation(normalized);
                    setRotationInput(String(Math.round(normalized)));
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    const parsed = Number.parseFloat(rotationInput);
                    if (Number.isNaN(parsed)) return;
                    const normalized = normalizeDegrees(parsed);
                    setSelectedRotation(normalized);
                    setRotationInput(String(Math.round(normalized)));
                  }}
                  className="w-full border rounded px-2 py-2 text-sm"
                  style={{ borderColor: BRAND.light }}
                />
                <p className="text-[11px] mt-1" style={{ color: BRAND.medium }}>
                  Snaps every {ROTATION_SNAP_STEP}°. Strong snap near 0/90/180/270.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => centerSelected("x")}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded text-sm"
                  style={{ background: BRAND.light, color: BRAND.dark }}
                  title="Center horizontally"
                >
                  Center H
                </button>
                <button
                  onClick={() => centerSelected("y")}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded text-sm"
                  style={{ background: BRAND.light, color: BRAND.dark }}
                  title="Center vertically"
                >
                  Center V
                </button>
                <button
                  onClick={() => centerSelected("both")}
                  className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded text-sm"
                  style={{ background: BRAND.light, color: BRAND.dark }}
                  title="Center horizontally and vertically"
                >
                  Center Both
                </button>
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
                      {getLabel(p)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="text-xs block mb-1" style={{ color: BRAND.medium }}>
                  ArtKey
                </label>
                <select
                  value={selectedArtKeyTemplateId}
                  onChange={(e) => setSelectedArtKeyTemplateId(e.target.value)}
                  className="w-full border rounded px-2 py-2 text-sm"
                  style={{ borderColor: BRAND.light }}
                >
                  {availableArtKeyTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-xs" style={{ color: BRAND.medium }}>
                {hasQrOnCurrentSurface ? "Drag the ArtKey to position it." : `Switch to ${getLabel(qrPlacement)} to see the ArtKey.`}
              </p>

              <div className="mt-2 text-xs" style={{ color: BRAND.medium }}>
                QR target: ~{TARGET_QR_INCHES} inch at {productSpec.printDpi} DPI
              </div>
            </div>
          )}

          <div className="p-4">
            <div className="p-3 rounded" style={{ background: BRAND.lightest, border: `1px solid ${BRAND.light}` }}>
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
        <div ref={canvasContainerRef} className="flex-1 min-h-0 w-full overflow-hidden p-2 lg:p-2.5 flex flex-col items-center justify-center min-w-0">
          {productSpec.placements.length > 1 && (
            <div className="lg:hidden w-full max-w-full shrink-0 pb-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-center mb-1.5" style={{ color: BRAND.medium }}>
                Print side
              </p>
              <div className="flex gap-1.5 overflow-x-auto justify-center">
              {productSpec.placements.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => switchPlacement(p)}
                  className="shrink-0 px-3 py-1.5 rounded-md text-xs font-medium border"
                  style={{
                    borderColor: activePlacement === p ? BRAND.accent : BRAND.light,
                    background: activePlacement === p ? BRAND.accent : BRAND.white,
                    color: activePlacement === p ? BRAND.white : BRAND.dark,
                  }}
                >
                  {getLabel(p)}
                </button>
              ))}
              </div>
            </div>
          )}
          <div className="inline-block rounded-lg shadow-xl overflow-hidden relative max-w-full" style={{ background: BRAND.white, border: `1px solid ${BRAND.light}` }}>
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
                  {/* Canvas center guides */}
                  <Line
                    points={[canvasWidth / 2, 0, canvasWidth / 2, canvasHeight]}
                    stroke="#94a3b8"
                    strokeWidth={1}
                    dash={[6, 6]}
                    opacity={0.45}
                    listening={false}
                  />
                  <Line
                    points={[0, canvasHeight / 2, canvasWidth, canvasHeight / 2]}
                    stroke="#94a3b8"
                    strokeWidth={1}
                    dash={[6, 6]}
                    opacity={0.45}
                    listening={false}
                  />

                  {/* Slot guides */}
                  {slotRects.map((s, i) => (
                    <Group key={`slot-guide-${i}`} listening={false}>
                      {currentLayoutId !== DEFAULT_LAYOUT_ID && !occupiedLayoutSlots.has(i) && (
                        <Rect
                          x={s.x}
                          y={s.y}
                          width={s.width}
                          height={s.height}
                          cornerRadius={8}
                          fill={hoverSlotIndex === i ? "#47556914" : "#4755690d"}
                          stroke={hoverSlotIndex === i ? BRAND.accent : "#94a3b8"}
                          strokeWidth={hoverSlotIndex === i ? 2 : 1}
                          dash={[10, 7]}
                          opacity={0.72}
                          listening={false}
                        />
                      )}
                    </Group>
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

                  {/* Borders always sit behind artwork and are click-through unless selected. */}
                  {borderDecoratives.map((dec) => {
                    const loaded = loadedDecoratives.get(dec.id);
                    if (!loaded) return null;

                    const isActive = selectedId === dec.id && selectedType === "decorative";

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
                        draggable={isActive}
                        listening={isActive}
                        onClick={() => {
                          setSelectedId(dec.id);
                          setSelectedType("decorative");
                        }}
                        onTap={() => {
                          setSelectedId(dec.id);
                          setSelectedType("decorative");
                        }}
                        onDragMove={(e) => handleDecorativeDragMove(dec.id, e.target)}
                        onDragEnd={(e) => handleDecorativeDragEnd(dec.id, e.target)}
                        onTransformEnd={(e) => handleDecorativeTransformEnd(dec.id, e.target)}
                      />
                    );
                  })}

                  {/* Images (above borders/frames) */}
                  {(currentDesign.images || []).map((img) => {
                    const loaded = loadedImages.get(img.id);
                    if (!loaded) return null;

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
                            onDragMove={(e) => handleImageDragMove(img.id, e.target)}
                            onDragEnd={(e) => handleImageDragEnd(img.id, e.target)}
                            onTransformEnd={(e) => handleImageTransformEnd(img.id, e.target)}
                          />
                        </Group>
                      );
                    }

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
                        onDragMove={(e) => handleImageDragMove(img.id, e.target)}
                        onDragEnd={(e) => handleImageDragEnd(img.id, e.target)}
                        onTransformEnd={(e) => handleImageTransformEnd(img.id, e.target)}
                      />
                    );
                  })}

                  {/* Text (above images) */}
                  {(currentDesign.texts || []).filter((t) => !linkedDecorativeTextIds.has(t.id)).map((t) => {
                    const textWidth = Math.max(1, t.width || Math.round(canvasWidth * 0.6));
                    const labelShape: TextLabelShape = "none";
                    const labelHeight = getLabelBoxHeight(t);
                    const labelPadding = Math.max(0, t.labelPadding ?? 0);
                    const labelFillEnabled = t.labelFillEnabled ?? labelShape !== "none";
                    const labelFillColor = t.labelFillColor || BRAND.white;
                    const labelBorderEnabled =
                      t.labelBorderEnabled ?? Math.max(0, t.labelOuterStrokeWidth ?? 0, t.labelInnerStrokeWidth ?? 0) > 0;
                    const labelOuterStrokeColor = t.labelOuterStrokeColor || t.labelBorderColor || BRAND.dark;
                    const labelInnerStrokeColor = t.labelInnerStrokeColor || BRAND.medium;
                    const labelOuterStrokeWidth = Math.max(0, t.labelOuterStrokeWidth ?? t.labelBorderWidth ?? 2);
                    const labelInnerStrokeWidth = Math.max(0, t.labelInnerStrokeWidth ?? 1.2);
                    const labelCornerRadius = Math.max(0, t.labelCornerRadius ?? Math.round(t.fontSize * 0.3));
                    const textHeight = labelShape === "none" ? undefined : labelHeight;
                    const hitHeight =
                      labelShape === "circle" || labelShape === "square"
                        ? textWidth
                        : textHeight ?? Math.max(24, Math.round((t.fontSize || 16) * ((t.lineHeight ?? 1.2) + 0.8)));

                    const isActiveText = selectedId === t.id && selectedType === "text";
                    const isInlineEditing = canvasTextEditId === t.id;

                    return (
                      <Group
                        key={t.id}
                        id={t.id}
                        x={t.x}
                        y={t.y}
                        rotation={t.rotation}
                        draggable={isActiveText && !isInlineEditing}
                        onClick={() => {
                          if (canvasTextEditId && canvasTextEditId !== t.id) {
                            setCanvasTextEditId(null);
                          }
                          setSelectedId(t.id);
                          setSelectedType("text");
                        }}
                        onTap={() => {
                          if (canvasTextEditId && canvasTextEditId !== t.id) {
                            setCanvasTextEditId(null);
                          }
                          setSelectedId(t.id);
                          setSelectedType("text");
                        }}
                        onDblClick={(e) => {
                          e.cancelBubble = true;
                          setSelectedId(t.id);
                          setSelectedType("text");
                          setTextInput(t.text);
                          setCanvasTextEditId(t.id);
                        }}
                        onDblTap={(e) => {
                          e.cancelBubble = true;
                          setSelectedId(t.id);
                          setSelectedType("text");
                          setTextInput(t.text);
                          setCanvasTextEditId(t.id);
                        }}
                        onDragEnd={(e) => handleTextDragEnd(t.id, e.target)}
                        onTransformEnd={(e) => handleTextTransformEnd(t.id, e.target)}
                      >
                        <Rect
                          x={0}
                          y={0}
                          width={textWidth}
                          height={hitHeight}
                          fill="rgba(0,0,0,0.001)"
                          strokeEnabled={false}
                        />
                        {labelShape !== "none" &&
                          (labelShape === "rectangle" || labelShape === "square" || labelShape === "rounded") && (
                            <Rect
                              x={0}
                              y={0}
                              width={textWidth}
                              height={labelShape === "square" ? textWidth : labelHeight}
                              cornerRadius={labelShape === "rounded" ? labelCornerRadius : 0}
                              fill={labelFillEnabled ? labelFillColor : undefined}
                              stroke={labelBorderEnabled ? labelOuterStrokeColor : undefined}
                              strokeWidth={labelBorderEnabled ? labelOuterStrokeWidth : 0}
                              listening={false}
                            />
                          )}
                        {labelShape !== "none" &&
                          (labelShape === "rectangle" || labelShape === "square" || labelShape === "rounded") &&
                          labelBorderEnabled &&
                          labelInnerStrokeWidth > 0 && (
                            <Rect
                              x={labelOuterStrokeWidth + 2}
                              y={labelOuterStrokeWidth + 2}
                              width={Math.max(1, textWidth - (labelOuterStrokeWidth + 2) * 2)}
                              height={Math.max(
                                1,
                                (labelShape === "square" ? textWidth : labelHeight) - (labelOuterStrokeWidth + 2) * 2
                              )}
                              cornerRadius={
                                labelShape === "rounded"
                                  ? Math.max(0, labelCornerRadius - (labelOuterStrokeWidth + 2))
                                  : 0
                              }
                              fillEnabled={false}
                              stroke={labelInnerStrokeColor}
                              strokeWidth={labelInnerStrokeWidth}
                              listening={false}
                            />
                          )}

                        {labelShape !== "none" && labelShape === "circle" && (
                          <>
                            <Circle
                              x={textWidth / 2}
                              y={textWidth / 2}
                              radius={textWidth / 2}
                              fill={labelFillEnabled ? labelFillColor : undefined}
                              stroke={labelBorderEnabled ? labelOuterStrokeColor : undefined}
                              strokeWidth={labelBorderEnabled ? labelOuterStrokeWidth : 0}
                              listening={false}
                            />
                            <Circle
                              x={textWidth / 2}
                              y={textWidth / 2}
                              radius={Math.max(1, textWidth / 2 - labelOuterStrokeWidth - 2)}
                              fillEnabled={false}
                              stroke={labelBorderEnabled ? labelInnerStrokeColor : undefined}
                              strokeWidth={labelBorderEnabled ? labelInnerStrokeWidth : 0}
                              listening={false}
                            />
                          </>
                        )}

                        <KonvaText
                          key={t.id}
                          text={t.text || "\u00a0"}
                          x={0}
                          y={0}
                          width={textWidth}
                          height={labelShape === "circle" || labelShape === "square" ? textWidth : textHeight}
                          padding={labelPadding}
                          verticalAlign={labelShape === "none" ? undefined : "middle"}
                          fontSize={t.fontSize}
                          fontFamily={t.fontFamily}
                          fill={t.fill}
                          fontStyle={t.fontStyle}
                          align={t.align}
                          textDecoration={t.textDecoration}
                          lineHeight={t.lineHeight ?? 1.2}
                          letterSpacing={t.letterSpacing ?? 0}
                          listening={false}
                          opacity={isInlineEditing ? 0 : 1}
                        />
                      </Group>
                    );
                  })}

                  {/* Label art and modern mirrored elements render above images/text. */}
                  {frontDecoratives.map((dec) => {
                    const loaded = loadedDecoratives.get(dec.id);
                    if (!loaded) return null;

                    const isActive = selectedId === dec.id && selectedType === "decorative";
                    const linkedText = dec.linkedTextId
                      ? (currentDesign.texts || []).find((t) => t.id === dec.linkedTextId)
                      : undefined;

                    return (
                      <Group
                        key={dec.id}
                        id={dec.id}
                        x={dec.x}
                        y={dec.y}
                        rotation={dec.rotation}
                        opacity={dec.opacity}
                        draggable={isActive}
                        onClick={() => {
                          setSelectedId(dec.id);
                          setSelectedType("decorative");
                        }}
                        onTap={() => {
                          setSelectedId(dec.id);
                          setSelectedType("decorative");
                        }}
                        onDblClick={() => {
                          if (!linkedText) return;
                          const next = window.prompt("Edit label text", linkedText.text);
                          if (next === null) return;
                          setDesigns((prev) => ({
                            ...prev,
                            [activePlacement]: {
                              ...prev[activePlacement],
                              texts: (prev[activePlacement]?.texts || []).map((t) =>
                                t.id === linkedText.id ? { ...t, text: next } : t
                              ),
                            },
                          }));
                        }}
                        onDblTap={() => {
                          if (!linkedText) return;
                          const next = window.prompt("Edit label text", linkedText.text);
                          if (next === null) return;
                          setDesigns((prev) => ({
                            ...prev,
                            [activePlacement]: {
                              ...prev[activePlacement],
                              texts: (prev[activePlacement]?.texts || []).map((t) =>
                                t.id === linkedText.id ? { ...t, text: next } : t
                              ),
                            },
                          }));
                        }}
                        onDragEnd={(e) => handleDecorativeDragEnd(dec.id, e.target)}
                        onTransformEnd={(e) => handleDecorativeTransformEnd(dec.id, e.target)}
                      >
                        <KonvaImage
                          image={loaded}
                          x={0}
                          y={0}
                          width={dec.width}
                          height={dec.height}
                        />
                        {linkedText && (
                          <KonvaText
                            text={linkedText.text}
                            x={Math.max(0, linkedText.x - dec.x)}
                            y={Math.max(0, linkedText.y - dec.y)}
                            width={Math.max(1, linkedText.width || Math.round(dec.width * 0.72))}
                            padding={Math.max(0, linkedText.labelPadding ?? 0)}
                            fontSize={linkedText.fontSize}
                            fontFamily={linkedText.fontFamily}
                            fill={linkedText.fill}
                            fontStyle={linkedText.fontStyle}
                            align={linkedText.align}
                            textDecoration={linkedText.textDecoration}
                            lineHeight={linkedText.lineHeight ?? 1.2}
                            letterSpacing={linkedText.letterSpacing ?? 0}
                            listening={false}
                          />
                        )}
                      </Group>
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
                          crop={templateCrop}
                          draggable
                          onDragEnd={(e) => handleQrDragEnd(e.target)}
                        />
                      )}

                      {qrImageObj && (
                        <KonvaImage
                          id="qr-code"
                          image={qrImageObj}
                          x={currentDesign.qrCode.x + currentDesign.qrCode.width * qrXFraction}
                          y={currentDesign.qrCode.y + currentDesign.qrCode.height * qrYFraction}
                          width={currentDesign.qrCode.width * qrSizeFraction}
                          height={currentDesign.qrCode.width * qrSizeFraction}
                          listening={false}
                        />
                      )}
                    </>
                  )}
                  {/* Transformer inside scaled group so handles share the same coordinate space as selected nodes */}
                  <Transformer
                    ref={transformerRef}
                    anchorSize={14}
                    anchorCornerRadius={3}
                    borderStroke={BRAND.accent}
                    borderStrokeWidth={1.5}
                    anchorStroke={BRAND.accent}
                    anchorFill={BRAND.white}
                    rotateEnabled={selectedType !== "text"}
                    rotateAnchorOffset={30}
                    rotateAnchorCursor="grab"
                    rotationSnaps={rotationSnaps}
                    rotationSnapTolerance={ROTATION_SNAP_TOLERANCE}
                    keepRatio={false}
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
                </Group>
              </Layer>
            </Stage>
          </div>
          <p className="text-[11px] mt-2 text-center max-w-[min(100%,48rem)] px-2 leading-snug" style={{ color: BRAND.medium }}>
            <span className="font-medium" style={{ color: BRAND.dark }}>
              {getLabel(activePlacement)}
            </span>
            {" · "}
            {canvasWidth}×{canvasHeight}px print area
            {productSpec.printDpi ? ` · ${productSpec.printDpi} DPI` : ""}
          </p>
        </div>

        {/* Right Sidebar - surface previews (uniform card sizes) */}
        <div className="hidden lg:block w-52 xl:w-56 2xl:w-64 flex-shrink-0 border-l p-3 2xl:p-4 overflow-auto" style={{ background: BRAND.white, borderColor: BRAND.light }}>
          <h3 className="font-semibold mb-1 text-sm">Print sides</h3>
          <p className="text-[10px] mb-3 leading-snug" style={{ color: BRAND.medium }}>
            Click a thumbnail to edit that surface. Each side has its own layers and layout.
          </p>

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
                    className="relative bg-white mx-auto overflow-hidden rounded-sm border"
                    style={{ width: "100%", aspectRatio: "4 / 3", borderColor: BRAND.light }}
                  >
                    {surfacePreviews[p] ? (
                      <img
                        src={surfacePreviews[p]}
                        alt={`${getLabel(p)} preview`}
                        className="w-full h-full object-contain"
                        draggable={false}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: BRAND.medium }}>
                        No preview yet
                      </div>
                    )}
                  </div>
                </div>
                <div className="px-2 pb-2">
                  <div className="rounded-sm bg-white border px-2 py-1.5" style={{ borderColor: BRAND.light }}>
                    <div className="text-xs font-medium text-left" style={{ color: BRAND.dark }}>
                      {getLabel(p)}
                    </div>
                    <div className="text-[10px] mt-0.5 text-left" style={{ color: BRAND.medium }}>
                      {qrPlacement === p && productSpec.requiresQrCode
                        ? "ArtKey surface"
                        : `${(designs[p]?.images?.length || 0) + (designs[p]?.texts?.length || 0) + (decoratives[p]?.length || 0)} items`}
                    </div>
                  </div>
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

      {canvasTextEditId &&
        inlineEditLayout &&
        typeof document !== "undefined" &&
        createPortal(
          <textarea
            ref={canvasInlineTextRef}
            value={inlineTextDraft}
            onChange={(e) => {
              const v = e.target.value;
              setInlineTextDraft(v);
              setTextInput(v);
              updateTextById(canvasTextEditId, { text: v });
            }}
            onBlur={() => setCanvasTextEditId(null)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                (e.target as HTMLTextAreaElement).blur();
                setCanvasTextEditId(null);
              }
            }}
            onMouseDown={(e) => e.stopPropagation()}
            rows={3}
            className="rounded-sm shadow-lg outline-none border-2"
            style={{
              position: "fixed",
              zIndex: 10000,
              left: inlineEditLayout.left,
              top: inlineEditLayout.top,
              width: inlineEditLayout.width,
              minHeight: Math.max(inlineEditLayout.height, inlineEditLayout.fontSizePx * 2.5),
              fontSize: inlineEditLayout.fontSizePx,
              fontFamily: inlineEditLayout.fontFamily,
              color: inlineEditLayout.color,
              fontWeight: inlineEditLayout.fontWeight as React.CSSProperties["fontWeight"],
              fontStyle: inlineEditLayout.fontStyle as React.CSSProperties["fontStyle"],
              textAlign: inlineEditLayout.textAlign as React.CSSProperties["textAlign"],
              lineHeight: inlineEditLayout.lineHeight,
              letterSpacing: `${inlineEditLayout.letterSpacingPx}px`,
              textDecoration: inlineEditLayout.textDecoration as React.CSSProperties["textDecoration"],
              padding: 4,
              margin: 0,
              resize: "none",
              overflow: "auto",
              background: "rgba(255,255,255,0.96)",
              boxSizing: "border-box",
              borderColor: BRAND.accent,
            }}
            aria-label="Edit text on canvas"
          />,
          document.body
        )}
    </div>
  );
}

export default CustomizationStudio;
