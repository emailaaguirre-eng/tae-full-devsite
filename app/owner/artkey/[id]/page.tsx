"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface GuestbookEntry {
  id: string;
  name: string;
  email?: string;
  message: string;
  role: string;
  approved: boolean;
  createdAt: string;
  children: GuestbookEntry[];
  media: Array<{ id: string; type: string; url: string; caption?: string; approved: boolean }>;
}

interface MediaItem {
  id: string;
  type: string;
  url: string;
  caption?: string;
  approved: boolean;
  createdAt: string;
}

interface ArtKeyData {
  id: string;
  publicToken: string;
  title: string;
  guestbook: {
    entries: GuestbookEntry[];
    stats: { total: number; approved: number; pending: number };
  };
  media: {
    all: MediaItem[];
    byType: {
      images: MediaItem[];
      videos: MediaItem[];
      audio: MediaItem[];
    };
    stats: {
      total: number;
      approved: number;
      pending: number;
      byType: { image: number; video: number; audio: number };
    };
  };
  stats: {
    guestbook: { total: number; approved: number; pending: number };
    media: { total: number; approved: number; pending: number };
  };
}

export default function ArtKeyContentView() {
  const params = useParams();
  const router = useRouter();
  const [artKeyData, setArtKeyData] = useState<ArtKeyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'guestbook' | 'media'>('guestbook');

  useEffect(() => {
    const token = localStorage.getItem('owner_token');
    if (!token) {
      router.push('/owner/login');
      return;
    }

    if (params.id) {
      fetchArtKeyData(params.id as string);
    }
  }, [params, router]);

  const fetchArtKeyData = async (id: string) => {
    try {
      const token = localStorage.getItem('owner_token');
      const res = await fetch(`/api/owner/artkey/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        router.push('/owner/login');
        return;
      }

      const data = await res.json();
      if (data.success) {
        setArtKeyData(data.artKey);
      } else {
        setError(data.error || 'Failed to load ArtKey');
      }
    } catch (err: any) {
      setError('Failed to load ArtKey content');
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (type: 'guestbook' | 'media', id: string, action: 'approve' | 'reject' | 'delete') => {
    try {
      const token = localStorage.getItem('owner_token');
      if (!token || !params.id) return;

      const res = await fetch(`/api/owner/artkey/${params.id}/moderate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, itemId: id, action }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Moderation failed');
      }

      // Refresh data after moderation
      fetchArtKeyData(params.id as string);
    } catch (err: any) {
      alert(err.message || 'Failed to moderate. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  if (error || !artKeyData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error || 'ArtKey not found'}</p>
          <Link
            href="/owner/dashboard"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const publicUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/artkey/${artKeyData.publicToken}`
    : '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{artKeyData.title}</h1>
              <p className="text-sm text-gray-500">All Content (Approved & Pending)</p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View Public Portal →
              </a>
              <Link
                href="/owner/dashboard"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500 mb-1">Guestbook Entries</div>
            <div className="text-2xl font-bold text-gray-900">{artKeyData.stats.guestbook.total}</div>
            <div className="text-xs text-gray-500 mt-1">
              {artKeyData.stats.guestbook.approved} approved, {artKeyData.stats.guestbook.pending} pending
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500 mb-1">Media Items</div>
            <div className="text-2xl font-bold text-gray-900">{artKeyData.stats.media.total}</div>
            <div className="text-xs text-gray-500 mt-1">
              {artKeyData.stats.media.approved} approved, {artKeyData.stats.media.pending} pending
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500 mb-1">Images</div>
            <div className="text-2xl font-bold text-gray-900">{artKeyData.media.stats.byType.image}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500 mb-1">Videos & Audio</div>
            <div className="text-2xl font-bold text-gray-900">
              {artKeyData.media.stats.byType.video + artKeyData.media.stats.byType.audio}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('guestbook')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'guestbook'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📖 Guestbook ({artKeyData.guestbook.stats.total})
              </button>
              <button
                onClick={() => setActiveTab('media')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'media'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📸 Media ({artKeyData.media.stats.total})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Guestbook Tab */}
            {activeTab === 'guestbook' && (
              <div>
                {artKeyData.guestbook.entries.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg mb-2">No guestbook entries yet</p>
                    <p className="text-sm">Guests can leave messages when they visit your ArtKey portal</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {artKeyData.guestbook.entries.map((entry) => (
                      <div
                        key={entry.id}
                        className={`border-2 rounded-lg p-4 ${
                          entry.approved
                            ? 'border-green-200 bg-green-50'
                            : 'border-yellow-300 bg-yellow-50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-gray-900">{entry.name}</p>
                              {entry.role === 'host' && (
                                <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                                  Host
                                </span>
                              )}
                              {!entry.approved && (
                                <span className="text-xs px-2 py-0.5 rounded bg-yellow-200 text-yellow-800">
                                  Pending Approval
                                </span>
                              )}
                            </div>
                            {entry.email && (
                              <p className="text-xs text-gray-600 mb-1">📧 {entry.email}</p>
                            )}
                            <p className="text-sm text-gray-700 mb-2">{entry.message}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(entry.createdAt).toLocaleString()}
                            </p>

                            {/* Entry Media */}
                            {entry.media.length > 0 && (
                              <div className="mt-3 flex gap-2 flex-wrap">
                                {entry.media.map((item) => (
                                  <div key={item.id} className="relative">
                                    {item.type === 'image' ? (
                                      <img
                                        src={item.url}
                                        alt={item.caption || ''}
                                        className="w-20 h-20 object-cover rounded border-2 border-gray-300"
                                      />
                                    ) : item.type === 'video' ? (
                                      <video
                                        src={item.url}
                                        className="w-20 h-20 object-cover rounded border-2 border-gray-300"
                                        controls
                                      />
                                    ) : (
                                      <div className="w-20 h-20 bg-gray-200 rounded border-2 border-gray-300 flex items-center justify-center">
                                        🎵
                                      </div>
                                    )}
                                    {!item.approved && (
                                      <div className="absolute top-0 right-0 bg-yellow-500 text-white text-xs px-1 rounded">
                                        Pending
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Replies */}
                            {entry.children.length > 0 && (
                              <div className="ml-4 mt-3 space-y-2 border-l-2 border-gray-300 pl-3">
                                {entry.children.map((reply) => (
                                  <div key={reply.id} className="bg-white rounded p-2">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="font-semibold text-sm text-gray-900">{reply.name}</p>
                                      {reply.role === 'host' && (
                                        <span className="text-xs px-1 py-0.5 rounded bg-blue-100 text-blue-800">
                                          Host
                                        </span>
                                      )}
                                      {!reply.approved && (
                                        <span className="text-xs px-1 py-0.5 rounded bg-yellow-200 text-yellow-800">
                                          Pending
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-700">{reply.message}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            {!entry.approved && (
                              <button
                                onClick={() => handleModerate('guestbook', entry.id, 'approve')}
                                className="px-3 py-1 text-xs font-semibold rounded bg-green-600 text-white hover:bg-green-700"
                                title="Approve"
                              >
                                ✓
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (confirm('Delete this entry?')) {
                                  handleModerate('guestbook', entry.id, 'delete');
                                }
                              }}
                              className="px-3 py-1 text-xs font-semibold rounded bg-red-600 text-white hover:bg-red-700"
                              title="Delete"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Media Tab */}
            {activeTab === 'media' && (
              <div>
                {artKeyData.media.all.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg mb-2">No media uploaded yet</p>
                    <p className="text-sm">Guests can upload images, videos, and audio when enabled</p>
                  </div>
                ) : (
                  <div>
                    {/* Images */}
                    {artKeyData.media.byType.images.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          Images ({artKeyData.media.byType.images.length})
                        </h3>
                        <div className="grid grid-cols-4 gap-3">
                          {artKeyData.media.byType.images.map((item) => (
                            <div key={item.id} className="relative group">
                              <img
                                src={item.url}
                                alt={item.caption || ''}
                                className="w-full h-32 object-cover rounded-lg border-2 border-gray-300"
                              />
                              {!item.approved && (
                                <div className="absolute top-1 left-1 px-2 py-1 text-xs font-semibold rounded bg-yellow-500 text-white">
                                  Pending
                                </div>
                              )}
                              <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                {!item.approved && (
                                  <button
                                    onClick={() => handleModerate('media', item.id, 'approve')}
                                    className="px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700"
                                    title="Approve"
                                  >
                                    ✓
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    if (confirm('Delete this media?')) {
                                      handleModerate('media', item.id, 'delete');
                                    }
                                  }}
                                  className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                                  title="Delete"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Videos */}
                    {artKeyData.media.byType.videos.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          Videos ({artKeyData.media.byType.videos.length})
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          {artKeyData.media.byType.videos.map((item) => (
                            <div key={item.id} className="relative group">
                              <video
                                src={item.url}
                                className="w-full rounded-lg border-2 border-gray-300"
                                controls
                              />
                              {!item.approved && (
                                <div className="absolute top-1 left-1 px-2 py-1 text-xs font-semibold rounded bg-yellow-500 text-white">
                                  Pending
                                </div>
                              )}
                              <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                {!item.approved && (
                                  <button
                                    onClick={() => handleModerate('media', item.id, 'approve')}
                                    className="px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700"
                                  >
                                    ✓
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    if (confirm('Delete this media?')) {
                                      handleModerate('media', item.id, 'delete');
                                    }
                                  }}
                                  className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Audio */}
                    {artKeyData.media.byType.audio.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          Audio ({artKeyData.media.byType.audio.length})
                        </h3>
                        <div className="space-y-2">
                          {artKeyData.media.byType.audio.map((item) => (
                            <div key={item.id} className="bg-white border-2 border-gray-300 rounded-lg p-3 flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="text-2xl">🎵</div>
                                <div className="flex-1">
                                  <audio src={item.url} controls className="w-full" />
                                  {item.caption && (
                                    <p className="text-xs text-gray-600 mt-1">{item.caption}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4">
                                {!item.approved && (
                                  <span className="px-2 py-1 text-xs rounded bg-yellow-200 text-yellow-800">
                                    Pending
                                  </span>
                                )}
                                {!item.approved && (
                                  <button
                                    onClick={() => handleModerate('media', item.id, 'approve')}
                                    className="px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700"
                                  >
                                    ✓
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    if (confirm('Delete this media?')) {
                                      handleModerate('media', item.id, 'delete');
                                    }
                                  }}
                                  className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

