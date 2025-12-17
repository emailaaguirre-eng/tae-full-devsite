import ArtKeyPortal from "@/components/ArtKeyPortal";
import type { Metadata } from "next";

// Prevent search engines from indexing demo URLs
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

// Dedicated demo page for sales purposes
// This loads the ArtKey with token 691e3d09ef58e from WordPress
export default function DemoArtKeyPage() {
  return <ArtKeyPortal token="691e3d09ef58e" />;
}
