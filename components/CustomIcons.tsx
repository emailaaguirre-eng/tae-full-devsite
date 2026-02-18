"use client";

/**
 * Custom Icon System - Hand-drawn style SVG icons
 * Replaces emojis with custom, human-designed icons
 * © 2026 B&D Servicing LLC. All rights reserved.
 */

import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  strokeWidth?: number;
}

// Hand-drawn style - slightly imperfect, organic
const strokeStyle = {
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  vectorEffect: 'non-scaling-stroke' as const,
};

// Art/Palette Icon - replaces 🎨
export function ArtIcon({ size = 24, color = 'currentColor', className = '', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={{ stroke: color }}>
      <path d="M3 21h18" strokeWidth={strokeWidth} {...strokeStyle} />
      <path d="M5 21V7l8-4v18" strokeWidth={strokeWidth} {...strokeStyle} />
      <path d="M19 21V11l-6-4" strokeWidth={strokeWidth} {...strokeStyle} />
      <circle cx="6.5" cy="12.5" r="1.5" fill={color} />
      <circle cx="12.5" cy="8.5" r="1.5" fill={color} />
      <circle cx="17.5" cy="15.5" r="1.5" fill={color} />
    </svg>
  );
}

// Sparkle/Star Icon - replaces ✨
export function SparkleIcon({ size = 24, color = 'currentColor', className = '', strokeWidth = 1.5 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={{ stroke: color }}>
      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" 
        strokeWidth={strokeWidth} {...strokeStyle} fill={color} opacity="0.2" />
      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" 
        strokeWidth={strokeWidth} {...strokeStyle} />
    </svg>
  );
}

// Sports/Football Icon - replaces 🏈
export function SportsIcon({ size = 24, color = 'currentColor', className = '', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={{ stroke: color }}>
      <ellipse cx="12" cy="12" rx="8" ry="5" strokeWidth={strokeWidth} {...strokeStyle} />
      <path d="M4 12h16" strokeWidth={strokeWidth} {...strokeStyle} />
      <path d="M8 9l-2 3 2 3" strokeWidth={strokeWidth} {...strokeStyle} />
      <path d="M16 9l2 3-2 3" strokeWidth={strokeWidth} {...strokeStyle} />
    </svg>
  );
}

// Lightbulb/Idea Icon - replaces 💡
export function IdeaIcon({ size = 24, color = 'currentColor', className = '', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={{ stroke: color }}>
      <path d="M12 2v4" strokeWidth={strokeWidth} {...strokeStyle} />
      <path d="M12 18v4" strokeWidth={strokeWidth} {...strokeStyle} />
      <path d="M4.93 4.93l2.83 2.83" strokeWidth={strokeWidth} {...strokeStyle} />
      <path d="M16.24 16.24l2.83 2.83" strokeWidth={strokeWidth} {...strokeStyle} />
      <path d="M2 12h4" strokeWidth={strokeWidth} {...strokeStyle} />
      <path d="M18 12h4" strokeWidth={strokeWidth} {...strokeStyle} />
      <path d="M4.93 19.07l2.83-2.83" strokeWidth={strokeWidth} {...strokeStyle} />
      <path d="M16.24 7.76l2.83-2.83" strokeWidth={strokeWidth} {...strokeStyle} />
      <circle cx="12" cy="12" r="3" strokeWidth={strokeWidth} {...strokeStyle} fill={color} opacity="0.1" />
    </svg>
  );
}

// Upload Icon - replaces 📤
export function UploadIcon({ size = 24, color = 'currentColor', className = '', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={{ stroke: color }}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth={strokeWidth} {...strokeStyle} />
      <polyline points="17 8 12 3 7 8" strokeWidth={strokeWidth} {...strokeStyle} />
      <line x1="12" y1="3" x2="12" y2="15" strokeWidth={strokeWidth} {...strokeStyle} />
    </svg>
  );
}

// Note/Writing Icon - replaces 📝
export function NoteIcon({ size = 24, color = 'currentColor', className = '', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={{ stroke: color }}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth={strokeWidth} {...strokeStyle} />
      <polyline points="14 2 14 8 20 8" strokeWidth={strokeWidth} {...strokeStyle} />
      <line x1="9" y1="15" x2="15" y2="15" strokeWidth={strokeWidth} {...strokeStyle} />
      <line x1="9" y1="12" x2="15" y2="12" strokeWidth={strokeWidth} {...strokeStyle} />
    </svg>
  );
}

// Music/Playlist Icon - replaces 🎵
export function MusicIcon({ size = 24, color = 'currentColor', className = '', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={{ stroke: color }}>
      <circle cx="6" cy="18" r="3" strokeWidth={strokeWidth} {...strokeStyle} fill={color} opacity="0.2" />
      <circle cx="18" cy="16" r="3" strokeWidth={strokeWidth} {...strokeStyle} fill={color} opacity="0.2" />
      <path d="M9 18V5l12-2v13" strokeWidth={strokeWidth} {...strokeStyle} />
    </svg>
  );
}

