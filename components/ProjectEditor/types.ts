// Shared types for ProjectEditor components
// Separated to avoid circular dependencies

export interface EditorObject {
  id: string;
  type: 'image' | 'text' | 'skeletonKey' | 'qr';
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
  // Skeleton Key properties
  keyId?: string; // Skeleton key definition ID
  opacity?: number; // For skeleton key overlay
  locked?: boolean; // For skeleton key
  // QR properties
  sideId?: 'front' | 'inside' | 'back'; // For QR
  url?: string; // QR code URL
  size?: number; // QR code size (square)
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

