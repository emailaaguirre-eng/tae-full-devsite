// Shared Asset Store (Zustand)
// Used by both pre-uploader and ProjectEditorDemo

import { create } from 'zustand';
import type { PersistedAsset } from './draftStore';

export interface UploadedAsset {
  id: string;
  name: string;
  mimeType: string;
  width: number;
  height: number;
  src: string; // data URL, object URL, or absolute URL
  origin: 'uploader' | 'editor' | 'restored'; // Where it came from
  objectUrl?: string; // If using URL.createObjectURL, store for cleanup
  file?: File; // Original file (for cleanup)
  dataUrl?: string; // Data URL if persisted
  bytesApprox?: number; // Approximate size in bytes
}

interface AssetStore {
  assets: UploadedAsset[];
  addAsset: (asset: UploadedAsset) => void;
  addAssetFromPersisted: (persisted: PersistedAsset) => void;
  removeAsset: (assetId: string) => void;
  clearAssets: () => void;
  getTotalBytes: () => number;
}

// Lazy initialization to prevent SSR issues
let storeInstance: ReturnType<typeof create<AssetStore>> | null = null;

function getAssetStore() {
  if (typeof window === 'undefined') {
    // Return a mock store for SSR
    return {
      assets: [],
      addAsset: () => {},
      addAssetFromPersisted: () => {},
      removeAsset: () => {},
      clearAssets: () => {},
      getTotalBytes: () => 0,
    } as any;
  }
  
  if (!storeInstance) {
    storeInstance = create<AssetStore>((set, get) => ({
  assets: [],

  addAsset: (asset) => {
    set((state) => ({
      assets: [...state.assets, asset],
    }));
  },

  addAssetFromPersisted: (persisted: PersistedAsset) => {
    const asset: UploadedAsset = {
      id: persisted.id,
      name: persisted.name,
      mimeType: persisted.mimeType,
      width: persisted.width,
      height: persisted.height,
      src: persisted.dataUrl, // Use data URL as src
      origin: 'restored',
      dataUrl: persisted.dataUrl,
      bytesApprox: persisted.bytesApprox,
    };
    set((state) => ({
      assets: [...state.assets, asset],
    }));
  },

  removeAsset: (assetId: string) => {
    set((state) => {
      const asset = state.assets.find((a) => a.id === assetId);
      // Revoke object URL if it exists (browser only)
      if (asset?.objectUrl && typeof window !== 'undefined' && window.URL) {
        window.URL.revokeObjectURL(asset.objectUrl);
      }
      return {
        assets: state.assets.filter((a) => a.id !== assetId),
      };
    });
  },

  clearAssets: () => {
    set((state) => {
      // Revoke all object URLs (browser only)
      if (typeof window !== 'undefined' && window.URL) {
        state.assets.forEach((asset) => {
          if (asset.objectUrl) {
            window.URL.revokeObjectURL(asset.objectUrl);
          }
        });
      }
      return {
        assets: [],
      };
    });
  },

  getTotalBytes: () => {
    return get().assets.reduce((total, asset) => {
      return total + (asset.bytesApprox || 0);
    }, 0);
  },
    }));
  }
  return storeInstance;
}

export const useAssetStore = getAssetStore();
