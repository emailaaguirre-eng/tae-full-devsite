"use client";

/**
 * Owner ArtKey Management Page
 * Allows the owner/host to moderate guestbook entries and media
 * Only accessible with the owner_token
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ArtKeyOwnerData } from '@/types/artkey';
import { fetchArtKeyOwner, moderateGuestbookEntry, moderateMediaItem } from '@/lib/artkeyClient';

const COLOR_PRIMARY = '#FFFFFF';
const COLOR_ALT = '#ECECE9';
const COLOR_ACCENT = '#353535';

export default function OwnerManagementPage({ params }: { params: Promise<{ owner_token: string }> }) {
  const [ownerToken, setOwnerToken] = useState<string | null>(null);
  const [data, setData] = useState<ArtKeyOwnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'guestbook' | 'media'>('guestbook');
  const [moderating, setModerating] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    params.then((p) => setOwnerToken(p.owner_token));
  }, [params]);

  useEffect(() => {
    if (!ownerToken) return;

    async function fetchData() {
      try {
        // Use client helper to fetch owner data
        const ownerData = await fetchArtKeyOwner(ownerToken!);
        setData(ownerData);
      } catch (err: any) {
        setError(err.message || 'Failed to load management data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [ownerToken]);

  const handleModerate = async (type: 'guestbook' | 'media', id: string, action: 'approve' | 'reject' | 'delete') => {
    if (!ownerToken) return;
    
    setModerating(id);
    try {
      // Use client helpers for moderation
      if (type === 'guestbook') {
        await moderateGuestbookEntry(ownerToken, { entryId: id, action });
      } else {
        await moderateMediaItem(ownerToken, { mediaId: id, action });
      }

      // Refresh data using client helper
      const refreshData = await fetchArtKeyOwner(ownerToken);
      setData(refreshData);
    } catch (err: any) {
      alert(err.message || 'Failed to moderate. Please try again.');
    } finally {
      setModerating(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: COLOR_ALT }}>
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-brand-dark border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-brand-dark text-lg">Loading management panel...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: COLOR_ALT }}>
        <div className="text-center px-4">
          <h1 className="text-2xl font-bold mb-4" style={{ color: COLOR_ACCENT }}>Access Denied</h1>
          <p className="text-gray-600 mb-4">{error || 'Invalid owner token'}</p>
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

  // Get public URL (we need to fetch the public_token from the ArtKey)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const publicUrl = data.public_token ? `${baseUrl}/artkey/${data.public_token}` : '';

  return (
    <div className="min-h-screen" style={{ background: COLOR_ALT }}>
      {/* Header */}
      <div style={{ background: COLOR_ACCENT }} className="text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold">ArtKey Management</h1>
              <p className="text-sm text-white/80 mt-1">{data.title}</p>
            </div>
            {publicUrl && (
              <div className="text-right">
                <p className="text-xs text-white/60 mb-1">Public URL:</p>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white underline hover:text-white/80"
                >
                  {publicUrl}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 p-1 rounded-lg bg-white">
          <button
            onClick={() => setActiveTab('guestbook')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'guestbook'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Guestbook ({data.stats?.guestbook.pending || 0} pending)
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'media'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Media ({data.stats?.media.pending || 0} pending)
          </button>
        </div>

        {/* Guestbook Tab */}
        {activeTab === 'guestbook' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold" style={{ color: COLOR_ACCENT }}>
                Guestbook Entries
              </h2>
              <div className="text-sm text-gray-600">
                {data.stats?.guestbook.approved || 0} approved, {data.stats?.guestbook.pending || 0} pending
              </div>
            </div>

            <div className="space-y-4">
              {data.allGuestbookEntries.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No guestbook entries yet</p>
              ) : (
                data.allGuestbookEntries.map((entry, idx) => (
                  <div
                    key={entry.id ?? `entry-${idx}`}
                    className={`border-2 rounded-lg p-4 ${
                      entry.approved ? 'border-green-200 bg-green-50' : 'border-yellow-300 bg-yellow-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold" style={{ color: COLOR_ACCENT }}>
                            {entry.name}
                          </p>
                          {entry.role === 'host' && (
                            <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                              Host
                            </span>
                          )}
                        </div>
                        {entry.email && (
                          <p className="text-xs text-gray-600 mt-1">
                            📧 {entry.email}
                          </p>
                        )}
                        <p className="text-sm text-gray-700 mt-1">{entry.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : 'Unknown date'}
                        </p>
                        {!entry.approved && (
                          <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold rounded bg-yellow-200 text-yellow-800">
                            Pending Approval
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        {!entry.approved && entry.id && (
                          <button
                            onClick={() => handleModerate('guestbook', entry.id!, 'approve')}
                            disabled={moderating === entry.id}
                            className="px-3 py-1 text-xs font-semibold rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            {moderating === entry.id ? '...' : '✓ Approve'}
                          </button>
                        )}
                        {entry.approved && entry.id && (
                          <button
                            onClick={() => handleModerate('guestbook', entry.id!, 'reject')}
                            disabled={moderating === entry.id}
                            className="px-3 py-1 text-xs font-semibold rounded bg-yellow-600 text-white hover:bg-yellow-700 disabled:opacity-50"
                          >
                            {moderating === entry.id ? '...' : 'Reject'}
                          </button>
                        )}
                        {entry.id && (
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this entry?')) {
                                handleModerate('guestbook', entry.id!, 'delete');
                              }
                            }}
                            disabled={moderating === entry.id}
                            className="px-3 py-1 text-xs font-semibold rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {moderating === entry.id ? '...' : '✕ Delete'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Replies */}
                    {entry.children && entry.children.length > 0 && (
                      <div className="ml-4 mt-3 space-y-2 border-l-2 pl-3" style={{ borderColor: COLOR_ALT }}>
                        {entry.children.map((reply, replyIdx) => (
                          <div key={reply.id ?? `reply-${replyIdx}`} className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm" style={{ color: COLOR_ACCENT }}>
                                  {reply.name}
                                </p>
                                {reply.role === 'host' && (
                                  <span className="text-xs px-1 py-0.5 rounded bg-blue-100 text-blue-800">
                                    Host
                                  </span>
                                )}
                              </div>
                              {reply.email && (
                                <p className="text-xs text-gray-600 mt-0.5">
                                  📧 {reply.email}
                                </p>
                              )}
                              <p className="text-xs text-gray-700 mt-1">{reply.message}</p>
                              {!reply.approved && (
                                <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded bg-yellow-200 text-yellow-800">
                                  Pending
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2 ml-2">
                              {!reply.approved && reply.id && (
                                <button
                                  onClick={() => handleModerate('guestbook', reply.id!, 'approve')}
                                  disabled={moderating === reply.id}
                                  className="px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                                >
                                  ✓
                                </button>
                              )}
                              {reply.id && (
                                <button
                                  onClick={() => {
                                    if (confirm('Delete this reply?')) {
                                      handleModerate('guestbook', reply.id!, 'delete');
                                    }
                                  }}
                                  disabled={moderating === reply.id}
                                  className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Media Tab */}
        {activeTab === 'media' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold" style={{ color: COLOR_ACCENT }}>
                Media Items
              </h2>
              <div className="text-sm text-gray-600">
                {data.stats?.media.approved || 0} approved, {data.stats?.media.pending || 0} pending
              </div>
            </div>

            {/* Images */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3" style={{ color: COLOR_ACCENT }}>
                Images ({data.allMediaItems.filter((m) => m.type === 'image').length})
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {data.allMediaItems.filter((m) => m.type === 'image').map((item, idx) => (
                  <div key={item.id ?? `img-${idx}`} className="relative group">
                    <img
                      src={item.url}
                      alt={item.caption || ''}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    {!item.approved && (
                      <div className="absolute top-1 left-1 px-2 py-1 text-xs font-semibold rounded bg-yellow-500 text-white">
                        Pending
                      </div>
                    )}
                    {item.id && (
                      <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        {!item.approved && (
                          <button
                            onClick={() => handleModerate('media', item.id!, 'approve')}
                            disabled={moderating === item.id}
                            className="px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                            title="Approve"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm('Delete this media?')) {
                              handleModerate('media', item.id!, 'delete');
                            }
                          }}
                          disabled={moderating === item.id}
                          className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                          title="Delete"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Videos */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3" style={{ color: COLOR_ACCENT }}>
                Videos ({data.allMediaItems.filter((m) => m.type === 'video').length})
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {data.allMediaItems.filter((m) => m.type === 'video').map((item, idx) => (
                  <div key={item.id ?? `vid-${idx}`} className="relative group">
                    <video src={item.url} className="w-full rounded-lg" controls />
                    {!item.approved && (
                      <div className="absolute top-1 left-1 px-2 py-1 text-xs font-semibold rounded bg-yellow-500 text-white">
                        Pending
                      </div>
                    )}
                    {item.id && (
                      <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        {!item.approved && (
                          <button
                            onClick={() => handleModerate('media', item.id!, 'approve')}
                            disabled={moderating === item.id}
                            className="px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm('Delete this media?')) {
                              handleModerate('media', item.id!, 'delete');
                            }
                          }}
                          disabled={moderating === item.id}
                          className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

