"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ErrorScreen,
  LoadingScreen,
  PortalScaffold,
  type PortalData,
  usePortal,
} from "../_shared";

function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url);
}

function toYoutubeEmbed(url: string): string | null {
  if (!url) return null;
  if (url.includes("youtube.com/watch?v=")) {
    let id: string | null = null;
    try {
      id = new URL(url).searchParams.get("v");
    } catch {
      return null;
    }
    if (!id) return null;
    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&playsinline=1&rel=0`;
  }
  if (url.includes("youtu.be/")) {
    const parts = url.split("youtu.be/");
    const id = parts[1]?.split(/[?&]/)[0];
    if (!id) return null;
    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&playsinline=1&rel=0`;
  }
  return null;
}

function resolveVideoSource(portal: PortalData, videoParam: string | null): string | null {
  const uploadedVideos = Array.isArray(portal.uploadedVideos) ? portal.uploadedVideos : [];

  if (videoParam === "featured") {
    return portal.featuredVideo?.video_url || uploadedVideos[0] || null;
  }

  if (videoParam && /^\d+$/.test(videoParam)) {
    const idx = Number(videoParam);
    if (idx >= 0 && idx < uploadedVideos.length) {
      return uploadedVideos[idx];
    }
  }

  return portal.featuredVideo?.video_url || uploadedVideos[0] || null;
}

export default function ArtKeyVideoPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const { portal, loading, error } = usePortal(token);
  const [showControls, setShowControls] = useState(false);

  if (loading) return <LoadingScreen />;
  if (error || !portal) return <ErrorScreen error={error || "Portal not found"} />;

  const source = resolveVideoSource(portal, searchParams.get("v"));
  if (!source) {
    return (
      <PortalScaffold token={token} portal={portal} pageTitle="Featured Video" backHref={`/art-key/${token}`}>
        <div className="text-sm opacity-80 text-center py-10 text-white">No featured video yet.</div>
      </PortalScaffold>
    );
  }

  const youtubeEmbed = toYoutubeEmbed(source);
  const directVideo = isDirectVideo(source);

  return (
    <PortalScaffold
      token={token}
      portal={portal}
      hideHeader
      contentClassName="max-w-none px-0 pb-0"
    >
      <div
        className="relative w-full overflow-hidden bg-black h-[100dvh]"
        onClick={() => setShowControls((v) => !v)}
      >
        <div
          className={`absolute top-4 left-4 z-20 transition-opacity ${
            showControls ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <Link
            href={`/art-key/${token}`}
            className="text-xs px-3 py-1.5 rounded-full bg-black/55 hover:bg-black/70 text-white backdrop-blur-sm transition-colors"
          >
            Back
          </Link>
        </div>
        {directVideo ? (
          <video
            src={source}
            className="w-full h-full object-contain"
            autoPlay
            muted
            playsInline
            controls={showControls}
          />
        ) : youtubeEmbed ? (
          <iframe
            src={youtubeEmbed}
            className="w-full h-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            src={source}
            className="w-full h-full object-contain"
            autoPlay
            muted
            playsInline
            controls={showControls}
          />
        )}
      </div>
      <p className="text-xs opacity-70 mt-2 text-center text-white pb-4">
        Tap video area to toggle controls.
      </p>
    </PortalScaffold>
  );
}
