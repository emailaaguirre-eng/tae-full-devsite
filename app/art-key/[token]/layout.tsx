import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "ArtKey Portal",
  description:
    "A personal digital experience — images, videos, links, guestbook, and more.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ArtKey Portal",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1a2e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function ArtKeyPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
