'use client';

// Draft Store for Project Editor
// Persists editor state to IndexedDB for draft recovery

const DB_NAME = 'project-editor-drafts';
const STORE_NAME = 'drafts';
const DB_VERSION = 1;

// Minimal IndexedDB wrapper (no external dependencies)
async function openDB(): Promise<IDBDatabase | null> {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || !window.indexedDB) {
    console.warn('[DraftStore] IndexedDB not available (server-side or unsupported)');
    return null;
  }

  return new Promise((resolve, reject) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => {
        console.warn('[DraftStore] Failed to open IndexedDB:', request.error);
        resolve(null);
      };
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    } catch (error) {
      console.warn('[DraftStore] IndexedDB not available:', error);
      resolve(null);
    }
  });
}

export interface PersistedAsset {
  id: string;
  name: string;
  mimeType: string;
  width: number;
  height: number;
  dataUrl: string;
  bytesApprox: number;
}

export interface DraftData {
  version: number;
  productSlug: string;
  printSpecId?: string;
  activeSideId: string;
  includeGuides: boolean;
  guideVisibility: {
    showBleed: boolean;
    showTrim: boolean;
    showSafe: boolean;
    showFold: boolean;
    showQRTarget: boolean;
  };
  sideStateById: Record<string, {
    objects: any[];
    selectedId?: string;
    template?: any;
  }>;
  persistedAssets?: PersistedAsset[];
  assetsPartial?: boolean; // true if some assets couldn't be persisted due to size cap
  updatedAt: number;
}

// Size cap constant (60MB default)
export const DRAFT_ASSETS_SIZE_CAP = 60 * 1024 * 1024; // 60MB in bytes

/**
 * Save draft to IndexedDB
 */
export async function saveDraft(key: string, data: DraftData): Promise<boolean> {
  try {
    const db = await openDB();
    if (!db) {
      console.warn('[DraftStore] IndexedDB not available, draft not saved');
      return false;
    }

    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(data, key);

      request.onsuccess = () => {
        console.log('[DraftStore] Draft saved:', key);
        resolve(true);
      };

      request.onerror = () => {
        console.warn('[DraftStore] Failed to save draft:', request.error);
        resolve(false);
      };
    });
  } catch (error) {
    console.warn('[DraftStore] Error saving draft:', error);
    return false;
  }
}

/**
 * Load draft from IndexedDB
 */
export async function loadDraft(key: string): Promise<DraftData | null> {
  try {
    const db = await openDB();
    if (!db) {
      console.warn('[DraftStore] IndexedDB not available, draft not loaded');
      return null;
    }

    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          console.log('[DraftStore] Draft loaded:', key);
          resolve(result as DraftData);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.warn('[DraftStore] Failed to load draft:', request.error);
        resolve(null);
      };
    });
  } catch (error) {
    console.warn('[DraftStore] Error loading draft:', error);
    return null;
  }
}

/**
 * Delete draft from IndexedDB
 */
export async function deleteDraft(key: string): Promise<boolean> {
  try {
    const db = await openDB();
    if (!db) {
      console.warn('[DraftStore] IndexedDB not available, draft not deleted');
      return false;
    }

    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => {
        console.log('[DraftStore] Draft deleted:', key);
        resolve(true);
      };

      request.onerror = () => {
        console.warn('[DraftStore] Failed to delete draft:', request.error);
        resolve(false);
      };
    });
  } catch (error) {
    console.warn('[DraftStore] Error deleting draft:', error);
    return false;
  }
}

/**
 * Generate draft key from product slug
 */
export function getDraftKey(productSlug: string): string {
  return `draft-${productSlug}`;
}

