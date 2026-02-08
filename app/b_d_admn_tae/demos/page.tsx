"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/admin-fetch';

interface ArtKeyPortal {
  id: string;
  token: string;
  title: string;
  description?: string;
  shareUrl: string;
  qrCodeUrl?: string;
  ownerToken?: string;
  createdAt: string;
}

interface ComposedResult {
  composedUrl: string;
  qrUrl: string;
  qrTargetUrl: string;
}

export default function ArtKeyPortalsPage() {
  const [portals, setPortals] = useState<ArtKeyPortal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [composing, setComposing] = useState<string | null>(null);
  const [composedResult, setComposedResult] = useState<ComposedResult | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    adminFetch('/api/admin/demos')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setPortals(data.demos || []);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load ArtKey Portals');
        setLoading(false);
      });
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ArtKey Portal? This cannot be undone.')) return;

    try {
      const response = await adminFetch(`/api/admin/demos?id=${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete');
      const listResponse = await adminFetch('/api/admin/demos');
      const listData = await listResponse.json();
      setPortals(listData.demos || []);
    } catch (err: any) {
      alert(err.message || 'Failed to delete portal');
    }
  };

  const handleCompose = async (token: string) => {
    setComposing(token);
    setComposedResult(null);
    try {
      const response = await adminFetch('/api/artkey/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_token: token }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate print file');
      setComposedResult({
        composedUrl: data.composedUrl,
        qrUrl: data.qrUrl,
        qrTargetUrl: data.qrTargetUrl,
      });
    } catch (err: any) {
      alert(err.message || 'Failed to generate print file');
    }
    setComposing(null);
  };

  const copyToClipboard = (text: string, token: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div>
      {/* Composed Result Modal */}
      {composedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-4">Print File Generated</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">ArtKey Composite</p>
                <img src={composedResult.composedUrl} alt="ArtKey with QR" className="w-full border border-gray-200 rounded-lg bg-gray-50" />
                <a href={composedResult.composedUrl} download target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-800">
                  Download
                </a>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Standalone QR</p>
                <img src={composedResult.qrUrl} alt="QR Code" className="w-full border border-gray-200 rounded-lg bg-white p-2" />
                <a href={composedResult.qrUrl} download target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-800">
                  Download QR
                </a>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-500 mb-1">QR points to:</p>
              <a href={composedResult.qrTargetUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 break-all">
                {composedResult.qrTargetUrl}
              </a>
            </div>
            <button onClick={() => setComposedResult(null)} className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ArtKey Portals</h1>
          <p className="text-gray-600 mt-1">Create and manage ArtKey portal websites. Each portal gets a unique secure URL and QR code.</p>
        </div>
        <Link
          href="/b_d_admn_tae/demos/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + Create Portal
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading portals...</p>
        </div>
      ) : portals.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-5xl mb-4">🔑</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No ArtKey Portals yet</h3>
          <p className="text-gray-600 mb-4">Create your first ArtKey Portal to generate a unique website with QR code.</p>
          <Link
            href="/b_d_admn_tae/demos/new"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Portal
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {portals.map((portal) => (
            <div key={portal.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left: Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{portal.title}</h3>
                  {portal.description && (
                    <p className="text-sm text-gray-500 mb-3">{portal.description}</p>
                  )}

                  {/* URL */}
                  <div className="mb-3">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Portal URL</label>
                    <div className="flex items-center gap-2 mt-1">
                      <a
                        href={portal.shareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 break-all"
                      >
                        {portal.shareUrl}
                      </a>
                      <button
                        onClick={() => copyToClipboard(portal.shareUrl, portal.token)}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 whitespace-nowrap"
                      >
                        {copiedToken === portal.token ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {/* Token */}
                  <div className="mb-3">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Token (32-char)</label>
                    <code className="block mt-1 bg-gray-50 px-3 py-1.5 rounded text-xs text-gray-700 font-mono break-all">
                      {portal.token}
                    </code>
                  </div>

                  {/* Created */}
                  <div className="text-xs text-gray-400">
                    Created: {portal.createdAt ? new Date(portal.createdAt).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>

                {/* Middle: QR Code */}
                <div className="flex-shrink-0">
                  {portal.qrCodeUrl ? (
                    <div className="text-center">
                      <img
                        src={portal.qrCodeUrl}
                        alt="QR Code"
                        className="border border-gray-200 rounded-lg"
                        style={{ width: '120px', height: '120px' }}
                      />
                      <a
                        href={portal.qrCodeUrl}
                        download={`qr-${portal.token}.png`}
                        className="mt-1 inline-block text-xs text-blue-600 hover:text-blue-800"
                      >
                        Download QR
                      </a>
                    </div>
                  ) : (
                    <div className="w-[120px] h-[120px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                      No QR
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <a
                    href={portal.shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium text-center"
                  >
                    View Portal
                  </a>
                  {portal.ownerToken && (
                    <a
                      href={`/art-key/edit/${portal.ownerToken}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium text-center"
                    >
                      Edit Portal
                    </a>
                  )}
                  <button
                    onClick={() => handleCompose(portal.token)}
                    disabled={composing === portal.token}
                    className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium disabled:opacity-50"
                  >
                    {composing === portal.token ? 'Generating...' : 'Generate Print File'}
                  </button>
                  <button
                    onClick={() => handleDelete(portal.id)}
                    className="px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
