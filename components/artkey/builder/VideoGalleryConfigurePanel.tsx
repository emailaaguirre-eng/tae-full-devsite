"use client";

import { useState } from "react";
import styles from "./akBuilder.module.css";

/**
 * Video Gallery configure UI — collapsed row → expanded light panel → + Upload (demo).
 */
export function VideoGalleryConfigurePanel() {
  const [expanded, setExpanded] = useState(false);
  const [uploadTapped, setUploadTapped] = useState(false);

  const open = () => {
    setExpanded(true);
    setUploadTapped(false);
  };

  const collapse = () => {
    setExpanded(false);
    setUploadTapped(false);
  };

  return (
    <div className={styles.videoGalleryConfigureWrap}>
      <h3 className={styles.videoGalleryConfigurePageTitle}>video gallery</h3>

      {!expanded ? (
        <div className={styles.videoGalleryConfigureCard}>
          <button type="button" className={styles.videoGalleryConfigureRow} onClick={open}>
            <span className={styles.videoGalleryConfigureRowLeft}>
              <span className={styles.videoGalleryConfigureEmoji} aria-hidden>
                🎥
              </span>
              <span
                className={`${styles.videoGalleryConfigureModuleTitle} ${styles.videoGalleryConfigureModuleTitleRow}`}
              >
                Video Gallery
              </span>
            </span>
            <span className={styles.videoGalleryConfigureRowRight}>
              <span className={styles.videoGalleryPlayIcon} aria-hidden>
                <span className={styles.videoGalleryPlayTriangle} />
              </span>
              <span className={styles.videoGalleryStateLabel}>Closed</span>
            </span>
          </button>
        </div>
      ) : (
        <div className={styles.videoGalleryConfigureExpanded}>
          <div className={styles.videoGalleryInnerHeader}>
            <span className={styles.videoGalleryInnerHeaderLeft}>
              <span className={styles.videoGalleryConfigureEmoji} aria-hidden>
                🎥
              </span>
              <span className={styles.videoGalleryConfigureModuleTitle}>Video Gallery</span>
            </span>
            <button
              type="button"
              className={styles.videoGalleryOpenToggle}
              title="Collapse section"
              aria-label="Collapse video gallery section"
              onClick={collapse}
            >
              <span className={styles.videoGalleryOpenCaret} aria-hidden>
                ▼
              </span>{" "}
              Open
            </button>
          </div>
          <p className={styles.videoGalleryFieldLabel}>Videos</p>
          <button
            type="button"
            className={styles.videoGalleryUploadBtn}
            onClick={() => setUploadTapped(true)}
          >
            + Upload
          </button>
          {uploadTapped ? (
            <p className={styles.videoGalleryUploadNote}>
              Demo only — file upload is not wired in this prototype.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
