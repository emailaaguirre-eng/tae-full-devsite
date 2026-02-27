"use client";

import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

// Interlocking Rings - Weddings
export function RingsIcon({ size = 48, color = 'currentColor', strokeWidth = 2, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <circle cx="18" cy="24" r="10" stroke={color} strokeWidth={strokeWidth} fill="none" />
      <circle cx="30" cy="24" r="10" stroke={color} strokeWidth={strokeWidth} fill="none" />
    </svg>
  );
}

// Elegant Heart - Love, anniversaries
export function HeartIcon({ size = 48, color = 'currentColor', strokeWidth = 2, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <path
        d="M24 42C24 42 6 28 6 16C6 10 10 6 16 6C20 6 23 9 24 12C25 9 28 6 32 6C38 6 42 10 42 16C42 28 24 42 24 42Z"
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Floral Wreath - Garden weddings
export function WreathIcon({ size = 48, color = 'currentColor', strokeWidth = 1.5, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <path d="M12 36C12 36 8 28 10 20C12 12 18 8 24 8" stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
      <path d="M8 24C10 22 12 24 12 24" stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
      <path d="M10 28C12 26 14 28 14 28" stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
      <path d="M12 32C14 30 16 32 16 32" stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
      <path d="M36 36C36 36 40 28 38 20C36 12 30 8 24 8" stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
      <path d="M40 24C38 22 36 24 36 24" stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
      <path d="M38 28C36 26 34 28 34 28" stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
      <path d="M36 32C34 30 32 32 32 32" stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
      <ellipse cx="14" cy="16" rx="3" ry="5" transform="rotate(-30 14 16)" stroke={color} strokeWidth={strokeWidth} fill="none" />
      <ellipse cx="34" cy="16" rx="3" ry="5" transform="rotate(30 34 16)" stroke={color} strokeWidth={strokeWidth} fill="none" />
    </svg>
  );
}

// Monogram Frame - Formal events
export function MonogramFrameIcon({ size = 48, color = 'currentColor', strokeWidth = 1.5, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <rect x="8" y="8" width="32" height="32" rx="2" stroke={color} strokeWidth={strokeWidth} fill="none" />
      <rect x="12" y="12" width="24" height="24" rx="1" stroke={color} strokeWidth={strokeWidth * 0.75} fill="none" />
      <path d="M8 8C10 10 10 12 8 14" stroke={color} strokeWidth={strokeWidth * 0.75} fill="none" />
      <path d="M40 8C38 10 38 12 40 14" stroke={color} strokeWidth={strokeWidth * 0.75} fill="none" />
      <path d="M8 40C10 38 10 36 8 34" stroke={color} strokeWidth={strokeWidth * 0.75} fill="none" />
      <path d="M40 40C38 38 38 36 40 34" stroke={color} strokeWidth={strokeWidth * 0.75} fill="none" />
    </svg>
  );
}

// Diamond - Luxury
export function DiamondIcon({ size = 48, color = 'currentColor', strokeWidth = 2, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <path d="M24 6L38 18L24 42L10 18L24 6Z" stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinejoin="round" />
      <path d="M10 18H38" stroke={color} strokeWidth={strokeWidth} fill="none" />
      <path d="M24 6L18 18L24 42L30 18L24 6Z" stroke={color} strokeWidth={strokeWidth * 0.75} fill="none" />
    </svg>
  );
}

// Infinity Symbol - Eternal love
export function InfinityIcon({ size = 48, color = 'currentColor', strokeWidth = 2, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <path
        d="M24 24C24 24 28 16 34 16C40 16 44 20 44 24C44 28 40 32 34 32C28 32 24 24 24 24C24 24 20 16 14 16C8 16 4 20 4 24C4 28 8 32 14 32C20 32 24 24 24 24Z"
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Dove - Peace, weddings
export function DoveIcon({ size = 48, color = 'currentColor', strokeWidth = 2, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <path
        d="M8 28C8 28 12 24 20 24C20 24 16 20 16 14C16 14 24 18 28 24C28 24 36 20 42 22C42 22 38 26 38 30C38 30 42 32 44 36C44 36 36 34 32 36C28 38 22 40 16 38C10 36 8 32 8 28Z"
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="34" cy="26" r="1.5" fill={color} />
    </svg>
  );
}

// Sparkle/Star - Celebration
export function SparkleIcon({ size = 48, color = 'currentColor', strokeWidth = 2, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <path d="M24 4L26 20L42 24L26 28L24 44L22 28L6 24L22 20L24 4Z" stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinejoin="round" />
      <path d="M36 8L37 14L42 16L37 18L36 24L35 18L30 16L35 14L36 8Z" stroke={color} strokeWidth={strokeWidth * 0.75} fill="none" strokeLinejoin="round" />
    </svg>
  );
}

// Rose - Romance
export function RoseIcon({ size = 48, color = 'currentColor', strokeWidth = 1.5, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <ellipse cx="24" cy="18" rx="10" ry="8" stroke={color} strokeWidth={strokeWidth} fill="none" />
      <path d="M18 16C20 14 24 14 26 16" stroke={color} strokeWidth={strokeWidth} fill="none" />
      <path d="M16 20C18 18 24 17 28 18" stroke={color} strokeWidth={strokeWidth} fill="none" />
      <path d="M20 22C22 21 26 21 28 22" stroke={color} strokeWidth={strokeWidth} fill="none" />
      <path d="M24 26L24 42" stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
      <path d="M24 32C20 30 16 32 16 36C20 34 24 32 24 32Z" stroke={color} strokeWidth={strokeWidth} fill="none" />
      <path d="M24 36C28 34 32 36 32 40C28 38 24 36 24 36Z" stroke={color} strokeWidth={strokeWidth} fill="none" />
    </svg>
  );
}

// Bell - Celebrations
export function BellIcon({ size = 48, color = 'currentColor', strokeWidth = 2, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <path d="M24 6C24 6 24 8 24 10C16 10 10 18 10 26L10 34L38 34L38 26C38 18 32 10 24 10C24 8 24 6 24 6Z" stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinejoin="round" />
      <path d="M6 34H42" stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
      <path d="M20 38C20 40 22 42 24 42C26 42 28 40 28 38" stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
      <path d="M20 8C22 10 26 10 28 8" stroke={color} strokeWidth={strokeWidth * 0.75} fill="none" strokeLinecap="round" />
    </svg>
  );
}

// Birthday Present
export function BirthdayPresentIcon({ size = 48, color = 'currentColor', strokeWidth = 2, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <rect x="8" y="18" width="32" height="22" rx="2" stroke={color} strokeWidth={strokeWidth} fill="none" />
      <rect x="6" y="14" width="36" height="6" rx="1.5" stroke={color} strokeWidth={strokeWidth} fill="none" />
      <path d="M24 14V40" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M16 14C14 12 14 9.5 16 8.5C18 7.5 20.5 9 24 14" stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
      <path d="M32 14C34 12 34 9.5 32 8.5C30 7.5 27.5 9 24 14" stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
    </svg>
  );
}

// Birthday Cake
export function BirthdayCakeIcon({ size = 48, color = 'currentColor', strokeWidth = 2, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <rect x="10" y="22" width="28" height="16" rx="2" stroke={color} strokeWidth={strokeWidth} fill="none" />
      <path d="M10 28C12 26 14 26 16 28C18 30 20 30 22 28C24 26 26 26 28 28C30 30 32 30 34 28C36 26 38 26 38 28" stroke={color} strokeWidth={strokeWidth * 0.8} fill="none" strokeLinecap="round" />
      <path d="M24 22V14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M24 12C25.5 10.5 25.5 8.5 24 7C22.5 8.5 22.5 10.5 24 12Z" stroke={color} strokeWidth={strokeWidth * 0.8} fill="none" />
    </svg>
  );
}

// Crown - Royalty
export function CrownIcon({ size = 48, color = 'currentColor', strokeWidth = 2, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <path d="M6 36L10 16L18 24L24 12L30 24L38 16L42 36H6Z" stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinejoin="round" />
      <circle cx="10" cy="14" r="2" stroke={color} strokeWidth={strokeWidth} fill="none" />
      <circle cx="24" cy="10" r="2" stroke={color} strokeWidth={strokeWidth} fill="none" />
      <circle cx="38" cy="14" r="2" stroke={color} strokeWidth={strokeWidth} fill="none" />
    </svg>
  );
}

// Graduation Cap
export function GraduationCapIcon({ size = 48, color = 'currentColor', strokeWidth = 2, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <path d="M4 18L24 10L44 18L24 26L4 18Z" stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinejoin="round" />
      <path d="M12 22V30C12 30 16 34 24 34C32 34 36 30 36 30V22" stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
      <path d="M44 18V28" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <circle cx="44" cy="31.5" r="2.5" fill={color} />
    </svg>
  );
}

// Diploma Scroll
export function DiplomaIcon({ size = 48, color = 'currentColor', strokeWidth = 2, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <path d="M10 16H38V28H10V16Z" stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinejoin="round" />
      <path d="M20 22H28" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M8 22C8 24.2 9.8 26 12 26C14.2 26 16 24.2 16 22C16 19.8 14.2 18 12 18C9.8 18 8 19.8 8 22Z" stroke={color} strokeWidth={strokeWidth} fill="none" />
      <path d="M32 22C32 24.2 33.8 26 36 26C38.2 26 40 24.2 40 22C40 19.8 38.2 18 36 18C33.8 18 32 19.8 32 22Z" stroke={color} strokeWidth={strokeWidth} fill="none" />
      <circle cx="24" cy="35" r="5" stroke={color} strokeWidth={strokeWidth} fill="none" />
      <path d="M24 32.5V37.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M21.5 35H26.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

// Baby Feet - Newborn / baby shower
export function BabyFeetIcon({ size = 48, color = 'currentColor', strokeWidth = 1.8, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <ellipse cx="17" cy="28" rx="4.5" ry="7" transform="rotate(-18 17 28)" stroke={color} strokeWidth={strokeWidth} fill="none" />
      <circle cx="11.5" cy="20.5" r="1.7" stroke={color} strokeWidth={strokeWidth} fill="none" />
      <circle cx="13.7" cy="17.5" r="1.5" stroke={color} strokeWidth={strokeWidth} fill="none" />
      <circle cx="16.6" cy="15.5" r="1.35" stroke={color} strokeWidth={strokeWidth} fill="none" />
      <circle cx="20" cy="15.2" r="1.2" stroke={color} strokeWidth={strokeWidth} fill="none" />

      <ellipse cx="31" cy="30" rx="4.5" ry="7" transform="rotate(18 31 30)" stroke={color} strokeWidth={strokeWidth} fill="none" />
      <circle cx="36.6" cy="22.8" r="1.7" stroke={color} strokeWidth={strokeWidth} fill="none" />
      <circle cx="34.3" cy="19.8" r="1.5" stroke={color} strokeWidth={strokeWidth} fill="none" />
      <circle cx="31.5" cy="17.9" r="1.35" stroke={color} strokeWidth={strokeWidth} fill="none" />
      <circle cx="28.1" cy="17.5" r="1.2" stroke={color} strokeWidth={strokeWidth} fill="none" />
    </svg>
  );
}

// Paw Prints - Pet memories
export function PawPrintsIcon({ size = 48, color = 'currentColor', strokeWidth = 1.8, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <ellipse cx="18" cy="28" rx="4.8" ry="4.1" stroke={color} strokeWidth={strokeWidth} fill="none" />
      <ellipse cx="12.8" cy="22.4" rx="1.8" ry="2.4" transform="rotate(-15 12.8 22.4)" stroke={color} strokeWidth={strokeWidth} fill="none" />
      <ellipse cx="16.6" cy="19.8" rx="1.8" ry="2.5" transform="rotate(-4 16.6 19.8)" stroke={color} strokeWidth={strokeWidth} fill="none" />
      <ellipse cx="20.8" cy="19.9" rx="1.8" ry="2.5" transform="rotate(8 20.8 19.9)" stroke={color} strokeWidth={strokeWidth} fill="none" />
      <ellipse cx="24.7" cy="22.7" rx="1.8" ry="2.4" transform="rotate(20 24.7 22.7)" stroke={color} strokeWidth={strokeWidth} fill="none" />

      <ellipse cx="31.2" cy="35.2" rx="4.3" ry="3.7" stroke={color} strokeWidth={strokeWidth} fill="none" />
      <ellipse cx="27" cy="30.5" rx="1.5" ry="2.1" transform="rotate(-18 27 30.5)" stroke={color} strokeWidth={strokeWidth} fill="none" />
      <ellipse cx="30" cy="28.6" rx="1.5" ry="2.1" transform="rotate(-6 30 28.6)" stroke={color} strokeWidth={strokeWidth} fill="none" />
      <ellipse cx="33.3" cy="28.7" rx="1.5" ry="2.1" transform="rotate(8 33.3 28.7)" stroke={color} strokeWidth={strokeWidth} fill="none" />
      <ellipse cx="36.2" cy="30.9" rx="1.5" ry="2.1" transform="rotate(18 36.2 30.9)" stroke={color} strokeWidth={strokeWidth} fill="none" />
    </svg>
  );
}

// Icon Registry
export const ELEGANT_ICONS = {
  rings: { component: RingsIcon, label: 'Rings', category: 'wedding' },
  heart: { component: HeartIcon, label: 'Heart', category: 'love' },
  wreath: { component: WreathIcon, label: 'Wreath', category: 'botanical' },
  monogram: { component: MonogramFrameIcon, label: 'Monogram', category: 'formal' },
  diamond: { component: DiamondIcon, label: 'Diamond', category: 'luxury' },
  infinity: { component: InfinityIcon, label: 'Infinity', category: 'love' },
  dove: { component: DoveIcon, label: 'Dove', category: 'wedding' },
  sparkle: { component: SparkleIcon, label: 'Sparkle', category: 'celebration' },
  rose: { component: RoseIcon, label: 'Rose', category: 'botanical' },
  bell: { component: BellIcon, label: 'Bell', category: 'celebration' },
  birthday_present: { component: BirthdayPresentIcon, label: 'Birthday Present', category: 'celebration' },
  birthday_cake: { component: BirthdayCakeIcon, label: 'Birthday Cake', category: 'celebration' },
  crown: { component: CrownIcon, label: 'Crown', category: 'luxury' },
  graduation_cap: { component: GraduationCapIcon, label: 'Graduation Cap', category: 'graduation' },
  diploma: { component: DiplomaIcon, label: 'Diploma', category: 'graduation' },
  baby_feet: { component: BabyFeetIcon, label: 'Baby Feet', category: 'celebration' },
  paw_prints: { component: PawPrintsIcon, label: 'Paw Prints', category: 'celebration' },
  none: { component: () => null, label: 'None', category: 'none' },
} as const;

export type ElegantIconKey = keyof typeof ELEGANT_ICONS;

// Render icon by key
export function ElegantIcon({ 
  icon, 
  size = 48, 
  color = 'currentColor',
  strokeWidth = 2,
  className = '' 
}: { 
  icon: ElegantIconKey;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}) {
  const iconData = ELEGANT_ICONS[icon];
  if (!iconData || icon === 'none') return null;
  
  const IconComponent = iconData.component;
  return <IconComponent size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}
