import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ArtKey Portal — Host Login",
  description: "Access your ArtKey portal to manage your digital experience.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-snippet": -1,
      "max-image-preview": "none",
      "max-video-preview": -1,
    },
  },
};

export default function ArtKeyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
