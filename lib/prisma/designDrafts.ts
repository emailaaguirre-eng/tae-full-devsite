/**
 * Design Drafts Helper Functions
 * Copyright (c) 2026 B&D Servicing LLC. All rights reserved.
 *
 * NOTE: Design drafts functionality is temporarily disabled.
 * The designDrafts table is not currently in the database schema.
 * These functions will throw errors if called.
 */

export type DesignDraftInput = {
  productId?: string;
  variantId?: string;
  printSpecId: string;
  dpi?: number;
  cornerStyle?: 'square' | 'rounded';
  cornerRadiusMm?: number;
  designJsonFront?: string | null;
  designJsonBack?: string | null;
  previewPngFront?: string | null;
  previewPngBack?: string | null;
  usedAssetIds?: string | null;
  premiumFees?: number;
  // Legacy format support
  designJsonBySide?: {
    front: string | null;
    back: string | null;
  };
  previewPngBySide?: {
    front: string | null;
    back: string | null;
  };
  sessionId?: string;
  userId?: string;
};

export async function createDesignDraft(input: DesignDraftInput): Promise<never> {
  throw new Error('Design drafts feature is not currently available - designDrafts table not in schema');
}

export async function getDesignDraft(draftId: string): Promise<null> {
  console.warn('Design drafts feature is not currently available - designDrafts table not in schema');
  return null;
}

export async function updateDesignDraft(
  draftId: string,
  updates: Partial<DesignDraftInput & { artKeyData?: string; status?: string }>
): Promise<never> {
  throw new Error('Design drafts feature is not currently available - designDrafts table not in schema');
}
