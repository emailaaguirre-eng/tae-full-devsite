"use client";

import { useParams } from "next/navigation";
import {
  ErrorScreen,
  LoadingScreen,
  PortalScaffold,
  usePortal,
} from "../_shared";

export default function ArtKeySpotifyPage() {
  const params = useParams();
  const token = params.token as string;
  const { portal, loading, error } = usePortal(token);

  if (loading) return <LoadingScreen />;
  if (error || !portal) return <ErrorScreen error={error || "Portal not found"} />;

  const spotifyUrl = portal.spotify?.url || "";
  if (!spotifyUrl) {
    return (
      <PortalScaffold token={token} portal={portal} pageTitle="Listen">
        <div className="text-sm opacity-80 text-center py-10 text-white">No Spotify content yet.</div>
      </PortalScaffold>
    );
  }

  const spotifyEmbed = spotifyUrl
    .replace("open.spotify.com/", "open.spotify.com/embed/")
    .split("?")[0];

  return (
    <PortalScaffold token={token} portal={portal} pageTitle="Listen">
      <div className="rounded-xl overflow-hidden">
        <iframe
          src={`${spotifyEmbed}?theme=0`}
          width="100%"
          height="352"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded-xl"
        />
      </div>
    </PortalScaffold>
  );
}
