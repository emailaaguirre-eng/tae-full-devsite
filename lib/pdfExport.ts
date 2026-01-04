/**
 * PDF Export Utilities
 * SPRINT 4: Print-native PDF export with vector text, ornaments, and images
 */

import PDFDocument from 'pdfkit';
import type { PDFDocument as PDFDocumentType } from 'pdfkit';
import { PrintSpec, PrintSide } from './printSpecs';
import type { EditorObject } from '@/components/ProjectEditor/types';
import { getOrnamentById } from './ornaments';

// PDF dimensions in points (1/72 inch)
// PDF uses points, so we need to convert from mm
function mmToPoints(mm: number): number {
  return (mm / 25.4) * 72; // mm -> inches -> points
}

/**
 * Export design to PDF
 * SPRINT 4: Print-native PDF with vector elements
 */
export async function exportDesignToPDF(
  printSpec: PrintSpec,
  sideStates: Record<string, { objects: EditorObject[] }>,
  options: {
    includeBleed?: boolean;
    embedFonts?: boolean;
  } = {}
): Promise<Buffer> {
  const { includeBleed = true, embedFonts = true } = options;
  
  // Create PDF document
  const doc = new PDFDocument({
    size: 'A4', // Will be overridden by page dimensions
    margin: 0,
    autoFirstPage: false,
  });
  
  const buffers: Buffer[] = [];
  doc.on('data', buffers.push.bind(buffers));
  
  // Export each side as a separate page
  for (const sideId of printSpec.sideIds) {
    const side = printSpec.sides.find(s => s.id === sideId);
    if (!side) continue;
    
    const objects = sideStates[sideId]?.objects || [];
    
    // Calculate page dimensions in points (including bleed if requested)
    const pageWidth = includeBleed
      ? mmToPoints(side.trimMm.w + (side.bleedMm * 2))
      : mmToPoints(side.trimMm.w);
    const pageHeight = includeBleed
      ? mmToPoints(side.trimMm.h + (side.bleedMm * 2))
      : mmToPoints(side.trimMm.h);
    
    // Add page
    doc.addPage({
      size: [pageWidth, pageHeight],
      margin: 0,
    });
    
    // Offset for bleed (if included)
    const bleedOffset = includeBleed ? mmToPoints(side.bleedMm) : 0;
    
    // Render objects
    for (const obj of objects) {
      await renderObjectToPDF(doc, obj, side, bleedOffset, {
        embedFonts,
        includeBleed,
      });
    }
  }
  
  doc.end();
  
  // Wait for PDF to finish generating
  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });
    doc.on('error', reject);
  });
}

/**
 * Render an object to PDF
 */
async function renderObjectToPDF(
  doc: PDFDocumentType,
  obj: EditorObject,
  side: PrintSide,
  bleedOffset: number,
  options: {
    embedFonts: boolean;
    includeBleed: boolean;
  }
): Promise<void> {
  const { embedFonts } = options;
  
  // Convert object coordinates from screen pixels to PDF points
  // Objects are stored in screen pixel coordinates (96 DPI)
  // PDF uses points (72 DPI)
  // We need to convert: screen pixels -> mm -> points
  const SCREEN_DPI = 96;
  const POINTS_PER_INCH = 72;
  
  // Convert screen pixels to mm, then to points
  function pxToPoints(px: number): number {
    const mm = (px / SCREEN_DPI) * 25.4;
    return mmToPoints(mm);
  }
  
  const x = pxToPoints(obj.x) + bleedOffset;
  const y = pxToPoints(obj.y) + bleedOffset;
  
  switch (obj.type) {
    case 'text':
      await renderTextToPDF(doc, obj, x, y, embedFonts);
      break;
    case 'image':
      await renderImageToPDF(doc, obj, x, y, side);
      break;
    case 'label-shape':
      await renderLabelShapeToPDF(doc, obj, x, y, embedFonts);
      break;
    case 'border':
      if (obj.ornamentId) {
        await renderOrnamentToPDF(doc, obj, x, y);
      }
      break;
    default:
      // Other types not yet supported
      break;
  }
}

/**
 * Render text as PDF text (vector)
 */
