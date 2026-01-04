/**
 * Image Crop Utilities
 * SPRINT 3: Image cropping with fit/fill modes
 */

export type CropMode = 'fit' | 'fill';

export interface ImageCropData {
  mode: CropMode;
  frameX: number;
  frameY: number;
  frameWidth: number;
  frameHeight: number;
  imageX: number;
  imageY: number;
  imageWidth: number;
  imageHeight: number;
}

/**
 * Calculate image position and scale for "fit" mode
 * Image is scaled to fit entirely within the frame
 */
export function calculateFitCrop(
  frameWidth: number,
  frameHeight: number,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number; width: number; height: number } {
  const frameAspect = frameWidth / frameHeight;
  const imageAspect = imageWidth / imageHeight;
  
  let scaledWidth: number;
  let scaledHeight: number;
  
  if (imageAspect > frameAspect) {
    // Image is wider than frame - fit to width
    scaledWidth = frameWidth;
    scaledHeight = frameWidth / imageAspect;
  } else {
    // Image is taller than frame - fit to height
    scaledHeight = frameHeight;
    scaledWidth = frameHeight * imageAspect;
  }
  
  // Center the image
  const x = (frameWidth - scaledWidth) / 2;
  const y = (frameHeight - scaledHeight) / 2;
  
  return { x, y, width: scaledWidth, height: scaledHeight };
}

/**
 * Calculate image position and scale for "fill" mode
 * Image is scaled to fill the entire frame (may crop edges)
 */
export function calculateFillCrop(
  frameWidth: number,
  frameHeight: number,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number; width: number; height: number } {
  const frameAspect = frameWidth / frameHeight;
  const imageAspect = imageWidth / imageHeight;
  
  let scaledWidth: number;
  let scaledHeight: number;
  
  if (imageAspect > frameAspect) {
    // Image is wider - scale to height (crop sides)
    scaledHeight = frameHeight;
    scaledWidth = frameHeight * imageAspect;
  } else {
    // Image is taller - scale to width (crop top/bottom)
    scaledWidth = frameWidth;
    scaledHeight = frameWidth / imageAspect;
  }
  
  // Center the image
  const x = (frameWidth - scaledWidth) / 2;
  const y = (frameHeight - scaledHeight) / 2;
  
  return { x, y, width: scaledWidth, height: scaledHeight };
}

