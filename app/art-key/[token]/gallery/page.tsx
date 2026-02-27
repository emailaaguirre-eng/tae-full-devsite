"use client";

import { useParams } from "next/navigation";
import {
  ErrorScreen,
  getProtectedGalleryImages,
  LoadingScreen,
  PortalScaffold,
  usePortal,
} from "../_shared";

export default function ArtKeyGalleryPage() {
  const params = useParams();
  const token = params.token as string;
  const { portal, loading, error } = usePortal(token);

  if (loading) return <LoadingScreen />;
  if (error || !portal) return <ErrorScreen error={error || "Portal not found"} />;

  const images = getProtectedGalleryImages(portal, token);
  return (
    <PortalScaffold token={token} portal={portal} pageTitle="Gallery">
      {images.length === 0 ? (
        <div className="text-sm opacity-80 text-center py-10 text-white">No gallery images yet.</div>
      ) : (
        <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden">
          {images.map((src, i) => (
            <div key={`${src}-${i}`} className="aspect-square bg-black/20 overflow-hidden">
              <img
                src={src}
                alt={`Gallery ${i + 1}`}
                className="w-full h-full object-cover select-none"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>
          ))}
        </div>
      )}
    </PortalScaffold>
  );
}
