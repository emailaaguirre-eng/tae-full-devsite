import type { DesignStartingPoint } from "./designTypes";

/** Title font family options (matches editor-style dropdown labels). */
export type DesignPreviewTitleFont =
  | "system"
  | "serif"
  | "monospace"
  | "inter"
  | "poppins"
  | "lato"
  | "montserrat"
  | "roboto"
  | "playfair"
  | "open_sans";

/** Same family set as title font (shared stacks in `TITLE_FONT_STACK`). */
export type DesignPreviewButtonFont = DesignPreviewTitleFont;

export type DesignPreviewButtonShape = "pill" | "rounded" | "square";
export type DesignPreviewButtonColor = "gold" | "navy" | "sage";
export type DesignPreviewButtonStyle = "solid" | "outline" | "glass";
export type DesignPreviewBgTone = "paper" | "cool" | "warm";

export type DesignPreviewState = {
  titleFont: DesignPreviewTitleFont;
  buttonFont: DesignPreviewButtonFont;
  btnShape: DesignPreviewButtonShape;
  btnColor: DesignPreviewButtonColor;
  btnStyle: DesignPreviewButtonStyle;
  bgTone: DesignPreviewBgTone;
  /** Supporting / body text on the guest preview (module hints, tagline). */
  bodyTextHex: string;
  /** Module CTA label color in Live Preview (Design phone + portal strip). */
  buttonLabelTextHex: string;
  /** When set, phone screen uses this solid fill instead of `bgTone` mapping. */
  screenSolidHex: string | null;
  /** When set, module CTAs use this fill (preset color/style classes skipped). */
  moduleFillHex: string | null;
};

export const TITLE_FONT_STACK: Record<DesignPreviewTitleFont, string> = {
  system: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  serif: 'Georgia, "Times New Roman", "Palatino Linotype", serif',
  monospace: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
  inter: '"Inter", system-ui, -apple-system, sans-serif',
  poppins: '"Poppins", system-ui, -apple-system, sans-serif',
  lato: '"Lato", "Helvetica Neue", Arial, sans-serif',
  montserrat: '"Montserrat", system-ui, sans-serif',
  roboto: '"Roboto", "Helvetica Neue", Arial, sans-serif',
  playfair: '"Playfair Display", Georgia, "Times New Roman", serif',
  open_sans: '"Open Sans", "Helvetica Neue", Arial, sans-serif',
};

export function defaultDesignPreview(): DesignPreviewState {
  return {
    titleFont: "playfair",
    buttonFont: "inter",
    btnShape: "rounded",
    btnColor: "navy",
    btnStyle: "outline",
    bgTone: "paper",
    bodyTextHex: "#64748b",
    buttonLabelTextHex: "#1e293b",
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
      bodyTextHex: "#64748b",
      buttonLabelTextHex: "#1e293b",
      screenSolidHex: null,
      moduleFillHex: null,
    };
  }
  if (sp === "manual") {
    return {
      titleFont: "inter",
      buttonFont: "inter",
      btnShape: "rounded",
      btnColor: "navy",
      btnStyle: "outline",
      bgTone: "paper",
      bodyTextHex: "#64748b",
      buttonLabelTextHex: "#1e293b",
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
  designModBtnStyleGlass: string;
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
      : p.btnStyle === "glass"
        ? s.designModBtnStyleGlass
        : s.designModBtnStyleSolid;
  return [s.designModuleBtn, shape, color, sty].join(" ");
}
