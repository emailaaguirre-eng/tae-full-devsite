import type { Metadata } from "next";
import { ArtKeyBuilderPrototype } from "@/components/artkey/builder/ArtKeyBuilderPrototype";

export const metadata: Metadata = {
  title: "ArtKey Portal Builder (Prototype) | Preview",
  description:
    "Local-only ArtKey Portal Builder UI prototype. Not connected to live portals.",
  robots: { index: false, follow: false },
};

export default function ArtKeyBuilderPreviewPage() {
  return <ArtKeyBuilderPrototype />;
}
