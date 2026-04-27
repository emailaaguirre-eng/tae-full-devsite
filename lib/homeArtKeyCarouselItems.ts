export type HomeArtKeyCarouselItem = {
  slug: string;
  label: string;
  href: string;
  image: string;
  top: string;
  title1: string;
  title2: string;
  body: string;
  rightAlign?: boolean;
};

export const HOME_ARTKEY_CAROUSEL_ITEMS: HomeArtKeyCarouselItem[] = [
  {
    slug: "public-figures-speakers",
    label: "Public Speakers",
    href: "/artkey-uses/public-figures-speakers",
    image: "https://theartfulexperience.com/wp-content/uploads/2026/04/Public-Speakers.png",
    top: "Public\nSpeakers",
    title1: "The Living",
    title2: "Poster",
    body: "A collectible poster that opens the story behind the stage",
  },
  {
    slug: "artists",
    label: "Artists",
    href: "/artkey-uses/artists",
    image: "https://theartfulexperience.com/wp-content/uploads/2026/04/Artists.png",
    top: "Artists",
    title1: "The Creator",
    title2: "Portal",
    body: "A gateway into the story behind the work",
  },
  {
    slug: "wedding",
    label: "Wedding",
    href: "/artkey-uses/wedding",
    image: "https://theartfulexperience.com/wp-content/uploads/2026/04/Wedding.png",
    top: "Wedding",
    title1: "The",
    title2: "Keepsake",
    body: "A living archive for your stories, memories, and legacy",
  },
  {
    slug: "travel",
    label: "Travel",
    href: "/artkey-uses/travel",
    image: "https://theartfulexperience.com/wp-content/uploads/2026/04/Travel.png",
    top: "Travel",
    title1: "The",
    title2: "Postcard",
    body: "A living postcard or print to memorialize your trip",
  },
  {
    slug: "birth-announcement",
    label: "Birth Announcement",
    href: "/artkey-uses/birth-announcement",
    image: "https://theartfulexperience.com/wp-content/uploads/2026/04/Birth-Announcement.png",
    top: "Birth\nAnnouncement",
    title1: "The First",
    title2: "Chapter",
    body: "An elevated birth announcement that becomes a living legacy",
  },
  {
    slug: "realtor",
    label: "Realtor",
    href: "/artkey-uses/realtor",
    image: "https://theartfulexperience.com/wp-content/uploads/2026/04/Realtor.png",
    top: "Realtor",
    title1: "The Closing",
    title2: "Moment",
    body: "A closing gift that keeps your presence long after the keys are handed over",
    rightAlign: true,
  },
  {
    slug: "holiday-card",
    label: "Holiday Card",
    href: "/artkey-uses/holiday-card",
    image: "https://theartfulexperience.com/wp-content/uploads/2026/04/HolidayCard.png",
    top: "Holiday\nCard",
    title1: "Year in",
    title2: "Review",
    body: "A holiday card that opens into the story of your year",
  },
  {
    slug: "coaches",
    label: "Coaches",
    href: "/artkey-uses/coaches",
    image: "https://theartfulexperience.com/wp-content/uploads/2026/04/Coaches.png",
    top: "Coaches",
    title1: "Defining",
    title2: "Moment",
    body: "A visual designed for coaches and the clients they guide",
  },
  {
    slug: "airbnb",
    label: "AirBnb",
    href: "/artkey-uses/airbnb",
    image: "https://theartfulexperience.com/wp-content/uploads/2026/04/AirBnb.png",
    top: "Airbnb",
    title1: "The",
    title2: "Experience",
    body: "A living postcard or print for your guests",
  },
];
