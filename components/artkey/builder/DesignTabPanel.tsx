"use client";

import type { CSSProperties } from "react";
import { useRef } from "react";
import styles from "./akBuilder.module.css";
import {
  DESIGN_DETAIL_TABS,
  type DesignDetailTabId,
  type DesignStartingPoint,
} from "./designTypes";
import {
  designModuleButtonClassNames,
  TITLE_FONT_STACK,
  type DesignModuleStyleKeys,
  type DesignPreviewButtonFont,
  type DesignPreviewButtonStyle,
  type DesignPreviewState,
  type DesignPreviewTitleFont,
} from "./designPreviewModel";
import { contrastTextOnHex, hexToRgba } from "./designColorUtils";
import { DesignColorPickerPanel } from "./DesignColorPickerPanel";
import {
  normalizeSolidHex,
  SOLID_COLOR_PRESETS,
} from "./designSolidColorPresets";

const DESIGN_MODULE_BTN_KEYS: DesignModuleStyleKeys = {
  designModuleBtn: styles.designModuleBtn,
  designModBtnShapePill: styles.designModBtnShapePill,
  designModBtnShapeRounded: styles.designModBtnShapeRounded,
  designModBtnShapeSquare: styles.designModBtnShapeSquare,
  designModBtnColorGold: styles.designModBtnColorGold,
  designModBtnColorNavy: styles.designModBtnColorNavy,
  designModBtnColorSage: styles.designModBtnColorSage,
  designModBtnStyleSolid: styles.designModBtnStyleSolid,
  designModBtnStyleOutline: styles.designModBtnStyleOutline,
  designModBtnStyleGlass: styles.designModBtnStyleGlass,
  designModBtnCustom: styles.designModBtnCustom,
};

const BUTTON_STYLE_OPTIONS: { id: DesignPreviewButtonStyle; label: string }[] = [
  { id: "solid", label: "Solid" },
  { id: "outline", label: "Outline" },
  { id: "glass", label: "Glass" },
];

function moduleShapeClassFromPreview(
  s: typeof styles,
  preview: DesignPreviewState
): string {
  if (preview.btnShape === "pill") return s.designModBtnShapePill;
  if (preview.btnShape === "square") return s.designModBtnShapeSquare;
  return s.designModBtnShapeRounded;
}

function customFillStylePreview(
  st: DesignPreviewButtonStyle,
  rawHex: string
): CSSProperties {
  const hex = /^#[0-9a-fA-F]{6}$/i.test(rawHex) ? rawHex : "#1a2338";
  const text = contrastTextOnHex(hex);

  if (st === "solid") {
    return {
      background: hex,
      backgroundImage: "none",
      color: text,
      borderColor: "rgba(15, 23, 42, 0.22)",
      boxShadow: "0 2px 8px rgba(18, 26, 42, 0.18)",
    };
  }

  if (st === "outline") {
    return {
      background: "transparent",
      backgroundImage: "none",
      color: hex,
      borderColor: hex,
      borderWidth: 2,
      borderStyle: "solid",
      boxShadow: "none",
    };
  }

  return {
    background: `linear-gradient(148deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.24) 38%, transparent 54%), linear-gradient(180deg, ${hexToRgba(hex, 0.26)} 0%, ${hexToRgba(hex, 0.1)} 100%)`,
    color: text,
    borderColor: hexToRgba(hex, 0.45),
    borderWidth: 1,
    borderStyle: "solid",
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,0.72), inset 0 -12px 22px rgba(255,255,255,0.12), 0 2px 12px rgba(18,26,42,0.12)",
    backdropFilter: "blur(10px)",
  };
}

const TITLE_FONT_OPTIONS: { value: DesignPreviewTitleFont; label: string }[] = [
  { value: "system", label: "System" },
  { value: "serif", label: "Serif" },
  { value: "monospace", label: "Monospace" },
  { value: "inter", label: "Inter" },
  { value: "poppins", label: "Poppins" },
  { value: "lato", label: "Lato" },
  { value: "montserrat", label: "Montserrat" },
  { value: "roboto", label: "Roboto" },
  { value: "playfair", label: "Playfair Display" },
  { value: "open_sans", label: "Open Sans" },
];

type Props = {
  /** When true, all Design controls are non-interactive (visual-only mock). */
  readOnly?: boolean;
  startingPoint: DesignStartingPoint | null;
  onStartingPointChange: (v: DesignStartingPoint | null) => void;
  detailTab: DesignDetailTabId;
  onDetailTabChange: (id: DesignDetailTabId) => void;
  preview: DesignPreviewState;
  onPreviewPatch: (patch: Partial<DesignPreviewState>) => void;
};

