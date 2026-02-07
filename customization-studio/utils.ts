// customization-studio/utils.ts

import { Placement } from "./types";

/**
 * Calculate display scale to fit canvas in viewport
 */
export function getDisplayScale(canvasWidth: number, canvasHeight: number): number {
  const maxDisplayWidth = 800;
  const maxDisplayHeight = 600;
  
  const scaleX = maxDisplayWidth / canvasWidth;
  const scaleY = maxDisplayHeight / canvasHeight;
  
  return Math.min(scaleX, scaleY, 1);
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Fit an image to a slot while maintaining aspect ratio
 */
export function fitImageToSlot(
  imageWidth: number,
  imageHeight: number,
  slotWidth: number,
  slotHeight: number
): { width: number; height: number } {
  const imageAspect = imageWidth / imageHeight;
  const slotAspect = slotWidth / slotHeight;

  let width: number;
  let height: number;

  if (imageAspect > slotAspect) {
    // Image is wider than slot - fit to width
    width = slotWidth;
    height = slotWidth / imageAspect;
  } else {
    // Image is taller than slot - fit to height
    height = slotHeight;
    width = slotHeight * imageAspect;
  }

  return { width, height };
}

/**
 * Center an element within a slot
 */
export function centerInSlot(
  elementWidth: number,
  elementHeight: number,
  slotX: number,
  slotY: number,
  slotWidth: number,
  slotHeight: number
): { x: number; y: number } {
  return {
    x: slotX + (slotWidth - elementWidth) / 2,
    y: slotY + (slotHeight - elementHeight) / 2,
  };
}

/**
 * Human-readable placement labels
 */
export const PLACEMENT_LABELS: Record<Placement, string> = {
  front: "Front",
  back: "Back",
  inside1: "Inside Left",
  inside2: "Inside Right",
};

/**
 * Convert data URL to Blob
 */
export function dataURLtoBlob(dataURL: string): Blob {
  const arr = dataURL.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Download a data URL as a file
 */
export function downloadDataURL(dataURL: string, filename: string): void {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataURL;
  link.click();
}
