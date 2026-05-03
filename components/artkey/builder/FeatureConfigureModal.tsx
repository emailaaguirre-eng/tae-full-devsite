"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { ArtKeyTrademark } from "@/components/RefinedTm";
import type { FeatureModuleDef } from "./featureModules";
import { neutralBuilderConfigureBody } from "./neutralPortalBodies";
import styles from "./akBuilder.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  feature: FeatureModuleDef | null;
};

export function FeatureConfigureModal({ open, onClose, feature }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !feature) return null;

  const portalBody = neutralBuilderConfigureBody(feature.id);

  return (
    <div
      className={styles.featureModalRoot}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={styles.featureModalPanel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feature-configure-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.featureModalHeader}>
          <div>
            <h2 id="feature-configure-title" className={styles.featureModalTitle}>
              {feature.title}
            </h2>
            <p className={styles.featureModalKicker}>
              <ArtKeyTrademark /> Portal · Configure (demo)
            </p>
          </div>
          <button
            type="button"
            className={styles.featureModalClose}
            aria-label="Close"
            onClick={onClose}
          >
            <X size={16} strokeWidth={2.25} />
          </button>
        </div>
        <div className={styles.featureModalBody}>{portalBody}</div>
        <div className={styles.featureModalFooter}>
          <span className={styles.featureModalFooterNote}>
            Demo only — nothing is saved. Configure copy is prototype-only and does not
            load live portal data.
          </span>
        </div>
      </div>
    </div>
  );
}
