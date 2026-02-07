/**
 * Design JSON Data Model
 * SPRINT 1: Independent scene graph structure (not tied to Konva)
 * 
 * This model represents the design in a print-accurate format with mm coordinates.
 */

export interface PrintSpecData {
  trimW_mm: number;
  trimH_mm: number;
  bleed_mm: number; // Default 4mm
  safe_mm: number; // Default 4mm
  orientation: 'portrait' | 'landscape';
  dpi?: number; // Default 300
  productUid?: string; // SPRINT 2: Lock spec to Gelato product
  variantUid?: string; // SPRINT 2: Lock spec to Gelato variant
}

export interface ImageElement {
  id: string;
  type: 'image';
  x_mm: number;
  y_mm: number;
  w_mm: number;
  h_mm: number;
  rotation_deg: number;
  zIndex: number;
  locked?: boolean;
  src: string; // URL or base64 data URL
  cropRect?: {
    x: number; // In image coordinates (0-1 normalized or pixels)
    y: number;
    w: number;
    h: number;
  };
  fitMode?: 'fit' | 'fill'; // How image fits within frame
  opacity?: number; // 0-1
}

export interface TextElement {
  id: string;
  type: 'text';
  x_mm: number;
  y_mm: number;
  w_mm?: number; // Optional width constraint
  h_mm?: number; // Optional height constraint
  rotation_deg: number;
  zIndex: number;
  locked?: boolean;
  text: string;
  fontFamily: string;
  fontWeight: number;
  fontSize_pt: number; // Font size in points
  lineHeight: number; // Multiplier (e.g., 1.2)
  tracking?: number; // Letter spacing in points
  align: 'left' | 'center' | 'right';
  fill: string; // Hex color
}

export interface LabelElement {
  id: string;
  type: 'label';
  x_mm: number;
  y_mm: number;
  w_mm: number;
  h_mm: number;
  rotation_deg: number;
  zIndex: number;
  locked?: boolean;
  shapePreset: string; // e.g., 'pill', 'ribbon', 'badge-circle'
  padding_mm: number;
  cornerRadius_mm?: number;
  stroke?: {
    enabled: boolean;
    width_mm: number;
    color: string;
  };
  fill: string; // Background color
  textProps: {
    text: string;
    fontFamily: string;
    fontWeight: number;
    fontSize_pt: number;
    fill: string;
  };
}

export interface OrnamentElement {
  id: string;
  type: 'ornament';
  x_mm: number;
  y_mm: number;
  w_mm: number;
  h_mm: number;
  rotation_deg: number;
  zIndex: number;
  locked?: boolean;
  ornamentId: string; // ID from ornaments library
  fill?: string;
  stroke?: string;
}

export type DesignElement = ImageElement | TextElement | LabelElement | OrnamentElement;

export interface Page {
  id: string; // e.g., 'front', 'back', 'inside-left'
  name?: string;
  elements: DesignElement[];
}

