export type FeatureModuleId =
  | "welcome_message"
  | "sponsors"
  | "events"
  | "supporter_updates"
  | "stay_connected"
  | "favorites_links";

export type FeatureModuleDef = {
  id: FeatureModuleId;
  /** Shown in the icon tile on the feature library card. */
  cardIcon: string;
  title: string;
  short: string;
  description: string;
  /** When true, card shows “Soon” and cannot be toggled on in this prototype. */
  comingSoon?: boolean;
};

/**
 * Generic portal modules for this prototype (order matches design preview CTAs).
 */
export const FEATURE_MODULES: FeatureModuleDef[] = [
  {
    id: "welcome_message",
    cardIcon: "👋",
    title: "Welcome Message",
    short: "Introduce the portal and set the tone for visitors.",
    description:
      "A short greeting and orientation block at the top of the guest experience. Demo copy only — no persistence.",
  },
  {
    id: "sponsors",
    cardIcon: "🤝",
    title: "Sponsors & Partners",
    short: "Logos, thank-yous, and links for supporting organizations.",
    description:
      "Surface sponsors with optional tiers, external links, and a brief host-written note. Prototype layout only.",
  },
  {
    id: "events",
    cardIcon: "📅",
    title: "Events & Appearances",
    short: "Dates, venues, and links for upcoming appearances or releases.",
    description:
      "A simple schedule-style list for launches, meetups, or seasonal milestones. Static sample rows in a later preview phase.",
  },
  {
    id: "supporter_updates",
    cardIcon: "📣",
    title: "Supporter Updates",
    short: "Pinned notes or a lightweight changelog for your audience.",
    description:
      "Share milestones, release notes, or thank-you posts. Design placeholder only — no backend in this build.",
  },
  {
    id: "stay_connected",
    cardIcon: "📬",
    title: "Stay Connected",
    short: "Newsletter, social profiles, and primary contact paths.",
    description:
      "Collect sign-ups and list socials in one block. Prototype shows layout only.",
  },
  {
    id: "favorites_links",
    cardIcon: "⭐",
    title: "Favorites & Links",
    short: "Curated links with labels (and optional thumbnails in live portals).",
    description:
      "Maps to favorites and custom links in production portals. Toggle below controls a local-only enabled flag.",
  },
];
