"use client";

import type { Dispatch, SetStateAction } from "react";
import { FEATURE_MODULES, type FeatureModuleId } from "./featureModules";
import styles from "./akBuilder.module.css";

type Props = {
  moduleOn: Record<FeatureModuleId, boolean>;
  setModuleOn: Dispatch<SetStateAction<Record<FeatureModuleId, boolean>>>;
  onOpenConfigure: (id: FeatureModuleId) => void;
};

export function FeatureLibraryGrid({ moduleOn, setModuleOn, onOpenConfigure }: Props) {
  return (
    <div className={styles.featureLibraryGrid}>
      {FEATURE_MODULES.map((m) => {
        const on = moduleOn[m.id];
        const soon = Boolean(m.comingSoon);
        return (
          <article
            key={m.id}
            className={[styles.featureLibraryCard, soon ? styles.featureLibraryCardSoon : ""]
              .filter(Boolean)
              .join(" ")}
          >
            <div className={styles.featureLibraryCardMain}>
              <span className={styles.featureLibraryIcon} aria-hidden>
                {m.cardIcon}
              </span>
              <div className={styles.featureLibraryText}>
                <h3 className={styles.featureLibraryTitle}>{m.title}</h3>
                <p className={styles.featureLibraryDesc}>{m.short}</p>
              </div>
            </div>
            <div className={styles.featureLibraryFooter}>
              {soon ? (
                <span className={styles.featureLibraryBadgeSoon}>Soon</span>
              ) : (
                <button
                  type="button"
                  className={on ? styles.featureLibraryBadgeOn : styles.featureLibraryBadgeOff}
                  onClick={() =>
                    setModuleOn((prev) => ({ ...prev, [m.id]: !prev[m.id] }))
                  }
                >
                  {on ? "Enabled" : "Disabled"}
                </button>
              )}
              <button
                type="button"
                className={styles.featureLibraryConfigure}
                disabled={soon}
                onClick={() => onOpenConfigure(m.id)}
              >
                Configure →
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