async function renderTextToPDF(
  doc: PDFDocumentType,
  obj: EditorObject,
  x: number,
  y: number,
  embedFonts: boolean
): Promise<void> {
  if (!obj.text) return;
  
  const fontSize = (obj.fontSize || 16) * (72 / 96); // Convert px to points (approximate)
  const fontFamily = obj.fontFamily || 'Helvetica';
  const fontWeight = obj.fontWeight || 400;
  const fill = obj.fill || '#000000';
  
  // Map font family to PDF standard fonts
  // For embedded fonts, we'd load font files here
  let pdfFont = 'Helvetica';
  if (fontFamily.includes('Times') || fontFamily.includes('serif')) {
    pdfFont = fontWeight >= 600 ? 'Times-Bold' : 'Times-Roman';
  } else if (fontFamily.includes('Courier') || fontFamily.includes('mono')) {
    pdfFont = fontWeight >= 600 ? 'Courier-Bold' : 'Courier';
  } else {
    pdfFont = fontWeight >= 600 ? 'Helvetica-Bold' : 'Helvetica';
  }
  
  // Convert hex color to RGB
  const color = hexToRgb(fill);
  
  doc
    .font(pdfFont)
    .fontSize(fontSize)
    .fillColor([color.r, color.g, color.b])
    .text(obj.text, x, y, {
      width: obj.width ? (obj.width * (72 / 96)) : undefined,
      height: obj.height ? (obj.height * (72 / 96)) : undefined,
      align: obj.textAlign === 'center' ? 'center' : 'left',
      lineGap: (obj.lineHeight || 1.2) * fontSize * 0.2,
    });
}

/**
 * Render image embedded at correct resolution
 */
async function renderImageToPDF(
  doc: PDFDocumentType,
  obj: EditorObject,
  x: number,
  y: number,
  side: PrintSide
): Promise<void> {
  if (!obj.src) return;
  
  // For images, we need to fetch the image data
  // In a real implementation, we'd fetch from URL or use base64 data
  // For now, we'll handle base64 data URLs
  let imageData: Buffer | string | undefined;
  
  if (obj.src.startsWith('data:')) {
    // Base64 data URL
    const base64Data = obj.src.split(',')[1];
    imageData = Buffer.from(base64Data, 'base64');
  } else if (obj.src.startsWith('http')) {
    // Fetch from URL (would need fetch in Node.js environment)
    // For now, skip remote URLs
    return;
  } else {
    // Local file path (would read from filesystem)
    // For now, skip
    return;
  }
  
  if (!imageData) return;
  
  // Calculate dimensions in points
  const width = obj.width ? (obj.width * (72 / 96)) : 100;
  const height = obj.height ? (obj.height * (72 / 96)) : 100;
  
  try {
    doc.image(imageData, x, y, {
      width,
      height,
      fit: [width, height],
    });
  } catch (error) {
    console.error('Error rendering image to PDF:', error);
  }
}

/**
 * Render label shape (with text)
 */
async function renderLabelShapeToPDF(
  doc: PDFDocumentType,
  obj: EditorObject,
  x: number,
  y: number,
  embedFonts: boolean
): Promise<void> {
  const width = obj.width ? (obj.width * (72 / 96)) : 100;
  const height = obj.height ? (obj.height * (72 / 96)) : 100;
  
  // Draw background shape
  if (obj.backgroundColor) {
    const bgColor = hexToRgb(obj.backgroundColor);
    doc.rect(x, y, width, height)
      .fillColor([bgColor.r, bgColor.g, bgColor.b])
      .fill();
  }
  
  // Draw border if enabled
  if (obj.borderEnabled && obj.borderColor) {
    const borderColor = hexToRgb(obj.borderColor);
    const borderWidth = obj.borderWidth || 2;
    doc.rect(x, y, width, height)
      .strokeColor([borderColor.r, borderColor.g, borderColor.b])
      .lineWidth(borderWidth * (72 / 96))
      .stroke();
  }
  
  // Render text on top
  if (obj.text) {
    await renderTextToPDF(doc, obj, x + (width / 2), y + (height / 2), embedFonts);
  }
}

/**
 * Render ornament as vector path
 */
async function renderOrnamentToPDF(
  doc: PDFDocumentType,
  obj: EditorObject,
  x: number,
  y: number
): Promise<void> {
  if (!obj.ornamentId) return;
  
  const ornament = getOrnamentById(obj.ornamentId);
  if (!ornament) return;
  
  const width = obj.width ? (obj.width * (72 / 96)) : mmToPoints(ornament.defaultWidth);
  const height = obj.height ? (obj.height * (72 / 96)) : mmToPoints(ornament.defaultHeight);
  
  // Parse viewBox to get scale factors
  const viewBoxParts = ornament.viewBox.split(' ').map(Number);
  const viewBoxWidth = viewBoxParts[2];
  const viewBoxHeight = viewBoxParts[3];
  const scaleX = width / viewBoxWidth;
  const scaleY = height / viewBoxHeight;
  
  // For SVG paths, PDFKit doesn't directly support SVG path commands
  // We'd need to convert SVG path to PDF path commands
  // For now, this is a placeholder - full SVG path parsing would be needed
  // This is complex and would require a SVG path parser library
  
  // Placeholder: Draw a simple rectangle to indicate ornament position
  const strokeColor = hexToRgb('#000000');
  doc.rect(x, y, width, height)
    .strokeColor([strokeColor.r, strokeColor.g, strokeColor.b])
    .lineWidth(1)
    .stroke();
  
  // TODO: Implement full SVG path to PDF path conversion
  // This would require parsing SVG path commands (M, L, C, Q, Z, etc.)
  // and converting them to PDF path commands
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

