import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookOpen,
  Handshake,
  Heart,
  Images,
  Link2,
  Mail,
  MapPinned,
  MapPin,
  MessageCircle,
  MessageSquare,
  Mic,
  Music,
  Send,
  Upload,
  Users,
  Video,
} from "lucide-react";

/**
 * Picks a Lucide icon from feature copy (first matching rule wins). Order is specific → broad.
 */
export function getArtKeyFeatureIcon(label: string): LucideIcon {
  const s = label.toLowerCase();

  const rules: Array<{ match: (t: string) => boolean; Icon: LucideIcon }> = [
    {
      match: (t) =>
        /global map|location pins|collectable dashboard|map &/.test(t),
      Icon: MapPinned,
    },
    { match: (t) => /purchase button|send the postcard/i.test(t), Icon: Send },
    { match: (t) => /community forum|forum for attendees/.test(t), Icon: MessageCircle },
    { match: (t) => /sponsor recognition|partner links|partner\b/.test(t), Icon: Handshake },
    {
      match: (t) =>
        /updates and releases|future releases|stay connected for updates/.test(t),
      Icon: Bell,
    },
    {
      match: (t) => /playlist|favourite songs|\bsongs\b|music\b/.test(t),
      Icon: Music,
    },
    {
      match: (t) => /tools and resources/.test(t),
      Icon: BookOpen,
    },
    {
      match: (t) =>
        /referral links|website or shop|link to the artist|support links/.test(t),
      Icon: Link2,
    },
    { match: (t) => /guestbook messages|guestbook/.test(t), Icon: MessageSquare },
    {
      match: (t) =>
        /letters or messages|future letters|letters for|messages for the future/.test(t),
      Icon: Mail,
    },
    { match: (t) => /voice recordings|voice recording/.test(t), Icon: Mic },
    {
      match: (t) =>
        /photo archive|gallery of related|photo\/video uploads|trip photo/.test(t),
      Icon: Images,
    },
    {
      match: (t) =>
        /video|greeting from|reflection video|behind-the-scenes|video of the artwork/.test(
          t
        ),
      Icon: Video,
    },
    { match: (t) => /upload/.test(t), Icon: Upload },
    {
      match: (t) =>
        /family stories|across generations|family history|milestones|loved ones/.test(
          t
        ),
      Icon: Heart,
    },
    {
      match: (t) =>
        /local recommendations|restaurants|hotels|places visited|travel highlights/.test(
          t
        ),
      Icon: MapPin,
    },
    { match: (t) => /client journey recap|recap/.test(t), Icon: BookOpen },
    {
      match: (t) => /community connection|upcoming talks/.test(t),
      Icon: Users,
    },
    { match: (t) => /welcome message from parents|inspiration behind/.test(t), Icon: Heart },
    { match: (t) => /artist notes/.test(t), Icon: BookOpen },
  ];

  for (const { match, Icon } of rules) {
    if (match(s)) return Icon;
  }

  return BookOpen;
}
