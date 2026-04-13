import portalButtons, { PortalButton } from "../artkey-portal/buttonConfig";

export type { PortalButton as PhoneButton };

export interface FeaturedVideo {
  label: string;
}

export interface Creator {
  id: string;
  eyebrow: string;
  name: string;
  role: string;
  bio: string[];
  bioBold: string | null;
  photo: string;
  posterImage: string;
  posterTitle: string;
  posterSubtitle: string;
  artKeyTitle: string;
  phoneButtons: PortalButton[];
  featuredMedia: FeaturedVideo[];
  sponsor: {
    name: string;
    logoUrl?: string;
    placeholder: boolean;
  };
  ctaHeading: string;
  ctaSubtext: string;
  ctaLabel: string;
}

export const creators: Creator[] = [
  {
    id: "kimber-cross",
    eyebrow: "A Story Worth Unlocking",
    name: "Kimber Cross",
    role: "Adaptive Alpine Climber | Athlete | Educator",
    bio: [
      "Kimber Cross is an adaptive alpine and ice climber based in Tacoma, Washington whose motto says everything: can't. will. did.",
      "Born with one hand, Kimber has pushed the limits of what's possible in the mountains, summiting Mount Rainier six times, climbing technical ice routes with a prosthetic tool, and training for classic alpine objectives in Alaska.",
      "She is an educator, athlete, and advocate who proves that the boundaries we believe in are often the ones waiting to be rewritten.",
    ],
    bioBold: "can't. will. did.",
    photo:
      "https://theartfulexperience.com/wp-content/uploads/2026/04/kimbercross-scaled.jpeg",
    posterImage:
      "https://theartfulexperience.com/wp-content/uploads/2026/04/Cant.-Will.-Did.png",
    posterTitle: "The Living Poster",
    posterSubtitle: "A collectible poster that opens the story behind the climb.",
    artKeyTitle: "Kimber's ArtKey",
    phoneButtons: portalButtons,
    featuredMedia: [
      { label: "Play Video" },
      { label: "Making the Art" },
    ],
    sponsor: {
      name: "Coming Soon",
      placeholder: true,
    },
    ctaHeading: "Unlock Kimber's Story",
    ctaSubtext:
      "Get your ArtKey poster and access the full experience: gallery, video, playlist, and more.",
    ctaLabel: "Purchase the Poster",
  },
  {
    id: "maya-torres",
    eyebrow: "Art as Language",
    name: "Maya Torres",
    role: "Visual Artist | Painter | Community Educator",
    bio: [
      "Maya Torres is a Chicana muralist and fine artist based in East Los Angeles whose work bridges the ancient and the contemporary.",
      "Her paintings draw from pre-Columbian iconography, street culture, and the lived experiences of her community — transforming blank walls into conversations that can't be ignored.",
      "Through The ArtKey, Maya's work becomes a portal: scan the poster, unlock the story, hear her voice.",
    ],
    bioBold: null,
    photo: "",
    posterImage: "",
    posterTitle: "The Living Poster",
    posterSubtitle: "A collectible print that opens the story behind the mural.",
    artKeyTitle: "Maya's ArtKey",
    phoneButtons: portalButtons,
    featuredMedia: [
      { label: "Play Studio Tour" },
      { label: "Making the Mural" },
    ],
    sponsor: {
      name: "Coming Soon",
      placeholder: true,
    },
    ctaHeading: "Unlock Maya's Story",
    ctaSubtext:
      "Get your ArtKey poster and access the full experience: gallery, video, playlist, and more.",
    ctaLabel: "Purchase the Poster",
  },
  {
    id: "james-okoro",
    eyebrow: "Every Frame a Story",
    name: "James Okoro",
    role: "Documentary Filmmaker | Storyteller | Photographer",
    bio: [
      "James Okoro is a documentary filmmaker from Lagos and Brooklyn whose lens captures the dignified complexity of people the world often overlooks.",
      "His debut short film premiered at Tribeca, and his photography has appeared in Time, National Geographic, and The New York Times Magazine.",
      "James believes the most powerful stories are the ones already happening — they just need someone willing to stay long enough to see them.",
    ],
    bioBold: null,
    photo: "",
    posterImage: "",
    posterTitle: "The Living Poster",
    posterSubtitle: "A collectible print that opens the stories behind the lens.",
    artKeyTitle: "James's ArtKey",
    phoneButtons: portalButtons,
    featuredMedia: [
      { label: "Play Tribeca Short" },
      { label: "Behind the Lens" },
    ],
    sponsor: {
      name: "Coming Soon",
      placeholder: true,
    },
    ctaHeading: "Unlock James's Story",
    ctaSubtext:
      "Get your ArtKey poster and access the full experience: gallery, video, playlist, and more.",
    ctaLabel: "Purchase the Poster",
  },
];
