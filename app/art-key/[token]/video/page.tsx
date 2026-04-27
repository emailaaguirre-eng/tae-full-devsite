"use client";
import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  ErrorScreen,
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

function VideoPlayer({
  source,
  title,
}: {
  source: string;
  title: string;
}) {
  const [showControls, setShowControls] = useState(false);
  const [videoUnavailable, setVideoUnavailable] = useState(false);

  const youtubeEmbed = toYoutubeEmbed(source);
  const directVideo = isDirectVideo(source);

  return (
    <div className="space-y-2">
      <div
        className="w-full rounded-xl overflow-hidden bg-black h-[calc(100dvh-320px)] min-h-[280px] max-h-[72dvh] sm:h-[62vh] sm:max-h-[520px]"
        onClick={() => setShowControls((v) => !v)}
      >
        {videoUnavailable ? (
          <div className="w-full h-full flex items-center justify-center px-6 text-center text-sm text-white/80">
            Video unavailable right now. Please try again later.
          </div>
        ) : directVideo ? (
          <video
            src={source}
            className="w-full h-full object-contain"
            autoPlay
            muted
            playsInline
            preload="metadata"
            controls={showControls}
            onError={() => setVideoUnavailable(true)}
            onCanPlay={() => setVideoUnavailable(false)}
          />
        ) : youtubeEmbed ? (
          <iframe
            src={youtubeEmbed}
            className="w-full h-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            title={title}
          />
        ) : (
          <video
            src={source}
            className="w-full h-full object-contain"
            autoPlay
            muted
            playsInline
            preload="metadata"
            controls={showControls}
            onError={() => setVideoUnavailable(true)}
            onCanPlay={() => setVideoUnavailable(false)}
          />
        )}
      </div>
      <p className="text-xs opacity-70 text-center text-white">
        Tap video area to toggle controls.
      </p>
    </div>
  );
}

export default function ArtKeyVideoPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const { portal, loading, error } = usePortal(token);
  const [selectedKey, setSelectedKey] = useState<string>("featured");

  const featuredVideoUrl = portal?.featuredVideo?.video_url || null;
  const uploadedVideos = Array.isArray(portal?.uploadedVideos) ? portal.uploadedVideos.filter(Boolean) : [];

  const allVideos = useMemo(() => {
    const list: Array<{ key: string; url: string; label: string; isFeatured: boolean; thumbnailUrl?: string }> = [];

    const featuredThumbnailUrl = uploadedVideos.reduce((found: string, item: any) => {
      if (found) return found;
      const normalized = typeof item === "string" ? { url: item } : item;
      return normalized?.url === featuredVideoUrl ? (normalized?.thumbnailUrl || "") : "";
    }, "");

    if (featuredVideoUrl) {
      list.push({
        key: "featured",
        url: featuredVideoUrl,
        thumbnailUrl: featuredThumbnailUrl || undefined,
        label: portal?.featuredVideo?.button_label || "Featured Video",
        isFeatured: true,
      });
    }

    uploadedVideos.forEach((item: any, idx: number) => {
      const normalized = typeof item === "string" ? { url: item } : item;
      const videoUrl = normalized?.url || "";
      const thumbnailUrl = normalized?.thumbnailUrl || "";
      if (!videoUrl || videoUrl === featuredVideoUrl) return;
      list.push({
        key: `video-${idx}`,
        url: videoUrl,
        thumbnailUrl,
        label: `Video ${list.length + 1}`,
        isFeatured: false,
      });
    });

    return list;
  }, [featuredVideoUrl, uploadedVideos, portal?.featuredVideo?.button_label]);

  const requested = searchParams.get("v");
  const selectedVideo = allVideos.find((video) => video.key === selectedKey) || allVideos[0];

  if (loading) return <LoadingScreen />;
  if (error || !portal) return <ErrorScreen error={error || "Portal not found"} />;

  if (requested === "featured" && featuredVideoUrl) {
    return (
      <PortalScaffold token={token} portal={portal} pageTitle="Featured Video">
        <VideoPlayer
          source={featuredVideoUrl}
          title={portal.featuredVideo?.button_label || "Featured Video"}
        />
      </PortalScaffold>
    );
  }

  if (allVideos.length === 0) {
    return (
      <PortalScaffold token={token} portal={portal} pageTitle="Videos">
        <div className="text-sm opacity-80 text-center py-10 text-white">No videos yet.</div>
      </PortalScaffold>
    );
  }

  return (
    <PortalScaffold token={token} portal={portal} pageTitle="Videos">
      <div className="space-y-4">
        <VideoPlayer source={selectedVideo.url} title={selectedVideo.label} />

        <div className="grid grid-cols-2 gap-3">
          {allVideos.map((video, idx) => (
            <button
              key={video.key}
              type="button"
              onClick={() => setSelectedKey(video.key)}
              className="rounded-xl border p-3 text-left transition-all"
              style={{
                borderColor: selectedVideo.key === video.key ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)",
                background: selectedVideo.key === video.key ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)",
                color: "#ffffff",
              }}
            >
              <div className="aspect-video w-full rounded-lg bg-black/60 flex items-center justify-center mb-2 text-2xl overflow-hidden">
                {video.thumbnailUrl ? (
                  <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  "🎥"
                )}
              </div>
              <div className="text-sm font-semibold">
                {video.isFeatured ? (portal.featuredVideo?.button_label || "Featured Video") : `Video ${idx + 1}`}
              </div>
            </button>
          ))}
        </div>
      </div>
    </PortalScaffold>
  );
}
