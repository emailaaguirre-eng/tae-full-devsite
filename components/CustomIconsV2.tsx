"use client";

/**
 * Custom Icon System V2 - Multiple Style Options
 * Choose the style that best fits your brand
 * © 2026 B&D Servicing LLC. All rights reserved.
 */

import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  strokeWidth?: number;
}

// ============================================================================
// STYLE 1: MINIMALIST & CLEAN (Modern, Professional)
// ============================================================================

export function ArtIconMinimal({ size = 24, color = 'currentColor', className = '', strokeWidth = 1.5 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth={strokeWidth} />
      <rect x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth={strokeWidth} />
      <rect x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth={strokeWidth} />
      <rect x="14" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth={strokeWidth} />
      <circle cx="6.5" cy="6.5" r="1" fill={color} />
      <circle cx="17.5" cy="6.5" r="1" fill={color} />
      <circle cx="6.5" cy="17.5" r="1" fill={color} />
      <circle cx="17.5" cy="17.5" r="1" fill={color} />
    </svg>
  );
}

export function SparkleIconMinimal({ size = 24, color = 'currentColor', className = '', strokeWidth = 1.5 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" 
        stroke={color} strokeWidth={strokeWidth} fill={color} opacity="0.15" />
      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" 
        stroke={color} strokeWidth={strokeWidth} fill="none" />
    </svg>
  );
}

