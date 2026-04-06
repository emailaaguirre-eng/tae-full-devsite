"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ErrorScreen,
  getButtonStyle,
  getPortalFavorites,
  LoadingScreen,
  safeFavoriteLinkHref,
  PortalScaffold,
  usePortal,
  type PortalFavorite,
} from "../_shared";

export default function PortalFavoritesPage() {
  const params = useParams();
  const token = params.token as string;
  const { portal, loading, error } = usePortal(token);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const favorites = useMemo(
    () => (portal ? getPortalFavorites(portal).slice(0, 6) : []),
    [portal]
  );

  if (loading) return <LoadingScreen />;
  if (error || !portal) return <ErrorScreen error={error || "Portal not found"} />;
  const btnStyle = getButtonStyle(portal.theme || {});

  return (
    <PortalScaffold token={token} portal={portal} pageTitle="Favorites">
      {!favorites.length ? (
        <div className="rounded-2xl bg-white/85 text-gray-900 p-4 text-sm">
          No favorites have been added yet.
        </div>
      ) : (
        <div className="space-y-4">
          {favorites.map((item: PortalFavorite, index: number) => {
            const imageKey = `${item.id}-${index}`;
            const hideImage = brokenImages[imageKey] === true;
            const thumb = item.thumbnailUrl?.trim();
            const titleTrim = (item.title || "").trim();
            const descTrim = (item.description || "").trim();
            const imageAlt = titleTrim || descTrim || "Favorite image";
            const visitHref = item.linkUrl ? safeFavoriteLinkHref(item.linkUrl) : "#";
            const showVisit = Boolean(item.linkUrl && visitHref !== "#");

            return (
              <article
                key={item.id || `${index}`}
                className="rounded-2xl bg-white/95 text-gray-900 shadow-md overflow-hidden"
              >
                {thumb && !hideImage ? (
                  <img
                    src={thumb}
                    alt={imageAlt}
                    className="w-full h-40 object-cover"
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                      setBrokenImages((prev) => ({ ...prev, [imageKey]: true }));
                    }}
                  />
                ) : null}
                <div className="p-4">
                  {item.title ? (
                    <h2 className="text-base font-semibold leading-snug break-words">{item.title}</h2>
                  ) : null}
                  {item.description ? (
                    <p
                      className={`text-sm text-gray-700 leading-relaxed break-words ${
                        item.title ? "mt-2" : ""
                      }`}
                    >
                      {item.description}
                    </p>
                  ) : null}
                  {showVisit ? (
                    <a
                      href={visitHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center mt-4 px-4 py-2.5 text-sm font-semibold transition-all"
                      style={btnStyle}
                    >
                      Visit
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </PortalScaffold>
  );
}
