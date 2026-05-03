"use client";

import type { ReactNode } from "react";
import styles from "./akBuilder.module.css";
import {
  DESIGN_DETAIL_TABS,
  previousDesignDetailTab,
  type DesignDetailTabId,
  type DesignStartingPoint,
} from "./designTypes";
import type { DesignPreviewState } from "./designPreviewModel";
import { DesignColorPickerPanel } from "./DesignColorPickerPanel";

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
    body: "Pairings for the portal headline. Presets update the sample title inside the phone preview.",
  },
  button_font: {
    title: "Button font",
    body: "Font for primary module actions. Presets update the six module labels inside the phone preview.",
  },
  button_shapes: {
    title: "Button shapes",
    body: "Corner radius presets for CTA rows. Applies to the module buttons in the phone preview.",
  },
  button_color: {
    title: "Button color",
    body: "Pick a solid fill for the six module buttons in Live Preview. Clear to return to accent presets on the Button styling tab.",
  },
  button_styling: {
    title: "Button styling",
    body: "Solid, outline, or soft filled treatments for module actions in the phone preview.",
  },
  header_icon: {
    title: "Header icon",
    body: "Elegant icon set, custom mark, or none — aligned with ArtKey editor options.",
  },
};

function presetButton(active: boolean, onClick: () => void, children: ReactNode) {
  return (
    <button
      type="button"
      className={active ? styles.designPresetChipActive : styles.designPresetChip}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

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
            ) : (
              <>
                <h3 className={styles.designDetailTitle}>{copy.title}</h3>
                <p className={styles.designDetailText}>{copy.body}</p>
              </>
            )}

            {detailTab === "background" && (
              <DesignColorPickerPanel
                mode="background"
                selectedHex={p.screenSolidHex}
                onSelectHex={(hex) => onPreviewPatch({ screenSolidHex: hex })}
                onClearHex={() => onPreviewPatch({ screenSolidHex: null })}
                onBack={() => onDetailTabChange(previousDesignDetailTab("background"))}
              />
            )}

            {detailTab === "title_font" && (
              <div className={styles.designPresetBlock}>
                <p className={styles.designPresetLabel}>Title font preset</p>
                <div className={styles.designPresetRow}>
                  {presetButton(
                    p.titleFont === "playfair",
                    () => onPreviewPatch({ titleFont: "playfair" }),
                    "Playfair"
                  )}
                  {presetButton(
                    p.titleFont === "source_serif",
                    () => onPreviewPatch({ titleFont: "source_serif" }),
                    "Georgia / serif"
                  )}
                  {presetButton(
                    p.titleFont === "inter_display",
                    () => onPreviewPatch({ titleFont: "inter_display" }),
                    "Inter (display)"
                  )}
                </div>
              </div>
            )}

            {detailTab === "button_font" && (
              <div className={styles.designPresetBlock}>
                <p className={styles.designPresetLabel}>Button font preset</p>
                <div className={styles.designPresetRow}>
                  {presetButton(
                    p.buttonFont === "inter",
                    () => onPreviewPatch({ buttonFont: "inter" }),
                    "Inter"
                  )}
                  {presetButton(
                    p.buttonFont === "georgia",
                    () => onPreviewPatch({ buttonFont: "georgia" }),
                    "Georgia"
                  )}
                  {presetButton(
                    p.buttonFont === "nunito",
                    () => onPreviewPatch({ buttonFont: "nunito" }),
                    "System UI"
                  )}
                </div>
              </div>
            )}

            {detailTab === "button_shapes" && (
              <div className={styles.designPresetBlock}>
                <p className={styles.designPresetLabel}>Shape</p>
                <div className={styles.designPresetRow}>
                  {presetButton(
                    p.btnShape === "pill",
                    () => onPreviewPatch({ btnShape: "pill" }),
                    "Pill"
                  )}
                  {presetButton(
                    p.btnShape === "rounded",
                    () => onPreviewPatch({ btnShape: "rounded" }),
                    "Rounded"
                  )}
                  {presetButton(
                    p.btnShape === "square",
                    () => onPreviewPatch({ btnShape: "square" }),
                    "Square"
                  )}
                </div>
              </div>
            )}

            {detailTab === "button_color" && (
              <DesignColorPickerPanel
                mode="button"
                selectedHex={p.moduleFillHex}
                onSelectHex={(hex) => onPreviewPatch({ moduleFillHex: hex })}
                onClearHex={() => onPreviewPatch({ moduleFillHex: null })}
                onBack={() => onDetailTabChange(previousDesignDetailTab("button_color"))}
              />
            )}

            {detailTab === "button_styling" && (
              <div className={styles.designPresetBlock}>
                <p className={styles.designPresetLabel}>Treatment</p>
                <div className={styles.designPresetRow}>
                  {presetButton(
                    p.btnStyle === "solid",
                    () => onPreviewPatch({ btnStyle: "solid" }),
                    "Solid"
                  )}
                  {presetButton(
                    p.btnStyle === "outline",
                    () => onPreviewPatch({ btnStyle: "outline" }),
                    "Outline"
                  )}
                  {presetButton(
                    p.btnStyle === "soft",
                    () => onPreviewPatch({ btnStyle: "soft" }),
                    "Soft fill"
                  )}
                </div>
              </div>
            )}

            <p className={styles.mutedNote}>
              Starting path:{" "}
              <strong>
                {startingPoint === null
                  ? "not selected"
                  : startingPoint === "template"
                    ? "template"
                    : "manual"}
              </strong>
              . Template vs manual resets preview defaults; presets above override until
              you switch path again.
            </p>
          </div>
        </div>
      </section>
    </fieldset>
  );
}
