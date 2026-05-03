export type DesignStartingPoint = "template" | "manual";

export type DesignDetailTabId =
  | "background"
  | "title_font"
  | "button_font"
  | "button_shapes"
  | "button_color"
  | "button_styling"
  | "header_icon";

export const DESIGN_DETAIL_TABS: { id: DesignDetailTabId; label: string }[] = [
  { id: "background", label: "Background" },
  { id: "title_font", label: "Title font" },
  { id: "button_font", label: "Button font" },
  { id: "button_shapes", label: "Button shapes" },
  { id: "button_color", label: "Button color" },
  { id: "button_styling", label: "Button styling" },
  { id: "header_icon", label: "Header icon" },
];

/** Previous tab in appearance strip (wraps); used for color picker “Back”. */
export function previousDesignDetailTab(id: DesignDetailTabId): DesignDetailTabId {
  const idx = DESIGN_DETAIL_TABS.findIndex((t) => t.id === id);
  if (idx <= 0) return DESIGN_DETAIL_TABS[DESIGN_DETAIL_TABS.length - 1]!.id;
  return DESIGN_DETAIL_TABS[idx - 1]!.id;
}

export type DesignPortalModuleButton = {
  id: string;
  label: string;
  /** Emoji shown to the left of the label in the phone preview (guest layout). */
  icon: string;
};

/**
 * Guest phone preview CTAs (Design tab) — generic six-module strip for the prototype.
 */
export const DESIGN_PORTAL_MODULE_BUTTONS: DesignPortalModuleButton[] = [
  { id: "welcome_message", label: "Welcome Message", icon: "👋" },
  { id: "sponsors", label: "Sponsors & Partners", icon: "🤝" },
  { id: "events", label: "Events & Appearances", icon: "📅" },
  { id: "supporter_updates", label: "Supporter Updates", icon: "📣" },
  { id: "stay_connected", label: "Stay Connected", icon: "📬" },
  { id: "favorites_links", label: "Favorites & Links", icon: "⭐" },
];
