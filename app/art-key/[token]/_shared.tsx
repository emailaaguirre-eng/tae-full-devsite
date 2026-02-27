"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ElegantIcon, type ElegantIconKey } from "@/components/artkey/ElegantIcons";

export interface PortalData {
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
    button_style?: string;
  };
  features: {
    enable_gallery?: boolean;
    enable_video?: boolean;
    show_guestbook?: boolean;
    enable_custom_links?: boolean;
    enable_spotify?: boolean;
  };
  links: { label: string; url: string }[];
  spotify: { url: string; autoplay?: boolean };
  featuredVideo: { video_url: string; button_label: string } | null;
  customizations?: Record<string, any>;
  uploadedImages: string[];
  uploadedVideos: string[];
  signedGalleryPreviewUrls?: string[];
  signedBackgroundPreviewUrl?: string | null;
  guestbook: { id: string; name: string; message: string; createdAt: string }[];
  media: { id: string; type: string; url: string; caption?: string }[];
}

export function usePortal(token: string) {
  const [portal, setPortal] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/portal/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setPortal(data.data);
        else setError(data.error || "Portal not found");
      })
      .catch(() => setError("Failed to load portal"))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    const font = portal?.theme?.font;
    if (font && font.startsWith("g:")) {
      const fontName = font.replace("g:", "").replace(/\s+/g, "+");
      const linkId = `gf-${fontName}`;
      if (typeof window !== "undefined" && !document.getElementById(linkId)) {
        const link = document.createElement("link");
        link.id = linkId;
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;600;700&display=swap`;
        document.head.appendChild(link);
      }
    }
  }, [portal?.theme?.font]);

  return { portal, loading, error };
}

export function parseFontFamily(fontValue?: string): string {
  if (!fontValue) return "Inter, sans-serif";
  if (fontValue.startsWith("g:")) return `"${fontValue.replace("g:", "")}", sans-serif`;
  if (fontValue === "system") return '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  if (fontValue === "serif") return 'Georgia, "Times New Roman", serif';
  return fontValue;
}

function getButtonTextColor(bgColor: string): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(bgColor)) return "#ffffff";
  const r = parseInt(bgColor.slice(1, 3), 16);
  const g = parseInt(bgColor.slice(3, 5), 16);
  const b = parseInt(bgColor.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? "#111111" : "#ffffff";
}

export function getButtonStyle(theme: PortalData["theme"]): React.CSSProperties {
  const buttonColor = theme.button_color || "#3b82f6";
  const buttonShape = theme.button_shape || "pill";
  const buttonStyle = theme.button_style || "solid";
  const buttonBorderRadius =
    buttonShape === "square" ? "0px" : buttonShape === "rounded" ? "8px" : "9999px";

  const base: React.CSSProperties = { borderRadius: buttonBorderRadius };
  if (buttonStyle === "outline") {
    return {
      ...base,
      backgroundColor: "transparent",
      border: `2px solid ${buttonColor}`,
      color: buttonColor,
    };
  }
  if (buttonStyle === "glass") {
    return {
      ...base,
      backgroundColor: `${buttonColor}33`,
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: `1px solid ${buttonColor}66`,
      color: "#ffffff",
    };
  }
  if (theme.button_gradient) {
    return {
      ...base,
      background: theme.button_gradient,
      color: /^#[0-9a-fA-F]{6}$/.test(buttonColor) ? getButtonTextColor(buttonColor) : "#ffffff",
    };
  }
  return { ...base, backgroundColor: buttonColor, color: getButtonTextColor(buttonColor) };
}

export function getGalleryImages(portal: PortalData): string[] {
  return [
    ...portal.uploadedImages,
    ...portal.media.filter((m) => m.type === "image").map((m) => m.url),
  ];
}

function toPortalPreviewUrl(token: string, src?: string | null): string | null {
  if (!src) return null;
  return `/api/portal/${token}/preview?src=${encodeURIComponent(src)}`;
}

export function getVideoSource(portal: PortalData): string | null {
  return portal.featuredVideo?.video_url || portal.uploadedVideos[0] || null;
}

export function PortalScaffold({
  token,
  portal,
  pageTitle,
  backHref,
  showBackButton,
  hideHeader,
  contentClassName,
  children,
}: {
  token: string;
  portal: PortalData;
  pageTitle?: string;
  backHref?: string;
  showBackButton?: boolean;
  hideHeader?: boolean;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  const theme = portal.theme || {};
  const textColor = theme.text_color || "#ffffff";
  const titleColor = theme.title_color || "#ffffff";
  const buttonColor = theme.button_color || "#3b82f6";
  const previewBg = portal.signedBackgroundPreviewUrl || toPortalPreviewUrl(token, theme.bg_image_url);
  const shouldShowBack =
    showBackButton ?? (!!pageTitle && pageTitle.toLowerCase() !== "portal home");

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center"
      style={{
        backgroundColor: theme.bg_color || "#1a1a2e",
        backgroundImage: previewBg ? `url(${previewBg})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        fontFamily: parseFontFamily(theme.font),
      }}
    >
      {!hideHeader && (
        <div className="w-full max-w-md px-5 pt-6 pb-4 text-center">
          <div className="mb-2 flex items-center justify-between">
            <div className="w-16 text-left">
              {shouldShowBack && (
                <Link
                  href={backHref || `/art-key/${token}`}
                  className="text-xs px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  style={{ color: textColor }}
                >
                  Back
                </Link>
              )}
            </div>
            <div className="w-16" />
          </div>
          {theme.header_icon && theme.header_icon !== "none" && (
            <div className="mb-3 flex justify-center">
              <ElegantIcon icon={theme.header_icon as ElegantIconKey} size={42} color={titleColor} />
            </div>
          )}
          <h1
            className="text-2xl font-bold mb-1"
            style={
              theme.title_style === "gradient"
                ? {
                    background: `linear-gradient(135deg, ${titleColor}, ${buttonColor})`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }
                : { color: titleColor }
            }
          >
            {portal.title}
          </h1>
          {pageTitle && (
            <p className="text-xs uppercase tracking-wider opacity-70" style={{ color: textColor }}>
              {pageTitle}
            </p>
          )}
        </div>
      )}
      <div className={`w-full ${contentClassName || "max-w-md px-6 pb-12"}`}>{children}</div>
    </div>
  );
}

export function getProtectedGalleryImages(portal: PortalData, token: string): string[] {
  if (portal.signedGalleryPreviewUrls?.length) {
    return portal.signedGalleryPreviewUrls.filter((src): src is string => !!src);
  }
  return getGalleryImages(portal)
    .map((src) => toPortalPreviewUrl(token, src))
    .filter((src): src is string => !!src);
}

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="animate-pulse text-white text-lg">Loading...</div>
    </div>
  );
}

export function ErrorScreen({ error }: { error: string }) {
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
