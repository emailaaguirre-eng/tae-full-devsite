"use client";

/**
 * Public ArtKey Portal Page
 * Mobile-app-style portal for guests to view and interact with an ArtKey
 * Displays title, buttons, guestbook, gallery, videos, links, and Spotify
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ArtKeyPublicData, GuestbookEntry } from '@/types/artkey';
import { fetchArtKeyPublic, postGuestbookEntry } from '@/lib/artkeyClient';

// Color palette (matching ArtKeyEditor)
const COLOR_PRIMARY = '#FFFFFF';
const COLOR_ALT = '#ECECE9';
const COLOR_ACCENT = '#353535';

export default function ArtKeyPortalPage({ params }: { params: Promise<{ public_token: string }> }) {
  const [publicToken, setPublicToken] = useState<string | null>(null);
  const [data, setData] = useState<ArtKeyPublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [guestbookName, setGuestbookName] = useState('');
  const [guestbookEmail, setGuestbookEmail] = useState('');
  const [guestbookMessage, setGuestbookMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  // Resolve params
  useEffect(() => {
    params.then((p) => setPublicToken(p.public_token));
  }, [params]);

  // Fetch ArtKey data
  useEffect(() => {
    if (!publicToken) return;

    async function fetchData() {
      try {
        // Try localStorage first for demo mode (backward compatibility)
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem(`artkey_${publicToken}`);
          if (stored) {
            const savedData = JSON.parse(stored);
            console.log('[ARTKEY PORTAL] Loaded from localStorage:', publicToken);
            // Transform localStorage data to match ArtKeyPublicData structure
            setData({
              id: savedData.id || publicToken,
              public_token: publicToken,
              title: savedData.title,
              theme: savedData.theme,
              features: savedData.features,
              links: savedData.links || [],
              spotify: savedData.spotify || { url: '', autoplay: false },
              featured_video: savedData.featured_video,
              customizations: savedData.customizations || {},
              uploadedImages: savedData.uploadedImages || [],
              uploadedVideos: savedData.uploadedVideos || [],
              guestbook: [],
              media: [],
            });
            setLoading(false);
            return;
          }
        }

        // Fetch from API using client helper
        const apiData = await fetchArtKeyPublic(publicToken);
        setData(apiData);
      } catch (err: any) {
        setError(err.message || 'Failed to load ArtKey');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [publicToken]);

  // Helper functions (matching ArtKeyEditor)
  const getPreviewBackground = () => {
    if (!data) return { backgroundColor: COLOR_ALT };
    if (data.theme.bg_image_url) {
      return {
        backgroundImage: `url(${data.theme.bg_image_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: COLOR_ALT,
      };
    }
    if (data.theme.bg_color?.startsWith('linear-gradient')) {
      return { background: data.theme.bg_color, backgroundColor: COLOR_ALT };
    }
    return { backgroundColor: data.theme.bg_color || COLOR_ALT };
  };

  const getButtonTextColor = (color: string) => {
    if (!color) return '#fff';
    const c = color.toLowerCase();
    if (c === '#ffffff' || c === '#fefefe' || c === '#fef3c7' || c === '#fde047' || c === '#fffff0') return '#000000';
    return '#ffffff';
  };

  const getFontFamily = (fontValue: string) => {
    if (!fontValue) return 'inherit';
    if (fontValue.startsWith('g:')) {
      const fontName = fontValue.replace('g:', '').replace(/\s+/g, '+');
      if (typeof window !== 'undefined') {
        const linkId = `google-font-${fontName}`;
        if (!document.getElementById(linkId)) {
          const link = document.createElement('link');
          link.id = linkId;
          link.rel = 'stylesheet';
          link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;600;700&display=swap`;
          document.head.appendChild(link);
        }
      }
      return `"${fontValue.replace('g:', '')}", sans-serif`;
    }
    switch (fontValue) {
      case 'system':
        return '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
      case 'serif':
        return 'Georgia, "Times New Roman", Times, serif';
      case 'mono':
        return '"Courier New", Courier, monospace';
      default:
        return 'inherit';
    }
  };

  const handleGuestbookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicToken || !data || !guestbookName.trim() || !guestbookMessage.trim()) return;

    // Check if email is required
    const requiresEmail = data.features.require_email_for_guestbook;
    if (requiresEmail && !guestbookEmail.trim()) {
      alert('Email is required for guestbook entries');
      return;
    }

    setSubmitting(true);
    try {
      // Use client helper to post guestbook entry
      const entry = await postGuestbookEntry(publicToken, {
        name: guestbookName.trim(),
        email: guestbookEmail.trim() || undefined,
        message: guestbookMessage.trim(),
        parentId: replyingTo || null,
      });
      
      if (!entry.approved) {
        alert('Thank you! Your message will appear after approval.');
      } else {
        alert('Thank you! Your message has been posted.');
      }

      // Refresh data
      const refreshData = await fetchArtKeyPublic(publicToken);
      setData(refreshData);

      setGuestbookName('');
      setGuestbookEmail('');
      setGuestbookMessage('');
      setReplyingTo(null);
    } catch (err: any) {
      alert(err.message || 'Failed to post message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: COLOR_ALT }}>
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-brand-dark border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-brand-dark text-lg">Loading ArtKey...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: COLOR_ALT }}>
        <div className="text-center px-4">
          <h1 className="text-2xl font-bold mb-4" style={{ color: COLOR_ACCENT }}>ArtKey Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'This ArtKey does not exist'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 rounded-lg font-semibold"
            style={{ background: COLOR_ACCENT, color: COLOR_PRIMARY }}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Build button list based on enabled features
  const buttons: Array<{ label: string; action: string; icon?: string }> = [];
  
  if (data.features.enable_custom_links && data.links.length > 0) {
    data.links.forEach((link) => {
      buttons.push({ label: link.label, action: `link:${link.url}` });
    });
  }
  
  if (data.featured_video) {
    buttons.push({ label: `🎬 ${data.featured_video.button_label || 'Watch Video'}`, action: 'featured_video', icon: '🎬' });
  }
  
  if (data.features.enable_spotify && data.spotify.url?.length > 10) {
    buttons.push({ label: '🎵 Share Your Playlist', action: 'spotify', icon: '🎵' });
  }
  
  if (data.features.show_guestbook) {
    buttons.push({ label: '📖 Guestbook', action: 'guestbook', icon: '📖' });
  }
  
  if (data.features.enable_gallery) {
    buttons.push({ label: '📸 Image Gallery', action: 'gallery', icon: '📸' });
  }
  
  if (data.features.enable_video) {
    buttons.push({ label: '🎥 Video Gallery', action: 'videos', icon: '🎥' });
  }

  const handleButtonClick = (action: string) => {
    if (action.startsWith('link:')) {
      const url = action.replace('link:', '');
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      setActiveSection(activeSection === action ? null : action);
    }
  };

  return (
    <div className="min-h-screen w-full" style={getPreviewBackground()}>
      {/* Mobile-app-style container */}
      <div className="w-full min-h-screen pt-6 pb-6 px-6 flex flex-col items-center text-center">
        {/* Title */}
        <h1
          className="text-2xl md:text-3xl font-bold mb-3 break-words mt-16"
          style={{
            fontFamily: getFontFamily(data.theme.font),
            color: data.theme.title_style === 'gradient' ? 'transparent' : data.theme.title_color,
            background: data.theme.title_style === 'gradient' 
              ? `linear-gradient(135deg, ${data.theme.title_color}, ${data.theme.button_color})` 
              : 'none',
            backgroundClip: data.theme.title_style === 'gradient' ? 'text' : 'unset',
            WebkitBackgroundClip: data.theme.title_style === 'gradient' ? 'text' : 'unset',
          }}
        >
          {data.title || 'Your Personalized Design'}
        </h1>

        {/* Buttons */}
        <div className={`mt-3 w-full max-w-sm ${buttons.length > 6 ? 'grid grid-cols-2 gap-2' : 'flex flex-col gap-2'}`}>
          {buttons.map((btn, idx) => {
            const displayText = btn.label.length > 40 ? btn.label.substring(0, 37) + '...' : btn.label;
            const fontSize = buttons.length > 6 ? 'text-xs' : 'text-sm';
            
            return (
              <button
                key={idx}
                onClick={() => handleButtonClick(btn.action)}
                className={`w-full py-2.5 px-3 rounded-full ${fontSize} font-semibold transition-all shadow-md ${
                  activeSection === btn.action ? 'ring-2 ring-offset-2' : ''
                }`}
                style={{
                  background: data.theme.button_color,
                  color: getButtonTextColor(data.theme.button_color),
                  ringColor: data.theme.button_color,
                }}
              >
                {displayText}
              </button>
            );
          })}
        </div>

        {/* Preview Images */}
        {data.uploadedImages.length > 0 && (
          <div className="grid grid-cols-4 gap-1 mt-3 w-full max-w-sm">
            {data.uploadedImages.slice(0, 4).map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt=""
                className="w-full h-12 object-cover rounded-md border border-white/50 shadow-sm"
              />
            ))}
          </div>
        )}

        {/* Sections */}
        <div className="w-full max-w-sm mt-6 space-y-4">
          {/* Featured Video */}
          {activeSection === 'featured_video' && data.featured_video && (
            <div className="bg-white/90 rounded-xl p-4 shadow-lg">
              <h3 className="text-lg font-bold mb-3" style={{ color: COLOR_ACCENT }}>
                {data.featured_video.button_label || 'Watch Video'}
              </h3>
              <video
                src={data.featured_video.video_url}
                controls
                className="w-full rounded-lg"
                style={{ maxHeight: '400px' }}
              />
            </div>
          )}

          {/* Spotify */}
          {activeSection === 'spotify' && data.features.enable_spotify && data.spotify.url?.length > 10 && (
            <div className="bg-white/90 rounded-xl p-4 shadow-lg">
              <h3 className="text-lg font-bold mb-3" style={{ color: COLOR_ACCENT }}>
                🎵 Playlist
              </h3>
              <iframe
                src={`https://open.spotify.com/embed${data.spotify.url.replace('https://open.spotify.com', '')}`}
                width="100%"
                height="352"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="rounded-lg"
              />
            </div>
          )}

          {/* Guestbook */}
          {activeSection === 'guestbook' && data.features.show_guestbook && (
            <div className="bg-white/90 rounded-xl p-4 shadow-lg">
              <h3 className="text-lg font-bold mb-3" style={{ color: COLOR_ACCENT }}>
                📖 Guestbook
              </h3>
              
              {/* Guestbook Entries */}
              <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                {data.guestbook.length === 0 ? (
                  <p className="text-gray-500 text-sm">No messages yet. Be the first to leave one!</p>
                ) : (
                  data.guestbook.map((entry) => {
                    const isHost = entry.role === 'host';
                    const canSign = data.features.show_guestbook && 
                                  data.features.gb_signing_status !== 'closed';
                    
                    return (
                      <div key={entry.id} className={`border-b border-gray-200 pb-3 last:border-0 ${isHost ? 'bg-blue-50/50 rounded-lg p-2' : ''}`}>
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className={`font-semibold text-sm ${isHost ? 'text-blue-700' : ''}`} style={!isHost ? { color: COLOR_ACCENT } : {}}>
                                {entry.name}
                                {isHost && <span className="ml-2 text-xs">(Host)</span>}
                              </p>
                            </div>
                            <p className={`text-sm mt-1 ${isHost ? 'text-blue-900' : 'text-gray-700'}`}>{entry.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(entry.createdAt || '').toLocaleDateString()}
                            </p>
                          </div>
                          {canSign && !isHost && (
                            <button
                              onClick={() => setReplyingTo(replyingTo === entry.id ? null : entry.id)}
                              className="text-xs px-2 py-1 rounded"
                              style={{ background: COLOR_ALT, color: COLOR_ACCENT }}
                            >
                              Reply
                            </button>
                          )}
                        </div>
                        
                        {/* Replies */}
                        {entry.children && entry.children.length > 0 && (
                          <div className="ml-4 mt-2 space-y-2 border-l-2 pl-3" style={{ borderColor: COLOR_ALT }}>
                            {entry.children.map((reply: GuestbookEntry) => {
                              const isReplyHost = reply.role === 'host';
                              return (
                                <div key={reply.id} className={isReplyHost ? 'bg-blue-50/50 rounded p-2' : ''}>
                                  <p className={`font-semibold text-xs ${isReplyHost ? 'text-blue-700' : ''}`} style={!isReplyHost ? { color: COLOR_ACCENT } : {}}>
                                    {reply.name}
                                    {isReplyHost && <span className="ml-2">(Host)</span>}
                                  </p>
                                  <p className={`text-xs mt-1 ${isReplyHost ? 'text-blue-900' : 'text-gray-700'}`}>{reply.message}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(reply.createdAt || '').toLocaleDateString()}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Guestbook Form */}
              {data.features.show_guestbook && data.features.gb_signing_status !== 'closed' && (
                <form onSubmit={handleGuestbookSubmit} className="space-y-2">
                  {replyingTo && (
                    <p className="text-xs text-gray-600 mb-2">
                      Replying to: {data.guestbook.find((e) => e.id === replyingTo)?.name}
                    </p>
                  )}
                  <input
                    type="text"
                    value={guestbookName}
                    onChange={(e) => setGuestbookName(e.target.value)}
                    placeholder="Your name"
                    required
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{ border: '1px solid #d8d8d6' }}
                  />
                  {(data.features.require_email_for_guestbook || guestbookEmail) && (
                    <input
                      type="email"
                      value={guestbookEmail}
                      onChange={(e) => setGuestbookEmail(e.target.value)}
                      placeholder="Your email"
                      required={data.features.require_email_for_guestbook}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ border: '1px solid #d8d8d6' }}
                    />
                  )}
                  <textarea
                    value={guestbookMessage}
                    onChange={(e) => setGuestbookMessage(e.target.value)}
                    placeholder="Your message..."
                    required
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{ border: '1px solid #d8d8d6' }}
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                    style={{ background: data.theme.button_color, color: getButtonTextColor(data.theme.button_color) }}
                  >
                    {submitting ? 'Posting...' : 'Post Message'}
                  </button>
                  {data.features.gb_require_approval && (
                    <p className="text-xs text-gray-500 text-center">
                      Your message will appear after approval
                    </p>
                  )}
                </form>
              )}
            </div>
          )}

          {/* Image Gallery */}
          {activeSection === 'gallery' && data.features.enable_gallery && (
            <div className="bg-white/90 rounded-xl p-4 shadow-lg">
              <h3 className="text-lg font-bold mb-3" style={{ color: COLOR_ACCENT }}>
                📸 Image Gallery
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {data.media.filter((m) => m.type === 'image').length === 0 ? (
                  <p className="text-gray-500 text-sm col-span-2">No images yet</p>
                ) : (
                  data.media
                    .filter((m) => m.type === 'image')
                    .map((img) => (
                      <img
                        key={img.id}
                        src={img.url}
                        alt={img.caption || ''}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ))
                )}
              </div>
            </div>
          )}

          {/* Video Gallery */}
          {activeSection === 'videos' && data.features.enable_video && (
            <div className="bg-white/90 rounded-xl p-4 shadow-lg">
              <h3 className="text-lg font-bold mb-3" style={{ color: COLOR_ACCENT }}>
                🎥 Video Gallery
              </h3>
              <div className="space-y-3">
                {data.media.filter((m) => m.type === 'video').length === 0 ? (
                  <p className="text-gray-500 text-sm">No videos yet</p>
                ) : (
                  data.media
                    .filter((m) => m.type === 'video')
                    .map((video) => (
                      <video
                        key={video.id}
                        src={video.url}
                        controls
                        className="w-full rounded-lg"
                        style={{ maxHeight: '300px' }}
                      />
                    ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

