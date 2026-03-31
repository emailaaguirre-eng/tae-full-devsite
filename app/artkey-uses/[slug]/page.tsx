import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ArtKeyUseCasePage from "@/components/ArtKeyUseCasePage";
import { getArtKeyUseBySlug, getAllArtKeyUseSlugs } from "@/lib/artkeyUses";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return getAllArtKeyUseSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const entry = getArtKeyUseBySlug(params.slug);
  if (!entry) return { title: "Not found" };
  return {
    title: `${entry.title} | The Artful Experience`,
    description: entry.description,
  };
}

export default function ArtKeyUseSlugPage({ params }: Props) {
  const entry = getArtKeyUseBySlug(params.slug);
  if (!entry) notFound();
  return <ArtKeyUseCasePage entry={entry} />;
}
