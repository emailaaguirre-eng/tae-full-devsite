// Shared types for ProjectEditor components
// Separated to avoid circular dependencies

export interface EditorObject {
  id: string;
  type: 'image' | 'text' | 'skeletonKey' | 'qr' | 'border' | 'label-shape';
  src?: string; // For images, skeleton keys (SVG data URL)
  text?: string; // For text labels
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  width?: number; // Optional: original width for reference
  height?: number; // Optional: original height for reference
  // Text properties
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  fill?: string;
  // Text/Label border properties
  borderEnabled?: boolean;
  borderStyle?: 'solid' | 'double' | 'dashed' | 'ornate';
  borderWidth?: number;
  borderColor?: string;
  borderPadding?: number; // Padding between text and border
  backgroundColor?: string; // Optional background fill
  // Label shape properties
  labelShapeId?: string; // ID of the label shape template (from labelShapes.ts)
  labelShapeType?: 'rounded-rectangle' | 'circle' | 'oval' | 'rectangle' | 'speech-bubble' | 'ribbon';
  cornerRadius?: number; // For rounded rectangles
  // Foil properties (for print production)
  foilEnabled?: boolean;
  foilColor?: 'gold' | 'silver' | 'rose-gold' | 'copper';
  foilTarget?: 'text' | 'border' | 'both'; // What gets the foil effect
  // Skeleton Key properties
  keyId?: string; // Skeleton key definition ID
  opacity?: number; // For skeleton key overlay
  locked?: boolean; // For skeleton key
  // QR properties
  sideId?: 'front' | 'inside' | 'back'; // For QR
  url?: string; // QR code URL
  size?: number; // QR code size (square)
  // Decorative border properties
  borderDesignId?: string; // For pre-designed border frames
  // Image crop properties (SPRINT 3)
  cropMode?: 'fit' | 'fill'; // Crop mode for images
  cropFrameX?: number; // Crop frame position
  cropFrameY?: number;
  cropFrameWidth?: number; // Crop frame dimensions
  cropFrameHeight?: number;
  cropImageX?: number; // Image position within crop frame
  cropImageY?: number;
  cropImageWidth?: number; // Image dimensions within crop frame
  cropImageHeight?: number;
  // Ornament properties (SPRINT 3)
  ornamentId?: string; // ID of ornament from ornaments.ts
  ornamentCategory?: 'corner' | 'divider' | 'frame';
}

export interface ProjectEditorConfig {
  productSlug: string;
  printSpecId?: string;
  qrRequired: boolean;
  allowedSidesForQR: Array<'front' | 'inside' | 'back'>;
  qrPlacementMode: 'fixed' | 'flexible';
  defaultSkeletonKeyId?: string;
  artKeyUrlPlaceholder?: string;
}

export interface FrameFillState {
  frameId: string;
  assetSrc?: string;
  offsetX: number;
  offsetY: number;
  zoom: number;
  rotation: number;
}

export interface TemplateState {
  templateId: string;
  activeFrameId?: string;
  frames: FrameFillState[];
}

export interface SideState {
  objects: EditorObject[];
  selectedId?: string;
  template?: TemplateState;
}

// Gelato variant data (minimal fields needed)
export interface GelatoVariantData {
  uid: string;
  size?: string | null;
  material?: string | null;
  paper?: string | null;
  frame?: string | null;
  foil?: string | null;
  price?: number;
}

