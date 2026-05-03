"use client";

import type { ReactNode } from "react";
import type { FeatureModuleId } from "./featureModules";
import { ArtKeyTrademark } from "@/components/RefinedTm";
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
        <div className={styles.featureModalGeneric}>
          <p className={styles.featureModalGenericLead}>
            Curate outbound links: press, shop, playlist, or resources you want every
            visitor to see.
          </p>
          <p className={styles.featureModalGenericText}>
            Thumbnails and ordering behave like favorites in live portals. No link
            health checks or analytics in this build.
          </p>
        </div>
      );
  }
}
