/**
 * Static demo snapshot for the builder prototype only.
 * Not loaded from API; shape is loosely aligned with portal guest data for UI realism.
 * Phone preview colors match builder reference: white canvas, navy title, lavender body.
 */
export const DEMO_PORTAL = {
  title: "Sample ArtKey™ Portal",
  tagline: "Demo Host — generic creative-project placeholder copy.",
  theme: {
    template: "classic",
    bg_color: "#ffffff",
    title_color: "#1a2338",
    text_color: "#9b8ab8",
    button_color: "#e5bd3a",
  },
  highlights: [
    "Welcome and sponsor blocks (demo labels)",
    "Events and supporter updates (static)",
    "Stay connected and curated links (not wired)",
  ],
} as const;

/** Centered copy inside the Live Preview phone (matches builder reference). */
export const LIVE_PREVIEW_PLACEHOLDER = "Your Personalized Design";
