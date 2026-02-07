/**
 * Server-Side Rendering
 * SPRINT 1: Render Design JSON to PNG deterministically
 */

import sharp from 'sharp';
import { DesignJSON, DesignElement } from './designModel';
import { mmToPx, DEFAULT_DPI } from './printSpecs';

/**
 * Render Design JSON to PNG buffer
 * SPRINT 1: Deterministic server-side rendering
 */
export async function renderDesignToPNG(
  design: DesignJSON,
  pageId: string = 'front',
  options: {
    dpi?: number;
    includeBleed?: boolean;
  } = {}
): Promise<Buffer> {
  const { dpi = DEFAULT_DPI, includeBleed = true } = options;
  const { printSpec } = design;
  
  // Find the page
  const page = design.pages.find(p => p.id === pageId);
  if (!page) {
    throw new Error(`Page ${pageId} not found in design`);
  }
  
  // Calculate canvas dimensions in pixels
  const bleedW_mm = printSpec.trimW_mm + (printSpec.bleed_mm * 2);
  const bleedH_mm = printSpec.trimH_mm + (printSpec.bleed_mm * 2);
  
  const canvasW = includeBleed
    ? Math.round(mmToPx(bleedW_mm, dpi))
    : Math.round(mmToPx(printSpec.trimW_mm, dpi));
  const canvasH = includeBleed
    ? Math.round(mmToPx(bleedH_mm, dpi))
    : Math.round(mmToPx(printSpec.trimH_mm, dpi));
  
  // Create base image (white background)
  let image = sharp({
    create: {
      width: canvasW,
      height: canvasH,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  });
  
  // Render elements in zIndex order
  const sortedElements = [...page.elements].sort((a, b) => a.zIndex - b.zIndex);
  
  // Offset for bleed (if included)
  const bleedOffsetPx = includeBleed ? Math.round(mmToPx(printSpec.bleed_mm, dpi)) : 0;
  
  // Render each element
  for (const element of sortedElements) {
    try {
      const elementImage = await renderElement(element, printSpec, dpi, bleedOffsetPx);
      if (elementImage) {
        // Composite element onto canvas
        image = image.composite([{
          input: elementImage,
          left: Math.round(mmToPx(element.x_mm, dpi) + bleedOffsetPx),
          top: Math.round(mmToPx(element.y_mm, dpi) + bleedOffsetPx),
        }]);
      }
    } catch (error) {
      console.error(`Error rendering element ${element.id}:`, error);
      // Continue with other elements
    }
  }
  
  // Return PNG buffer
  return await image.png().toBuffer();
}

/**
 * Render a single element to image buffer
 */
async function renderElement(
  element: DesignElement,
  printSpec: DesignJSON['printSpec'],
  dpi: number,
  bleedOffsetPx: number
): Promise<Buffer | null> {
  const w_px = Math.round(mmToPx(element.w_mm, dpi));
  const h_px = Math.round(mmToPx(element.h_mm, dpi));
  
  switch (element.type) {
    case 'image':
      return await renderImageElement(element, w_px, h_px);
    
    case 'text':
      return await renderTextElement(element, w_px, h_px, dpi);
    
    case 'label':
      return await renderLabelElement(element, w_px, h_px, dpi);
    
    case 'ornament':
      // Ornaments would be rendered as SVG paths
      // For now, return null (placeholder)
      return null;
    
    default:
      return null;
  }
}

/**
 * Render image element
 */
async function renderImageElement(
  element: DesignElement & { type: 'image' },
  w_px: number,
  h_px: number
): Promise<Buffer | null> {
  if (!element.src) return null;
  
  try {
    let imageBuffer: Buffer;
    
    if (element.src.startsWith('data:')) {
      // Base64 data URL
      const base64Data = element.src.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else if (element.src.startsWith('http')) {
      // Fetch from URL (would need fetch in Node.js)
      // For now, skip remote URLs
      return null;
    } else {
      // Local file path
      const fs = require('fs');
      if (fs.existsSync(element.src)) {
        imageBuffer = fs.readFileSync(element.src);
      } else {
        return null;
      }
    }
    
    // Resize image to element dimensions
    let image = sharp(imageBuffer);
    
    // Apply crop if specified
    if (element.cropRect) {
      // CropRect is in image coordinates (normalized 0-1 or pixels)
      // For now, assume normalized coordinates
      const imgMeta = await image.metadata();
      const cropX = Math.round(element.cropRect.x * (imgMeta.width || 0));
      const cropY = Math.round(element.cropRect.y * (imgMeta.height || 0));
      const cropW = Math.round(element.cropRect.w * (imgMeta.width || 0));
      const cropH = Math.round(element.cropRect.h * (imgMeta.height || 0));
      
      image = image.extract({ left: cropX, top: cropY, width: cropW, height: cropH });
    }
    
    // Resize to element dimensions
    image = image.resize(w_px, h_px, {
      fit: element.fitMode === 'fill' ? 'cover' : 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    });
    
    // Apply opacity if specified
    if (element.opacity !== undefined && element.opacity < 1) {
      // Sharp doesn't directly support opacity, would need composite with alpha
      // For now, skip opacity adjustment
    }
    
    return await image.png().toBuffer();
  } catch (error) {
    console.error('Error rendering image element:', error);
    return null;
  }
}

/**
 * Render text element
 */
async function renderTextElement(
  element: DesignElement & { type: 'text' },
  w_px: number,
  h_px: number,
  dpi: number
): Promise<Buffer | null> {
  // For text rendering, we'll use Sharp's text capability
  // Sharp can render text using SVG
  
  const fontSize_px = Math.round((element.fontSize_pt / 72) * dpi);
  const text = element.text || '';
  
  if (!text) return null;
  
  // Create SVG with text
  const svg = `
    <svg width="${w_px}" height="${h_px}" xmlns="http://www.w3.org/2000/svg">
      <text
        x="${element.align === 'center' ? w_px / 2 : element.align === 'right' ? w_px : 0}"
        y="${fontSize_px}"
        font-family="${element.fontFamily}"
        font-size="${fontSize_px}"
        font-weight="${element.fontWeight}"
        fill="${element.fill}"
        text-anchor="${element.align === 'center' ? 'middle' : element.align === 'right' ? 'end' : 'start'}"
        dominant-baseline="hanging"
      >${escapeXml(text)}</text>
    </svg>
  `;
  
  try {
    const image = sharp(Buffer.from(svg))
      .resize(w_px, h_px)
      .png();
    
    return await image.toBuffer();
  } catch (error) {
    console.error('Error rendering text element:', error);
    return null;
  }
}

/**
 * Render label element
 */
async function renderLabelElement(
  element: DesignElement & { type: 'label' },
  w_px: number,
  h_px: number,
  dpi: number
): Promise<Buffer | null> {
  const padding_px = Math.round(mmToPx(element.padding_mm, dpi));
  const cornerRadius_px = element.cornerRadius_mm
    ? Math.round(mmToPx(element.cornerRadius_mm, dpi))
    : 0;
  const strokeWidth_px = element.stroke?.enabled
    ? Math.round(mmToPx(element.stroke.width_mm, dpi))
    : 0;
  
  const fontSize_px = Math.round((element.textProps.fontSize_pt / 72) * dpi);
  const text = element.textProps.text || '';
  
  // Create SVG with label shape and text
  const svg = `
    <svg width="${w_px}" height="${h_px}" xmlns="http://www.w3.org/2000/svg">
      <rect
        x="${strokeWidth_px / 2}"
        y="${strokeWidth_px / 2}"
        width="${w_px - strokeWidth_px}"
        height="${h_px - strokeWidth_px}"
        rx="${cornerRadius_px}"
        ry="${cornerRadius_px}"
        fill="${element.fill}"
        ${element.stroke?.enabled ? `stroke="${element.stroke.color}" stroke-width="${strokeWidth_px}"` : ''}
      />
      <text
        x="${w_px / 2}"
        y="${h_px / 2}"
        font-family="${element.textProps.fontFamily}"
        font-size="${fontSize_px}"
        font-weight="${element.textProps.fontWeight}"
        fill="${element.textProps.fill}"
        text-anchor="middle"
        dominant-baseline="middle"
      >${escapeXml(text)}</text>
    </svg>
  `;
  
  try {
    const image = sharp(Buffer.from(svg))
      .resize(w_px, h_px)
      .png();
    
    return await image.toBuffer();
  } catch (error) {
    console.error('Error rendering label element:', error);
    return null;
  }
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

