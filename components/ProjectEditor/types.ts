// Shared types for ProjectEditor components
// Separated to avoid circular dependencies

export interface EditorObject {
  id: string;
  type: 'image' | 'text' | 'label-shape' | 'skeletonKey' | 'qr' | 'border';
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
  labelShapeId?: string;
  labelShapeType?: string;
  cornerRadius?: number;
  // Foil properties (for print production)
  foilEnabled?: boolean;
  foilColor?: 'gold' | 'silver' | 'rose-gold' | 'copper';
  foilTarget?: 'text' | 'border' | 'both'; // What gets the foil effect
  // Skeleton Key properties
  keyId?: string; // Skeleton key definition ID
  locked?: boolean; // For skeleton key
  // Image/Object display properties
  opacity?: number; // Object opacity (0-1)
  flipX?: boolean; // Horizontal flip
  flipY?: boolean; // Vertical flip
  // QR properties
  sideId?: 'front' | 'inside' | 'back'; // For QR
  url?: string; // QR code URL
  size?: number; // QR code size (square)
  // Decorative border properties
  borderDesignId?: string; // For pre-designed border frames
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
  backgroundColor?: string; // Canvas background color
}

// Product variant data (minimal fields needed for print spec generation)
export interface ProductVariantData {
  id: number;              // Printful variant ID
  size?: string | null;
  material?: string | null;
  paper?: string | null;
  frame?: string | null;
  foil?: string | null;
  price?: number;
}

