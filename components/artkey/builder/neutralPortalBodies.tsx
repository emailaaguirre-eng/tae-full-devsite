"use client";

import type { ReactNode } from "react";
import type { FeatureModuleId } from "./featureModules";
import { ArtKeyTrademark } from "@/components/RefinedTm";
import { PlaylistConfigurePanel } from "./PlaylistConfigurePanel";
import { VideoGalleryConfigurePanel } from "./VideoGalleryConfigurePanel";
import styles from "./akBuilder.module.css";

/**
 * Builder-only configure copy. Keeps the prototype generic and avoids pulling
 * host-specific portal mock content from shared components.
 */
export function neutralBuilderConfigureBody(id: FeatureModuleId): ReactNode {
  switch (id) {
    case "welcome_message":
      return (
        <div className={styles.featureModalGeneric}>
          <p className={styles.featureModalGenericLead}>
            Open with a clear greeting: who you are, what this portal is for, and what
            visitors should do next.
          </p>
          <p className={styles.featureModalGenericText}>
            In production, this block often pairs with a hero image or short video. Here
            it is static placeholder copy for layout review only.
          </p>
        </div>
      );
    case "image_gallery":
      return (
        <div className={styles.featureModalGeneric}>
          <p className={styles.featureModalGenericLead}>
            Build ordered sets of images with optional captions and a lightbox-style
            viewer for guests.
          </p>
          <p className={styles.featureModalGenericText}>
            Cropping, upload limits, and CDN delivery match the live editor later. This
            screen is layout-only.
          </p>
        </div>
      );
    case "video_featured":
      return <VideoGalleryConfigurePanel />;
    case "guestbook":
      return (
        <div className={styles.featureModalGeneric}>
          <p className={styles.featureModalGenericLead}>
            Let visitors leave a short signed message; hosts review before publishing in
            production workflows.
          </p>
          <p className={styles.featureModalGenericText}>
            Moderation queues and notifications are not wired here — only the on/off
            toggle is local.
          </p>
        </div>
      );
    case "spotify":
      return <PlaylistConfigurePanel />;
    case "sponsors":
      return (
        <div className={styles.featureModalGeneric}>
          <p className={styles.featureModalGenericLead}>
            Thank partners by name, add a short blurb, and link out to their sites or
            campaigns.
          </p>
          <p className={styles.featureModalGenericText}>
            Demo: imagine a row of logos with “Sample Sponsor” style tiers — no uploads
            or CRM sync in this prototype.
          </p>
        </div>
      );
    case "events":
      return (
        <div className={styles.featureModalGeneric}>
          <p className={styles.featureModalGenericLead}>
            List upcoming milestones: title, date or window, location or channel, and an
            optional ticket or RSVP link.
          </p>
          <p className={styles.featureModalGenericText}>
            Useful for project launches, live sessions, or seasonal drops. Rows are
            static in phase 1.
          </p>
        </div>
      );
    case "supporter_updates":
      return (
        <div className={styles.featureModalGeneric}>
          <p className={styles.featureModalGenericLead}>
            Post short updates your community can scan quickly — shipped features,
            design notes, or gratitude posts.
          </p>
          <p className={styles.featureModalGenericText}>
            This prototype does not thread comments or subscriptions; it only mirrors how
            the block reads in the guest layout.
          </p>
        </div>
      );
    case "stay_connected":
      return (
        <div className={styles.featureModalGeneric}>
          <p className={styles.featureModalGenericLead}>
            Combine email capture with social icons so supporters choose how they follow
            along.
          </p>
          <p className={styles.featureModalGenericText}>
            Field-level validation and provider wiring will match the live{" "}
            <ArtKeyTrademark /> editor later; for now, treat this as a visual mock.
          </p>
        </div>
      );
    case "favorites_links":
      return (
        <div className={styles.favoritesConfigureWrap}>
          <div className={styles.favoritesConfigureCard}>
            <h3 className={styles.favoritesConfigureTitle}>Favorites</h3>
            <p className={styles.favoritesConfigureHelp}>
              Add up to 6 favorites. Turn <strong>Favorites</strong> on in{" "}
              <strong>Add Buttons</strong> and drag it to reorder. Each card can mix
              title, description, image, and link — a row is saved only if at least one
              field is filled after trimming; http(s) URLs are validated and invalid URLs
              are dropped. Thumbnail: paste an image URL or upload (upload replaces the URL
              field). All text is trimmed on save.
            </p>
            <button
              type="button"
              className={styles.favoritesConfigureAddBtn}
              title="Demo only — add flow not wired in this prototype"
            >
              + Add favorite (0/6)
            </button>
          </div>
        </div>
      );
    case "continuing_story":
      return (
        <div className={styles.featureModalGeneric}>
          <p className={styles.featureModalGenericLead}>
            Continuing Story will let hosts publish linked chapters over time so guests
            can follow a narrative inside the portal.
          </p>
          <p className={styles.featureModalGenericText}>
            This module is marked <strong>Coming soon</strong> in the prototype — no
            fields to edit yet.
          </p>
        </div>
      );
  }
}
