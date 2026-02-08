/**
 * CustomizationStudio — The Artful Experience
 *
 * Layout:
 *   ┌───────────────────────────────────────────────────────────────┐
 *   │  Header (brand)  |  Product Name  |  Undo/Redo  Zoom  Save   │
 *   ├───────────────────────────────────────────────────────────────┤
 *   │  Surface: [ Front ] [ Back ] [ Inside L ] [ Inside R ]       │
 *   ├───────────────────────────────────────────────────────────────┤
 *   │  Toolbar: Images | Text | Layouts | Assets | Labels | BG     │
 *   ├────────────┬──────────────────────────────────────────────────┤
 *   │ Tool Panel │              Canvas Area                         │
 *   │ (left)     │              (center, zoomable)                  │
 *   │ + Props    │                                                  │
 *   └────────────┴──────────────────────────────────────────────────┘
 *
 * - Text/Label editing: click text on canvas to edit inline
 * - Properties: shown in left panel under the relevant tab
 * - No right sidebar — everything is in left panel or on canvas
 */

"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { Stage, Layer, Image as KonvaImage, Rect, Transformer, Text, Group, Line, Ellipse as KonvaEllipse, Circle as KonvaCircle } from "react-konva";
import Konva from "konva";

import {
  Placement,
  ProductSpec,
  ImageItem,
  TextItem,
  DesignState,
} from "./types";
import { COLLAGE_LAYOUTS, getLayoutById } from "./layouts";
import QRCode from "qrcode";
import {
  getDisplayScale,
  generateId,
  fitImageToSlot,
  centerInSlot,
  PLACEMENT_LABELS,
} from "./utils";

// ============================================================================
// FONTS
// ============================================================================
const FONT_OPTIONS = [
  { name: "Arial", family: "Arial, sans-serif" },
  { name: "Georgia", family: "Georgia, serif" },
  { name: "Playfair Display", family: "Playfair Display, serif" },
  { name: "Times New Roman", family: "Times New Roman, serif" },
  { name: "Verdana", family: "Verdana, sans-serif" },
  { name: "Trebuchet MS", family: "Trebuchet MS, sans-serif" },
  { name: "Palatino", family: "Palatino Linotype, serif" },
  { name: "Garamond", family: "Garamond, serif" },
  { name: "Courier New", family: "Courier New, monospace" },
  { name: "Impact", family: "Impact, sans-serif" },
];

// ============================================================================
// ZOOM
// ============================================================================
const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3];
const DEFAULT_ZOOM_INDEX = 3;

// ============================================================================
// TOOL TABS
// ============================================================================
type ToolTab = "images" | "text" | "layouts" | "accents" | "labels";

const TOOL_TAB_META: { id: ToolTab; label: string; icon: string; hint: string }[] = [
  { id: "images", label: "Images", icon: "🖼", hint: "Upload and manage photos or artwork" },
  { id: "text", label: "Text", icon: "T", hint: "Add and style text on your design" },
  { id: "layouts", label: "Layouts", icon: "⊞", hint: "Arrange multiple images in a grid layout" },
  { id: "accents", label: "Accents", icon: "✦", hint: "Add decorative accents and borders" },
  { id: "labels", label: "Labels", icon: "🏷", hint: "Add shapes, ribbons, and text labels" },
];

// ============================================================================
// COLOR PICKER — honeycomb swatch grid + HSV slider + hex input
// ============================================================================

// Honeycomb palette rows (approximates the classic web color circle).
// Each row is an array of hex colors; rows are centered to form a diamond/hex shape.
const HONEYCOMB_ROWS: string[][] = [
  // Row 1 (7) — dark blues / navy
  ["#003366","#336699","#3366CC","#003399","#000099","#0000CC","#000066"],
  // Row 2 (8) — teals / blues
  ["#006666","#006699","#0099CC","#0066CC","#0033CC","#0000FF","#3333FF","#333399"],
  // Row 3 (9) — greens / cyans / blues / purples
  ["#669999","#009999","#33CCCC","#00CCFF","#0099FF","#0066FF","#3366FF","#3333CC","#663399"],
  // Row 4 (10) — greens / cyans / light blues / violets
  ["#339966","#00CC99","#00FFCC","#00FFFF","#33CCFF","#3399FF","#6699FF","#6666FF","#6633FF","#6600CC"],
  // Row 5 (11) — greens / light greens / white center / pinks / purples
  ["#339933","#00CC66","#00FF99","#66FFCC","#66FFFF","#66CCFF","#99CCFF","#9999FF","#9966FF","#9933FF","#9900FF"],
  // Row 6 (12) — center row — bright greens → white → bright magentas
  ["#006600","#00CC00","#00FF00","#66FF99","#99FFCC","#CCFFFF","#FFFFFF","#FFCCFF","#FF99FF","#FF66FF","#FF00FF","#CC00CC"],
  // Row 7 (11) — yellow-greens / yellows / pinks
  ["#333300","#669900","#99FF33","#CCFF66","#FFFFCC","#FFCCCC","#FF99CC","#FF66CC","#FF33CC","#CC0099","#993399"],
  // Row 8 (10) — olives / yellows / oranges / reds
  ["#336600","#99CC00","#CCFF33","#FFFF66","#FFCC66","#FF9999","#FF6699","#FF3399","#CC3399","#990099"],
  // Row 9 (9) — dark greens / yellows / oranges / reds
  ["#666633","#99CC33","#CCCC33","#FFCC00","#FF9933","#FF6666","#FF0066","#CC0066","#660033"],
  // Row 10 (8) — dark olives / golds / reds / maroons
  ["#333333","#666600","#999900","#CC9900","#FF6600","#FF3333","#CC0000","#660000"],
  // Row 11 (7) — grays / browns / dark reds
  ["#999999","#996633","#993300","#CC3300","#FF0000","#CC0033","#330000"],
];

function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, v: 0 };
  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}

function ColorPicker({
  value,
  onChange,
  className = "",
}: {
  value: string;
  onChange: (hex: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [showSlider, setShowSlider] = useState(false);
  const [hsv, setHsv] = useState(() => hexToHsv(value || "#000000"));
  const [hexInput, setHexInput] = useState(value || "#000000");
  const popRef = useRef<HTMLDivElement>(null);
  const svRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Sync external value
  useEffect(() => {
    if (value) {
      setHsv(hexToHsv(value));
      setHexInput(value);
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node) &&
          btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  function pick(hex: string) {
    const h = hexToHsv(hex);
    setHsv(h);
    setHexInput(hex);
    onChange(hex);
  }

  function emitHsv(h: number, s: number, v: number) {
    const hex = hsvToHex(h, s, v);
    setHsv({ h, s, v });
    setHexInput(hex);
    onChange(hex);
  }

  function handleSV(e: React.MouseEvent | MouseEvent) {
    if (!svRef.current) return;
    const r = svRef.current.getBoundingClientRect();
    const s = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    const v = Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / r.height));
    emitHsv(hsv.h, s, v);
  }

  function handleHue(e: React.MouseEvent | MouseEvent) {
    if (!hueRef.current) return;
    const r = hueRef.current.getBoundingClientRect();
    const h = Math.max(0, Math.min(359, ((e.clientX - r.left) / r.width) * 360));
    emitHsv(h, hsv.s, hsv.v);
  }

  function startDrag(handler: (e: MouseEvent) => void) {
    const onMove = (e: MouseEvent) => handler(e);
    const onUp = () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function handleHexInput(val: string) {
    setHexInput(val);
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      setHsv(hexToHsv(val));
      onChange(val);
    }
  }

  const hueColor = hsvToHex(hsv.h, 1, 1);
  const currentHex = value || "#000000";

  // Compute portal position from button rect
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // If not enough room below (~400px for full picker), open above
      const top = spaceBelow < 400 ? rect.top + window.scrollY - 10 : rect.bottom + window.scrollY + 4;
      setPos({ top, left: Math.max(4, Math.min(rect.left + window.scrollX, window.innerWidth - 300)) });
    }
  }, [open]);

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Swatch button */}
      <button ref={btnRef} type="button" onClick={() => setOpen(!open)}
        className="w-7 h-7 rounded border border-gray-300 cursor-pointer p-0.5 hover:border-gray-500 transition-colors"
        style={{ backgroundColor: currentHex }} title={currentHex} />

      {open && pos && createPortal(
        <div ref={popRef}
          className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 p-4"
          style={{ zIndex: 9999, top: pos.top, left: pos.left, width: 340 }}>

          {/* Honeycomb color swatches */}
          <div className="flex flex-col items-center gap-[3px] mb-3">
            {HONEYCOMB_ROWS.map((row, ri) => (
              <div key={ri} className="flex gap-[3px] justify-center">
                {row.map((c) => (
                  <button key={c} type="button" onClick={() => pick(c)}
                    className="rounded-sm hover:scale-[1.3] transition-transform hover:z-10 shrink-0"
                    style={{
                      width: 22, height: 22,
                      backgroundColor: c,
                      border: c === currentHex ? "2.5px solid #000" : (c === "#FFFFFF" ? "1px solid #ccc" : "1px solid transparent"),
                      outline: c === currentHex ? "2px solid #555" : undefined,
                      outlineOffset: 1,
                    }}
                    title={c} />
                ))}
              </div>
            ))}
          </div>

          {/* Hex input row */}
          <div className="flex items-center gap-3 mb-2 mt-2">
            <span className="w-8 h-8 rounded border border-gray-300 shrink-0" style={{ backgroundColor: currentHex }} />
            <span className="text-xs text-gray-500 font-semibold">HEX</span>
            <input type="text" value={hexInput.toUpperCase()}
              onChange={(e) => handleHexInput(e.target.value)}
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm font-mono text-center"
              maxLength={7} />
          </div>

          {/* "More Colors" toggle */}
          <button type="button" onClick={() => setShowSlider(!showSlider)}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-1.5">
            {showSlider ? "▲ Hide Slider" : "▼ More Colors..."}
          </button>

          {showSlider && (
            <div className="mt-2">
              {/* SV gradient */}
              <div ref={svRef}
                className="w-full h-[160px] rounded cursor-crosshair relative mb-3"
                style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueColor})` }}
                onMouseDown={(e) => { handleSV(e); startDrag(handleSV); }}>
                <div className="absolute w-4 h-4 rounded-full border-2 border-white pointer-events-none"
                  style={{
                    left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`,
                    transform: "translate(-50%, -50%)",
                    boxShadow: "0 0 3px rgba(0,0,0,0.6)",
                  }} />
              </div>
              {/* Hue bar */}
              <div ref={hueRef}
                className="w-full h-4 rounded-full cursor-pointer relative"
                style={{ background: "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)" }}
                onMouseDown={(e) => { handleHue(e); startDrag(handleHue); }}>
                <div className="absolute w-5 h-5 rounded-full border-2 border-white pointer-events-none"
                  style={{
                    left: `${(hsv.h / 360) * 100}%`, top: "50%",
                    transform: "translate(-50%, -50%)",
                    boxShadow: "0 0 3px rgba(0,0,0,0.5)",
                    backgroundColor: hueColor,
                  }} />
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

