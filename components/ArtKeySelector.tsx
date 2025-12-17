"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface ArtKey {
  id: string;
  token: string;
  shareUrl: string;
  qrCodeUrl?: string;
  productId?: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface ArtKeySelectorProps {
  userId?: string;
  sessionId?: string;
  onSelect: (artKey: ArtKey) => void;
  onCancel: () => void;
  currentArtKeyId?: string;
}

/**
 * Component for selecting an existing ArtKey to reuse
 */
export default function ArtKeySelector({
  userId,
  sessionId,
  onSelect,
  onCancel,
  currentArtKeyId,
}: ArtKeySelectorProps) {
  const [artKeys, setArtKeys] = useState<ArtKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadArtKeys();
  }, [userId, sessionId]);

  async function loadArtKeys() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (sessionId) params.append('sessionId', sessionId);

      const response = await fetch(`/api/artkey/store?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to load ArtKeys');
      }

      const data = await response.json();
      setArtKeys(data.artKeys || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load ArtKeys');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-dark mb-4"></div>
            <p>Loading your ArtKeys...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={onCancel}
              className="bg-brand-medium text-white px-6 py-2 rounded-full"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold text-brand-darkest">Select an ArtKey to Reuse</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* ArtKeys Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {artKeys.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">You don&apos;t have any saved ArtKeys yet.</p>
              <p className="text-sm text-gray-500">Create your first ArtKey to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {artKeys.map((artKey) => (
                <div
                  key={artKey.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg ${
                    currentArtKeyId === artKey.id
                      ? 'border-brand-medium bg-brand-lightest'
                      : 'border-gray-200 hover:border-brand-medium'
                  }`}
                  onClick={() => onSelect(artKey)}
                >
                  {/* QR Code Preview */}
                  {artKey.qrCodeUrl ? (
                    <div className="mb-3 flex justify-center">
                      <img
                        src={artKey.qrCodeUrl}
                        alt="QR Code"
                        className="w-24 h-24"
                      />
                    </div>
                  ) : (
                    <div className="mb-3 h-24 bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-gray-400 text-sm">No Preview</span>
                    </div>
                  )}

                  {/* ArtKey Info */}
                  <h3 className="font-semibold text-brand-darkest mb-1 truncate">
                    {artKey.title}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">
                    {new Date(artKey.updatedAt).toLocaleDateString()}
                  </p>

                  {/* Selected Indicator */}
                  {currentArtKeyId === artKey.id && (
                    <div className="mt-2 text-sm text-brand-medium font-medium">
                      ✓ Currently Selected
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          {artKeys.length > 0 && (
            <button
              onClick={() => {
                // Create new ArtKey instead
                onCancel();
              }}
              className="px-6 py-2 bg-brand-medium text-white rounded-full hover:bg-brand-dark"
            >
              Create New ArtKey
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

