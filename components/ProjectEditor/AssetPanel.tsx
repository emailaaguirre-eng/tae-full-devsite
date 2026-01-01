"use client";

import { useState, useEffect, useRef } from 'react';
import { useAssetStore, type UploadedAsset } from '@/lib/assetStore';
// import { getPrintSpec } from '@/lib/printSpecs';
import { Upload } from 'lucide-react';

export default function AssetPanel() {
  const assets = useAssetStore((state) => state.assets);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const objectUrl = URL.createObjectURL(file);
      
      // Load image to get dimensions
      const img = new window.Image();
      img.onload = () => {
        const asset: UploadedAsset = {
          id: `asset-${Date.now()}-${Math.random()}`,
          name: file.name,
          mimeType: file.type,
          width: img.naturalWidth,
          height: img.naturalHeight,
          src: objectUrl,
          origin: 'editor',
          objectUrl,
          file,
        };

        useAssetStore.getState().addAsset(asset);
      };
      img.src = objectUrl;
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleThumbnailClick = (asset: UploadedAsset) => {
    // Note: AssetPanel is not currently used - assets are managed in ProjectEditor
    // This file may be removed or refactored
    console.warn('[AssetPanel] Thumbnail click not implemented - use ProjectEditor instead');
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Your Images</h3>
        <p className="text-xs text-gray-500 mb-2">Click an image to add it to the canvas</p>
        
        {/* Upload Button */}
        <label className="block w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors text-center mb-4">
          <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
          <span className="text-sm text-gray-600">Upload Images</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
        <p className="text-xs text-gray-500 mb-4">JPG, PNG, BMP</p>

        {/* Thumbnails */}
        {assets.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {assets.map((asset) => (
              <button
                key={asset.id}
                onClick={() => handleThumbnailClick(asset)}
                className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-all hover:shadow-md relative group"
              >
                <img
                  src={asset.src}
                  alt={asset.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-2 py-1 rounded">
                    Add to Canvas
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 text-center py-4">No images uploaded</p>
        )}
      </div>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-600">
          <div>Assets: {assets.length}</div>
        </div>
      )}
    </div>
  );
}