// ============================================================================
// BUILT-IN LABEL SHAPES (generated as SVG data URIs)
// ============================================================================
// Shape types for Konva rendering
type ShapeKind = "rect" | "roundedRect" | "ellipse" | "circle" | "polygon";

type BuiltInShape = {
  id: string;
  name: string;
  svg: string;       // data URI (for thumbnail only)
  aspectRatio: number; // w/h
  kind: ShapeKind;
  cornerRadius?: number; // for roundedRect
  // Polygon points as fractions [0..1] of width/height: [x1,y1, x2,y2, ...]
  polyPoints?: number[];
};

function makeShapeSvg(inner: string, w: number, h: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><rect x="2" y="2" width="${w - 4}" height="${h - 4}" rx="4" fill="none" stroke="#222222" stroke-width="6"/><rect x="10" y="10" width="${w - 20}" height="${h - 20}" rx="2" fill="none" stroke="#333333" stroke-width="2"/>${inner}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const BUILTIN_SHAPES: BuiltInShape[] = [
  // Rectangle — thin inner / thick outer
  {
    id: "shape-rect",
    name: "Rectangle",
    aspectRatio: 2,
    kind: "rect",
    svg: makeShapeSvg("", 300, 150),
  },
  // Square
  {
    id: "shape-square",
    name: "Square",
    aspectRatio: 1,
    kind: "rect",
    svg: makeShapeSvg("", 200, 200),
  },
  // Wide banner
  {
    id: "shape-banner",
    name: "Banner",
    aspectRatio: 3.5,
    kind: "rect",
    svg: makeShapeSvg("", 420, 120),
  },
  // Tall rectangle
  {
    id: "shape-tall",
    name: "Tall",
    aspectRatio: 0.6,
    kind: "rect",
    svg: makeShapeSvg("", 150, 250),
  },
  // Rounded rectangle
  {
    id: "shape-rounded",
    name: "Rounded",
    aspectRatio: 2,
    kind: "roundedRect",
    cornerRadius: 20,
    svg: (() => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 150" width="300" height="150"><rect x="2" y="2" width="296" height="146" rx="20" fill="none" stroke="#222222" stroke-width="6"/><rect x="10" y="10" width="280" height="130" rx="16" fill="none" stroke="#333333" stroke-width="2"/></svg>`;
      return `data:image/svg+xml,${encodeURIComponent(svg)}`;
    })(),
  },
  // Oval / Ellipse
  {
    id: "shape-oval",
    name: "Oval",
    aspectRatio: 1.8,
    kind: "ellipse",
    svg: (() => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 166" width="300" height="166"><ellipse cx="150" cy="83" rx="144" ry="77" fill="none" stroke="#222222" stroke-width="6"/><ellipse cx="150" cy="83" rx="136" ry="69" fill="none" stroke="#333333" stroke-width="2"/></svg>`;
      return `data:image/svg+xml,${encodeURIComponent(svg)}`;
    })(),
  },
  // Circle
  {
    id: "shape-circle",
    name: "Circle",
    aspectRatio: 1,
    kind: "circle",
    svg: (() => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><circle cx="100" cy="100" r="94" fill="none" stroke="#222222" stroke-width="6"/><circle cx="100" cy="100" r="86" fill="none" stroke="#333333" stroke-width="2"/></svg>`;
      return `data:image/svg+xml,${encodeURIComponent(svg)}`;
    })(),
  },
  // Ribbon left
  {
    id: "shape-ribbon-left",
    name: "Ribbon Left",
    aspectRatio: 3,
    kind: "polygon",
    // points as fractions: [x/w, y/h, ...]
    polyPoints: [30/360, 0, 1, 0, 1, 1, 30/360, 1, 0, 0.5],
    svg: (() => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" width="360" height="120"><polygon points="30,2 358,2 358,118 30,118 2,60" fill="none" stroke="#222222" stroke-width="6" stroke-linejoin="round"/><polygon points="38,10 350,10 350,110 38,110 12,60" fill="none" stroke="#333333" stroke-width="2" stroke-linejoin="round"/></svg>`;
      return `data:image/svg+xml,${encodeURIComponent(svg)}`;
    })(),
  },
  // Ribbon center (both ends pointed)
  {
    id: "shape-ribbon-center",
    name: "Ribbon",
    aspectRatio: 3,
    kind: "polygon",
    polyPoints: [30/360, 0, 330/360, 0, 1, 0.5, 330/360, 1, 30/360, 1, 0, 0.5],
    svg: (() => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" width="360" height="120"><polygon points="30,2 330,2 358,60 330,118 30,118 2,60" fill="none" stroke="#222222" stroke-width="6" stroke-linejoin="round"/><polygon points="38,10 322,10 350,60 322,110 38,110 12,60" fill="none" stroke="#333333" stroke-width="2" stroke-linejoin="round"/></svg>`;
      return `data:image/svg+xml,${encodeURIComponent(svg)}`;
    })(),
  },
  // Ribbon right
  {
    id: "shape-ribbon-right",
    name: "Ribbon Right",
    aspectRatio: 3,
    kind: "polygon",
    polyPoints: [0, 0, 330/360, 0, 1, 0.5, 330/360, 1, 0, 1],
    svg: (() => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" width="360" height="120"><polygon points="2,2 330,2 358,60 330,118 2,118" fill="none" stroke="#222222" stroke-width="6" stroke-linejoin="round"/><polygon points="10,10 322,10 348,60 322,110 10,110" fill="none" stroke="#333333" stroke-width="2" stroke-linejoin="round"/></svg>`;
      return `data:image/svg+xml,${encodeURIComponent(svg)}`;
    })(),
  },
  // Diamond
  {
    id: "shape-diamond",
    name: "Diamond",
    aspectRatio: 1.2,
    kind: "polygon",
    polyPoints: [0.5, 0, 1, 0.5, 0.5, 1, 0, 0.5],
    svg: (() => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 200" width="240" height="200"><polygon points="120,4 236,100 120,196 4,100" fill="none" stroke="#222222" stroke-width="6" stroke-linejoin="round"/><polygon points="120,16 224,100 120,184 16,100" fill="none" stroke="#333333" stroke-width="2" stroke-linejoin="round"/></svg>`;
      return `data:image/svg+xml,${encodeURIComponent(svg)}`;
    })(),
  },
  // Hexagon
  {
    id: "shape-hexagon",
    name: "Hexagon",
    aspectRatio: 1.15,
    kind: "polygon",
    polyPoints: [58/230, 0, 172/230, 0, 1, 0.5, 172/230, 1, 58/230, 1, 0, 0.5],
    svg: (() => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 230 200" width="230" height="200"><polygon points="58,4 172,4 228,100 172,196 58,196 2,100" fill="none" stroke="#222222" stroke-width="6" stroke-linejoin="round"/><polygon points="64,14 166,14 218,100 166,186 64,186 12,100" fill="none" stroke="#333333" stroke-width="2" stroke-linejoin="round"/></svg>`;
      return `data:image/svg+xml,${encodeURIComponent(svg)}`;
    })(),
  },
];

// ============================================================================
// LABEL ITEM (SVG label converted to editable textbox)
// ============================================================================
export type LabelItem = {
  id: string;
  assetId: string;
  src: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fontSize: number;
  fontFamily: string;
  fill: string;        // text color
  bgFill: string;      // background fill color (empty = transparent)
  borderColor: string; // shape border/stroke color
  textAlign: "left" | "center" | "right";
};

// Regenerate a built-in shape SVG with a custom border color
function recolorShapeSvg(shapeId: string, borderColor: string): string | null {
  const shape = BUILTIN_SHAPES.find((s) => s.id === shapeId);
  if (!shape) return null;
  const innerColor = adjustBrightness(borderColor, 0.15);
  // Decode the original SVG, replace stroke colors, re-encode
  const originalSvg = decodeURIComponent(shape.svg.replace("data:image/svg+xml,", ""));
  const recolored = originalSvg
    .replace(/stroke="#222222"/g, `stroke="${borderColor}"`)
    .replace(/stroke="#333333"/g, `stroke="${innerColor}"`);
  return `data:image/svg+xml,${encodeURIComponent(recolored)}`;
}

function adjustBrightness(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const blend = (c: number) => Math.min(255, Math.round(c + (255 - c) * factor));
  return `#${blend(r).toString(16).padStart(2, "0")}${blend(g).toString(16).padStart(2, "0")}${blend(b).toString(16).padStart(2, "0")}`;
}

export type PlacementDesignExt = {
  images: ImageItem[];
  texts: TextItem[];
  labels: LabelItem[];
  qrCode?: { x: number; y: number; width: number; height: number };
};

export type DesignStateExt = {
  [key in Placement]?: PlacementDesignExt;
};

// ============================================================================
// ASSET MANIFEST
// ============================================================================
type AssetMeta = {
  id: string;
  name: string;
  svg: string;
  png: string;
  bbox: { w: number; h: number };
  renderSize: { w: number; h: number };
};

type AssetManifest = {
  labels: AssetMeta[];
  borders: AssetMeta[];
  accents: AssetMeta[];
};

// ============================================================================
// ARTKEY GEOMETRY — calibrated from theAE_Key v3 SVG template (cropped)
// viewBox: 80 5 1170 550  (cropped to tight-fit content, aspect ~2.13:1)
//
// Key anatomy in SVG coords:
//   Teeth:      x ≈ 973–1206, y ≈ 20–125  (three blocks at top-right)
//   Shaft bar:  y ≈ 348–376  (horizontal bar across most of the width)
//   Bow (logo): x ≈ 96–451, y ≈ 184–540  (theAE circular mark, left side)
//
// QR placement: in the gap between the teeth (bottom y≈125) and the bar (top y≈348).
// Gap is ~223 SVG units tall. QR is 215×215, centered in the gap.
// Center of gap: y = (125+348)/2 = 236.5 → QR top = 129, bottom = 344 (~4px above bar).
// Center x aligned with teeth: (973+1206)/2 = 1090 → QR left = 983, right = 1198.
// ViewBox-relative coords: (983-80, 129-5) = (903, 124), size 215×215.
// ============================================================================
const ARTKEY_VB_W = 1170;
const ARTKEY_VB_H = 550;
const ARTKEY_ASPECT = ARTKEY_VB_W / ARTKEY_VB_H; // ~2.127

