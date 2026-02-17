import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ArtKey Portal — Host Login",
  description: "Access your ArtKey portal to manage your digital experience.",
};

export default function ArtKeyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
