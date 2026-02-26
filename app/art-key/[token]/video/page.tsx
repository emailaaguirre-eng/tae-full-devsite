"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ErrorScreen,
  getVideoSource,
  LoadingScreen,
  PortalScaffold,
  usePortal,
} from "../_shared";

function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url);
}

function toYoutubeEmbed(url: string): string | null {
  if (!url) return null;
  if (url.includes("youtube.com/watch?v=")) {
    const id = new URL(url).searchParams.get("v");
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

export default function ArtKeyVideoPage() {
  const params = useParams();
  const token = params.token as string;
  const { portal, loading, error } = usePortal(token);
  const [showControls, setShowControls] = useState(false);

  if (loading) return <LoadingScreen />;
  if (error || !portal) return <ErrorScreen error={error || "Portal not found"} />;

  const source = getVideoSource(portal);
  if (!source) {
    return (
      <PortalScaffold token={token} portal={portal} pageTitle="Featured Video">
        <div className="text-sm opacity-80 text-center py-10 text-white">No featured video yet.</div>
      </PortalScaffold>
    );
  }

  const youtubeEmbed = useMemo(() => toYoutubeEmbed(source), [source]);
  const directVideo = isDirectVideo(source);

  return (
    <PortalScaffold token={token} portal={portal} pageTitle="Featured Video">
      <div
        className="w-full rounded-xl overflow-hidden bg-black"
        onClick={() => setShowControls((v) => !v)}
      >
        {directVideo ? (
          <video
            src={source}
            className="w-full h-auto max-h-[72vh] object-contain"
            autoPlay
            muted
            playsInline
            controls={showControls}
          />
        ) : youtubeEmbed ? (
          <iframe
            src={youtubeEmbed}
            className="w-full h-[62vh] max-h-[520px]"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            src={source}
            className="w-full h-auto max-h-[72vh] object-contain"
            autoPlay
            muted
            playsInline
            controls={showControls}
          />
        )}
      </div>
      <p className="text-xs opacity-70 mt-2 text-center text-white">
        Tap video area to toggle controls.
      </p>
    </PortalScaffold>
  );
}
