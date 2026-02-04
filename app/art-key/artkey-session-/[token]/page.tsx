import ArtKeyPortal from "@/components/ArtKeyPortal";
import type { Metadata } from "next";

// Prevent search engines from indexing ArtKey portal URLs
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'none',
      'max-snippet': -1,
    },
  },
};

// Support the exact URL format from marketing materials
// https://theartfulexperience.com/art-key/artkey-session-691e3d09ef58e/
export default async function ArtKeySessionPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  // Token will be "691e3d09ef58e" from the URL /art-key/artkey-session-691e3d09ef58e
  return <ArtKeyPortal token={token} />;
}