// QR box as fractions of the visible ArtKey image.
// Position is relative to the cropped viewBox.
// QR centered in the gap between teeth and bar — slightly overlaps edges for a snug fit.
const AK_QR = {
  rx: 880 / ARTKEY_VB_W,   // 0.7521 — left edge of QR area (centered under teeth)
  ry: 105 / ARTKEY_VB_H,   // 0.1909 — top edge of QR area (moved up)
  rw: 260 / ARTKEY_VB_W,   // 0.2222 — box width (spans teeth x-range ~973–1206)
  rh: 230 / ARTKEY_VB_H,   // 0.4182 — box height (fits above bar with clearance)
};

// Physical QR code size — 0.5" is the reliable minimum for most phones.
// At 300 DPI: ArtKey ≈ 2.92" × 1.37".
const QR_TARGET_INCHES = 0.5;

/**
 * Calculate ArtKey print dimensions (px) so that the QR box interior
 * fits the target QR code at the given DPI.
 * The template is ~2.13:1 (not square), so width and height differ.
 */
function calcArtKeyPrintSize(dpi: number) {
  const qrPx = QR_TARGET_INCHES * dpi;          // 150 at 300dpi
  // QR width fraction determines the ArtKey width
  const artKeyW = Math.round(qrPx / AK_QR.rw);  // ~878 at 300dpi
  const artKeyH = Math.round(artKeyW / ARTKEY_ASPECT); // ~413 at 300dpi
  return {
    w: artKeyW,
    h: artKeyH,
  };
}

type ArtKeyItem = {
  x: number;
  y: number;
  width: number;
  height: number;
  placement: Placement; // which surface the ArtKey lives on
};

// ============================================================================
// COMPONENT
// ============================================================================
type Props = {
  productSpec: ProductSpec;
  placeholderQrCodeUrl?: string;
  artKeyTemplateUrl?: string;
  onExport?: (files: { placement: Placement; dataUrl: string }[]) => void;
  onSave?: (designs: DesignState) => void;
};

