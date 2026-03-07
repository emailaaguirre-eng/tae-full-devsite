"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ErrorScreen,
  getButtonStyle,
  getPortalFavorites,
  LoadingScreen,
  normalizeExternalUrl,
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
  const customLinks = portal.links || [];
  const uploadedVideos = Array.isArray(portal.uploadedVideos) ? portal.uploadedVideos : [];
  const featuredVideoUrl = portal.featuredVideo?.video_url || null;
  const favorites = getPortalFavorites(portal);
  const hasFavorites = favorites.length > 0;
  const rawFeatureDefs = Array.isArray(portal.customizations?.featureDefs)
    ? portal.customizations.featureDefs
    : [];

  let buttons =
    rawFeatureDefs.length > 0
      ? rawFeatureDefs
          .filter((f: any) => f?.enabled !== false)
          .map((f: any) => {
            if (f.type === "custom_link") {
              if (!features.enable_custom_links || !f.linkData) return null;
              const linkIndex = customLinks.findIndex(
                (link) => link.url === f.linkData.url && link.label === f.linkData.label
              );
              if (linkIndex < 0) return null;
              return {
                key: `${f.key}-${linkIndex}`,
                href: normalizeExternalUrl(f.linkData.url),
                label: f.label || f.linkData.label || `Link ${linkIndex + 1}`,
                isExternal: true,
              };
            }

            if (f.key === "gallery" && features.enable_gallery) {
              return { key: "gallery", href: `/art-key/${token}/gallery`, label: f.label || "Gallery" };
            }
            if (f.key === "video" && features.enable_video) {
              const videoButtons: Array<{ key: string; href: string; label: string }> = [];
              if (featuredVideoUrl) {
                videoButtons.push({
                  key: "video-featured",
                  href: `/art-key/${token}/video?v=featured`,
                  label: portal.featuredVideo?.button_label || f.label || "Featured Video",
                });
              }
              uploadedVideos.forEach((url: string, idx: number) => {
                if (!url || url === featuredVideoUrl) return;
                videoButtons.push({
                  key: `video-${idx}`,
                  href: `/art-key/${token}/video?v=${idx}`,
                  label:
                    !featuredVideoUrl && videoButtons.length === 0
                      ? portal.featuredVideo?.button_label || f.label || "Featured Video"
                      : `Video ${idx + 1}`,
                });
              });
              if (videoButtons.length === 0) {
                videoButtons.push({
                  key: "video",
                  href: `/art-key/${token}/video`,
                  label: portal.featuredVideo?.button_label || f.label || "Featured Video",
                });
              }
              return videoButtons;
            }
            if (f.key === "spotify" && features.enable_spotify) {
              return { key: "spotify", href: `/art-key/${token}/spotify`, label: f.label || "Listen" };
            }
            if (f.key === "guestbook" && features.show_guestbook) {
              return { key: "guestbook", href: `/art-key/${token}/guestbook`, label: f.label || "Guestbook" };
            }
            if (f.key === "favorites" && hasFavorites) {
              return { key: "favorites", href: `/art-key/${token}/favorites`, label: f.label || "Favorites" };
            }

            return null;
          })
          .flatMap((button: any) => (Array.isArray(button) ? button : button ? [button] : []))
      : [
          features.enable_gallery
            ? { key: "gallery", href: `/art-key/${token}/gallery`, label: "Gallery" }
            : null,
          ...(features.enable_video
            ? (() => {
                const videoButtons: Array<{ key: string; href: string; label: string }> = [];
                if (featuredVideoUrl) {
                  videoButtons.push({
                    key: "video-featured",
                    href: `/art-key/${token}/video?v=featured`,
                    label: portal.featuredVideo?.button_label || "Featured Video",
                  });
                }
                uploadedVideos.forEach((url: string, idx: number) => {
                  if (!url || url === featuredVideoUrl) return;
                  videoButtons.push({
                    key: `video-${idx}`,
                    href: `/art-key/${token}/video?v=${idx}`,
                    label:
                      !featuredVideoUrl && videoButtons.length === 0
                        ? portal.featuredVideo?.button_label || "Featured Video"
                        : `Video ${idx + 1}`,
                  });
                });
                if (videoButtons.length === 0) {
                  videoButtons.push({
                    key: "video",
                    href: `/art-key/${token}/video`,
                    label: portal.featuredVideo?.button_label || "Featured Video",
                  });
                }
                return videoButtons;
              })()
            : []),
          features.enable_spotify
            ? { key: "spotify", href: `/art-key/${token}/spotify`, label: "Listen" }
            : null,
          features.show_guestbook
            ? { key: "guestbook", href: `/art-key/${token}/guestbook`, label: "Guestbook" }
            : null,
          hasFavorites
            ? { key: "favorites", href: `/art-key/${token}/favorites`, label: "Favorites" }
            : null,
          ...(features.enable_custom_links
            ? customLinks.map((link, idx) => ({
                key: `${link.label}-${idx}`,
                href: normalizeExternalUrl(link.url),
                label: link.label || `Link ${idx + 1}`,
                isExternal: true,
              }))
            : []),
        ].flatMap((button: any) => (Array.isArray(button) ? button : button ? [button] : []));

  if (hasFavorites && !buttons.some((button: any) => button.key === "favorites")) {
    buttons = [...buttons, { key: "favorites", href: `/art-key/${token}/favorites`, label: "Favorites" }];
  }

  return (
    <PortalScaffold token={token} portal={portal} pageTitle="Portal Home">
      <div className="space-y-3">
        {buttons.map((button: any) =>
          button.isExternal ? (
            <a
              key={button.key}
              href={button.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-3.5 px-4 font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={btnStyle}
            >
              {button.label}
            </a>
          ) : (
            <Link
              key={button.key}
              href={button.href}
              className="block w-full text-center py-3.5 px-4 font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={btnStyle}
            >
              {button.label}
            </Link>
          )
        )}
      </div>
    </PortalScaffold>
  );
}
