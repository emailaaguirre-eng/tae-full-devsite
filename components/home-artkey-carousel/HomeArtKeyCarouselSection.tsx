import { HOME_ARTKEY_CAROUSEL_ITEMS } from "@/lib/homeArtKeyCarouselItems";
import type { HomeArtKeyCarouselVariant } from "./types";
import { HomeArtKeyCarousel3D } from "./variants/HomeArtKeyCarousel3D";
import { HomeArtKeyCarouselFrame } from "./variants/HomeArtKeyCarouselFrame";
import { HomeArtKeyCarouselPhone } from "./variants/HomeArtKeyCarouselPhone";

/** Temporary switch; swap variant without touching card data. */
const ACTIVE_VARIANT: HomeArtKeyCarouselVariant = "3d";

export function HomeArtKeyCarouselSection() {
  const items = HOME_ARTKEY_CAROUSEL_ITEMS;

  let carousel;
  switch (ACTIVE_VARIANT) {
    case "phone":
      carousel = <HomeArtKeyCarouselPhone items={items} />;
      break;
    case "frame":
      carousel = <HomeArtKeyCarouselFrame items={items} />;
      break;
    case "3d":
    default:
      carousel = <HomeArtKeyCarousel3D items={items} />;
      break;
  }

  return (
    <section
      aria-labelledby="artkey-uses-heading"
      style={{
        paddingTop: "20px",
        paddingBottom: "28px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 24px 18px",
          textAlign: "center",
        }}
      >
        <h2
          id="artkey-uses-heading"
          style={{
            margin: 0,
            color: "#141414",
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: "clamp(2.25rem, 4vw, 3.25rem)",
            lineHeight: 1.08,
            fontWeight: 400,
            letterSpacing: "0",
          }}
        >
          Ways to use your ArtKey
        </h2>
      </div>

      {carousel}
    </section>
  );
}