export default function CustomizationStudio({
  productSpec,
  placeholderQrCodeUrl,
  artKeyTemplateUrl,
  onExport,
  onSave,
}: Props) {
  // ---- State ----
  const [activeTab, setActiveTab] = useState<ToolTab>("images");
  const [activePlacement, setActivePlacement] = useState<Placement>(productSpec.placements[0] || "front");
  const [designs, setDesigns] = useState<DesignStateExt>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<"image" | "text" | "label" | "artkey" | null>(null);
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const [history, setHistory] = useState<DesignStateExt[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map());
  const [assets, setAssets] = useState<AssetManifest>({ labels: [], borders: [], accents: [] });
  const [bgColor, setBgColor] = useState("#FFFFFF");

  // Center guide lines state
  const [guideLines, setGuideLines] = useState<{ h: boolean; v: boolean }>({ h: false, v: false });
  const SNAP_THRESHOLD = 5; // px threshold for snap & guide display

  // ArtKey state
  const [artKeyItem, setArtKeyItem] = useState<ArtKeyItem | null>(null);
  const [artKeyImg, setArtKeyImg] = useState<HTMLImageElement | null>(null);
  const [qrCodeImg, setQrCodeImg] = useState<HTMLImageElement | null>(null);

  const stageRef = useRef<Konva.Stage | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const zoom = ZOOM_LEVELS[zoomIndex];
  const displayScale = getDisplayScale(productSpec.printWidth, productSpec.printHeight);
  const canvasWidth = productSpec.printWidth * displayScale;
  const canvasHeight = productSpec.printHeight * displayScale;

  const currentDesign: PlacementDesignExt = designs[activePlacement] || {
    images: [],
    texts: [],
    labels: [],
  };

  // ---- Load asset manifest ----
  useEffect(() => {
    fetch("/assets/manifest.json")
      .then((r) => r.json())
      .then((raw) => {
        function transformAsset(item: any): AssetMeta {
          const bbox = item.bbox_device_coords || {};
          const rps = item.render_png_size || {};
          return {
            id: item.name || item.id || "unknown",
            name: item.name || "",
            svg: item.svg || "",
            png: item.png || "",
            bbox: {
              w: (bbox.maxx ?? 0) - (bbox.minx ?? 0),
              h: (bbox.maxy ?? 0) - (bbox.miny ?? 0),
            },
            renderSize: {
              w: rps.width ?? 200,
              h: rps.height ?? 200,
            },
          };
        }
        setAssets({
          labels: (raw.labels || []).map(transformAsset),
          borders: (raw.borders || []).map(transformAsset),
          accents: (raw.accents || []).map(transformAsset),
        });
      })
      .catch((err) => console.warn("Failed to load asset manifest:", err));
  }, []);

  // ---- Load ArtKey template ----
  // Calculate the correct ArtKey size so a 1"×1" QR fits in the box
  const akPrint = calcArtKeyPrintSize(productSpec.printDpi);
  const akDisplayW = akPrint.w * displayScale;
  const akDisplayH = akPrint.h * displayScale;

  useEffect(() => {
    if (!productSpec.requiresQrCode || !artKeyTemplateUrl) return;

    const placeArtKey = () => {
      // Default position: bottom-right with margin, clamped to canvas
      const margin = 10;
      const defX = Math.max(0, canvasWidth - akDisplayW - margin);
      const defY = Math.max(0, canvasHeight - akDisplayH - margin);
      setArtKeyItem({
        x: defX,
        y: defY,
        width: akDisplayW,
        height: akDisplayH,
        placement: productSpec.qrDefaultPosition?.placement || "front",
      });
    };

    const img = new window.Image();
    img.onload = () => {
      console.log("ArtKey template loaded:", img.naturalWidth, "x", img.naturalHeight);
      setArtKeyImg(img);
      placeArtKey();
    };
    img.onerror = (err) => {
      console.error("Failed to load ArtKey template:", artKeyTemplateUrl, err);
      placeArtKey(); // still show the QR placeholder
    };
    // Set crossOrigin only for external URLs (local files don't need it)
    if (artKeyTemplateUrl.startsWith("http")) {
      img.crossOrigin = "anonymous";
    }
    img.src = artKeyTemplateUrl;
  }, [productSpec.requiresQrCode, artKeyTemplateUrl, akDisplayW, akDisplayH, canvasWidth, canvasHeight]);

  // ---- Generate placeholder QR code image ----
  useEffect(() => {
    if (!productSpec.requiresQrCode) return;

    // Fetch the placeholder URL from settings, or use the prop, or a default
    const generateQr = async (url: string) => {
      try {
        const dataUrl = await QRCode.toDataURL(url, {
          errorCorrectionLevel: "M",
          width: 400,
          margin: 1,
          color: { dark: "#000000", light: "#FFFFFF" },
        });
        const img = new window.Image();
        img.onload = () => setQrCodeImg(img);
        img.src = dataUrl;
      } catch (err) {
        console.warn("Failed to generate placeholder QR:", err);
      }
    };

    if (placeholderQrCodeUrl) {
      // Use the URL passed as prop
      generateQr(placeholderQrCodeUrl);
    } else {
      // Fetch from site settings
      fetch("/api/settings")
        .then((r) => r.json())
        .then((settings) => {
          const url = settings.artKeyPlaceholderQrUrl || "https://theartfulexperience.com/artkey-info";
          generateQr(url);
        })
        .catch(() => {
          // Fallback
          generateQr("https://theartfulexperience.com/artkey-info");
        });
    }
  }, [productSpec.requiresQrCode, placeholderQrCodeUrl]);

  // ---- Keyboard shortcuts ----
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId && selectedType && selectedType !== "artkey") {
          e.preventDefault();
          deleteSelected();
        }
      }
      if (e.key === "Escape") {
        setSelectedId(null);
        setSelectedType(null);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  // ---- Transformer updates ----
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;
    // ArtKey is fixed size — no transformer
    if (selectedId && selectedType !== "artkey") {
      const node = stageRef.current.findOne(`#${selectedId}`);
      if (node) {
        transformerRef.current.keepRatio(false);
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer()?.batchDraw();
        return;
      }
    }
    transformerRef.current.nodes([]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedId, selectedType]);

  // ---- History ----
  function pushHistory(newDesigns: DesignStateExt) {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newDesigns)));
    if (newHistory.length > 30) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }
  function undo() {
    if (historyIndex > 0) {
      setDesigns(JSON.parse(JSON.stringify(history[historyIndex - 1])));
      setHistoryIndex(historyIndex - 1);
    }
  }
  function redo() {
    if (historyIndex < history.length - 1) {
      setDesigns(JSON.parse(JSON.stringify(history[historyIndex + 1])));
      setHistoryIndex(historyIndex + 1);
    }
  }

  // ---- Update design ----
  function updateCurrentDesign(updater: (d: PlacementDesignExt) => PlacementDesignExt) {
    const updated = { ...designs };
    updated[activePlacement] = updater({ ...currentDesign });
    setDesigns(updated);
    pushHistory(updated);
  }

  // ---- Image loading ----
  function loadImage(src: string, id: string) {
    if (loadedImages.has(id)) return;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { setLoadedImages((prev) => new Map(prev).set(id, img)); };
    img.src = src;
  }

  useEffect(() => {
    currentDesign.images.forEach((item) => loadImage(item.src, item.id));
    currentDesign.labels.forEach((item) => loadImage(item.src, `label-bg-${item.id}`));
  }, [currentDesign.images, currentDesign.labels]);

  // ---- Add image ----
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        const id = generateId();
        const fitted = fitImageToSlot(img.width, img.height, canvasWidth * 0.6, canvasHeight * 0.6);
        const centered = centerInSlot(fitted.width, fitted.height, 0, 0, canvasWidth, canvasHeight);
        const newImage: ImageItem = {
          id, src,
          x: centered.x, y: centered.y,
          width: fitted.width, height: fitted.height,
          rotation: 0,
          originalWidth: img.width, originalHeight: img.height,
        };
        setLoadedImages((prev) => new Map(prev).set(id, img));
        updateCurrentDesign((d) => ({ ...d, images: [...d.images, newImage] }));
        setSelectedId(id);
        setSelectedType("image");
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ---- Add text ----
  function addText() {
    const id = generateId();
    const newText: TextItem = {
      id,
      text: "Your text here",
      x: canvasWidth / 2 - 80,
      y: canvasHeight / 2 - 15,
      fontSize: 24,
      fontFamily: "Arial, sans-serif",
      fill: "#000000",
      fontStyle: "normal",
      rotation: 0,
    };
    updateCurrentDesign((d) => ({ ...d, texts: [...d.texts, newText] }));
    setSelectedId(id);
    setSelectedType("text");
    setActiveTab("text");
  }

  // ---- Add label (from asset manifest) ----
  function addLabel(asset: AssetMeta) {
    const id = generateId();
    const scale = Math.min(canvasWidth * 0.4 / asset.renderSize.w, canvasHeight * 0.3 / asset.renderSize.h);
    const w = asset.renderSize.w * scale;
    const h = asset.renderSize.h * scale;
    const newLabel: LabelItem = {
      id, assetId: asset.id,
      src: `/assets/${asset.png}`,
      text: "Your text",
      x: (canvasWidth - w) / 2, y: (canvasHeight - h) / 2,
      width: w, height: h, rotation: 0,
      fontSize: Math.max(14, Math.round(h * 0.25)),
      fontFamily: "Georgia, serif",
      fill: "#333333",
      bgFill: "",
      borderColor: "#222222",
      textAlign: "center",
    };
    updateCurrentDesign((d) => ({ ...d, labels: [...d.labels, newLabel] }));
    setSelectedId(id);
    setSelectedType("label");
    setActiveTab("labels");
  }

  // ---- Add plain text label (no shape border) ----
  function addTextLabel() {
    const id = generateId();
    const w = canvasWidth * 0.4;
    const h = 50;
    const newLabel: LabelItem = {
      id, assetId: "text-only",
      src: "",
      text: "Your text here",
      x: (canvasWidth - w) / 2, y: (canvasHeight - h) / 2,
      width: w, height: h, rotation: 0,
      fontSize: 24,
      fontFamily: "Georgia, serif",
      fill: "#333333",
      bgFill: "",
      borderColor: "",
      textAlign: "center",
    };
    updateCurrentDesign((d) => ({ ...d, labels: [...d.labels, newLabel] }));
    setSelectedId(id);
    setSelectedType("label");
    setActiveTab("labels");
  }

  // ---- Add built-in shape label ----
  function addShapeLabel(shape: BuiltInShape) {
    const id = generateId();
    const targetH = canvasHeight * 0.2;
    const w = targetH * shape.aspectRatio;
    const h = targetH;
    const newLabel: LabelItem = {
      id, assetId: shape.id,
      src: shape.svg,
      text: "Your text",
      x: (canvasWidth - w) / 2, y: (canvasHeight - h) / 2,
      width: w, height: h, rotation: 0,
      fontSize: Math.max(14, Math.round(h * 0.25)),
      fontFamily: "Georgia, serif",
      fill: "#333333",
      bgFill: "",
      borderColor: "#222222",
      textAlign: "center",
    };
    updateCurrentDesign((d) => ({ ...d, labels: [...d.labels, newLabel] }));
    setSelectedId(id);
    setSelectedType("label");
    setActiveTab("labels");
  }

  // ---- Add decorative asset ----
  function addDecorativeAsset(asset: AssetMeta, type: "accent" | "border") {
    const id = generateId();
    const src = `/assets/${asset.png}`;
    const scale = type === "border"
      ? Math.min(canvasWidth / asset.renderSize.w, canvasHeight / asset.renderSize.h) * 0.95
      : Math.min(canvasWidth * 0.3 / asset.renderSize.w, canvasHeight * 0.3 / asset.renderSize.h);
    const w = asset.renderSize.w * scale;
    const h = asset.renderSize.h * scale;
    const newImage: ImageItem = {
      id, src,
      x: (canvasWidth - w) / 2, y: (canvasHeight - h) / 2,
      width: w, height: h, rotation: 0,
      originalWidth: asset.renderSize.w, originalHeight: asset.renderSize.h,
    };
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { setLoadedImages((prev) => new Map(prev).set(id, img)); };
    img.src = src;
    updateCurrentDesign((d) => ({ ...d, images: [...d.images, newImage] }));
    setSelectedId(id);
    setSelectedType("image");
  }

  // ---- Inline text editor (opens on single click on canvas text) ----
  function openInlineTextEditor(t: TextItem) {
    const textNode = stageRef.current?.findOne(`#${t.id}`) as Konva.Text;
    if (!textNode) return;
    const stageContainer = stageRef.current?.container();
    if (!stageContainer) return;
    const textPosition = textNode.absolutePosition();
    const areaPosition = {
      x: stageContainer.offsetLeft + textPosition.x * zoom,
      y: stageContainer.offsetTop + textPosition.y * zoom,
    };
    const textarea = document.createElement("textarea");
    stageContainer.parentNode?.appendChild(textarea);
    textarea.value = t.text;
    textarea.style.position = "absolute";
    textarea.style.top = `${areaPosition.y}px`;
    textarea.style.left = `${areaPosition.x}px`;
    textarea.style.fontSize = `${t.fontSize * zoom * displayScale}px`;
    textarea.style.fontFamily = t.fontFamily;
    textarea.style.color = t.fill;
    textarea.style.border = "2px solid #475569";
    textarea.style.borderRadius = "3px";
    textarea.style.padding = "2px 4px";
    textarea.style.margin = "0";
    textarea.style.overflow = "hidden";
    textarea.style.background = "rgba(255,255,255,0.95)";
    textarea.style.outline = "none";
    textarea.style.resize = "none";
    textarea.style.zIndex = "1000";
    textarea.style.minWidth = "120px";
    textarea.style.minHeight = "30px";
    textarea.focus();
    textarea.select();
    const save = () => {
      updateCurrentDesign((d) => ({
        ...d,
        texts: d.texts.map((item) => item.id === t.id ? { ...item, text: textarea.value } : item),
      }));
      textarea.remove();
    };
    textarea.addEventListener("blur", save);
    textarea.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" && !ev.shiftKey) textarea.blur();
      if (ev.key === "Escape") { textarea.remove(); }
    });
  }

  // ---- Inline label editor ----
  function openLabelInlineEditor(label: LabelItem) {
    const stageContainer = stageRef.current?.container();
    if (!stageContainer) return;
    const group = stageRef.current?.findOne(`#${label.id}`);
    if (!group) return;
    const absPos = group.absolutePosition();
    const textarea = document.createElement("textarea");
    stageContainer.parentNode?.appendChild(textarea);
    textarea.value = label.text;
    textarea.style.position = "absolute";
    textarea.style.top = `${stageContainer.offsetTop + absPos.y + label.height * 0.15 * zoom}px`;
    textarea.style.left = `${stageContainer.offsetLeft + absPos.x + label.width * 0.05 * zoom}px`;
    textarea.style.width = `${label.width * 0.9 * zoom}px`;
    textarea.style.height = `${label.height * 0.7 * zoom}px`;
    textarea.style.fontSize = `${label.fontSize * zoom}px`;
    textarea.style.fontFamily = label.fontFamily;
    textarea.style.color = label.fill;
    textarea.style.textAlign = label.textAlign;
    textarea.style.border = "2px solid #475569";
    textarea.style.borderRadius = "4px";
    textarea.style.padding = "4px";
    textarea.style.margin = "0";
    textarea.style.overflow = "hidden";
    textarea.style.background = "rgba(255,255,255,0.9)";
    textarea.style.outline = "none";
    textarea.style.resize = "none";
    textarea.style.zIndex = "1000";
    textarea.focus();
    textarea.select();
    textarea.addEventListener("blur", () => {
      updateCurrentDesign((d) => ({
        ...d,
        labels: d.labels.map((l) => l.id === label.id ? { ...l, text: textarea.value } : l),
      }));
      textarea.remove();
    });
    textarea.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" && !ev.shiftKey) textarea.blur();
      if (ev.key === "Escape") textarea.remove();
    });
  }

  // ---- Delete selected ----
  function deleteSelected() {
    if (!selectedId) return;
    updateCurrentDesign((d) => ({
      ...d,
      images: d.images.filter((i) => i.id !== selectedId),
      texts: d.texts.filter((t) => t.id !== selectedId),
      labels: d.labels.filter((l) => l.id !== selectedId),
    }));
    setSelectedId(null);
    setSelectedType(null);
  }

  // ---- Apply collage layout ----
  function applyLayout(layoutId: string) {
    const layout = getLayoutById(layoutId);
    if (!layout) return;
    const gap = layout.slots.length === 1 ? 0 : 3; // small gap between slots (px)
    const imgs = [...currentDesign.images];
    const repositioned = imgs.map((img, i) => {
      if (i >= layout.slots.length) return img;
      const slot = layout.slots[i];
      // Slot bounds in canvas px (inset by gap)
      const slotX = canvasWidth * slot.x + gap;
      const slotY = canvasHeight * slot.y + gap;
      const slotW = canvasWidth * slot.width - gap * 2;
      const slotH = canvasHeight * slot.height - gap * 2;
      // Cover-fit: image fills entire slot
      const fitted = fitImageToSlot(img.originalWidth, img.originalHeight, slotW, slotH);
      // Center the (possibly larger) image within the slot
      const x = slotX + (slotW - fitted.width) / 2;
      const y = slotY + (slotH - fitted.height) / 2;
      // Clip to the slot boundary
      const clip = { x: slotX, y: slotY, width: slotW, height: slotH };
      return { ...img, x, y, width: fitted.width, height: fitted.height, clip };
    });
    // Clear clip from any images beyond the layout slot count
    const cleared = repositioned.map((img, i) =>
      i >= layout.slots.length ? { ...img, clip: undefined } : img
    );
    updateCurrentDesign((d) => ({ ...d, images: cleared }));
  }

  // ---- Export ----
  function handleExport() {
    if (!stageRef.current || !onExport) return;
    const files = productSpec.placements.map((placement) => {
      const fullScale = productSpec.printWidth / canvasWidth;
      const dataUrl = stageRef.current!.toDataURL({ pixelRatio: fullScale, mimeType: "image/png" });
      return { placement, dataUrl };
    });
    onExport(files);
  }

  // ---- Canvas click (deselect) ----
  function handleStageClick(e: Konva.KonvaEventObject<MouseEvent>) {
    if (e.target === e.target.getStage()) {
      setSelectedId(null);
      setSelectedType(null);
    }
  }

  // ---- Drag/transform handlers ----
  // ---- Centering guide / snap on drag ----
  function handleDragMove(e: Konva.KonvaEventObject<DragEvent>) {
    const node = e.target;
    const nodeW = node.width() * (node.scaleX() || 1);
    const nodeH = node.height() * (node.scaleY() || 1);
    const ox = node.offsetX() || 0;
    const oy = node.offsetY() || 0;
    // Center of the element: if offset is set, node.x() is already near center
    const centerX = node.x() - ox + nodeW / 2;
    const centerY = node.y() - oy + nodeH / 2;
    const canvasCX = canvasWidth / 2;
    const canvasCY = canvasHeight / 2;
    const diffX = Math.abs(centerX - canvasCX);
    const diffY = Math.abs(centerY - canvasCY);
    const snapH = diffY < SNAP_THRESHOLD;
    const snapV = diffX < SNAP_THRESHOLD;
    // Snap to center — adjust node position accounting for offset
    if (snapV) node.x(canvasCX - nodeW / 2 + ox);
    if (snapH) node.y(canvasCY - nodeH / 2 + oy);
    setGuideLines({ h: snapH, v: snapV });
  }
  function handleDragEnd() {
    setGuideLines({ h: false, v: false });
  }

  function handleImageDragEnd(id: string, e: Konva.KonvaEventObject<DragEvent>) {
    handleDragEnd();
    const node = e.target;
    // node x/y is center (due to offset), convert back to top-left
    const topLeftX = node.x() - node.offsetX();
    const topLeftY = node.y() - node.offsetY();
    updateCurrentDesign((d) => ({
      ...d,
      images: d.images.map((img) => img.id === id ? { ...img, x: topLeftX, y: topLeftY, clip: undefined } : img),
    }));
  }
  function handleImageTransformEnd(id: string, e: Konva.KonvaEventObject<Event>) {
    const node = e.target;
    const scaleX = node.scaleX(); const scaleY = node.scaleY();
    node.scaleX(1); node.scaleY(1);
    const newW = Math.max(20, node.width() * scaleX);
    const newH = Math.max(20, node.height() * scaleY);
    // Update offset to new center, then convert node position to top-left
    node.offsetX(newW / 2); node.offsetY(newH / 2);
    const topLeftX = node.x() - newW / 2;
    const topLeftY = node.y() - newH / 2;
    updateCurrentDesign((d) => ({
      ...d,
      images: d.images.map((img) => img.id === id ? {
        ...img, x: topLeftX, y: topLeftY,
        width: newW, height: newH,
        rotation: node.rotation(),
        clip: undefined,
      } : img),
    }));
  }
  function handleTextDragEnd(id: string, e: Konva.KonvaEventObject<DragEvent>) {
    handleDragEnd();
    updateCurrentDesign((d) => ({
      ...d,
      texts: d.texts.map((t) => t.id === id ? { ...t, x: e.target.x(), y: e.target.y() } : t),
    }));
  }
  function handleLabelDragEnd(id: string, e: Konva.KonvaEventObject<DragEvent>) {
    handleDragEnd();
    const node = e.target;
    const topLeftX = node.x() - node.offsetX();
    const topLeftY = node.y() - node.offsetY();
    updateCurrentDesign((d) => ({
      ...d,
      labels: d.labels.map((l) => l.id === id ? { ...l, x: topLeftX, y: topLeftY } : l),
    }));
  }
  function handleLabelTransformEnd(id: string, e: Konva.KonvaEventObject<Event>) {
    const node = e.target;
    const scaleX = node.scaleX(); const scaleY = node.scaleY();
    node.scaleX(1); node.scaleY(1);
    const newW = Math.max(40, node.width() * scaleX);
    const newH = Math.max(30, node.height() * scaleY);
    node.offsetX(newW / 2); node.offsetY(newH / 2);
    const topLeftX = node.x() - newW / 2;
    const topLeftY = node.y() - newH / 2;
    updateCurrentDesign((d) => ({
      ...d,
      labels: d.labels.map((l) => l.id === id ? {
        ...l, x: topLeftX, y: topLeftY,
        width: newW, height: newH,
        rotation: node.rotation(),
      } : l),
    }));
  }

  // ---- Image editing helpers ----
  function updateSelectedImage(updates: Partial<ImageItem>) {
    if (!selectedId) return;
    updateCurrentDesign((d) => ({
      ...d,
      images: d.images.map((img) => img.id === selectedId ? { ...img, ...updates } : img),
    }));
  }
  function flipImageH() {
    if (!selectedImage) return;
    const node = stageRef.current?.findOne(`#${selectedId}`);
    if (node) {
      // With center offset, just negate scaleX — no position adjustment needed
      node.scaleX(node.scaleX() * -1);
      stageRef.current?.batchDraw();
    }
  }
  function flipImageV() {
    if (!selectedImage) return;
    const node = stageRef.current?.findOne(`#${selectedId}`);
    if (node) {
      node.scaleY(node.scaleY() * -1);
      stageRef.current?.batchDraw();
    }
  }
  function fitImageToCanvas() {
    if (!selectedImage) return;
    const fitted = fitImageToSlot(selectedImage.originalWidth, selectedImage.originalHeight, canvasWidth, canvasHeight);
    const centered = centerInSlot(fitted.width, fitted.height, 0, 0, canvasWidth, canvasHeight);
    updateSelectedImage({ x: centered.x, y: centered.y, width: fitted.width, height: fitted.height, rotation: 0 });
  }
  function rotateImage90() {
    if (!selectedImage) return;
    // Rotate around center: swap width/height and reposition so center stays fixed
    const cx = selectedImage.x + selectedImage.width / 2;
    const cy = selectedImage.y + selectedImage.height / 2;
    const newRotation = (selectedImage.rotation + 90) % 360;
    // After 90° rotation the bounding box swaps, recompute top-left from center
    const newX = cx - selectedImage.width / 2;
    const newY = cy - selectedImage.height / 2;
    updateSelectedImage({ rotation: newRotation, x: newX, y: newY });
  }
  function duplicateImage() {
    if (!selectedImage) return;
    const id = generateId();
    const dup: ImageItem = { ...selectedImage, id, x: selectedImage.x + 20, y: selectedImage.y + 20 };
    // Copy loaded image ref
    const loaded = loadedImages.get(selectedImage.id);
    if (loaded) setLoadedImages((prev) => new Map(prev).set(id, loaded));
    updateCurrentDesign((d) => ({ ...d, images: [...d.images, dup] }));
    setSelectedId(id);
    setSelectedType("image");
  }
  function sendToBack() {
    if (!selectedImage) return;
    updateCurrentDesign((d) => ({
      ...d,
      images: [d.images.find((i) => i.id === selectedId)!, ...d.images.filter((i) => i.id !== selectedId)],
    }));
  }
  function bringToFront() {
    if (!selectedImage) return;
    updateCurrentDesign((d) => ({
      ...d,
      images: [...d.images.filter((i) => i.id !== selectedId), d.images.find((i) => i.id === selectedId)!],
    }));
  }

  // ---- Selected item helpers ----
  const selectedImage = currentDesign.images.find((i) => i.id === selectedId);
  const selectedText = currentDesign.texts.find((t) => t.id === selectedId);
  const selectedLabel = currentDesign.labels.find((l) => l.id === selectedId);

  function updateSelectedText(updates: Partial<TextItem>) {
    if (!selectedId) return;
    updateCurrentDesign((d) => ({
      ...d,
      texts: d.texts.map((t) => (t.id === selectedId ? { ...t, ...updates } : t)),
    }));
  }
  function updateSelectedLabel(updates: Partial<LabelItem>) {
    if (!selectedId) return;
    updateCurrentDesign((d) => ({
      ...d,
      labels: d.labels.map((l) => {
        if (l.id !== selectedId) return l;
        const merged = { ...l, ...updates };
        // If border color changed on a built-in shape, regenerate the SVG
        if (updates.borderColor && l.assetId.startsWith("shape-")) {
          const newSvg = recolorShapeSvg(l.assetId, updates.borderColor);
          if (newSvg) {
            merged.src = newSvg;
            // Reload the image
            const img = new window.Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              setLoadedImages((prev) => new Map(prev).set(`label-bg-${l.id}`, img));
            };
            img.src = newSvg;
          }
        }
        return merged;
      }),
    }));
  }

  const printWidthIn = (productSpec.printWidth / productSpec.printDpi).toFixed(2);
  const printHeightIn = (productSpec.printHeight / productSpec.printDpi).toFixed(2);

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div className="flex flex-col h-full select-none" style={{ background: "#f3f3f3" }}>

      {/* ===== HEADER (brand colored) ===== */}
      <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: "#000000" }}>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold" style={{ color: "#ffffff" }}>Customization Studio</span>
          <span className="text-sm" style={{ color: "#ded8d3" }}>{productSpec.name}</span>
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: "#475569", color: "#ded8d3" }}
            title="Print area dimensions — your design will be printed at this size and resolution">
            {printWidthIn}&quot; x {printHeightIn}&quot; @ {productSpec.printDpi}dpi
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={undo} disabled={historyIndex <= 0}
            className="px-2.5 py-1 text-xs rounded font-medium disabled:opacity-30"
            style={{ background: "#475569", color: "#f3f3f3" }} title="Undo (Ctrl+Z)">
            Undo
          </button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1}
            className="px-2.5 py-1 text-xs rounded font-medium disabled:opacity-30"
            style={{ background: "#475569", color: "#f3f3f3" }} title="Redo (Ctrl+Y)">
            Redo
          </button>
          <span className="w-px h-5" style={{ background: "#918c86" }} />
          <button onClick={() => setZoomIndex(Math.max(0, zoomIndex - 1))} disabled={zoomIndex <= 0}
            className="px-2 py-1 text-xs rounded disabled:opacity-30" style={{ background: "#475569", color: "#f3f3f3" }}
            title="Zoom out">
            -
          </button>
          <span className="text-xs font-medium min-w-[40px] text-center" style={{ color: "#ded8d3" }}
            title="Current zoom level">
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={() => setZoomIndex(Math.min(ZOOM_LEVELS.length - 1, zoomIndex + 1))} disabled={zoomIndex >= ZOOM_LEVELS.length - 1}
            className="px-2 py-1 text-xs rounded disabled:opacity-30" style={{ background: "#475569", color: "#f3f3f3" }}
            title="Zoom in">
            +
          </button>
          <span className="w-px h-5" style={{ background: "#918c86" }} />
          {onExport && (
            <button onClick={handleExport}
              className="px-3 py-1.5 text-xs rounded font-medium" style={{ background: "#475569", color: "#ffffff" }}
              title="Export your design as a high-resolution print-ready file">
              Export Print File
            </button>
          )}
          {onSave && (
            <button onClick={() => onSave(designs as DesignState)}
              className="px-3 py-1.5 text-xs rounded font-medium" style={{ background: "#475569", color: "#ffffff" }}
              title="Save your current design as a draft to continue later">
              Save Draft
            </button>
          )}
        </div>
      </div>

      {/* ===== SURFACE TABS (always visible) ===== */}
      <div className="px-4 py-1.5 flex items-center gap-2 flex-wrap" style={{ background: "#475569" }}>
        <span className="text-xs font-medium mr-2" style={{ color: "#ded8d3" }}
          title="Choose which side of the product to design">Surface:</span>
        {productSpec.placements.map((placement) => (
          <button
            key={placement}
            onClick={() => { setActivePlacement(placement); setSelectedId(null); setSelectedType(null); }}
            className="px-3 py-1 rounded text-xs font-medium transition-all"
            style={activePlacement === placement
              ? { background: "#000000", color: "#ffffff" }
              : { background: "#918c86", color: "#f3f3f3" }
            }
            title={`Design the ${placement} of the product`}
          >
            {PLACEMENT_LABELS[placement]}
          </button>
        ))}
        {productSpec.requiresQrCode && artKeyItem && (<>
          <span className="mx-2 text-gray-400">|</span>
          <span className="text-xs font-medium" style={{ color: "#ded8d3" }}
            title="Move the ArtKey QR code to a different surface">ArtKey:</span>
          {productSpec.placements.map((p) => (
            <button
              key={`ak-${p}`}
              onClick={() => {
                setArtKeyItem((prev) => prev ? { ...prev, placement: p } : null);
                setActivePlacement(p);
                setSelectedId("artkey-template");
                setSelectedType("artkey");
              }}
              className="px-2 py-0.5 rounded text-xs font-medium transition-all"
              style={artKeyItem.placement === p
                ? { background: "#f59e0b", color: "#000" }
                : { background: "#64748b", color: "#f3f3f3" }
              }
              title={`Place the ArtKey QR code on the ${p}`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </>)}
      </div>

      {/* ===== TOOL TABS (colored horizontal bar) ===== */}
      <div className="px-4 py-1 flex items-center gap-1" style={{ background: "#f3f3f3", borderBottom: "2px solid #000000" }}>
        {TOOL_TAB_META.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-3 py-1.5 rounded-t text-xs font-medium transition-all flex items-center gap-1.5"
            style={activeTab === tab.id
              ? { background: "#000000", color: "#ffffff" }
              : { background: "transparent", color: "#918c86" }
            }
            title={tab.hint}
          >
            <span className="text-sm">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs" style={{ color: "#918c86" }}
            title="Set the canvas background color for this surface">Background Color:</span>
          <ColorPicker value={bgColor} onChange={(c) => setBgColor(c)} />
        </div>
      </div>

      {/* ===== MAIN AREA ===== */}
      <div className="flex flex-1 overflow-hidden">

        {/* ===== LEFT PANEL: Tool Content + Properties ===== */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
          <div className="flex-1 p-3">

            {/* ---- IMAGES TAB ---- */}
            {activeTab === "images" && (
              <div className="space-y-3">
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-full px-3 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ background: "#000000" }}
                  title="Upload a photo or image from your device">
                  Upload Image
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

                {currentDesign.images.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No images yet. Upload one to get started.</p>
                ) : (
                  <div className="space-y-1">
                    {currentDesign.images.map((img, i) => (
                      <div key={img.id}
                        onClick={() => { setSelectedId(img.id); setSelectedType("image"); }}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer text-sm ${
                          selectedId === img.id ? "bg-gray-100 text-black ring-1 ring-gray-400" : "hover:bg-gray-50"
                        }`}>
                        <div className="w-8 h-8 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          <img src={img.src} alt="" className="w-full h-full object-cover" />
                        </div>
                        <span className="truncate">Image {i + 1}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* IMAGE EDITING TOOLS */}
                {selectedImage && (
                  <div className="border-t border-gray-200 pt-3 space-y-2">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Image Tools</h4>
                    <div className="text-xs text-gray-500 space-y-0.5">
                      <p>{Math.round(selectedImage.width)} x {Math.round(selectedImage.height)}px</p>
                      <p>Original: {selectedImage.originalWidth} x {selectedImage.originalHeight}px</p>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button onClick={rotateImage90} className="px-2 py-1.5 text-xs rounded bg-gray-100 hover:bg-gray-200 font-medium"
                        title="Rotate the image 90° clockwise">
                        Rotate 90°
                      </button>
                      <button onClick={fitImageToCanvas} className="px-2 py-1.5 text-xs rounded bg-gray-100 hover:bg-gray-200 font-medium"
                        title="Resize the image to fill the entire canvas">
                        Fit to Canvas
                      </button>
                      <button onClick={flipImageH} className="px-2 py-1.5 text-xs rounded bg-gray-100 hover:bg-gray-200 font-medium"
                        title="Flip the image horizontally (mirror left/right)">
                        Flip H
                      </button>
                      <button onClick={flipImageV} className="px-2 py-1.5 text-xs rounded bg-gray-100 hover:bg-gray-200 font-medium"
                        title="Flip the image vertically (mirror top/bottom)">
                        Flip V
                      </button>
                      <button onClick={duplicateImage} className="px-2 py-1.5 text-xs rounded bg-gray-100 hover:bg-gray-200 font-medium"
                        title="Create a copy of this image on the canvas">
                        Duplicate
                      </button>
                      <button onClick={sendToBack} className="px-2 py-1.5 text-xs rounded bg-gray-100 hover:bg-gray-200 font-medium"
                        title="Move this image behind all other elements">
                        Send to Back
                      </button>
                      <button onClick={bringToFront} className="px-2 py-1.5 text-xs rounded bg-gray-100 hover:bg-gray-200 font-medium"
                        title="Move this image in front of all other elements">
                        Bring to Front
                      </button>
                      <button onClick={deleteSelected} className="px-2 py-1.5 text-xs rounded bg-red-50 text-red-700 hover:bg-red-100 font-medium"
                        title="Remove this image from the canvas">
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ---- TEXT TAB ---- */}
            {activeTab === "text" && (
              <div className="space-y-3">
                <button onClick={addText}
                  className="w-full px-3 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ background: "#000000" }}
                  title="Add a new text element to the canvas">
                  Add Text
                </button>
                <p className="text-xs text-gray-400">Click text on the canvas to edit it directly.</p>

                {currentDesign.texts.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No text elements yet.</p>
                ) : (
                  <div className="space-y-1">
                    {currentDesign.texts.map((t) => (
                      <div key={t.id}
                        onClick={() => { setSelectedId(t.id); setSelectedType("text"); setActiveTab("text"); }}
                        className={`p-2 rounded cursor-pointer text-sm truncate ${
                          selectedId === t.id ? "bg-gray-100 text-black ring-1 ring-gray-400" : "hover:bg-gray-50"
                        }`}>
                        {t.text || "Empty text"}
                      </div>
                    ))}
                  </div>
                )}

                {/* TEXT PROPERTIES (shown when a text is selected) */}
                {selectedText && (
                  <div className="border-t border-gray-200 pt-3 space-y-2">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Text Properties</h4>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1" title="Choose a typeface for this text">Font</label>
                      <select value={selectedText.fontFamily}
                        onChange={(e) => updateSelectedText({ fontFamily: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        title="Select a font family">
                        {FONT_OPTIONS.map((f) => (
                          <option key={f.family} value={f.family}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1" title="Font size in pixels">Size</label>
                        <input type="number" value={selectedText.fontSize}
                          onChange={(e) => updateSelectedText({ fontSize: parseInt(e.target.value) || 14 })}
                          min={8} max={200}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          title="Set the font size (8–200)" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1" title="Change the text color">Color</label>
                        <ColorPicker value={selectedText.fill} onChange={(c) => updateSelectedText({ fill: c })} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1" title="Set the text to normal, bold, or italic">Style</label>
                      <div className="flex gap-1">
                        {["normal", "bold", "italic"].map((style) => (
                          <button key={style} onClick={() => updateSelectedText({ fontStyle: style })}
                            className={`flex-1 py-1 text-xs rounded font-medium ${
                              selectedText.fontStyle === style
                                ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                            title={`Set text style to ${style}`}>
                            {style.charAt(0).toUpperCase() + style.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button onClick={deleteSelected}
                      className="w-full px-3 py-1.5 bg-red-50 text-red-700 rounded text-xs hover:bg-red-100 font-medium"
                      title="Remove this text from the canvas">
                      Delete Text
                    </button>
                  </div>
                )}

                {/* LABEL PROPERTIES (also under text tab when a label is selected) */}
                {selectedLabel && (
                  <div className="border-t border-gray-200 pt-3 space-y-2">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Label Text Properties</h4>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1" title="Choose a typeface for the label text">Font</label>
                      <select value={selectedLabel.fontFamily}
                        onChange={(e) => updateSelectedLabel({ fontFamily: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        title="Select a font family">
                        {FONT_OPTIONS.map((f) => (
                          <option key={f.family} value={f.family}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1" title="Font size in pixels">Size</label>
                        <input type="number" value={selectedLabel.fontSize}
                          onChange={(e) => updateSelectedLabel({ fontSize: parseInt(e.target.value) || 14 })}
                          min={8} max={200}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          title="Set the font size (8–200)" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1" title="Change the label text color">Font Color</label>
                        <ColorPicker value={selectedLabel.fill} onChange={(c) => updateSelectedLabel({ fill: c })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1" title="Set a background fill color inside the shape">Fill Color</label>
                        <div className="flex items-center gap-1">
                          <ColorPicker value={selectedLabel.bgFill || "#ffffff"} onChange={(c) => updateSelectedLabel({ bgFill: c })} />
                          {selectedLabel.bgFill ? (
                            <button onClick={() => updateSelectedLabel({ bgFill: "" })}
                              className="px-1.5 py-0.5 text-[10px] bg-gray-200 rounded hover:bg-gray-300"
                              title="Remove the fill color (make transparent)">
                              Clear
                            </button>
                          ) : (
                            <button onClick={() => updateSelectedLabel({ bgFill: "#ffffff" })}
                              className="px-1.5 py-0.5 text-[10px] bg-gray-200 rounded hover:bg-gray-300"
                              title="Add a white fill color">
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                      {selectedLabel.assetId.startsWith("shape-") && (
                        <div>
                          <label className="block text-xs text-gray-500 mb-1" title="Change the shape outline color">Border Color</label>
                          <ColorPicker value={selectedLabel.borderColor || "#222222"} onChange={(c) => updateSelectedLabel({ borderColor: c })} />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1" title="Align text inside the label">Alignment</label>
                      <div className="flex gap-1">
                        {(["left", "center", "right"] as const).map((align) => (
                          <button key={align} onClick={() => updateSelectedLabel({ textAlign: align })}
                            className={`flex-1 py-1 text-xs rounded font-medium ${
                              selectedLabel.textAlign === align
                                ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                            title={`Align label text to the ${align}`}>
                            {align.charAt(0).toUpperCase() + align.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button onClick={deleteSelected}
                      className="w-full px-3 py-1.5 bg-red-50 text-red-700 rounded text-xs hover:bg-red-100 font-medium"
                      title="Remove this label from the canvas">
                      Delete Label
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ---- LAYOUTS TAB ---- */}
            {activeTab === "layouts" && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 mb-2">Apply a layout to arrange your images.</p>
                <div className="grid grid-cols-2 gap-2">
                  {COLLAGE_LAYOUTS.map((layout) => (
                    <button key={layout.id} onClick={() => applyLayout(layout.id)}
                      className="p-2 bg-gray-50 rounded border border-gray-200 hover:border-gray-500 text-xs text-center"
                      title={layout.name}>
                      <div className="w-full aspect-square bg-white rounded mb-1 relative overflow-hidden">
                        {layout.slots.map((slot, i) => (
                          <div key={i} className="absolute border" style={{ background: "#ded8d3", borderColor: "#918c86" }}
                            style={{ left: `${slot.x * 100}%`, top: `${slot.y * 100}%`, width: `${slot.width * 100}%`, height: `${slot.height * 100}%` }} />
                        ))}
                      </div>
                      <span className="truncate block">{layout.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ---- ACCENTS TAB ---- */}
            {activeTab === "accents" && (
              <div className="space-y-4">
                <p className="text-xs text-gray-500">Click to add. Drag, resize, and rotate accents on the canvas. Use Flip H/V from Image Tools to mirror.</p>
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2"
                    title="Ornamental flourishes — drag, resize, and rotate on the canvas">Decorative Accents</h4>
                  <div className="grid grid-cols-3 gap-1">
                    {assets.accents.map((a) => (
                      <button key={a.id} onClick={() => addDecorativeAsset(a, "accent")}
                        className="aspect-square bg-white rounded border border-gray-200 hover:border-gray-500 p-1 overflow-hidden" title={a.name}>
                        <img src={`/assets/${a.png}`} alt={a.name} className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2"
                    title="Full-frame decorative borders — they resize to fit the canvas edges">Borders</h4>
                  <div className="grid grid-cols-3 gap-1">
                    {assets.borders.map((b) => (
                      <button key={b.id} onClick={() => addDecorativeAsset(b, "border")}
                        className="aspect-square bg-white rounded border border-gray-200 hover:border-gray-500 p-1 overflow-hidden" title={b.name}>
                        <img src={`/assets/${b.png}`} alt={b.name} className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ---- LABELS TAB ---- */}
            {activeTab === "labels" && (
              <div className="space-y-4">
                <p className="text-xs text-gray-500">Click to add a shape. Single-click on canvas to select. Double-click to edit text.</p>

                {/* ---- TEXT LABELS section ---- */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: "#1a1a2e" }}>Text Labels</h3>
                  <p className="text-[10px] text-gray-400 mb-2">Add a standalone text label to the canvas.</p>
                  <button
                    onClick={addTextLabel}
                    className="w-full px-3 py-2 rounded border border-dashed border-gray-400 hover:border-gray-600 text-xs text-gray-600 hover:text-gray-900 transition-colors"
                    title="Add a plain text label without any shape"
                  >
                    + Add Text Label
                  </button>
                </div>

                {/* Selected label properties + delete */}
                {selectedLabel && (
                  <div className="p-3 rounded-lg border border-gray-200 space-y-2 bg-gray-50">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Selected: {selectedLabel.text || "Label"}</h4>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1" title="Choose a typeface for the label text">Font</label>
                      <select value={selectedLabel.fontFamily}
                        onChange={(e) => updateSelectedLabel({ fontFamily: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        title="Select a font family">
                        {FONT_OPTIONS.map((f) => (
                          <option key={f.family} value={f.family}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1" title="Font size in pixels">Size</label>
                        <input type="number" value={selectedLabel.fontSize}
                          onChange={(e) => updateSelectedLabel({ fontSize: parseInt(e.target.value) || 14 })}
                          min={8} max={200}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          title="Set the font size (8–200)" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1" title="Change the label text color">Font Color</label>
                        <ColorPicker value={selectedLabel.fill} onChange={(c) => updateSelectedLabel({ fill: c })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1" title="Set a background fill color inside the shape">Fill Color</label>
                        <div className="flex items-center gap-1">
                          <ColorPicker value={selectedLabel.bgFill || "#ffffff"} onChange={(c) => updateSelectedLabel({ bgFill: c })} />
                          {selectedLabel.bgFill ? (
                            <button onClick={() => updateSelectedLabel({ bgFill: "" })}
                              className="px-1.5 py-0.5 text-[10px] bg-gray-200 rounded hover:bg-gray-300"
                              title="Remove the fill color (make transparent)">
                              Clear
                            </button>
                          ) : (
                            <button onClick={() => updateSelectedLabel({ bgFill: "#ffffff" })}
                              className="px-1.5 py-0.5 text-[10px] bg-gray-200 rounded hover:bg-gray-300"
                              title="Add a white fill color">
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                      {selectedLabel.assetId.startsWith("shape-") && (
                        <div>
                          <label className="block text-xs text-gray-500 mb-1" title="Change the shape outline color">Border Color</label>
                          <ColorPicker value={selectedLabel.borderColor || "#222222"} onChange={(c) => updateSelectedLabel({ borderColor: c })} />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1" title="Align text inside the label">Alignment</label>
                      <div className="flex gap-1">
                        {(["left", "center", "right"] as const).map((align) => (
                          <button key={align} onClick={() => updateSelectedLabel({ textAlign: align })}
                            className={`flex-1 py-1 text-xs rounded font-medium ${
                              selectedLabel.textAlign === align
                                ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                            title={`Align label text to the ${align}`}>
                            {align.charAt(0).toUpperCase() + align.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button onClick={deleteSelected}
                      className="w-full px-3 py-1.5 bg-red-50 text-red-700 rounded text-xs hover:bg-red-100 font-medium"
                      title="Remove this label from the canvas">
                      Delete Label
                    </button>
                  </div>
                )}

                <hr className="border-gray-200" />

                {/* ---- SHAPES & RIBBONS section ---- */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: "#1a1a2e" }}
                    title="Choose a shape to add to the canvas — you can type inside it">Shapes &amp; Ribbons</h3>
                  <div className="grid grid-cols-3 gap-1.5">
                    {BUILTIN_SHAPES.map((shape) => (
                      <button key={shape.id} onClick={() => addShapeLabel(shape)}
                        className="bg-white rounded border border-gray-200 hover:border-gray-500 p-1.5 overflow-hidden flex flex-col items-center justify-center gap-1"
                        title={shape.name}>
                        <img src={shape.svg} alt={shape.name} className="w-full h-auto object-contain max-h-10" />
                        <span className="text-[9px] text-gray-500 leading-tight">{shape.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <hr className="border-gray-200" />

                {/* ---- DECORATIVE section ---- */}
                {assets.labels.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: "#1a1a2e" }}
                      title="Pre-designed decorative labels — click to add to the canvas">Decorative</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {assets.labels.map((label) => (
                        <button key={label.id} onClick={() => addLabel(label)}
                          className="bg-white rounded border border-gray-200 hover:border-gray-500 p-2 overflow-hidden" title={label.name}>
                          <img src={`/assets/${label.png}`} alt={label.name} className="w-full h-auto object-contain" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ===== CENTER: Canvas ===== */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-6" style={{ background: "#ded8d3" }}>
          <div style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}>
            <Stage
              ref={stageRef}
              width={canvasWidth}
              height={canvasHeight}
              onClick={handleStageClick}
              style={{
                border: "1px solid #918c86",
                boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
                background: bgColor,
              }}
            >
              <Layer>
                <Rect x={0} y={0} width={canvasWidth} height={canvasHeight} fill={bgColor} />

                {/* Images */}
                {currentDesign.images.map((img) => {
                  const loaded = loadedImages.get(img.id);
                  if (!loaded) return null;
                  const imgEl = (
                    <KonvaImage
                      key={img.id} id={img.id} image={loaded}
                      x={img.x + img.width / 2} y={img.y + img.height / 2}
                      width={img.width} height={img.height}
                      offsetX={img.width / 2} offsetY={img.height / 2}
                      rotation={img.rotation} draggable
                      onClick={() => { setSelectedId(img.id); setSelectedType("image"); setActiveTab("images"); }}
                      onTap={() => { setSelectedId(img.id); setSelectedType("image"); setActiveTab("images"); }}
                      onDragMove={handleDragMove}
                      onDragEnd={(e) => handleImageDragEnd(img.id, e)}
                      onTransformEnd={(e) => handleImageTransformEnd(img.id, e)}
                    />
                  );
                  // If image has a layout clip, wrap in a clipped Group
                  if (img.clip) {
                    const c = img.clip;
                    return (
                      <Group key={`clip-${img.id}`}
                        clipX={c.x} clipY={c.y} clipWidth={c.width} clipHeight={c.height}>
                        {imgEl}
                      </Group>
                    );
                  }
                  return imgEl;
                })}

                {/* Text (click to edit inline) */}
                {currentDesign.texts.map((t) => (
                  <Text
                    key={t.id} id={t.id} text={t.text}
                    x={t.x} y={t.y}
                    fontSize={t.fontSize} fontFamily={t.fontFamily}
                    fill={t.fill} fontStyle={t.fontStyle} rotation={t.rotation}
                    draggable
                    onClick={() => {
                      setSelectedId(t.id);
                      setSelectedType("text");
                      setActiveTab("text");
                      // Open inline editor on single click
                      setTimeout(() => openInlineTextEditor(t), 50);
                    }}
                    onTap={() => {
                      setSelectedId(t.id);
                      setSelectedType("text");
                      setActiveTab("text");
                      setTimeout(() => openInlineTextEditor(t), 50);
                    }}
                    onDragMove={handleDragMove}
                    onDragEnd={(e) => handleTextDragEnd(t.id, e)}
                  />
                ))}

                {/* Labels */}
                {currentDesign.labels.map((label) => {
                  const shapeDef = BUILTIN_SHAPES.find((s) => s.id === label.assetId);
                  const isBuiltIn = !!shapeDef;
                  const bgImg = loadedImages.get(`label-bg-${label.id}`);
                  const borderClr = label.borderColor || "#222222";
                  const innerClr = adjustBrightness(borderClr, 0.15);
                  const w = label.width;
                  const h = label.height;

                  // Build Konva shape elements for built-in shapes (truly transparent)
                  const renderShapeOutline = () => {
                    if (!shapeDef) {
                      // Decorative asset label — use image
                      return bgImg ? <KonvaImage image={bgImg} width={w} height={h} /> : null;
                    }
                    const fill = label.bgFill || undefined; // undefined = transparent
                    const sw = Math.max(3, Math.min(w, h) * 0.04); // outer stroke — bold default
                    const sw2 = Math.max(1, sw * 0.25); // inner stroke
                    const pad = sw + sw2 + 2; // inner offset

                    if (shapeDef.kind === "rect") {
                      return (<>
                        <Rect x={0} y={0} width={w} height={h} fill={fill} stroke={borderClr} strokeWidth={sw} cornerRadius={4} />
                        <Rect x={pad} y={pad} width={w - pad * 2} height={h - pad * 2} fill={undefined} stroke={innerClr} strokeWidth={sw2} cornerRadius={2} />
                      </>);
                    }
                    if (shapeDef.kind === "roundedRect") {
                      const cr = Math.min(w, h) * 0.13;
                      return (<>
                        <Rect x={0} y={0} width={w} height={h} fill={fill} stroke={borderClr} strokeWidth={sw} cornerRadius={cr} />
                        <Rect x={pad} y={pad} width={w - pad * 2} height={h - pad * 2} fill={undefined} stroke={innerClr} strokeWidth={sw2} cornerRadius={Math.max(0, cr - pad)} />
                      </>);
                    }
                    if (shapeDef.kind === "ellipse") {
                      return (<>
                        <KonvaEllipse x={w / 2} y={h / 2} radiusX={w / 2 - sw / 2} radiusY={h / 2 - sw / 2} fill={fill} stroke={borderClr} strokeWidth={sw} />
                        <KonvaEllipse x={w / 2} y={h / 2} radiusX={w / 2 - pad - sw2 / 2} radiusY={h / 2 - pad - sw2 / 2} fill={undefined} stroke={innerClr} strokeWidth={sw2} />
                      </>);
                    }
                    if (shapeDef.kind === "circle") {
                      const r = Math.min(w, h) / 2;
                      return (<>
                        <KonvaCircle x={w / 2} y={h / 2} radius={r - sw / 2} fill={fill} stroke={borderClr} strokeWidth={sw} />
                        <KonvaCircle x={w / 2} y={h / 2} radius={r - pad - sw2 / 2} fill={undefined} stroke={innerClr} strokeWidth={sw2} />
                      </>);
                    }
                    if (shapeDef.kind === "polygon" && shapeDef.polyPoints) {
                      const pts = shapeDef.polyPoints;
                      const outerFlat: number[] = [];
                      const innerFlat: number[] = [];
                      // Compute centroid
                      let cx = 0, cy = 0;
                      for (let i = 0; i < pts.length; i += 2) { cx += pts[i]; cy += pts[i + 1]; }
                      cx /= (pts.length / 2); cy /= (pts.length / 2);
                      for (let i = 0; i < pts.length; i += 2) {
                        const px = pts[i] * w; const py = pts[i + 1] * h;
                        outerFlat.push(px, py);
                        // Inset toward centroid for inner border
                        const dx = cx * w - px; const dy = cy * h - py;
                        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                        innerFlat.push(px + (dx / dist) * pad * 1.5, py + (dy / dist) * pad * 1.5);
                      }
                      return (<>
                        <Line points={outerFlat} closed fill={fill} stroke={borderClr} strokeWidth={sw} lineJoin="round" />
                        <Line points={innerFlat} closed fill={undefined} stroke={innerClr} strokeWidth={sw2} lineJoin="round" />
                      </>);
                    }
                    return null;
                  };

                  return (
                    <Group
                      key={label.id} id={label.id}
                      x={label.x + w / 2} y={label.y + h / 2}
                      width={w} height={h}
                      offsetX={w / 2} offsetY={h / 2}
                      rotation={label.rotation} draggable
                      onClick={() => {
                        setSelectedId(label.id);
                        setSelectedType("label");
                        setActiveTab("labels");
                      }}
                      onTap={() => {
                        setSelectedId(label.id);
                        setSelectedType("label");
                        setActiveTab("labels");
                      }}
                      onDblClick={() => {
                        setSelectedId(label.id);
                        setSelectedType("label");
                        setActiveTab("labels");
                        setTimeout(() => openLabelInlineEditor(label), 50);
                      }}
                      onDblTap={() => {
                        setSelectedId(label.id);
                        setSelectedType("label");
                        setActiveTab("labels");
                        setTimeout(() => openLabelInlineEditor(label), 50);
                      }}
                      onDragMove={handleDragMove}
                      onDragEnd={(e) => handleLabelDragEnd(label.id, e)}
                      onTransformEnd={(e) => handleLabelTransformEnd(label.id, e)}
                    >
                      {/* Hit area for selection (transparent) */}
                      <Rect width={w} height={h} fill="transparent"
                        stroke={selectedId === label.id ? "#475569" : undefined}
                        strokeWidth={selectedId === label.id ? 1 : 0}
                        dash={selectedId === label.id ? [4, 4] : undefined} />
                      {/* Shape outline (Konva primitives — truly transparent bg) */}
                      {renderShapeOutline()}
                      <Text text={label.text}
                        width={w * 0.8} height={h * 0.6}
                        x={w * 0.1} y={h * 0.2}
                        fontSize={label.fontSize} fontFamily={label.fontFamily}
                        fill={label.fill} align={label.textAlign}
                        verticalAlign="middle" wrap="word" />
                    </Group>
                  );
                })}

                {/* ArtKey Template (draggable QR placeholder) */}
                {artKeyItem && activePlacement === artKeyItem.placement && (
                  <Group
                    id="artkey-template"
                    x={artKeyItem.x} y={artKeyItem.y}
                    width={artKeyItem.width} height={artKeyItem.height}
                    draggable
                    onClick={() => { setSelectedId("artkey-template"); setSelectedType("artkey"); }}
                    onTap={() => { setSelectedId("artkey-template"); setSelectedType("artkey"); }}
                    onDragMove={handleDragMove}
                    onDragEnd={(e) => {
                      handleDragEnd();
                      setArtKeyItem((prev) => prev ? { ...prev, x: e.target.x(), y: e.target.y() } : null);
                    }}
                  >
                    {/* Background: ArtKey SVG or fallback */}
                    {artKeyImg ? (
                      <KonvaImage image={artKeyImg} width={artKeyItem.width} height={artKeyItem.height} />
                    ) : (
                      <Rect width={artKeyItem.width} height={artKeyItem.height}
                        fill="#f3f3f3" stroke="#475569" strokeWidth={2} dash={[6, 3]} cornerRadius={8} />
                    )}
                    {/* QR code — square, centered inside the box with padding */}
                    {(() => {
                      const bx = artKeyItem.width * AK_QR.rx;
                      const by = artKeyItem.height * AK_QR.ry;
                      const bw = artKeyItem.width * AK_QR.rw;
                      const bh = artKeyItem.height * AK_QR.rh;
                      const borderW = 5; // border thickness in display px
                      const padding = 0.5; // padding between border and QR code
                      // QR is square — use the smaller inner dimension
                      const innerW = bw - (borderW + padding) * 2;
                      const innerH = bh - (borderW + padding) * 2;
                      const qrSize = Math.min(innerW, innerH);
                      // Center the square QR inside the box
                      const qrX = bx + (bw - qrSize) / 2;
                      const qrY = by + (bh - qrSize) / 2;
                      return (
                        <>
                          {/* White background fills the box interior */}
                          <Rect x={bx} y={by} width={bw} height={bh} fill="#FFFFFF" />
                          {/* Square QR code image — centered with padding */}
                          {qrCodeImg ? (
                            <KonvaImage image={qrCodeImg}
                              x={qrX} y={qrY}
                              width={qrSize} height={qrSize} />
                          ) : (
                            <Rect x={qrX} y={qrY}
                              width={qrSize} height={qrSize}
                              fill="#f3f3f3" />
                          )}
                          {/* Border drawn on top of everything */}
                          <Rect x={bx} y={by} width={bw} height={bh}
                            fill="transparent" stroke="#000000" strokeWidth={borderW}
                            cornerRadius={0} />
                        </>
                      );
                    })()}
                  </Group>
                )}

                {/* Center guide lines — dual-stroke for contrast on any background */}
                {guideLines.v && (<>
                  <Line
                    points={[canvasWidth / 2, 0, canvasWidth / 2, canvasHeight]}
                    stroke="#000000" strokeWidth={3} dash={[6, 4]}
                    opacity={0.4} listening={false}
                  />
                  <Line
                    points={[canvasWidth / 2, 0, canvasWidth / 2, canvasHeight]}
                    stroke="#00E5FF" strokeWidth={1.5} dash={[6, 4]}
                    listening={false}
                  />
                </>)}
                {guideLines.h && (<>
                  <Line
                    points={[0, canvasHeight / 2, canvasWidth, canvasHeight / 2]}
                    stroke="#000000" strokeWidth={3} dash={[6, 4]}
                    opacity={0.4} listening={false}
                  />
                  <Line
                    points={[0, canvasHeight / 2, canvasWidth, canvasHeight / 2]}
                    stroke="#00E5FF" strokeWidth={1.5} dash={[6, 4]}
                    listening={false}
                  />
                </>)}

                {/* Transformer */}
                <Transformer
                  ref={transformerRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    if (newBox.width < 20 || newBox.height < 20) return oldBox;
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
