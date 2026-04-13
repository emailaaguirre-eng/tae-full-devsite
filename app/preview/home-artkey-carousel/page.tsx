import type { Metadata } from "next";
import { HomeArtKeyCarouselSection } from "@/components/home-artkey-carousel/HomeArtKeyCarouselSection";

export const metadata: Metadata = {
  title: "Preview: Home ArtKey carousel",
  robots: { index: false, follow: false },
};

export default function HomeArtKeyCarouselPreviewPage() {
  return (
    <main style={{ minHeight: "100vh" }}>
      <HomeArtKeyCarouselSection />
    </main>
  );
}
