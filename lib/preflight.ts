/**
 * Preflight Checks
 * SPRINT 4: Comprehensive preflight validation before export
 */

import type { PrintSpec, PrintSide } from './printSpecs';
import type { EditorObject } from '@/components/ProjectEditor/types';
import { mmToPx, DEFAULT_DPI } from './printSpecs';

export interface PreflightResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const SCREEN_DPI = 96;

/**
 * Run comprehensive preflight checks
 */
export function runPreflightChecks(
  printSpec: PrintSpec,
  sideStates: Record<string, { objects: EditorObject[] }>
): PreflightResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check each side
  for (const sideId of printSpec.sideIds) {
    const side = printSpec.sides.find(s => s.id === sideId);
    if (!side) continue;
    
    const objects = sideStates[sideId]?.objects || [];
    
    // Check text safety (blocking)
    const textSafety = checkTextSafety(side, objects);
    errors.push(...textSafety.errors);
    warnings.push(...textSafety.warnings);
    
    // Check image resolution (warning)
    const imageResolution = checkImageResolution(side, objects);
    warnings.push(...imageResolution.warnings);
    
    // Check font sizes (warning)
    const fontSizes = checkFontSizes(objects);
    warnings.push(...fontSizes.warnings);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check text safety (blocking if outside safe zone)
 */
function checkTextSafety(
  side: PrintSide,
  objects: EditorObject[]
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
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
  
  for (const obj of objects) {
    if (obj.type === 'text' || obj.type === 'label-shape') {
      if (!obj.text) continue;
      
      // Estimate text bounding box
      const fontSize = obj.fontSize || 16;
      const fontWidth = fontSize * 0.6;
      const textWidth = (obj.text.length * fontWidth) * (obj.scaleX || 1);
      const textHeight = fontSize * (obj.scaleY || 1);
      
      const objX = obj.x;
      const objY = obj.y;
      const objRight = objX + textWidth;
      const objBottom = objY + textHeight;
      
      // Check if text is outside safe area (blocking error)
      if (objX < safeX || objY < safeY || objRight > safeX + safeW || objBottom > safeY + safeH) {
        errors.push(
          `Text "${obj.text.substring(0, 30)}..." on ${side.name || side.id} is outside the safe area`
        );
      }
    }
  }
  
  return { errors, warnings };
}

/**
 * Check image resolution (warning if too low)
 */
function checkImageResolution(
  side: PrintSide,
  objects: EditorObject[]
): { errors: string[]; warnings: string[] } {
  const warnings: string[] = [];
  
  // Minimum DPI for print (300 DPI recommended)
  const MIN_DPI = 200; // Warning threshold
  const RECOMMENDED_DPI = 300;
  
  for (const obj of objects) {
    if (obj.type === 'image' && obj.width && obj.height && obj.src) {
      // Estimate image DPI based on display size vs actual image size
      // This is approximate - we'd need actual image dimensions
      // For now, just warn about small images
      const displayWidthPx = obj.width;
      const displayHeightPx = obj.height;
      
      // Convert display pixels to print inches
      const printWidthInches = (displayWidthPx / SCREEN_DPI) * (SCREEN_DPI / DEFAULT_DPI);
      const printHeightInches = (displayHeightPx / SCREEN_DPI) * (SCREEN_DPI / DEFAULT_DPI);
      
      // If image is very small on screen, it's likely low resolution
      if (displayWidthPx < 200 || displayHeightPx < 200) {
        warnings.push(
          `Image on ${side.name || side.id} may have low resolution for print quality`
        );
      }
    }
  }
  
  return { errors: [], warnings };
}

/**
 * Check font sizes (warning if too small)
 */
function checkFontSizes(objects: EditorObject[]): { errors: string[]; warnings: string[] } {
  const warnings: string[] = [];
  const MIN_FONT_SIZE_PT = 7; // 7pt minimum for print readability
  
  for (const obj of objects) {
    if (obj.type === 'text' || obj.type === 'label-shape') {
      const fontSizePx = obj.fontSize || 16;
      const fontSizePt = fontSizePx * 0.75; // Approximate px to pt conversion
      
      if (fontSizePt < MIN_FONT_SIZE_PT) {
        warnings.push(
          `Font size ${fontSizePx}px (≈${fontSizePt.toFixed(1)}pt) may be too small for print readability`
        );
      }
    }
  }
  
  return { errors: [], warnings };
}

