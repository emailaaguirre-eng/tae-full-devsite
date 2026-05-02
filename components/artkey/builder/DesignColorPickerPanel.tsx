"use client";

import { useMemo, useState } from "react";
import styles from "./akBuilder.module.css";

export type ColorPickerMode = "background" | "button";

type ColorSourceTab = "solid" | "stock" | "upload";

type Props = {
  mode: ColorPickerMode;
  selectedHex: string | null;
  onSelectHex: (hex: string) => void;
  onClearHex?: () => void;
  onBack: () => void;
};

/** Page 1 — matches reference layout (2×6). */
const SWATCH_PAGE_1: string[] = [
  "#ffffff",
  "#000000",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
  "#64748b",
  "#d97706",
  "#06b6d4",
];

const SWATCH_PAGE_2: string[] = [
  "#f8fafc",
  "#1e293b",
  "#fecaca",
  "#ffedd5",
  "#fef9c3",
  "#bbf7d0",
  "#bfdbfe",
  "#ddd6fe",
  "#fbcfe8",
  "#cbd5e1",
  "#fdba74",
  "#a5f3fc",
];

const SWATCH_PAGES = [SWATCH_PAGE_1, SWATCH_PAGE_2];

export function DesignColorPickerPanel({
  mode,
  selectedHex,
  onSelectHex,
  onClearHex,
  onBack,
}: Props) {
  const [sourceTab, setSourceTab] = useState<ColorSourceTab>("solid");
  const [page, setPage] = useState(0);

  const title =
    mode === "background" ? "Select a Background" : "Select Button Color";

  const pageColors = useMemo(() => SWATCH_PAGES[page] ?? SWATCH_PAGE_1, [page]);
  const pageCount = SWATCH_PAGES.length;

  return (
    <div className={styles.colorPickerCard}>
      <div className={styles.colorPickerHeader}>
        <div className={styles.colorPickerTitleRow}>
          <span className={styles.colorPickerTitleIcon} aria-hidden />
          <h3 className={styles.colorPickerTitle}>{title}</h3>
        </div>
        <button type="button" className={styles.colorPickerBack} onClick={onBack}>
          ← Back
        </button>
      </div>

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

      {sourceTab === "solid" && (
        <>
          <div className={styles.colorPickerPagination}>
            <button
              type="button"
              className={styles.colorPickerPageArrow}
              aria-label="Previous page"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              ‹
            </button>
            <span className={styles.colorPickerPageLabel}>Page {page + 1}</span>
            <button
              type="button"
              className={styles.colorPickerPageArrow}
              aria-label="Next page"
              disabled={page >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            >
              ›
            </button>
          </div>
          <div className={styles.colorPickerSwatchGrid}>
            {pageColors.map((hex) => {
              const selected = selectedHex?.toLowerCase() === hex.toLowerCase();
              return (
                <button
                  key={`${page}-${hex}`}
                  type="button"
                  className={
                    selected ? styles.colorPickerSwatchSelected : styles.colorPickerSwatch
                  }
                  style={{ backgroundColor: hex }}
                  aria-label={`Color ${hex}`}
                  aria-pressed={selected}
                  onClick={() => onSelectHex(hex)}
                />
              );
            })}
          </div>
          <button
            type="button"
            className={styles.colorPickerMoreBtn}
            onClick={() => setPage((p) => (p + 1) % pageCount)}
          >
            <span aria-hidden>🎨</span> More Colors
          </button>
        </>
      )}

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

      {onClearHex && selectedHex && sourceTab === "solid" && (
        <button type="button" className={styles.colorPickerReset} onClick={onClearHex}>
          Clear custom color (use tone / preset)
        </button>
      )}
    </div>
  );
}
