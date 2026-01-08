/**
 * Internal Type System for Physical Product Designer
 * Provider-agnostic types for product selection, print specs, and design state
 */

// =============================================================================
// PRODUCT SELECTION
// =============================================================================

/** Product selection state - what the user has chosen */
export interface SelectionState {
  productType: 'greeting-card' | 'postcard' | 'print' | 'poster' | 'invitation' | 'announcement';
  orientation: 'portrait' | 'landscape';
  size: string; // e.g., "5x7", "A5", "4x6"
  paperType?: string; // e.g., "matte", "glossy", "premium"
  foldFormat?: 'flat' | 'bifold' | 'trifold'; // for cards/invitations
  foilOption?: string; // e.g., "gold", "silver", "rose-gold"
  envelopeOption?: string; // e.g., "white", "kraft", "colored"
}

// =============================================================================
// PRINT SPECIFICATIONS
// =============================================================================

/** Print specifications (mm-based, DPI, bleed, safe zones) */
export interface PrintSpec {
  id: string;
  productType: string;
  trimMm: { w: number; h: number }; // Final cut size
  bleedMm: number; // Bleed margin (typically 3mm)
  safeMm: number; // Safe zone margin (typically 5mm)
  dpi: number; // Resolution (typically 300)
  sides: PrintSide[];
  folded: boolean;
  // Provider metadata (for re-hydration)
  providerType?: 'mock' | 'gelato';
  providerProductId?: string;
  providerVariantId?: string;
}

export interface PrintSide {
  id: string; // 'front', 'back', 'inside-left', 'inside-right', etc.
  name: string; // Display name
  trimMm: { w: number; h: number };
  bleedMm: number;
  safeMm: number;
  canvasPx: { w: number; h: number }; // Canvas size in pixels at screen DPI (96)
  foldLines?: FoldLine[];
}

export interface FoldLine {
  x1: number; // mm coordinates relative to trim box
  y1: number;
  x2: number;
  y2: number;
  type?: 'fold' | 'score' | 'perforate';
}

// =============================================================================
// DESIGN STATE
// =============================================================================

/** Canvas design state - what's on the canvas */
export interface DesignState {
  sides: Record<string, SideDesign>; // key: sideId
}

export interface SideDesign {
  objects: DesignObject[];
  background?: {
    fill?: string; // Solid color
    imageAssetId?: string; // Background image reference
  };
}

/** Design object on canvas - NO BASE64 DATA! */
export interface DesignObject {
  id: string;
  type: 'image' | 'text' | 'label' | 'qr' | 'shape';
  
  // Asset reference (NOT base64)
  assetId?: string; // Reference to uploaded asset (from /api/assets)
  assetUrl?: string; // Persisted URL (from /api/assets or CDN)
  
  // Transform data (screen DPI coordinates)
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
  scaleX: number;
  scaleY: number;
  opacity?: number; // 0-1
  
  // Text properties
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  fontStyle?: 'normal' | 'italic';
  fill?: string; // Text color
  align?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  
  // Label/Shape properties
  backgroundColor?: string;
  borderEnabled?: boolean;
  borderColor?: string;
  borderWidth?: number;
  cornerRadius?: number;
  labelShapeType?: 'circle' | 'oval' | 'rounded-rectangle' | 'rectangle' | 'speech-bubble' | 'ribbon';
  
  // QR code properties
  qrData?: string; // URL or data to encode
  qrSize?: number; // Size in mm
  
  // Shape properties
  shapeType?: 'rect' | 'circle' | 'triangle' | 'star' | 'heart';
  strokeColor?: string;
  strokeWidth?: number;
}

// =============================================================================
// DRAFT PERSISTENCE
// =============================================================================

/** Draft data structure for persistence (NO base64!) */
export interface PhysicalDesignDraft {
  id: string;
  productType: string;
  selection: SelectionState;
  printSpecId: string;
  design: DesignState;
  
  // Metadata
  createdAt: number; // Unix timestamp
  updatedAt: number;
  version: number; // Schema version for migrations
  
  // Provider data (for re-hydration)
  providerType: 'mock' | 'gelato';
  providerVariantId?: string;
  providerProductId?: string;
  
  // User metadata (if applicable)
  userId?: string;
  name?: string;
  thumbnail?: string; // URL to preview image
}

// =============================================================================
// EXPORT DATA
// =============================================================================

/** Export data for print production */
export interface ExportData {
  draftId: string;
  productType: string;
  selection: SelectionState;
  printSpec: PrintSpec;
  exports: SideExport[];
  createdAt: number;
}

export interface SideExport {
  sideId: string;
  sideName: string;
  dataUrl: string; // Base64 PNG at print DPI (only for export, not storage)
  width: number; // pixels at print DPI
  height: number;
  trimWidth: number; // pixels at print DPI
  trimHeight: number;
  bleedMm: number;
  dpi: number;
}

// =============================================================================
// ASSET METADATA
// =============================================================================

/** Uploaded asset metadata (returned from /api/assets) */
export interface UploadedAssetMetadata {
  assetId: string;
  url: string; // Persisted URL
  width: number; // Original dimensions
  height: number;
  mimeType: string;
  size: number; // Bytes
  createdAt: number;
}