export interface DesignJSON {
  printSpec: PrintSpecData;
  pages: Page[];
  version?: string; // Design format version
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Convert EditorObject (Konva-based) to DesignElement (mm-based)
 */
export function editorObjectToDesignElement(
  obj: any, // EditorObject from ProjectEditor
  side: { trimMm: { w: number; h: number }; bleedMm: number },
  screenDpi: number = 96
): DesignElement | null {
  // Convert screen pixels to mm
  function pxToMm(px: number): number {
    return (px / screenDpi) * 25.4;
  }
  
  const x_mm = pxToMm(obj.x);
  const y_mm = pxToMm(obj.y);
  const w_mm = obj.width ? pxToMm(obj.width) : 0;
  const h_mm = obj.height ? pxToMm(obj.height) : 0;
  const rotation_deg = obj.rotation || 0;
  const zIndex = 0; // Could be derived from object order
  
  switch (obj.type) {
    case 'image':
      return {
        id: obj.id,
        type: 'image',
        x_mm,
        y_mm,
        w_mm,
        h_mm,
        rotation_deg,
        zIndex,
        locked: obj.locked,
        src: obj.src || '',
        fitMode: obj.cropMode || 'fit',
        opacity: obj.opacity !== undefined ? obj.opacity : 1,
      } as ImageElement;
    
    case 'text':
      return {
        id: obj.id,
        type: 'text',
        x_mm,
        y_mm,
        w_mm: obj.width ? pxToMm(obj.width) : undefined,
        h_mm: obj.height ? pxToMm(obj.height) : undefined,
        rotation_deg,
        zIndex,
        locked: obj.locked,
        text: obj.text || '',
        fontFamily: obj.fontFamily || 'Helvetica',
        fontWeight: obj.fontWeight || 400,
        fontSize_pt: (obj.fontSize || 16) * 0.75, // Approximate px to pt
        lineHeight: obj.lineHeight || 1.2,
        tracking: 0,
        align: (obj.textAlign as 'left' | 'center' | 'right') || 'left',
        fill: obj.fill || '#000000',
      } as TextElement;
    
    case 'label-shape':
      return {
        id: obj.id,
        type: 'label',
        x_mm,
        y_mm,
        w_mm,
        h_mm,
        rotation_deg,
        zIndex,
        locked: obj.locked,
        shapePreset: obj.labelShapeType || 'rounded-rect',
        padding_mm: pxToMm(obj.borderPadding || 12),
        cornerRadius_mm: obj.cornerRadius ? pxToMm(obj.cornerRadius) : undefined,
        stroke: obj.borderEnabled ? {
          enabled: true,
          width_mm: pxToMm(obj.borderWidth || 2),
          color: obj.borderColor || '#000000',
        } : undefined,
        fill: obj.backgroundColor || '#ffffff',
        textProps: {
          text: obj.text || '',
          fontFamily: obj.fontFamily || 'Helvetica',
          fontWeight: obj.fontWeight || 400,
          fontSize_pt: (obj.fontSize || 16) * 0.75,
          fill: obj.fill || '#000000',
        },
      } as LabelElement;
    
    default:
      return null;
  }
}

/**
 * Convert Design JSON to EditorObject format (for editor loading)
 */
export function designElementToEditorObject(
  element: DesignElement,
  screenDpi: number = 96
): any {
  // Convert mm to screen pixels
  function mmToPx(mm: number): number {
    return (mm / 25.4) * screenDpi;
  }
  
  const x = mmToPx(element.x_mm);
  const y = mmToPx(element.y_mm);
  const width = mmToPx(element.w_mm);
  const height = mmToPx(element.h_mm);
  const rotation = element.rotation_deg;
  
  switch (element.type) {
    case 'image':
      return {
        id: element.id,
        type: 'image',
        src: element.src,
        x,
        y,
        width,
        height,
        scaleX: 1,
        scaleY: 1,
        rotation,
        cropMode: element.fitMode,
        opacity: element.opacity,
      };
    
    case 'text':
      return {
        id: element.id,
        type: 'text',
        text: element.text,
        x,
        y,
        width: element.w_mm ? mmToPx(element.w_mm) : undefined,
        height: element.h_mm ? mmToPx(element.h_mm) : undefined,
        scaleX: 1,
        scaleY: 1,
        rotation,
        fontFamily: element.fontFamily,
        fontWeight: element.fontWeight,
        fontSize: (element.fontSize_pt / 0.75), // Convert pt to px
        lineHeight: element.lineHeight,
        textAlign: element.align,
        fill: element.fill,
      };
    
    case 'label':
      return {
        id: element.id,
        type: 'label-shape',
        text: element.textProps.text,
        x,
        y,
        width,
        height,
        scaleX: 1,
        scaleY: 1,
        rotation,
        labelShapeType: element.shapePreset,
        cornerRadius: element.cornerRadius_mm ? mmToPx(element.cornerRadius_mm) : undefined,
        borderEnabled: element.stroke?.enabled || false,
        borderWidth: element.stroke ? mmToPx(element.stroke.width_mm) : undefined,
        borderColor: element.stroke?.color,
        borderPadding: mmToPx(element.padding_mm),
        backgroundColor: element.fill,
        fontFamily: element.textProps.fontFamily,
        fontWeight: element.textProps.fontWeight,
        fontSize: (element.textProps.fontSize_pt / 0.75),
        fill: element.textProps.fill,
      };
    
    default:
      return null;
  }
}

