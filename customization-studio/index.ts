// customization-studio/index.ts

export { default as CustomizationStudio } from "./CustomizationStudio";
export type { LabelItem, PlacementDesignExt, DesignStateExt } from "./CustomizationStudio";
export type {
  Placement,
  ProductSpec,
  ImageItem,
  TextItem,
  QrCodePosition,
  PlacementDesign,
  DesignState,
} from "./types";
export { COLLAGE_LAYOUTS, getLayoutById } from "./layouts";
export type { LayoutSlot, CollageLayout } from "./layouts";
export {
  getDisplayScale,
  generateId,
  fitImageToSlot,
  centerInSlot,
  PLACEMENT_LABELS,
  dataURLtoBlob,
  downloadDataURL,
} from "./utils";
