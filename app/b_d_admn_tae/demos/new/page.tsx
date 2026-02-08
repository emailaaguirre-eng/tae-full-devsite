"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch } from '@/lib/admin-fetch';

interface ComposedResult {
  composedUrl: string;
  qrUrl: string;
  qrTargetUrl: string;
}

export default function CreateArtKeyPortalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [createdPortal, setCreatedPortal] = useState<any>(null);
  const [composing, setComposing] = useState(false);
  const [composedResult, setComposedResult] = useState<ComposedResult | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const artKeyData = {
        title: formData.title,
        theme: {
          template: 'classic',
          bg_color: '#F6F7FB',
          bg_image_id: 0,
          bg_image_url: '',
          font: 'g:Playfair Display',
          text_color: '#111111',
          title_color: '#4f46e5',
          title_style: 'solid',
          button_color: '#4f46e5',
          button_gradient: '',
          color_scope: 'content',
        },
        links: [],
        spotify: { url: 'https://', autoplay: false },
        featured_video: null,
        features: {
          enable_gallery: true,
          enable_video: true,
          show_guestbook: true,
          enable_custom_links: false,
          enable_spotify: false,
          allow_img_uploads: true,
          allow_vid_uploads: true,
          gb_btn_view: true,
          gb_signing_status: 'open',
          gb_signing_start: '',
          gb_signing_end: '',
          gb_require_approval: false,
          img_require_approval: false,
          vid_require_approval: false,
          order: ['gallery', 'guestbook', 'video'],
        },
        uploadedImages: [],
        uploadedVideos: [],
        customizations: {
          demo: true,
          description: formData.description || '',
        },
      };

      const response = await adminFetch('/api/admin/demos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          artKeyData,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create portal');

      setCreatedPortal(data.demo);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create ArtKey Portal');
    } finally {
      setLoading(false);
    }
  };

  const handleCompose = async () => {
    if (!createdPortal) return;
    setComposing(true);
    try {
      const res = await adminFetch('/api/artkey/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_token: createdPortal.token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setComposedResult({ composedUrl: data.composedUrl, qrUrl: data.qrUrl, qrTargetUrl: data.qrTargetUrl });
    } catch (err: any) {
      alert(err.message || 'Failed to generate print file');
    }
    setComposing(false);
  };

  const copyUrl = () => {
    if (createdPortal) {
      navigator.clipboard.writeText(createdPortal.shareUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  if (success && createdPortal) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6 text-gray-900">ArtKey Portal Created</h1>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-lg">
              ✓
            </div>
            <h2 className="text-xl font-semibold text-green-800">{createdPortal.title}</h2>
          </div>
          
          <div className="space-y-4">
            {/* Portal URL */}
            <div className="bg-white rounded-lg p-4 border border-green-100">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Portal URL (32-character secure token)</label>
              <div className="flex items-center gap-2 mt-1">
                <a
                  href={createdPortal.shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 break-all text-sm"
                >
                  {createdPortal.shareUrl}
                </a>
                <button
                  onClick={copyUrl}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 whitespace-nowrap"
                >
                  {copiedUrl ? 'Copied!' : 'Copy URL'}
                </button>
              </div>
            </div>

            {/* Token */}
            <div className="bg-white rounded-lg p-4 border border-green-100">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Public Token</label>
              <code className="block mt-1 bg-gray-50 px-3 py-2 rounded text-sm font-mono text-gray-700 break-all">
                {createdPortal.token}
              </code>
            </div>

            {/* QR Code */}
            {createdPortal.qrCodeUrl && (
              <div className="bg-white rounded-lg p-4 border border-green-100">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">QR Code</label>
                <div className="mt-2 flex items-start gap-4">
                  <img
                    src={createdPortal.qrCodeUrl}
                    alt="QR Code"
                    className="border border-gray-200 rounded"
                    style={{ maxWidth: '200px' }}
                  />
                  <div className="text-sm text-gray-600">
                    <p>This QR code links to the portal URL above.</p>
                    <p className="mt-1">Scan it to open the ArtKey Portal.</p>
                    <a
                      href={createdPortal.qrCodeUrl}
                      download={`qr-${createdPortal.token}.png`}
                      className="mt-2 inline-block text-blue-600 hover:text-blue-800"
                    >
                      Download QR Code
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Composed Print File */}
            {composedResult && (
              <div className="bg-white rounded-lg p-4 border border-orange-100">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Print-Ready ArtKey</label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">ArtKey Composite</p>
                    <img src={composedResult.composedUrl} alt="ArtKey with QR" className="w-full border border-gray-200 rounded bg-gray-50" />
                    <a href={composedResult.composedUrl} download target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs text-blue-600 hover:text-blue-800">Download</a>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Standalone QR</p>
                    <img src={composedResult.qrUrl} alt="QR Code" className="w-full border border-gray-200 rounded bg-white p-2" />
                    <a href={composedResult.qrUrl} download target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs text-blue-600 hover:text-blue-800">Download</a>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={createdPortal.shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              View Portal
            </a>
            {createdPortal.ownerToken && (
              <a
                href={`/art-key/edit/${createdPortal.ownerToken}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                Edit Portal
              </a>
            )}
            <button
              onClick={handleCompose}
              disabled={composing}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 font-medium"
            >
              {composing ? 'Generating...' : 'Generate Print File'}
            </button>
            <button
              onClick={() => router.push('/b_d_admn_tae/demos')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
            >
              Back to Portals
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create ArtKey Portal</h1>
          <p className="text-gray-600 mt-1">Creates a unique portal website with a 32-character secure URL and QR code.</p>
        </div>
        <button
          onClick={() => router.push('/b_d_admn_tae/demos')}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Portal Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Sarah & John's Wedding, Holiday Greeting 2026"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Internal notes about this portal"
            />
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">What happens when you create a portal:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>1. A unique 32-character secure URL token is generated</li>
              <li>2. A QR code is created that links to the portal URL</li>
              <li>3. The portal is live immediately at the generated URL</li>
              <li>4. You can edit the portal content using the owner link</li>
              <li>5. Products with QR requirements use the ArtKey template with the QR code embedded</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || !formData.title.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Creating Portal...' : 'Create ArtKey Portal'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/b_d_admn_tae/demos')}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
