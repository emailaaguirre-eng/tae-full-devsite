// Shared Asset Store (Zustand)
// Used by both pre-uploader and ProjectEditorDemo

import { create } from 'zustand';

export interface UploadedAsset {
  id: string;
  name: string;
  mimeType: string;
  width: number;
  height: number;
  src: string; // object URL or absolute URL
  origin: 'uploader' | 'editor'; // Where it was uploaded from
  objectUrl?: string; // If using URL.createObjectURL, store for cleanup
  file?: File; // Original file (for cleanup)
}

interface AssetStore {
  assets: UploadedAsset[];
  addAsset: (asset: UploadedAsset) => void;
  removeAsset: (assetId: string) => void;
  clearAssets: () => void;
}

export const useAssetStore = create<AssetStore>((set) => ({
  assets: [],

  addAsset: (asset) => {
    set((state) => ({
      assets: [...state.assets, asset],
    }));
  },

  removeAsset: (assetId) => {
    set((state) => {
      const asset = state.assets.find((a) => a.id === assetId);
      // Revoke object URL if it exists
      if (asset?.objectUrl) {
        URL.revokeObjectURL(asset.objectUrl);
      }
      return {
        assets: state.assets.filter((a) => a.id !== assetId),
      };
    });
  },

  clearAssets: () => {
    set((state) => {
      // Revoke all object URLs
      state.assets.forEach((asset) => {
        if (asset.objectUrl) {
          URL.revokeObjectURL(asset.objectUrl);
        }
      });
      return {
        assets: [],
      };
    });
  },
}));

