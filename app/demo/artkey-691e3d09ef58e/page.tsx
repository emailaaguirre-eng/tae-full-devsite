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
// The token is extracted from: https://theartfulexperience.com/art-key/artkey-session-691e3d09ef58e/
export default function DemoArtKeyPage() {
  return <ArtKeyPortal token="691e3d09ef58e" />;
}
