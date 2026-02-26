\"use client\";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ErrorScreen,
  getButtonStyle,
  getGalleryImages,
  getVideoSource,
  LoadingScreen,
  PortalScaffold,
  usePortal,
} from "./_shared";

export default function ArtKeyPortalPage() {
  const params = useParams();
  const token = params.token as string;
  const { portal, loading, error } = usePortal(token);
  if (loading) return <LoadingScreen />;
  if (error || !portal) return <ErrorScreen error={error || "Portal not found"} />;

  const theme = portal.theme || {};
  const features = portal.features || {};
  const btnStyle = getButtonStyle(theme);
  const galleryImages = getGalleryImages(portal);
  const videoSource = getVideoSource(portal);
  const hasSpotify = !!portal.spotify?.url && features.enable_spotify;
  const customLinks = features.enable_custom_links ? portal.links : [];

  return (
    <PortalScaffold token={token} portal={portal} pageTitle="Portal Home">
      <div className="space-y-3">
        {features.enable_gallery && galleryImages.length > 0 && (
          <Link
            href={`/art-key/${token}/gallery`}
            className="block w-full text-center py-3.5 px-4 font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={btnStyle}
          >
            Gallery
          </Link>
        )}
        {features.enable_video && videoSource && (
          <Link
            href={`/art-key/${token}/video`}
            className="block w-full text-center py-3.5 px-4 font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={btnStyle}
          >
            {portal.featuredVideo?.button_label || "Featured Video"}
          </Link>
        )}
        {hasSpotify && (
          <Link
            href={`/art-key/${token}/spotify`}
            className="block w-full text-center py-3.5 px-4 font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={btnStyle}
          >
            Listen
          </Link>
        )}
        {features.show_guestbook && (
          <Link
            href={`/art-key/${token}/guestbook`}
            className="block w-full text-center py-3.5 px-4 font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={btnStyle}
          >
            Guestbook
          </Link>
        )}
        {customLinks.map((link, idx) => (
          <Link
            key={`${link.label}-${idx}`}
            href={`/art-key/${token}/link/${idx}`}
            className="block w-full text-center py-3.5 px-4 font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={btnStyle}
          >
            {link.label || `Link ${idx + 1}`}
          </Link>
        ))}
      </div>
    </PortalScaffold>
  );
}
