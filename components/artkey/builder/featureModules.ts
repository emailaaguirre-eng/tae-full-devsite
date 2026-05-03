export type FeatureModuleId =
  | "welcome_message"
  | "image_gallery"
  | "video_featured"
  | "guestbook"
  | "spotify"
  | "sponsors"
  | "events"
  | "supporter_updates"
  | "stay_connected"
  | "favorites_links"
  | "continuing_story";

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
 * Full portal feature set for the library (order matches design-preview module strip,
 * excluding entries marked `comingSoon`).
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
    id: "image_gallery",
    cardIcon: "🖼",
    title: "Image Gallery",
    short: "Photo grids, lightbox, and optional captions.",
    description:
      "Curated image sets with ordering and captions. Demo toggles are local; uploads are not wired in this phase.",
  },
  {
    id: "video_featured",
    cardIcon: "▶️",
    title: "Video Gallery",
    short: "Featured clip plus optional multi-video layout.",
    description:
      "Primary featured video with optional gallery of additional embeds. Static copy in this builder prototype.",
  },
  {
    id: "guestbook",
    cardIcon: "✍️",
    title: "Guestbook",
    short: "Signed messages from visitors with moderation hooks.",
    description:
      "Collects guest messages for host review. Live portals support moderation; here you only toggle a local “enabled” flag.",
  },
  {
    id: "spotify",
    cardIcon: "🎵",
    title: "Playlist (Spotify)",
    short: "Embed a playlist or album for visitors to play in-portal.",
    description:
      "Host pastes a Spotify URL; guests open an in-page player experience. Prototype only — no OAuth or API calls.",
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
  {
    id: "continuing_story",
    cardIcon: "📖",
    title: "Continuing Story",
    short: "Linked chapters that unfold over time — coming soon.",
    description:
      "Sequential story blocks tied to the portal, aligned with the Continuing Story concept in the live ArtKey editor. Not available in this prototype build.",
    comingSoon: true,
  },
];
