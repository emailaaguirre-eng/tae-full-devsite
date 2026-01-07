// types/printSpec.ts
export type SideId = "front" | "back";

export type CornerStyle = "square" | "rounded";

export type PrintSide = {
  id: SideId;
  name: string;

  // Source of truth (mm)
  trimMm: { w: number; h: number };
  bleedMm: number;
  safeMm: number;

  cornerStyle?: CornerStyle;
  cornerRadiusMm?: number;

  foldLines?: Array<{ x1: number; y1: number; x2: number; y2: number }>;

  // Derived for rendering (px)
  canvasPx: { w: number; h: number };
  bleedPx: number;
  safePx: number;

  // optional legacy:
  trimPx?: number;
};

export type PrintSpec = {
  id: string;
  name: string;
  folded: boolean;
  sideIds: SideId[];
  sides: PrintSide[];
  dpi: number; // export dpi
};

export const MM_PER_INCH = 25.4;

export function pxPerMm(dpi: number) {
  return dpi / MM_PER_INCH;
}

export function mmToPx(mm: number, dpi: number) {
  return Math.round(mm * pxPerMm(dpi));
}

export function pxToMm(px: number, dpi: number) {
  return px / pxPerMm(dpi);
}
