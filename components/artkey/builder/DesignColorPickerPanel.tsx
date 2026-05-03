"use client";

import { useRef, useState } from "react";
import styles from "./akBuilder.module.css";
import {
  normalizeSolidHex,
  SOLID_COLOR_PRESETS,
} from "./designSolidColorPresets";

export type ColorPickerMode = "background" | "button";

type ColorSourceTab = "solid" | "stock" | "upload";

type Props = {
  mode: ColorPickerMode;
  selectedHex: string | null;
  onSelectHex: (hex: string) => void;
  onClearHex?: () => void;
};

function normalizeColorInputValue(hex: string | null): string {
  if (!hex) return "#1a2338";
  const h = hex.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(h)) return h.toLowerCase();
  return "#1a2338";
}

export function DesignColorPickerPanel({
  mode,
  selectedHex,
  onSelectHex,
  onClearHex,
  onBack,
}: Props) {
  const [sourceTab, setSourceTab] = useState<ColorSourceTab>("solid");
  const nativePickerRef = useRef<HTMLInputElement>(null);

  const isButtonMode = mode === "button";

  const title =
    mode === "background" ? "Select a Background" : "Select Button Color";

  const solidPresetGrid = (
    <div className={styles.titleTextColorBlock}>
      <div
        className={styles.titleTextPresetGrid}
        role="group"
        aria-label={
          isButtonMode ? "Solid button colors" : "Solid background colors"
        }
      >
        {SOLID_COLOR_PRESETS.map(({ hex, label }) => {
          const current = selectedHex ? normalizeSolidHex(selectedHex) : "";
          const preset = normalizeSolidHex(hex);
          const active = current !== "" && preset !== "" && current === preset;
          const lightFill =
            hex.toLowerCase() === "#ffffff" || hex.toLowerCase() === "#facc15";
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
              onClick={() => onSelectHex(hex)}
            />
          );
        })}
      </div>
      <input
        ref={nativePickerRef}
        type="color"
        className={styles.colorPickerNativeInput}
        value={normalizeColorInputValue(selectedHex)}
        aria-label={
          isButtonMode
            ? "Pick a custom button color"
            : "Pick a custom background color"
        }
        onChange={(e) => onSelectHex(e.target.value)}
      />
      <button
        type="button"
        className={styles.titleTextMoreColorsBtn}
        onClick={() => nativePickerRef.current?.click()}
      >
        <span className={styles.titleTextMoreColorsIcon} aria-hidden>
          🎨
        </span>
        More Colors
      </button>
    </div>
  );

  const showClear =
    Boolean(onClearHex && selectedHex) &&
    (isButtonMode || sourceTab === "solid");
  const clearBtn = showClear ? (
    <button type="button" className={styles.colorPickerReset} onClick={onClearHex}>
      Clear custom color (use tone / preset)
    </button>
  ) : null;

  if (isButtonMode) {
    return (
      <>
        {solidPresetGrid}
        {clearBtn}
      </>
    );
  }

  return (
    <div className={styles.colorPickerCard}>
      <div className={styles.colorPickerTabBar} role="tablist" aria-label="Color source">
        <button
          type="button"
          role="tab"
          aria-selected={sourceTab === "solid"}
          className={
            sourceTab === "solid" ? styles.colorPickerTabActive : styles.colorPickerTab
          }
          onClick={() => setSourceTab("solid")}
        >
          Solid Color
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={sourceTab === "stock"}
          className={
            sourceTab === "stock" ? styles.colorPickerTabActive : styles.colorPickerTab
          }
          onClick={() => setSourceTab("stock")}
        >
          Stock Photos
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={sourceTab === "upload"}
          className={
            sourceTab === "upload" ? styles.colorPickerTabActive : styles.colorPickerTab
          }
          onClick={() => setSourceTab("upload")}
        >
          Upload
        </button>
      </div>

      {sourceTab === "solid" && solidPresetGrid}

      {sourceTab === "stock" && (
        <p className={styles.colorPickerPlaceholder}>
          Stock photo backgrounds are not wired in this prototype. Use{" "}
          <strong>Solid Color</strong> for now.
        </p>
      )}

      {sourceTab === "upload" && (
        <p className={styles.colorPickerPlaceholder}>
          Uploads are disabled in this preview-only build. Use <strong>Solid Color</strong>{" "}
          for now.
        </p>
      )}

      {clearBtn}
    </div>
  );
}
