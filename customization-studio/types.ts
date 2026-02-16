// customization-studio/types.ts
// Type definitions for the Customization Studio editor.

export type Placement = "front" | "back" | "inside1" | "inside2";

export type TextAlign = "left" | "center" | "right";

export type ProductSpec = {
  id: string;
  name: string;
  printWidth: number; // pixels (print-space)
  printHeight: number; // pixels (print-space)
  printDpi: number;
  placements: Placement[];
  requiresQrCode?: boolean;
  qrDefaultPosition?: {
    placement: Placement;
    left: number;
    top: number;
    width: number;
    height: number;
  };

  /** Printful IDs for order submission */
  printfulProductId?: number;
  printfulVariantId?: number;

  /** Product slug for linking back to product detail */
  productSlug?: string;

  /** Base price from the product catalog */
  basePrice?: number;
};

export type ImageItem = {
  id: string;
  src: string;
  x: number; // canvas coords (print-space px)
  y: number; // canvas coords (print-space px)
  width: number; // print-space px
  height: number; // print-space px
  rotation: number;
  originalWidth: number;
  originalHeight: number;

  // Layout support: if set, the image is clipped to that slot
  slotIndex?: number;
};

export type TextItem = {
  id: string;
  text: string;
  x: number; // canvas coords (print-space px)
  y: number; // canvas coords (print-space px)
  fontSize: number; // px
  fontFamily: string;
  fill: string; // CSS color
  fontStyle: string; // e.g. "bold italic" | "normal"
  rotation: number;

  // New: richer label controls
  width?: number; // text box width for alignment/wrapping
  align?: TextAlign;
  textDecoration?: string; // e.g. "underline"
};

export type QrCodePosition = {
  x: number;
  y: number;
  width: number; // template size (not QR size)
  height: number;
};

export type PlacementDesign = {
  images: ImageItem[];
  texts: TextItem[];
  qrCode?: QrCodePosition;

  // Layout per surface
  layoutId?: string;
};

export type DesignState = {
  [key in Placement]?: PlacementDesign;
};
