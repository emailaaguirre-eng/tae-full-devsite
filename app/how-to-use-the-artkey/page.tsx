import type { Metadata } from "next";
import HowToUseTheArtKey from "@/components/HowToUseTheArtKey";

export const metadata: Metadata = {
  title: "How to Use the ArtKey\u2122 | The Artful Experience",
  description:
    "One scan changes everything. The most fun gift giving idea in the world—ArtKey™ portals for your art and cards.",
};

export default function HowToUseTheArtKeyPage() {
  return <HowToUseTheArtKey />;
}