// Video Icon - replaces 🎬
export function VideoIcon({ size = 24, color = 'currentColor', className = '', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={{ stroke: color }}>
      <rect x="2" y="4" width="16" height="12" rx="2" strokeWidth={strokeWidth} {...strokeStyle} />
      <polygon points="10 8 16 12 10 16 10 8" fill={color} opacity="0.8" />
    </svg>
  );
}

// Gallery/Image Icon - replaces 🖼️
export function GalleryIcon({ size = 24, color = 'currentColor', className = '', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={{ stroke: color }}>
      <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={strokeWidth} {...strokeStyle} />
      <circle cx="8.5" cy="8.5" r="1.5" fill={color} opacity="0.3" />
      <path d="M21 15l-5-5L5 21" strokeWidth={strokeWidth} {...strokeStyle} />
    </svg>
  );
}

// Shopping Cart Icon - replaces 🛒
export function CartIcon({ size = 24, color = 'currentColor', className = '', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={{ stroke: color }}>
      <circle cx="9" cy="21" r="1" strokeWidth={strokeWidth} {...strokeStyle} fill={color} />
      <circle cx="20" cy="21" r="1" strokeWidth={strokeWidth} {...strokeStyle} fill={color} />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" strokeWidth={strokeWidth} {...strokeStyle} />
    </svg>
  );
}

// Checkmark/Success Icon
export function CheckIcon({ size = 24, color = 'currentColor', className = '', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={{ stroke: color }}>
      <path d="M20 6L9 17l-5-5" strokeWidth={strokeWidth} {...strokeStyle} />
    </svg>
  );
}

// Alert/Warning Icon
export function AlertIcon({ size = 24, color = 'currentColor', className = '', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={{ stroke: color }}>
      <path d="M12 9v4" strokeWidth={strokeWidth} {...strokeStyle} />
      <path d="M12 17h.01" strokeWidth={strokeWidth} {...strokeStyle} />
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeWidth={strokeWidth} {...strokeStyle} />
    </svg>
  );
}

// Key Icon - replaces 🔑
export function KeyIcon({ size = 24, color = 'currentColor', className = '', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={{ stroke: color }}>
      <circle cx="8" cy="15" r="5" strokeWidth={strokeWidth} {...strokeStyle} />
      <path d="M12 11l8-8" strokeWidth={strokeWidth} {...strokeStyle} />
      <path d="M17 3l3 3" strokeWidth={strokeWidth} {...strokeStyle} />
      <path d="M15 7l-2 2" strokeWidth={strokeWidth} {...strokeStyle} />
    </svg>
  );
}

// Camera/Photo Icon - replaces 📸
export function CameraIcon({ size = 24, color = 'currentColor', className = '', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={{ stroke: color }}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" strokeWidth={strokeWidth} {...strokeStyle} />
      <circle cx="12" cy="13" r="4" strokeWidth={strokeWidth} {...strokeStyle} />
    </svg>
  );
}

// Handshake Icon - replaces 🤝
export function HandshakeIcon({ size = 24, color = 'currentColor', className = '', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={{ stroke: color }}>
      <path d="M20 11L14.5 5.5C14 5 13 5 12.5 5.5L4 14" strokeWidth={strokeWidth} {...strokeStyle} />
      <path d="M4 14l6.5 6.5c.5.5 1.5.5 2 0L20 13" strokeWidth={strokeWidth} {...strokeStyle} />
      <path d="M2 10l4 4" strokeWidth={strokeWidth} {...strokeStyle} />
      <path d="M18 8l4 4" strokeWidth={strokeWidth} {...strokeStyle} />
    </svg>
  );
}

// Pen/Guestbook Icon - replaces ✍️
export function PenIcon({ size = 24, color = 'currentColor', className = '', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={{ stroke: color }}>
      <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" strokeWidth={strokeWidth} {...strokeStyle} />
      <path d="M15 5l4 4" strokeWidth={strokeWidth} {...strokeStyle} />
    </svg>
  );
}

// Thought/Share Interests Icon - replaces 💭
export function ThoughtIcon({ size = 24, color = 'currentColor', className = '', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={{ stroke: color }}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" strokeWidth={strokeWidth} {...strokeStyle} />
    </svg>
  );
}

// Icon Registry for easy access
export const CustomIcons = {
  art: ArtIcon,
  sparkle: SparkleIcon,
  sports: SportsIcon,
  idea: IdeaIcon,
  upload: UploadIcon,
  note: NoteIcon,
  music: MusicIcon,
  video: VideoIcon,
  gallery: GalleryIcon,
  cart: CartIcon,
  check: CheckIcon,
  alert: AlertIcon,
  key: KeyIcon,
  camera: CameraIcon,
  handshake: HandshakeIcon,
  pen: PenIcon,
  thought: ThoughtIcon,
} as const;

export type CustomIconKey = keyof typeof CustomIcons;

// Helper component to render icons by key
export function CustomIcon({ 
  name, 
  size = 24, 
  color = 'currentColor', 
  className = '',
  strokeWidth = 2 
}: { 
  name: CustomIconKey;
  size?: number;
  color?: string;
  className?: string;
  strokeWidth?: number;
}) {
  const IconComponent = CustomIcons[name];
  if (!IconComponent) return null;
  return <IconComponent size={size} color={color} className={className} strokeWidth={strokeWidth} />;
}