export function SportsIconMinimal({ size = 24, color = 'currentColor', className = '', strokeWidth = 1.5 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <ellipse cx="12" cy="12" rx="9" ry="5" stroke={color} strokeWidth={strokeWidth} />
      <line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth={strokeWidth} />
      <path d="M7 9L5 12L7 15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M17 9L19 12L17 15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function CartIconMinimal({ size = 24, color = 'currentColor', className = '', strokeWidth = 1.5 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="9" cy="21" r="1" fill={color} />
      <circle cx="20" cy="21" r="1" fill={color} />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" 
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ============================================================================
// STYLE 2: BOLD & GEOMETRIC (Strong, Confident)
// ============================================================================

export function ArtIconBold({ size = 24, color = 'currentColor', className = '', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="2" width="9" height="9" rx="1" stroke={color} strokeWidth={strokeWidth} fill={color} opacity="0.1" />
      <rect x="13" y="2" width="9" height="9" rx="1" stroke={color} strokeWidth={strokeWidth} fill={color} opacity="0.1" />
      <rect x="2" y="13" width="9" height="9" rx="1" stroke={color} strokeWidth={strokeWidth} fill={color} opacity="0.1" />
      <rect x="13" y="13" width="9" height="9" rx="1" stroke={color} strokeWidth={strokeWidth} fill={color} opacity="0.1" />
      <circle cx="6.5" cy="6.5" r="1.5" fill={color} />
      <circle cx="17.5" cy="6.5" r="1.5" fill={color} />
      <circle cx="6.5" cy="17.5" r="1.5" fill={color} />
      <circle cx="17.5" cy="17.5" r="1.5" fill={color} />
    </svg>
  );
}

export function SparkleIconBold({ size = 24, color = 'currentColor', className = '', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2L14 10L22 12L14 14L12 22L10 14L2 12L10 10L12 2Z" 
        fill={color} opacity="0.2" />
      <path d="M12 2L14 10L22 12L14 14L12 22L10 14L2 12L10 10L12 2Z" 
        stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
}

export function SportsIconBold({ size = 24, color = 'currentColor', className = '', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <ellipse cx="12" cy="12" rx="10" ry="6" stroke={color} strokeWidth={strokeWidth} fill={color} opacity="0.1" />
      <line x1="2" y1="12" x2="22" y2="12" stroke={color} strokeWidth={strokeWidth} />
      <path d="M6 8L4 12L6 16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill={color} />
      <path d="M18 8L20 12L18 16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill={color} />
    </svg>
  );
}

export function CartIconBold({ size = 24, color = 'currentColor', className = '', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="9" cy="21" r="1.5" fill={color} />
      <circle cx="20" cy="21" r="1.5" fill={color} />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" 
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill={color} opacity="0.1" />
    </svg>
  );
}

// ============================================================================
// STYLE 3: ELEGANT & REFINED (Sophisticated, Premium)
// ============================================================================

export function ArtIconElegant({ size = 24, color = 'currentColor', className = '', strokeWidth = 1 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="3" width="8" height="8" rx="0.5" stroke={color} strokeWidth={strokeWidth} />
      <rect x="13" y="3" width="8" height="8" rx="0.5" stroke={color} strokeWidth={strokeWidth} />
      <rect x="3" y="13" width="8" height="8" rx="0.5" stroke={color} strokeWidth={strokeWidth} />
      <rect x="13" y="13" width="8" height="8" rx="0.5" stroke={color} strokeWidth={strokeWidth} />
      <circle cx="7" cy="7" r="0.8" fill={color} />
      <circle cx="17" cy="7" r="0.8" fill={color} />
      <circle cx="7" cy="17" r="0.8" fill={color} />
      <circle cx="17" cy="17" r="0.8" fill={color} />
    </svg>
  );
}

export function SparkleIconElegant({ size = 24, color = 'currentColor', className = '', strokeWidth = 1 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3L13.2 9L19 10L13.2 11L12 17L10.8 11L5 10L10.8 9L12 3Z" 
        stroke={color} strokeWidth={strokeWidth} fill="none" />
      <circle cx="12" cy="10" r="1" fill={color} opacity="0.3" />
    </svg>
  );
}

export function SportsIconElegant({ size = 24, color = 'currentColor', className = '', strokeWidth = 1 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <ellipse cx="12" cy="12" rx="8.5" ry="4.5" stroke={color} strokeWidth={strokeWidth} />
      <line x1="3.5" y1="12" x2="20.5" y2="12" stroke={color} strokeWidth={strokeWidth} />
      <path d="M6.5 9.5L5 12L6.5 14.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M17.5 9.5L19 12L17.5 14.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function CartIconElegant({ size = 24, color = 'currentColor', className = '', strokeWidth = 1 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="9" cy="21" r="0.8" fill={color} />
      <circle cx="20" cy="21" r="0.8" fill={color} />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" 
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ============================================================================
// STYLE 4: HAND-DRAWN & ARTISTIC (Creative, Unique)
// ============================================================================

export function ArtIconHandDrawn({ size = 24, color = 'currentColor', className = '', strokeWidth = 1.5 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 3h8v8H3z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M13 3h8v8h-8z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M3 13h8v8H3z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M13 13h8v8h-8z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="6.5" cy="6.5" r="1.2" fill={color} />
      <circle cx="17.5" cy="6.5" r="1.2" fill={color} />
      <circle cx="6.5" cy="17.5" r="1.2" fill={color} />
      <circle cx="17.5" cy="17.5" r="1.2" fill={color} />
    </svg>
  );
}

export function SparkleIconHandDrawn({ size = 24, color = 'currentColor', className = '', strokeWidth = 1.5 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2.5L13.3 8.8L19.5 10L13.3 11.2L12 17.5L10.7 11.2L4.5 10L10.7 8.8L12 2.5Z" 
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill={color} opacity="0.15" />
      <path d="M12 2.5L13.3 8.8L19.5 10L13.3 11.2L12 17.5L10.7 11.2L4.5 10L10.7 8.8L12 2.5Z" 
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function SportsIconHandDrawn({ size = 24, color = 'currentColor', className = '', strokeWidth = 1.5 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 12c0-2 2-4 9-4s9 2 9 4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M3 12c0 2 2 4 9 4s9-2 9-4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M6 9L4.5 12L6 15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 9L19.5 12L18 15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CartIconHandDrawn({ size = 24, color = 'currentColor', className = '', strokeWidth = 1.5 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="9" cy="21" r="1.2" fill={color} />
      <circle cx="20" cy="21" r="1.2" fill={color} />
      <path d="M1 1.5h4l2.5 12.5a2 2 0 0 0 2 1.5h9.5a2 2 0 0 0 2-1.5L22.5 6H6" 
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ============================================================================
// EXPORT ALL STYLES FOR COMPARISON
// ============================================================================

export const IconStyles = {
  minimal: {
    art: ArtIconMinimal,
    sparkle: SparkleIconMinimal,
    sports: SportsIconMinimal,
    cart: CartIconMinimal,
  },
  bold: {
    art: ArtIconBold,
    sparkle: SparkleIconBold,
    sports: SportsIconBold,
    cart: CartIconBold,
  },
  elegant: {
    art: ArtIconElegant,
    sparkle: SparkleIconElegant,
    sports: SportsIconElegant,
    cart: CartIconElegant,
  },
  handDrawn: {
    art: ArtIconHandDrawn,
    sparkle: SparkleIconHandDrawn,
    sports: SportsIconHandDrawn,
    cart: CartIconHandDrawn,
  },
} as const;

export type IconStyle = keyof typeof IconStyles;
export type IconName = keyof typeof IconStyles.minimal;
