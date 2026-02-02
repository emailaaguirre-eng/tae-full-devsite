// customization-studio/utils.ts
// Shared helpers for the Customization Studio (layout math, downloads, etc.)

import type { Placement } from "./types";

export const PLACEMENT_LABELS: Record<Placement, string> = {
  front: "Front",
  back: "Back",
  inside1: "Inside (Left)",
  inside2: "Inside (Right)",
};

// Compute a base display scale to fit a print-canvas into an available viewport.
// Defaults match the original editor assumptions (800×600).
export function getDisplayScale(
  canvasWidth: number,
  canvasHeight: number,
  maxDisplayWidth: number = 800,
  maxDisplayHeight: number = 600
): number {
  if (canvasWidth <= 0 || canvasHeight <= 0) return 1;
  const scaleW = maxDisplayWidth / canvasWidth;
  const scaleH = maxDisplayHeight / canvasHeight;
  return Math.min(scaleW, scaleH, 1);
}

// Simple clamp
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// A stable-enough id for client-only editor state.
// IMPORTANT: must be safe for Konva's CSS-like selectors (Transformer uses `#id`).
// Prefix with a letter to avoid selectors breaking when IDs start with digits.
export function generateId(prefix: string = "cs"): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${time}_${rand}`;
}

// Contain fit (no cropping) inside a slot
export function fitImageToSlot(
  imageWidth: number,
  imageHeight: number,
  slotWidth: number,
  slotHeight: number
): { width: number; height: number } {
  const imageAspect = imageWidth / imageHeight;
  const slotAspect = slotWidth / slotHeight;

  if (imageAspect > slotAspect) {
    return {
      width: slotWidth,
      height: slotWidth / imageAspect,
    };
  }

  return {
    width: slotHeight * imageAspect,
    height: slotHeight,
  };
}

// Cover fit (cropping allowed) for collage slots
export function coverImageToSlot(
  imageWidth: number,
  imageHeight: number,
  slotWidth: number,
  slotHeight: number
): { width: number; height: number } {
  const imageAspect = imageWidth / imageHeight;
  const slotAspect = slotWidth / slotHeight;

  if (imageAspect > slotAspect) {
    // Wider than slot: match height, overflow width
    return {
      width: slotHeight * imageAspect,
      height: slotHeight,
    };
  }

  // Taller than slot: match width, overflow height
  return {
    width: slotWidth,
    height: slotWidth / imageAspect,
  };
}

// Center an item inside a slot (in absolute canvas coords)
export function centerInSlot(
  itemWidth: number,
  itemHeight: number,
  slotX: number,
  slotY: number,
  slotWidth: number,
  slotHeight: number
): { x: number; y: number } {
  return {
    x: slotX + (slotWidth - itemWidth) / 2,
    y: slotY + (slotHeight - itemHeight) / 2,
  };
}

export function dataURLtoBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(",");
  const mimeMatch = parts[0]?.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/png";
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export function downloadDataURL(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