const DETAIL_COPY: Record<
  DesignDetailTabId,
  { title: string; body: string }
> = {
  background: {
    title: "Background",
    body: "Choose a solid color (or placeholder Stock / Upload). Swatches update the phone screen in Live Preview.",
  },
  title_font: {
    title: "Title font",
    body: "Choose the headline typeface and supporting text color. Updates apply to the Live Preview phone.",
  },
  button_font: {
    title: "Button font",
    body: "Choose the module label typeface and text color. Updates apply in Live Preview.",
  },
  button_shapes: {
    title: "Button shapes",
    body: "Corner radius presets for CTA rows. Applies to the module buttons in the phone preview.",
  },
  button_color: {
    title: "Button color",
    body: "Pick a solid fill for the module buttons in Live Preview. Clear to return to accent presets on the Button style tab.",
  },
  button_styling: {
    title: "Button style",
    body: "Solid, outline, or glass treatments for module actions in the phone preview.",
  },
};

export function DesignTabPanel({
  readOnly = false,
  startingPoint,
  onStartingPointChange,
  detailTab,
  onDetailTabChange,
  preview,
  onPreviewPatch,
}: Props) {
  const copy = DETAIL_COPY[detailTab];
  const p = preview;
  const bodyColorInputRef = useRef<HTMLInputElement>(null);
  const buttonLabelColorInputRef = useRef<HTMLInputElement>(null);

  return (
    <fieldset
      disabled={readOnly}
      className={styles.designTabStack}
      aria-label="Design starting point and appearance"
    >
      <section className={styles.panel}>
        <div className={styles.panelHeaderRow}>
          <h2 className={styles.panelTitle}>Choose a Starting Point</h2>
          <span className={styles.panelBadge}>Prototype</span>
        </div>
        <div className={styles.panelBody}>
          <p className={styles.startPointIntro}>
            Use a template for a styled layout (background included), or build
            manually and choose a background first.
          </p>
          <div className={styles.startPointGrid}>
            <button
              type="button"
              onClick={() => onStartingPointChange("template")}
              className={[
                styles.startCardTemplate,
                startingPoint === "template" ? styles.startPointSelected : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className={styles.startPointCardIcon} aria-hidden>
                ◆
              </span>
              <p className={styles.startPointCardTitle}>Use a Template</p>
              <p className={styles.startPointCardDesc}>
                Start from a curated layout with colors, type, and background already
                set.
              </p>
            </button>
            <button
              type="button"
              onClick={() => onStartingPointChange("manual")}
              className={[
                styles.startCardManual,
                startingPoint === "manual" ? styles.startPointSelected : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className={styles.startPointCardIcon} aria-hidden>
                ✦
              </span>
              <p className={styles.startPointCardTitle}>Build Manually</p>
              <p className={styles.startPointCardDesc}>
                Blank canvas: pick a background first, then layer type and modules.
              </p>
            </button>
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Appearance</h2>
        <div className={styles.panelBody}>
          <p className={styles.designDetailLead}>
            Switch tabs to explore each control group. Changes apply to the{" "}
            <strong>Live Preview</strong> phone on the right (local demo only).
          </p>
          <div
            className={styles.designDetailTabScroll}
            role="tablist"
            aria-label="Design appearance"
          >
            <div className={styles.designDetailTabs}>
              {DESIGN_DETAIL_TABS.map((t) => {
                const on = detailTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => onDetailTabChange(t.id)}
                    className={on ? styles.designDetailTabActive : styles.designDetailTab}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className={styles.designDetailBody}>
            {detailTab === "background" || detailTab === "button_color" ? (
              <p className={styles.designDetailText}>{copy.body}</p>
            ) : detailTab === "title_font" || detailTab === "button_font" ? (
              <p className={styles.designDetailText}>{copy.body}</p>
            ) : detailTab === "button_styling" || detailTab === "button_shapes" ? null : (
              <>
                <h3 className={styles.designDetailTitle}>{copy.title}</h3>
                <p className={styles.designDetailText}>{copy.body}</p>
              </>
            )}

            {detailTab === "background" && (
              <div className={styles.titleFontControls}>
                <p className={styles.titleFontFieldLabel}>Background</p>
                <DesignColorPickerPanel
                  mode="background"
                  selectedHex={p.screenSolidHex}
                  onSelectHex={(hex) => onPreviewPatch({ screenSolidHex: hex })}
                  onClearHex={() => onPreviewPatch({ screenSolidHex: null })}
                />
              </div>
            )}

            {detailTab === "title_font" && (
              <div className={styles.titleFontControls}>
                <label className={styles.titleFontFieldLabel} htmlFor="ak-builder-title-font">
                  Title Font
                </label>
                <div className={styles.titleFontSelectWrap}>
                  <select
                    id="ak-builder-title-font"
                    className={styles.titleFontSelect}
                    value={p.titleFont}
                    style={{ fontFamily: TITLE_FONT_STACK[p.titleFont] }}
                    onChange={(e) =>
                      onPreviewPatch({
                        titleFont: e.target.value as DesignPreviewTitleFont,
                      })
                    }
                  >
                    {TITLE_FONT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <p className={styles.titleFontFieldLabel}>Text Color</p>
                <div
                  className={styles.titleTextColorBlock}
                  role="group"
                  aria-label="Text color"
                >
                  <div className={styles.titleTextPresetGrid}>
                    {SOLID_COLOR_PRESETS.map(({ hex, label }) => {
                      const current = normalizeSolidHex(p.bodyTextHex);
                      const preset = normalizeSolidHex(hex);
                      const active = current !== "" && current === preset;
                      const lightFill =
                        hex.toLowerCase() === "#ffffff" ||
                        hex.toLowerCase() === "#facc15";
                      return (
                        <button
                          key={hex}
                          type="button"
                          className={[
                            styles.titleTextPresetSwatch,
                            lightFill ? styles.titleTextPresetSwatchLight : "",
                            active ? styles.titleTextPresetSwatchActive : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          style={{ backgroundColor: hex }}
                          title={label}
                          aria-label={label}
                          aria-pressed={active}
                          onClick={() => onPreviewPatch({ bodyTextHex: hex })}
                        />
                      );
                    })}
                  </div>
                  <input
                    ref={bodyColorInputRef}
                    id="ak-builder-text-color-picker"
                    type="color"
                    className={styles.bodyTextColorInput}
                    value={
                      /^#[0-9a-fA-F]{6}$/i.test(p.bodyTextHex)
                        ? p.bodyTextHex
                        : "#64748b"
                    }
                    aria-label="Custom text color"
                    onChange={(e) => onPreviewPatch({ bodyTextHex: e.target.value })}
                  />
                  <button
                    type="button"
                    className={styles.titleTextMoreColorsBtn}
                    onClick={() => bodyColorInputRef.current?.click()}
                  >
                    <span className={styles.titleTextMoreColorsIcon} aria-hidden>
                      🎨
                    </span>
                    More Colors
                  </button>
                </div>
              </div>
            )}

            {detailTab === "button_font" && (
              <div className={styles.titleFontControls}>
                <label
                  className={styles.titleFontFieldLabel}
                  htmlFor="ak-builder-button-font"
                >
                  Button Font
                </label>
                <div className={styles.titleFontSelectWrap}>
                  <select
                    id="ak-builder-button-font"
                    className={styles.titleFontSelect}
                    value={p.buttonFont}
                    style={{ fontFamily: TITLE_FONT_STACK[p.buttonFont] }}
                    onChange={(e) =>
                      onPreviewPatch({
                        buttonFont: e.target.value as DesignPreviewButtonFont,
                      })
                    }
                  >
                    {TITLE_FONT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <p className={styles.titleFontFieldLabel}>Text Color</p>
                <div
                  className={styles.titleTextColorBlock}
                  role="group"
                  aria-label="Button label text color"
                >
                  <div className={styles.titleTextPresetGrid}>
                    {SOLID_COLOR_PRESETS.map(({ hex, label }) => {
                      const current = normalizeSolidHex(p.buttonLabelTextHex);
                      const preset = normalizeSolidHex(hex);
                      const active = current !== "" && current === preset;
                      const lightFill =
                        hex.toLowerCase() === "#ffffff" ||
                        hex.toLowerCase() === "#facc15";
                      return (
                        <button
                          key={hex}
                          type="button"
                          className={[
                            styles.titleTextPresetSwatch,
                            lightFill ? styles.titleTextPresetSwatchLight : "",
                            active ? styles.titleTextPresetSwatchActive : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          style={{ backgroundColor: hex }}
                          title={label}
                          aria-label={label}
                          aria-pressed={active}
                          onClick={() =>
                            onPreviewPatch({ buttonLabelTextHex: hex })
                          }
                        />
                      );
                    })}
                  </div>
                  <input
                    ref={buttonLabelColorInputRef}
                    id="ak-builder-button-label-text-color-picker"
                    type="color"
                    className={styles.bodyTextColorInput}
                    value={
                      /^#[0-9a-fA-F]{6}$/i.test(p.buttonLabelTextHex)
                        ? p.buttonLabelTextHex
                        : "#1e293b"
                    }
                    aria-label="Custom button label text color"
                    onChange={(e) =>
                      onPreviewPatch({ buttonLabelTextHex: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    className={styles.titleTextMoreColorsBtn}
                    onClick={() => buttonLabelColorInputRef.current?.click()}
                  >
                    <span className={styles.titleTextMoreColorsIcon} aria-hidden>
                      🎨
                    </span>
                    More Colors
                  </button>
                </div>
              </div>
            )}

            {detailTab === "button_shapes" && (
              <div className={styles.buttonStyleSection}>
                <h3 className={styles.buttonStyleSectionTitle}>Button Shapes</h3>
                <div
                  className={styles.buttonStyleSegWrap}
                  role="group"
                  aria-label="Button shapes"
                >
                  <button
                    type="button"
                    className={
                      p.btnShape === "pill"
                        ? `${styles.buttonStyleSeg} ${styles.buttonStyleSegActive}`
                        : styles.buttonStyleSeg
                    }
                    aria-pressed={p.btnShape === "pill"}
                    onClick={() => onPreviewPatch({ btnShape: "pill" })}
                  >
                    Pill
                  </button>
                  <button
                    type="button"
                    className={
                      p.btnShape === "rounded"
                        ? `${styles.buttonStyleSeg} ${styles.buttonStyleSegActive}`
                        : styles.buttonStyleSeg
                    }
                    aria-pressed={p.btnShape === "rounded"}
                    onClick={() => onPreviewPatch({ btnShape: "rounded" })}
                  >
                    Rounded
                  </button>
                  <button
                    type="button"
                    className={
                      p.btnShape === "square"
                        ? `${styles.buttonStyleSeg} ${styles.buttonStyleSegActive}`
                        : styles.buttonStyleSeg
                    }
                    aria-pressed={p.btnShape === "square"}
                    onClick={() => onPreviewPatch({ btnShape: "square" })}
                  >
                    Square
                  </button>
                </div>
              </div>
            )}

            {detailTab === "button_color" && (
              <div className={styles.titleFontControls}>
                <p className={styles.titleFontFieldLabel}>Button color</p>
                <DesignColorPickerPanel
                  mode="button"
                  selectedHex={p.moduleFillHex}
                  onSelectHex={(hex) => onPreviewPatch({ moduleFillHex: hex })}
                  onClearHex={() => onPreviewPatch({ moduleFillHex: null })}
                />
              </div>
            )}

            {detailTab === "button_styling" && (
              <div className={styles.buttonStyleSection}>
                <h3 className={styles.buttonStyleSectionTitle}>Button Style</h3>
                <div
                  className={`${styles.buttonStyleSegWrap} ${styles.buttonStyleSegWrapWithPreview}`}
                  role="group"
                  aria-label="Button style"
                >
                  {BUTTON_STYLE_OPTIONS.map(({ id, label }) => {
                    const active = p.btnStyle === id;
                    const rawCustom = (p.moduleFillHex ?? "").trim();
                    const normalizedCustom = rawCustom
                      ? normalizeSolidHex(rawCustom)
                      : "";
                    const useCustom = rawCustom !== "";
                    const fillForMock =
                      useCustom && normalizedCustom !== ""
                        ? normalizedCustom
                        : useCustom
                          ? "#64748b"
                          : "";
                    const mockClass = useCustom
                      ? [
                          styles.designModuleBtn,
                          moduleShapeClassFromPreview(styles, p),
                          styles.designModBtnCustom,
                          styles.buttonStylePreviewMock,
                        ].join(" ")
                      : [
                          designModuleButtonClassNames(DESIGN_MODULE_BTN_KEYS, {
                            ...p,
                            btnStyle: id,
                          }),
                          styles.buttonStylePreviewMock,
                        ].join(" ");
                    const mockStyle: CSSProperties | undefined = useCustom
                      ? customFillStylePreview(id, fillForMock)
                      : undefined;

                    return (
                      <button
                        key={id}
                        type="button"
                        className={
                          active
                            ? `${styles.buttonStyleSeg} ${styles.buttonStyleSegActive}`
                            : styles.buttonStyleSeg
                        }
                        aria-pressed={active}
                        aria-label={`${label} button style`}
                        onClick={() => onPreviewPatch({ btnStyle: id })}
                      >
                        <span className={styles.buttonStylePreviewShelf}>
                          <span className={mockClass} style={mockStyle}>
                            {label}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </fieldset>
  );
}
