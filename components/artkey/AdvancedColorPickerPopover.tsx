"use client";

import React, { useEffect, useState } from "react";

type Props = {
  title: string;
  value: string;
  alpha: number;
  recentColors: string[];
  onChange: (value: string, alpha: number) => void;
  onSelectRecent: (value: string) => void;
  onClose: () => void;
  palette?: {
    primary: string;
    alt: string;
    accent: string;
  };
};

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setPrefersReducedMotion(media.matches);
    onChange();
    media.addEventListener?.("change", onChange);
    return () => media.removeEventListener?.("change", onChange);
  }, []);

  return prefersReducedMotion;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(normalized)) return null;
  const full = normalized.length === 3 ? normalized.split("").map((c) => c + c).join("") : normalized;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
    .join("")}`;
}

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const r1 = r / 255;
  const g1 = g / 255;
  const b1 = b / 255;
  const max = Math.max(r1, g1, b1);
  const min = Math.min(r1, g1, b1);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r1) h = ((g1 - b1) / delta) % 6;
    else if (max === g1) h = (b1 - r1) / delta + 2;
    else h = (r1 - g1) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : delta / max;
  const v = max;
  return { h, s, v };
}

function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const hh = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = v - c;
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (hh < 60) [r1, g1, b1] = [c, x, 0];
  else if (hh < 120) [r1, g1, b1] = [x, c, 0];
  else if (hh < 180) [r1, g1, b1] = [0, c, x];
  else if (hh < 240) [r1, g1, b1] = [0, x, c];
  else if (hh < 300) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

function parseColor(input: string): { r: number; g: number; b: number; a: number } {
  const fallback = { r: 0, g: 0, b: 0, a: 1 };
  if (!input) return fallback;
  const raw = String(input).trim();
  const hex = hexToRgb(raw);
  if (hex) return { ...hex, a: 1 };

  const rgba = raw.match(
    /^rgba?\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})(?:\s*,\s*(0|0?\.\d+|1(?:\.0+)?)\s*)?\)$/i
  );
  if (!rgba) return fallback;
  return {
    r: Math.min(255, parseInt(rgba[1], 10)),
    g: Math.min(255, parseInt(rgba[2], 10)),
    b: Math.min(255, parseInt(rgba[3], 10)),
    a: clamp01(rgba[4] !== undefined ? parseFloat(rgba[4]) : 1),
  };
}

function normalizeHexInput(raw: string) {
  const withHash = raw.startsWith("#") ? raw : `#${raw}`;
  const cleaned = withHash.replace(/[^#0-9a-fA-F]/g, "");
  return cleaned.slice(0, 7);
}

export function AdvancedColorPickerPopover({
  title,
  value,
  alpha,
  recentColors,
  onChange,
  onSelectRecent,
  onClose,
  palette,
}: Props) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [draggingSV, setDraggingSV] = useState(false);
  const [hsv, setHsv] = useState(() => {
    const parsed = parseColor(value);
    return rgbToHsv(parsed.r, parsed.g, parsed.b);
  });
  const [localAlpha, setLocalAlpha] = useState(clamp01(alpha));
  const [hexInput, setHexInput] = useState(
    value.startsWith("#") ? value : rgbToHex(parseColor(value).r, parseColor(value).g, parseColor(value).b)
  );

  const brandPalette = ["#1a1a2e", "#16213e", "#353535", "#C9A962", "#D4AF37", "#ffffff", "#000000", "#ef4444", "#3b82f6", "#10b981"];
  const accent = palette?.accent || "#353535";
  const alt = palette?.alt || "#ECECE9";
  const primary = palette?.primary || "#FFFFFF";

  useEffect(() => {
    const parsed = parseColor(value);
    setHsv(rgbToHsv(parsed.r, parsed.g, parsed.b));
    setLocalAlpha(clamp01(alpha));
    setHexInput(rgbToHex(parsed.r, parsed.g, parsed.b));
  }, [value, alpha]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!popoverRef.current) return;
      if (!popoverRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [onClose]);

  useEffect(() => {
    const onPointerUp = () => setDraggingSV(false);
    document.addEventListener("pointerup", onPointerUp);
    return () => document.removeEventListener("pointerup", onPointerUp);
  }, []);

  const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
  const hexValue = rgbToHex(rgb.r, rgb.g, rgb.b);
  const composed = localAlpha >= 0.999 ? hexValue : `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${localAlpha.toFixed(2)})`;

  useEffect(() => {
    onChange(composed, localAlpha);
  }, [composed, localAlpha, onChange]);

  const applySVFromPointer = (clientX: number, clientY: number, element: HTMLDivElement) => {
    const rect = element.getBoundingClientRect();
    const s = clamp01((clientX - rect.left) / rect.width);
    const v = clamp01(1 - (clientY - rect.top) / rect.height);
    setHsv((prev) => ({ ...prev, s, v }));
  };

  const panel = (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label={title}
      className="mt-3 p-3 rounded-xl border-2 shadow-lg"
      style={{ borderColor: accent, background: alt, transition: prefersReducedMotion ? "none" : "all 140ms ease" }}
    >
      <div className="flex items-center justify-between mb-2">
        <h5 className="text-sm font-semibold" style={{ color: accent }}>{title}</h5>
        <button
          type="button"
          onClick={onClose}
          className="px-2 py-1 rounded text-xs"
          style={{ border: "1px solid #d8d8d6", background: primary, color: accent }}
          aria-label="Close color picker"
        >
          Done
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_18px] gap-3">
        <div
          role="slider"
          aria-label="Saturation and brightness"
          tabIndex={0}
          className="relative h-40 rounded-lg cursor-crosshair border"
          style={{
            backgroundColor: `hsl(${Math.round(hsv.h)}, 100%, 50%)`,
            borderColor: "#d8d8d6",
            backgroundImage: "linear-gradient(to right, #fff, rgba(255,255,255,0)), linear-gradient(to top, #000, rgba(0,0,0,0))",
          }}
          onPointerDown={(e) => {
            setDraggingSV(true);
            applySVFromPointer(e.clientX, e.clientY, e.currentTarget as HTMLDivElement);
          }}
          onPointerMove={(e) => {
            if (!draggingSV) return;
            applySVFromPointer(e.clientX, e.clientY, e.currentTarget as HTMLDivElement);
          }}
          onKeyDown={(e) => {
            const step = e.shiftKey ? 0.05 : 0.02;
            if (e.key === "ArrowLeft") setHsv((prev) => ({ ...prev, s: clamp01(prev.s - step) }));
            if (e.key === "ArrowRight") setHsv((prev) => ({ ...prev, s: clamp01(prev.s + step) }));
            if (e.key === "ArrowUp") setHsv((prev) => ({ ...prev, v: clamp01(prev.v + step) }));
            if (e.key === "ArrowDown") setHsv((prev) => ({ ...prev, v: clamp01(prev.v - step) }));
          }}
        >
          <div
            className="absolute w-4 h-4 rounded-full border-2 border-white shadow"
            style={{
              left: `${hsv.s * 100}%`,
              top: `${(1 - hsv.v) * 100}%`,
              transform: "translate(-50%, -50%)",
              boxShadow: "0 0 0 1px rgba(0,0,0,0.2)",
            }}
          />
        </div>

        <input
          aria-label="Hue"
          type="range"
          min={0}
          max={360}
          step={1}
          value={Math.round(hsv.h)}
          onChange={(e) => setHsv((prev) => ({ ...prev, h: Number(e.target.value) }))}
          className="h-40 sm:h-auto sm:w-[18px]"
          style={{
            writingMode: "vertical-lr",
            direction: "rtl",
          }}
        />
      </div>

      <div className="mt-3">
        <label className="block text-xs font-medium mb-1" style={{ color: accent }}>Hex</label>
        <input
          type="text"
          value={hexInput}
          onChange={(e) => setHexInput(normalizeHexInput(e.target.value))}
          onBlur={() => {
            const parsed = hexToRgb(hexInput);
            if (!parsed) {
              setHexInput(hexValue);
              return;
            }
            setHsv(rgbToHsv(parsed.r, parsed.g, parsed.b));
            setHexInput(rgbToHex(parsed.r, parsed.g, parsed.b));
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            const parsed = hexToRgb(hexInput);
            if (!parsed) return;
            setHsv(rgbToHsv(parsed.r, parsed.g, parsed.b));
            setHexInput(rgbToHex(parsed.r, parsed.g, parsed.b));
          }}
          className="w-full px-2 py-1.5 rounded text-xs"
          style={{ border: "1px solid #d8d8d6" }}
          placeholder="#000000"
        />
      </div>

      <div className="mt-3">
        <label className="block text-xs font-medium mb-1" style={{ color: accent }}>
          Opacity ({Math.round(localAlpha * 100)}%)
        </label>
        <input
          aria-label="Opacity"
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(localAlpha * 100)}
          onChange={(e) => setLocalAlpha(Number(e.target.value) / 100)}
          className="w-full"
        />
      </div>

      {recentColors.length > 0 && (
        <div className="mt-3">
          <label className="block text-xs font-medium mb-1" style={{ color: accent }}>Recent</label>
          <div className="flex flex-wrap gap-2">
            {recentColors.map((c, idx) => (
              <button
                key={`${c}-${idx}`}
                type="button"
                onClick={() => onSelectRecent(c)}
                className="w-6 h-6 rounded border"
                style={{ background: c, borderColor: "#d8d8d6" }}
                title={c}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-3">
        <label className="block text-xs font-medium mb-1" style={{ color: accent }}>Brand Palette</label>
        <div className="flex flex-wrap gap-2">
          {brandPalette.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onSelectRecent(c)}
              className="w-6 h-6 rounded border"
              style={{ background: c, borderColor: "#d8d8d6" }}
              title={c}
            />
          ))}
        </div>
      </div>
    </div>
  );

  if (!isMobile) return panel;

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close color picker overlay"
      />
      <div className="absolute bottom-0 left-0 right-0 max-h-[82vh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl">
        {panel}
      </div>
    </div>
  );
}
