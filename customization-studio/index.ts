// customization-studio/index.ts

export { CustomizationStudio } from "./CustomizationStudio";
export type {
  Placement,
  TextAlign,
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
  clamp,
  generateId,
  fitImageToSlot,
  coverImageToSlot,
  centerInSlot,
  PLACEMENT_LABELS,
  dataURLtoBlob,
  downloadDataURL,
} from "./utils";
