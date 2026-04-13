/**
 * Reusable portal *page* presets: visual template + which actions are on + button order.
 * Custom link rows are preserved when applying (see ArtKeyEditor apply handler).
 */

export type PortalPagePresetId =
  | "wedding_keepsake"
  | "celebration_all"
  | "gallery_spotlight"
  | "music_and_guestbook";

export type PortalFeaturesPatch = Partial<{
  enable_gallery: boolean;
  enable_video: boolean;
  show_guestbook: boolean;
  enable_spotify: boolean;
  enable_favorites: boolean;
  enable_custom_links: boolean;
  order: string[];
}>;

export type PortalPagePreset = {
  id: PortalPagePresetId;
  label: string;
  description: string;
  /** Must match `ArtKeyTemplate.value` in templates.ts */
  templateValue: string;
  /** Order of core action keys (spotify, gallery, guestbook, video, favorites) */
  order: string[];
  featuresPatch: PortalFeaturesPatch;
};

const CORE_FEATURE_BLUEPRINT = [
  { key: "spotify", label: "🎵 Playlist (Spotify)", field: "enable_spotify", type: "feature" as const },
  { key: "gallery", label: "📸 Image Gallery", field: "enable_gallery", type: "feature" as const },
  { key: "guestbook", label: "📖 Guestbook", field: "show_guestbook", type: "feature" as const },
  { key: "video", label: "🎥 Featured Video · Video Gallery", field: "enable_video", type: "feature" as const },
  { key: "favorites", label: "⭐ Favorites", field: "enable_favorites", type: "feature" as const },
] as const;

function coreKeyEnabled(key: string, patch: PortalFeaturesPatch): boolean {
  switch (key) {
    case "spotify":
      return patch.enable_spotify === true;
    case "gallery":
      return patch.enable_gallery === true;
    case "guestbook":
      return patch.show_guestbook === true;
    case "video":
      return patch.enable_video === true;
    case "favorites":
      return patch.enable_favorites === true;
    default:
      return false;
  }
}

/**
 * Build core featureDef rows (not including custom_link or continuing_story — editor normalizes those).
 */
export function buildCoreFeatureDefsFromPreset(preset: PortalPagePreset): Array<{
  key: string;
  label: string;
  field: string;
  type: "feature";
  enabled: boolean;
}> {
  const byKey = new Map(CORE_FEATURE_BLUEPRINT.map((r) => [r.key, r]));
  const out: Array<{
    key: string;
    label: string;
    field: string;
    type: "feature";
    enabled: boolean;
  }> = [];
  for (const k of preset.order) {
    const row = byKey.get(k);
    if (!row) continue;
    out.push({
      ...row,
      enabled: coreKeyEnabled(k, preset.featuresPatch),
    });
  }
  return out;
}

export const PORTAL_PAGE_PRESETS: PortalPagePreset[] = [
  {
    id: "wedding_keepsake",
    label: "Wedding keepsake",
    description: "Editorial ivory look with gallery, guestbook, and favorites.",
    templateValue: "modern-romance",
    order: ["gallery", "guestbook", "favorites", "spotify", "video"],
    featuresPatch: {
      enable_gallery: true,
      show_guestbook: true,
      enable_favorites: true,
      enable_spotify: false,
      enable_video: false,
      order: ["gallery", "guestbook", "favorites"],
    },
  },
  {
    id: "celebration_all",
    label: "Full celebration",
    description: "Bold gradient with every standard action turned on.",
    templateValue: "sunset",
    order: ["spotify", "gallery", "guestbook", "video", "favorites"],
    featuresPatch: {
      enable_spotify: true,
      enable_gallery: true,
      show_guestbook: true,
      enable_video: true,
      enable_favorites: true,
      order: ["gallery", "guestbook", "video", "spotify", "favorites"],
    },
  },
  {
    id: "gallery_spotlight",
    label: "Gallery spotlight",
    description: "Dark, photo-forward style with only the image gallery on.",
    templateValue: "dark",
    order: ["gallery", "guestbook", "video", "spotify", "favorites"],
    featuresPatch: {
      enable_gallery: true,
      enable_spotify: false,
      show_guestbook: false,
      enable_video: false,
      enable_favorites: false,
      order: ["gallery"],
    },
  },
  {
    id: "music_and_guestbook",
    label: "Music + guestbook",
    description: "Clean base with Spotify and guestbook; gallery and video off.",
    templateValue: "start-blank",
    order: ["spotify", "guestbook", "gallery", "video", "favorites"],
    featuresPatch: {
      enable_spotify: true,
      show_guestbook: true,
      enable_gallery: false,
      enable_video: false,
      enable_favorites: false,
      order: ["spotify", "guestbook"],
    },
  },
];

export function getPortalPagePreset(id: PortalPagePresetId): PortalPagePreset | undefined {
  return PORTAL_PAGE_PRESETS.find((p) => p.id === id);
}
