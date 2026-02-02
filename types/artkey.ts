/**
 * ArtKey Type Definitions
 * Shared TypeScript interfaces for ArtKey Portal
 * Used across frontend components, API routes, and client helpers
 */

/**
 * Media types supported by the ArtKey system
 */
export type MediaType = "image" | "video" | "audio";

/**
 * ArtKey Feature Flags
 * Controls what sections and functionality are enabled for an ArtKey
 */
export interface ArtKeyFeatures {
  // Section visibility
  show_guestbook: boolean;
  enable_gallery: boolean;
  enable_video: boolean;
  enable_spotify: boolean;
  enable_custom_links: boolean;
  
  // Guest upload permissions
  allow_img_uploads: boolean;
  allow_vid_uploads: boolean;
  
  // Guestbook settings
  gb_btn_view: boolean;
  gb_signing_status: string; // 'open' | 'closed' | 'scheduled'
  gb_signing_start: string; // ISO date string
  gb_signing_end: string; // ISO date string
  gb_require_approval: boolean;
  require_email_for_guestbook?: boolean; // Optional: require email when posting
  
  // Media approval settings
  img_require_approval: boolean;
  vid_require_approval: boolean;
  
  // Section ordering
  order: string[];
  
  // Additional feature flags
  allow_comments_on_guestbook?: boolean; // Allow threaded replies
}

/**
 * ArtKey Theme/Settings
 * Visual configuration options for the ArtKey portal
 */
export interface ArtKeyTheme {
  template: string;
  bg_color: string;
  bg_image_id: number;
  bg_image_url: string;
  font: string;
  text_color: string;
  title_color: string;
  title_style: string; // 'solid' | 'gradient'
  button_color: string;
  button_gradient: string;
  color_scope: string;
}

/**
 * ArtKey Link
 * Custom link button in the portal
 */
export interface ArtKeyLink {
  label: string;
  url: string;
}

/**
 * ArtKey Spotify Integration
 */
export interface ArtKeySpotify {
  url: string;
  autoplay: boolean;
}

/**
 * ArtKey Featured Video
 */
export interface ArtKeyFeaturedVideo {
  video_url: string;
  button_label: string;
}

/**
 * ArtKey Customizations
 * Additional configuration options (skeleton key style, QR position, etc.)
 */
export interface ArtKeyCustomizations {
  skeleton_key?: string;
  qr_position?: string;
  demo?: boolean;
  description?: string;
  [key: string]: any; // Allow additional custom fields
}

/**
 * Guestbook Entry
 * Represents a guestbook entry or comment/reply
 */
export interface GuestbookEntry {
  id?: string;
  artkeyId?: string;
  parentId?: string | null; // For threaded comments/replies
  name: string;
  email?: string; // Optional email (required if features.require_email_for_guestbook === true)
  message: string;
  role: "guest" | "host"; // Distinguishes guest entries from host replies
  approved?: boolean;
  createdAt?: string;
  children?: GuestbookEntry[]; // Nested replies, for UI rendering
  media?: MediaItem[]; // Media attached to this entry
}

/**
 * Media Item
 * Represents an image, video, or audio file uploaded to an ArtKey
 */
export interface MediaItem {
  id?: string;
  artkeyId?: string;
  guestbookEntryId?: string | null; // Optional: media attached to a guestbook entry
  type: MediaType;
  url: string;
  caption?: string;
  approved?: boolean;
  createdAt?: string;
}

/**
 * ArtKey Public Data
 * Data structure returned for public portal view
 * Only includes approved content
 */
export interface ArtKeyPublicData {
  // Core ArtKey settings
  id: string;
  public_token: string;
  title: string;
  theme: ArtKeyTheme;
  features: ArtKeyFeatures;
  links: ArtKeyLink[];
  spotify: ArtKeySpotify;
  featured_video: ArtKeyFeaturedVideo | null;
  customizations: ArtKeyCustomizations;
  uploadedImages: string[]; // Legacy: array of image URLs
  uploadedVideos: string[]; // Legacy: array of video URLs
  
  // Public content (only approved)
  guestbook: GuestbookEntry[]; // Only approved entries, nested with children
  media: MediaItem[]; // Only approved media items
}

/**
 * ArtKey Owner Data
 * Data structure returned for owner/host management view
 * Includes both approved and pending content
 */
export interface ArtKeyOwnerData {
  // Core ArtKey settings (same as public)
  id: string;
  public_token: string;
  owner_token?: string; // Only included in owner view, never in public responses
  title: string;
  theme: ArtKeyTheme;
  features: ArtKeyFeatures;
  links: ArtKeyLink[];
  spotify: ArtKeySpotify;
  featured_video: ArtKeyFeaturedVideo | null;
  customizations: ArtKeyCustomizations;
  uploadedImages: string[];
  uploadedVideos: string[];
  
  // All content (approved + pending)
  allGuestbookEntries: GuestbookEntry[]; // All entries including pending, nested
  allMediaItems: MediaItem[]; // All media including pending
  
  // Statistics
  stats?: {
    guestbook: {
      total: number;
      approved: number;
      pending: number;
    };
    media: {
      total: number;
      approved: number;
      pending: number;
    };
  };
}

/**
 * Guestbook Post Payload
 * Data sent when posting a new guestbook entry
 */
export interface GuestbookPostPayload {
  name: string;
  email?: string; // Required if features.require_email_for_guestbook === true
  message: string;
  parentId?: string | null; // For replies
}

/**
 * Guestbook Moderation Payload
 * Data sent when moderating a guestbook entry
 */
export interface GuestbookModerationPayload {
  entryId: string;
  action: "approve" | "reject" | "delete";
}

/**
 * Media Moderation Payload
 * Data sent when moderating a media item
 */
export interface MediaModerationPayload {
  mediaId: string;
  action: "approve" | "reject" | "delete";
}

