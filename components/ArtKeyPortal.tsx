"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ArtKeyData {
  title: string;
  theme: {
    template: string;
    background_type: 'color' | 'image' | 'gradient';
    background_color?: string;
    background_image?: string;
    title_color: string;
    title_style: 'solid' | 'gradient';
    button_color: string;
  };
  links: Array<{ label: string; url: string }>;
  spotify: { url: string };
  features: {
    show_guestbook: boolean;
    gb_signing_status: 'open' | 'closed';
    enable_featured_video: boolean;
    enable_gallery: boolean;
    enable_video: boolean;
  };
  featured_video: { url: string; button_label: string };
  uploadedImages: string[];
  uploadedVideos: string[];
}

interface ArtKeyPortalProps {
  token: string;
}

export default function ArtKeyPortal({ token }: ArtKeyPortalProps) {
  const [artKeyData, setArtKeyData] = useState<ArtKeyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/artkey/${token}`);
        if (!res.ok) {
          throw new Error('Failed to load ArtKey');
        }
        const result = await res.json();
        if (result.data) {
          setArtKeyData(result.data);
        } else {
          setError('ArtKey not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load ArtKey');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f5f5' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ArtKey...</p>
        </div>
      </div>
    );
  }

  if (error || !artKeyData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f5f5' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">ArtKey Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'This ArtKey does not exist'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const getPreviewBackground = () => {
    if (artKeyData.theme.background_type === 'image' && artKeyData.theme.background_image) {
      return {
        backgroundImage: `url(${artKeyData.theme.background_image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    } else if (artKeyData.theme.background_type === 'gradient') {
      return {
        background: `linear-gradient(135deg, ${artKeyData.theme.background_color || '#667eea'}, ${artKeyData.theme.button_color || '#764ba2'})`,
      };
    }
    return {
      backgroundColor: artKeyData.theme.background_color || '#f5f5f5',
    };
  };

  const getButtonTextColor = (bgColor: string) => {
    // Simple contrast check - if background is light, use dark text
    const r = parseInt(bgColor.slice(1, 3), 16);
    const g = parseInt(bgColor.slice(3, 5), 16);
    const b = parseInt(bgColor.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  };

  const handleLinkClick = (url: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Mobile: Fullscreen, Desktop: Phone frame
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (isMobile) {
    // Mobile: Fullscreen view
    return (
      <div
        className="min-h-screen w-full flex flex-col items-center text-center pt-6 pb-6 px-6"
        style={getPreviewBackground()}
      >
        <h1
          className="text-2xl md:text-3xl font-bold mb-3 font-playfair break-words mt-16"
          style={{
            color: artKeyData.theme.title_style === 'gradient' ? 'transparent' : artKeyData.theme.title_color,
            background: artKeyData.theme.title_style === 'gradient' ? `linear-gradient(135deg, ${artKeyData.theme.title_color}, ${artKeyData.theme.button_color})` : 'none',
            backgroundClip: artKeyData.theme.title_style === 'gradient' ? 'text' : 'unset',
            WebkitBackgroundClip: artKeyData.theme.title_style === 'gradient' ? 'text' : 'unset',
          }}
        >
          {artKeyData.title || 'Your Title Here'}
        </h1>

        {/* Buttons */}
        <div className="flex flex-col gap-2 mt-3 w-full max-w-sm">
          {artKeyData.links?.slice(0, 10).map((link, idx) => (
            <button
              key={idx}
              onClick={() => handleLinkClick(link.url)}
              className="w-full py-3 px-4 rounded-full text-sm font-semibold transition-all shadow-md hover:opacity-90"
              style={{ background: artKeyData.theme.button_color, color: getButtonTextColor(artKeyData.theme.button_color) }}
            >
              {link.label || `Link ${idx + 1}`}
            </button>
          ))}
          {artKeyData.spotify?.url && artKeyData.spotify.url.length > 10 && (
            <button
              onClick={() => handleLinkClick(artKeyData.spotify.url)}
              className="w-full py-3 px-4 rounded-full text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2 hover:opacity-90"
              style={{ background: artKeyData.theme.button_color, color: getButtonTextColor(artKeyData.theme.button_color) }}
            >
              🎵 Playlist
            </button>
          )}
          {artKeyData.features?.show_guestbook && (
            <button
              className="w-full py-3 px-4 rounded-full text-sm font-semibold transition-all shadow-md hover:opacity-90"
              style={{ background: artKeyData.theme.button_color, color: getButtonTextColor(artKeyData.theme.button_color) }}
            >
              📝 {artKeyData.features.gb_signing_status === 'closed' ? 'Guestbook' : 'Sign Guestbook'}
            </button>
          )}
          {artKeyData.features?.enable_featured_video && artKeyData.featured_video?.url && (
            <button
              onClick={() => handleLinkClick(artKeyData.featured_video.url)}
              className="w-full py-3 px-4 rounded-full text-sm font-semibold transition-all shadow-md hover:opacity-90"
              style={{ background: artKeyData.theme.button_color, color: getButtonTextColor(artKeyData.theme.button_color) }}
            >
              🎬 {artKeyData.featured_video.button_label || 'Watch Video'}
            </button>
          )}
          {artKeyData.features?.enable_gallery && (
            <button
              className="w-full py-3 px-4 rounded-full text-sm font-semibold transition-all shadow-md hover:opacity-90"
              style={{ background: artKeyData.theme.button_color, color: getButtonTextColor(artKeyData.theme.button_color) }}
            >
              🖼️ Image Gallery {artKeyData.uploadedImages?.length > 0 && `(${artKeyData.uploadedImages.length})`}
            </button>
          )}
          {artKeyData.features?.enable_video && (
            <button
              className="w-full py-3 px-4 rounded-full text-sm font-semibold transition-all shadow-md hover:opacity-90"
              style={{ background: artKeyData.theme.button_color, color: getButtonTextColor(artKeyData.theme.button_color) }}
            >
              🎥 Video Gallery {artKeyData.uploadedVideos?.length > 0 && `(${artKeyData.uploadedVideos.length})`}
            </button>
          )}
        </div>

        {artKeyData.uploadedImages && artKeyData.uploadedImages.length > 0 && (
          <div className="grid grid-cols-4 gap-1 mt-3 w-full max-w-sm">
            {artKeyData.uploadedImages.slice(0, 4).map((img, idx) => (
              <img key={idx} src={img} alt="" className="w-full h-12 object-cover rounded-md border border-white/50 shadow-sm" />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Desktop: Phone frame view
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#f5f5f5' }}>
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-[32px] p-2 shadow-2xl relative" style={{ width: 'min(380px, 100%)' }}>
        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-black rounded-full w-24 h-7 flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-800 ring-1 ring-gray-700"></div>
            <div className="w-3 h-3 rounded-full bg-gray-800 ring-1 ring-gray-700"></div>
          </div>
        </div>
        <div className="bg-white rounded-[28px] overflow-hidden relative" style={{ height: 'min(700px, 75vh)', width: '100%' }}>
          <div
            className="h-full w-full pt-6 pb-6 px-6 flex flex-col items-center text-center"
            style={getPreviewBackground()}
          >
            <h1
              className="text-2xl md:text-3xl font-bold mb-3 font-playfair break-words mt-16"
              style={{
                color: artKeyData.theme.title_style === 'gradient' ? 'transparent' : artKeyData.theme.title_color,
                background: artKeyData.theme.title_style === 'gradient' ? `linear-gradient(135deg, ${artKeyData.theme.title_color}, ${artKeyData.theme.button_color})` : 'none',
                backgroundClip: artKeyData.theme.title_style === 'gradient' ? 'text' : 'unset',
                WebkitBackgroundClip: artKeyData.theme.title_style === 'gradient' ? 'text' : 'unset',
              }}
            >
              {artKeyData.title || 'Your Title Here'}
            </h1>

            {/* Buttons */}
            <div className="flex flex-col gap-2 mt-3 w-full max-w-sm">
              {artKeyData.links?.slice(0, 10).map((link, idx) => (
                <button
                  key={idx}
                  onClick={() => handleLinkClick(link.url)}
                  className="w-full py-3 px-4 rounded-full text-sm font-semibold transition-all shadow-md hover:opacity-90"
                  style={{ background: artKeyData.theme.button_color, color: getButtonTextColor(artKeyData.theme.button_color) }}
                >
                  {link.label || `Link ${idx + 1}`}
                </button>
              ))}
              {artKeyData.spotify?.url && artKeyData.spotify.url.length > 10 && (
                <button
                  onClick={() => handleLinkClick(artKeyData.spotify.url)}
                  className="w-full py-3 px-4 rounded-full text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2 hover:opacity-90"
                  style={{ background: artKeyData.theme.button_color, color: getButtonTextColor(artKeyData.theme.button_color) }}
                >
                  🎵 Playlist
                </button>
              )}
              {artKeyData.features?.show_guestbook && (
                <button
                  className="w-full py-3 px-4 rounded-full text-sm font-semibold transition-all shadow-md hover:opacity-90"
                  style={{ background: artKeyData.theme.button_color, color: getButtonTextColor(artKeyData.theme.button_color) }}
                >
                  📝 {artKeyData.features.gb_signing_status === 'closed' ? 'Guestbook' : 'Sign Guestbook'}
                </button>
              )}
              {artKeyData.features?.enable_featured_video && artKeyData.featured_video?.url && (
                <button
                  onClick={() => handleLinkClick(artKeyData.featured_video.url)}
                  className="w-full py-3 px-4 rounded-full text-sm font-semibold transition-all shadow-md hover:opacity-90"
                  style={{ background: artKeyData.theme.button_color, color: getButtonTextColor(artKeyData.theme.button_color) }}
                >
                  🎬 {artKeyData.featured_video.button_label || 'Watch Video'}
                </button>
              )}
              {artKeyData.features?.enable_gallery && (
                <button
                  className="w-full py-3 px-4 rounded-full text-sm font-semibold transition-all shadow-md hover:opacity-90"
                  style={{ background: artKeyData.theme.button_color, color: getButtonTextColor(artKeyData.theme.button_color) }}
                >
                  🖼️ Image Gallery {artKeyData.uploadedImages?.length > 0 && `(${artKeyData.uploadedImages.length})`}
                </button>
              )}
              {artKeyData.features?.enable_video && (
                <button
                  className="w-full py-3 px-4 rounded-full text-sm font-semibold transition-all shadow-md hover:opacity-90"
                  style={{ background: artKeyData.theme.button_color, color: getButtonTextColor(artKeyData.theme.button_color) }}
                >
                  🎥 Video Gallery {artKeyData.uploadedVideos?.length > 0 && `(${artKeyData.uploadedVideos.length})`}
                </button>
              )}
            </div>

            {artKeyData.uploadedImages && artKeyData.uploadedImages.length > 0 && (
              <div className="grid grid-cols-4 gap-1 mt-3 w-full max-w-sm">
                {artKeyData.uploadedImages.slice(0, 4).map((img, idx) => (
                  <img key={idx} src={img} alt="" className="w-full h-12 object-cover rounded-md border border-white/50 shadow-sm" />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
