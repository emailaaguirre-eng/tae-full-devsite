/**
 * Database client and utilities for TAE
 * Uses Drizzle ORM for type-safe database access
 */

// Re-export the Drizzle database connection and schema
export { db, getDb, saveDatabase } from '@/db';
export * from '@/db/schema';

// Re-export drizzle-orm operators for convenience
export { eq, and, or, desc, asc, like, isNull, isNotNull, inArray, sql } from 'drizzle-orm';

/**
 * Generate a short, URL-friendly public token
 * Format: 8 characters, alphanumeric (lowercase + numbers)
 */
export function generatePublicToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a longer, secret owner token
 * Format: 32 characters, alphanumeric (mixed case + numbers)
 */
export function generateOwnerToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a unique ID (cuid-like)
 */
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `${timestamp}${randomPart}`;
}

/**
 * Type definitions matching ArtKeyEditor structure
 */
export interface ArtKeyTheme {
  template: string;
  bg_color: string;
  bg_image_id: number;
  bg_image_url: string;
  font: string;
  text_color: string;
  title_color: string;
  title_style: string;
  button_color: string;
  button_gradient: string;
  color_scope: string;
}

export interface ArtKeyFeatures {
  enable_gallery: boolean;
  enable_video: boolean;
  show_guestbook: boolean;
  enable_custom_links: boolean;
  enable_spotify: boolean;
  allow_img_uploads: boolean;
  allow_vid_uploads: boolean;
  gb_btn_view: boolean;
  gb_signing_status: string;
  gb_signing_start: string;
  gb_signing_end: string;
  gb_require_approval: boolean;
  img_require_approval: boolean;
  vid_require_approval: boolean;
  order: string[];
}

export interface ArtKeyLink {
  label: string;
  url: string;
}

export interface ArtKeySpotify {
  url: string;
  autoplay: boolean;
}

export interface ArtKeyFeaturedVideo {
  video_url: string;
  button_label: string;
}

export interface ArtKeyData {
  title: string;
  theme: ArtKeyTheme;
  links: ArtKeyLink[];
  spotify: ArtKeySpotify;
  featured_video: ArtKeyFeaturedVideo | null;
  features: ArtKeyFeatures;
  uploadedImages: string[];
  uploadedVideos: string[];
  customizations: Record<string, any>;
}
