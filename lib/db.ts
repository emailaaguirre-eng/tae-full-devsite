/**
 * Database client and utilities for ArtKey Portal
 * Uses Prisma for type-safe database access
 */

import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Generate a unique public token for ArtKey URLs
 * Format: 32 characters, alphanumeric (lowercase + numbers)
 */
export function generatePublicToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
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
  gb_public_view: boolean; // Allow public to view guestbook entries
  gallery_public_view: boolean; // Allow public to view gallery/media
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

