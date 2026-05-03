import type { DesignStartingPoint } from "./designTypes";

export type DesignPreviewTitleFont = "playfair" | "source_serif" | "inter_display";
export type DesignPreviewButtonFont = "inter" | "georgia" | "nunito";
export type DesignPreviewButtonShape = "pill" | "rounded" | "square";
export type DesignPreviewButtonColor = "gold" | "navy" | "sage";
export type DesignPreviewButtonStyle = "solid" | "outline" | "soft";
export type DesignPreviewBgTone = "paper" | "cool" | "warm";

export type DesignPreviewState = {
  titleFont: DesignPreviewTitleFont;
  buttonFont: DesignPreviewButtonFont;
  btnShape: DesignPreviewButtonShape;
  btnColor: DesignPreviewButtonColor;
  btnStyle: DesignPreviewButtonStyle;
  bgTone: DesignPreviewBgTone;
  /** When set, phone screen uses this solid fill instead of `bgTone` mapping. */
  screenSolidHex: string | null;
  /** When set, module CTAs use this fill (preset color/style classes skipped). */
  moduleFillHex: string | null;
};

export const TITLE_FONT_STACK: Record<DesignPreviewTitleFont, string> = {
  playfair: '"Playfair Display", Georgia, "Times New Roman", serif',
  source_serif: 'Georgia, "Palatino Linotype", "Times New Roman", serif',
  inter_display: '"Inter", system-ui, -apple-system, sans-serif',
};

export const BUTTON_FONT_STACK: Record<DesignPreviewButtonFont, string> = {
  inter: '"Inter", system-ui, -apple-system, sans-serif',
  georgia: 'Georgia, "Times New Roman", serif',
  nunito: 'system-ui, "Segoe UI", "Inter", sans-serif',
};

export function defaultDesignPreview(): DesignPreviewState {
  return {
    titleFont: "playfair",
    buttonFont: "inter",
    btnShape: "rounded",
    btnColor: "navy",
    btnStyle: "outline",
    bgTone: "paper",
    screenSolidHex: null,
    moduleFillHex: null,
  };
}

export function designPreviewForStartingPoint(
  sp: DesignStartingPoint | null
): DesignPreviewState {
  if (sp === "template") {
    return {
      titleFont: "playfair",
      buttonFont: "inter",
      btnShape: "pill",
      btnColor: "gold",
      btnStyle: "solid",
      bgTone: "warm",
      screenSolidHex: null,
      moduleFillHex: null,
    };
  }
  if (sp === "manual") {
    return {
      titleFont: "inter_display",
      buttonFont: "inter",
      btnShape: "rounded",
      btnColor: "navy",
      btnStyle: "outline",
      bgTone: "paper",
      screenSolidHex: null,
      moduleFillHex: null,
    };
  }
  return defaultDesignPreview();
}

export function phoneScreenBackground(tone: DesignPreviewBgTone): string {
  if (tone === "warm") return "#faf7f1";
  if (tone === "cool") return "#eef4fb";
  return "#ffffff";
}

/**
 * Phone canvas for the guest preview (Design / Features strip): matches the online
 * ArtKey editor’s pale grey when no custom solid is set; still respects tone + hex.
 */
export function guestPhoneCanvasBackground(p: DesignPreviewState): string {
  if (p.screenSolidHex) return p.screenSolidHex;
  if (p.bgTone === "warm") return "#faf7f1";
  if (p.bgTone === "cool") return "#eef4fb";
  return "#f4f3f8";
}

/** CSS-module keys used for module CTA preview buttons. */
export type DesignModuleStyleKeys = {
  designModuleBtn: string;
  designModBtnShapePill: string;
  designModBtnShapeRounded: string;
  designModBtnShapeSquare: string;
  designModBtnColorGold: string;
  designModBtnColorNavy: string;
  designModBtnColorSage: string;
  designModBtnStyleSolid: string;
  designModBtnStyleOutline: string;
  designModBtnStyleSoft: string;
  designModBtnCustom: string;
};

export function designModuleButtonClassNames(
  s: DesignModuleStyleKeys,
  p: DesignPreviewState
): string {
  const shape =
    p.btnShape === "pill"
      ? s.designModBtnShapePill
      : p.btnShape === "square"
        ? s.designModBtnShapeSquare
        : s.designModBtnShapeRounded;
  if (p.moduleFillHex) {
    return [s.designModuleBtn, shape, s.designModBtnCustom].join(" ");
  }
  const color =
    p.btnColor === "navy"
      ? s.designModBtnColorNavy
      : p.btnColor === "sage"
        ? s.designModBtnColorSage
        : s.designModBtnColorGold;
  const sty =
    p.btnStyle === "outline"
      ? s.designModBtnStyleOutline
      : p.btnStyle === "soft"
        ? s.designModBtnStyleSoft
        : s.designModBtnStyleSolid;
  return [s.designModuleBtn, shape, color, sty].join(" ");
}
