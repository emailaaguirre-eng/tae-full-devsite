"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ErrorScreen,
  getPortalFavorites,
  getUrlDisplayFallback,
  LoadingScreen,
  normalizeExternalUrl,
  PortalScaffold,
  usePortal,
  type PortalFavoriteItem,
} from "../_shared";

type FavoriteMetadata = {
  title?: string;
  description?: string;
  image?: string;
};

function getFavoriteImage(item: PortalFavoriteItem, meta?: FavoriteMetadata): string | null {
  return item.image || item.thumbnail || item.imageUrl || meta?.image || null;
}

function getFavoriteTitle(item: PortalFavoriteItem, meta?: FavoriteMetadata): string {
  const title = item.title || meta?.title;
  return title?.trim() || getUrlDisplayFallback(item.url);
}

function getFavoriteDescription(item: PortalFavoriteItem, meta?: FavoriteMetadata): string {
  const description = item.description || item.writeup || meta?.description || "";
  return description.trim();
}

function getFavoriteButtonLabel(item: PortalFavoriteItem): string {
  const label = item.buttonLabel || item.button_label;
  return label?.trim() || "See More";
}

export default function PortalFavoritesPage() {
  const params = useParams();
  const token = params.token as string;
  const { portal, loading, error } = usePortal(token);
  const [metadataByUrl, setMetadataByUrl] = useState<Record<string, FavoriteMetadata>>({});
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const favorites = useMemo(
    () => (portal ? getPortalFavorites(portal).slice(0, 6) : []),
    [portal]
  );

  useEffect(() => {
    if (!favorites.length) return;

    const needsMetadata = favorites.filter((item) => {
      const hasTitle = !!item.title?.trim();
      const hasDescription = !!(item.description || item.writeup || "").trim();
      const hasImage = !!(item.image || item.thumbnail || item.imageUrl || "").trim();
      return !hasTitle || !hasDescription || !hasImage;
    });

    if (!needsMetadata.length) return;

    let cancelled = false;

    Promise.all(
      needsMetadata.map(async (item) => {
        const normalizedUrl = normalizeExternalUrl(item.url);
        if (!normalizedUrl || normalizedUrl === "#") return [item.url, {}] as const;
        try {
          const response = await fetch(
            `/api/portal/favorites/metadata?url=${encodeURIComponent(normalizedUrl)}`
          );
          if (!response.ok) return [item.url, {}] as const;
          const data = await response.json();
          return [item.url, (data?.data || {}) as FavoriteMetadata] as const;
        } catch {
          return [item.url, {}] as const;
        }
      })
    ).then((entries) => {
      if (cancelled) return;
      setMetadataByUrl((prev) => {
        const next = { ...prev };
        entries.forEach(([url, data]) => {
          next[url] = data;
        });
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [favorites]);

  if (loading) return <LoadingScreen />;
  if (error || !portal) return <ErrorScreen error={error || "Portal not found"} />;

  return (
    <PortalScaffold token={token} portal={portal} pageTitle="Favorites">
      {!favorites.length ? (
        <div className="rounded-2xl bg-white/85 text-gray-900 p-4 text-sm">
          No favorites have been added yet.
        </div>
      ) : (
        <div className="space-y-4">
          {favorites.map((item, index) => {
            const metadata = metadataByUrl[item.url];
            const image = getFavoriteImage(item, metadata);
            const title = getFavoriteTitle(item, metadata);
            const description = getFavoriteDescription(item, metadata);
            const href = normalizeExternalUrl(item.url);
            const buttonLabel = getFavoriteButtonLabel(item);
            const imageKey = `${item.url}-${index}`;
            const hideImage = brokenImages[imageKey] === true;

            return (
              <article
                key={`${item.url}-${index}`}
                className="rounded-2xl bg-white/95 text-gray-900 shadow-md overflow-hidden"
              >
                {image && !hideImage ? (
                  <img
                    src={image}
                    alt={title}
                    className="w-full h-40 object-cover"
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                      setBrokenImages((prev) => ({ ...prev, [imageKey]: true }));
                    }}
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-100 text-gray-500 text-xs flex items-center justify-center">
                    No image available
                  </div>
                )}
                <div className="p-4">
                  <h2 className="text-base font-semibold leading-snug break-words">{title}</h2>
                  {description ? (
                    <p className="text-sm text-gray-700 mt-2 leading-relaxed break-words">{description}</p>
                  ) : null}
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center mt-4 px-4 py-2.5 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-black transition-colors"
                  >
                    {buttonLabel}
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </PortalScaffold>
  );
}
