export type FeatureModuleId =
  | "spotify"
  | "image_gallery"
  | "guestbook"
  | "video_featured"
  | "favorites"
  | "sponsors"
  | "stay_connected"
  | "events"
  | "supporter_updates"
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

export const FEATURE_MODULES: FeatureModuleDef[] = [
  {
    id: "spotify",
    cardIcon: "🎵",
    title: "Playlist (Spotify)",
    short: "Embed a playlist or album for visitors to play in-portal.",
    description:
      "Host pastes a Spotify URL; guests open an in-page player experience. Prototype only — no OAuth or API calls.",
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
    id: "guestbook",
    cardIcon: "✍️",
    title: "Guestbook",
    short: "Signed messages from visitors with moderation hooks.",
    description:
      "Collects guest messages for host review. Live portals support moderation; here you only toggle a local “enabled” flag.",
  },
  {
    id: "video_featured",
    cardIcon: "▶️",
    title: "Video Gallery / Featured Video",
    short: "Featured clip plus optional multi-video layout.",
    description:
      "Primary featured video with optional gallery of additional embeds. Static copy in this builder prototype.",
  },
  {
    id: "favorites",
    cardIcon: "⭐",
    title: "Favorites",
    short: "Curated links with thumbnails and labels.",
    description:
      "Maps to favorites + custom links in live portals. Use the toggle below for a local-only enabled flag.",
  },
  {
    id: "sponsors",
    cardIcon: "🤝",
    title: "Sponsors & Partners",
    short: "Add logos, sponsor descriptions, and website links.",
    description:
      "Surface sponsors with optional tiers, external links, and a short host-written thank-you. Demo only — no persistence.",
  },
  {
    id: "stay_connected",
    cardIcon: "📬",
    title: "Stay Connected",
    short: "Newsletter, social, and contact CTAs.",
    description:
      "Collect sign-ups and list social profiles in one block. Prototype shows layout only.",
  },
  {
    id: "events",
    cardIcon: "📅",
    title: "Events & Appearances",
    short: "Schedule rows with date, venue, ticket link.",
    description:
      "Timeline-style list for tour dates, pop-ups, or appearances. Static sample rows in a future Preview phase.",
  },
  {
    id: "supporter_updates",
    cardIcon: "📣",
    title: "Supporter Updates",
    short: "Pinned posts or changelog style.",
    description:
      "Lightweight updates feed for supporters — design placeholder; no backend.",
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
