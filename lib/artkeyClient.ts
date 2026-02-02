/**
 * ArtKey Client Helper Functions
 * Typed client-side API helpers for ArtKey Portal
 * These functions provide a clean, type-safe interface to the ArtKey API routes
 */

import type {
  ArtKeyPublicData,
  ArtKeyOwnerData,
  GuestbookEntry,
  GuestbookPostPayload,
  GuestbookModerationPayload,
  MediaItem,
  MediaModerationPayload,
} from '@/types/artkey';

/**
 * Fetch public ArtKey data for portal display
 * Returns only approved guestbook entries and media
 * 
 * @param publicToken - The public token from the URL (e.g., "rkN93dX4")
 * @returns ArtKey data with approved content only
 */
export async function fetchArtKeyPublic(
  publicToken: string
): Promise<ArtKeyPublicData> {
  const response = await fetch(`/api/artkey/${publicToken}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch ArtKey' }));
    throw new Error(error.error || `Failed to fetch ArtKey: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Transform the API response to match ArtKeyPublicData shape
  return {
    id: data.id,
    public_token: data.public_token,
    title: data.title,
    theme: data.theme,
    features: data.features,
    links: data.links || [],
    spotify: data.spotify || { url: 'https://', autoplay: false },
    featured_video: data.featured_video || null,
    customizations: data.customizations || {},
    uploadedImages: data.uploadedImages || [],
    uploadedVideos: data.uploadedVideos || [],
    guestbook: data.guestbook?.entries || [],
    media: data.media?.all || [],
  };
}

/**
 * Fetch owner ArtKey data for management view
 * Returns all guestbook entries and media (approved + pending)
 * 
 * @param ownerToken - The secret owner token for management access
 * @returns ArtKey data with all content for moderation
 */
export async function fetchArtKeyOwner(
  ownerToken: string
): Promise<ArtKeyOwnerData> {
  const response = await fetch(`/api/manage/artkey/${ownerToken}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch ArtKey' }));
    throw new Error(error.error || `Failed to fetch ArtKey: ${response.status}`);
  }
  
  // The owner endpoint doesn't exist as a single route, so we need to fetch from separate endpoints
  // For now, we'll fetch guestbook and media separately and combine them
  // Note: This is a workaround - ideally there would be a single owner endpoint
  
  const [guestbookRes, mediaRes] = await Promise.all([
    fetch(`/api/manage/artkey/${ownerToken}/guestbook`),
    fetch(`/api/manage/artkey/${ownerToken}/media`),
  ]);
  
  if (!guestbookRes.ok || !mediaRes.ok) {
    const error = await guestbookRes.json().catch(() => ({ error: 'Failed to fetch ArtKey' }));
    throw new Error(error.error || `Failed to fetch ArtKey: ${guestbookRes.status}`);
  }
  
  const guestbookData = await guestbookRes.json();
  const mediaData = await mediaRes.json();
  
  // Transform the API responses to match ArtKeyOwnerData shape
  return {
    id: guestbookData.artkey_id || mediaData.artkey_id,
    public_token: guestbookData.public_token || mediaData.public_token,
    owner_token: ownerToken, // Include the token we used
    title: guestbookData.artkey_title || mediaData.artkey_title,
    theme: {}, // Not included in current API responses - would need to fetch separately
    features: {}, // Not included in current API responses - would need to fetch separately
    links: [],
    spotify: { url: 'https://', autoplay: false },
    featured_video: null,
    customizations: {},
    uploadedImages: [],
    uploadedVideos: [],
    allGuestbookEntries: guestbookData.entries || [],
    allMediaItems: mediaData.media?.all || [],
    stats: {
      guestbook: guestbookData.stats || { total: 0, approved: 0, pending: 0 },
      media: mediaData.stats || { total: 0, approved: 0, pending: 0 },
    },
  };
}

/**
 * Post a new guestbook entry (top-level or reply)
 * 
 * @param publicToken - The public token of the ArtKey
 * @param payload - Guestbook entry data (name, email, message, optional parentId for replies)
 * @returns The created guestbook entry
 */
export async function postGuestbookEntry(
  publicToken: string,
  payload: GuestbookPostPayload
): Promise<GuestbookEntry> {
  const response = await fetch(`/api/artkey/${publicToken}/guestbook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      message: payload.message,
      parent_id: payload.parentId || null,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to post guestbook entry' }));
    throw new Error(error.error || `Failed to post guestbook entry: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Transform response to GuestbookEntry shape
  return {
    id: data.entry?.id,
    name: data.entry?.name || payload.name,
    email: payload.email,
    message: data.entry?.message || payload.message,
    parentId: data.entry?.parentId || payload.parentId || null,
    role: 'guest', // Guest entries are always role 'guest'
    approved: data.entry?.approved ?? false,
    createdAt: data.entry?.createdAt || new Date().toISOString(),
  };
}

/**
 * Moderate a guestbook entry (approve, reject, or delete)
 * Only accessible with owner token
 * 
 * @param ownerToken - The owner token for authentication
 * @param payload - Moderation action (entryId and action: "approve" | "reject" | "delete")
 * @returns void on success
 */
export async function moderateGuestbookEntry(
  ownerToken: string,
  payload: GuestbookModerationPayload
): Promise<void> {
  const response = await fetch(`/api/manage/artkey/${ownerToken}/guestbook/moderate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      entry_id: payload.entryId,
      action: payload.action,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to moderate entry' }));
    throw new Error(error.error || `Failed to moderate entry: ${response.status}`);
  }
}

/**
 * Fetch public media items for an ArtKey
 * Returns only approved media
 * 
 * @param publicToken - The public token of the ArtKey
 * @returns Array of approved media items
 */
export async function fetchMediaPublic(
  publicToken: string
): Promise<MediaItem[]> {
  const response = await fetch(`/api/artkey/${publicToken}/media`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch media' }));
    throw new Error(error.error || `Failed to fetch media: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Transform response to MediaItem array
  return (data.media || []).map((item: any) => ({
    id: item.id,
    type: item.type,
    url: item.url,
    caption: item.caption || null,
    approved: item.approved ?? true, // Public endpoint only returns approved
    createdAt: item.createdAt,
  }));
}

/**
 * Moderate a media item (approve, reject, or delete)
 * Only accessible with owner token
 * 
 * @param ownerToken - The owner token for authentication
 * @param payload - Moderation action (mediaId and action: "approve" | "reject" | "delete")
 * @returns void on success
 */
export async function moderateMediaItem(
  ownerToken: string,
  payload: MediaModerationPayload
): Promise<void> {
  const response = await fetch(`/api/manage/artkey/${ownerToken}/media`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      media_id: payload.mediaId,
      action: payload.action,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to moderate media' }));
    throw new Error(error.error || `Failed to moderate media: ${response.status}`);
  }
}

