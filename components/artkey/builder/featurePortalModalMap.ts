import type { FeatureModuleId } from "./featureModules";

/**
 * Maps a builder feature to the title string used by `getPortalModalContent` in
 * `components/PhoneModal.tsx` (public portal mock). When this returns null, the
 * builder shows a generic configure placeholder instead.
 */
export function portalModalTitleForFeature(id: FeatureModuleId): string | null {
  switch (id) {
    case "sponsors":
      return "Sponsors & Partners";
    case "stay_connected":
      return "Stay Connected";
    case "events":
      return "Talks & Appearances";
    case "supporter_updates":
      return "Forum For Supporters";
    default:
      return null;
  }
}
