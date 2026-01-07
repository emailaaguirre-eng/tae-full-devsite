'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type DesignDraft = {
  id: string;
  productId: string | null;
  variantId: string | null;
  printSpecId: string;
  dpi: number;
  cornerStyle: string;
  cornerRadiusMm: number;
  designJsonBySide: {
    front: string | null;
    back: string | null;
  };
  previewPngBySide: {
    front: string | null;
    back: string | null;
  };
  artKeyData: any;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type ArtKeyFormData = {
  title: string;
  message: string;
  media: string[];
  guestbookSettings: {
    enabled: boolean;
    requireApproval: boolean;
  };
};

export default function ArtKeyEditorPage() {
  const params = useParams();
  const router = useRouter();
  const draftId = params.draftId as string;

  const [draft, setDraft] = useState<DesignDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ArtKeyFormData>({
    title: '',
    message: '',
    media: [],
    guestbookSettings: {
      enabled: true,
      requireApproval: false,
    },
  });

  // Load draft on mount
  useEffect(() => {
    async function loadDraft() {
      try {
        const response = await fetch(`/api/design-drafts/${draftId}`);
        if (!response.ok) {
          throw new Error('Failed to load draft');
        }
        const data = await response.json();
        setDraft(data);

        // Load existing ArtKey data if present
        if (data.artKeyData) {
          setFormData({
            title: data.artKeyData.title || '',
            message: data.artKeyData.message || '',
            media: data.artKeyData.media || [],
            guestbookSettings: data.artKeyData.guestbookSettings || {
              enabled: true,
              requireApproval: false,
            },
          });
        }
      } catch (error: any) {
        console.error('[ArtKeyEditor] Load error:', error);
        alert(`Failed to load draft: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }

    if (draftId) {
      loadDraft();
    }
  }, [draftId]);

  async function handleSave() {
    if (saving) return;

    setSaving(true);

    try {
      const artKeyData = {
        title: formData.title,
        message: formData.message,
        media: formData.media,
        guestbookSettings: formData.guestbookSettings,
      };

      const response = await fetch(`/api/design-drafts/${draftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artKeyData,
          status: 'artkey_complete',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save ArtKey data');
      }

      alert('ArtKey portal saved successfully!');
      // Optionally navigate to checkout or next step
      // router.push(`/checkout?draftId=${draftId}`);
    } catch (error: any) {
      console.error('[ArtKeyEditor] Save error:', error);
      alert(`Failed to save: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading draft...</div>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">Draft not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h1 className="text-2xl font-bold mb-6">Design Your ArtKey Portal</h1>

          {/* Design Preview */}
          <div className="mb-8 border-b pb-6">
            <h2 className="text-lg font-semibold mb-4">Your Design Preview</h2>
            <div className="grid grid-cols-2 gap-4">
              {draft.previewPngBySide.front && (
                <div>
                  <div className="text-sm text-neutral-500 mb-2">Front</div>
                  <img
                    src={draft.previewPngBySide.front}
                    alt="Front design"
                    className="border rounded w-full"
                  />
                </div>
              )}
              {draft.previewPngBySide.back && (
                <div>
                  <div className="text-sm text-neutral-500 mb-2">Back</div>
                  <img
                    src={draft.previewPngBySide.back}
                    alt="Back design"
                    className="border rounded w-full"
                  />
                </div>
              )}
            </div>
          </div>

          {/* ArtKey Form */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Portal Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Welcome to Our Wedding"
                className="w-full px-3 py-2 border rounded-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Welcome Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Write a message for your guests..."
                rows={6}
                className="w-full px-3 py-2 border rounded-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Media Gallery</label>
              <div className="text-sm text-neutral-500 mb-2">
                Upload images or videos to share with your guests
              </div>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => {
                  // TODO: Implement file upload
                  console.log('File upload not yet implemented');
                }}
                className="w-full px-3 py-2 border rounded-none"
              />
              {formData.media.length > 0 && (
                <div className="mt-2 text-sm text-neutral-600">
                  {formData.media.length} file(s) uploaded
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Guestbook Settings</h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.guestbookSettings.enabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        guestbookSettings: {
                          ...formData.guestbookSettings,
                          enabled: e.target.checked,
                        },
                      })
                    }
                    className="mr-2"
                  />
                  <span>Enable guestbook</span>
                </label>
                {formData.guestbookSettings.enabled && (
                  <label className="flex items-center ml-6">
                    <input
                      type="checkbox"
                      checked={formData.guestbookSettings.requireApproval}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          guestbookSettings: {
                            ...formData.guestbookSettings,
                            requireApproval: e.target.checked,
                          },
                        })
                      }
                      className="mr-2"
                    />
                    <span>Require approval for guestbook entries</span>
                  </label>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={handleSave}
                disabled={saving || !formData.title || !formData.message}
                className="px-6 py-2 bg-green-600 text-white rounded-none font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save ArtKey Portal'}
              </button>
              <button
                onClick={() => router.back()}
                className="px-6 py-2 border rounded-none"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
