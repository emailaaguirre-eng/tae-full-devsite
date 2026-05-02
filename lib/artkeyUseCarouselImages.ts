/**
 * Imagery per `artkey-uses/[slug]`.
 *
 * **Home PhoneCarousel** uses `src` (and optional `objectPosition` → `bgPos` on cards).
 *
 * **`/artkey-uses/[slug]` hero** (`ArtKeyUseCasePage`): defaults to **`object-cover`** (fills the
 * panel; may crop). Set **`useCasePageObjectFit`: `"contain"`** to show the whole hero image with
 * letterboxing. Loads `useCasePageSrc` when set, otherwise `src`. Focal point is
 * `useCasePageObjectPosition`, else `objectPosition`, else {@link ARTKEY_USE_CAROUSEL_DEFAULT_OBJECT_POSITION}.
 */
export type ArtKeyUseCarouselImage = {
  /** Home PhoneCarousel (and use-case hero when `useCasePageSrc` is unset). */
  src: string;
  /** Focal point for the carousel image (`src`). Omitted → carousel uses `center`. */
  objectPosition?: string;
  /** When set, `/artkey-uses/[slug]` hero uses this URL instead of `src`. */
  useCasePageSrc?: string;
  /** When set, use-case page hero `objectPosition` (else `objectPosition`, then default). */
  useCasePageObjectPosition?: string;
  /** Use-case hero only: `"contain"` shows the full image in the panel (carousel unchanged). */
  useCasePageObjectFit?: "cover" | "contain";
};

/** Use-case hero fallback when neither `useCasePageObjectPosition` nor `objectPosition` is set. */
export const ARTKEY_USE_CAROUSEL_DEFAULT_OBJECT_POSITION = "center 44%";

export const ARTKEY_USE_CAROUSEL_IMAGE: Record<string, ArtKeyUseCarouselImage> = {
  "birth-announcement": {
    src: "https://theartfulexperience.com/wp-content/uploads/2026/04/Birth-Announcement.png",
    useCasePageSrc:
      "https://theartfulexperience.com/wp-content/uploads/2026/03/ChatGPT-Image-Mar-3-2026-11_38_18-AM.png",
    useCasePageObjectPosition: "center 38%",
  },
  "holiday-card": {
    src: "https://theartfulexperience.com/wp-content/uploads/2026/04/HolidayCard.png",
    /** Hero `object-cover`: bias toward top so the figure’s head isn’t clipped. */
    useCasePageObjectPosition: "center 22%",
  },
  graduate: {
    src: "https://theartfulexperience.com/wp-content/uploads/2026/04/graduate_1.jpg",
    /** Hero `object-cover`: nudge toward top vs `32%` so the cap edge stays in frame. */
    useCasePageObjectPosition: "center 29%",
  },
  airbnb: {
    src: "https://theartfulexperience.com/wp-content/uploads/2026/04/AirBnb.png",
  },
  artists: {
    src: "https://theartfulexperience.com/wp-content/uploads/2026/04/Artists.png",
    useCasePageSrc:
      "https://theartfulexperience.com/wp-content/uploads/2025/09/dlrdj.png",
    useCasePageObjectPosition: "center",
  },
  travel: {
    src: "https://theartfulexperience.com/wp-content/uploads/2026/04/morgan.jpg-1.jpeg",
    objectPosition: "center 70%",
    /** Hero only: less bottom bias than carousel so the subject’s head stays in frame. */
    useCasePageObjectPosition: "center 32%",
  },
  "public-figures-speakers": {
    src: "https://theartfulexperience.com/wp-content/uploads/2026/04/Public-Speakers.png",
    /** Hero only: bias down so the lower part of the art isn’t clipped (`object-cover`). */
    useCasePageObjectPosition: "center 62%",
  },
  realtor: {
    src: "https://theartfulexperience.com/wp-content/uploads/2026/04/Realtor.png",
    useCasePageSrc:
      "https://theartfulexperience.com/wp-content/uploads/2026/03/95D9AC06-4693-4E63-8FE1-2E5FDC7B3ED7.png",
    /** Show full portrait in the hero; swap `useCasePageSrc` when you have a wider replacement. */
    useCasePageObjectFit: "contain",
    useCasePageObjectPosition: "center",
  },
  coaches: {
    src: "https://theartfulexperience.com/wp-content/uploads/2026/04/Coaches.png",
    useCasePageSrc:
      "https://theartfulexperience.com/wp-content/uploads/2026/03/310956EA-15BF-435E-AC30-16D12EF51BFC.png",
    useCasePageObjectPosition: "center 32%",
  },
  wedding: {
    src: "https://theartfulexperience.com/wp-content/uploads/2026/04/Wedding.png",
    useCasePageSrc:
      "https://theartfulexperience.com/wp-content/uploads/2025/06/9a1a8f96-401b-11f0-bfb1-0242ac110002-Wedding_PortraitBetter-resolution-if-possible-IhR8etUA-low_resolution_v2-4x-scaled.jpg",
  },
};

export function getArtKeyUseCarouselImage(
  slug: string
): ArtKeyUseCarouselImage | undefined {
  return ARTKEY_USE_CAROUSEL_IMAGE[slug];
}
