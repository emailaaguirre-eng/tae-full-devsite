import GalleryArtistClient from "./GalleryArtistClient";
import { resolveGalleryArtistForSlug } from "@/lib/gallery-artist-page-data";

export const dynamic = "force-dynamic";

export default async function ArtistDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const initialArtist = await resolveGalleryArtistForSlug(params.slug);
  return (
    <GalleryArtistClient key={params.slug} initialArtist={initialArtist} />
  );
}
