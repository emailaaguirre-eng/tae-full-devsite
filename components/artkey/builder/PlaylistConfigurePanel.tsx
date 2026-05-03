"use client";

import { useState } from "react";
import styles from "./akBuilder.module.css";

/**
 * Spotify / playlist configure UI — matches editor-style “Upload images” reference
 * (collapsed row + expanded light-blue panel). Demo only; no URL persistence.
 */
export function PlaylistConfigurePanel() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={styles.playlistConfigureWrap}>
      <h3 className={styles.playlistConfigurePageTitle}>Add playlist</h3>

      {!expanded ? (
        <div className={styles.playlistConfigureCard}>
          <button
            type="button"
            className={styles.playlistConfigureRow}
            onClick={() => setExpanded(true)}
          >
            <span className={styles.playlistConfigureRowLeft}>
              <span className={styles.playlistConfigureEmoji} aria-hidden>
                🎵
              </span>
              <span className={styles.playlistConfigureModuleTitle}>
                Playlist (Spotify)
              </span>
            </span>
            <span className={styles.playlistConfigureRowRight}>
              <span className={styles.playlistPlayIcon} aria-hidden>
                <span className={styles.playlistPlayTriangle} />
              </span>
              <span className={styles.playlistStateLabel}>Closed</span>
            </span>
          </button>
        </div>
      ) : (
        <div className={styles.playlistConfigureExpanded}>
          <div className={styles.playlistInnerHeader}>
            <span className={styles.playlistInnerHeaderLeft}>
              <span className={styles.playlistConfigureEmoji} aria-hidden>
                🎵
              </span>
              <span className={styles.playlistConfigureModuleTitle}>
                Playlist (Spotify)
              </span>
            </span>
            <button
              type="button"
              className={styles.playlistOpenToggle}
              title="Collapse section"
              aria-label="Collapse playlist section"
              onClick={() => setExpanded(false)}
            >
              <span className={styles.playlistOpenCaret} aria-hidden>
                ▼
              </span>{" "}
              Open
            </button>
          </div>
          <p className={styles.playlistFieldLabel}>Playlist URL</p>
          <button type="button" className={styles.playlistPasteBtn}>
            + Paste Spotify URL
          </button>
        </div>
      )}
    </div>
  );
}
