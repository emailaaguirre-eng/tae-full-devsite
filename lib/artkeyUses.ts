export type ArtKeyUseEntry = {
  slug: string;
  category: string;
  title: string;
  description: string;
  features: string[];
};

/**
 * Ordered list: index matches carousel card order (1–9).
 */
export const ARTKEY_USES: ArtKeyUseEntry[] = [
  {
    slug: "birth-announcement",
    category: "Birth Announcement",
    title: "The First Chapter™",
    description:
      "An elevated birth announcement that becomes a living legacy/record/time capsule.",
    features: [
      "Welcome message from parents",
      "Birth story video",
      "Photo archive",
      "Guestbook messages for the child",
      "Future letters",
    ],
  },
  {
    slug: "realtor",
    category: "Realtor",
    title: "The Closing Moment",
    description: "A closing gift realtors use to welcome clients home.",
    features: [
      "Personal congratulations video",
      "Local recommendations",
      "Referral links",
    ],
  },
  {
    slug: "holiday-card",
    category: "Holiday Card",
    title: "Year In Review",
    description: "A Holiday Card that opens into the story of your year.",
    features: [
      "Personal video greeting",
      "Favourite songs playlist",
      "Travel highlights",
      "Best restaurants/hotels/places visited",
      "Guestbook messages",
    ],
  },
  {
    slug: "coaches",
    category: "Coaches",
    title: "Defining Moment",
    description: "A Visual designed for Coaches and the clients they guide.",
    features: [
      "Coach’s reflection video",
      "Client journey recap",
      "Tools and resources",
      "Continued support links",
      "Community connection",
    ],
  },
  {
    slug: "airbnb",
    category: "Airbnb",
    title: "The Experience",
    description: "A living postcard or print for your guests.",
    features: [
      "Welcome video from host",
      "Local recommendations",
      "Trip photo/video uploads for guest",
      "Guestbook messages",
      "Purchase button to send the postcard to their friends & family",
    ],
  },
  {
    slug: "public-figures-speakers",
    category: "Public Figures / Speakers",
    title: "The Living Poster",
    description: "A collectible poster that opens the story behind the stage.",
    features: [
      "Welcome video from the speaker",
      "Behind-the-scenes moments from the event",
      "Sponsor recognition and partner links",
      "Upcoming talks and appearances",
      "Community forum for attendees",
      "Stay connected for updates and releases",
    ],
  },
  {
    slug: "artists",
    category: "Artists",
    title: "The Creator Portal",
    description: "A gateway into the story behind the work.",
    features: [
      "Welcome video from the artist",
      "Video of the artwork being created",
      "Artist notes and inspiration behind the piece",
      "Gallery of related works",
      "Link to the artist’s website or shop",
      "Stay connected for future releases",
    ],
  },
  {
    slug: "wedding",
    category: "Wedding",
    title: "The Keepsake",
    description: "A living archive for your stories, memories & legacy.",
    features: [
      "Family stories and video messages",
      "Photo archive across generations",
      "Voice recordings from loved ones",
      "Family history and milestones",
      "Guestbook messages from friends and relatives",
      "Letters or messages for the future",
    ],
  },
  {
    slug: "travel",
    category: "Travel",
    title: "The Postcard",
    description: "A living postcard or print for your guests.",
    features: [
      "Welcome video",
      "Trip photo/video uploads",
      "Local recommendations",
      "Guestbook messages",
      "Purchase button to send the postcards",
      "Collectable dashboard in Portal with global map & location pins",
    ],
  },
];

const bySlug = new Map(ARTKEY_USES.map((e) => [e.slug, e]));

export function getArtKeyUseBySlug(slug: string): ArtKeyUseEntry | undefined {
  return bySlug.get(slug);
}

export function getAllArtKeyUseSlugs(): string[] {
  return ARTKEY_USES.map((e) => e.slug);
}
