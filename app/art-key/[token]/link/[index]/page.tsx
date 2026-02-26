"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ErrorScreen,
  getButtonStyle,
  LoadingScreen,
  PortalScaffold,
  usePortal,
} from "../../_shared";

export default function ArtKeyLinkPage() {
  const params = useParams();
  const token = params.token as string;
  const indexRaw = params.index as string;
  const index = Number.parseInt(indexRaw, 10);
  const { portal, loading, error } = usePortal(token);

  if (loading) return <LoadingScreen />;
  if (error || !portal) return <ErrorScreen error={error || "Portal not found"} />;

  const link = Number.isFinite(index) ? portal.links[index] : null;
  const btnStyle = getButtonStyle(portal.theme || {});

  if (!link) {
    return (
      <PortalScaffold token={token} portal={portal} pageTitle="Link">
        <div className="text-sm opacity-80 text-center py-10 text-white">Link not found.</div>
        <Link
          href={`/art-key/${token}`}
          className="block w-full text-center py-3.5 px-4 font-semibold text-sm mt-3"
          style={btnStyle}
        >
          Back to Home
        </Link>
      </PortalScaffold>
    );
  }

  return (
    <PortalScaffold token={token} portal={portal} pageTitle="Link">
      <div className="bg-white/10 rounded-xl p-4 mb-3">
        <h2 className="text-lg font-semibold text-white">{link.label}</h2>
        <p className="text-xs opacity-70 mt-1 break-all text-white">{link.url}</p>
      </div>
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-center py-3.5 px-4 font-semibold text-sm"
        style={btnStyle}
      >
        Open Link
      </a>
    </PortalScaffold>
  );
}
