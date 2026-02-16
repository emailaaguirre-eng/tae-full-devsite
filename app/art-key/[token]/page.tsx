"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface PortalData {
  id: string;
  publicToken: string;
  title: string;
  theme: {
    bg_color?: string;
    bg_image_url?: string;
    font?: string;
    text_color?: string;
    title_color?: string;
    title_style?: string;
    button_color?: string;
    button_gradient?: string;
    header_icon?: string;
    button_shape?: string;
  };
  features: {
    enable_gallery?: boolean;
    enable_video?: boolean;
    show_guestbook?: boolean;
    enable_custom_links?: boolean;
    enable_spotify?: boolean;
    order?: string[];
  };
  links: { label: string; url: string }[];
  spotify: { url: string; autoplay?: boolean };
  featuredVideo: { video_url: string; button_label: string } | null;
  uploadedImages: string[];
  uploadedVideos: string[];
  guestbook: { id: string; name: string; message: string; createdAt: string }[];
  media: { id: string; type: string; url: string; caption?: string }[];
}

export default function ArtKeyPortalPage() {
  const params = useParams();
  const token = params.token as string;

  const [portal, setPortal] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Guestbook form
  const [gbName, setGbName] = useState("");
  const [gbMessage, setGbMessage] = useState("");
  const [gbSubmitting, setGbSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/portal/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setPortal(data.data);
        } else {
          setError(data.error || "Portal not found");
        }
      })
      .catch(() => setError("Failed to load portal"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-pulse text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (error || !portal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-3">Portal Not Found</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link href="/" className="text-blue-400 underline">
            Go to theAE
          </Link>
        </div>
      </div>
    );
  }

  const theme = portal.theme || {};
  const features = portal.features || {};
  const bgColor = theme.bg_color || "#1a1a2e";
  const textColor = theme.text_color || "#ffffff";
  const titleColor = theme.title_color || "#ffffff";
  const buttonColor = theme.button_color || "#3b82f6";
  const sectionOrder = features.order || [
    "links",
    "gallery",
    "video",
    "spotify",
    "guestbook",
  ];

  const [gbSuccess, setGbSuccess] = useState<string | null>(null);

  const handleGuestbookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gbName.trim() || !gbMessage.trim()) return;
    setGbSubmitting(true);
    setGbSuccess(null);
    try {
      const res = await fetch(`/api/portal/${token}/guestbook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: gbName.trim(),
          message: gbMessage.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGbSuccess(data.message);
        setGbName("");
        setGbMessage("");
      }
    } catch {
      setGbSuccess("Something went wrong. Please try again.");
    } finally {
      setGbSubmitting(false);
    }
  };

  // Render sections in the configured order
  const renderSection = (sectionKey: string) => {
    switch (sectionKey) {
      case "links":
        if (!features.enable_custom_links || portal.links.length === 0)
          return null;
        return (
          <div key="links" className="space-y-3 mb-8">
            {portal.links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-3.5 px-4 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: buttonColor,
                  color: "#ffffff",
                }}
              >
                {link.label}
              </a>
            ))}
          </div>
        );

      case "gallery":
        if (!features.enable_gallery) return null;
        const images = [
          ...portal.uploadedImages,
          ...portal.media.filter((m) => m.type === "image").map((m) => m.url),
        ];
        if (images.length === 0) return null;
        return (
          <div key="gallery" className="mb-8">
            <h3
              className="text-sm font-semibold uppercase tracking-wider mb-4 opacity-70"
              style={{ color: textColor }}
            >
              Gallery
            </h3>
            <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden">
              {images.map((src, i) => (
                <div
                  key={i}
                  className="aspect-square bg-black/20 overflow-hidden"
                >
                  <img
                    src={src}
                    alt={`Gallery ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case "video":
        if (!features.enable_video || !portal.featuredVideo?.video_url)
          return null;
        return (
          <div key="video" className="mb-8">
            <h3
              className="text-sm font-semibold uppercase tracking-wider mb-4 opacity-70"
              style={{ color: textColor }}
            >
              Featured Video
            </h3>
            <div className="aspect-video rounded-xl overflow-hidden bg-black/20">
              <iframe
                src={portal.featuredVideo.video_url.replace(
                  "watch?v=",
                  "embed/"
                )}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        );

      case "spotify":
        if (!features.enable_spotify || !portal.spotify?.url) return null;
        const spotifyEmbed = portal.spotify.url
          .replace("open.spotify.com/", "open.spotify.com/embed/")
          .split("?")[0];
        return (
          <div key="spotify" className="mb-8">
            <h3
              className="text-sm font-semibold uppercase tracking-wider mb-4 opacity-70"
              style={{ color: textColor }}
            >
              Listen
            </h3>
            <div className="rounded-xl overflow-hidden">
              <iframe
                src={`${spotifyEmbed}?theme=0`}
                width="100%"
                height="152"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="rounded-xl"
              />
            </div>
          </div>
        );

      case "guestbook":
        if (!features.show_guestbook) return null;
        return (
          <div key="guestbook" className="mb-8">
            <h3
              className="text-sm font-semibold uppercase tracking-wider mb-4 opacity-70"
              style={{ color: textColor }}
            >
              Guestbook
            </h3>

            {/* Existing entries */}
            {portal.guestbook.length > 0 && (
              <div className="space-y-3 mb-6">
                {portal.guestbook.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
                  >
                    <p className="text-sm" style={{ color: textColor }}>
                      {entry.message}
                    </p>
                    <p className="text-xs mt-2 opacity-50" style={{ color: textColor }}>
                      &mdash; {entry.name}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Sign form */}
            {gbSuccess && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 text-sm mb-4" style={{ color: textColor }}>
                {gbSuccess}
              </div>
            )}
            <form onSubmit={handleGuestbookSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Your name"
                value={gbName}
                onChange={(e) => setGbName(e.target.value)}
                required
                className="w-full bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 text-sm placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-white/20"
                style={{ color: textColor }}
              />
              <textarea
                placeholder="Leave a message..."
                value={gbMessage}
                onChange={(e) => setGbMessage(e.target.value)}
                required
                rows={3}
                className="w-full bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 text-sm placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
                style={{ color: textColor }}
              />
              <button
                type="submit"
                disabled={gbSubmitting}
                className="w-full py-3 rounded-lg font-semibold text-sm transition-all disabled:opacity-50"
                style={{ backgroundColor: buttonColor, color: "#ffffff" }}
              >
                {gbSubmitting ? "Submitting..." : "Sign Guestbook"}
              </button>
            </form>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center"
      style={{
        backgroundColor: bgColor,
        backgroundImage: theme.bg_image_url
          ? `url(${theme.bg_image_url})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        fontFamily: theme.font || "Inter, sans-serif",
      }}
    >
      {/* Header */}
      <div className="w-full max-w-md px-6 pt-12 pb-6 text-center">
        {theme.header_icon && (
          <div className="text-4xl mb-4">{theme.header_icon}</div>
        )}
        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: titleColor }}
        >
          {portal.title}
        </h1>
        <div
          className="w-12 h-0.5 mx-auto rounded-full opacity-30"
          style={{ backgroundColor: textColor }}
        />
      </div>

      {/* Content */}
      <div className="w-full max-w-md px-6 pb-12">
        {sectionOrder.map(renderSection)}
      </div>

      {/* Footer */}
      <div className="mt-auto py-6 text-center">
        <p className="text-[10px] opacity-30" style={{ color: textColor }}>
          Powered by{" "}
          <a
            href="https://theartfulexperience.com"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            The Artful Experience
          </a>
        </p>
      </div>
    </div>
  );
}
