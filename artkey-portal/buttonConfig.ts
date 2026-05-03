export type PortalButton = {
  id: string;
  label: string;
  /** Optional emoji / icon for future UI; live list uses `label` only. */
  icon?: string;
  /** Must match `getPortalModalContent` cases in `components/PhoneModal.tsx`. */
  modalTitle: string;
  type: "gallery" | "video" | "playlist" | "voice";
};

/**
 * Local portal button definitions — replace this file with the same module from
 * cPanel (`artkey-portal/buttonConfig.ts`) when syncing production.
 */
const portalButtons: PortalButton[] = [
  {
    id: "welcome",
    label: "Welcome Message",
    icon: "✉️",
    modalTitle: "Welcome Message",
    type: "gallery",
  },
  {
    id: "sponsors",
    label: "Sponsors & Partners",
    icon: "🤝",
    modalTitle: "Sponsors & Partners",
    type: "gallery",
  },
  {
    id: "talks",
    label: "Talks & Appearances",
    icon: "🎤",
    modalTitle: "Talks & Appearances",
    type: "voice",
  },
  {
    id: "forum",
    label: "Forum For Supporters",
    icon: "💬",
    modalTitle: "Forum For Supporters",
    type: "gallery",
  },
  {
    id: "stay",
    label: "Stay Connected",
    icon: "🔗",
    modalTitle: "Stay Connected",
    type: "playlist",
  },
];

export default portalButtons;
