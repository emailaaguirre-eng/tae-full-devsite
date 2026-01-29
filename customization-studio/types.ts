// customization-studio/types.ts

export type Placement = "front" | "back" | "inside1" | "inside2";

export type ProductSpec = {
  id: string;
  name: string;
  printWidth: number;
  printHeight: number;
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
};

export type ImageItem = {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  originalWidth: number;
  originalHeight: number;
};

export type TextItem = {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fill: string;
  fontStyle: string;
  rotation: number;
};

export type QrCodePosition = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PlacementDesign = {
  images: ImageItem[];
  texts: TextItem[];
  qrCode?: QrCodePosition;
};

export type DesignState = {
  [key in Placement]?: PlacementDesign;
};
